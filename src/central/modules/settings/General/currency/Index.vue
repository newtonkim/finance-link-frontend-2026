<template>
  <div class="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
    <!-- ───────────────────────── Header ───────────────────────── -->
    <div class="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 px-6 pb-5 pt-6 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-start gap-3.5">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#052659] text-white shadow-sm">
            <Coins class="size-5" />
          </div>
          <div>
            <h1 class="text-3xl font-black tracking-tight">Currency</h1>
            <p class="mt-1 text-sm text-neutral-500">
              Set the default currency for the central domain, choose which currencies are available, and check live rates.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 dark:border-neutral-700 dark:bg-neutral-800">
            <span
              class="size-2 rounded-full"
              :class="fetching ? 'animate-pulse bg-amber-400' : ratesLive ? 'animate-pulse bg-emerald-500' : 'bg-neutral-300'"
            />
            <span class="text-xs font-semibold text-neutral-500">{{ statusText }}</span>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-[#052659] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#052659]/90 disabled:opacity-60 dark:bg-bg-nfuko-yellow dark:text-nfuko-primary"
            :disabled="saving || !dirty"
            @click="saveSettings"
          >
            <Spinner v-if="saving" class="size-4" />
            <Check v-else class="size-4" />
            {{ dirty ? 'Save changes' : 'Saved' }}
          </button>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <!-- ───────────────────────── Summary strip ───────────────────────── -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-[#052659]" />
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Default currency</p>
          <div class="mt-2 flex items-center gap-2">
            <span class="text-2xl leading-none">{{ selectedDefault?.flag }}</span>
            <span class="text-2xl font-black">{{ form.default_currency }}</span>
          </div>
          <p class="mt-1 truncate text-xs text-neutral-400">{{ selectedDefault?.name }}</p>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-emerald-500" />
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Enabled currencies</p>
          <p class="mt-2 text-2xl font-black">{{ form.enabled_currencies.length }}</p>
          <p class="mt-1 text-xs text-neutral-400">of {{ CURRENCIES.length }} available</p>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl" :class="ratesLive ? 'bg-emerald-500' : 'bg-amber-400'" />
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Rate source</p>
          <p class="mt-2 text-lg font-black">{{ ratesLive ? 'Live' : 'Offline' }}</p>
          <p class="mt-1 truncate text-xs text-neutral-400">{{ ratesLive ? 'open.er-api.com' : 'Reference fallback' }}</p>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-neutral-300 dark:bg-neutral-600" />
          <div class="flex items-start justify-between">
            <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Last sync</p>
            <button
              type="button"
              class="text-neutral-300 transition-colors hover:text-[#052659] disabled:opacity-50"
              :disabled="fetching"
              title="Refresh rates"
              @click="fetchRates"
            >
              <RefreshCw :class="['size-4', fetching ? 'animate-spin' : '']" />
            </button>
          </div>
          <p class="mt-2 text-sm font-bold leading-snug">{{ lastSyncLabel }}</p>
        </div>
      </div>

      <!-- ───────────────────────── Two-column workspace ───────────────────────── -->
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]">
        <!-- ░░ LEFT — settings & reference ░░ -->
        <section class="space-y-5">
          <!-- Default currency -->
          <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div class="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-base font-black">Default currency</h2>
                <p class="mt-1 text-sm text-neutral-500">Applied across the central domain as the primary currency.</p>
              </div>
              <span
                v-if="dirty"
                class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:bg-amber-900/30"
              >
                <span class="size-1.5 rounded-full bg-amber-500" /> Unsaved
              </span>
            </div>

            <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div class="flex items-center gap-4 rounded-2xl border border-[#052659]/15 bg-[#052659]/[0.03] px-5 py-4 sm:min-w-[200px]">
                <span class="text-4xl leading-none">{{ selectedDefault?.flag }}</span>
                <div>
                  <p class="text-2xl font-black text-[#052659] dark:text-white">{{ form.default_currency }}</p>
                  <p class="text-sm font-medium text-neutral-500">{{ selectedDefault?.name }}</p>
                </div>
              </div>
              <div class="flex-1 space-y-1.5">
                <label class="block text-xs font-bold uppercase tracking-wide text-neutral-500">Change default</label>
                <SearchableSelect
                  :modelValue="form.default_currency"
                  :options="currencyOptions"
                  placeholder="currency"
                  @update:modelValue="form.default_currency = $event"
                >
                  <template #option="{ item }">
                    <span class="flex items-center gap-2.5">
                      <span class="text-lg leading-none">{{ item.flag }}</span>
                      <span>
                        <span class="block text-sm font-bold">{{ item.code }}</span>
                        <span class="block text-xs text-neutral-400">{{ item.subtitle }}</span>
                      </span>
                    </span>
                  </template>
                </SearchableSelect>
                <p class="text-xs text-neutral-400">The default is always kept in the enabled list.</p>
              </div>
            </div>
          </div>

          <!-- Enabled currencies -->
          <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-black">Enabled currencies</h2>
                <p class="mt-1 text-sm text-neutral-500">Choose which currencies appear in the converter and selectors.</p>
              </div>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-500 dark:bg-neutral-800">
                {{ form.enabled_currencies.length }} selected
              </span>
            </div>

            <div class="grid max-h-[340px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              <button
                v-for="currency in CURRENCIES"
                :key="currency.code"
                type="button"
                class="group flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed"
                :class="form.enabled_currencies.includes(currency.code)
                  ? 'border-[#052659]/30 bg-[#052659]/[0.04]'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'"
                :disabled="currency.code === form.default_currency"
                @click="toggleEnabled(currency.code)"
              >
                <span class="flex min-w-0 items-center gap-2.5">
                  <span class="text-lg leading-none">{{ currency.flag }}</span>
                  <span class="min-w-0">
                    <span class="flex items-center gap-1.5 text-sm font-bold">
                      {{ currency.code }}
                      <span
                        v-if="currency.code === form.default_currency"
                        class="rounded bg-[#052659]/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#052659]"
                      >Default</span>
                    </span>
                    <span class="block truncate text-xs text-neutral-500">{{ currency.name }}</span>
                  </span>
                </span>
                <CheckCircle2 v-if="form.enabled_currencies.includes(currency.code)" class="size-5 shrink-0 text-[#052659]" />
                <Circle v-else class="size-5 shrink-0 text-neutral-300 group-hover:text-neutral-400" />
              </button>
            </div>
          </div>

          <!-- Reference table -->
          <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <div>
                <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">Exchange rate reference</h3>
                <p class="mt-0.5 text-xs text-neutral-400">All rates per 1 USD · {{ statusText }}</p>
              </div>
              <div class="relative">
                <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  v-model="tableSearch"
                  type="text"
                  placeholder="Search currency…"
                  class="w-48 rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm font-medium outline-none transition-all focus:border-[#052659]/40 focus:ring-2 focus:ring-[#052659]/10 dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
            </div>

            <div v-if="filteredCurrencies.length" class="grid gap-2 p-4 sm:grid-cols-2">
              <div
                v-for="currency in filteredCurrencies"
                :key="currency.code"
                class="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 transition-colors hover:border-[#052659]/30 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/40"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <span class="text-xl leading-none">{{ currency.flag }}</span>
                  <div class="min-w-0">
                    <p class="flex items-center gap-1.5 text-sm font-bold leading-tight text-neutral-800 dark:text-neutral-100">
                      {{ currency.code }}
                      <span
                        v-if="form.enabled_currencies.includes(currency.code)"
                        class="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-600 dark:bg-emerald-900/30"
                      >On</span>
                    </p>
                    <p class="truncate text-[11px] text-neutral-400">{{ currency.name }}</p>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <div class="text-right">
                    <p class="font-mono text-sm font-black leading-none">{{ formatRate(rates[currency.code] ?? 0) }}</p>
                    <p class="mt-0.5 text-[10px] text-neutral-400">/ USD</p>
                  </div>
                  <button
                    type="button"
                    class="rounded-lg border border-neutral-200 p-1.5 text-neutral-400 transition-all hover:border-[#052659] hover:text-[#052659] dark:border-neutral-700"
                    title="Use in converter"
                    @click="fromCode = 'USD'; toCode = currency.code"
                  >
                    <ArrowUpDown class="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="flex flex-col items-center gap-2 py-12 text-neutral-400">
              <Search class="size-7 opacity-30" />
              <p class="text-sm font-semibold">No currencies match “{{ tableSearch }}”.</p>
            </div>
          </div>
        </section>

        <!-- ░░ RIGHT — converter & live conversions (sticky) ░░ -->
        <aside class="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <!-- Quick converter -->
          <section class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="h-[3px]" style="background:linear-gradient(90deg,#052659,#0050D8,#818cf8,#0050D8,#052659)" />
          <div class="p-5">
            <div class="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-black">Quick converter</h2>
                <p class="mt-1 text-sm text-neutral-500">Convert between your enabled currencies.</p>
              </div>
              <span
                v-if="ratesLive"
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:bg-emerald-900/30"
              >
                <span class="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:bg-amber-900/30"
              >
                <span class="size-1.5 rounded-full bg-amber-400" /> Offline
              </span>
            </div>

            <div class="space-y-3">
              <!-- From -->
              <div class="converter-box">
                <p class="mb-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-neutral-400">From</p>
                <select v-model="fromCode" class="currency-select">
                  <option v-for="currency in enabledCurrencyOptions" :key="currency.code" :value="currency.code">
                    {{ currency.flag }} {{ currency.code }} — {{ currency.name }}
                  </option>
                </select>
                <input
                  v-model.number="amount"
                  type="number"
                  min="0"
                  step="any"
                  class="amount-input"
                  placeholder="1"
                />
              </div>

              <!-- Swap -->
              <div class="flex justify-center">
                <button
                  type="button"
                  class="group -my-1.5 flex size-9 items-center justify-center rounded-full border-2 border-neutral-200 bg-white transition-all hover:border-[#052659] hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
                  title="Swap currencies"
                  @click="swapCurrencies"
                >
                  <ArrowUpDown class="size-4 text-neutral-400 transition-colors group-hover:text-[#052659]" />
                </button>
              </div>

              <!-- To -->
              <div class="converter-box border-[#052659]/20 bg-[#052659]/[0.02]">
                <p class="mb-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-neutral-400">To</p>
                <select v-model="toCode" class="currency-select">
                  <option v-for="currency in enabledCurrencyOptions" :key="currency.code" :value="currency.code">
                    {{ currency.flag }} {{ currency.code }} — {{ currency.name }}
                  </option>
                </select>
                <p class="amount-result text-[#052659] dark:text-white">
                  {{ smartFormat(convert(amount, fromCode, toCode)) }}
                </p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <div class="rounded-xl bg-[#052659]/[0.06] px-3 py-2.5 text-center">
                <p class="text-[11px] font-semibold text-neutral-400">1 {{ fromCode }} =</p>
                <p class="text-sm font-black text-[#052659] dark:text-white">{{ formatRate(convert(1, fromCode, toCode)) }} {{ toCode }}</p>
              </div>
              <div class="rounded-xl bg-neutral-100 px-3 py-2.5 text-center dark:bg-neutral-800">
                <p class="text-[11px] font-semibold text-neutral-400">1 {{ toCode }} =</p>
                <p class="text-sm font-black">{{ formatRate(convert(1, toCode, fromCode)) }} {{ fromCode }}</p>
              </div>
            </div>
          </div>
          </section>

          <!-- Live conversions (compact list) -->
          <section class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div class="border-b border-neutral-100 px-5 py-3.5 dark:border-neutral-800">
              <h3 class="text-sm font-black text-neutral-800 dark:text-neutral-100">
                {{ smartFormat(amount || 1) }} {{ fromCode }} {{ fromCurrency?.flag }} converts to
              </h3>
              <p class="mt-0.5 text-xs text-neutral-400">Tap a row to set it as the target</p>
            </div>
            <div class="max-h-[360px] divide-y divide-neutral-50 overflow-y-auto dark:divide-neutral-800/60">
              <button
                v-for="currency in enabledCurrencyOptions"
                :key="currency.code"
                type="button"
                class="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors"
                :class="[
                  currency.code === fromCode ? 'cursor-default opacity-50' : 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
                  currency.code === toCode && currency.code !== fromCode ? 'bg-[#052659]/[0.04]' : '',
                ]"
                @click="currency.code !== fromCode && (toCode = currency.code)"
              >
                <span class="flex min-w-0 items-center gap-2.5">
                  <span class="text-xl leading-none">{{ currency.flag }}</span>
                  <span class="min-w-0">
                    <span class="block text-xs font-black uppercase tracking-wide" :class="currency.code === toCode ? 'text-[#052659]' : 'text-neutral-600 dark:text-neutral-300'">{{ currency.code }}</span>
                    <span class="block truncate text-[11px] leading-tight text-neutral-400">{{ currency.name }}</span>
                  </span>
                </span>
                <span class="shrink-0 text-right">
                  <span class="block text-sm font-black" :class="currency.code === toCode ? 'text-[#052659] dark:text-white' : ''">
                    <span class="mr-0.5 text-xs font-bold text-neutral-400">{{ currency.symbol }}</span>{{ smartFormat(convert(amount || 1, fromCode, currency.code)) }}
                  </span>
                  <span class="block text-[11px] text-neutral-400">1 {{ fromCode }} = {{ formatRate(convert(1, fromCode, currency.code)) }}</span>
                </span>
              </button>
            </div>
          </section>
        </aside>
      </div>

      <p class="pb-4 text-center text-xs leading-relaxed text-neutral-400">
        Rates are {{ ratesLive ? 'sourced live from open.er-api.com' : 'approximate reference values from the offline fallback' }}.
        Verify with your bank or transfer service before transacting.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowUpDown, CheckCircle2, Check, Circle, Coins, RefreshCw, Search } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Spinner, SearchableSelect } from '@/Global'
import { centralCurrencyApi, type CentralCurrencySettings } from '@/central/modules/apis/Settings'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', symbol: '¥' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽', symbol: 'MX$' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪', symbol: 'KES' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬', symbol: 'UGX' },
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿', symbol: 'TSh' },
  { code: 'RWF', name: 'Rwandan Franc', flag: '🇷🇼', symbol: 'FRw' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '🇬🇭', symbol: '₵' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', symbol: 'SAR' },
]

const FALLBACK: Record<string, number> = {
  USD: 1.0000, EUR: 0.9198, GBP: 0.7872, JPY: 157.18, CHF: 0.8991,
  CAD: 1.3614, AUD: 1.5274, CNY: 7.2584, HKD: 7.8183, SGD: 1.3402,
  INR: 83.920, MXN: 17.480, KES: 129.50, UGX: 3735.0, TZS: 2605.0,
  RWF: 1304.0, ZAR: 18.12, NGN: 1487.0, GHS: 15.28, AED: 3.6725, SAR: 3.7500,
}

const api = centralCurrencyApi()
const amount = ref<number>(1)
const fromCode = ref('USD')
const toCode = ref('UGX')
const rates = ref<Record<string, number>>({ ...FALLBACK })
const fetching = ref(false)
const saving = ref(false)
const ratesLive = ref(false)
const ratesUpdated = ref('')
const tableSearch = ref('')
const savedSnapshot = ref('')
const form = ref<CentralCurrencySettings>({
  default_currency: 'UGX',
  enabled_currencies: ['USD', 'KES', 'UGX'],
})

const enabledCurrencyOptions = computed(() =>
  CURRENCIES.filter(currency => form.value.enabled_currencies.includes(currency.code))
)
const currencyOptions = computed(() =>
  CURRENCIES.map(currency => ({
    id: currency.code,
    name: `${currency.flag} ${currency.code} — ${currency.name}`,
    code: currency.code,
    subtitle: currency.name,
    flag: currency.flag,
    symbol: currency.symbol,
  }))
)
const fromCurrency = computed(() => CURRENCIES.find(currency => currency.code === fromCode.value))
const selectedDefault = computed(() => CURRENCIES.find(currency => currency.code === form.value.default_currency))
const statusText = computed(() =>
  fetching.value ? 'Fetching live rates…' : ratesUpdated.value || 'Reference rates (offline)'
)
const lastSyncLabel = computed(() => {
  if (fetching.value) return 'Fetching…'
  return ratesUpdated.value ? ratesUpdated.value.replace(/^Updated /, '') : 'Not synced yet'
})
const dirty = computed(() =>
  JSON.stringify({
    d: form.value.default_currency,
    e: [...form.value.enabled_currencies].sort(),
  }) !== savedSnapshot.value
)
const filteredCurrencies = computed(() => {
  const query = tableSearch.value.trim().toLowerCase()
  if (!query) return CURRENCIES
  return CURRENCIES.filter(currency =>
    currency.code.toLowerCase().includes(query) || currency.name.toLowerCase().includes(query)
  )
})

function snapshot() {
  savedSnapshot.value = JSON.stringify({
    d: form.value.default_currency,
    e: [...form.value.enabled_currencies].sort(),
  })
}

function normalizeSettings(settings?: Partial<CentralCurrencySettings> | null): CentralCurrencySettings {
  const defaultCurrency = settings?.default_currency || 'UGX'
  const enabled = Array.isArray(settings?.enabled_currencies) && settings.enabled_currencies.length
    ? settings.enabled_currencies
    : ['USD', defaultCurrency]

  return {
    default_currency: defaultCurrency,
    enabled_currencies: Array.from(new Set([...enabled, defaultCurrency])),
  }
}

function applySettings(settings: CentralCurrencySettings) {
  form.value = normalizeSettings(settings)
  toCode.value = form.value.default_currency
  snapshot()

  if (!form.value.enabled_currencies.includes(fromCode.value)) {
    fromCode.value = form.value.enabled_currencies.includes('USD') ? 'USD' : form.value.enabled_currencies[0]
  }
}

function toggleEnabled(code: string) {
  if (code === form.value.default_currency) return

  form.value.enabled_currencies = form.value.enabled_currencies.includes(code)
    ? form.value.enabled_currencies.filter(item => item !== code)
    : [...form.value.enabled_currencies, code]
}

function ensureDefaultEnabled() {
  if (!form.value.enabled_currencies.includes(form.value.default_currency)) {
    form.value.enabled_currencies = [form.value.default_currency, ...form.value.enabled_currencies]
  }
}

function convert(value: number, from: string, to: string): number {
  if (!value || isNaN(value)) return 0
  const r = rates.value
  if (!r[from] || !r[to]) return 0
  return (value / r[from]) * r[to]
}

function smartFormat(value: number): string {
  if (!value || isNaN(value)) return '0.00'
  if (value >= 100_000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (value >= 1_000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (value >= 1) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

function formatRate(value: number): string {
  if (!value || isNaN(value)) return '0'
  if (value >= 10_000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (value >= 100) return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (value >= 1) return value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  return value.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })
}

function swapCurrencies() {
  ;[fromCode.value, toCode.value] = [toCode.value, fromCode.value]
}

async function loadSettings() {
  try {
    const res = await api.show()
    const payload = res?.data?.payload?.data ?? res?.data?.payload ?? res?.data?.data ?? null
    applySettings(normalizeSettings(payload))
  } catch {
    applySettings(form.value)
  }
}

async function saveSettings() {
  saving.value = true
  try {
    ensureDefaultEnabled()
    const res = await api.update(form.value)
    const payload = res?.data?.payload?.data ?? res?.data?.payload ?? res?.data?.data ?? form.value
    applySettings(normalizeSettings(payload))
    toast.success(`${form.value.default_currency} is now the central default currency.`)
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Central currency did not save.')
  } finally {
    saving.value = false
  }
}

async function fetchRates() {
  fetching.value = true
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await res.json()
    if (data?.result === 'success' && data.rates) {
      const filtered: Record<string, number> = {}
      for (const currency of CURRENCIES) {
        filtered[currency.code] = data.rates[currency.code] ?? FALLBACK[currency.code]
      }
      rates.value = filtered
      ratesLive.value = true
      ratesUpdated.value = `Updated ${new Date(data.time_last_update_utc).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })}`
    }
  } catch {
    ratesLive.value = false
    ratesUpdated.value = 'Reference rates (offline)'
  } finally {
    fetching.value = false
  }
}

watch(() => form.value.default_currency, () => {
  ensureDefaultEnabled()
  toCode.value = form.value.default_currency
})

onMounted(async () => {
  await loadSettings()
  fetchRates()
})
</script>

<style scoped>
.converter-box {
  border-radius: 16px;
  border: 2px solid rgb(229 231 235);
  padding: 12px 16px 14px;
  background: white;
  transition: border-color 0.15s;
}

:deep(.dark) .converter-box,
.dark .converter-box {
  background: rgb(23 23 23);
  border-color: rgb(55 65 81);
}

.currency-select {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 800;
  color: inherit;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  margin-bottom: 8px;
  padding: 0;
}

.field-select {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgb(229 231 235);
  background: white;
  padding: 10px 12px;
  font-size: 0.875rem;
  font-weight: 700;
  color: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-select:focus {
  border-color: rgba(5, 38, 89, 0.4);
  box-shadow: 0 0 0 3px rgba(5, 38, 89, 0.1);
}

:deep(.dark) .field-select,
.dark .field-select {
  background: rgb(23 23 23);
  border-color: rgb(55 65 81);
}

.amount-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 2rem;
  font-weight: 900;
  color: inherit;
  outline: none;
  padding: 0;
  -moz-appearance: textfield;
}

.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.amount-result {
  font-size: 2rem;
  font-weight: 900;
  padding: 0;
  line-height: 1.2;
  word-break: break-all;
}
</style>
