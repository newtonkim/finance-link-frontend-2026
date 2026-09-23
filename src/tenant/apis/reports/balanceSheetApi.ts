import { tenantClient } from '@/tenant/apis/tenantClient'

export interface BalanceSheetParams {
  as_at?: string
  compare_to?: string
  hide_zero?: 0 | 1
}

export interface BalanceSheetLine {
  id: number | null
  gl_code: string | null
  name: string
  level: number | null
  is_postable: boolean
  is_computed: boolean
  amount: number
  compare_amount: number
  children: BalanceSheetLine[]
}

export interface BalanceSheetSection {
  key: 'assets' | 'liabilities' | 'equity'
  label: string
  total: number
  compare_total: number
  lines: BalanceSheetLine[]
}

export interface BalanceSheetTotals {
  total_assets: number
  total_liabilities: number
  total_equity: number
  total_liabilities_and_equity: number
  difference: number
  is_balanced: boolean
}

export interface BalanceSheetResponse {
  as_at: string
  compare_to: string
  financial_year: { name: string; start_date: string; end_date: string } | null
  generated_at: string
  sections: BalanceSheetSection[]
  totals: { current: BalanceSheetTotals; compare: BalanceSheetTotals }
}

export const balanceSheetApi = {
  async getBalanceSheet(params: BalanceSheetParams): Promise<BalanceSheetResponse> {
    const res = await tenantClient.get('/reports/balance-sheet', { params })
    return res.data
  },
}
