<script setup lang="ts">
import { Coins, Search, X } from 'lucide-vue-next'
import { Spinner, Label } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { useCurrencySettings } from '../composables/useCurrencySettings'
import { INPUT_CLS } from '../constants'

const {
  showDrawer, loading, saving, search, multiCurrencyEnabled,
  form, filteredCurrencies, defaultCurrencyOptions,
  toggleCurrency, openDrawer, closeDrawer, save,
} = useCurrencySettings()

defineExpose({ openDrawer })
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="showDrawer" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer" />
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[620px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="Currency Settings"
        >
          <div class="flex h-full flex-col">
            <!-- Header -->
            <div class="border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                    <Coins class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                  </div>
                  <div>
                    <h3 class="text-lg font-bold tracking-tight text-neutral-900 uppercase dark:text-white">Currency Settings</h3>
                    <p class="text-xs text-neutral-500">Select system default and enabled currencies</p>
                  </div>
                </div>
                <button type="button" @click="closeDrawer" class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800">
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input v-model="search" type="text" placeholder="Search currency by code or name" :class="INPUT_CLS" />
                </div>
              </div>

              <div class="space-y-2">
                <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Default currency</Label>
                <SearchableSelect v-model="form.default_currency" :options="defaultCurrencyOptions" placeholder="Search default currency" state="currency-default" />
                <p class="text-xs text-neutral-500">Default is {{ form.default_currency || 'UGX' }}.</p>
              </div>

              <div class="space-y-3">
                <!-- Multi-currency toggle -->
                <div class="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/60">
                  <div>
                    <p class="text-sm font-semibold text-neutral-900 dark:text-white">Multi-currency</p>
                    <p class="text-xs text-neutral-500">Allow transactions in more than one currency.</p>
                  </div>
                  <button
                    type="button"
                    @click="multiCurrencyEnabled = !multiCurrencyEnabled"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
                    :class="multiCurrencyEnabled ? 'bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
                      :class="multiCurrencyEnabled ? 'translate-x-6' : 'translate-x-1'"
                    />
                  </button>
                </div>

                <div class="flex items-center justify-between">
                  <Label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Enabled currencies</Label>
                  <span class="text-xs text-neutral-500">{{ form.enabled_currencies.length }} selected</span>
                </div>

                <div v-if="loading" class="space-y-3">
                  <div v-for="i in 6" :key="i" class="h-10 rounded-lg bg-neutral-100 animate-pulse dark:bg-neutral-800" />
                </div>

                <div v-else class="grid gap-3 sm:grid-cols-2" :class="!multiCurrencyEnabled ? 'opacity-50 pointer-events-none' : ''">
                  <button
                    v-for="c in filteredCurrencies"
                    :key="c.code"
                    type="button"
                    @click="toggleCurrency(c.code)"
                    :disabled="c.code === form.default_currency"
                    class="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-75"
                    :class="form.enabled_currencies.includes(c.code)
                      ? 'border-nfuko-primary bg-nfuko-primary/5 dark:border-bg-nfuko-yellow dark:bg-bg-nfuko-yellow/10'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'"
                  >
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                        {{ c.code }}
                      </div>
                      <div>
                        <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ c.name }}</p>
                        <p class="text-xs text-neutral-500">{{ c.symbol || '—' }}</p>
                      </div>
                    </div>
                    <div
                      class="h-5 w-5 rounded-full border-2 transition-colors"
                      :class="form.enabled_currencies.includes(c.code)
                        ? 'border-nfuko-primary bg-nfuko-primary dark:border-bg-nfuko-yellow dark:bg-bg-nfuko-yellow'
                        : 'border-neutral-300 dark:border-neutral-600'"
                    />
                  </button>
                </div>

                <p class="text-xs text-neutral-500">
                  The default currency cannot be disabled.
                  <span v-if="!multiCurrencyEnabled"> Multi-currency is off, so only the default is active.</span>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <button type="button" @click="closeDrawer" class="rounded-lg bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 transition-colors">
                Cancel
              </button>
              <button type="button" @click="save" :disabled="saving" class="inline-flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#002d32] transition-colors disabled:opacity-60 shadow-sm dark:bg-bg-nfuko-yellow dark:text-nfuko-primary">
                <Spinner v-if="saving" class="h-4 w-4" />
                Save currency settings
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>


<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
