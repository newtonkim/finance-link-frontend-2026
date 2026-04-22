import { ref, computed, onMounted } from 'vue'
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
import { formatMoneyValue, exportToExcel } from '@/Global'

export function useAgingReport() {
  // ─── Filter state ─────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]

  const filters = ref<AgingFilters>({
    as_of_date:      today,
    branch_id:       null,
    loan_officer_id: null,
    loan_product_id: null,
    bucket:          null,
    per_page:        25,
    page:            1,
  })

  // ─── Filter options ────────────────────────────────────────────────────────────
  const showBranchFilter = ref(false)
  const branches         = ref<{ id: number; name: string; code: string }[]>([])
  const officers         = ref<{ id: number; name: string }[]>([])
  const products         = ref<{ id: number; name: string }[]>([])

  const BUCKET_TABS: { value: AgingBucket | null; label: string }[] = [
    { value: null,     label: 'All'       },
    { value: '1-30',   label: '1–30 Days' },
    { value: '31-60',  label: '31–60 Days'},
    { value: '61-90',  label: '61–90 Days'},
    { value: '91-180', label: '91–180 Days'},
    { value: '180+',   label: '180+ Days' },
  ]

  // ─── Data state ───────────────────────────────────────────────────────────────
  const loadingKpis  = ref(false)
  const loadingTable = ref(false)

  const rows     = ref<AgingLoanRow[]>([])
  const total    = ref(0)
  const lastPage = ref(1)

  const buckets = ref<AgingBucketRow[]>([])
  const totals  = ref<AgingPortfolioTotals>({
    loan_count:              0,
    arrears_loan_count:      0,
    total_arrears:           0,
    total_portfolio:         0,
    par_30:                  0,
    par_90:                  0,
    par_30_excl_rescheduled: 0,
    par_90_excl_rescheduled: 0,
    rescheduled_loan_count:  0,
    rescheduled_outstanding: 0,
    total_provision:         0,
  })

  // ─── Expandable schedule state ────────────────────────────────────────────────
  const expandedLoanId     = ref<number | null>(null)
  const scheduleCache      = ref(new Map<number, any[]>())
  const loadingScheduleId  = ref<number | null>(null)

  // ─── Search state ─────────────────────────────────────────────────────────────
  const search = ref('')

  // ─── Active bucket tab ────────────────────────────────────────────────────────
  const activeBucketTab = ref<AgingBucket | null>(null)

  // ─── Computed ─────────────────────────────────────────────────────────────────
  const paginationLinks = computed(() => ({
    current_page: filters.value.page ?? 1,
    last_page:    lastPage.value,
    per_page:     filters.value.per_page ?? 25,
    total:        total.value,
    from:         ((filters.value.page ?? 1) - 1) * (filters.value.per_page ?? 25) + 1,
    to:           Math.min((filters.value.page ?? 1) * (filters.value.per_page ?? 25), total.value),
    links:        [],
  }))

  const nplRatio = computed(() => {
    const nplLoans = buckets.value
      .filter(b => b.bucket === '91-180' || b.bucket === '180+')
      .reduce((s, b) => s + b.loan_count, 0)
    return totals.value.loan_count > 0
      ? Math.round(nplLoans / totals.value.loan_count * 10000) / 100
      : 0
  })

  const filteredRows = computed(() => {
    if (!search.value.trim()) return rows.value
    const q = search.value.toLowerCase()
    return rows.value.filter(r =>
      r.member_name.toLowerCase().includes(q) ||
      r.loan_no.toLowerCase().includes(q) ||
      r.member_no.toLowerCase().includes(q) ||
      r.loan_officer_name.toLowerCase().includes(q),
    )
  })

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
    } catch { /* non-critical */ }
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
    expandedLoanId.value = null
    scheduleCache.value.clear()
    await Promise.all([fetchPortfolioSummary(), fetchTable()])
  }

  function onPageChange(page: number) {
    filters.value.page = page
    expandedLoanId.value = null
    fetchTable()
  }

  function onPerPageChange(perPage: number) {
    filters.value.per_page = perPage
    filters.value.page     = 1
    expandedLoanId.value   = null
    fetchTable()
  }

  function selectBucketTab(bucket: AgingBucket | null) {
    activeBucketTab.value = bucket
    filters.value.bucket  = bucket
    filters.value.page    = 1
    expandedLoanId.value  = null
    fetchTable()
  }

  function resetFilters() {
    filters.value = {
      as_of_date: today, branch_id: null, loan_officer_id: null,
      loan_product_id: null, bucket: null, per_page: 25, page: 1,
    }
    activeBucketTab.value = null
    search.value = ''
    applyFilters()
  }

  async function toggleSchedule(loanId: number) {
    if (expandedLoanId.value === loanId) {
      expandedLoanId.value = null
      return
    }
    expandedLoanId.value = loanId
    if (scheduleCache.value.has(loanId)) return
    loadingScheduleId.value = loanId
    try {
      const res = await tenantClient.get(`/loans/${loanId}/schedule`)
      scheduleCache.value.set(loanId, res.data.data ?? res.data ?? [])
    } finally {
      loadingScheduleId.value = null
    }
  }

  function scheduleForLoan(loanId: number): any[] {
    return scheduleCache.value.get(loanId) ?? []
  }

  function tabCount(bucket: AgingBucket | null): number {
    if (bucket === null) return totals.value.arrears_loan_count
    return buckets.value.find(b => b.bucket === bucket)?.loan_count ?? 0
  }

  // ─── Export logic ─────────────────────────────────────────────────────────────
  function exportCsv() {
    const exportHelper = exportToExcel as (opts: { name: string; data: any[] }) => void
    exportHelper({
      name: `Loan-Aging-Report-${filters.value.as_of_date ?? today}`,
      data: rows.value.map((r) => ({
        'Loan No':                       r.loan_no,
        'Member':                        r.member_name,
        'Member No':                     r.member_no,
        'Rescheduled':                   r.is_rescheduled ? 'Yes' : 'No',
        'Product':                       r.product_name,
        'Branch':                        r.branch_name,
        'Loan Officer':                  r.loan_officer_name,
        'Asset Quality':                 assetQualityLabel(r.bucket),
        'Loan Principal':                r.principal,
        'Balance Outstanding':           r.balance_outstanding,
        'Outstanding Principal Balance': r.principal_balance_outstanding,
        'Current (Not Yet Due)':         r.current_not_yet_due,
        'Total Paid to Date':            r.total_paid_to_date,
        'Principal Arrears':             r.principal_arrears,
        'Interest Arrears':              r.interest_arrears,
        'Charges Arrears':               r.charges_arrears,
        'Penalty Arrears':               r.penalty_arrears,
        'Total Arrears':                 r.total_arrears,
        'Arrears 1-30':                  r.arrears_1_30,
        'Arrears 31-60':                 r.arrears_31_60,
        'Arrears 61-90':                 r.arrears_61_90,
        'Arrears 91-180':                r.arrears_91_180,
        'Arrears 180+':                  r.arrears_180plus,
        'Days Past Due':                 r.days_past_due,
        'Bucket':                        bucketLabel(r.bucket),
        'Last Payment':                  r.last_payment_date ?? '—',
      })),
    })
  }

  function exportPdf() {
    const doc  = new jsPDF('l', 'mm', 'a4')
    const asOf = filters.value.as_of_date ?? today

    doc.setFontSize(16)
    doc.text('Loan Aging Report', 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(`As of: ${asOf}   |   Generated: ${new Date().toLocaleString()}`, 14, 25)

    doc.setFontSize(11)
    doc.setTextColor(40)
    doc.text('Portfolio Aging Summary', 14, 33)

    autoTable(doc, {
      startY: 37,
      head: [['Bucket', 'Loans', 'Asset Quality', 'Principal', 'Interest', 'Charges', 'Penalty', 'Total Arrears', '% Portfolio', 'Prov. Rate', 'Provision Amt']],
      body: buckets.value.map((b) => [
        bucketLabel(b.bucket),
        b.loan_count,
        assetQualityLabel(b.bucket),
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
        'Total', `${totals.value.arrears_loan_count} / ${totals.value.loan_count}`, '',
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

    const afterSummary = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(11)
    doc.text('Loan Detail', 14, afterSummary)

    autoTable(doc, {
      startY: afterSummary + 4,
      head: [['Member', 'Loan No', 'Product', 'Asset Quality', 'Bal. Outstanding', 'Total Arrears', 'DPD', 'Bucket', 'Last Payment']],
      body: rows.value.map((r) => [
        r.member_name + (r.is_rescheduled ? ' [R]' : ''),
        r.loan_no,
        r.product_name,
        assetQualityLabel(r.bucket),
        fmt(r.balance_outstanding),
        fmt(r.total_arrears),
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

  function printReport() { window.print() }

  // ─── Styling helpers ──────────────────────────────────────────────────────────
  function bucketBadgeClass(bucket: AgingBucket): string {
    return {
      '1-30':   'bg-yellow-100 text-yellow-800  dark:bg-yellow-900/40 dark:text-yellow-300',
      '31-60':  'bg-orange-100 text-orange-800  dark:bg-orange-900/40 dark:text-orange-300',
      '61-90':  'bg-red-100    text-red-800     dark:bg-red-900/40    dark:text-red-300',
      '91-180': 'bg-red-200    text-red-900     dark:bg-red-900/60    dark:text-red-200',
      '180+':   'bg-neutral-900 text-white       dark:bg-neutral-700   dark:text-neutral-100',
    }[bucket] ?? 'bg-neutral-100 text-neutral-600'
  }

  function bucketRowClass(bucket: AgingBucket): string {
    return {
      '1-30':   'bg-yellow-50/40 dark:bg-yellow-900/5',
      '31-60':  'bg-orange-50/40 dark:bg-orange-900/5',
      '61-90':  'bg-red-50/40    dark:bg-red-900/5',
      '91-180': 'bg-red-50/60    dark:bg-red-900/10',
      '180+':   'bg-red-100/60   dark:bg-red-900/20',
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

  function dpdClass(dpd: number): string {
    if (dpd > 180) return 'text-neutral-900 font-bold dark:text-white'
    if (dpd > 90)  return 'text-red-700 font-bold dark:text-red-400'
    if (dpd > 60)  return 'text-red-600 font-semibold dark:text-red-400'
    if (dpd > 30)  return 'text-orange-600 font-semibold dark:text-orange-400'
    return 'text-yellow-700 font-semibold dark:text-yellow-400'
  }

  function assetQualityLabel(bucket: AgingBucket): string {
    return { '1-30': 'Watch', '31-60': 'Substandard', '61-90': 'Substandard', '91-180': 'Doubtful', '180+': 'Loss' }[bucket] ?? ''
  }

  function assetQualityClass(bucket: AgingBucket): string {
    return {
      '1-30':   'bg-yellow-50  text-yellow-700  border border-yellow-200  dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/40',
      '31-60':  'bg-orange-50  text-orange-700  border border-orange-200  dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/40',
      '61-90':  'bg-orange-50  text-orange-700  border border-orange-200  dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/40',
      '91-180': 'bg-red-50     text-red-700     border border-red-200     dark:bg-red-900/20    dark:text-red-300    dark:border-red-800/40',
      '180+':   'bg-neutral-900 text-white       border border-neutral-700 dark:bg-neutral-800   dark:text-neutral-100',
    }[bucket] ?? ''
  }

  function scheduleRowClass(status: string, dueDate: string): string {
    const isOverdue = status !== 'paid' && dueDate < today
    if (status === 'paid')    return 'bg-emerald-50/50 dark:bg-emerald-900/5'
    if (status === 'partial') return 'bg-amber-50/60 dark:bg-amber-900/10'
    if (isOverdue)            return 'bg-red-50/50 dark:bg-red-900/10'
    return ''
  }

  function scheduleStatusBadge(status: string): string {
    return {
      paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      partial: 'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-300',
      unpaid:  'bg-red-100     text-red-700     dark:bg-red-900/40     dark:text-red-300',
      pending: 'bg-blue-100    text-blue-700    dark:bg-blue-900/40    dark:text-blue-300',
    }[status?.toLowerCase()] ?? 'bg-neutral-100 text-neutral-600'
  }

  function fmt(v: string | number | null | undefined): string {
    return formatMoneyValue(v ?? 0)
  }

  function fmtPct(v: number): string {
    return `${v.toFixed(2)}%`
  }

  function bucketLabel(bucket: AgingBucket): string {
    return BUCKET_TABS.find((o) => o.value === bucket)?.label ?? bucket
  }

  onMounted(async () => {
    await fetchFilterOptions()
    await Promise.all([fetchPortfolioSummary(), fetchTable()])
  })

  return {
    today,
    filters,
    showBranchFilter,
    branches,
    officers,
    products,
    BUCKET_TABS,
    loadingKpis,
    loadingTable,
    rows,
    total,
    buckets,
    totals,
    expandedLoanId,
    loadingScheduleId,
    search,
    activeBucketTab,
    paginationLinks,
    nplRatio,
    filteredRows,
    applyFilters,
    onPageChange,
    onPerPageChange,
    selectBucketTab,
    resetFilters,
    toggleSchedule,
    scheduleForLoan,
    tabCount,
    exportCsv,
    exportPdf,
    printReport,
    bucketBadgeClass,
    bucketRowClass,
    bucketTableRowClass,
    dpdClass,
    assetQualityLabel,
    assetQualityClass,
    scheduleRowClass,
    scheduleStatusBadge,
    fmt,
    fmtPct,
    bucketLabel,
  }
}
