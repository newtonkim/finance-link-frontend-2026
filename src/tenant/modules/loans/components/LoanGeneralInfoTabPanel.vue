<script setup lang="ts">
import { History, Printer, FileDown, Edit2, Check, X, Loader2 } from 'lucide-vue-next'
import { ref, reactive } from 'vue'
import { toast } from 'vue-sonner'
import type { LoanDetail, RescheduleHistoryEntry } from '@/tenant/apis/loans/loansApi'
import { loansApi } from '@/tenant/apis/loans/loansApi'
import { loanStatusLabel } from '../utils/loanStatus'
import { licenseState } from '@/tenant/apis/licenseState'

const props = defineProps<{
  loan: LoanDetail
  latestReschedule: RescheduleHistoryEntry | null
  oldStatusLabel: string | null
  oldStatusClass: string
  principalDisplay: string
  netDisbursedDisplay: string
  outstandingDisplay: string
  interestMethodLabel: string
  currency: string
  fmt: (v: number | string | null | undefined) => string
  fmtDate: (d: string | null | undefined) => string
  toNumber: (v: number | string | null | undefined) => number | null
  generalStatusColor: (status: string) => string
  printGeneralInfo: () => void
  exportGeneralInfoPdf: () => void
  refresh: () => void
}>()

const isEditingDates = ref(false)
const saving = ref(false)
const tempDates = reactive({
  disbursed_at: props.loan.disbursed_at ? props.loan.disbursed_at.split('T')[0] : '',
  schedule_date: props.loan.schedule_date ? props.loan.schedule_date.split('T')[0] : '',
})

const startEditing = () => {
  if (licenseState.readOnly) return
  tempDates.disbursed_at = props.loan.disbursed_at ? props.loan.disbursed_at.split('T')[0] : ''
  tempDates.schedule_date = props.loan.schedule_date ? props.loan.schedule_date.split('T')[0] : ''
  isEditingDates.value = true
}

const cancelEditing = () => {
  isEditingDates.value = false
}

const saveDates = async () => {
  if (licenseState.readOnly) return
  if (!tempDates.disbursed_at || !tempDates.schedule_date) {
    toast.error('Both dates are required.')
    return
  }

  saving.value = true
  try {
    const res = await loansApi.updateDates(props.loan.id, {
      disbursed_at: tempDates.disbursed_at,
      schedule_date: tempDates.schedule_date,
    })
    toast.success(res.data.message || 'Loan dates updated successfully.')
    isEditingDates.value = false
    props.refresh()

    // Update the local loan object by reference (or trigger a refresh from parent)
    // For simplicity here, we update the prop properties if writable, or just rely on the parent refresh.
    // However, Vue props are read-only. The best practice is to emit an event.
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    const msg = err?.response?.data?.message || 'Failed to update loan dates.'
    toast.error(msg)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Action bar -->
    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        @click="printGeneralInfo"
      >
        <Printer class="h-3.5 w-3.5" />
        Print
      </button>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg bg-nfuko-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-nfuko-primary/90 transition-colors"
        @click="exportGeneralInfoPdf"
      >
        <FileDown class="h-3.5 w-3.5" />
        PDF
      </button>
    </div>
    <div class="grid gap-6 lg:grid-cols-2 items-start">
      <!-- ── LEFT COLUMN ── -->
      <div class="space-y-6">
        <!-- Current Loan Details -->
        <div
          class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 flex items-center justify-between">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              Current Loan Details
            </h3>
            <div v-if="!isEditingDates">
              <button
                type="button"
                :disabled="licenseState.readOnly"
                :title="licenseState.readOnly ? 'License expired — renew to edit loan dates' : ''"
                class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400"
                @click="startEditing"
              >
                <Edit2 class="h-3 w-3" />
                Edit Dates
              </button>
            </div>
            <div v-else class="flex items-center gap-2">
              <button
                type="button"
                class="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-700"
                @click="cancelEditing"
              >
                <X class="h-3 w-3" />
                Cancel
              </button>
              <button
                type="button"
                :disabled="saving || licenseState.readOnly"
                :title="licenseState.readOnly ? 'License expired — renew to save changes' : ''"
                class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                @click="saveDates"
              >
                <component :is="saving ? Loader2 : Check" class="h-3 w-3" :class="{ 'animate-spin': saving }" />
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
          <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">No.</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.loan_no }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Status</div>
              <div class="font-medium capitalize text-neutral-900 dark:text-white">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="generalStatusColor(loan.status)"
                >
                  {{ loanStatusLabel(loan) }}
                </span>
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Loan Product</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.loan_product?.name ?? '—' }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">
                {{ loan.is_rescheduled ? 'Current Principal' : 'Total Principal' }}
              </div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.is_rescheduled && latestReschedule ? fmt(latestReschedule.new_principal) : principalDisplay }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">
                Net Cash Disbursed
              </div>
              <div class="font-bold text-emerald-700 dark:text-emerald-400">
                {{ netDisbursedDisplay }}
              </div>
            </div>
            <div
              v-if="toNumber(loan.processing_fee) != null && (toNumber(loan.processing_fee) ?? 0) > 0"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Processing Fee</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ currency }} {{ fmt(loan.processing_fee) }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">
                {{ loan.is_rescheduled ? 'Current Interest Rate' : 'Interest Rate' }}
              </div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.is_rescheduled && latestReschedule ? `${latestReschedule.new_rate}%` : `${loan.interest_rate}%` }} ({{ interestMethodLabel }})
              </div>
            </div>
            <div
              v-if="loan.loan_product?.interest_method"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">
                Interest Method
              </div>
              <div class="font-medium capitalize text-neutral-900 dark:text-white">
                {{ loan.loan_product.interest_method.replace(/_/g, ' ') }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">
                {{ loan.is_rescheduled ? 'Current Term' : 'Term' }}
              </div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.is_rescheduled && latestReschedule ? latestReschedule.new_duration : loan.term_months }} months
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Repayment Cycle</div>
              <div class="font-medium capitalize text-neutral-900 dark:text-white">
                {{ loan.loan_product?.repayment_cycle ? loan.loan_product.repayment_cycle.replace(/_/g, ' ') : '—' }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Grace Period</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{
                  (loan.loan_product?.grace_period ?? 0) > 0
                    ? `${loan.loan_product?.grace_period} days`
                    : 'None'
                }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Approval Date</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.approved_at ? fmtDate(loan.approved_at) : '—' }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 items-center"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Date Disbursed</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                <template v-if="!isEditingDates">
                  {{ loan.disbursed_at ? fmtDate(loan.disbursed_at) : '—' }}
                </template>
                <template v-else>
                  <input
                    v-model="tempDates.disbursed_at"
                    type="date"
                    class="w-full rounded border border-neutral-200 px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </template>
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 items-center"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Schedule Start Date</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                <template v-if="!isEditingDates">
                  <span
                    :class="{
                      'text-nfuko-action font-semibold': loan.schedule_date && loan.disbursed_at && loan.schedule_date.split('T')[0] !== loan.disbursed_at.split('T')[0]
                    }"
                  >
                    {{ loan.schedule_date ? fmtDate(loan.schedule_date) : '—' }}
                  </span>
                </template>
                <template v-else>
                  <input
                    v-model="tempDates.schedule_date"
                    type="date"
                    class="w-full rounded border px-2 py-1 text-xs outline-none transition-colors"
                    :class="[
                      tempDates.schedule_date !== (loan.schedule_date ? loan.schedule_date.split('T')[0] : '')
                        ? 'border-nfuko-action text-nfuko-action focus:ring-1 focus:ring-nfuko-action dark:border-nfuko-action'
                        : 'border-neutral-200 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800'
                    ]"
                  />
                </template>
              </div>
            </div>
            <div
              v-if="loan.is_rescheduled && latestReschedule"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Rescheduled On</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ latestReschedule.reschedule_date ? fmtDate(latestReschedule.reschedule_date) : '—' }}
              </div>
            </div>
            <div
              v-if="loan.is_rescheduled && latestReschedule"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Reschedule Type</div>
              <div class="font-medium capitalize text-neutral-900 dark:text-white">
                {{ latestReschedule.reschedule_type?.replace(/_/g, ' ') ?? '—' }}
              </div>
            </div>
            <div
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">
                Disbursement Method
              </div>
              <div class="font-medium capitalize text-neutral-900 dark:text-white">
                {{ loan.disbursement_method?.replace(/_/g, ' ') ?? '—' }}
              </div>
            </div>
            <div
              v-if="loan.disbursement_reference"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Reference</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.disbursement_reference }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── RIGHT COLUMN ── -->
      <div class="space-y-6">
        <!-- People Information -->
        <div
          class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              People Information
            </h3>
          </div>
          <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
            <div
              v-if="loan.member"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Member Name</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.member.name }}
              </div>
            </div>
            <div
              v-if="loan.member?.member_number"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Member No.</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.member.member_number }}
              </div>
            </div>
            <div
              v-if="loan.disbursed_by_staff"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">
                Disbursing Officer
              </div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.disbursed_by_staff.name }}
              </div>
            </div>
            <div
              v-if="loan.loan_officer"
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Loan Officer</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.loan_officer.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Original Loan Details (Before Rescheduling) -->
        <div
          v-if="loan.is_rescheduled"
          class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <h3 class="text-[13px] font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <History class="h-3.5 w-3.5 text-neutral-400" />
              Original Loan Details (Before Rescheduling)
            </h3>
          </div>
          <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Loan Number</div>
              <div class="font-medium text-neutral-900 dark:text-white">{{ loan.loan_no }}</div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Initial Status</div>
              <div class="font-medium">
                <span
                  v-if="oldStatusLabel"
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  :class="oldStatusClass"
                >
                  {{ oldStatusLabel }}
                </span>
                <span v-else class="text-neutral-400">—</span>
              </div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Original Principal</div>
              <div class="font-bold text-neutral-900 dark:text-white">{{ principalDisplay }}</div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Original Term</div>
              <div class="font-medium text-neutral-900 dark:text-white">{{ loan.original_term_months || loan.term_months }} months</div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Original Rate</div>
              <div class="font-medium text-neutral-900 dark:text-white">{{ loan.original_interest_rate || loan.interest_rate }}%</div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Interest Method</div>
              <div class="font-medium capitalize text-neutral-900 dark:text-white">
                {{ loan.loan_product?.interest_method?.replace(/_/g, ' ') ?? '—' }}
              </div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Grace Period</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ (loan.loan_product?.grace_period ?? 0) > 0 ? `${loan.loan_product?.grace_period} days` : 'None' }}
              </div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Net Cash Disbursed</div>
              <div class="font-medium text-neutral-900 dark:text-white">{{ netDisbursedDisplay }}</div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Approved Date</div>
              <div class="font-medium text-neutral-900 dark:text-white">{{ loan.approved_at ? fmtDate(loan.approved_at) : '—' }}</div>
            </div>
            <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Disbursed Date</div>
              <div class="font-medium text-neutral-900 dark:text-white">{{ loan.disbursed_at ? fmtDate(loan.disbursed_at) : '—' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
