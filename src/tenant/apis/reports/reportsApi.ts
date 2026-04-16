import { tenantClient } from '@/tenant/apis/tenantClient'

export interface ReportFilters {
  branch_id?: number | null
  staff_id?: number | null
  date_from?: string | null
  date_to?: string | null
}

export interface FilterOptions {
  show_branch_filter: boolean
  branches: { id: number; name: string; code: string }[]
  staff: { id: number; name: string; email: string; branch_id: number | null; status: string }[]
}

// ─── Aging Report ─────────────────────────────────────────────────────────────

export type AgingBucket = '1-30' | '31-60' | '61-90' | '91-180' | '180+'

export interface AgingFilters {
  as_of_date?: string | null
  branch_id?: number | null
  loan_officer_id?: number | null
  loan_product_id?: number | null
  bucket?: AgingBucket | null
  per_page?: number
  page?: number
}

export interface AgingLoanRow {
  loan_id: number
  loan_no: string
  member_id: number
  member_name: string
  member_no: string
  product_name: string
  branch_name: string
  loan_officer_name: string
  /** Original disbursed amount */
  principal: string
  /** Stored outstanding balance on loan record */
  outstanding_balance: string
  /** Schedule-computed total remaining balance (principal + interest + charges + penalty) */
  balance_outstanding: string
  /** Remaining principal balance only — from full schedule, not just overdue */
  principal_balance_outstanding: string
  /** Sum of unpaid future installments (due_date > as_of_date) */
  current_not_yet_due: string
  /** Cumulative amount paid on this loan up to as_of_date (reversals excluded) */
  total_paid_to_date: string
  principal_arrears: string
  interest_arrears: string
  charges_arrears: string
  penalty_arrears: string
  total_arrears: string
  /** True when this loan was created by rescheduling an earlier loan */
  is_rescheduled: 0 | 1
  /** Overdue amounts broken down by bucket */
  arrears_1_30: string
  arrears_31_60: string
  arrears_61_90: string
  arrears_91_180: string
  arrears_180plus: string
  days_past_due: number
  bucket: AgingBucket
  last_payment_date: string | null
}

export interface AgingSummaryResponse {
  data: AgingLoanRow[]
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface AgingBucketRow {
  bucket: AgingBucket
  loan_count: number
  principal_arrears: number
  interest_arrears: number
  charges_arrears: number
  penalty_arrears: number
  total_arrears: number
  portfolio_percentage: number
  provision_rate: number
  provision_amount: number
}

export interface AgingPortfolioTotals {
  /** Total active loans in portfolio */
  loan_count: number
  /** Loans with at least one overdue installment (after grace period) */
  arrears_loan_count: number
  total_arrears: number
  total_portfolio: number
  par_30: number
  par_90: number
  /** PAR 30 excluding rescheduled loans — portfolio health view */
  par_30_excl_rescheduled: number
  /** PAR 90 excluding rescheduled loans — portfolio health view */
  par_90_excl_rescheduled: number
  /** Number of rescheduled loans currently in arrears */
  rescheduled_loan_count: number
  /** Outstanding balance of rescheduled loans in arrears */
  rescheduled_outstanding: number
  total_provision: number
}

export interface AgingPortfolioSummaryResponse {
  buckets: AgingBucketRow[]
  totals: AgingPortfolioTotals
}

// ─── Loan Balances Report ─────────────────────────────────────────────────────

export type LoanBalanceStatus = 'all' | 'active' | 'closed' | 'arrears'

export interface LoanBalanceFilters {
  as_of_date?: string | null
  branch_id?: number | null
  loan_product_id?: number | null
  loan_officer_id?: number | null
  status?: LoanBalanceStatus | null
  per_page?: number
  page?: number
}

export interface LoanBalanceRow {
  loan_id: number
  loan_no: string
  member_id: number
  member_name: string
  member_number: string
  branch_name: string
  loan_officer_name: string
  product_name: string
  principal: string
  interest_remaining: string
  charges_remaining: string
  penalty_remaining: string
  outstanding_balance: string
  status: string
  disbursed_at: string | null
  next_due_date: string | null
  days_in_arrears: number | null
}

export interface LoanBalanceSummary {
  total_principal: number
  total_interest: number
  total_charges: number
  total_penalty: number
  grand_total: number
  loan_count: number
}

export interface LoanBalanceResponse {
  summary: LoanBalanceSummary
  loans: {
    data: LoanBalanceRow[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
}

// ─── Loan Arrears Report ──────────────────────────────────────────────────────

export interface ArrearsFilters {
  as_of_date?: string | null
  branch_id?: number | null
  loan_officer_id?: number | null
  per_page?: number
  page?: number
  historical?: boolean
}

export interface ArrearsTrendFilters {
  as_of_date?: string | null
  branch_id?: number | null
  loan_officer_id?: number | null
  months?: 3 | 6 | 12
}

export interface ArrearsLoanRow {
  loan_id: number
  loan_no: string
  member_id: number
  member_name: string
  member_number: string
  phone: string
  branch_name: string
  loan_officer_name: string
  product_name: string
  total_arrears: number
  principal_arrears: number
  interest_arrears: number
  charges_arrears: number
  penalty_arrears: number
  missed_installments: number
  days_in_arrears: number
  last_payment_date: string | null
  disbursed_at: string | null
}

export interface ArrearsSnapshot {
  date: string
  loan_count: number
  total_arrears: number
  principal_arrears: number
}

export interface ArrearsComparisonResponse {
  today: ArrearsSnapshot
  one_month_ago: ArrearsSnapshot
  three_months_ago: ArrearsSnapshot
}

export interface ArrearsTrendPoint {
  month: string
  label: string
  month_end: string
  loan_count: number
  total_arrears: number
}

export interface ArrearsInstallmentRow {
  installment_no: number
  due_date: string
  principal_shortfall: number
  interest_shortfall: number
  charges_shortfall: number
  penalty_shortfall: number
  total_shortfall: number
}

export interface ArrearsReportResponse {
  loans: {
    data: ArrearsLoanRow[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
      from: number
      to: number
    }
  }
}

export const reportsApi = {
  index(params?: ReportFilters) {
    return tenantClient.get('/reports', { params })
  },

  filterOptions() {
    return tenantClient.get('/reports/filter-options')
  },

  agingReport(params?: AgingFilters) {
    return tenantClient.get<AgingSummaryResponse>('/reports/loan-aging', { params })
  },

  agingPortfolioSummary(params?: Omit<AgingFilters, 'bucket' | 'per_page' | 'page'>) {
    return tenantClient.get<AgingPortfolioSummaryResponse>(
      '/reports/loan-aging/portfolio-summary',
      { params },
    )
  },

  // ─── Loan Balances ─────────────────────────────────────────────────────────
  loanBalances(params?: LoanBalanceFilters) {
    return tenantClient.get<LoanBalanceResponse>('/reports/loan-balances', { params })
  },

  loanBalancesExport(params?: Omit<LoanBalanceFilters, 'per_page' | 'page'>) {
    return tenantClient.get('/reports/loan-balances/export', { params, responseType: 'blob' })
  },

  // ─── Loan Arrears ───────────────────────────────────────────────────────────
  loanArrears(params?: ArrearsFilters) {
    return tenantClient.get<ArrearsReportResponse>('/reports/loan-arrears', { params })
  },

  loanArrearsComparison(params?: Omit<ArrearsFilters, 'per_page' | 'page'>) {
    return tenantClient.get<ArrearsComparisonResponse>('/reports/loan-arrears/comparison', { params })
  },

  loanArrearsTrend(params?: ArrearsTrendFilters) {
    return tenantClient.get<ArrearsTrendPoint[]>('/reports/loan-arrears/trend', { params })
  },

  loanArrearsInstallments(loanId: number, asOfDate: string) {
    return tenantClient.get<ArrearsInstallmentRow[]>(
      `/reports/loan-arrears/${loanId}/installments`,
      { params: { as_of_date: asOfDate } },
    )
  },

  loanArrearsExport(params?: Omit<ArrearsFilters, 'per_page' | 'page'>) {
    return tenantClient.get('/reports/loan-arrears/export', { params, responseType: 'blob' })
  },
}
