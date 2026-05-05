import { getLocalValues } from '@/Global'
import { tenantClient } from '../tenantClient'

export interface Charge {
  id?: number
  type: 'deposit' | 'withdraw' | 'transfer'
  minimum_amount: number | string
  maximum_amount?: number | string | null
  charge_type: 'percentage' | 'amount'
  amount: number | string
}

export interface SavingsProduct {
  id?: number

  name: string
  branch_id?: string
  type: 'fixed' | 'standard'
  minimum_balance: number | string
  minimum_maturity_months: number
  dormancy_period_months: number
  charge_on_deposit: boolean
  charge_on_withdraw: boolean
  charge_on_transfer: boolean
  status: 'active' | 'inactive'
  monthly_fee_enabled?: boolean
  monthly_fee_type?: 'percentage' | 'amount' | null
  monthly_fee_amount?: number | string | null
  monthly_fee_deduction_day?: number | null
  loyalty_fee_enabled?: boolean
  loyalty_adjustment_type?: 'discount_percentage' | 'fixed_discount' | 'custom_fee' | null
  loyalty_adjustment_value?: number | string | null
  charges?: Charge[]
  // Fixed deposit fields
  interest_rate?: number | null            // stored as decimal e.g. 0.1200
  interest_payout_type?: 'at_maturity' | 'periodic_payout' | 'compound' | null
  interest_posting_frequency?: 'monthly' | 'quarterly' | 'semi_annually' | 'annually' | null
  default_tenor_months?: number | null
  maturity_action?: 'auto_rollover' | 'manual' | 'convert_to_savings' | null
  convert_to_product_id?: number | null
  interest_expense_account_id?: number | null
  interest_payable_account_id?: number | null
}

export const savingsProductsApi = {
  list(params?: { search?: string; status?: string }) {
    return tenantClient.get('/savings-products', { params })
  },
  get(id: number) {
    return tenantClient.get(`/savings-products/${id}`)
  },
  create(data: SavingsProduct) {
   const  activeBranch = getLocalValues('activeBranch' as const) as any

    data.branch_id = activeBranch
    return tenantClient.post('/savings-products', data)
  },
  update(id: number, data: SavingsProduct) {
    return tenantClient.put(`/savings-products/${id}`, data)
  },
  delete(id: number) {
    return tenantClient.delete(`/savings-products/${id}`)
  },
}
