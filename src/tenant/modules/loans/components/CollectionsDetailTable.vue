<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import type { CollectionsLoanRow, CollectionsTransactionRow } from '@/tenant/apis/reports/reportsApi'
import type { Meta } from '../composables/useCollectionsReport'
import CollectionsTransactionTable from './CollectionsTransactionTable.vue'

defineProps<{
  loans: CollectionsLoanRow[]
  meta: Meta
  expandedLoanId: number | null
  transactionCache: Map<number, CollectionsTransactionRow[]>
  transactionLoading: Set<number>
  transactionErrors: Map<number, string>
  fromRecord: number
  toRecord: number
  canGoPrev: boolean
  canGoNext: boolean
  toNumber: (v: unknown) => number
  fmt: (v: unknown) => string
  fmtRate: (v: unknown) => string
  getRateClass: (r: number) => string
  toggleExpand: (id: number) => void
  goToPage: (p: number) => void
  retryTransactions: (id: number) => void
}>()
</script>

<template>
  <div class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
    <div class="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
      <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
        Loan-Level Collections — {{ meta.total }} loan{{ meta.total !== 1 ? 's' : '' }}
      </p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-neutral-50 dark:bg-neutral-700/30">
          <tr>
            <th class="w-8 px-3 py-3"></th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Member</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan No</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan Officer</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Due</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Collected</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Rate %</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Outstanding</th>
            <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">DPD</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Last Payment</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="loan in loans" :key="loan.loan_id">
            <tr
              class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/20"
              :class="expandedLoanId === loan.loan_id ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''"
              @click="toggleExpand(loan.loan_id)"
            >
              <td class="px-3 py-3 text-neutral-400">
                <ChevronDown v-if="expandedLoanId === loan.loan_id" class="h-4 w-4 text-blue-600" />
                <ChevronRight v-else class="h-4 w-4" />
              </td>
              <td class="px-4 py-3">
                <div class="font-medium text-neutral-800 dark:text-neutral-100">{{ loan.member_name }}</div>
                <div class="text-xs text-neutral-400">{{ loan.member_number }} · {{ loan.phone || 'No phone' }}</div>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-200">{{ loan.loan_no }}</td>
              <td class="px-4 py-3 text-neutral-700 dark:text-neutral-200">{{ loan.loan_officer_name || 'Unassigned' }}</td>
              <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(loan.amount_due) }}</td>
              <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(loan.amount_collected) }}</td>
              <td class="px-4 py-3 text-right font-semibold" :class="getRateClass(toNumber(loan.collection_rate))">
                {{ fmtRate(loan.collection_rate) }}
              </td>
              <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(loan.outstanding_balance) }}</td>
              <td class="px-4 py-3 text-center text-neutral-700 dark:text-neutral-200">{{ loan.days_in_arrears }}</td>
              <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ loan.last_payment_date || '—' }}</td>
            </tr>

            <tr v-if="expandedLoanId === loan.loan_id" class="border-b border-blue-100 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-900/5">
              <td colspan="10" class="px-0">
                <CollectionsTransactionTable
                  :loan-id="loan.loan_id"
                  :transactions="transactionCache.get(loan.loan_id) || []"
                  :loading="transactionLoading.has(loan.loan_id)"
                  :error="transactionErrors.get(loan.loan_id) || null"
                  :fmt="fmt"
                  :retry="retryTransactions"
                />
              </td>
            </tr>
          </template>

          <tr v-if="loans.length === 0">
            <td colspan="10" class="px-4 py-10 text-center text-sm text-neutral-400">No loan rows for this period.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="border-t border-neutral-100 px-4 py-3 dark:border-neutral-700">
      <div class="flex items-center justify-between">
        <span class="text-xs text-neutral-400">
          Showing {{ fromRecord }}-{{ toRecord }} of {{ meta.total }} loans
        </span>
        <div class="flex items-center gap-2 text-sm">
          <button
            :disabled="!canGoPrev"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            @click="goToPage(meta.current_page - 1)"
          >
            Prev
          </button>
          <span class="text-xs text-neutral-500">{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button
            :disabled="!canGoNext"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            @click="goToPage(meta.current_page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
