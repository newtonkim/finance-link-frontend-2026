<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Drawer, Spinner, formatMoneyValue } from '@/Global'
import { notify } from '@/Global/Toasters'
import { loanApplicationsApi } from '@/tenant/apis/loans'
import type { GuarantorRecoveryPlan } from '@/tenant/apis/loans/loanApplicationsApi'

// Proposes recovering a defaulted loan from the borrower's savings and then its
// guarantors'. The server works out who pays what; a second staff member approves it
// on the Guarantor Recoveries page before any money moves.
const props = defineProps<{ loanId: number | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ proposed: [] }>()

const plan = ref<GuarantorRecoveryPlan | null>(null)
const loading = ref(false)
const saving = ref(false)
const amount = ref<string>('')
const notes = ref('')

async function loadPlan() {
  if (!props.loanId) return
  loading.value = true
  try {
    const value = Number(amount.value.replace(/,/g, ''))
    const res = await loanApplicationsApi.guarantorRecoveryPlan(
      props.loanId,
      value > 0 ? value : undefined,
    )
    plan.value = res.data.data
    if (!amount.value) amount.value = String(plan.value.requested_amount)
  } catch {
    notify({ type: 'error', msg: 'Could not work out the recovery.' })
  } finally {
    loading.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    amount.value = ''
    notes.value = ''
    plan.value = null
    loadPlan()
  }
})

const borrowerLines = computed(() => plan.value?.lines.filter((l) => l.source === 'borrower') ?? [])
const guarantorLines = computed(
  () => plan.value?.lines.filter((l) => l.source === 'guarantor') ?? [],
)
const lineGroups = computed(() => [
  { title: "From the borrower's savings", lines: borrowerLines.value },
  { title: "From guarantors' savings", lines: guarantorLines.value },
])

async function propose() {
  if (!props.loanId || !plan.value?.eligible) return
  saving.value = true
  try {
    const value = Number(amount.value.replace(/,/g, ''))
    const res = await loanApplicationsApi.proposeGuarantorRecovery(props.loanId, {
      amount: value > 0 ? value : undefined,
      notes: notes.value.trim() || undefined,
    })
    notify({ type: 'success', msg: res.data.message })
    open.value = false
    emit('proposed')
  } catch (err) {
    const data = (
      err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
    )?.response?.data
    const messages = Object.values(data?.errors ?? {}).flat()
    notify({
      type: 'error',
      msg: messages.join(' ') || data?.message || 'Could not propose the recovery.',
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Drawer
    v-model:open="open"
    title="Recover from guarantors"
    width="w-full sm:max-w-[640px]"
    save-button-text="Propose"
    save-loading-text="Proposing…"
    :loading="saving"
    :save-disabled="!plan?.eligible || loading"
    save-disabled-title="This loan cannot be recovered yet"
    @save="propose"
  >
    <template #body>
      <div class="space-y-5 text-sm">
        <p class="text-xs text-neutral-500">
          Takes the borrower's free savings first, then shares the rest among the guarantors in
          proportion to what each guaranteed. Nothing moves until another staff member approves it.
          What the guarantors pay becomes a recovery loan the borrower repays them.
        </p>

        <div class="flex items-end gap-3">
          <div class="flex-1">
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >Amount to recover</label
            >
            <input
              v-model="amount"
              inputmode="decimal"
              class="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
            <p v-if="plan" class="mt-1 text-[11px] text-neutral-400">
              Outstanding: {{ formatMoneyValue(plan.outstanding_balance) }} ·
              {{ plan.days_past_due }} days overdue
            </p>
          </div>
          <button
            type="button"
            class="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            :disabled="loading"
            @click="loadPlan"
          >
            Recalculate
          </button>
        </div>

        <div v-if="loading" class="flex justify-center py-8"><Spinner /></div>

        <template v-else-if="plan">
          <ul
            v-if="plan.reasons.length"
            class="list-disc space-y-1 rounded-xl border border-amber-200 bg-amber-50 py-3 pl-8 pr-4 text-xs text-amber-800"
          >
            <li v-for="reason in plan.reasons" :key="reason">{{ reason }}</li>
          </ul>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
              <div class="text-[11px] uppercase text-neutral-500">Borrower</div>
              <div class="font-semibold">{{ formatMoneyValue(plan.borrower_amount) }}</div>
            </div>
            <div class="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
              <div class="text-[11px] uppercase text-neutral-500">Guarantors</div>
              <div class="font-semibold">{{ formatMoneyValue(plan.guarantor_amount) }}</div>
            </div>
            <div
              class="rounded-xl p-3"
              :class="
                plan.shortfall > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
              "
            >
              <div class="text-[11px] uppercase">Still unpaid</div>
              <div class="font-semibold">{{ formatMoneyValue(plan.shortfall) }}</div>
            </div>
          </div>

          <div v-for="group in lineGroups" :key="group.title">
            <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {{ group.title }}
            </h4>
            <ul
              v-if="group.lines.length"
              class="divide-y divide-neutral-100 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800"
            >
              <li
                v-for="line in group.lines"
                :key="line.savings_account_id"
                class="flex justify-between px-3 py-2"
              >
                <span>
                  <span class="font-medium">{{ line.name ?? '—' }}</span>
                  <span class="text-xs text-neutral-400"> · {{ line.account_no }}</span>
                </span>
                <span class="font-semibold">{{ formatMoneyValue(line.amount) }}</span>
              </li>
            </ul>
            <p v-else class="text-xs italic text-neutral-400">None</p>
          </div>

          <div
            v-if="plan.unsupported_guarantors.length"
            class="rounded-xl border border-neutral-200 p-3 text-xs dark:border-neutral-800"
          >
            <p class="mb-1 font-semibold">Not recovered here</p>
            <p
              v-for="g in plan.unsupported_guarantors"
              :key="g.loan_application_guarantor_id"
              class="text-neutral-500"
            >
              {{ g.name }} ({{ formatMoneyValue(g.guarantee_amount) }}): {{ g.reason }}
            </p>
          </div>

          <p v-if="plan.guarantor_amount > 0" class="text-xs text-neutral-500">
            The borrower will owe the guarantors {{ formatMoneyValue(plan.guarantor_amount) }},
            repaid over {{ plan.recovery_loan_term_months }} months.
          </p>

          <div>
            <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400"
              >Notes for the approver</label
            >
            <textarea
              v-model="notes"
              rows="2"
              maxlength="1000"
              class="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </template>
      </div>
    </template>
  </Drawer>
</template>
