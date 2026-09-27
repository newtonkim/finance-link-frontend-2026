<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import {
  Drawer,
  Modal,
  MultiSearchableSelect,
  StatusButtonsHorizontal,
  formatCurrency,
} from '@/Global'
import Button from '@/Global/ui/button/Button.vue'
import { notify } from '@/Global/Toasters'
import { Trash2, Send, ClipboardCheck, FileText, Repeat } from 'lucide-vue-next'
import { loanApplicationsApi, loanApplicationsApi2 } from '@/tenant/apis/loans'
import type {
  GuarantorSummary,
  LoanApplicationGuarantor,
} from '@/tenant/apis/loans/loanApplicationsApi'
import GuatorsListWithType from './GuatorsListWithType.vue'
import NewNoneMember from './NewNoneMember.vue'

const { saveLoanApplicationNoneMemberGuarantors } = loanApplicationsApi2()
const props = defineProps<{
  application: any
  editable?: boolean
}>()
const emit = defineEmits<{
  updated: [value?: any]
}>()

const statusFilter = ref<string>('Group')
const guarantors = ref<Record<string, any>>({})
const selected = ref<any[]>([])
const memberSelected = ref<any[]>([])
const form = ref({})
const saving = ref(false)
const removingId = ref<number | null>(null)

// Current guarantors and the adequacy summary both come from the server, which
// applies the SACCO's guarantor settings; nothing here re-implements those rules.
const current = ref<LoanApplicationGuarantor[]>([])
const summary = ref<GuarantorSummary | null>(null)

const filters = computed(() =>
  summary.value?.rules.members_only
    ? ['Group', 'Individual']
    : ['Group', 'Individual', 'n-members'],
)

async function loadGuarantors() {
  if (!props.application?.id) return
  try {
    const res = await loanApplicationsApi.listGuarantors(props.application.id)
    current.value = res.data?.data ?? []
    summary.value = res.data?.summary ?? null
  } catch {
    notify({ type: 'error', msg: 'Could not load the guarantors for this application.' })
  }
}

onMounted(loadGuarantors)
watch(() => props.application?.id, loadGuarantors)

function errorMessage(err: unknown, fallback: string): string {
  const data = (
    err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
  )?.response?.data
  const messages = Object.values(data?.errors ?? {}).flat()
  if (messages.length) return messages.join(' ')
  return data?.message ?? fallback
}

function handleSelected(item: any) {
  const type = statusFilter.value === 'Group' ? 'group' : 'individual'
  for (const i of item) {
    guarantors.value[`${i.id}-${type}`] = {
      ...i,
      type,
    }
  }
}
const filteredGuarantors = computed(() => Object.values(guarantors.value))

watch(statusFilter, (val) => {
  if (val === 'Group') {
    selected.value = []
  } else {
    memberSelected.value = []
  }
})

async function saveLoanGuarantors() {
  saving.value = true
  try {
    await loanApplicationsApi.saveGuarantors(props.application.id, filteredGuarantors.value)
    notify({ type: 'success', msg: 'Guarantors saved.' })
    guarantors.value = {}
    selected.value = []
    memberSelected.value = []
    await loadGuarantors()
    emit('updated', 1)
  } catch (err) {
    notify({ type: 'error', msg: errorMessage(err, 'Could not save the guarantors.') })
  } finally {
    saving.value = false
  }
}

async function saveLoanGuarantorsNoneMember() {
  await saveLoanApplicationNoneMemberGuarantors(form.value)
  statusFilter.value = 'Group'
  await loadGuarantors()
  emit('updated', 1)
}

async function removeGuarantor(guarantor: LoanApplicationGuarantor) {
  removingId.value = guarantor.id
  try {
    const res = await loanApplicationsApi.removeGuarantor(props.application.id, guarantor.id)
    summary.value = res.data?.summary ?? summary.value
    current.value = current.value.filter((g) => g.id !== guarantor.id)
    emit('updated', 1)
  } catch (err) {
    notify({ type: 'error', msg: errorMessage(err, 'Could not remove the guarantor.') })
  } finally {
    removingId.value = null
  }
}

// ─── Consent ────────────────────────────────────────────────────────────────
const consentRequired = computed(() => summary.value?.rules.consent_required ?? false)
const sendingId = ref<number | null>(null)
const recording = ref<LoanApplicationGuarantor | null>(null)
const recordOpen = ref(false)
const recordForm = ref<{
  decision: 'accepted' | 'declined'
  reason: string
  document: File | null
}>({
  decision: 'accepted',
  reason: '',
  document: null,
})

const statusLabels: Record<LoanApplicationGuarantor['status'], string> = {
  proposed: 'Not asked yet',
  requested: 'Waiting for answer',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Request expired',
  withdrawn: 'Removed',
  locked: 'Holding savings',
  released: 'Released',
  invoked: 'Drawn on',
}

const statusClasses: Record<LoanApplicationGuarantor['status'], string> = {
  proposed: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  requested: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  declined: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  expired: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  withdrawn: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  locked: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  released: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  invoked: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

function canSendRequest(g: LoanApplicationGuarantor) {
  return (
    consentRequired.value && ['proposed', 'requested', 'expired', 'declined'].includes(g.status)
  )
}

function canRecordAnswer(g: LoanApplicationGuarantor) {
  return ['proposed', 'requested', 'expired'].includes(g.status)
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''
}

function replaceGuarantor(updated: LoanApplicationGuarantor) {
  current.value = current.value.map((g) => (g.id === updated.id ? updated : g))
}

async function sendRequest(g: LoanApplicationGuarantor) {
  sendingId.value = g.id
  try {
    const res = await loanApplicationsApi.requestGuarantorConsent(props.application.id, g.id)
    replaceGuarantor(res.data.data)
    summary.value = res.data.summary
    notify({ type: 'success', msg: `Request sent to ${g.name ?? 'the guarantor'}.` })
  } catch (err) {
    notify({ type: 'error', msg: errorMessage(err, 'Could not send the request.') })
  } finally {
    sendingId.value = null
  }
}

function openRecordAnswer(g: LoanApplicationGuarantor) {
  recording.value = g
  recordForm.value = { decision: 'accepted', reason: '', document: null }
  recordOpen.value = true
}

function onDocumentPicked(event: Event) {
  recordForm.value.document = (event.target as HTMLInputElement).files?.[0] ?? null
}

async function saveRecordedAnswer() {
  const g = recording.value
  if (!g) return
  if (recordForm.value.decision === 'declined' && !recordForm.value.reason.trim()) {
    notify({ type: 'error', msg: 'Give the reason the guarantor declined.' })
    // The modal closes itself on submit; reopen it so the answer is not lost.
    await nextTick()
    recordOpen.value = true
    return
  }
  try {
    const res = await loanApplicationsApi.recordGuarantorConsent(props.application.id, g.id, {
      decision: recordForm.value.decision,
      reason: recordForm.value.reason.trim() || undefined,
      document: recordForm.value.document,
    })
    replaceGuarantor(res.data.data)
    summary.value = res.data.summary
    notify({
      type: 'success',
      msg: res.data.data.status === 'accepted' ? 'Recorded as accepted.' : 'Recorded as declined.',
    })
    // Enough acceptances move a waiting application on, so the page needs to reload.
    if (res.data.application_status !== props.application.status) emit('updated', 1)
  } catch (err) {
    notify({ type: 'error', msg: errorMessage(err, 'Could not record the answer.') })
  } finally {
    recording.value = null
  }
}

// ─── Replacing a guarantor on a running loan ────────────────────────────────
const replaceOpen = ref(false)
const replacing = ref<LoanApplicationGuarantor | null>(null)
type PickedMember = { member_id: number; account_id?: number; name: string }
const replacementSelected = ref<(string | number)[]>([])
const replacement = ref<{ member_id: number; account_id?: number; name: string } | null>(null)
const replacementAmount = ref('')

function openReplace(g: LoanApplicationGuarantor) {
  replacing.value = g
  replacementSelected.value = []
  replacement.value = null
  replacementAmount.value = String(g.guarantee_amount)
  replaceOpen.value = true
}

function pickReplacement(items: PickedMember[]) {
  const picked = items[items.length - 1]
  replacement.value = picked
    ? { member_id: picked.member_id, account_id: picked.account_id, name: picked.name }
    : null
}

async function saveReplace() {
  const g = replacing.value
  const amount = Number(replacementAmount.value.replace(/,/g, ''))
  if (!g || !replacement.value) {
    notify({ type: 'error', msg: 'Pick the new guarantor.' })
    await nextTick()
    replaceOpen.value = true
    return
  }
  try {
    const res = await loanApplicationsApi.substituteGuarantor(g.id, {
      guarantor_type: 'individual',
      guarantor_id: replacement.value.member_id,
      guarantor_account_id: replacement.value.account_id ?? null,
      guarantee_amount: amount > 0 ? amount : undefined,
    })
    notify({ type: 'success', msg: res.data.message })
    await loadGuarantors()
    emit('updated', 1)
  } catch (err) {
    notify({ type: 'error', msg: errorMessage(err, 'Could not replace the guarantor.') })
  }
}

function SetGuarantorContribution(item: any) {
  guarantors.value[item.id] = item
}

const coveragePercent = computed(() => {
  const s = summary.value
  if (!s || !s.required_coverage_amount) return null
  return Math.min(100, Math.round((s.covered_amount / s.required_coverage_amount) * 100))
})
</script>
<template>
  <div
    class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
  >
    <!-- Header -->
    <div class="mb-5 flex items-center justify-between">
      <div>
        <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-white">Guarantors</h3>
        <p class="mt-1 text-xs text-neutral-400">
          Groups and individuals standing behind this loan
        </p>
      </div>
    </div>

    <!-- Adequacy summary -->
    <div
      v-if="summary"
      class="mb-5 space-y-2 rounded-xl border px-4 py-3 text-xs"
      :class="
        summary.adequate
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
      "
    >
      <div class="flex items-center justify-between font-medium">
        <span v-if="summary.rules.required">
          {{ summary.guarantor_count }} of {{ summary.rules.minimum }} required guarantor(s)
          <span v-if="summary.rules.maximum">· max {{ summary.rules.maximum }}</span>
        </span>
        <span v-else>Guarantors are optional for this loan</span>
        <span>{{ summary.adequate ? 'Ready to submit' : 'Not enough yet' }}</span>
      </div>
      <p v-if="consentRequired">
        Guarantors must accept before they count.
        <span v-if="summary.pending_count">{{ summary.pending_count }} waiting for an answer.</span>
      </p>
      <div v-if="coveragePercent !== null && summary.rules.required">
        <div class="mb-1 flex justify-between">
          <span>Coverage (pledges + borrower's free savings)</span>
          <span
            >{{ formatCurrency(summary.covered_amount) }} /
            {{ formatCurrency(summary.required_coverage_amount) }}</span
          >
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/70 dark:bg-neutral-800">
          <div
            class="h-full rounded-full"
            :class="summary.coverage_met ? 'bg-emerald-500' : 'bg-amber-500'"
            :style="{ width: coveragePercent + '%' }"
          />
        </div>
      </div>
      <ul v-if="summary.problems.length" class="list-disc pl-4">
        <li v-for="problem in summary.problems" :key="problem">{{ problem }}</li>
      </ul>
    </div>

    <template v-if="editable !== false">
      <!-- Toggle -->
      <StatusButtonsHorizontal :filters="filters" v-model="statusFilter" />
      <!-- Select Area -->
      <div class="mt-5 space-y-3">
        <MultiSearchableSelect
          v-if="statusFilter === 'Group'"
          v-model="selected"
          :url="
            application?.group_memberships === 'allowed_to_be_guaranteed_by_other_groups'
              ? 'group-account-savings/groups-drop-down-list'
              : undefined
          "
          :options="
            application?.group_memberships !== 'allowed_to_be_guaranteed_by_other_groups'
              ? application?.group_memberships
              : undefined
          "
          placeholder="Select groups"
          @update:itemSelected="handleSelected"
        >
          <template #option="{ item }">
            <div class="overflow-auto">
              <table
                class="min-w-full text-sm text-left border border-neutral-200 rounded-lg overflow-hidden"
              >
                <tbody>
                  <tr class="border-b border-neutral-200">
                    <td class="px-3 text-xs uppercase text-neutral-500 tracking-wide w-32">Name</td>
                    <td class="px-3 font-medium text-neutral-500">
                      {{ item.name || '—' }}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" class="px-3 py-2 font-medium text-neutral-500 text-sm">
                      ACC: {{ item.account_code || '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </MultiSearchableSelect>

        <MultiSearchableSelect
          v-else
          v-model="memberSelected"
          :options="[]"
          url="global/member-dropdown-list-total-balance-accouts"
          placeholder="Select members"
          @update:itemSelected="handleSelected"
        >
          <template #option="{ item }">
            <div class="overflow-auto">
              <table
                class="min-w-full text-sm text-left border border-neutral-200 rounded-lg overflow-hidden"
              >
                <tbody>
                  <tr class="border-b border-neutral-200">
                    <td class="px-3 text-xs uppercase text-neutral-500 tracking-wide w-32">Name</td>
                    <td class="px-3 font-medium text-neutral-500">
                      {{ item.name || '—' }}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" class="px-3 py-2 font-medium text-neutral-500 text-sm">
                      ACC: {{ item.account_code || '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </MultiSearchableSelect>
      </div>

      <!-- Selected Guarantors -->
      <div v-if="filteredGuarantors.length" class="mt-6">
        <div class="flex flex-col justify-between mb-2">
          <GuatorsListWithType
            @action="SetGuarantorContribution"
            title="Selected Guarantors"
            :items="filteredGuarantors"
            empty-text="No guarantors added yet"
            label-key="name"
            type-key="type"
          />
          <p class="mt-2 text-[10px] text-neutral-400">
            Click a guarantor to set the amount they are pledging.
          </p>
          <br />

          <Button
            type="button"
            :disabled="saving"
            @click="saveLoanGuarantors"
            class="px-3 py-1 text-xs font-medium bg-[#052659]-600 text-white rounded-md hover:bg-[#052659]/90 active:scale-95 transition"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </Button>
        </div>
      </div>

      <div v-else class="mt-4 text-xs text-neutral-400 italic">No guarantors selected</div>

      <!-- Divider -->
      <div class="my-6 border-t border-neutral-200 dark:border-neutral-800"></div>
    </template>

    <!-- Current Guarantors -->
    <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
      Current Guarantors
    </h4>
    <ul v-if="current.length" class="space-y-2">
      <li
        v-for="g in current"
        :key="g.id"
        class="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-2 dark:border-neutral-800"
      >
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="truncate text-[12px] font-semibold text-neutral-800 dark:text-neutral-100">{{
            g.name ?? '—'
          }}</span>
          <span class="text-[10px] capitalize text-neutral-400">{{ g.guarantor_type }}</span>
          <span class="flex flex-wrap items-center gap-1 text-[10px]">
            <span class="rounded-full px-2 py-0.5 font-medium" :class="statusClasses[g.status]">
              {{ statusLabels[g.status] }}
            </span>
            <span v-if="g.status === 'locked' && g.locked_at" class="text-neutral-400">
              since {{ formatDate(g.locked_at) }}
            </span>
            <span v-if="g.status === 'locked' && g.arrears_notified_at" class="text-orange-600">
              · warned of arrears {{ formatDate(g.arrears_notified_at) }}
            </span>
            <span v-if="g.status === 'released' && g.released_at" class="text-neutral-400">
              {{ formatDate(g.released_at)
              }}{{ g.release_reason === 'loan_closed' ? ' · loan closed' : '' }}
            </span>
            <span v-if="g.status === 'requested' && g.consent_expires_at" class="text-neutral-400">
              by {{ formatDate(g.consent_expires_at) }}
            </span>
            <span v-if="g.responded_at" class="text-neutral-400">
              {{ formatDate(g.responded_at)
              }}{{ g.response_channel === 'officer' ? ' · recorded by staff' : '' }}
            </span>
            <a
              v-if="g.consent_document_url"
              :href="g.consent_document_url"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-0.5 text-nfuko-action hover:underline"
            >
              <FileText class="h-3 w-3" /> Signed form
            </a>
          </span>
          <span v-if="g.substitutes_id && g.status !== 'locked'" class="text-[10px] text-blue-600">
            Replacement, waiting to take over
          </span>
          <span
            v-if="g.status === 'locked' && g.release_requested_at"
            class="text-[10px] text-orange-600"
          >
            Asked to be replaced{{
              g.release_request_reason ? `: “${g.release_request_reason}”` : ''
            }}
          </span>
          <span
            v-if="g.status === 'declined' && g.decline_reason"
            class="text-[10px] italic text-red-500"
          >
            “{{ g.decline_reason }}”
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[11px] font-semibold text-nfuko-action">{{
            g.guarantee_amount_formatted
          }}</span>
          <button
            v-if="g.status === 'locked'"
            type="button"
            class="text-neutral-400 transition hover:text-nfuko-action"
            :title="`Replace ${g.name ?? 'guarantor'}`"
            @click="openReplace(g)"
          >
            <Repeat class="h-4 w-4" />
          </button>
          <!-- A replacement on a running loan is asked and answered like any other. -->
          <template v-if="editable !== false || g.substitutes_id">
            <button
              v-if="canSendRequest(g)"
              type="button"
              :disabled="sendingId === g.id"
              class="text-neutral-400 transition hover:text-nfuko-action disabled:opacity-50"
              :title="g.status === 'proposed' ? 'Ask to accept' : 'Send the request again'"
              @click="sendRequest(g)"
            >
              <Send class="h-4 w-4" />
            </button>
            <button
              v-if="canRecordAnswer(g)"
              type="button"
              class="text-neutral-400 transition hover:text-emerald-600"
              title="Record the guarantor's answer"
              @click="openRecordAnswer(g)"
            >
              <ClipboardCheck class="h-4 w-4" />
            </button>
            <button
              v-if="editable !== false"
              type="button"
              :disabled="removingId === g.id"
              class="text-neutral-400 transition hover:text-red-500 disabled:opacity-50"
              :title="`Remove ${g.name ?? 'guarantor'}`"
              @click="removeGuarantor(g)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </template>
        </div>
      </li>
    </ul>
    <div v-else class="text-xs italic text-neutral-400">No guarantors added yet</div>
  </div>

  <Modal
    v-model="replaceOpen"
    :title="`Replace ${replacing?.name ?? 'guarantor'}`"
    action-text="Replace"
    @submit="saveReplace"
  >
    <template #body>
      <div class="space-y-4 text-sm">
        <p class="text-xs text-neutral-500">
          The new guarantor must guarantee at least what is still at stake.
          <template v-if="consentRequired">
            They are asked to accept first; {{ replacing?.name ?? 'the current guarantor' }} stays
            until they do.
          </template>
        </p>
        <MultiSearchableSelect
          v-model="replacementSelected"
          :options="[]"
          url="global/member-dropdown-list-total-balance-accouts"
          placeholder="Select the new guarantor"
          @update:itemSelected="pickReplacement"
        />
        <p v-if="replacement" class="text-xs">
          New guarantor: <strong>{{ replacement.name }}</strong>
        </p>
        <div>
          <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >Amount to guarantee</label
          >
          <input
            v-model="replacementAmount"
            inputmode="decimal"
            class="mt-1 w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-2 dark:border-neutral-700"
          />
        </div>
      </div>
    </template>
  </Modal>

  <Modal
    v-model="recordOpen"
    :title="`Answer from ${recording?.name ?? 'guarantor'}`"
    action-text="Save answer"
    @submit="saveRecordedAnswer"
  >
    <template #body>
      <div class="space-y-4 text-sm">
        <p class="text-xs text-neutral-500">
          Use this when the guarantor answered in person or on a signed form, rather than through
          the member portal.
        </p>
        <div class="flex gap-4">
          <label class="flex items-center gap-2">
            <input v-model="recordForm.decision" type="radio" value="accepted" /> Accepted
          </label>
          <label class="flex items-center gap-2">
            <input v-model="recordForm.decision" type="radio" value="declined" /> Declined
          </label>
        </div>
        <div v-if="recordForm.decision === 'declined'" class="space-y-1">
          <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Reason</label>
          <textarea
            v-model="recordForm.reason"
            rows="2"
            maxlength="500"
            class="w-full rounded-xl border border-neutral-200 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Signed form (optional, PDF or image)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            class="block w-full text-xs"
            @change="onDocumentPicked"
          />
        </div>
      </div>
    </template>
  </Modal>

  <Drawer
    :open="statusFilter === 'n-members'"
    :showFooter="true"
    title="Add Guarantor"
    @cancel="
      () => {
        statusFilter = 'Group'
      }
    "
    @save="saveLoanGuarantorsNoneMember"
  >
    <template #body>
      <NewNoneMember :data="application" v-model:form="form" />
    </template>
  </Drawer>
</template>
