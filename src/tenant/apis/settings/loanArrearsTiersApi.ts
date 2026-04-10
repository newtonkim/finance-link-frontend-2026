import type { AxiosResponse } from 'axios'
import { tenantClient } from '../tenantClient'

export interface LoanArrearsTier {
  id?: number
  tenant_id?: number
  from_day: number
  to_day: number | null
  charge_type: 'flat' | 'percentage'
  charge_value: number
  applies_to: 'outstanding_balance' | 'principal_due' | 'installment_due'
  is_active: boolean
}

interface ArrearsTiersPayload {
  tiers: LoanArrearsTier[]
}

type ArrearsTiersResponse = AxiosResponse<{ data: LoanArrearsTier[] }>

const TIERS_CACHE_TTL_MS = 60_000
let cachedTiers: LoanArrearsTier[] | null = null
let cachedAt = 0
let inflightGet: Promise<ArrearsTiersResponse> | null = null

function fromCache(): ArrearsTiersResponse {
  return {
    data: { data: cachedTiers as LoanArrearsTier[] },
  } as ArrearsTiersResponse
}

function isCacheFresh(): boolean {
  return cachedTiers !== null && Date.now() - cachedAt < TIERS_CACHE_TTL_MS
}

export const loanArrearsTiersApi = {
  get(options?: { force?: boolean }) {
    const force = options?.force === true

    if (!force && isCacheFresh()) {
      return Promise.resolve(fromCache())
    }

    if (!force && inflightGet) {
      return inflightGet
    }

    inflightGet = tenantClient
      .get<{ data: LoanArrearsTier[] }>('/loan-arrears-tiers')
      .then((response) => {
        cachedTiers = response.data?.data ?? []
        cachedAt = Date.now()
        return response
      })
      .finally(() => {
        inflightGet = null
      })

    return inflightGet
  },

  bulkUpdate(data: ArrearsTiersPayload) {
    return tenantClient
      .put<{ message: string; data: LoanArrearsTier[] }>('/loan-arrears-tiers', data)
      .then((response) => {
        cachedTiers = response.data?.data ?? []
        cachedAt = Date.now()
        return response
      })
  },

  clearCache() {
    cachedTiers = null
    cachedAt = 0
  },
}
