<script setup lang="ts">
import { History, Printer, FileDown } from 'lucide-vue-next'
import type { LoanDetail, RescheduleHistoryEntry } from '@/tenant/apis/loans/loansApi'

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
}>()
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
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
              Current Loan Details
            </h3>
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
                  {{ loan.status === 'active' ? 'Disbursed' : loan.status }}
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
              class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
            >
              <div class="font-medium text-neutral-500 dark:text-neutral-400">Date Disbursed</div>
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ loan.disbursed_at ? fmtDate(loan.disbursed_at) : '—' }}
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
