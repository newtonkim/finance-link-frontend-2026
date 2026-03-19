import { tenantClient } from '@/tenant/apis/tenantClient'

export interface CurrencyOption {
  code: string
  name: string
  symbol?: string
}

export interface CurrencySettings {
  default_currency: string
  enabled_currencies: string[]
}

export const currenciesApi = {
  list() {
    return tenantClient.get('/currencies')
  },
  getSettings() {
    // return tenantClient.get('/currency-settings')
  },
  updateSettings(data: CurrencySettings) {
    // return tenantClient.put('/currency-settings', data)
  },
}
