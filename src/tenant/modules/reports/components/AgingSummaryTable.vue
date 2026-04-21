<script setup lang="ts">
import type { AgingBucketRow, AgingPortfolioTotals, AgingBucket } from '@/tenant/apis/reports/reportsApi'

defineProps<{
  buckets: AgingBucketRow[]
  totals: AgingPortfolioTotals
  bucketLabel: (b: AgingBucket) => string
  bucketBadgeClass: (b: AgingBucket) => string
  assetQualityClass: (b: AgingBucket) => string
  assetQualityLabel: (b: AgingBucket) => string
  bucketTableRowClass: (b: AgingBucket) => string
  fmt: (v: any) => string
  fmtPct: (v: number) => string
}>()
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
      <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Portfolio Aging Summary</h2>
      <p class="text-xs text-neutral-400">Arrears and provisioning by aging bucket. Loans classified by worst effective DPD.</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-neutral-50 dark:bg-neutral-800/40">
            <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Bucket</th>
            <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Asset Quality</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Loans</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Principal</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Interest</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Charges</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Penalty</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Total Arrears</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">% Portfolio</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Prov. Rate</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Provision Amt</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
          <tr v-for="b in buckets" :key="b.bucket" class="transition-colors" :class="bucketTableRowClass(b.bucket)">
            <td class="px-6 py-3">
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="bucketBadgeClass(b.bucket)">
                {{ bucketLabel(b.bucket) }}
              </span>
            </td>
            <td class="px-6 py-3">
              <span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold" :class="assetQualityClass(b.bucket)">
                {{ assetQualityLabel(b.bucket) }}
              </span>
            </td>
            <td class="px-6 py-3 text-right text-neutral-700 dark:text-neutral-300">{{ b.loan_count }}</td>
            <td class="px-6 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(b.principal_arrears) }}</td>
            <td class="px-6 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(b.interest_arrears) }}</td>
            <td class="px-6 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(b.charges_arrears) }}</td>
            <td class="px-6 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(b.penalty_arrears) }}</td>
            <td class="px-6 py-3 text-right font-mono font-semibold text-neutral-900 dark:text-white">{{ fmt(b.total_arrears) }}</td>
            <td class="px-6 py-3 text-right text-neutral-600 dark:text-neutral-400">{{ fmtPct(b.portfolio_percentage) }}</td>
            <td class="px-6 py-3 text-right text-neutral-500 dark:text-neutral-400">{{ b.provision_rate }}%</td>
            <td class="px-6 py-3 text-right font-mono font-semibold text-orange-700 dark:text-orange-400">{{ fmt(b.provision_amount) }}</td>
          </tr>
          <!-- Totals row -->
          <tr class="border-t-2 border-neutral-200 bg-neutral-50 font-semibold dark:border-neutral-700 dark:bg-neutral-800/60">
            <td class="px-6 py-3 text-neutral-900 dark:text-white">Total</td>
            <td class="px-6 py-3 text-neutral-500 dark:text-neutral-400 text-xs">—</td>
            <td class="px-6 py-3 text-right text-neutral-900 dark:text-white">
              <span class="block">{{ totals.arrears_loan_count }} in arrears</span>
              <span class="block text-xs font-normal text-neutral-500 dark:text-neutral-400">{{ totals.loan_count }} active</span>
            </td>
            <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">{{ fmt(buckets.reduce((s, b) => s + b.principal_arrears, 0)) }}</td>
            <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">{{ fmt(buckets.reduce((s, b) => s + b.interest_arrears, 0)) }}</td>
            <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">{{ fmt(buckets.reduce((s, b) => s + b.charges_arrears, 0)) }}</td>
            <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">{{ fmt(buckets.reduce((s, b) => s + b.penalty_arrears, 0)) }}</td>
            <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">{{ fmt(totals.total_arrears) }}</td>
            <td class="px-6 py-3 text-right text-neutral-900 dark:text-white">—</td>
            <td class="px-6 py-3 text-right text-neutral-900 dark:text-white">—</td>
            <td class="px-6 py-3 text-right font-mono text-orange-700 dark:text-orange-400">{{ fmt(totals.total_provision) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
