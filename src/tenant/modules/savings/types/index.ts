export interface Member {
  id: number
  name: string
  member_number: string
  status?: string
}

export interface SavingsProduct {
  id: number
  name: string
  type: 'savings' | 'fixed'
  interest_rate?: number
  default_tenor_months?: number
  interest_payout_type?: string
  charges?: Array<{ id: number; type: string }>
}

export interface SavingsAccount {
  id: number
  account_no: string
  member_id: number
  savings_product_id: number
  account_type: 'savings' | 'fixed'
  balance: number
  initial_deposit: number
  opening_balance: number
  status: 'active' | 'dormant' | 'closed'
  consider_min_balance: boolean
  tenor_months?: number | null
  maturity_date?: string | null
  interest_rate?: number | null
  next_interest_date?: string | null
  created_at: string
  member?: Member
  savings_product?: SavingsProduct
}

export interface Posting {
  id: number
  period_start: string
  period_end: string
  principal: string
  rate: string
  interest_amount: string
  payout_type: string
  posted_by: number | null
  created_at: string
}
