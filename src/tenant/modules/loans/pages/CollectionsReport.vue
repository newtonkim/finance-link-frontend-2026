<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Calendar, Download, Filter, RotateCcw, ChevronDown, ChevronRight, Printer } from 'lucide-vue-next'
import { Spinner, formatMoneyValue } from '@/Global'
import {
  reportsApi,
  type CollectionsFilters,
  type CollectionsLoanRow,
  type CollectionsLoansResponse,
  type CollectionsMethodRow,
  type CollectionsPeriodType,
  type CollectionsSummaryResponse,
  type CollectionsSummaryRow,
  type CollectionsTransactionRow,
} from '@/tenant/apis/reports/reportsApi'
import { saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi'
import { useTenantContextStore } from '@/stores/tenantContext'

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

const PERIOD_TYPES: CollectionsPeriodType[] = ['Date Range', 'Month', 'As of Date']

type SummaryTab = 'officer' | 'branch' | 'method'

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function deriveMonthDateRange(month: string): { date_from: string; date_to: string } {
  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthNumber = Number(monthText)

  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    const fallbackMonth = getCurrentMonth()
    return deriveMonthDateRange(fallbackMonth)
  }

  const firstDay = `${year}-${String(monthNumber).padStart(2, '0')}-01`
  const lastDayNumber = new Date(year, monthNumber, 0).getDate()
  const lastDay = `${year}-${String(monthNumber).padStart(2, '0')}-${String(lastDayNumber).padStart(2, '0')}`

  return { date_from: firstDay, date_to: lastDay }
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const today = formatLocalDate(new Date())
const defaultMonth = getCurrentMonth()
const defaultMonthRange = deriveMonthDateRange(defaultMonth)

const filters = ref({
  period_type: 'Month' as CollectionsPeriodType,
  date_from: defaultMonthRange.date_from,
  date_to: defaultMonthRange.date_to,
  month: defaultMonth,
  as_of_date: today,
  branch_id: null as number | null,
  loan_officer_id: null as number | null,
  per_page: 10,
  page: 1,
})

const tenantStore = useTenantContextStore()
const tenant = tenantStore.currentTenant as any

const showBranchFilter = ref(false)
const branches = ref<{ id: number; name: string }[]>([])
const officers = ref<{ id: number; name: string }[]>([])

const loading = ref(false)
const loadingSummary = ref(false)
const loadingLoans = ref(false)
const exporting = ref(false)
const isPrinting = ref(false)
const error = ref<string | null>(null)

const activeTab = ref<SummaryTab>('officer')

const summary = ref<CollectionsSummaryResponse>({
  by_officer: [],
  by_branch: [],
  by_method: [],
  totals: {
    amount_due: 0,
    amount_collected: 0,
    collection_rate: 0,
    outstanding_balance: 0,
    transaction_count: 0,
  },
})

const loans = ref<CollectionsLoanRow[]>([])
const meta = ref<Meta>({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: null,
  to: null,
})

const expandedLoanId = ref<number | null>(null)
const transactionCache = reactive(new Map<number, CollectionsTransactionRow[]>())
const transactionLoading = reactive(new Set<number>())
const transactionErrors = reactive(new Map<number, string>())

const hasSummaryRows = computed(() => {
  return (
    summary.value.by_officer.length > 0 ||
    summary.value.by_branch.length > 0 ||
    summary.value.by_method.length > 0
  )
})

const showEmptyState = computed(() => {
  return !loading.value && !error.value && !hasSummaryRows.value && loans.value.length === 0
})

const canGoPrev = computed(() => meta.value.current_page > 1)
const canGoNext = computed(() => meta.value.current_page < meta.value.last_page)

const fromRecord = computed(() => {
  if (meta.value.total === 0) return 0
  if (meta.value.from !== null) return meta.value.from
  return (meta.value.current_page - 1) * meta.value.per_page + 1
})

const toRecord = computed(() => {
  if (meta.value.total === 0) return 0
  if (meta.value.to !== null) return meta.value.to
  return (meta.value.current_page - 1) * meta.value.per_page + loans.value.length
})

function getRateClass(rate: number): string {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 50) return 'text-orange-500'
  return 'text-red-600'
}

function fmt(value: unknown): string {
  return formatMoneyValue(toNumber(value))
}

function fmtRate(value: unknown): string {
  return `${toNumber(value).toFixed(1)}%`
}

function normalizeDateRange() {
  if (filters.value.period_type === 'Month') {
    const range = deriveMonthDateRange(filters.value.month)
    filters.value.date_from = range.date_from
    filters.value.date_to = range.date_to
    return
  }

  if (filters.value.period_type === 'As of Date') {
    filters.value.date_from = '2000-01-01'
    filters.value.date_to = filters.value.as_of_date || today
    return
  }

  if (!filters.value.date_from) {
    filters.value.date_from = defaultMonthRange.date_from
  }

  if (!filters.value.date_to) {
    filters.value.date_to = defaultMonthRange.date_to
  }

  if (filters.value.date_from > filters.value.date_to) {
    const currentFrom = filters.value.date_from
    filters.value.date_from = filters.value.date_to
    filters.value.date_to = currentFrom
  }
}

function buildBaseFilters(): Omit<CollectionsFilters, 'per_page' | 'page'> {
  normalizeDateRange()

  return {
    period_type: filters.value.period_type,
    date_from: filters.value.date_from,
    date_to: filters.value.date_to,
    branch_id: filters.value.branch_id,
    loan_officer_id: filters.value.loan_officer_id,
  }
}

function buildLoansFilters(): CollectionsFilters {
  return {
    ...buildBaseFilters(),
    per_page: filters.value.per_page,
    page: filters.value.page,
  }
}

function resetTransactionState() {
  expandedLoanId.value = null
  transactionCache.clear()
  transactionLoading.clear()
  transactionErrors.clear()
}

function loanCountTotal(rows: CollectionsSummaryRow[]): number {
  return rows.reduce((sum, row) => sum + toNumber(row.loan_count), 0)
}

function summaryDisplayName(row: CollectionsSummaryRow, tab: SummaryTab): string {
  if (tab === 'officer') {
    return row.loan_officer_name || row.name || 'Unassigned'
  }

  if (tab === 'branch') {
    return row.branch_name || row.name || 'Unassigned'
  }

  return row.name || '—'
}

function methodName(row: CollectionsMethodRow): string {
  return row.payment_method || 'Unknown'
}

function isExpanded(loanId: number): boolean {
  return expandedLoanId.value === loanId
}

function isTransactionLoading(loanId: number): boolean {
  return transactionLoading.has(loanId)
}

function transactionError(loanId: number): string | null {
  return transactionErrors.get(loanId) ?? null
}

function transactionRows(loanId: number): CollectionsTransactionRow[] {
  return transactionCache.get(loanId) ?? []
}

function normalizeLoansPayload(payload: unknown): CollectionsLoansResponse {
  const fallback: CollectionsLoansResponse = {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: filters.value.per_page, total: 0, from: null, to: null },
  }

  function fromUnknown(candidate: unknown): CollectionsLoansResponse | null {
    if (!candidate || typeof candidate !== 'object') return null
    const rowSet = candidate as Record<string, unknown>
    const dataRows = Array.isArray(rowSet.data) ? (rowSet.data as CollectionsLoanRow[]) : null
    const metaData = rowSet.meta

    if (!dataRows || !metaData || typeof metaData !== 'object') return null

    const metaRow = metaData as Record<string, unknown>
    return {
      data: dataRows,
      meta: {
        current_page: toNumber(metaRow.current_page) || 1,
        last_page: toNumber(metaRow.last_page) || 1,
        per_page: toNumber(metaRow.per_page) || filters.value.per_page,
        total: toNumber(metaRow.total),
        from: metaRow.from === null || metaRow.from === undefined ? null : toNumber(metaRow.from),
        to: metaRow.to === null || metaRow.to === undefined ? null : toNumber(metaRow.to),
      },
    }
  }

  const direct = fromUnknown(payload)
  if (direct) return direct

  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const payloadObject = payload as Record<string, unknown>

  if ('loans' in payloadObject) {
    const nested = fromUnknown(payloadObject.loans)
    if (nested) return nested
  }

  return fallback
}

async function loadFilterOptions() {
  try {
    const res = await reportsApi.filterOptions()
    showBranchFilter.value = res.data.filters?.options?.show_branch_filter
      ?? res.data.show_branch_filter
      ?? false

    branches.value = res.data.filters?.options?.branches ?? res.data.branches ?? []
    officers.value = res.data.filters?.options?.staff ?? res.data.staff ?? []
  } catch {
    // filter options are non-critical
  }
}

async function fetchSummary() {
  loadingSummary.value = true
  try {
    const res = await reportsApi.collectionsSummary(buildBaseFilters())
    summary.value = {
      by_officer: res.data.by_officer ?? [],
      by_branch: res.data.by_branch ?? [],
      by_method: res.data.by_method ?? [],
      totals: {
        amount_due: toNumber(res.data.totals?.amount_due),
        amount_collected: toNumber(res.data.totals?.amount_collected),
        collection_rate: toNumber(res.data.totals?.collection_rate),
        outstanding_balance: toNumber(res.data.totals?.outstanding_balance),
        transaction_count: toNumber(res.data.totals?.transaction_count),
      },
    }
  } finally {
    loadingSummary.value = false
  }
}

async function fetchLoans() {
  loadingLoans.value = true
  try {
    const res = await reportsApi.collectionsLoans(buildLoansFilters())
    const normalized = normalizeLoansPayload(res.data)
    loans.value = normalized.data ?? []
    meta.value = {
      current_page: normalized.meta?.current_page ?? 1,
      last_page: normalized.meta?.last_page ?? 1,
      per_page: normalized.meta?.per_page ?? filters.value.per_page,
      total: normalized.meta?.total ?? 0,
      from: normalized.meta?.from ?? null,
      to: normalized.meta?.to ?? null,
    }
  } finally {
    loadingLoans.value = false
  }
}

async function fetchReport() {
  loading.value = true
  error.value = null

  try {
    await Promise.all([fetchSummary(), fetchLoans()])
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load collections report.'
    summary.value.by_officer = []
    summary.value.by_branch = []
    summary.value.by_method = []
    loans.value = []
    meta.value = {
      current_page: 1,
      last_page: 1,
      per_page: filters.value.per_page,
      total: 0,
      from: null,
      to: null,
    }
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  filters.value.page = 1
  resetTransactionState()
  await fetchReport()
}

async function resetFilters() {
  filters.value = {
    period_type: 'Month',
    date_from: defaultMonthRange.date_from,
    date_to: defaultMonthRange.date_to,
    month: defaultMonth,
    as_of_date: today,
    branch_id: null,
    loan_officer_id: null,
    per_page: 10,
    page: 1,
  }
  activeTab.value = 'officer'
  resetTransactionState()
  await fetchReport()
}

async function goToPage(page: number) {
  if (page < 1 || page > meta.value.last_page || page === meta.value.current_page) {
    return
  }

  filters.value.page = page
  resetTransactionState()

  loading.value = true
  error.value = null
  try {
    await fetchLoans()
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load collections report.'
  } finally {
    loading.value = false
  }
}

async function fetchLoanTransactions(loanId: number) {
  if (transactionLoading.has(loanId)) return

  transactionLoading.add(loanId)
  transactionErrors.delete(loanId)

  try {
    const res = await reportsApi.collectionsLoanTransactions(loanId, buildBaseFilters())
    transactionCache.set(loanId, res.data ?? [])
  } catch {
    transactionErrors.set(loanId, 'Failed to load transactions for this loan.')
  } finally {
    transactionLoading.delete(loanId)
  }
}

async function toggleExpand(loanId: number) {
  if (expandedLoanId.value === loanId) {
    expandedLoanId.value = null
    return
  }

  expandedLoanId.value = loanId

  if (transactionCache.has(loanId)) {
    return
  }

  await fetchLoanTransactions(loanId)
}

async function retryTransactions(loanId: number) {
  await fetchLoanTransactions(loanId)
}

async function exportExcel() {
  exporting.value = true
  try {
    const params = buildBaseFilters()
    const res = await reportsApi.collectionsExport(params)
    const blobUrl = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `loan-collections-report-${params.date_from}-to-${params.date_to}.xlsx`
    link.click()
    URL.revokeObjectURL(blobUrl)
  } catch {
    alert('Export failed. Please try again.')
  } finally {
    exporting.value = false
  }
}

async function printReport() {
  isPrinting.value = true
  try {
    const params = buildBaseFilters()
    // Fetch full data for printing (up to 2000 records)
    const res = await reportsApi.collectionsLoans({ ...params, per_page: 2000, page: 1 })
    const normalized = normalizeLoansPayload(res.data)
    const allLoans = normalized.data || []

    const tenantEmail = tenant?.settings?.email || ''
    const tenantPhone = tenant?.settings?.phone || tenant?.settings?.phone_number || tenant?.settings?.tel || tenant?.settings?.contact_phone || ''
    const tenantAddress = tenant?.settings?.address || ''
    const saccoName = saccoBrandingState.sacco_name || tenant?.name || 'SACCO'

    const renderSummaryTable = (title: string, data: any[], type: 'general' | 'method') => {
      if (type === 'method') {
        const rowsHtml = data.map(item => `
          <tr>
            <td style="text-align: left">${item.payment_method || 'Unknown'}</td>
            <td>${item.transaction_count}</td>
            <td>${fmt(item.amount_collected)}</td>
          </tr>
        `).join('')
        return `
          <div class="summary-box">
            <h3>${title}</h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left">Method</th>
                  <th>Transactions</th>
                  <th>Collected</th>
                </tr>
              </thead>
              <tbody>${rowsHtml || '<tr><td colspan="3">No data</td></tr>'}</tbody>
            </table>
          </div>
        `
      }

      const rowsHtml = data.map(item => `
        <tr>
          <td style="text-align: left">${summaryDisplayName(item, activeTab.value === 'method' ? 'officer' : activeTab.value)}</td>
          <td>${item.loan_count}</td>
          <td>${fmt(item.amount_due)}</td>
          <td>${fmt(item.amount_collected)}</td>
          <td>${fmtRate(item.collection_rate)}</td>
          <td>${fmt(item.outstanding_balance)}</td>
        </tr>
      `).join('')

      return `
        <div class="summary-box">
          <h3>${title}</h3>
          <table>
            <thead>
              <tr>
                <th style="text-align: left">Entity</th>
                <th>Loans</th>
                <th>Due</th>
                <th>Collected</th>
                <th>Rate</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>${rowsHtml || '<tr><td colspan="6">No data</td></tr>'}</tbody>
          </table>
        </div>
      `
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Loan Collections Report</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 24px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 4px;}
  h3 { font-size: 12px; margin-bottom: 8px; color: #333; }
  .summaries { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 24px; }
  .summary-box { flex: 1; min-width: 45%; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #f5f5f5; }
  th { padding: 6px 8px; text-align: right; font-size: 10px; text-transform: uppercase; color: #444; border-bottom: 2px solid #ddd; }
  td { padding: 6px 8px; text-align: right; border-bottom: 1px solid #eee; }
  .brand-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #333; padding-bottom: 12px; margin-bottom: 24px; }
  .brand-info { display: flex; gap: 16px; }
  .brand-logo { max-height: 55px; max-width: 120px; object-fit: contain; }
  .brand-text h1 { margin: 0; padding: 0; font-size: 18px; color: #111; }
  .brand-contacts { text-align: right; }
  .brand-contacts p { margin: 2px 0; color: #444; font-size: 10px; }
  .totals-row { background: #f9f9f9; font-weight: bold; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <div class="brand-header">
    <div class="brand-info">
      ${saccoBrandingState.logo_url ? `<img src="${saccoBrandingState.logo_url}" class="brand-logo" />` : ''}
      <div class="brand-text">
        <h1>${saccoName}</h1>
        ${saccoBrandingState.tagline ? `<p style="margin: 2px 0; color: #666; font-size: 10px; text-transform: uppercase;">${saccoBrandingState.tagline}</p>` : ''}
      </div>
    </div>
    <div class="brand-contacts">
      ${tenantAddress ? `<p>${tenantAddress}</p>` : ''}
      ${tenantPhone ? `<p>Tel: ${tenantPhone}</p>` : ''}
      ${tenantEmail ? `<p>Email: ${tenantEmail}</p>` : ''}
      <p style="margin-top: 8px; font-weight: bold; color: #111;">LOAN COLLECTIONS REPORT</p>
    </div>
  </div>

  <p style="margin-top: -12px; font-style: italic; color: #666;">Collections for ${params.date_from} to ${params.date_to}</p>

  <div style="background: #eef2ff; padding: 12px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-around;">
    <div style="text-align: center"><small style="text-transform: uppercase; color: #555">Total Due</small><div style="font-size: 14px; font-weight: bold">${fmt(summary.value.totals.amount_due)}</div></div>
    <div style="text-align: center"><small style="text-transform: uppercase; color: #555">Total Collected</small><div style="font-size: 14px; font-weight: bold; color: #059669">${fmt(summary.value.totals.amount_collected)}</div></div>
    <div style="text-align: center"><small style="text-transform: uppercase; color: #555">Collection Rate</small><div style="font-size: 14px; font-weight: bold; color: #2563eb">${fmtRate(summary.value.totals.collection_rate)}</div></div>
    <div style="text-align: center"><small style="text-transform: uppercase; color: #555">Transactions</small><div style="font-size: 14px; font-weight: bold">${summary.value.totals.transaction_count}</div></div>
  </div>

  <h2>Summary Breakdowns</h2>
  <div class="summaries">
    ${renderSummaryTable('By Loan Officer', summary.value.by_officer, 'general')}
    ${renderSummaryTable('By Branch', summary.value.by_branch, 'general')}
    ${renderSummaryTable('By Payment Method', summary.value.by_method, 'method')}
  </div>

  <h2>Loan-Level Collections</h2>
  <table>
    <thead>
      <tr>
        <th style="text-align: left">Member / Loan No</th>
        <th style="text-align: left">Officer</th>
        <th>Due</th>
        <th>Collected</th>
        <th>Rate</th>
        <th>Outstanding</th>
        <th>DPD</th>
      </tr>
    </thead>
    <tbody>
      ${allLoans.map(row => `
        <tr>
          <td style="text-align: left">
            <strong>${row.member_name}</strong><br/>
            <small>${row.loan_no}</small>
          </td>
          <td style="text-align: left">${row.loan_officer_name || '—'}</td>
          <td>${fmt(row.amount_due)}</td>
          <td>${fmt(row.amount_collected)}</td>
          <td>${fmtRate(row.collection_rate)}</td>
          <td>${fmt(row.outstanding_balance)}</td>
          <td style="text-align: center">${row.days_in_arrears}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  } catch (err: any) {
    console.error("Print failed", err)
    alert("Failed to prepare print document. Please try again.")
  } finally {
    isPrinting.value = false
  }
}

onMounted(async () => {
  await loadFilterOptions()
  await fetchReport()
})
</script>

<template>
  <div class="flex flex-col gap-6 p-4 md:p-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Loan Collections Report</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Period-level collections summary and loan-level payment detail
          <span class="font-semibold text-neutral-700 dark:text-neutral-300">
            ({{ filters.date_from }} to {{ filters.date_to }})
          </span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          :disabled="isPrinting || loading"
          @click="printReport"
        >
          <Spinner v-if="isPrinting" class="h-4 w-4" />
          <Printer v-else class="h-4 w-4" />
          Print
        </button>

        <button
          class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
          :disabled="exporting || loading"
          @click="exportExcel"
        >
          <Spinner v-if="exporting" class="h-4 w-4" />
          <Download v-else class="h-4 w-4" />
          Export Excel
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
          <Filter class="h-4 w-4" /> Filters
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Period Type</label>
          <select
            v-model="filters.period_type"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option v-for="periodType in PERIOD_TYPES" :key="periodType" :value="periodType">
              {{ periodType }}
            </option>
          </select>
        </div>

        <template v-if="filters.period_type === 'Date Range'">
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Date From</label>
            <div class="relative">
              <Calendar class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                v-model="filters.date_from"
                type="date"
                class="rounded-md border border-neutral-300 py-1.5 pl-9 pr-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Date To</label>
            <div class="relative">
              <Calendar class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                v-model="filters.date_to"
                type="date"
                class="rounded-md border border-neutral-300 py-1.5 pl-9 pr-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              />
            </div>
          </div>
        </template>

        <div v-else-if="filters.period_type === 'Month'" class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Month</label>
          <input
            v-model="filters.month"
            type="month"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>

        <div v-else class="flex flex-col gap-1">
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
            <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Loan Officer</label>
          <select
            v-model="filters.loan_officer_id"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="null">All Officers</option>
            <option v-for="officer in officers" :key="officer.id" :value="officer.id">{{ officer.name }}</option>
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

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-if="loading && !hasSummaryRows && loans.length === 0" class="flex items-center justify-center py-14">
      <Spinner class="h-8 w-8 text-blue-500" />
    </div>

    <template v-else>
      <div class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div class="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="rounded-md px-3 py-1.5 text-sm font-semibold transition"
              :class="activeTab === 'officer' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
              @click="activeTab = 'officer'"
            >
              By Loan Officer
            </button>
            <button
              class="rounded-md px-3 py-1.5 text-sm font-semibold transition"
              :class="activeTab === 'branch' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
              @click="activeTab = 'branch'"
            >
              By Branch
            </button>
            <button
              class="rounded-md px-3 py-1.5 text-sm font-semibold transition"
              :class="activeTab === 'method' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
              @click="activeTab = 'method'"
            >
              By Payment Method
            </button>
          </div>
        </div>

        <div class="max-h-[340px] overflow-auto">
          <table v-if="activeTab !== 'method'" class="w-full text-sm">
            <thead class="bg-neutral-50 dark:bg-neutral-700/30">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {{ activeTab === 'officer' ? 'Loan Officer' : 'Branch' }}
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Loans</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Due</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Collected</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Rate</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in activeTab === 'officer' ? summary.by_officer : summary.by_branch"
                :key="`${activeTab}-${summaryDisplayName(row, activeTab)}`"
                class="border-b border-neutral-100 dark:border-neutral-700"
              >
                <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">
                  {{ summaryDisplayName(row, activeTab) }}
                </td>
                <td class="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{{ row.loan_count }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.amount_due) }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.amount_collected) }}</td>
                <td class="px-4 py-2.5 text-right font-semibold" :class="getRateClass(toNumber(row.collection_rate))">
                  {{ fmtRate(row.collection_rate) }}
                </td>
                <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.outstanding_balance) }}</td>
              </tr>
              <tr v-if="(activeTab === 'officer' ? summary.by_officer : summary.by_branch).length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-sm text-neutral-400">No summary rows for this period.</td>
              </tr>
            </tbody>
            <tfoot class="sticky bottom-0 border-t border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-700/40">
              <tr class="font-semibold">
                <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">Totals</td>
                <td class="px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-200">
                  {{ loanCountTotal(activeTab === 'officer' ? summary.by_officer : summary.by_branch) }}
                </td>
                <td class="px-4 py-2.5 text-right font-mono text-neutral-800 dark:text-neutral-100">{{ fmt(summary.totals.amount_due) }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-neutral-800 dark:text-neutral-100">{{ fmt(summary.totals.amount_collected) }}</td>
                <td class="px-4 py-2.5 text-right" :class="getRateClass(summary.totals.collection_rate)">
                  {{ fmtRate(summary.totals.collection_rate) }}
                </td>
                <td class="px-4 py-2.5 text-right font-mono text-neutral-800 dark:text-neutral-100">{{ fmt(summary.totals.outstanding_balance) }}</td>
              </tr>
            </tfoot>
          </table>

          <table v-else class="w-full text-sm">
            <thead class="bg-neutral-50 dark:bg-neutral-700/30">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment Method</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Transactions</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Collected</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in summary.by_method"
                :key="methodName(row)"
                class="border-b border-neutral-100 dark:border-neutral-700"
              >
                <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">{{ methodName(row) }}</td>
                <td class="px-4 py-2.5 text-right text-neutral-600 dark:text-neutral-300">{{ row.transaction_count }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(row.amount_collected) }}</td>
              </tr>
              <tr v-if="summary.by_method.length === 0">
                <td colspan="3" class="px-4 py-8 text-center text-sm text-neutral-400">No payment-method totals for this period.</td>
              </tr>
            </tbody>
            <tfoot class="sticky bottom-0 border-t border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-700/40">
              <tr class="font-semibold">
                <td class="px-4 py-2.5 text-neutral-700 dark:text-neutral-200">Totals</td>
                <td class="px-4 py-2.5 text-right text-neutral-700 dark:text-neutral-200">{{ summary.totals.transaction_count }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-neutral-800 dark:text-neutral-100">{{ fmt(summary.totals.amount_collected) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div v-if="showEmptyState" class="rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p class="text-base font-semibold text-green-700">No collections recorded for this period</p>
      </div>

      <div v-if="!showEmptyState" class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div class="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
          <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Loan-Level Collections — {{ meta.total }} loan{{ meta.total !== 1 ? 's' : '' }}
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 dark:bg-neutral-700/30">
              <tr>
                <th class="w-8 px-3 py-3"></th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Member</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan Officer</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Due</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Collected</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Rate %</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Outstanding</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">DPD</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Last Payment</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="loan in loans" :key="loan.loan_id">
                <tr
                  class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/20"
                  :class="isExpanded(loan.loan_id) ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''"
                  @click="toggleExpand(loan.loan_id)"
                >
                  <td class="px-3 py-3 text-neutral-400">
                    <ChevronDown v-if="isExpanded(loan.loan_id)" class="h-4 w-4 text-blue-600" />
                    <ChevronRight v-else class="h-4 w-4" />
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-neutral-800 dark:text-neutral-100">{{ loan.member_name }}</div>
                    <div class="text-xs text-neutral-400">{{ loan.member_number }} · {{ loan.phone || 'No phone' }}</div>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-200">{{ loan.loan_no }}</td>
                  <td class="px-4 py-3 text-neutral-700 dark:text-neutral-200">{{ loan.loan_officer_name || 'Unassigned' }}</td>
                  <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(loan.amount_due) }}</td>
                  <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(loan.amount_collected) }}</td>
                  <td class="px-4 py-3 text-right font-semibold" :class="getRateClass(toNumber(loan.collection_rate))">
                    {{ fmtRate(loan.collection_rate) }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-200">{{ fmt(loan.outstanding_balance) }}</td>
                  <td class="px-4 py-3 text-center text-neutral-700 dark:text-neutral-200">{{ loan.days_in_arrears }}</td>
                  <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ loan.last_payment_date || '—' }}</td>
                </tr>

                <tr v-if="isExpanded(loan.loan_id)" class="border-b border-blue-100 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-900/5">
                  <td colspan="10" class="px-8 pb-4 pt-2">
                    <div class="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      Transactions in Period
                    </div>

                    <div v-if="isTransactionLoading(loan.loan_id) && transactionRows(loan.loan_id).length === 0" class="py-4 text-sm text-neutral-500">
                      <Spinner class="mr-2 inline h-4 w-4" /> Loading transactions...
                    </div>

                    <div v-else-if="transactionError(loan.loan_id)" class="text-sm text-red-600">
                      {{ transactionError(loan.loan_id) }}
                      <button class="ml-2 underline" @click.stop="retryTransactions(loan.loan_id)">Retry</button>
                    </div>

                    <div v-else class="overflow-x-auto">
                      <table class="min-w-full text-xs">
                        <thead>
                          <tr class="bg-blue-100/60 dark:bg-blue-900/20">
                            <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Payment Date</th>
                            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Amount Paid</th>
                            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Principal</th>
                            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Interest</th>
                            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Charges</th>
                            <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Penalty</th>
                            <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Method</th>
                            <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Receipt No</th>
                            <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Collected By</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="tx in transactionRows(loan.loan_id)"
                            :key="`${loan.loan_id}-${tx.receipt_no}-${tx.payment_date}-${tx.amount_paid}`"
                            class="border-b border-blue-100 dark:border-blue-900/20"
                          >
                            <td class="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{{ tx.payment_date }}</td>
                            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.amount_paid) }}</td>
                            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.principal_portion) }}</td>
                            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.interest_portion) }}</td>
                            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.charges_portion) }}</td>
                            <td class="px-3 py-1.5 text-right text-neutral-700 dark:text-neutral-200">{{ fmt(tx.penalty_portion) }}</td>
                            <td class="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{{ tx.payment_method || '—' }}</td>
                            <td class="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{{ tx.receipt_no || '—' }}</td>
                            <td class="px-3 py-1.5 text-neutral-600 dark:text-neutral-300">{{ tx.collected_by_name || '—' }}</td>
                          </tr>

                          <tr v-if="transactionRows(loan.loan_id).length === 0">
                            <td colspan="9" class="px-3 py-2 text-neutral-400 italic">
                              No transactions found for this loan in the selected period.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="!loading && loans.length === 0">
                <td colspan="10" class="px-4 py-10 text-center text-sm text-neutral-400">No loan rows for this period.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="border-t border-neutral-100 px-4 py-3 dark:border-neutral-700">
          <div class="flex items-center justify-between">
            <span class="text-xs text-neutral-400">
              Showing {{ fromRecord }}-{{ toRecord }} of {{ meta.total }} loans
            </span>
            <div class="flex items-center gap-2 text-sm">
              <button
                :disabled="!canGoPrev"
                class="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                @click="goToPage(meta.current_page - 1)"
              >
                Prev
              </button>
              <span class="text-xs text-neutral-500">{{ meta.current_page }} / {{ meta.last_page }}</span>
              <button
                :disabled="!canGoNext"
                class="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                @click="goToPage(meta.current_page + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="loadingSummary || loadingLoans" class="fixed bottom-5 right-5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 shadow">
      <Spinner class="mr-2 inline h-3.5 w-3.5" /> Updating report...
    </div>
  </div>
</template>
