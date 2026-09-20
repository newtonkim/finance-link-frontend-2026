<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { GrowthPoint } from '@/central/modules/apis/dashboard/dashboardApi'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps<{
  points: GrowthPoint[]
  loading?: boolean
}>()

/**
 * A single series, so there is no legend: the heading names what the line is. The
 * cumulative total is plotted rather than monthly sign-ups, which on a young
 * platform is a row of zeroes with one spike.
 */
const isDark = ref(false)
let media: MediaQueryList | null = null

function syncTheme() {
  const root = document.documentElement
  const stamped = root.getAttribute('data-theme')
  isDark.value = stamped === 'dark' || (stamped !== 'light' && !!media?.matches)
}

onMounted(() => {
  media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', syncTheme)
  syncTheme()
})

onBeforeUnmount(() => media?.removeEventListener('change', syncTheme))

const ink = computed(() => (isDark.value ? '#A3A3A3' : '#6B7280'))
const grid = computed(() => (isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'))
const line = computed(() => (isDark.value ? '#53B3DA' : '#0050D8'))

/** Flat data is still truthful data; we only suppress the plot when there is none. */
const hasData = computed(() => props.points.length > 0)

const peak = computed(() => Math.max(...props.points.map((p) => p.cumulative), 0))

const chartData = computed(() => ({
  labels: props.points.map((p) => p.label),
  datasets: [
    {
      label: 'Tenants',
      data: props.points.map((p) => p.cumulative),
      borderColor: line.value,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: line.value,
      pointBorderColor: isDark.value ? '#151515' : '#ffffff',
      pointBorderWidth: 2,
      fill: true,
      backgroundColor: (ctx: any) => {
        const { chart } = ctx
        if (!chart.chartArea) return 'transparent'
        const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom)
        g.addColorStop(0, isDark.value ? 'rgba(83,179,218,0.22)' : 'rgba(0,80,216,0.14)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        return g
      },
      tension: 0.3,
    },
  ],
}))

const chartOptions = computed<any>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? false
    : { duration: 400, easing: 'easeOutQuart' },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: isDark.value ? '#232323' : '#111827',
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 12 },
      callbacks: {
        title: (items: any[]) => {
          const point = props.points[items[0].dataIndex]
          return point ? point.month : ''
        },
        label: (item: any) => {
          const point = props.points[item.dataIndex]
          const total = `${item.parsed.y} ${item.parsed.y === 1 ? 'tenant' : 'tenants'}`
          return point && point.new > 0 ? `${total} (+${point.new} joined)` : total
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: ink.value, font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      // A flat line pinned to the top of the plot reads as a bug; give it headroom.
      suggestedMax: Math.max(peak.value + 1, 2),
      grid: { color: grid.value },
      border: { display: false },
      ticks: { color: ink.value, font: { size: 11 }, precision: 0, maxTicksLimit: 5 },
    },
  },
}))
</script>

<template>
  <section
    class="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#151515]"
    aria-labelledby="growth-heading"
  >
    <header class="flex items-baseline justify-between gap-3 px-5 py-4">
      <h2 id="growth-heading" class="text-base font-semibold text-neutral-900 dark:text-white">
        Tenant growth
      </h2>
      <span class="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">Last 12 months</span>
    </header>

    <div class="min-h-[260px] flex-1 px-3 pb-5">
      <div v-if="loading" class="mx-2 h-[240px] animate-pulse rounded-xl bg-neutral-100 dark:bg-white/5"></div>

      <div
        v-else-if="!hasData"
        class="flex h-[240px] flex-col items-center justify-center gap-1 px-6 text-center"
      >
        <p class="text-[14px] font-medium text-neutral-900 dark:text-white">No tenants yet</p>
        <p class="max-w-xs text-[13px] text-neutral-500 dark:text-neutral-400">
          Growth appears here once the first sacco is provisioned.
        </p>
      </div>

      <div v-else class="h-[240px]">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </section>
</template>
