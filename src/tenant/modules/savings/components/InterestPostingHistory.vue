<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import { useCurrencyStore } from '@/stores/currency'

import { type Posting } from '../types'

const props = defineProps<{ accountId: number; currency: string }>()

const currencyStore = useCurrencyStore()
const currency = computed(() => props.currency || currencyStore.currencyCode)

const postings = ref<Posting[]>([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await savingsAccountsApi.interestPostings(props.accountId)
    postings.value = res.data?.data ?? []
  } catch (err: any) {
    error.value = err?.response?.data?.message ?? 'Failed to load interest history.'
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

function formatAmount(v: string | number) {
  const n = Number(v)
  return isNaN(n) ? '—' : `${currency.value} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}

function payoutLabel(type: string) {
  return { at_maturity: 'At Maturity', periodic_payout: 'Periodic', compound: 'Compound' }[type] ?? type
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interest Posting History</h4>
      <button type="button" @click="load" class="text-xs text-nfuko-primary underline hover:no-underline dark:text-nfuko-yellow">
        Refresh
      </button>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-8 rounded bg-neutral-100 animate-pulse dark:bg-neutral-800" />
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
      {{ error }}
    </div>

    <div v-else-if="postings.length === 0" class="rounded-lg border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400 dark:border-neutral-700">
      No interest postings yet.
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table class="w-full text-xs">
        <thead class="bg-neutral-50 text-left text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          <tr>
            <th class="px-3 py-2 font-medium">Period</th>
            <th class="px-3 py-2 font-medium">Amount</th>
            <th class="px-3 py-2 font-medium">Type</th>
            <th class="px-3 py-2 font-medium">Posted</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
          <tr v-for="p in postings" :key="p.id" class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
            <td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">
              {{ formatDate(p.period_start) }} — {{ formatDate(p.period_end) }}
            </td>
            <td class="px-3 py-2 font-medium text-green-700 dark:text-green-400">
              {{ formatAmount(p.interest_amount) }}
            </td>
            <td class="px-3 py-2 text-neutral-500">{{ payoutLabel(p.payout_type) }}</td>
            <td class="px-3 py-2 text-neutral-400">{{ formatDate(p.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
