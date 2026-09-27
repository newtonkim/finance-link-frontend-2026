import { tenantClient } from '@/tenant/apis/tenantClient'
import type { LedgerParams } from './trialBalanceApi'

export interface IncomeStatementParams {
  from?: string
  to?: string
  compare_from?: string
  compare_to?: string
  hide_zero?: 0 | 1
  branch_id?: number | null
}
export interface IncomeAccount {
  id: number
  gl_code: string
  name: string
  amount: string
  compare_amount: string
}
export interface IncomeRow {
  key: string
  label: string
  kind: 'section' | 'subtotal'
  amount: string
  compare_amount: string
  accounts: IncomeAccount[]
}
export interface IncomeStatementResponse {
  entity: string
  currency: string
  basis: string
  from: string
  to: string
  compare_from: string
  compare_to: string
  generated_at: string
  mapping_version: string
  scope: { all_branches: boolean; branch_ids: number[]; selected_branch_id: number | null }
  financial_year: { name: string; start_date: string; end_date: string } | null
  period_default: 'financial_year' | 'calendar_year'
  rows: IncomeRow[]
  totals: { surplus: string; compare_surplus: string }
  diagnostics: {
    issues: { account_id: number; gl_code: string; name: string; message: string }[]
    classification_complete: boolean
    has_movements: boolean
    ledger_surplus: string
    compare_ledger_surplus: string
    difference: string
    compare_difference: string
    closing_transfers_excluded: string
    compare_closing_transfers_excluded: string
  }
}
export interface IncomeLedgerResponse {
  data: {
    id: number
    date: string
    entry_no: string
    description: string | null
    debit: string
    credit: string
    running_movement: string
  }[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}
export const incomeStatementApi = {
  async getStatement(params: IncomeStatementParams): Promise<IncomeStatementResponse> {
    return (await tenantClient.get('/reports/income-statement', { params })).data
  },
  async getLedgerLines(
    params: LedgerParams & { branch_id?: number | null },
  ): Promise<IncomeLedgerResponse> {
    return (await tenantClient.get('/reports/income-statement/ledger', { params })).data
  },
}
