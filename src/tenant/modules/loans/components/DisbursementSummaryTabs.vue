<script setup lang="ts">
import type { DisbursementBreakdownRow } from '@/tenant/apis/reports/reportsApi'
import type { SummaryTab } from '../composables/useDisbursementReport'

defineProps<{
  activeTab: SummaryTab
  byProduct: DisbursementBreakdownRow[]
  byChannel: DisbursementBreakdownRow[]
  byBranch: DisbursementBreakdownRow[]
  byOfficer: DisbursementBreakdownRow[]
  fmt: (v: unknown) => string
  fmtPct: (v: unknown) => string
}>()

const emit = defineEmits<{ (e: 'update:activeTab', tab: SummaryTab): void }>()

const tabs: { key: SummaryTab; label: string }[] = [
  { key: 'product', label: 'By Loan Product' },
  { key: 'channel', label: 'By Channel' },
  { key: 'branch', label: 'By Branch' },
  { key: 'officer', label: 'By Loan Officer' },
]

function rowsForTab(tab: SummaryTab, props: any): DisbursementBreakdownRow[] {
  const map: Record<SummaryTab, DisbursementBreakdownRow[]> = {
    product: props.byProduct,
    channel: props.byChannel,
    branch: props.byBranch,
    officer: props.byOfficer,
  }
  return map[tab] ?? []
}
</script>

<template>
  <div class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
    <div class="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="rounded-md px-3 py-1.5 text-sm font-semibold transition"
          :class="activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
          @click="emit('update:activeTab', tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="max-h-[340px] overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-neutral-50 dark:bg-neutral-700/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Name</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Loans</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">% of Total</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rowsForTab(activeTab, $props)"
            :key="row.name"
            class="border-b border-neutral-100 dark:border-neutral-700"
          >
            <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">{{ row.name }}</td>
            <td class="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{{ row.loan_count }}</td>
            <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.total_amount) }}</td>
            <td class="px-4 py-2.5 text-right font-semibold text-blue-600">{{ fmtPct(row.percentage) }}</td>
          </tr>
          <tr v-if="rowsForTab(activeTab, $props).length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-sm text-neutral-400">No data for this period.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
