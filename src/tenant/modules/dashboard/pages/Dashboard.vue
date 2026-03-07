<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  Users,
  Wallet,
  HandCoins,
  Clock,
  TrendingUp,
  ShoppingCart,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { tenantClient } from '@/tenant/apis/tenantClient'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

interface Metrics {
  total_members: number
  active_members: number
  total_staff: number
  savings_summary: { total_deposits: number; active_accounts: number }
  loans_summary: { active_loans: number; total_outstanding: number; pending_applications: number }
}

const metrics = ref<Metrics | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const { data } = await tenantClient.get('/tenant/dashboard')
    metrics.value = data
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load dashboard data.'
  } finally {
    loading.value = false
  }
})

const stats = computed(() => {
  if (!metrics.value) return []
  return [
    {
      title: 'Total Members',
      value: metrics.value.total_members.toLocaleString(),
      subvalue: `${metrics.value.active_members} Active`,
      icon: Users,
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Total Savings',
      value: `KES ${metrics.value.savings_summary.total_deposits.toLocaleString()}`,
      subvalue: `${metrics.value.savings_summary.active_accounts} Accounts`,
      icon: Wallet,
      trend: '+8.2%',
      trendUp: true,
    },
    {
      title: 'Active Loans',
      value: `KES ${metrics.value.loans_summary.total_outstanding.toLocaleString()}`,
      subvalue: `${metrics.value.loans_summary.active_loans} Active Loans`,
      icon: HandCoins,
      trend: '-2.4%',
      trendUp: false,
    },
    {
      title: 'Pending Loans',
      value: String(metrics.value.loans_summary.pending_applications),
      subvalue: 'Awaiting Review',
      icon: Clock,
      trend: '',
      trendUp: null,
    },
  ]
})

/* ─── Loan Disbursement Revenue Chart ─── */
const activePeriod = ref('Monthly')
const periods = ['Monthly', 'Quarterly', 'Yearly']

const barChartData = computed(() => ({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
  datasets: [
    {
      label: 'Interest Earned',
      data: [55000, 62000, 72000, 80000, 68000, 45000, 30000, 22000],
      backgroundColor: '#001d22',
      borderRadius: { topLeft: 4, topRight: 4 },
      barPercentage: 0.55,
      categoryPercentage: 0.65,
    },
    {
      label: 'Processing Fees',
      data: [28000, 32000, 35000, 40000, 30000, 22000, 16000, 14000],
      backgroundColor: '#8ba8a2',
      borderRadius: { topLeft: 4, topRight: 4 },
      barPercentage: 0.55,
      categoryPercentage: 0.65,
    },
  ],
}))

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#001d22', padding: 12, cornerRadius: 10 },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: true,
      grid: { color: '#d1dfdb' },
      ticks: {
        callback: (v: string | number) => {
          const n = Number(v)
          return n === 0 ? '0' : `${n / 1000}K`
        },
      },
    },
  },
}

/* ─── Portfolio Mix Doughnut ─── */
const doughnutData = {
  labels: ['Personal Loans', 'Business Loans', 'Emergency Loans', 'Others'],
  datasets: [
    {
      data: [85000, 25000, 10000, 5000],
      backgroundColor: ['#001d22', '#4a6361', '#8ba8a2', '#c2d6d1'],
      borderWidth: 0,
      cutout: '72%',
      spacing: 2,
    },
  ],
}

const categories = [
  { name: 'Personal Loans',   amount: 'KES 85,000', pct: '68%', color: '#001d22' },
  { name: 'Business Loans',   amount: 'KES 25,000', pct: '20%', color: '#4a6361' },
  { name: 'Emergency Loans',  amount: 'KES 10,000', pct: '8%',  color: '#8ba8a2' },
  { name: 'Others',           amount: 'KES 5,000',  pct: '4%',  color: '#c2d6d1' },
]

/* ─── Recent Activity ─── */
const activities = [
  {
    icon: ShoppingCart,
    title: 'New Member Registered',
    subtitle: 'John Kamau  •  2 hours ago',
    badge: 'Member',
    badgeColor: '#001d22',
    badgeBg: '#e2edea',
  },
  {
    icon: HandCoins,
    title: 'Loan Application #1048',
    subtitle: 'Sarah Wambui  •  5 hours ago',
    badge: 'Pending',
    badgeColor: '#001d22',
    badgeBg: '#e2edea',
  },
  {
    icon: Wallet,
    title: 'Deposit Received',
    subtitle: 'David Mutua  •  1 day ago',
    badge: 'Savings',
    badgeColor: '#ffffff',
    badgeBg: '#001d22',
  },
]

/* ─── Top Loan Products ─── */
const products = [
  { name: 'Kipepeo Loan',    emoji: '🦋', stocks: '620', price: 'KES 50,000',  sales: '480', earnings: 'KES 24,000,000' },
  { name: 'Emergency Loan',  emoji: '🚑', stocks: '102', price: 'KES 10,000',  sales: '320', earnings: 'KES 3,200,000' },
  { name: 'Business Growth', emoji: '🏢', stocks: '150', price: 'KES 200,000', sales: '80',  earnings: 'KES 16,000,000' },
]
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-5 p-4 md:p-6 bg-background">

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="i in 4" :key="i"
          class="h-28 rounded-2xl border border-neutral-100 bg-white animate-pulse" />
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error"
      class="rounded-xl bg-red-50 border border-red-100 p-6 text-sm text-red-600 font-medium text-center">
      {{ error }}
    </div>

    <!-- Content -->
    <template v-else>
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Welcome back, Admin</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Here's what's happening with your SACCO today.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="stat in stats" :key="stat.title"
          class="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-start justify-between">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <component :is="stat.icon" class="h-5 w-5 text-[#001d22]" />
            </div>
            <div v-if="stat.trendUp !== null"
              :class="stat.trendUp ? 'text-green-600' : 'text-red-600'"
              class="flex items-center gap-0.5 text-xs font-medium">
              {{ stat.trend }}
              <TrendingUp v-if="stat.trendUp" class="h-3 w-3" />
            </div>
          </div>
          <div class="mt-4">
            <h3 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ stat.title }}</h3>
            <p class="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{{ stat.value }}</p>
            <p class="mt-1 text-xs text-neutral-400">{{ stat.subvalue }}</p>
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <!-- Bar chart -->
        <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="flex items-center gap-1.5 text-base font-semibold text-neutral-900 dark:text-white">
                📊 Loan Disbursement Revenue
              </h3>
              <div class="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                <span class="flex items-center gap-1.5">
                  <span class="inline-block h-2 w-2 rounded-[3px]" style="background:#001d22"></span>
                  Interest Earned
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="inline-block h-2 w-2 rounded-[3px]" style="background:#8ba8a2"></span>
                  Processing Fees
                </span>
              </div>
            </div>
            <div class="flex rounded-lg border border-neutral-200 bg-neutral-50 p-[3px] dark:border-neutral-700 dark:bg-neutral-800">
              <button v-for="p in periods" :key="p"
                class="rounded-md px-3 py-1 text-xs font-medium transition-all"
                :class="activePeriod === p
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-400 hover:text-neutral-600'"
                @click="activePeriod = p">
                {{ p }}
              </button>
            </div>
          </div>
          <div class="h-[280px]">
            <Bar :data="barChartData" :options="barChartOptions" />
          </div>
        </div>

        <!-- Doughnut chart -->
        <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Portfolio Mix</h3>
            <button class="text-[13px] font-medium text-neutral-500 hover:text-neutral-700">See All</button>
          </div>
          <div class="relative mx-auto h-[180px] w-[180px]">
            <Doughnut :data="doughnutData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }" />
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-[11px] text-neutral-400">Total Portfolio</span>
              <span class="text-sm font-bold text-neutral-900 dark:text-white">KES 125K</span>
            </div>
          </div>
          <div class="mt-5 space-y-2.5">
            <div v-for="cat in categories" :key="cat.name" class="flex items-center justify-between text-[13px]">
              <span class="flex items-center gap-2">
                <span class="inline-block h-2 w-2 rounded-full" :style="{ backgroundColor: cat.color }"></span>
                <span class="text-neutral-600 dark:text-neutral-300 text-xs">{{ cat.name }}</span>
              </span>
              <span class="flex items-center gap-3">
                <span class="font-medium text-neutral-800 dark:text-neutral-200 text-xs">{{ cat.amount }}</span>
                <span class="w-8 text-right font-semibold text-neutral-900 dark:text-white text-xs">{{ cat.pct }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom row -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- Recent Activity -->
        <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="flex items-center gap-1.5 text-base font-semibold text-neutral-900 dark:text-white">
              🕐 Recent Activity
            </h3>
            <button class="text-[13px] font-medium text-neutral-500 hover:text-neutral-700">See All</button>
          </div>
          <div class="space-y-1">
            <div v-for="act in activities" :key="act.title"
              class="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  :style="{ backgroundColor: act.badgeBg }">
                  <component :is="act.icon" :size="17" :stroke-width="2" :style="{ color: act.badgeColor }" />
                </div>
                <div>
                  <p class="text-[13px] font-semibold text-neutral-900 dark:text-white">{{ act.title }}</p>
                  <p class="text-[12px] text-neutral-400">{{ act.subtitle }}</p>
                </div>
              </div>
              <span class="shrink-0 rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
                :style="{ backgroundColor: act.badgeBg, color: act.badgeColor }">
                {{ act.badge }}
              </span>
            </div>
          </div>
        </div>

        <!-- Top Loan Products -->
        <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Top Loan Products</h3>
            <div class="flex items-center gap-3">
              <button class="flex items-center gap-1 text-[13px] text-neutral-400 hover:text-neutral-600">
                <ArrowUpDown :size="13" /> Sort
              </button>
              <button class="flex items-center gap-1 text-[13px] text-neutral-400 hover:text-neutral-600">
                <SlidersHorizontal :size="13" /> Filter
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-neutral-100 dark:border-neutral-700/50">
                  <th class="pb-2.5 text-[12px] font-medium text-neutral-400">Product</th>
                  <th class="pb-2.5 text-right text-[12px] font-medium text-neutral-400">Active</th>
                  <th class="pb-2.5 text-right text-[12px] font-medium text-neutral-400">Avg Value</th>
                  <th class="pb-2.5 text-right text-[12px] font-medium text-neutral-400">Count</th>
                  <th class="pb-2.5 text-right text-[12px] font-medium text-neutral-400">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(prod, idx) in products" :key="prod.name"
                  :class="idx < products.length - 1 ? 'border-b border-neutral-50 dark:border-neutral-800' : ''">
                  <td class="py-2.5">
                    <span class="flex items-center gap-2 text-[13px] font-medium text-neutral-900 dark:text-white">
                      <span class="text-base">{{ prod.emoji }}</span>{{ prod.name }}
                    </span>
                  </td>
                  <td class="py-2.5 text-right text-[13px] text-neutral-500">{{ prod.stocks }}</td>
                  <td class="py-2.5 text-right text-[13px] text-neutral-500">{{ prod.price }}</td>
                  <td class="py-2.5 text-right text-[13px] text-neutral-500">{{ prod.sales }}</td>
                  <td class="py-2.5 text-right text-[13px] font-semibold text-neutral-900 dark:text-white">{{ prod.earnings }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
