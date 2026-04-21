<script setup lang="ts">
import type { CollectionsSummaryResponse, CollectionsSummaryRow, CollectionsMethodRow } from '@/tenant/apis/reports/reportsApi'
import type { SummaryTab } from '../composables/useCollectionsReport'

defineProps<{
  summary: CollectionsSummaryResponse
  activeTab: SummaryTab
  toNumber: (v: unknown) => number
  fmt: (v: unknown) => string
  fmtRate: (v: unknown) => string
  getRateClass: (r: number) => string
  summaryDisplayName: (r: CollectionsSummaryRow, t: SummaryTab) => string
}>()

const emit = defineEmits(['update:activeTab'])

function setTab(tab: SummaryTab) {
  emit('update:activeTab', tab)
}

function loanCountTotal(rows: CollectionsSummaryRow[]): number {
  return rows.reduce((sum, row) => sum + Number(row.loan_count || 0), 0)
}

function methodDisplayName(row: CollectionsMethodRow): string {
  return row.payment_method || 'Unknown'
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div class="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Amount Due</p>
      <p class="mt-1 text-xl font-bold text-neutral-900 dark:text-white">{{ fmt(summary.totals.amount_due) }}</p>
    </div>
    <div class="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-sm dark:border-emerald-900/20 dark:bg-emerald-900/10">
      <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Collected</p>
      <p class="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">{{ fmt(summary.totals.amount_collected) }}</p>
    </div>
    <div class="rounded-xl border border-blue-100 bg-blue-50/30 p-4 shadow-sm dark:border-blue-900/20 dark:bg-blue-900/10">
      <p class="text-[10px] font-bold uppercase tracking-wider text-blue-600">Collection Rate</p>
      <p class="mt-1 text-xl font-bold text-blue-700 dark:text-blue-400">{{ fmtRate(summary.totals.collection_rate) }}</p>
    </div>
    <div class="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <p class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Transactions</p>
      <p class="mt-1 text-xl font-bold text-neutral-900 dark:text-white">{{ summary.totals.transaction_count }}</p>
    </div>
  </div>

  <div class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
    <div class="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="rounded-md px-3 py-1.5 text-sm font-semibold transition"
          :class="activeTab === 'officer' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
          @click="setTab('officer')"
        >
          By Loan Officer
        </button>
        <button
          class="rounded-md px-3 py-1.5 text-sm font-semibold transition"
          :class="activeTab === 'branch' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
          @click="setTab('branch')"
        >
          By Branch
        </button>
        <button
          class="rounded-md px-3 py-1.5 text-sm font-semibold transition"
          :class="activeTab === 'method' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
          @click="setTab('method')"
        >
          By Payment Method
        </button>
      </div>
    </div>

    <div class="max-h-[340px] overflow-auto">
      <table v-if="activeTab !== 'method'" class="w-full text-sm">
        <thead class="bg-neutral-50 dark:bg-neutral-700/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {{ activeTab === 'officer' ? 'Loan Officer' : 'Branch' }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Loans</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Due</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Collected</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Rate</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in activeTab === 'officer' ? summary.by_officer : summary.by_branch"
            :key="`${activeTab}-${summaryDisplayName(row, activeTab)}`"
            class="border-b border-neutral-100 dark:border-neutral-700"
          >
            <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">
              {{ summaryDisplayName(row, activeTab) }}
            </td>
            <td class="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{{ row.loan_count }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.amount_due) }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.amount_collected) }}</td>
            <td class="px-4 py-2.5 text-right font-semibold" :class="getRateClass(toNumber(row.collection_rate))">
              {{ fmtRate(row.collection_rate) }}
            </td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.outstanding_balance) }}</td>
          </tr>
          <tr v-if="(activeTab === 'officer' ? summary.by_officer : summary.by_branch).length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-sm text-neutral-400">No summary rows for this period.</td>
          </tr>
        </tbody>
        <tfoot class="sticky bottom-0 border-t border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-700/40">
          <tr class="font-semibold">
            <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">Totals</td>
            <td class="px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-200">
              {{ loanCountTotal(activeTab === 'officer' ? summary.by_officer : summary.by_branch) }}
            </td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-800 dark:text-neutral-100">{{ fmt(summary.totals.amount_due) }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-800 dark:text-neutral-100">{{ fmt(summary.totals.amount_collected) }}</td>
            <td class="px-4 py-2.5 text-right" :class="getRateClass(summary.totals.collection_rate)">
              {{ fmtRate(summary.totals.collection_rate) }}
            </td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-800 dark:text-neutral-100">{{ fmt(summary.totals.outstanding_balance) }}</td>
          </tr>
        </tfoot>
      </table>

      <table v-else class="w-full text-sm">
        <thead class="bg-neutral-50 dark:bg-neutral-700/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment Method</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Transactions</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Collected</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in summary.by_method"
            :key="methodDisplayName(row)"
            class="border-b border-neutral-100 dark:border-neutral-700"
          >
            <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">{{ methodDisplayName(row) }}</td>
            <td class="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{{ row.transaction_count }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.amount_collected) }}</td>
          </tr>
          <tr v-if="summary.by_method.length === 0">
            <td colspan="3" class="px-4 py-8 text-center text-sm text-neutral-400">No payment-method totals for this period.</td>
          </tr>
        </tbody>
        <tfoot class="sticky bottom-0 border-t border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-700/40">
          <tr class="font-semibold">
            <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">Totals</td>
            <td class="px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-200">{{ summary.totals.transaction_count }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-800 dark:text-neutral-100">{{ fmt(summary.totals.amount_collected) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
