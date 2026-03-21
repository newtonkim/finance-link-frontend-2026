export interface FiscalYear {
  id: number
  name: string
  start_date: string
  end_date: string
}

export interface Meta {
  current_page: number
  last_page: number
  total: number
}

export interface GeneralCharge {
  id: number
  name: string
  application: string
  where_to_apply: string | null
  charge_type: string | null
  amount: string
  is_active: boolean
  is_reversible: boolean
  is_revenue: boolean
  saving_product_ids?: number[]
  loan_product_ids?: number[]
  credit_account_id?: number | null
  is_fine?: boolean
  interval_type?: string | null
  interval?: number | null
}
