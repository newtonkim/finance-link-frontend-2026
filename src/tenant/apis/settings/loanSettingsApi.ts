import type { AxiosResponse } from 'axios'
import { tenantClient } from '../tenantClient'

export interface LoanSetting {
  id: number
  branch_id: number
  min_approvers: number
  max_approvers: number

  auto_penalty: boolean
  penalty_grace_days: number
  loan_cycle_limit: number
  charge_deduction_mode: string
  repayment_allocation_order:
    | 'principal_interest_penalties_charges'
    | 'interest_principal_penalties_charges'
    | 'penalties_charges_interest_principal'
    | 'penalties_charges_principal_interest'
}

type LoanSettingResponse = AxiosResponse<{ data: LoanSetting }>

const SETTINGS_CACHE_TTL_MS = 60_000
let cachedSettings: LoanSetting | null = null
let cachedAt = 0
let inflightGet: Promise<LoanSettingResponse> | null = null

function fromCache(): LoanSettingResponse {
  return {
    data: { data: cachedSettings as LoanSetting },
  } as LoanSettingResponse
}

function isCacheFresh(): boolean {
  return cachedSettings !== null && Date.now() - cachedAt < SETTINGS_CACHE_TTL_MS
}

export const loanSettingsApi = {
  get(options?: { force?: boolean }) {
    const force = options?.force === true

    if (!force && isCacheFresh()) {
      return Promise.resolve(fromCache())
    }

    if (!force && inflightGet) {
      return inflightGet
    }

    inflightGet = tenantClient
      .get<{ data: LoanSetting }>('/loan-settings')
      .then((response) => {
        cachedSettings = response.data?.data ?? null
        cachedAt = Date.now()
        return response
      })
      .finally(() => {
        inflightGet = null
      })

    return inflightGet
  },

  update(data: Partial<LoanSetting>) {
    return tenantClient
      .put<{ message: string; data: LoanSetting }>('/loan-settings', data)
      .then((response) => {
        cachedSettings = response.data?.data ?? null
        cachedAt = Date.now()
        return response
      })
  },

  clearCache() {
    cachedSettings = null
    cachedAt = 0
  },
}
