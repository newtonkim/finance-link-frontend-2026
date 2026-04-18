import { computed, ref } from 'vue'
import { formatMoneyValue } from '@/Global'
import {
  reportsApi,
  type DisbursementBreakdownRow,
  type DisbursementKpis,
  type DisbursementLoanRow,
  type DisbursementLoansResponse,
  type DisbursementPending,
  type DisbursementSummaryResponse,
  type DisbursementTrendPoint,
} from '@/tenant/apis/reports/reportsApi'

type SummaryTab = 'product' | 'channel' | 'branch' | 'officer'

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthToRange(month: string): { date_from: string; date_to: string } {
  const [y, m] = month.split('-').map(Number)
  const first = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const last = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { date_from: first, date_to: last }
}

export function useDisbursementReport() {
  const today = formatLocalDate(new Date())
  const defaultMonth = getCurrentMonth()
  const defaultRange = monthToRange(defaultMonth)

  const filters = ref({
    date_from: defaultRange.date_from,
    date_to: defaultRange.date_to,
    month: defaultMonth,
    branch_id: null as number | null,
    loan_officer_id: null as number | null,
    loan_product_id: null as number | null,
    per_page: 25,
    page: 1,
  })

  const loading = ref(false)
  const exporting = ref(false)
  const error = ref<string | null>(null)
  const activeTab = ref<SummaryTab>('product')

  const showBranchFilter = ref(false)
  const branches = ref<{ id: number; name: string }[]>([])
  const officers = ref<{ id: number; name: string }[]>([])
  const products = ref<{ id: number; name: string }[]>([])

  const kpis = ref<DisbursementKpis>({ total_disbursed: 0, loan_count: 0, avg_loan_size: 0 })
  const pending = ref<DisbursementPending>({ pending_count: 0, pending_amount: 0 })
  const byProduct = ref<DisbursementBreakdownRow[]>([])
  const byChannel = ref<DisbursementBreakdownRow[]>([])
  const byBranch = ref<DisbursementBreakdownRow[]>([])
  const byOfficer = ref<DisbursementBreakdownRow[]>([])
  const trend = ref<DisbursementTrendPoint[]>([])

  const loans = ref<DisbursementLoanRow[]>([])
  const meta = ref({ current_page: 1, last_page: 1, per_page: 25, total: 0, from: null as number | null, to: null as number | null })

  const showEmptyState = computed(() => !loading.value && !error.value && kpis.value.loan_count === 0 && loans.value.length === 0)
  const canGoPrev = computed(() => meta.value.current_page > 1)
  const canGoNext = computed(() => meta.value.current_page < meta.value.last_page)

  function baseParams() {
    const range = monthToRange(filters.value.month)
    filters.value.date_from = range.date_from
    filters.value.date_to = range.date_to
    return {
      date_from: filters.value.date_from,
      date_to: filters.value.date_to,
      branch_id: filters.value.branch_id,
      loan_officer_id: filters.value.loan_officer_id,
      loan_product_id: filters.value.loan_product_id,
    }
  }

  async function loadFilterOptions() {
    try {
      const res = await reportsApi.filterOptions()
      showBranchFilter.value = res.data.filters?.options?.show_branch_filter ?? res.data.show_branch_filter ?? false
      branches.value = res.data.filters?.options?.branches ?? res.data.branches ?? []
      officers.value = res.data.filters?.options?.staff ?? res.data.staff ?? []
    } catch { /* non-critical */ }
  }

  async function fetchReport() {
    loading.value = true
    error.value = null
    try {
      const params = baseParams()
      const [summaryRes, loansRes, trendRes] = await Promise.all([
        reportsApi.disbursementSummary(params),
        reportsApi.disbursementLoans({ ...params, per_page: filters.value.per_page, page: filters.value.page }),
        reportsApi.disbursementTrend({ ...params, months: 3 }),
      ])
      applySummary(summaryRes.data)
      applyLoans(loansRes.data)
      trend.value = trendRes.data ?? []
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Failed to load disbursement report.'
    } finally {
      loading.value = false
    }
  }

  function applySummary(data: DisbursementSummaryResponse) {
    kpis.value = data.kpis ?? { total_disbursed: 0, loan_count: 0, avg_loan_size: 0 }
    pending.value = data.pending ?? { pending_count: 0, pending_amount: 0 }
    byProduct.value = data.by_product ?? []
    byChannel.value = data.by_channel ?? []
    byBranch.value = data.by_branch ?? []
    byOfficer.value = data.by_officer ?? []
  }

  function applyLoans(data: DisbursementLoansResponse) {
    loans.value = data.data ?? []
    meta.value = {
      current_page: data.meta?.current_page ?? 1,
      last_page: data.meta?.last_page ?? 1,
      per_page: data.meta?.per_page ?? filters.value.per_page,
      total: data.meta?.total ?? 0,
      from: data.meta?.from ?? null,
      to: data.meta?.to ?? null,
    }
  }

  async function applyFilters() {
    filters.value.page = 1
    await fetchReport()
  }

  async function resetFilters() {
    filters.value = { date_from: defaultRange.date_from, date_to: defaultRange.date_to, month: defaultMonth, branch_id: null, loan_officer_id: null, loan_product_id: null, per_page: 25, page: 1 }
    activeTab.value = 'product'
    await fetchReport()
  }

  async function goToPage(page: number) {
    if (page < 1 || page > meta.value.last_page || page === meta.value.current_page) return
    filters.value.page = page
    loading.value = true
    error.value = null
    try {
      const params = baseParams()
      const res = await reportsApi.disbursementLoans({ ...params, per_page: filters.value.per_page, page })
      applyLoans(res.data)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Failed to load page.'
    } finally {
      loading.value = false
    }
  }

  async function exportExcel() {
    exporting.value = true
    try {
      const params = baseParams()
      const res = await reportsApi.disbursementExport(params)
      const url = URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `loan-disbursement-report-${params.date_from}-to-${params.date_to}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch { alert('Export failed. Please try again.') }
    finally { exporting.value = false }
  }

  function fmt(v: unknown): string { return formatMoneyValue(Number(v) || 0) }
  function fmtPct(v: unknown): string { return `${(Number(v) || 0).toFixed(1)}%` }

  return {
    filters, loading, exporting, error, activeTab,
    showBranchFilter, branches, officers, products,
    kpis, pending, byProduct, byChannel, byBranch, byOfficer, trend,
    loans, meta, showEmptyState, canGoPrev, canGoNext,
    loadFilterOptions, fetchReport, applyFilters, resetFilters, goToPage, exportExcel,
    fmt, fmtPct,
  }
}

export type { SummaryTab }
