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

export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '91-180' | '180+'

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
  member_number: string
  loan_officer_name: string
  principal: string
  outstanding_balance: string
  principal_arrears: string
  interest_arrears: string
  charges_arrears: string
  penalty_arrears: string
  total_arrears: string
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
  loan_count: number
  total_arrears: number
  total_portfolio: number
  par_30: number
  par_90: number
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
}
