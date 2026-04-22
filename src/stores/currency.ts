import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { currenciesApi, type CurrencySettings } from '@/tenant/apis/currencies/currenciesApi'

function normalizeSettings(settings?: Partial<CurrencySettings> | null): CurrencySettings | null {
  if (!settings?.default_currency) return null

  const enabled = Array.isArray(settings.enabled_currencies) && settings.enabled_currencies.length
    ? Array.from(new Set([...settings.enabled_currencies, settings.default_currency]))
    : [settings.default_currency]

  return {
    default_currency: settings.default_currency,
    enabled_currencies: enabled,
  }
}

export const useCurrencyStore = defineStore('currency', () => {
  const defaultCurrency = ref('UGX')
  const enabledCurrencies = ref<string[]>(['UGX'])
  const loading = ref(false)

  const currencyCode = computed(() => defaultCurrency.value || 'UGX')

  function setSettings(settings?: Partial<CurrencySettings> | null) {
    const normalized = normalizeSettings(settings)
    if (!normalized) return
    defaultCurrency.value = normalized.default_currency
    enabledCurrencies.value = normalized.enabled_currencies
  }

  async function load() {
    if (loading.value) return
    loading.value = true
    try {
      const res:any = await currenciesApi.getSettings()
      const payload = res?.data?.data ?? res?.data ?? null
      setSettings(payload)
    } catch {
      // Keep current in-memory defaults if the backend settings endpoint is unavailable.
    } finally {
      loading.value = false
    }
  }

  return { defaultCurrency, enabledCurrencies, currencyCode, setSettings, load, loading }
})
