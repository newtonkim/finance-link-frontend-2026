import { tenantClient } from '@/tenant/apis/tenantClient'

export interface CashFlowParams {
  from?: string
  to?: string
  compare_from?: string
  compare_to?: string
  hide_zero?: 0 | 1
  branch_id?: number | null
}
export interface CashFlowAccount {
  id: number
  gl_code: string | null
  name: string | null
  amount: string
  compare_amount: string
}
export interface CashFlowRow {
  key: string
  label: string
  hint: string
  direction: 'in' | 'out' | 'net'
  amount: string
  compare_amount: string
  accounts: CashFlowAccount[]
}
export type CashFlowSectionKey = 'operating' | 'investing' | 'financing' | 'other'
export interface CashFlowSection {
  key: CashFlowSectionKey
  label: string
  total: string
  compare_total: string
  rows: CashFlowRow[]
}
export interface CashFlowMonth {
  month: string
  operating: string
  investing: string
  financing: string
  other: string
  net: string
  closing_cash: string
}
/** Amounts are exact decimal strings; a negative amount is cash paid out. */
export interface CashFlowResponse {
  entity: string
  currency: string
  method: 'direct'
  basis: string
  from: string
  to: string
  compare_from: string
  compare_to: string
  generated_at: string
  scope: { all_branches: boolean; branch_ids: number[]; selected_branch_id: number | null }
  financial_year: { name: string; start_date: string; end_date: string } | null
  period_default: 'financial_year' | 'calendar_year'
  sections: CashFlowSection[]
  summary: {
    opening_cash: string
    closing_cash: string
    net_change: string
    operating: string
    investing: string
    financing: string
    other: string
    cash_in: string
    cash_out: string
    compare_opening_cash: string
    compare_closing_cash: string
    compare_net_change: string
    compare_operating: string
    compare_investing: string
    compare_financing: string
    compare_other: string
  }
  cash_accounts: {
    id: number
    gl_code: string
    name: string
    opening: string
    closing: string
    change: string
  }[]
  monthly: CashFlowMonth[]
  diagnostics: {
    issues: { account_id: number; gl_code: string | null; name: string; message: string }[]
    classification_complete: boolean
    has_movements: boolean
    cash_account_count: number
    difference: string
    compare_difference: string
  }
}
export interface CashFlowLedgerResponse {
  account: { id: number; gl_code: string; name: string }
  data: {
    id: number
    date: string
    entry_no: string | null
    description: string | null
    cash_in: string
    cash_out: string
  }[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}
export const cashFlowApi = {
  async getStatement(params: CashFlowParams): Promise<CashFlowResponse> {
    return (await tenantClient.get('/reports/cash-flow', { params })).data
  },
  async getLedger(params: {
    account_id: number
    from: string
    to: string
    page?: number
    branch_id?: number | null
  }): Promise<CashFlowLedgerResponse> {
    return (await tenantClient.get('/reports/cash-flow/ledger', { params })).data
  },
}
