import { tenantClient } from '../tenantClient'

export interface AccountSummary {
  id: number
  name: string
  gl_code?: string | null
}

export interface LoanPenaltyRule {
  id?: number
  penalty_type: string
  penalty_rate?: number | string | null
  grace_days?: number | null
  amount?: number | string | null
  applies_to?: string | null
  branch_id?: number | null
}

export interface LoanProductPreviewRow {
  period: number
  principal: number
  interest: number
  installment: number
  balance: number
}

export interface LoanProductPreview {
  installment_amount: number
  total_interest: number
  total_repayment: number
  schedule_preview: LoanProductPreviewRow[]
  messages: string[]
  assumptions: string[]
}

export interface LoanProduct {
  id?: number
  code?: string
  name: string
  description?: string | null
  min_amount?: number | string | null
  max_amount?: number | string | null
  interest_rate?: number | string | null
  interest_method?: 'flat' | 'reducing_balance' | null
  repayment_structure?: 'equal_installment' | 'equal_principal' | 'interest_only_balloon' | null
  interest_period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'per_month' | 'per_year' | null
  loan_duration?: number | null
  duration_type?: 'days' | 'weeks' | 'months' | 'years' | null
  repayment_cycle?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | 'yearly' | null
  min_guarantors?: number | null
  max_guarantors?: number | null
  grace_period?: number | null
  penalty_rate?: number | string | null
  penalty_type?: 'none' | 'flat' | 'percentage' | string | null
  requires_approval?: boolean
  allow_top_up?: boolean
  allow_reschedule?: boolean
  processing_fee_type?: 'none' | 'flat' | 'percentage' | null
  processing_fee_value?: number | string | null
  loan_portfolio_account_id?: number | null
  interest_income_account_id?: number | null
  interest_receivable_account_id?: number | null
  penalty_income_account_id?: number | null
  penalty_receivable_account_id?: number | null
  disbursement_account_id?: number | null
  portfolio_account?: AccountSummary | null
  interest_income_account?: AccountSummary | null
  interest_receivable_account?: AccountSummary | null
  penalty_income_account?: AccountSummary | null
  penalty_receivable_account?: AccountSummary | null
  disbursement_account?: AccountSummary | null
  loan_count?: number
  is_in_use?: boolean
  can_edit_core_fields?: boolean
  is_active: boolean
  penalty_rules?: LoanPenaltyRule[]
}

export const loanProductsApi = {
  list(params?: { search?: string; is_active?: string; page?: number; per_page?: number }) {
    return tenantClient.get('/loan-products', { params })
  },
  get(id: number) {
    return tenantClient.get(`/loan-products/${id}`)
  },
  create(data: LoanProduct) {
    return tenantClient.post('/loan-products', data)
  },
  update(id: number, data: LoanProduct) {
    return tenantClient.put(`/loan-products/${id}`, data)
  },
  preview(data: Partial<LoanProduct> & { preview_amount?: number | string | null; preview_term?: number | null }) {
    return tenantClient.post('/loan-products/preview', data)
  },
  destroy(id: number) {
    return tenantClient.delete(`/loan-products/${id}`)
  },
}
