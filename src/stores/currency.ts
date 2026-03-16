import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { currenciesApi, type CurrencySettings } from '@/tenant/apis/currencies/currenciesApi'

export const useCurrencyStore = defineStore('currency', () => {
  const defaultCurrency = ref('UGX')
  const enabledCurrencies = ref<string[]>(['UGX'])
  const loading = ref(false)

  const currencyCode = computed(() => defaultCurrency.value || 'UGX')

  function setSettings(settings?: Partial<CurrencySettings> | null) {
    if (!settings) return
    if (settings.default_currency) defaultCurrency.value = settings.default_currency
    if (Array.isArray(settings.enabled_currencies) && settings.enabled_currencies.length) {
      enabledCurrencies.value = settings.enabled_currencies
    } else if (settings.default_currency) {
      enabledCurrencies.value = [settings.default_currency]
    }
  }

  async function load() {
    if (loading.value) return
    loading.value = true
    try {
      const res = await currenciesApi.getSettings()
      const payload = res.data?.data ?? res.data ?? null
      setSettings(payload)
    } finally {
      loading.value = false
    }
  }

  return { defaultCurrency, enabledCurrencies, currencyCode, setSettings, load, loading }
})
