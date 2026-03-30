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
  amount_formatted?: string | null
  applies_to?: string | null
  branch_id?: number | null
  currency_code?: string | null
}

export interface DocumentTypeOption {
  id: number
  code: string
  name: string
  description?: string | null
  is_active?: boolean
}

export interface LoanProductRequiredDocument {
  id?: number | null
  document_type_id: number | null
  document_type_code?: string | null
  document_type_name?: string | null
  required_stage?: 'draft' | 'submission' | 'review' | 'approval' | 'disbursement' | null
  sort_order?: number | null
  is_required?: boolean
  is_active?: boolean
  notes?: string | null
}

export interface LoanProductPreviewRow {
  period: number
  principal: number
  principal_formatted?: string | null
  interest: number
  interest_formatted?: string | null
  installment: number
  installment_formatted?: string | null
  balance: number
  balance_formatted?: string | null
}

export interface LoanProductPreview {
  installment_amount: number
  installment_amount_formatted?: string | null
  total_interest: number
  total_interest_formatted?: string | null
  total_repayment: number
  total_repayment_formatted?: string | null
  schedule_preview: LoanProductPreviewRow[]
  messages: string[]
  assumptions: string[]
  currency_code?: string | null
}

export interface LoanProduct {
  id?: number
  code?: string
  name: string
  description?: string | null
  min_amount?: number | string | null
  min_amount_formatted?: string | null
  max_amount?: number | string | null
  max_amount_formatted?: string | null
  interest_rate?: number | string | null
  interest_method?: 'flat' | 'reducing_balance' | null
  repayment_structure?: 'equal_installment' | 'equal_principal' | 'interest_only_balloon' | null
  interest_period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'per_month' | 'per_year' | null
  loan_duration?: number | null
  duration_type?: 'days' | 'weeks' | 'months' | 'years' | null
  repayment_cycle?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | 'yearly' | null
  required_documents?: LoanProductRequiredDocument[]
  grace_period?: number | null
  savings_appraisal_threshold?: number | string | null
  warning_days?: number | null
  max_securities?: number | null
  security_value_percentage?: number | string | null
  allow_sub_schedule?: boolean | null
  penalty_rate?: number | string | null
  penalty_type?: 'none' | 'flat' | 'percentage' | string | null
  requires_approval?: boolean
  allow_top_up?: boolean
  allow_reschedule?: boolean
  processing_fee_type?: 'none' | 'flat' | 'percentage' | null
  processing_fee_value?: number | string | null
  processing_fee_value_formatted?: string | null
  loan_portfolio_account_id?: number | null
  interest_income_account_id?: number | null
  interest_receivable_account_id?: number | null
  penalty_income_account_id?: number | null
  penalty_receivable_account_id?: number | null
  disbursement_account_id?: number | null
  charges_income_account_id?: number | null
  charges_receivable_account_id?: number | null
  portfolio_account?: AccountSummary | null
  interest_income_account?: AccountSummary | null
  interest_receivable_account?: AccountSummary | null
  penalty_income_account?: AccountSummary | null
  penalty_receivable_account?: AccountSummary | null
  disbursement_account?: AccountSummary | null
  charges_income_account?: AccountSummary | null
  charges_receivable_account?: AccountSummary | null
  loan_count?: number
  is_in_use?: boolean
  can_edit_core_fields?: boolean
  is_active: boolean
  penalty_rules?: LoanPenaltyRule[]
  currency_code?: string | null
}

export const loanProductsApi = {
  documentTypes(params?: { active_only?: boolean | string }) {
    return tenantClient.get('/document-types', { params })
  },
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
