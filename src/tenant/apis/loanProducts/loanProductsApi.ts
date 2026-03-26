import { tenantClient } from '../tenantClient'

export interface LoanPenaltyRule {
  id?: number
  penalty_type: string
  penalty_rate?: number | string | null
  grace_days?: number | null
  amount?: number | string | null
  applies_to?: string | null
  branch_id?: number | null
}

export interface LoanProduct {
  id?: number
  name: string
  min_amount?: number | string | null
  max_amount?: number | string | null
  interest_rate?: number | string | null
  interest_method?: 'flat' | 'reducing_balance' | null
  interest_period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  loan_duration?: number | null
  duration_type?: 'days' | 'weeks' | 'months' | 'years' | null
  repayment_cycle?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null
  min_guarantors?: number | null
  max_guarantors?: number | null
  grace_period?: number | null
  penalty_rate?: number | string | null
  penalty_type?: string | null
  is_active: boolean
  penalty_rules?: LoanPenaltyRule[]
}

export const loanProductsApi = {
  list(params?: { search?: string; is_active?: string; page?: number }) {
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
  destroy(id: number) {
    return tenantClient.delete(`/loan-products/${id}`)
  },
}
