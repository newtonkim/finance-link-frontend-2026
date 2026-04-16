<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Calendar, Filter, Download, RotateCcw, ChevronDown, ChevronRight, ExternalLink } from 'lucide-vue-next'
import { Spinner, Pagination, formatMoneyValue } from '@/Global'
import { RouterLink } from 'vue-router'
import {
  reportsApi,
  type ArrearsFilters,
  type ArrearsTrendFilters,
  type ArrearsLoanRow,
  type ArrearsComparisonResponse,
  type ArrearsTrendPoint,
  type ArrearsInstallmentRow,
} from '@/tenant/apis/reports/reportsApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

// ─── State ────────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]

const filters = ref<ArrearsFilters & { months: 3 | 6 | 12 }>({
  as_of_date:      today,
  branch_id:       null,
  loan_officer_id: null,
  per_page:        25,
  page:            1,
  months:          12,
})

const showBranchFilter  = ref(false)
const branches          = ref<{ id: number; name: string }[]>([])
const officers          = ref<{ id: number; name: string }[]>([])

const selectedCard = ref<'today' | 'one_month_ago' | 'three_months_ago'>('today')

const loading             = ref(false)
const loadingInstallments = ref(false)
const exporting           = ref(false)
const error               = ref<string | null>(null)

const loans              = ref<ArrearsLoanRow[]>([])
const meta               = ref<Meta>({ current_page: 1, last_page: 1, per_page: 25, total: 0, from: 1, to: 0 })
const comparisonData     = ref<ArrearsComparisonResponse | null>(null)
const trendData          = ref<ArrearsTrendPoint[]>([])
const expandedLoanId     = ref<number | null>(null)
const installmentCache   = ref<Map<number, ArrearsInstallmentRow[]>>(new Map())
const expandError        = ref<string | null>(null)

// ─── Filter options ───────────────────────────────────────────────────────────

async function loadFilterOptions() {
  try {
    const res = await reportsApi.filterOptions()
    showBranchFilter.value = res.data.filters?.options?.show_branch_filter
      ?? res.data.show_branch_filter
      ?? false
    branches.value  = res.data.filters?.options?.branches ?? res.data.branches ?? []
    officers.value  = res.data.filters?.options?.staff    ?? res.data.staff    ?? []
  } catch {
    // filter options are non-critical — silently ignore
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchAll() {
  loading.value = true
  error.value   = null
  try {
    const trendFilters: ArrearsTrendFilters = {
      as_of_date:      filters.value.as_of_date,
      branch_id:       filters.value.branch_id,
      loan_officer_id: filters.value.loan_officer_id,
      months:          filters.value.months,
    }

    const isHistorical = selectedCard.value !== 'today'
    const tableFilters = {
      ...filters.value,
      ...(isHistorical ? { historical: true } : {}),
      as_of_date: selectedCard.value === 'one_month_ago'
        ? comparisonData.value?.one_month_ago.date ?? filters.value.as_of_date
        : selectedCard.value === 'three_months_ago'
          ? comparisonData.value?.three_months_ago.date ?? filters.value.as_of_date
          : filters.value.as_of_date,
    }

    const [loansRes, compRes, trendRes] = await Promise.all([
      reportsApi.loanArrears(tableFilters),
      reportsApi.loanArrearsComparison(filters.value),
      reportsApi.loanArrearsTrend(trendFilters),
    ])

    loans.value          = loansRes.data.loans.data
    meta.value           = loansRes.data.loans.meta
    comparisonData.value = compRes.data
    trendData.value      = trendRes.data
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load arrears report.'
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  filters.value.page = 1
  selectedCard.value = 'today'
  installmentCache.value.clear()
  expandedLoanId.value = null
  await fetchAll()
}

function resetFilters() {
  filters.value = { as_of_date: today, branch_id: null, loan_officer_id: null, per_page: 25, page: 1, months: 12 }
  selectedCard.value = 'today'
  applyFilters()
}

async function selectCard(card: 'today' | 'one_month_ago' | 'three_months_ago') {
  if (selectedCard.value === card) return
  selectedCard.value = card
  filters.value.page = 1
  installmentCache.value.clear()
  expandedLoanId.value = null
  await fetchAll()
}

async function onPageChange(p: number) {
  filters.value.page = p
  await fetchAll()
}

// ─── Row expand ───────────────────────────────────────────────────────────────

async function toggleExpand(loanId: number) {
  if (expandedLoanId.value === loanId) {
    expandedLoanId.value = null
    return
  }
  expandedLoanId.value = loanId
  expandError.value    = null

  if (installmentCache.value.has(loanId)) return

  loadingInstallments.value = true
  try {
    const res = await reportsApi.loanArrearsInstallments(loanId, filters.value.as_of_date ?? today)
    installmentCache.value.set(loanId, res.data)
  } catch {
    expandError.value = 'Failed to load installment detail.'
  } finally {
    loadingInstallments.value = false
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

async function exportExcel() {
  exporting.value = true
  try {
    const res = await reportsApi.loanArrearsExport({
      as_of_date:      filters.value.as_of_date,
      branch_id:       filters.value.branch_id,
      loan_officer_id: filters.value.loan_officer_id,
    })
    const url  = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href  = url
    link.download = `loan-arrears-report-${filters.value.as_of_date}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('Export failed. Please try again.')
  } finally {
    exporting.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) { return formatMoneyValue(v) }

function daysColor(days: number): string {
  if (days > 90)  return 'text-red-700 font-bold'
  if (days > 30)  return 'text-red-500 font-semibold'
  return 'text-orange-500 font-semibold'
}

function missedColor(count: number): string {
  return count >= 3
    ? 'bg-red-100 text-red-700'
    : 'bg-orange-100 text-orange-700'
}

function pctChange(historical: number, current: number): string {
  if (historical === 0) return '—'
  const pct = ((current - historical) / historical) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
}

function pctColor(historical: number, current: number): string {
  if (historical === 0) return 'text-neutral-400'
  return current > historical ? 'text-red-600' : 'text-green-600'
}

// ─── Trend chart ─────────────────────────────────────────────────────────────

const trendMax = computed(() =>
  Math.max(...trendData.value.map((p) => p.total_arrears), 1)
)

function barHeight(v: number): string {
  return Math.round((v / trendMax.value) * 80) + 'px'
}

// ─── Mount ────────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadFilterOptions()
  await fetchAll()
})
</script>

<template>
  <div class="flex flex-col gap-6 p-4 md:p-6">

    <!-- ── Page Header ──────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Loan Arrears Report</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Loans formally in arrears — overdue installments, contact info, and trend analysis
          <template v-if="filters.as_of_date"> as of <strong>{{ filters.as_of_date }}</strong></template>
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
        :disabled="exporting || loading"
        @click="exportExcel"
      >
        <Spinner v-if="exporting" class="h-4 w-4" />
        <Download v-else class="h-4 w-4" />
        Export Excel
      </button>
    </div>

    <!-- ── Filter Bar ───────────────────────────────────────────────────── -->
    <div class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">As of Date</label>
          <input
            v-model="filters.as_of_date"
            type="date"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>

        <div v-if="showBranchFilter" class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Branch</label>
          <select
            v-model="filters.branch_id"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="null">All Branches</option>
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Loan Officer</label>
          <select
            v-model="filters.loan_officer_id"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="null">All Officers</option>
            <option v-for="o in officers" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Trend Period</label>
          <select
            v-model="filters.months"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="12">Last 12 Months</option>
            <option :value="6">Last 6 Months</option>
            <option :value="3">Last 3 Months</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            class="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            @click="applyFilters"
          >
            <Filter class="h-3.5 w-3.5" /> Apply
          </button>
          <button
            class="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
            @click="resetFilters"
          >
            <RotateCcw class="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>

    <!-- ── Error banner ─────────────────────────────────────────────────── -->
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- ── Loading skeleton ─────────────────────────────────────────────── -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-8 w-8 text-blue-500" />
    </div>

    <template v-else>

      <!-- ── ① Comparison Cards ──────────────────────────────────────────── -->
      <div v-if="comparisonData" class="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <!-- Today -->
        <div
          class="rounded-xl border-2 cursor-pointer p-5 transition-all bg-white dark:bg-neutral-800"
          :class="selectedCard === 'today' ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : 'border-neutral-200 dark:border-neutral-700 hover:border-red-300'"
          @click="selectCard('today')"
        >
          <div class="mb-3 text-[10px] font-bold uppercase tracking-wider text-red-500">
            Today — {{ comparisonData.today.date }}
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Loans in Arrears</span>
              <span class="text-base font-bold text-neutral-900 dark:text-white">{{ comparisonData.today.loan_count }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Total Arrears</span>
              <span class="text-base font-bold text-red-600">{{ fmt(comparisonData.today.total_arrears) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Principal Arrears</span>
              <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{{ fmt(comparisonData.today.principal_arrears) }}</span>
            </div>
          </div>
        </div>

        <!-- 1 Month Ago -->
        <div
          class="rounded-xl border-2 cursor-pointer p-5 transition-all bg-white dark:bg-neutral-800"
          :class="selectedCard === 'one_month_ago' ? 'border-orange-400 ring-2 ring-orange-100 dark:ring-orange-900' : 'border-neutral-200 dark:border-neutral-700 hover:border-orange-300'"
          @click="selectCard('one_month_ago')"
        >
          <div class="mb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            1 Month Ago — {{ comparisonData.one_month_ago.date }}
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Loans in Arrears</span>
              <span class="text-base font-bold text-neutral-900 dark:text-white">{{ comparisonData.one_month_ago.loan_count }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Total Arrears</span>
              <span class="text-base font-bold text-orange-500">{{ fmt(comparisonData.one_month_ago.total_arrears) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Principal Arrears</span>
              <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{{ fmt(comparisonData.one_month_ago.principal_arrears) }}</span>
            </div>
          </div>
          <div class="mt-3 border-t border-neutral-100 pt-2 text-xs dark:border-neutral-700"
               :class="pctColor(comparisonData.one_month_ago.total_arrears, comparisonData.today.total_arrears)">
            {{ pctChange(comparisonData.one_month_ago.total_arrears, comparisonData.today.total_arrears) }} vs today
          </div>
        </div>

        <!-- 3 Months Ago -->
        <div
          class="rounded-xl border-2 cursor-pointer p-5 transition-all bg-white dark:bg-neutral-800"
          :class="selectedCard === 'three_months_ago' ? 'border-orange-300 ring-2 ring-orange-100 dark:ring-orange-900' : 'border-neutral-200 dark:border-neutral-700 hover:border-orange-200'"
          @click="selectCard('three_months_ago')"
        >
          <div class="mb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            3 Months Ago — {{ comparisonData.three_months_ago.date }}
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Loans in Arrears</span>
              <span class="text-base font-bold text-neutral-900 dark:text-white">{{ comparisonData.three_months_ago.loan_count }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Total Arrears</span>
              <span class="text-base font-bold text-orange-400">{{ fmt(comparisonData.three_months_ago.total_arrears) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Principal Arrears</span>
              <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{{ fmt(comparisonData.three_months_ago.principal_arrears) }}</span>
            </div>
          </div>
          <div class="mt-3 border-t border-neutral-100 pt-2 text-xs dark:border-neutral-700"
               :class="pctColor(comparisonData.three_months_ago.total_arrears, comparisonData.today.total_arrears)">
            {{ pctChange(comparisonData.three_months_ago.total_arrears, comparisonData.today.total_arrears) }} vs today
          </div>
        </div>
      </div>

      <!-- ── ② Trend Chart ───────────────────────────────────────────────── -->
      <div v-if="trendData.length" class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
        <div class="mb-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          Monthly Arrears Trend
        </div>
        <div class="flex items-end gap-1.5 overflow-x-auto pb-2" style="min-height: 100px;">
          <div
            v-for="(point, idx) in trendData"
            :key="point.month"
            class="flex flex-1 min-w-[28px] flex-col items-center gap-1"
          >
            <span class="text-[9px] text-neutral-400">{{ fmt(point.total_arrears).replace(/,\d+$/, '') }}</span>
            <div
              class="w-full rounded-t transition-all"
              :class="idx === trendData.length - 1 ? 'bg-nfuko-chart-main hover:bg-nfuko-primary-800' : 'bg-nfuko-chart-sub hover:bg-nfuko-primary-400'"
              :style="{ height: barHeight(point.total_arrears) }"
              :title="`${point.label}: ${fmt(point.total_arrears)} · ${point.loan_count} loans`"
            />
            <span class="text-[9px] text-neutral-400">{{ point.label.split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <!-- ── ③ Empty state ───────────────────────────────────────────────── -->
      <div
        v-if="!loading && loans.length === 0"
        class="rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center dark:border-green-800 dark:bg-green-950"
      >
        <p class="text-base font-semibold text-green-700 dark:text-green-300">No loans in arrears</p>
        <p class="mt-1 text-sm text-green-500">as of {{ filters.as_of_date }}</p>
      </div>

      <!-- ── ④ Loans Table ───────────────────────────────────────────────── -->
      <div v-if="loans.length > 0" class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div class="border-b border-neutral-100 px-5 py-3 dark:border-neutral-700 flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Arrears Loans — {{ meta.total }} loan{{ meta.total !== 1 ? 's' : '' }}
          </span>
          <span v-if="selectedCard !== 'today'" class="text-[11px] text-orange-600 font-semibold">
            Showing as of
            {{ selectedCard === 'one_month_ago' ? comparisonData?.one_month_ago.date : comparisonData?.three_months_ago.date }}
            <button class="ml-2 underline text-blue-500" @click="selectCard('today')">Back to Today</button>
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 dark:bg-neutral-700/40">
              <tr>
                <th class="w-8 px-3 py-3"></th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Member</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Phone</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan Officer</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Arrears Amt</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Missed</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Days</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Last Payment</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="loan in loans" :key="loan.loan_id">
                <!-- Main row -->
                <tr
                  class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/30"
                  :class="expandedLoanId === loan.loan_id ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''"
                  @click="toggleExpand(loan.loan_id)"
                >
                  <td class="px-3 py-3 text-neutral-400">
                    <ChevronDown v-if="expandedLoanId === loan.loan_id" class="h-4 w-4 text-yellow-600" />
                    <ChevronRight v-else class="h-4 w-4" />
                  </td>
                  <td class="px-4 py-3">
                    <RouterLink
                      :to="`/tenant/members/${loan.member_id}`"
                      class="font-semibold text-neutral-900 hover:text-blue-600 dark:text-white"
                      @click.stop
                    >{{ loan.member_name }}</RouterLink>
                    <div class="text-xs text-neutral-400">{{ loan.member_number }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <RouterLink
                      :to="`/tenant/loans/${loan.loan_id}`"
                      class="flex items-center gap-1 font-medium text-blue-600 hover:underline"
                      @click.stop
                    >
                      {{ loan.loan_no }}
                      <ExternalLink class="h-3 w-3" />
                    </RouterLink>
                  </td>
                  <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">{{ loan.phone || '—' }}</td>
                  <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">{{ loan.loan_officer_name }}</td>
                  <td class="px-4 py-3 text-right font-bold text-red-600">{{ fmt(loan.total_arrears) }}</td>
                  <td class="px-4 py-3 text-center">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      :class="missedColor(loan.missed_installments)"
                    >{{ loan.missed_installments }}</span>
                  </td>
                  <td class="px-4 py-3 text-center" :class="daysColor(loan.days_in_arrears)">
                    {{ loan.days_in_arrears }}
                  </td>
                  <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                    {{ loan.last_payment_date ?? '—' }}
                  </td>
                </tr>

                <!-- Expanded installment detail -->
                <tr v-if="expandedLoanId === loan.loan_id" class="border-b border-yellow-100 bg-yellow-50/60 dark:border-yellow-900/30 dark:bg-yellow-900/5">
                  <td colspan="9" class="px-8 pb-4 pt-2">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                      Overdue Installments
                    </div>

                    <div v-if="loadingInstallments && !installmentCache.has(loan.loan_id)" class="py-4 text-sm text-neutral-400">
                      <Spinner class="mr-2 inline h-4 w-4" /> Loading…
                    </div>

                    <div v-else-if="expandError" class="text-sm text-red-600">
                      {{ expandError }}
                      <button class="ml-2 underline" @click="toggleExpand(loan.loan_id)">Retry</button>
                    </div>

                    <table v-else class="w-auto text-xs">
                      <thead>
                        <tr class="bg-amber-100/60 dark:bg-amber-900/20">
                          <th class="px-3 py-1.5 text-left font-semibold text-amber-800">Inst. #</th>
                          <th class="px-3 py-1.5 text-left font-semibold text-amber-800">Due Date</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Outstanding Principal</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Outstanding Interest</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Outstanding Charges</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Outstanding Penalty</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Total Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="inst in installmentCache.get(loan.loan_id) ?? []"
                          :key="inst.installment_no"
                          class="border-b border-amber-100 dark:border-amber-900/20"
                        >
                          <td class="px-3 py-1.5 text-neutral-600">#{{ inst.installment_no }}</td>
                          <td class="px-3 py-1.5 text-neutral-600">{{ inst.due_date }}</td>
                          <td class="px-3 py-1.5 text-right text-red-600">{{ fmt(inst.principal_shortfall) }}</td>
                          <td class="px-3 py-1.5 text-right text-red-600">{{ fmt(inst.interest_shortfall) }}</td>
                          <td class="px-3 py-1.5 text-right text-red-600">{{ fmt(inst.charges_shortfall) }}</td>
                          <td class="px-3 py-1.5 text-right text-red-600">{{ fmt(inst.penalty_shortfall) }}</td>
                          <td class="px-3 py-1.5 text-right font-bold text-red-700">{{ fmt(inst.total_shortfall) }}</td>
                        </tr>
                        <tr v-if="(installmentCache.get(loan.loan_id) ?? []).length === 0">
                          <td colspan="7" class="px-3 py-2 text-neutral-400 italic">No overdue installments found.</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="border-t border-neutral-100 px-5 py-3 dark:border-neutral-700">
          <div class="flex items-center justify-between">
            <span class="text-xs text-neutral-400">
              Showing {{ meta.from }}–{{ meta.to }} of {{ meta.total }} loans
            </span>
            <Pagination
              :current-page="meta.current_page"
              :last-page="meta.last_page"
              @change="onPageChange"
            />
          </div>
        </div>
      </div>

    </template>
  </div>
</template>
