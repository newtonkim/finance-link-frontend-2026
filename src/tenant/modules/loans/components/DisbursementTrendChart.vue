<script setup lang="ts">
import { computed } from 'vue'
import type { DisbursementTrendPoint } from '@/tenant/apis/reports/reportsApi'

const props = defineProps<{
  trend: DisbursementTrendPoint[]
  fmt: (v: unknown) => string
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
    <p class="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400">Monthly Disbursement Trend</p>

    <div v-if="trend.length === 0" class="py-8 text-center text-sm text-neutral-400">
      No trend data available.
    </div>

    <div v-else class="flex items-end gap-3" style="height: 180px">
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
          class="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
          :style="{ height: barHeight(point.total_disbursed), minHeight: '4px' }"
        />
        <div class="text-center">
          <p class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">{{ point.label }}</p>
          <p class="text-[10px] text-neutral-400">{{ point.loan_count }} loans</p>
        </div>
      </div>
    </div>
  </div>
</template>
