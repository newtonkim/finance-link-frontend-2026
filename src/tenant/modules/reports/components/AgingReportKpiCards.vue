<script setup lang="ts">
import { AlertTriangle, TrendingUp } from 'lucide-vue-next'
import type { AgingPortfolioTotals, AgingBucketRow } from '@/tenant/apis/reports/reportsApi'

defineProps<{
  totals: AgingPortfolioTotals
  buckets: AgingBucketRow[]
  nplRatio: number
  fmt: (v: any) => string
  fmtPct: (v: number) => string
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">

    <!-- Total Portfolio -->
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p class="text-xs font-medium uppercase tracking-wide text-neutral-400">Total Portfolio</p>
      <p class="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{{ fmt(totals.total_portfolio) }}</p>
      <p class="mt-1 text-xs text-neutral-400">
        {{ totals.arrears_loan_count }} in arrears · {{ totals.loan_count }} active
      </p>
    </div>

    <!-- Total Arrears -->
    <div class="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm dark:border-orange-900/30 dark:bg-orange-900/10">
      <p class="text-xs font-medium uppercase tracking-wide text-orange-500">Total Arrears</p>
      <p class="mt-2 text-2xl font-bold text-orange-700 dark:text-orange-400">{{ fmt(totals.total_arrears) }}</p>
      <p class="mt-1 text-xs text-orange-400">Provision required: {{ fmt(totals.total_provision) }}</p>
    </div>

    <!-- PAR 30 -->
    <div class="rounded-2xl border p-5 shadow-sm"
      :class="totals.par_30 > 5
        ? 'border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
        : 'border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'">
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-400">PAR &gt; 30</p>
        <AlertTriangle v-if="totals.par_30 > 5" class="h-4 w-4 text-red-500" />
        <TrendingUp v-else class="h-4 w-4 text-emerald-500" />
      </div>
      <p class="mt-2 text-2xl font-bold"
        :class="totals.par_30 > 5 ? 'text-red-700 dark:text-red-400' : 'text-neutral-900 dark:text-white'">
        {{ fmtPct(totals.par_30) }}
      </p>
      <p class="mt-1 text-xs text-neutral-400">At-risk balance ÷ portfolio</p>
      <p v-if="totals.rescheduled_loan_count > 0" class="mt-0.5 text-xs text-neutral-400">
        Excl. rescheduled: <span class="font-medium">{{ fmtPct(totals.par_30_excl_rescheduled) }}</span>
      </p>
    </div>

    <!-- PAR 90 -->
    <div class="rounded-2xl border p-5 shadow-sm"
      :class="totals.par_90 > 2
        ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/15'
        : 'border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'">
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-400">PAR &gt; 90</p>
        <AlertTriangle v-if="totals.par_90 > 2" class="h-4 w-4 text-red-600" />
        <TrendingUp v-else class="h-4 w-4 text-emerald-500" />
      </div>
      <p class="mt-2 text-2xl font-bold"
        :class="totals.par_90 > 2 ? 'text-red-800 dark:text-red-300' : 'text-neutral-900 dark:text-white'">
        {{ fmtPct(totals.par_90) }}
      </p>
      <p class="mt-1 text-xs text-neutral-400">At-risk balance ÷ portfolio</p>
      <p v-if="totals.rescheduled_loan_count > 0" class="mt-0.5 text-xs text-neutral-400">
        Excl. rescheduled: <span class="font-medium">{{ fmtPct(totals.par_90_excl_rescheduled) }}</span>
      </p>
    </div>

    <!-- NPL Ratio -->
    <div class="rounded-2xl border p-5 shadow-sm"
      :class="nplRatio > 5
        ? 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10'
        : 'border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'">
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-400">NPL Ratio</p>
        <AlertTriangle v-if="nplRatio > 5" class="h-4 w-4 text-rose-600" />
        <TrendingUp v-else class="h-4 w-4 text-emerald-500" />
      </div>
      <p class="mt-2 text-2xl font-bold"
        :class="nplRatio > 5 ? 'text-rose-700 dark:text-rose-400' : 'text-neutral-900 dark:text-white'">
        {{ fmtPct(nplRatio) }}
      </p>
      <p class="mt-1 text-xs text-neutral-400">
        Doubtful + Loss loans ÷ active loans
      </p>
      <p class="mt-0.5 text-xs text-neutral-400">
        ({{ buckets.filter(b => b.bucket === '91-180' || b.bucket === '180+').reduce((s, b) => s + b.loan_count, 0) }} non-performing)
      </p>
    </div>
  </div>

  <!-- Rescheduled loans notice -->
  <div v-if="totals.rescheduled_loan_count > 0"
    class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800/40 dark:bg-amber-900/10">
    <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
    <span class="text-amber-800 dark:text-amber-300">
      <strong>{{ totals.rescheduled_loan_count }} rescheduled loan{{ totals.rescheduled_loan_count === 1 ? '' : 's' }}</strong>
      ({{ fmt(totals.rescheduled_outstanding) }} outstanding) included in PAR figures above.
      "Excl. rescheduled" figures reflect organic portfolio health.
    </span>
  </div>
</template>
