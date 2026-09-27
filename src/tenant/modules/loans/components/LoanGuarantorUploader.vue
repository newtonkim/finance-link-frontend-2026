<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Drawer, MultiSearchableSelect, StatusButtonsHorizontal, formatCurrency } from '@/Global'
import Button from '@/Global/ui/button/Button.vue'
import { notify } from '@/Global/Toasters'
import { Trash2 } from 'lucide-vue-next'
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
        <div class="flex min-w-0 flex-col">
          <span class="truncate text-[12px] font-semibold text-neutral-800 dark:text-neutral-100">{{
            g.name ?? '—'
          }}</span>
          <span class="text-[10px] capitalize text-neutral-400"
            >{{ g.guarantor_type }} · {{ g.status }}</span
          >
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[11px] font-semibold text-nfuko-action">{{
            g.guarantee_amount_formatted
          }}</span>
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
        </div>
      </li>
    </ul>
    <div v-else class="text-xs italic text-neutral-400">No guarantors added yet</div>
  </div>

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
