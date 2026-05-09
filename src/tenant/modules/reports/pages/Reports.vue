<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Calendar, Filter, Scale } from 'lucide-vue-next'
import { Spinner, formatMoneyValue } from '@/Global'
import { reportsApi } from '@/tenant/apis/reports/reportsApi'
import type { ReportFilters, FilterOptions } from '@/tenant/apis/reports/reportsApi'

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(false)
const filterOptions = ref<FilterOptions>({ show_branch_filter: false, branches: [], staff: [] })
const filters = ref<ReportFilters>({ branch_id: null, staff_id: null, date_from: null, date_to: null })

const dailyCollection = ref<any[]>([])
const branchPerformance = ref<any[]>([])
const branchReconciliation = ref<any[]>([])
const staffActivity = ref<any[]>([])

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchReports() {
  loading.value = true
  try {
    const params: ReportFilters = {}
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id
    if (filters.value.staff_id) params.staff_id = filters.value.staff_id
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to) params.date_to = filters.value.date_to

    const res = await reportsApi.index(params)
    dailyCollection.value = res.data?.daily_collection_report ?? []
    branchPerformance.value = res.data?.branch_performance_comparison ?? []
    branchReconciliation.value = res.data?.branch_reconciliation ?? []
    staffActivity.value = res.data?.staff_activity_report ?? []

    if (res.data?.filters?.options) {
      filterOptions.value = res.data.filters.options
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchReports())

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(value: string | number | null): string {
  return formatMoneyValue(value ?? 0)
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Reports</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Branch performance, daily collections, and staff activity.
        </p>
      </div>
      <div class="flex gap-2">
        <router-link
          :to="{ name: 'tenant-balances-report' }"
          class="rounded-full bg-white border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 shadow-sm"
        >
          Balances Report
        </router-link>
        <router-link
          :to="{ name: 'tenant-member-statement' }"
          class="rounded-full bg-white border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 shadow-sm"
        >
          Member Statement
        </router-link>
        <RouterLink
          :to="{ name: 'tenant-trial-balance' }"
          class="rounded-full bg-white border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 shadow-sm"
        >
          Trial Balance
        </RouterLink>
      </div>
    </div>

    <!-- Quick Navigation Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink to="/tenant/reports/trial-balance"
        class="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-nfuko-primary/30 dark:border-neutral-800 dark:bg-neutral-900">
        <div class="w-10 h-10 rounded-xl bg-nfuko-primary/10 flex items-center justify-center flex-shrink-0">
          <Scale class="w-5 h-5 text-nfuko-primary" />
        </div>
        <div>
          <p class="font-bold text-neutral-900 dark:text-white text-sm">Trial Balance</p>
          <p class="text-xs text-neutral-500 mt-0.5">Verify DR = CR across all GL accounts.</p>
        </div>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
        <Filter class="h-4 w-4" />
        Filters
      </div>

      <!-- Branch filter (only if allowed) -->
      <div v-if="filterOptions.show_branch_filter" class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">Branch</label>
        <select
          v-model="filters.branch_id"
          class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option :value="null">All Branches</option>
          <option v-for="b in filterOptions.branches" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </div>

      <!-- Staff filter -->
      <div v-if="filterOptions.staff.length > 0" class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">Staff</label>
        <select
          v-model="filters.staff_id"
          class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option :value="null">All Staff</option>
          <option v-for="s in filterOptions.staff" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <!-- Date From -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">From</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            v-model="filters.date_from"
            type="date"
            class="rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>

      <!-- Date To -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">To</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            v-model="filters.date_to"
            type="date"
            class="rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>

      <button
        @click="fetchReports"
        class="rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-nfuko-primary/90 shadow-sm"
      >
        Apply
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-6 w-6 text-nfuko-primary" />
    </div>

    <template v-else>
      <!-- Daily Collection Report -->
      <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Daily Collection Report</h2>
          <p class="text-xs text-neutral-400">Deposits, withdrawals, and charges grouped by date and branch.</p>
        </div>
        <div v-if="dailyCollection.length === 0" class="flex items-center justify-center py-10">
          <p class="text-sm text-neutral-400">No data for the selected period.</p>
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="bg-neutral-50 dark:bg-neutral-800/40">
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Date</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Branch</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Deposits</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Withdrawals</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Charges</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Transactions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <tr
              v-for="(row, i) in dailyCollection"
              :key="i"
              class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <td class="px-6 py-3 text-neutral-700 dark:text-neutral-300">{{ row.business_date }}</td>
              <td class="px-6 py-3 text-neutral-700 dark:text-neutral-300">{{ row.branch_name }}</td>
              <td class="px-6 py-3 text-right font-mono text-green-700 dark:text-green-400">{{ fmt(row.total_deposits) }}</td>
              <td class="px-6 py-3 text-right font-mono text-red-600 dark:text-red-400">{{ fmt(row.total_withdrawals) }}</td>
              <td class="px-6 py-3 text-right font-mono text-orange-600 dark:text-orange-400">{{ fmt(row.total_charges) }}</td>
              <td class="px-6 py-3 text-right text-neutral-600 dark:text-neutral-400">{{ row.transaction_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Branch Reconciliation -->
      <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Branch Reconciliation</h2>
          <p class="text-xs text-neutral-400">Cash in vs cash out position per branch.</p>
        </div>
        <div v-if="branchReconciliation.length === 0" class="flex items-center justify-center py-10">
          <p class="text-sm text-neutral-400">No reconciliation data available.</p>
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="bg-neutral-50 dark:bg-neutral-800/40">
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Branch</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Cash In</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Cash Out</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Charges</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Net Position</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <tr
              v-for="(row, i) in branchReconciliation"
              :key="i"
              class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <td class="px-6 py-3 font-medium text-neutral-900 dark:text-white">{{ row.branch_name }}</td>
              <td class="px-6 py-3 text-right font-mono text-green-700 dark:text-green-400">{{ fmt(row.cash_in) }}</td>
              <td class="px-6 py-3 text-right font-mono text-red-600 dark:text-red-400">{{ fmt(row.cash_out) }}</td>
              <td class="px-6 py-3 text-right font-mono text-orange-600 dark:text-orange-400">{{ fmt(row.charges_collected) }}</td>
              <td class="px-6 py-3 text-right font-mono font-semibold"
                :class="parseFloat(row.net_cash_position) >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ fmt(row.net_cash_position) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Branch Performance Comparison (only for managers/admins) -->
      <div
        v-if="branchPerformance.length > 0"
        class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Branch Performance Comparison</h2>
          <p class="text-xs text-neutral-400">Members and loan portfolio across branches.</p>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-neutral-50 dark:bg-neutral-800/40">
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Branch</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Total Members</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Active Members</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Total Loans</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Active Portfolio</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <tr
              v-for="(row, i) in branchPerformance"
              :key="i"
              class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <td class="px-6 py-3">
                <div class="font-medium text-neutral-900 dark:text-white">{{ row.name }}</div>
                <div class="text-xs text-neutral-400">{{ row.code }}</div>
              </td>
              <td class="px-6 py-3 text-right text-neutral-700 dark:text-neutral-300">{{ row.total_members }}</td>
              <td class="px-6 py-3 text-right">
                <span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  {{ row.active_members }}
                </span>
              </td>
              <td class="px-6 py-3 text-right text-neutral-700 dark:text-neutral-300">{{ row.total_loans }}</td>
              <td class="px-6 py-3 text-right font-mono font-semibold text-neutral-900 dark:text-white">{{ fmt(row.active_loan_portfolio) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Staff Activity Report -->
      <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Staff Activity Report</h2>
          <p class="text-xs text-neutral-400">Transaction volume and value processed per staff member.</p>
        </div>
        <div v-if="staffActivity.length === 0" class="flex items-center justify-center py-10">
          <p class="text-sm text-neutral-400">No staff activity data available.</p>
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="bg-neutral-50 dark:bg-neutral-800/40">
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Staff</th>
              <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Branch</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Transactions</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Deposits</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Withdrawals</th>
              <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Total Value</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <tr
              v-for="(row, i) in staffActivity"
              :key="i"
              class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <td class="px-6 py-3">
                <div class="font-medium text-neutral-900 dark:text-white">{{ row.staff_name }}</div>
                <div class="text-xs text-neutral-400">{{ row.staff_email }}</div>
              </td>
              <td class="px-6 py-3 text-neutral-600 dark:text-neutral-400">{{ row.branch_name }}</td>
              <td class="px-6 py-3 text-right text-neutral-700 dark:text-neutral-300">{{ row.total_transactions }}</td>
              <td class="px-6 py-3 text-right font-mono text-green-700 dark:text-green-400">{{ fmt(row.deposits_processed) }}</td>
              <td class="px-6 py-3 text-right font-mono text-red-600 dark:text-red-400">{{ fmt(row.withdrawals_processed) }}</td>
              <td class="px-6 py-3 text-right font-mono font-semibold text-neutral-900 dark:text-white">{{ fmt(row.total_value_processed) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
