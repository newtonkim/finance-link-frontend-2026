<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Calendar, Upload } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(false)
const memberId = ref(route.params.member_id || '')
const dateFrom = ref('')
const dateTo = ref('')

const member = ref<any>(null)
const summary = ref({ total_savings: 0, total_shares: 0, total_loans: 0 })
const transactions = ref<any[]>([])

async function fetchStatement() {
  if (!memberId.value) return
  loading.value = true
  try {
    const res = await tenantClient.get(`/reports/member-statement/${memberId.value}`, {
      params: { date_from: dateFrom.value, date_to: dateTo.value }
    })
    member.value = res.data.member
    summary.value = res.data.summary
    transactions.value = res.data.transactions.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (memberId.value) fetchStatement()
})

function fmt(value: string | number | null): string {
  const n = parseFloat(String(value ?? 0))
  return isNaN(n) ? '0.00' : n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Member Statement</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Unified view of member's savings, shares, and transaction ledger.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">Member ID</label>
        <input v-model="memberId" type="text" placeholder="Enter Member ID" class="rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm outline-none focus:border-nfuko-primary" />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">From</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input v-model="dateFrom" type="date" class="rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary" />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">To</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input v-model="dateTo" type="date" class="rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary" />
        </div>
      </div>

      <button @click="fetchStatement" class="rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-nfuko-primary/90 shadow-sm">
        Load Statement
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-6 w-6 text-nfuko-primary" />
    </div>

    <template v-else-if="member">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h3 class="text-sm font-medium text-neutral-500">Savings Balance</h3>
          <p class="mt-2 text-3xl font-bold text-green-600">{{ fmt(summary.total_savings) }}</p>
        </div>
        <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h3 class="text-sm font-medium text-neutral-500">Shares Balance</h3>
          <p class="mt-2 text-3xl font-bold text-blue-600">{{ fmt(summary.total_shares) }}</p>
        </div>
        <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h3 class="text-sm font-medium text-neutral-500">Loan Balance</h3>
          <p class="mt-2 text-3xl font-bold text-red-600">{{ fmt(summary.total_loans) }}</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <div class="border-b border-neutral-100 px-6 py-4">
          <h2 class="text-base font-semibold text-neutral-900">Transaction Ledger</h2>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-neutral-50">
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Date</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Description</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Type</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50">
            <tr v-for="t in transactions" :key="t.id" class="hover:bg-neutral-50/60">
              <td class="px-6 py-3 text-neutral-700">{{ String(t.transaction_date).split(' ')[0] }}</td>
              <td class="px-6 py-3 text-neutral-700">{{ t.description || t.reference }}</td>
              <td class="px-6 py-3">
                <span class="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700 uppercase">{{ t.type }}</span>
              </td>
              <td class="px-6 py-3 text-right font-mono font-semibold" :class="['deposit', 'transfer_in', 'share_purchase'].includes(t.type) ? 'text-green-600' : 'text-red-600'">
                {{ ['deposit', 'transfer_in', 'share_purchase'].includes(t.type) ? '+' : '-' }}{{ fmt(t.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
