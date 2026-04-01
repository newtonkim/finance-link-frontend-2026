<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Share2, AlertCircle, TrendingUp } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCurrencyStore } from '@/stores/currency'

const props = defineProps<{
  sharesQuantity: string | number
  sharesError: string
  apiError: string
}>()

const emit = defineEmits<{
  'update:sharesQuantity': [value: string | number]
}>()

const settingsStore = useSettingsStore()
const { currencyCode } = storeToRefs(useCurrencyStore())

const sharesTotalAmount = computed(() => {
  const qty = Number(props.sharesQuantity) || 0
  return qty * settingsStore.sharePrice
})

function formatMoney(amount: number | string | null | undefined, minimumFractionDigits = 2) {
  return `${currencyCode.value} ${formatMoneyValue(amount ?? 0, minimumFractionDigits)}`
}
</script>

<template>
  <div class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 overflow-hidden">
    <div class="flex items-center gap-2.5 px-5 py-3 bg-emerald-100/80 border-b border-emerald-200">
      <Share2 class="h-4 w-4 text-emerald-700" />
      <span class="text-[12px] font-bold text-emerald-800 uppercase tracking-wider"
        >Share Purchase</span
      >
      <span
        class="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wide"
        >Required</span
      >
    </div>
    <div class="p-5 space-y-4">
      <div class="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-emerald-200">
        <AlertCircle class="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <p class="text-[12px] text-emerald-800 leading-relaxed">
          This SACCO requires a minimum of
          <strong>{{ settingsStore.minSharesOnOnboarding }} share(s)</strong>
          at <strong>{{ formatMoney(settingsStore.sharePrice, 0) }}</strong> each (total:
          <strong>{{
            formatMoney(settingsStore.minSharesOnOnboarding * settingsStore.sharePrice, 0)
          }}</strong
          >) to register a member.
        </p>
      </div>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div class="grid gap-1.5">
          <label class="text-sm font-semibold text-neutral-700"
            >Number of Shares to Purchase <span class="text-red-500">*</span></label
          >
          <div
            class="flex overflow-hidden rounded-xl border focus-within:ring-1 transition-all"
            :class="
              sharesError
                ? 'border-red-400 focus-within:ring-red-300'
                : 'border-neutral-200 focus-within:border-emerald-400 focus-within:ring-emerald-300'
            "
          >
            <span
              class="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-500"
              >Shares</span
            >
            <input
              :value="sharesQuantity"
              @input="
                emit('update:sharesQuantity', Number(($event.target as HTMLInputElement).value))
              "
              type="number"
              :min="settingsStore.minSharesOnOnboarding"
              :placeholder="`Min. ${settingsStore.minSharesOnOnboarding}`"
              class="flex-1 bg-white px-4 py-3 text-sm font-mono font-bold text-neutral-800 outline-none placeholder:text-neutral-400"
            />
          </div>
          <p v-if="sharesError" class="text-[11px] text-red-600 font-medium">{{ sharesError }}</p>
          <p v-else-if="apiError" class="text-[11px] text-red-600">{{ apiError }}</p>
        </div>
        <div class="grid gap-1.5">
          <label class="text-sm font-semibold text-neutral-700">Total Share Investment</label>
          <div
            class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 min-h-[48px]"
          >
            <TrendingUp class="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p class="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">
                {{ sharesQuantity || 0 }} shares × {{ formatMoney(settingsStore.sharePrice, 0) }}
              </p>
              <p class="text-[18px] font-black text-emerald-700 font-mono leading-tight">
                {{ formatMoney(sharesTotalAmount) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
