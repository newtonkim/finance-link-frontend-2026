<script setup lang="ts">
import type { DisbursementLoanRow } from '@/tenant/apis/reports/reportsApi'

defineProps<{
  loans: DisbursementLoanRow[]
  total: number
  fmt: (v: unknown) => string
  fmtPct: (v: unknown) => string
}>()

function statusClass(status: string): string {
  const s = status?.toLowerCase() ?? ''
  if (s === 'active' || s === 'disbursed') return 'bg-green-100 text-green-700'
  if (s === 'arrears') return 'bg-red-100 text-red-700'
  if (s === 'closed') return 'bg-neutral-100 text-neutral-600'
  return 'bg-blue-100 text-blue-700'
}

function channelBadge(method: string): string {
  const m = method?.toLowerCase() ?? ''
  if (m.includes('mobile') || m.includes('momo')) return 'bg-yellow-100 text-yellow-700'
  if (m.includes('bank')) return 'bg-blue-100 text-blue-700'
  if (m.includes('cash')) return 'bg-green-100 text-green-700'
  return 'bg-neutral-100 text-neutral-600'
}
</script>

<template>
  <div class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
    <div class="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
      <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
        Disbursement Register — {{ total }} loan{{ total !== 1 ? 's' : '' }}
      </p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-neutral-50 dark:bg-neutral-700/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan No</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Member</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Product</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Principal</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Net Disbursed</th>
            <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Rate</th>
            <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Term</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Channel</th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Repaid %</th>
            <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Status</th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Disbursed</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="loan in loans"
            :key="loan.loan_id"
            class="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/20"
          >
            <td class="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-200">{{ loan.loan_no }}</td>
            <td class="px-4 py-3">
              <div class="font-medium text-neutral-800 dark:text-neutral-100">{{ loan.member_name }}</div>
              <div class="text-xs text-neutral-400">{{ loan.member_number }}</div>
            </td>
            <td class="px-4 py-3 text-neutral-700 dark:text-neutral-200">{{ loan.product_name }}</td>
            <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(loan.principal) }}</td>
            <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(loan.net_disbursed_amount) }}</td>
            <td class="px-4 py-3 text-center text-neutral-600 dark:text-neutral-300">{{ loan.interest_rate }}%</td>
            <td class="px-4 py-3 text-center text-neutral-600 dark:text-neutral-300">{{ loan.term_months }}mo</td>
            <td class="px-4 py-3">
              <span class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold" :class="channelBadge(loan.disbursement_method)">
                {{ loan.disbursement_method }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-semibold" :class="loan.repaid_percent >= 50 ? 'text-green-600' : 'text-neutral-600'">
              {{ fmtPct(loan.repaid_percent) }}
            </td>
            <td class="px-4 py-3 text-center">
              <span class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize" :class="statusClass(loan.status)">
                {{ loan.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ loan.disbursed_at || '—' }}</td>
          </tr>
          <tr v-if="loans.length === 0">
            <td colspan="11" class="px-4 py-10 text-center text-sm text-neutral-400">No disbursements found for the selected period.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
