<script setup lang="ts">
import { History, ExternalLink } from 'lucide-vue-next'
import type { LoanDetail } from '@/tenant/apis/loans/loansApi'

defineProps<{
  loan: LoanDetail | null
  fmtDate: (d: string | null | undefined) => string
}>()
</script>

<template>
  <div class="before-topup-root">
    <div v-if="loan?.parent_loan" class="space-y-6">
      <div class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 flex items-center justify-between">
          <h3 class="text-[13px] font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <History class="h-3.5 w-3.5 text-neutral-400" />
            Previous Loan Details (Topped Up)
          </h3>
          <router-link
            :to="{ name: 'tenant-loan-detail', params: { id: loan.parent_loan.id } }"
            class="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            View Full History
            <ExternalLink class="h-3 w-3" />
          </router-link>
        </div>
        <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
          <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
            <div class="font-medium text-neutral-500 dark:text-neutral-400">Loan Number</div>
            <div class="font-bold text-neutral-900 dark:text-white">{{ loan.parent_loan.loan_no }}</div>
          </div>
          <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
            <div class="font-medium text-neutral-500 dark:text-neutral-400">Final Status</div>
            <div class="font-medium">
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {{ loan.parent_loan.status_label || loan.parent_loan.status }}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
            <div class="font-medium text-neutral-500 dark:text-neutral-400">Total Principal</div>
            <div class="font-medium text-neutral-900 dark:text-white">{{ loan.parent_loan.principal_formatted }}</div>
          </div>
          <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
            <div class="font-medium text-neutral-500 dark:text-neutral-400">Outstanding at Top-up</div>
            <div class="font-bold text-red-600 dark:text-red-400">{{ loan.parent_loan.outstanding_balance_formatted }}</div>
          </div>
          <div class="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-neutral-900">
            <div class="font-medium text-neutral-500 dark:text-neutral-400">Disbursement Date</div>
            <div class="font-medium text-neutral-900 dark:text-white">
              {{ loan.parent_loan.disbursed_at ? fmtDate(loan.parent_loan.disbursed_at) : '—' }}
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-blue-50 p-4 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
        <div class="flex gap-3">
          <div class="mt-0.5 text-blue-600 dark:text-blue-400">
            <History class="h-4 w-4" />
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-300">Top-up Context</h4>
            <p class="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              This loan was created to top up and consolidate the outstanding balance of 
              <span class="font-bold">{{ loan.parent_loan.loan_no }}</span>. 
              The previous loan has been marked as <strong>Restructured</strong> and its remaining balance was cleared as part of this transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400">
      <History class="h-12 w-12 mb-4 opacity-20" />
      <p class="text-sm">No previous top-up history found for this loan.</p>
    </div>
  </div>
</template>
