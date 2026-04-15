<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, Filter, Download, Printer, RotateCcw, AlertTriangle, TrendingUp } from 'lucide-vue-next'
import { Spinner, Pagination, formatMoneyValue, exportToExcel } from '@/Global'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  reportsApi,
  type AgingFilters,
  type AgingBucket,
  type AgingLoanRow,
  type AgingBucketRow,
  type AgingPortfolioTotals,
} from '@/tenant/apis/reports/reportsApi'
import { tenantClient } from '@/tenant/apis/tenantClient'

// ─── Filter state ─────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0]

const filters = ref<AgingFilters>({
  as_of_date: today,
  branch_id: null,
  loan_officer_id: null,
  loan_product_id: null,
  bucket: null,
  per_page: 25,
  page: 1,
})

// ─── Filter options ────────────────────────────────────────────────────────────
const showBranchFilter = ref(false)
const branches        = ref<{ id: number; name: string; code: string }[]>([])
const officers        = ref<{ id: number; name: string }[]>([])
const products        = ref<{ id: number; name: string }[]>([])

const BUCKET_OPTIONS: { value: AgingBucket | null; label: string }[] = [
  { value: null,     label: 'All Buckets' },
  { value: '1-30',   label: '1–30 Days'   },
  { value: '31-60',  label: '31–60 Days'  },
  { value: '61-90',  label: '61–90 Days'  },
  { value: '91-180', label: '91–180 Days' },
  { value: '180+',   label: '180+ Days'   },
]

// ─── Data state ───────────────────────────────────────────────────────────────
const loadingKpis  = ref(false)
const loadingTable = ref(false)

const rows   = ref<AgingLoanRow[]>([])
const total  = ref(0)
const lastPage = ref(1)

const buckets = ref<AgingBucketRow[]>([])
const totals  = ref<AgingPortfolioTotals>({
  loan_count: 0,
  arrears_loan_count: 0,
  total_arrears: 0,
  total_portfolio: 0,
  par_30: 0,
  par_90: 0,
  par_30_excl_rescheduled: 0,
  par_90_excl_rescheduled: 0,
  rescheduled_loan_count: 0,
  rescheduled_outstanding: 0,
  total_provision: 0,
})

// ─── Pagination links shape expected by <Pagination> ─────────────────────────
const paginationLinks = computed(() => ({
  current_page: filters.value.page ?? 1,
  last_page:    lastPage.value,
  per_page:     filters.value.per_page ?? 25,
  total:        total.value,
  from:         ((filters.value.page ?? 1) - 1) * (filters.value.per_page ?? 25) + 1,
  to:           Math.min((filters.value.page ?? 1) * (filters.value.per_page ?? 25), total.value),
}))

// ─── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchFilterOptions() {
  try {
    const [optRes, prodRes] = await Promise.all([
      reportsApi.filterOptions(),
      tenantClient.get('/loan-products', { params: { per_page: 200 } }),
    ])
    showBranchFilter.value = optRes.data?.show_branch_filter ?? false
    branches.value         = optRes.data?.branches ?? []
    officers.value         = optRes.data?.staff    ?? []
    products.value         = prodRes.data?.data?.data ?? prodRes.data?.data ?? []
  } catch {
    // non-critical — filters still work without options
  }
}

async function fetchPortfolioSummary() {
  loadingKpis.value = true
  try {
    const res = await reportsApi.agingPortfolioSummary({
      as_of_date:      filters.value.as_of_date,
      branch_id:       filters.value.branch_id,
      loan_officer_id: filters.value.loan_officer_id,
      loan_product_id: filters.value.loan_product_id,
    })
    buckets.value = res.data.buckets
    totals.value  = res.data.totals
  } finally {
    loadingKpis.value = false
  }
}

async function fetchTable() {
  loadingTable.value = true
  try {
    const res = await reportsApi.agingReport(filters.value)
    rows.value     = res.data.data
    total.value    = res.data.total
    lastPage.value = res.data.last_page
  } finally {
    loadingTable.value = false
  }
}

async function applyFilters() {
  filters.value.page = 1
  await Promise.all([fetchPortfolioSummary(), fetchTable()])
}

function onPageChange(page: number) {
  filters.value.page = page
  fetchTable()
}

function onPerPageChange(perPage: number) {
  filters.value.per_page = perPage
  filters.value.page     = 1
  fetchTable()
}

onMounted(async () => {
  await fetchFilterOptions()
  await Promise.all([fetchPortfolioSummary(), fetchTable()])
})

// ─── Reset filters ────────────────────────────────────────────────────────────
function resetFilters() {
  filters.value = {
    as_of_date:      today,
    branch_id:       null,
    loan_officer_id: null,
    loan_product_id: null,
    bucket:          null,
    per_page:        25,
    page:            1,
  }
  applyFilters()
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
function exportCsv() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportHelper = exportToExcel as (opts: { name: string; data: any[] }) => void
  exportHelper({
    name: `Loan-Aging-Report-${filters.value.as_of_date ?? today}`,
    data: rows.value.map((r) => ({
      'Loan No':              r.loan_no,
      'Member':               r.member_name,
      'Member No':            r.member_no,
      'Rescheduled':          r.is_rescheduled ? 'Yes' : 'No',
      'Product':              r.product_name,
      'Branch':               r.branch_name,
      'Loan Officer':         r.loan_officer_name,
      'Loan Principal':                r.principal,
      'Balance Outstanding':          r.balance_outstanding,
      'Outstanding Principal Balance': r.principal_balance_outstanding,
      'Current (Not Yet Due)':        r.current_not_yet_due,
      'Total Paid to Date':           r.total_paid_to_date,
      'Principal Arrears':            r.principal_arrears,
      'Interest Arrears':     r.interest_arrears,
      'Charges Arrears':      r.charges_arrears,
      'Penalty Arrears':      r.penalty_arrears,
      'Total Arrears':        r.total_arrears,
      'Arrears 1-30':         r.arrears_1_30,
      'Arrears 31-60':        r.arrears_31_60,
      'Arrears 61-90':        r.arrears_61_90,
      'Arrears 91-180':       r.arrears_91_180,
      'Arrears 180+':         r.arrears_180plus,
      'Days Past Due':        r.days_past_due,
      'Bucket':               bucketLabel(r.bucket),
      'Last Payment':         r.last_payment_date ?? '—',
    })),
  })
}

// ─── Export PDF ───────────────────────────────────────────────────────────────
function exportPdf() {
  const doc = new jsPDF('l', 'mm', 'a4')
  const asOf = filters.value.as_of_date ?? today

  doc.setFontSize(16)
  doc.text('Loan Aging Report', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`As of: ${asOf}   |   Generated: ${new Date().toLocaleString()}`, 14, 25)

  // Portfolio summary table
  doc.setFontSize(11)
  doc.setTextColor(40)
  doc.text('Portfolio Aging Summary', 14, 33)

  autoTable(doc, {
    startY: 37,
    head: [['Bucket', 'Loans', 'Principal', 'Interest', 'Charges', 'Penalty', 'Total Arrears', '% Portfolio', 'Prov. Rate', 'Provision Amt']],
    body: buckets.value.map((b) => [
      bucketLabel(b.bucket),
      b.loan_count,
      fmt(b.principal_arrears),
      fmt(b.interest_arrears),
      fmt(b.charges_arrears),
      fmt(b.penalty_arrears),
      fmt(b.total_arrears),
      fmtPct(b.portfolio_percentage),
      `${b.provision_rate}%`,
      fmt(b.provision_amount),
    ]),
    foot: [[
      'Total', `${totals.value.arrears_loan_count} in arrears / ${totals.value.loan_count} active`,
      fmt(buckets.value.reduce((s, b) => s + b.principal_arrears, 0)),
      fmt(buckets.value.reduce((s, b) => s + b.interest_arrears, 0)),
      fmt(buckets.value.reduce((s, b) => s + b.charges_arrears, 0)),
      fmt(buckets.value.reduce((s, b) => s + b.penalty_arrears, 0)),
      fmt(totals.value.total_arrears), '—', '—',
      fmt(totals.value.total_provision),
    ]],
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 8 },
    footStyles: { fillColor: [240, 240, 240], textColor: 40, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
  })

  // Loan detail table
  const afterSummary = (doc as any).lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.text('Loan Detail', 14, afterSummary)

  autoTable(doc, {
    startY: afterSummary + 4,
    head: [['Member', 'Loan No', 'Bal. Outstanding', 'Principal Bal.', 'Not Yet Due', 'Total Paid', 'Total Arrears', '1-30', '31-60', '61-90', '91-180', '180+', 'DPD', 'Bucket', 'Last Payment']],
    body: rows.value.map((r) => [
      r.member_name + (r.is_rescheduled ? ' [R]' : ''),
      r.loan_no,
      fmt(r.balance_outstanding),
      fmt(r.principal_balance_outstanding),
      fmt(r.current_not_yet_due),
      fmt(r.total_paid_to_date),
      fmt(r.total_arrears),
      fmt(r.arrears_1_30),
      fmt(r.arrears_31_60),
      fmt(r.arrears_61_90),
      fmt(r.arrears_91_180),
      fmt(r.arrears_180plus),
      r.days_past_due,
      bucketLabel(r.bucket),
      r.last_payment_date ?? '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
  })

  doc.save(`Loan-Aging-Report-${asOf}.pdf`)
}

// ─── Print ────────────────────────────────────────────────────────────────────
function printReport() {
  window.print()
}

// ─── Bucket styling ───────────────────────────────────────────────────────────
function bucketBadgeClass(bucket: AgingBucket): string {
  return {
    '1-30':   'bg-yellow-100  text-yellow-700  dark:bg-yellow-900/40  dark:text-yellow-400',
    '31-60':  'bg-orange-100  text-orange-700  dark:bg-orange-900/40  dark:text-orange-400',
    '61-90':  'bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-400',
    '91-180': 'bg-red-200     text-red-800     dark:bg-red-900/60     dark:text-red-300',
    '180+':   'bg-neutral-800 text-white        dark:bg-neutral-700    dark:text-neutral-100',
  }[bucket] ?? 'bg-neutral-100 text-neutral-600'
}

function bucketRowClass(bucket: AgingBucket): string {
  return {
    '1-30':   'bg-yellow-50/30  dark:bg-yellow-900/5',
    '31-60':  'bg-orange-50/40  dark:bg-orange-900/5',
    '61-90':  'bg-red-50/40     dark:bg-red-900/5',
    '91-180': 'bg-red-50/60     dark:bg-red-900/10',
    '180+':   'bg-red-100/60    dark:bg-red-900/20',
  }[bucket] ?? ''
}

function bucketTableRowClass(bucket: AgingBucket): string {
  return {
    '1-30':   'bg-yellow-50/50  dark:bg-yellow-900/10',
    '31-60':  'bg-orange-50/50  dark:bg-orange-900/10',
    '61-90':  'bg-red-50/50     dark:bg-red-900/10',
    '91-180': 'bg-red-50/70     dark:bg-red-900/15',
    '180+':   'bg-red-100/70    dark:bg-red-900/25',
  }[bucket] ?? ''
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: string | number | null | undefined): string {
  return formatMoneyValue(v ?? 0)
}

function fmtPct(v: number): string {
  return `${v.toFixed(2)}%`
}

function bucketLabel(bucket: AgingBucket): string {
  return BUCKET_OPTIONS.find((o) => o.value === bucket)?.label ?? bucket
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Loan Aging Report</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Overdue loans grouped by days past due (1–30, 31–60, 61–90, 91–180, 180+). PAR is calculated as outstanding balance of at-risk loans ÷ total portfolio.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          @click="exportCsv"
          class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Download class="h-4 w-4 text-emerald-600" />
          Excel
        </button>
        <button
          @click="exportPdf"
          class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Download class="h-4 w-4 text-rose-600" />
          PDF
        </button>
        <button
          @click="printReport"
          class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Printer class="h-4 w-4 text-blue-600" />
          Print
        </button>
      </div>
    </div>

    <!-- ── Filters ────────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
        <Filter class="h-4 w-4" />
        Filters
      </div>

      <!-- As of Date -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">As of Date</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            v-model="filters.as_of_date"
            type="date"
            class="rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>

      <!-- Branch -->
      <div v-if="showBranchFilter" class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">Branch</label>
        <select
          v-model="filters.branch_id"
          class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option :value="null">All Branches</option>
          <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </div>

      <!-- Loan Officer -->
      <div v-if="officers.length > 0" class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">Loan Officer</label>
        <select
          v-model="filters.loan_officer_id"
          class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option :value="null">All Officers</option>
          <option v-for="o in officers" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
      </div>

      <!-- Loan Product -->
      <div v-if="products.length > 0" class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">Product</label>
        <select
          v-model="filters.loan_product_id"
          class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option :value="null">All Products</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <!-- Bucket -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">Bucket</label>
        <select
          v-model="filters.bucket"
          class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option v-for="o in BUCKET_OPTIONS" :key="String(o.value)" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </div>

      <button
        @click="applyFilters"
        class="rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-nfuko-primary/90"
      >
        Apply
      </button>
      <button
        @click="resetFilters"
        class="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Reset
      </button>
    </div>

    <!-- ── KPI Cards ──────────────────────────────────────────────────────── -->
    <div v-if="loadingKpis" class="flex items-center justify-center py-10">
      <Spinner class="h-6 w-6 text-nfuko-primary" />
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <!-- Total Portfolio -->
        <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p class="text-xs font-medium uppercase tracking-wide text-neutral-400">Total Portfolio</p>
          <p class="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {{ fmt(totals.total_portfolio) }}
          </p>
          <p class="mt-1 text-xs text-neutral-400">
            {{ totals.arrears_loan_count }} in arrears · {{ totals.loan_count }} active
          </p>
        </div>

        <!-- Total Arrears -->
        <div class="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm dark:border-orange-900/30 dark:bg-orange-900/10">
          <p class="text-xs font-medium uppercase tracking-wide text-orange-500">Total Arrears</p>
          <p class="mt-2 text-2xl font-bold text-orange-700 dark:text-orange-400">
            {{ fmt(totals.total_arrears) }}
          </p>
          <p class="mt-1 text-xs text-orange-400">Required provision: {{ fmt(totals.total_provision) }}</p>
        </div>

        <!-- PAR 30 -->
        <div
          class="rounded-2xl border p-5 shadow-sm"
          :class="totals.par_30 > 5
            ? 'border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
            : 'border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium uppercase tracking-wide text-neutral-400">Portfolio at Risk (PAR) 30</p>
            <AlertTriangle
              v-if="totals.par_30 > 5"
              class="h-4 w-4 text-red-500"
            />
            <TrendingUp v-else class="h-4 w-4 text-emerald-500" />
          </div>
          <p
            class="mt-2 text-2xl font-bold"
            :class="totals.par_30 > 5 ? 'text-red-700 dark:text-red-400' : 'text-neutral-900 dark:text-white'"
          >
            {{ fmtPct(totals.par_30) }}
          </p>
          <p class="mt-1 text-xs text-neutral-400">Outstanding balance of loans with Days Past Due &gt; 30</p>
          <p v-if="totals.rescheduled_loan_count > 0" class="mt-1 text-xs text-neutral-400">
            Excl. rescheduled: <span class="font-medium">{{ fmtPct(totals.par_30_excl_rescheduled) }}</span>
          </p>
        </div>

        <!-- PAR 90 -->
        <div
          class="rounded-2xl border p-5 shadow-sm"
          :class="totals.par_90 > 2
            ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/15'
            : 'border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium uppercase tracking-wide text-neutral-400">PAR 90</p>
            <AlertTriangle
              v-if="totals.par_90 > 2"
              class="h-4 w-4 text-red-600"
            />
            <TrendingUp v-else class="h-4 w-4 text-emerald-500" />
          </div>
          <p
            class="mt-2 text-2xl font-bold"
            :class="totals.par_90 > 2 ? 'text-red-800 dark:text-red-300' : 'text-neutral-900 dark:text-white'"
          >
            {{ fmtPct(totals.par_90) }}
          </p>
          <p class="mt-1 text-xs text-neutral-400">Outstanding balance of loans with DPD &gt; 90</p>
          <p v-if="totals.rescheduled_loan_count > 0" class="mt-1 text-xs text-neutral-400">
            Excl. rescheduled: <span class="font-medium">{{ fmtPct(totals.par_90_excl_rescheduled) }}</span>
          </p>
        </div>
      </div>

      <!-- Rescheduled loans notice (only shown when relevant) -->
      <div
        v-if="totals.rescheduled_loan_count > 0"
        class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800/40 dark:bg-amber-900/10"
      >
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <span class="text-amber-800 dark:text-amber-300">
          <strong>{{ totals.rescheduled_loan_count }} rescheduled loan{{ totals.rescheduled_loan_count === 1 ? '' : 's' }}</strong>
          ({{ fmt(totals.rescheduled_outstanding) }} outstanding) are included in the PAR figures above.
          Regulatory PAR includes rescheduled loans; the "Excl. rescheduled" figures reflect organic portfolio health.
        </span>
      </div>

      <!-- ── Bucket Summary Table ──────────────────────────────────────────── -->
      <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Portfolio Aging Summary</h2>
          <p class="text-xs text-neutral-400">Arrears and provisioning by aging bucket.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-neutral-50 dark:bg-neutral-800/40">
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Bucket</th>
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
              <tr
                v-for="b in buckets"
                :key="b.bucket"
                class="transition-colors"
                :class="bucketTableRowClass(b.bucket)"
              >
                <td class="px-6 py-3">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="bucketBadgeClass(b.bucket)"
                  >
                    {{ bucketLabel(b.bucket) }}
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
                <td class="px-6 py-3 text-right text-neutral-900 dark:text-white">
                  <span class="block">{{ totals.arrears_loan_count }} in arrears</span>
                  <span class="block text-xs text-neutral-500 dark:text-neutral-400">{{ totals.loan_count }} active</span>
                </td>
                <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">
                  {{ fmt(buckets.reduce((s, b) => s + b.principal_arrears, 0)) }}
                </td>
                <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">
                  {{ fmt(buckets.reduce((s, b) => s + b.interest_arrears, 0)) }}
                </td>
                <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">
                  {{ fmt(buckets.reduce((s, b) => s + b.charges_arrears, 0)) }}
                </td>
                <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">
                  {{ fmt(buckets.reduce((s, b) => s + b.penalty_arrears, 0)) }}
                </td>
                <td class="px-6 py-3 text-right font-mono text-neutral-900 dark:text-white">{{ fmt(totals.total_arrears) }}</td>
                <td class="px-6 py-3 text-right text-neutral-900 dark:text-white">—</td>
                <td class="px-6 py-3 text-right text-neutral-900 dark:text-white">—</td>
                <td class="px-6 py-3 text-right font-mono text-orange-700 dark:text-orange-400">{{ fmt(totals.total_provision) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Loan-Level Detail Table ───────────────────────────────────────── -->
      <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Loan Detail</h2>
          <p class="text-xs text-neutral-400">
            Individual loan arrears breakdown.
            <span v-if="total > 0" class="font-medium text-neutral-500">{{ total }} loans found.</span>
          </p>
        </div>

        <div v-if="loadingTable" class="flex items-center justify-center py-14">
          <Spinner class="h-6 w-6 text-nfuko-primary" />
        </div>

        <template v-else>
          <div v-if="rows.length === 0" class="flex flex-col items-center justify-center gap-2 py-14">
            <p class="text-sm font-medium text-neutral-500">No overdue loans found for the selected filters.</p>
            <p class="text-xs text-neutral-400">Try adjusting the date or removing a filter.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-neutral-50 dark:bg-neutral-800/40">
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Member</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Loan No</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Product</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Branch</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Officer</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400" title="Total outstanding (schedule) | Principal balance | Not yet due">Bal. Outstanding</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400" title="Overdue total | Principal arrears / Interest arrears">Total Arrears</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Arrears by Bucket</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">DPD</th>
                  <th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Worst Bucket</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400" title="Last payment date | Cumulative amount paid to date">Payment Info</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                <RouterLink
                  v-for="row in rows"
                  :key="row.loan_id"
                  :to="{ name: 'tenant-loan-account', params: { id: row.loan_id } }"
                  custom
                  v-slot="{ navigate }"
                >
              <tr
                  class="cursor-pointer transition-colors hover:brightness-95"
                  :class="bucketRowClass(row.bucket)"
                  @click="navigate"
                >
                  <!-- Member -->
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-1.5">
                      <span class="font-medium text-neutral-900 dark:text-white">{{ row.member_name }}</span>
                      <span
                        v-if="row.is_rescheduled"
                        class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        title="This loan was created by rescheduling an earlier loan"
                      >R</span>
                    </div>
                    <div class="text-xs text-neutral-400">{{ row.member_no }}</div>
                  </td>

                  <!-- Loan No -->
                  <td class="px-5 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    {{ row.loan_no }}
                  </td>

                  <!-- Product -->
                  <td class="px-5 py-3 text-neutral-600 dark:text-neutral-400">{{ row.product_name }}</td>

                  <!-- Branch -->
                  <td class="px-5 py-3 text-neutral-600 dark:text-neutral-400">{{ row.branch_name }}</td>

                  <!-- Officer -->
                  <td class="px-5 py-3 text-neutral-600 dark:text-neutral-400">{{ row.loan_officer_name }}</td>

                  <!-- Balance Outstanding (from schedule) -->
                  <td class="px-5 py-3 text-right">
                    <div class="font-mono font-medium text-neutral-900 dark:text-white">
                      {{ fmt(row.balance_outstanding) }}
                    </div>
                    <div class="mt-0.5 text-xs text-neutral-400">
                      Princ: {{ fmt(row.principal_balance_outstanding) }}
                    </div>
                    <div v-if="Number(row.current_not_yet_due) > 0" class="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                      Not due: {{ fmt(row.current_not_yet_due) }}
                    </div>
                  </td>

                  <!-- Total Arrears with P/I breakdown -->
                  <td class="px-5 py-3 text-right">
                    <div class="font-mono font-semibold text-red-700 dark:text-red-400">
                      {{ fmt(row.total_arrears) }}
                    </div>
                    <div class="mt-0.5 text-right text-xs text-neutral-400">
                      P:{{ fmt(row.principal_arrears) }}
                      / I:{{ fmt(row.interest_arrears) }}
                    </div>
                  </td>

                  <!-- Arrears by Bucket breakdown -->
                  <td class="px-5 py-3 text-right text-xs text-neutral-500 dark:text-neutral-400">
                    <template v-if="Number(row.arrears_1_30) > 0">
                      <div class="text-yellow-700 dark:text-yellow-400">1–30: {{ fmt(row.arrears_1_30) }}</div>
                    </template>
                    <template v-if="Number(row.arrears_31_60) > 0">
                      <div class="text-orange-600 dark:text-orange-400">31–60: {{ fmt(row.arrears_31_60) }}</div>
                    </template>
                    <template v-if="Number(row.arrears_61_90) > 0">
                      <div class="text-red-600 dark:text-red-400">61–90: {{ fmt(row.arrears_61_90) }}</div>
                    </template>
                    <template v-if="Number(row.arrears_91_180) > 0">
                      <div class="text-red-700 dark:text-red-300">91–180: {{ fmt(row.arrears_91_180) }}</div>
                    </template>
                    <template v-if="Number(row.arrears_180plus) > 0">
                      <div class="font-semibold text-neutral-800 dark:text-neutral-200">180+: {{ fmt(row.arrears_180plus) }}</div>
                    </template>
                  </td>

                  <!-- DPD -->
                  <td class="px-5 py-3 text-right font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                    {{ row.days_past_due }}
                  </td>

                  <!-- Worst bucket badge -->
                  <td class="px-5 py-3 text-center">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      :class="bucketBadgeClass(row.bucket)"
                    >
                      {{ bucketLabel(row.bucket) }}
                    </span>
                  </td>

                  <!-- Payment Info: last date + total paid -->
                  <td class="px-5 py-3 text-right">
                    <div class="text-xs text-neutral-500 dark:text-neutral-400">
                      Last: {{ row.last_payment_date ?? '—' }}
                    </div>
                    <div class="mt-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Paid: {{ fmt(row.total_paid_to_date) }}
                    </div>
                  </td>
                </tr>
              </RouterLink>
              </tbody>
            </table>

            <!-- Pagination -->
            <Pagination
              :links="paginationLinks as any"
              :page="filters.page"
              :per-page="filters.per_page"
              @change="onPageChange"
              @update:page="onPageChange"
              @update:per-page="onPerPageChange"
            />
          </div>
        </template>
      </div>
    </template>

  </div>
</template>

<style>
@media print {
  /* Hide everything outside the report content */
  body > *:not(#app) { display: none !important; }
  nav, aside, header, footer,
  .sidebar, [data-sidebar],
  button, .no-print { display: none !important; }

  /* Let the report fill the page */
  #app, .flex-col { overflow: visible !important; }
  * { box-shadow: none !important; }

  table { page-break-inside: auto; }
  tr    { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }
}
</style>
