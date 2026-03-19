import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { currenciesApi, type CurrencyOption, type CurrencySettings } from '@/tenant/apis/currencies/currenciesApi'
import { useCurrencyStore } from '@/stores/currency'
import { DEFAULT_CURRENCIES } from '../constants'

function normalizeCurrency(raw: any): CurrencyOption | null {
  const code = raw?.code ?? raw?.currency_code ?? raw?.currency ?? ''
  if (!code) return null
  const name = raw?.name ?? raw?.currency_name ?? code
  const symbol = raw?.symbol ?? raw?.currency_symbol ?? undefined
  return { code, name, symbol }
}

export function useCurrencySettings() {
  const currencyStore = useCurrencyStore()

  const showDrawer = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const search = ref('')
  const multiCurrencyEnabled = ref(true)
  const currencyOptions = ref<CurrencyOption[]>([...DEFAULT_CURRENCIES])
  const form = ref<CurrencySettings>({
    default_currency: 'UGX',
    enabled_currencies: DEFAULT_CURRENCIES.map(c => c.code),
  })

  const filteredCurrencies = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return currencyOptions.value
    const parts = q.split(/\s+/).filter(Boolean)
    return currencyOptions.value.filter(c => {
      const hay = [c.code, c.name, c.symbol].filter(Boolean).join(' ').toLowerCase()
      return parts.every(p => hay.includes(p))
    })
  })

  const defaultCurrencyOptions = computed(() =>
    currencyOptions.value.map(c => ({
      id: c.code,
      name: `${c.code} — ${c.name}${c.symbol ? ` (${c.symbol})` : ''}`,
    }))
  )

  function ensureDefaultEnabled() {
    const code = form.value.default_currency
    if (!code) return
    if (!multiCurrencyEnabled.value) {
      form.value.enabled_currencies = [code]
      return
    }
    if (!form.value.enabled_currencies.includes(code)) {
      form.value.enabled_currencies.push(code)
    }
  }

  function applyMultiCurrencyFlag() {
    if (!multiCurrencyEnabled.value) {
      form.value.enabled_currencies = [form.value.default_currency]
    }
  }

  watch(() => form.value.default_currency, ensureDefaultEnabled)
  watch(multiCurrencyEnabled, applyMultiCurrencyFlag)

  function toggleCurrency(code: string) {
    if (code === form.value.default_currency) return
    const idx = form.value.enabled_currencies.indexOf(code)
    if (idx >= 0) {
      form.value.enabled_currencies.splice(idx, 1)
    } else {
      form.value.enabled_currencies.push(code)
    }
  }

  async function load() {
    loading.value = true
    try {
      const [listRes, settingsRes] = await Promise.allSettled([
        currenciesApi.list(),
        currenciesApi.getSettings(),
      ])

      if (listRes.status === 'fulfilled') {
        const listPayload = listRes.value.data?.data ?? listRes.value.data ?? []
        if (Array.isArray(listPayload) && listPayload.length) {
          const normalized = listPayload.map(normalizeCurrency).filter(Boolean) as CurrencyOption[]
          if (normalized.length) currencyOptions.value = normalized
        }
      }

      if (settingsRes.status === 'fulfilled') {
        const p = settingsRes.value.data?.data ?? settingsRes.value.data ?? null
        if (p) {
          form.value = {
            default_currency: p.default_currency || 'UGX',
            enabled_currencies:
              Array.isArray(p.enabled_currencies) && p.enabled_currencies.length
                ? p.enabled_currencies
                : [p.default_currency || 'UGX'],
          }
          multiCurrencyEnabled.value = form.value.enabled_currencies.length > 1
          currencyStore.setSettings(form.value)
        }
      }

      if (!currencyOptions.value.some(c => c.code === form.value.default_currency)) {
        const fallback = DEFAULT_CURRENCIES.find(c => c.code === form.value.default_currency)
        if (fallback) currencyOptions.value = [fallback, ...currencyOptions.value]
      }

      ensureDefaultEnabled()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to load currency settings.')
    } finally {
      loading.value = false
    }
  }

  function openDrawer() {
    showDrawer.value = true
    load()
  }

  function closeDrawer() {
    showDrawer.value = false
    search.value = ''
  }

  async function save() {
    saving.value = true
    try {
      ensureDefaultEnabled()
      applyMultiCurrencyFlag()
      await currenciesApi.updateSettings(form.value)
      currencyStore.setSettings(form.value)
      closeDrawer()
      toast.success('Currency saved successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Currency did not save.')
    } finally {
      saving.value = false
    }
  }

  return {
    showDrawer, loading, saving, search, multiCurrencyEnabled,
    currencyOptions, form, filteredCurrencies, defaultCurrencyOptions,
    toggleCurrency, openDrawer, closeDrawer, save,
  }
}
