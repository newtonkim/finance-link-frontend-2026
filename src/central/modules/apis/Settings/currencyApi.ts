import { apiClient } from '@/central/api/client'

export interface CentralCurrencySettings {
  default_currency: string
  enabled_currencies: string[]
}

export function centralCurrencyApi() {
  async function show() {
    return apiClient.post('central/settings/currency/show', {})
  }

  async function update(data: CentralCurrencySettings) {
    return apiClient.post('central/settings/currency/update', data)
  }

  return { show, update }
}
