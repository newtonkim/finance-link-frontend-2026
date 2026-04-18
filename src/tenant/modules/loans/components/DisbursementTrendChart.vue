<script setup lang="ts">
import { computed } from 'vue'
import { Spinner } from '@/Global'
import type { DisbursementTrendPoint } from '@/tenant/apis/reports/reportsApi'

const props = defineProps<{
  trend: DisbursementTrendPoint[]
  trendMonths: 3 | 6 | 12
  trendLoading: boolean
  fmt: (v: unknown) => string
}>()

const emit = defineEmits<{
  (e: 'update:trend-months', val: 3 | 6 | 12): void
}>()

const maxDisbursed = computed(() => {
  if (props.trend.length === 0) return 1
  return Math.max(...props.trend.map((p) => p.total_disbursed), 1)
})

function barHeight(value: number): string {
  const pct = Math.max((value / maxDisbursed.value) * 100, 2)
  return `${pct}%`
}
</script>

<template>
  <div class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
    <div class="mb-4 flex items-center justify-between">
      <p class="text-xs font-bold uppercase tracking-wider text-neutral-400">Monthly Disbursement Trend</p>
      
      <div class="flex items-center gap-2">
        <Spinner v-if="trendLoading" class="h-4 w-4 text-neutral-400" />
        <select
          :value="trendMonths"
          class="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          @change="emit('update:trend-months', Number(($event.target as HTMLSelectElement).value) as 3 | 6 | 12)"
        >
          <option :value="3">3 Months</option>
          <option :value="6">6 Months</option>
          <option :value="12">12 Months</option>
        </select>
      </div>
    </div>

    <div v-if="trend.length === 0 && !trendLoading" class="py-8 text-center text-sm text-neutral-400">
      No trend data available.
    </div>

    <div v-else class="flex items-end gap-3" style="height: 180px; opacity: 1; transition: opacity 0.3s" :style="{ opacity: trendLoading ? 0.5 : 1 }">
      <div
        v-for="point in trend"
        :key="point.month"
        class="flex flex-1 flex-col items-center justify-end gap-1"
        style="height: 100%"
      >
        <p class="text-[10px] font-semibold text-neutral-700 dark:text-neutral-200">
          {{ fmt(point.total_disbursed) }}
        </p>
        <div
          class="w-full rounded-t-md transition-all duration-500"
          :style="{ height: barHeight(point.total_disbursed), minHeight: '4px', backgroundColor: 'var(--color-nfuko-chart-main)' }"
        />
        <div class="text-center">
          <p class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">{{ point.label }}</p>
          <p class="text-[10px] text-neutral-400">{{ point.loan_count }} loans</p>
        </div>
      </div>
    </div>
  </div>
</template>
