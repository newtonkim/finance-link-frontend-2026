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
}

export const savingsProductsApi = {
  list(params?: { search?: string; status?: string }) {
    return tenantClient.get('/savings-products', { params })
  },
  get(id: number) {
    return tenantClient.get(`/savings-products/${id}`)
  },
  create(data: SavingsProduct) {
    return tenantClient.post('/savings-products', data)
  },
  update(id: number, data: SavingsProduct) {
    return tenantClient.put(`/savings-products/${id}`, data)
  },
  delete(id: number) {
    return tenantClient.delete(`/savings-products/${id}`)
  },
}
