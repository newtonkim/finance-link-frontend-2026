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
  HandCoins,
  Clock,
  TrendingUp,
  PiggyBank,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { formatMoneyValue } from '@/Global'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { useCurrencyStore } from '@/stores/currency'

const currencyStore = useCurrencyStore()

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

interface PortfolioItem {
  label: string
  value: number
}

interface LeaderMember {
  id: number
  name: string
  member_number: string
  total_balance?: number
  deposit_count?: number
  total_deposited?: number
  total_borrowed?: number
  loan_count?: number
}

interface Metrics {
  total_members: number
  active_members: number
  total_staff: number
  total_withdrawals: number
  total_deposits: number
  gender_ratio: { male: number; female: number }
  portfolio_mix: PortfolioItem[]
  leaderboards: {
    savers_by_value: LeaderMember[]
    savers_by_frequency: LeaderMember[]
    borrowers_by_value: LeaderMember[]
    borrowers_by_frequency: LeaderMember[]
  }
  savings_summary: { total_deposits: number; active_accounts: number }
  loans_summary: { active_loans: number; total_outstanding: number; pending_applications: number }
}

const metrics = ref<Metrics | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

function formatCount(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString()
}

function formatMoney(value: number | string | null | undefined) {
  return `${currencyStore.currencyCode} ${formatMoneyValue(value ?? 0)}`
}

onMounted(async () => {
  try {
    const { data } = await tenantClient.get('/dashboard')
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
      value: formatCount(metrics.value.total_members),
      subvalue: `${metrics.value.active_members} active`,
      icon: Users,
      trend: '+12.5%',
      trendUp: true,
      accent: 'bg-blue-50 dark:bg-blue-950/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Number of Accounts',
      value: formatCount(metrics.value.savings_summary.active_accounts),
      subvalue: 'Savings accounts open',
      icon: BarChart3,
      trend: '',
      trendUp: null,
      accent: 'bg-violet-50 dark:bg-violet-950/40',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Savings Balance',
      value: formatMoney(metrics.value.savings_summary.total_deposits),
      subvalue: 'Total deposits held',
      icon: PiggyBank,
      trend: '+8.2%',
      trendUp: true,
      accent: 'bg-emerald-50 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Total Withdrawals',
      value: formatMoney(metrics.value.total_withdrawals),
      subvalue: 'All time withdrawals',
      icon: ArrowDownLeft,
      trend: '',
      trendUp: null,
      accent: 'bg-rose-50 dark:bg-rose-950/40',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      title: 'Total Deposits',
      value: formatMoney(metrics.value.total_deposits),
      subvalue: 'All time deposits',
      icon: ArrowUpRight,
      trend: '',
      trendUp: null,
      accent: 'bg-teal-50 dark:bg-teal-950/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Active Loans',
      value: formatMoney(metrics.value.loans_summary.total_outstanding),
      subvalue: `${metrics.value.loans_summary.active_loans} loans running`,
      icon: HandCoins,
      trend: '-2.4%',
      trendUp: false,
      accent: 'bg-orange-50 dark:bg-orange-950/40',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Pending Loans',
      value: String(metrics.value.loans_summary.pending_applications),
      subvalue: 'Awaiting review',
      icon: Clock,
      trend: '',
      trendUp: null,
      accent: 'bg-amber-50 dark:bg-amber-950/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]
})

/* ─── Gender Ratio ─── */
const genderRatio = computed(() => {
  const g = metrics.value?.gender_ratio
  if (!g) return { male: 0, female: 0, malePct: 50, femalePct: 50 }
  const total = g.male + g.female
  if (total === 0) return { male: 0, female: 0, malePct: 50, femalePct: 50 }
  return {
    male: g.male,
    female: g.female,
    malePct: Math.round((g.male / total) * 100),
    femalePct: Math.round((g.female / total) * 100),
  }
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
      backgroundColor: ' bg-nfuko-primary',
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
    tooltip: { backgroundColor: ' bg-nfuko-primary', padding: 12, cornerRadius: 10 },
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

/* ─── Leaderboards ─── */
type SaverTab = 'value' | 'frequency'
type BorrowerTab = 'value' | 'frequency'
const saverTab = ref<SaverTab>('value')
const borrowerTab = ref<BorrowerTab>('value')

// Score = normalised value rank (0–100) + normalised frequency rank (0–100), averaged
function computeOverall(
  byValue: LeaderMember[],
  byFreq: LeaderMember[],
  valueKey: keyof LeaderMember,
  freqKey: keyof LeaderMember,
): { id: number; name: string; member_number: string; score: number; valueLabel: string; freqLabel: string }[] {
  const allIds = [...new Set([...byValue.map(m => m.id), ...byFreq.map(m => m.id)])]
  const maxValue = Math.max(...byValue.map(m => Number(m[valueKey]) || 0)) || 1
  const maxFreq  = Math.max(...byFreq.map(m => Number(m[freqKey]) || 0)) || 1

  return allIds.map(id => {
    const vEntry = byValue.find(m => m.id === id)
    const fEntry = byFreq.find(m => m.id === id)
    const member = vEntry ?? fEntry!
    const vScore = vEntry ? (Number(vEntry[valueKey]) / maxValue) * 100 : 0
    const fScore = fEntry ? (Number(fEntry[freqKey]) / maxFreq) * 100 : 0
    return {
      id,
      name: member.name,
      member_number: member.member_number,
      score: Math.round((vScore + fScore) / 2),
      valueLabel: vEntry ? formatMoneyValue(vEntry[valueKey] ?? 0) : '—',
      freqLabel:  fEntry ? String(fEntry[freqKey]) : '—',
    }
  }).sort((a, b) => b.score - a.score).slice(0, 5)
}

const overallBestSavers = computed(() => {
  const lb = metrics.value?.leaderboards
  if (!lb) return []
  return computeOverall(lb.savers_by_value, lb.savers_by_frequency, 'total_balance', 'deposit_count')
})

const overallBestBorrowers = computed(() => {
  const lb = metrics.value?.leaderboards
  if (!lb) return []
  return computeOverall(lb.borrowers_by_value, lb.borrowers_by_frequency, 'total_borrowed', 'loan_count')
})

const topSaver = computed(() => overallBestSavers.value[0] ?? null)
const topBorrower = computed(() => overallBestBorrowers.value[0] ?? null)

const maxSaverBalance = computed(() =>
  Number(metrics.value?.leaderboards?.savers_by_value?.[0]?.total_balance ?? 1) || 1
)
const maxBorrowerValue = computed(() =>
  Number(metrics.value?.leaderboards?.borrowers_by_value?.[0]?.total_borrowed ?? 1) || 1
)

/* ─── Portfolio Mix Doughnut ─── */
const PALETTE = [
  '#39B588', // nfuko-action        — Members
  '#739387', // nfuko-primary-400   — Savings Accounts
  '#A8C2B8', // nfuko-chart-sub     — Savings Products
  '#0A2318', // nfuko-primary       — Deposits
  '#D3E0DB', // nfuko-chart-pie-4   — Withdrawals
  '#4B6B5F', // nfuko-primary-500   — Charges
]

const doughnutData = computed(() => {
  const items = metrics.value?.portfolio_mix ?? []
  return {
    labels: items.map(i => i.label),
    datasets: [
      {
        data: items.map(i => i.value),
        backgroundColor: PALETTE.slice(0, items.length),
        borderWidth: 0,
        cutout: '72%',
        spacing: 2,
      },
    ],
  }
})

const categories = computed(() => {
  const items = metrics.value?.portfolio_mix ?? []
  const total = items.reduce((s, i) => s + i.value, 0)
  return items.map((item, idx) => ({
    name: item.label,
    value: item.value,
    pct: total > 0 ? Math.round((item.value / total) * 100) + '%' : '0%',
    color: PALETTE[idx] ?? '#ccc',
  }))
})

const portfolioTotal = computed(() => {
  const items = metrics.value?.portfolio_mix ?? []
  return items.reduce((s, i) => s + i.value, 0)
})

</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-5 p-4 md:p-6 bg-background">

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <div v-for="i in 9" :key="i"
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

      <!-- Stats Grid: 1 → 2 → 3 → 4 cols -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <div v-for="stat in stats" :key="stat.title"
          class="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-start justify-between">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl" :class="stat.accent">
              <component :is="stat.icon" class="h-4 w-4" :class="stat.iconColor" />
            </div>
            <div v-if="stat.trendUp !== null"
              :class="stat.trendUp ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'"
              class="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold">
              <TrendingUp v-if="stat.trendUp" class="h-2.5 w-2.5" />
              {{ stat.trend }}
            </div>
          </div>
          <div class="mt-3">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{{ stat.title }}</p>
            <p class="mt-1 truncate text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{{ stat.value }}</p>
            <p class="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{{ stat.subvalue }}</p>
          </div>
        </div>

        <!-- Gender Ratio card -->
        <div class="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl" style="background-color: rgba(10,35,24,0.08)">
            <Users class="h-4 w-4" style="color: #0A2318" />
          </div>
          <div class="mt-3">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Gender Ratio</p>
            <div class="mt-1 flex items-end gap-1.5">
              <span class="text-xl font-bold tracking-tight" style="color: #0A2318">{{ genderRatio.malePct }}%</span>
              <span class="mb-0.5 text-[11px] text-neutral-400">:</span>
              <span class="text-xl font-bold tracking-tight" style="color: #39B588">{{ genderRatio.femalePct }}%</span>
            </div>
            <div class="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full">
              <div class="h-full transition-all duration-500" style="background-color: #0A2318" :style="{ width: genderRatio.malePct + '%' }" />
              <div class="h-full transition-all duration-500" style="background-color: #39B588" :style="{ width: genderRatio.femalePct + '%' }" />
            </div>
            <div class="mt-1.5 flex items-center justify-between text-[11px] text-neutral-400">
              <span class="flex items-center gap-1">
                <span class="inline-block h-1.5 w-1.5 rounded-full" style="background-color: #0A2318"></span>
                Male · {{ genderRatio.male }}
              </span>
              <span class="flex items-center gap-1">
                Female · {{ genderRatio.female }}
                <span class="inline-block h-1.5 w-1.5 rounded-full" style="background-color: #39B588"></span>
              </span>
            </div>
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
                  <span class="inline-block h-2 w-2 rounded-[3px]" style="background: bg-nfuko-primary"></span>
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
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">SACCO Overview</h3>
          </div>
          <div class="relative mx-auto h-[180px] w-[180px]">
            <Doughnut :data="doughnutData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }" />
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-[11px] text-neutral-400">Total</span>
              <span class="text-sm font-bold text-neutral-900 dark:text-white">
                {{ formatCount(portfolioTotal) }}
              </span>
            </div>
          </div>
          <div class="mt-5 space-y-2">
            <div v-for="cat in categories" :key="cat.name" class="flex items-center justify-between">
              <span class="flex items-center gap-2">
                <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full" :style="{ backgroundColor: cat.color }"></span>
                <span class="text-xs text-neutral-600 dark:text-neutral-300">{{ cat.name }}</span>
              </span>
              <span class="flex items-center gap-3">
                <span class="text-xs font-medium text-neutral-700 dark:text-neutral-200">
                  {{ formatCount(cat.value) }}
                </span>
                <span class="w-9 text-right text-xs font-semibold text-neutral-900 dark:text-white">{{ cat.pct }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Leaderboards row -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">

        <!-- ── Best Savers ── -->
        <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Best Savers</h3>
            <!-- Tab switcher -->
            <div class="flex rounded-lg border border-neutral-200 bg-neutral-50 p-[3px] dark:border-neutral-700 dark:bg-neutral-800">
              <button v-for="tab in ([{ key: 'value', label: 'By Value' }, { key: 'frequency', label: 'By Frequency' }] as const)"
                :key="tab.key"
                class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all"
                :class="saverTab === tab.key
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-400 hover:text-neutral-600'"
                @click="saverTab = tab.key">
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- By Value list -->
          <template v-if="saverTab === 'value'">
            <div v-if="!metrics?.leaderboards?.savers_by_value?.length"
              class="py-8 text-center text-xs text-neutral-400">No data yet</div>
            <div v-else class="space-y-3">
              <div v-for="(member, idx) in metrics!.leaderboards.savers_by_value" :key="member.id" class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      :style="{ backgroundColor: idx === 0 ? '#0A2318' : idx === 1 ? '#739387' : '#A8C2B8' }">
                      {{ idx + 1 }}
                    </span>
                    <div>
                      <p class="text-[13px] font-semibold text-neutral-900 dark:text-white leading-tight">{{ member.name }}</p>
                      <p class="text-[11px] text-neutral-400">{{ member.member_number }}</p>
                    </div>
                  </div>
                  <span class="text-[13px] font-bold text-neutral-900 dark:text-white">
                    {{ formatMoney(member.total_balance) }}
                  </span>
                </div>
                <!-- Proportional bar -->
                <div class="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div class="h-full rounded-full transition-all duration-500"
                    style="background-color: #39B588"
                    :style="{ width: (Number(member.total_balance) / maxSaverBalance * 100) + '%' }" />
                </div>
              </div>
            </div>
          </template>

          <!-- By Frequency list -->
          <template v-else>
            <div v-if="!metrics?.leaderboards?.savers_by_frequency?.length"
              class="py-8 text-center text-xs text-neutral-400">No data yet</div>
            <div v-else class="space-y-3">
              <div v-for="(member, idx) in metrics!.leaderboards.savers_by_frequency" :key="member.id" class="flex items-center gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  :style="{ backgroundColor: idx === 0 ? '#0A2318' : idx === 1 ? '#739387' : '#A8C2B8' }">
                  {{ idx + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="truncate text-[13px] font-semibold text-neutral-900 dark:text-white">{{ member.name }}</p>
                    <span class="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                      style="background-color: #0A2318">
                      {{ member.deposit_count }}x
                    </span>
                  </div>
                  <p class="text-[11px] text-neutral-400">
                    {{ formatMoney(member.total_deposited) }} total deposited
                  </p>
                </div>
              </div>
            </div>
          </template>

          <!-- Overall Best Saver -->
          <div v-if="topSaver" class="mt-5 rounded-xl p-3" style="background-color: rgba(10,35,24,0.05)">
            <p class="mb-2 text-[10px] font-bold uppercase tracking-wider" style="color: #0A2318">Overall Best Saver</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style="background-color: #0A2318">1</span>
                <div>
                  <p class="text-[13px] font-bold text-neutral-900 dark:text-white">{{ topSaver?.name }}</p>
                  <p class="text-[11px] text-neutral-400">{{ topSaver?.member_number }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[11px] text-neutral-400">Balance · {{ currencyStore.currencyCode }} {{ topSaver?.valueLabel }}</p>
                <p class="text-[11px] text-neutral-400">Deposits · {{ topSaver?.freqLabel }}x</p>
              </div>
            </div>
            <div class="mt-2.5 flex items-center gap-2">
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div class="h-full rounded-full" style="background-color: #39B588; width: 100%" />
              </div>
              <span class="text-[11px] font-bold" style="color: #0A2318">{{ topSaver?.score }}%</span>
            </div>
          </div>
        </div>

        <!-- ── Best Borrowers ── -->
        <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Best Borrowers</h3>
            <div class="flex rounded-lg border border-neutral-200 bg-neutral-50 p-[3px] dark:border-neutral-700 dark:bg-neutral-800">
              <button v-for="tab in ([{ key: 'value', label: 'By Value' }, { key: 'frequency', label: 'By Frequency' }] as const)"
                :key="tab.key"
                class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all"
                :class="borrowerTab === tab.key
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-400 hover:text-neutral-600'"
                @click="borrowerTab = tab.key">
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- By Value list -->
          <template v-if="borrowerTab === 'value'">
            <div v-if="!metrics?.leaderboards?.borrowers_by_value?.length"
              class="py-8 text-center text-xs text-neutral-400">No loan data yet</div>
            <div v-else class="space-y-3">
              <div v-for="(member, idx) in metrics!.leaderboards.borrowers_by_value" :key="member.id" class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      :style="{ backgroundColor: idx === 0 ? '#0A2318' : idx === 1 ? '#739387' : '#A8C2B8' }">
                      {{ idx + 1 }}
                    </span>
                    <div>
                      <p class="text-[13px] font-semibold text-neutral-900 dark:text-white leading-tight">{{ member.name }}</p>
                      <p class="text-[11px] text-neutral-400">{{ member.member_number }} · {{ member.loan_count }} loan{{ member.loan_count === 1 ? '' : 's' }}</p>
                    </div>
                  </div>
                  <span class="text-[13px] font-bold text-neutral-900 dark:text-white">
                    {{ formatMoney(member.total_borrowed) }}
                  </span>
                </div>
                <div class="h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div class="h-full rounded-full transition-all duration-500"
                    style="background-color: #39B588"
                    :style="{ width: (Number(member.total_borrowed) / maxBorrowerValue * 100) + '%' }" />
                </div>
              </div>
            </div>
          </template>

          <!-- By Frequency list -->
          <template v-else>
            <div v-if="!metrics?.leaderboards?.borrowers_by_frequency?.length"
              class="py-8 text-center text-xs text-neutral-400">No loan data yet</div>
            <div v-else class="space-y-3">
              <div v-for="(member, idx) in metrics!.leaderboards.borrowers_by_frequency" :key="member.id" class="flex items-center gap-2.5">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  :style="{ backgroundColor: idx === 0 ? '#0A2318' : idx === 1 ? '#739387' : '#A8C2B8' }">
                  {{ idx + 1 }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="truncate text-[13px] font-semibold text-neutral-900 dark:text-white">{{ member.name }}</p>
                    <span class="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                      style="background-color: #0A2318">
                      {{ member.loan_count }}x
                    </span>
                  </div>
                  <p class="text-[11px] text-neutral-400">
                    {{ formatMoney(member.total_borrowed) }} total borrowed
                  </p>
                </div>
              </div>
            </div>
          </template>

          <!-- Overall Best Borrower -->
          <div v-if="topBorrower" class="mt-5 rounded-xl p-3" style="background-color: rgba(10,35,24,0.05)">
            <p class="mb-2 text-[10px] font-bold uppercase tracking-wider" style="color: #0A2318">Overall Best Borrower</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style="background-color: #0A2318">1</span>
                <div>
                  <p class="text-[13px] font-bold text-neutral-900 dark:text-white">{{ topBorrower?.name }}</p>
                  <p class="text-[11px] text-neutral-400">{{ topBorrower?.member_number }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[11px] text-neutral-400">Borrowed · {{ currencyStore.currencyCode }} {{ topBorrower?.valueLabel }}</p>
                <p class="text-[11px] text-neutral-400">Loans taken · {{ topBorrower?.freqLabel }}x</p>
              </div>
            </div>
            <div class="mt-2.5 flex items-center gap-2">
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div class="h-full rounded-full" style="background-color: #39B588; width: 100%" />
              </div>
              <span class="text-[11px] font-bold" style="color: #0A2318">{{ topBorrower?.score }}%</span>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>
