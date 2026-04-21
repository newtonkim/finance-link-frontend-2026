<script setup lang="ts">
import { Spinner } from '@/Global'
import type { CollectionsTransactionRow } from '@/tenant/apis/reports/reportsApi'

defineProps<{
  loanId: number
  transactions: CollectionsTransactionRow[]
  loading: boolean
  error: string | null
  fmt: (v: unknown) => string
  retry: (loanId: number) => void
}>()
</script>

<template>
  <div class="px-8 pb-4 pt-2">
    <div class="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-700">
      Transactions in Period
    </div>

    <div v-if="loading && transactions.length === 0" class="py-4 text-sm text-neutral-500">
      <Spinner class="mr-2 inline h-4 w-4" /> Loading transactions...
    </div>

    <div v-else-if="error" class="text-sm text-red-600">
      {{ error }}
      <button class="ml-2 underline" @click.stop="retry(loanId)">Retry</button>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full text-xs">
        <thead>
          <tr class="bg-blue-100/60 dark:bg-blue-900/20">
            <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Payment Date</th>
            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Amount Paid</th>
            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Principal</th>
            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Interest</th>
            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Charges</th>
            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Penalty</th>
            <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Method</th>
            <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Receipt No</th>
            <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Collected By</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tx in transactions"
            :key="`${loanId}-${tx.receipt_no}-${tx.payment_date}-${tx.amount_paid}`"
            class="border-b border-blue-100 dark:border-blue-900/20"
          >
            <td class="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{{ tx.payment_date }}</td>
            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.amount_paid) }}</td>
            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.principal_portion) }}</td>
            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.interest_portion) }}</td>
            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.charges_portion) }}</td>
            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.penalty_portion) }}</td>
            <td class="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{{ tx.payment_method || '—' }}</td>
            <td class="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{{ tx.receipt_no || '—' }}</td>
            <td class="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{{ tx.collected_by_name || '—' }}</td>
          </tr>

          <tr v-if="transactions.length === 0">
            <td colspan="9" class="px-3 py-2 text-neutral-400 italic">
              No transactions found for this loan in the selected period.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
