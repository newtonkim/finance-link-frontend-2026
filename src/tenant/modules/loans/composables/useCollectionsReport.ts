import { ref, reactive, computed, onMounted } from 'vue'
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
import { formatMoneyValue } from '@/Global'

export type SummaryTab = 'officer' | 'branch' | 'method'

export interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export function useCollectionsReport() {
  const PERIOD_TYPES: CollectionsPeriodType[] = ['Date Range', 'Month', 'As of Date']

  const tenantStore = useTenantContextStore()
  const tenant = tenantStore.currentTenant as any

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function formatLocalDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  function deriveMonthDateRange(month: string): { date_from: string; date_to: string } {
    const [yearText, monthText] = month.split('-')
    const year = Number(yearText)
    const monthNumber = Number(monthText)

    if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return deriveMonthDateRange(getCurrentMonth())
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

  function fmt(value: unknown): string {
    return formatMoneyValue(toNumber(value))
  }

  function fmtRate(value: unknown): string {
    return `${toNumber(value).toFixed(1)}%`
  }

  function getRateClass(rate: number): string {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 50) return 'text-orange-500'
    return 'text-red-600'
  }

  // ─── State ──────────────────────────────────────────────────────────────────
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

  // ─── Computed ───────────────────────────────────────────────────────────────
  const hasSummaryRows = computed(() => {
    return summary.value.by_officer.length > 0 || summary.value.by_branch.length > 0 || summary.value.by_method.length > 0
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

  // ─── Methods ────────────────────────────────────────────────────────────────
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

    if (!filters.value.date_from) filters.value.date_from = defaultMonthRange.date_from
    if (!filters.value.date_to) filters.value.date_to = defaultMonthRange.date_to

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

  async function loadFilterOptions() {
    try {
      const res = await reportsApi.filterOptions()
      showBranchFilter.value = res.data.filters?.options?.show_branch_filter ?? res.data.show_branch_filter ?? false
      branches.value = res.data.filters?.options?.branches ?? res.data.branches ?? []
      officers.value = res.data.filters?.options?.staff ?? res.data.staff ?? []
    } catch { /* ignore non-critical */ }
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

    if (payload && typeof payload === 'object' && 'loans' in (payload as any)) {
      const nested = fromUnknown((payload as any).loans)
      if (nested) return nested
    }

    return fallback
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
      summary.value = { by_officer: [], by_branch: [], by_method: [], totals: { amount_due: 0, amount_collected: 0, collection_rate: 0, outstanding_balance: 0, transaction_count: 0 } }
      loans.value = []
      meta.value = { current_page: 1, last_page: 1, per_page: filters.value.per_page, total: 0, from: null, to: null }
    } finally {
      loading.value = false
    }
  }

  function applyFilters() {
    filters.value.page = 1
    resetTransactionState()
    fetchReport()
  }

  function resetFilters() {
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
    fetchReport()
  }

  function goToPage(page: number) {
    if (page < 1 || page > meta.value.last_page || page === meta.value.current_page) return
    filters.value.page = page
    resetTransactionState()
    fetchLoans() // Only need loans for page changes
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

  function toggleExpand(loanId: number) {
    if (expandedLoanId.value === loanId) {
      expandedLoanId.value = null
      return
    }
    expandedLoanId.value = loanId
    if (!transactionCache.has(loanId)) {
      fetchLoanTransactions(loanId)
    }
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

  function summaryDisplayName(row: CollectionsSummaryRow, tab: SummaryTab): string {
    if (tab === 'officer') return row.loan_officer_name || row.name || 'Unassigned'
    if (tab === 'branch') return row.branch_name || row.name || 'Unassigned'
    return row.name || '—'
  }

  async function printReport() {
    isPrinting.value = true
    try {
      const params = buildBaseFilters()
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
  body { font-family: "Inter Variable", Inter, Arial, sans-serif; font-size: 11px; color: #111; margin: 24px; }
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

  return {
    PERIOD_TYPES,
    filters,
    showBranchFilter,
    branches,
    officers,
    loading,
    loadingSummary,
    loadingLoans,
    exporting,
    isPrinting,
    error,
    activeTab,
    summary,
    loans,
    meta,
    expandedLoanId,
    transactionCache,
    transactionLoading,
    transactionErrors,
    hasSummaryRows,
    showEmptyState,
    canGoPrev,
    canGoNext,
    fromRecord,
    toRecord,
    fmt,
    fmtRate,
    getRateClass,
    toNumber,
    summaryDisplayName,
    applyFilters,
    resetFilters,
    goToPage,
    toggleExpand,
    retryTransactions: fetchLoanTransactions,
    exportExcel,
    printReport,
  }
}
