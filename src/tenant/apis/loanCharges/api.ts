import { tenantClient } from '../tenantClient'

export type LoanChargeCategory =
  | 'processing_fee'
  | 'penalty'
  | 'late_fee'
  | 'appraisal_fee'
  | 'disbursement_fee'
  | 'other'

export type LoanChargeType = 'flat' | 'percentage'
export type LoanChargeFrequency = 'one_time' | 'daily' | 'weekly' | 'monthly'
export type LoanChargeMaxValueType = 'none' | 'flat_cap' | 'percentage_of_outstanding'

export interface LoanCharge {
  id: number
  name: string
  code?: string | null
  category: LoanChargeCategory
  charge_type: LoanChargeType
  value: number | string
  value_formatted?: string | null
  frequency: LoanChargeFrequency
  grace_days: number
  max_value?: number | string | null
  max_value_type?: LoanChargeMaxValueType
  is_active: boolean
  income_account_id?: number | null
  receivable_account_id?: number | null
  income_account?: { id: number; name: string; gl_code?: string } | null
  receivable_account?: { id: number; name: string; gl_code?: string } | null
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface LoanChargePayload {
  name: string
  category: LoanChargeCategory
  charge_type: LoanChargeType
  value: number | string
  frequency: LoanChargeFrequency
  grace_days: number
  max_value?: number | string | null
  max_value_type?: LoanChargeMaxValueType
  is_active?: boolean
  income_account_id?: number | null
  receivable_account_id?: number | null
  description?: string | null
}

export const loanChargesApi = {
  list(params?: {
    search?: string
    category?: string
    is_active?: string
    page?: number
    per_page?: number
  }) {
    return tenantClient.get('/loan-charges', { params })
  },

  get(id: number) {
    return tenantClient.get(`/loan-charges/${id}`)
  },

  create(data: LoanChargePayload) {
    return tenantClient.post('/loan-charges', data)
  },

  update(id: number, data: LoanChargePayload) {
    return tenantClient.put(`/loan-charges/${id}`, data)
  },

  destroy(id: number) {
    return tenantClient.delete(`/loan-charges/${id}`)
  },

  toggle(id: number) {
    return tenantClient.patch(`/loan-charges/${id}/toggle`)
  },
}
