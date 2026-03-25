<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Calendar, Filter } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { reportsApi } from '@/tenant/apis/reports/reportsApi'
import { tenantClient } from '@/tenant/apis/tenantClient'

const loading = ref(false)
const asOfDate = ref(new Date().toISOString().split('T')[0])
const branchId = ref<string | null>(null)
const branches = ref<any[]>([])

const summary = ref({ grand_total_savings: 0, grand_total_shares: 0 })
const members = ref<any[]>([])

async function fetchBalances() {
  loading.value = true
  try {
    const res = await tenantClient.get('/reports/savings-shares-balances', {
      params: { as_of_date: asOfDate.value, branch_id: branchId.value }
    })
    summary.value = res.data.summary
    members.value = res.data.members.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchBalances())

function fmt(value: string | number | null): string {
  const n = parseFloat(String(value ?? 0))
  return isNaN(n) ? '0.00' : n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Savings & Shares Balances</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Snapshot of all member liabilities and equity at a given date.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
        <Filter class="h-4 w-4" /> Filters
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">As Of Date</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input v-model="asOfDate" type="date" class="rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
        </div>
      </div>

      <button @click="fetchBalances" class="rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-nfuko-primary/90 shadow-sm">
        Generate Report
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="text-sm font-medium text-neutral-500">Grand Total Savings</h3>
        <p class="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">{{ fmt(summary.grand_total_savings) }}</p>
      </div>
      <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="text-sm font-medium text-neutral-500">Grand Total Shares</h3>
        <p class="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">{{ fmt(summary.grand_total_shares) }}</p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-6 w-6 text-nfuko-primary" />
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-neutral-50 dark:bg-neutral-800/40">
            <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Member</th>
            <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Branch</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Status</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Savings</th>
            <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Shares</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
          <tr v-for="m in members" :key="m.id" class="hover:bg-neutral-50/60 transition-colors">
            <td class="px-6 py-3">
              <div class="font-medium text-neutral-900 dark:text-white">{{ m.first_name }} {{ m.last_name }}</div>
              <div class="text-xs text-neutral-400">{{ m.member_number }}</div>
            </td>
            <td class="px-6 py-3 text-neutral-700 dark:text-neutral-300">{{ m.branch_name }}</td>
            <td class="px-6 py-3 text-right">
              <span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">{{ m.status }}</span>
            </td>
            <td class="px-6 py-3 text-right font-mono text-green-700">{{ fmt(m.total_savings) }}</td>
            <td class="px-6 py-3 text-right font-mono text-blue-700">{{ fmt(m.total_shares) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
