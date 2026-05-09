import { tenantClient } from '@/tenant/apis/tenantClient'

export interface TrialBalanceParams {
  date?: string
  from?: string
  to?: string
}

export interface LedgerParams {
  account_id: number
  from: string
  to: string
  page?: number
}

export const trialBalanceApi = {
  async getTrialBalance(params: TrialBalanceParams) {
    const res = await tenantClient.get('/reports/trial-balance', { params })
    return res.data
  },

  async getLedgerLines(params: LedgerParams) {
    const res = await tenantClient.get('/reports/trial-balance/ledger', { params })
    return res.data
  },
}
