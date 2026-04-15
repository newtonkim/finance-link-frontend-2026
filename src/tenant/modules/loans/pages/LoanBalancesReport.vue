<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Calendar, Filter, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Spinner, SearchableSelect, formatMoneyValue, exportToExcel } from '@/Global'
import { setLocalValues, keysToUse } from '@/Global/Helpers'
import {
  reportsApi,
  type LoanBalanceFilters,
  type LoanBalanceRow,
  type LoanBalanceSummary,
  type LoanBalanceStatus,
} from '@/tenant/apis/reports/reportsApi'
import { tenantClient } from '@/tenant/apis/tenantClient'

const today = new Date().toISOString().split('T')[0]

const asOfDate = ref(today)
const branchId = ref<number | null>(null)
const productId = ref<number | null>(null)
const officerId = ref<number | null>(null)
const status = ref<LoanBalanceStatus>('all')

const branches = ref<{ id: number; name: string }[]>([])
const products = ref<{ id: number; name: string }[]>([])
const officers = ref<{ id: number; name: string }[]>([])

const loading = ref(false)
const error = ref<string | null>(null)
const summary = ref<LoanBalanceSummary>({
  total_principal: 0,
  total_interest: 0,
  total_charges: 0,
  total_penalty: 0,
  grand_total: 0,
  loan_count: 0,
})
const loans = ref<LoanBalanceRow[]>([])
const currentPage = ref(1)
const lastPage = ref(1)
const totalItems = ref(0)
const perPage = ref(10)

const statusOptions: { value: LoanBalanceStatus; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'arrears', label: 'In Arrears' },
  { value: 'closed', label: 'Closed' },
]

// SearchableSelect expects { id, name }[] format
const branchOptions = computed(() => [
  { id: null, name: 'All Branches' },
  ...branches.value.map((b) => ({ id: b.id, name: b.name })),
])
const productOptions = computed(() => [
  { id: null, name: 'All Products' },
  ...products.value.map((p) => ({ id: p.id, name: p.name })),
])
const officerOptions = computed(() => [
  { id: null, name: 'All Officers' },
  ...officers.value.map((o) => ({ id: o.id, name: o.name })),
])
const statusSelectOptions = computed(() =>
  statusOptions.map((o) => ({ id: o.value as string, name: o.label })),
)


async function fetchFilterOptions() {
  try {
    const [optRes, prodRes] = await Promise.all([
      reportsApi.filterOptions(),
      tenantClient.get('/loan-products', { params: { per_page: 200 } }),
    ])
    branches.value = optRes.data?.branches ?? []
    products.value = prodRes.data?.data?.data ?? prodRes.data?.data ?? []
    officers.value = optRes.data?.staff ?? []
  } catch (e) {
    console.error('Failed to load filter options:', e)
  }
}

async function fetchReport(page = 1) {
  loading.value = true
  error.value = null
  try {
    const params: LoanBalanceFilters = {
      as_of_date: asOfDate.value,
      branch_id: branchId.value,
      loan_product_id: productId.value,
      loan_officer_id: officerId.value,
      status: status.value,
      page,
      per_page: perPage.value,
    }
    const res = await reportsApi.loanBalances(params)
    summary.value = res.data.summary
    loans.value = res.data.loans.data
    currentPage.value = res.data.loans.meta.current_page
    lastPage.value = res.data.loans.meta.last_page
    totalItems.value = res.data.loans.meta.total
  } catch (e: any) {
    console.error('Failed to fetch report:', e)
    error.value = e?.response?.data?.message || e?.message || 'Failed to load report'
  } finally {
    loading.value = false
  }
}

async function exportReport() {
  try {
    const params: Omit<LoanBalanceFilters, 'per_page' | 'page'> = {
      as_of_date: asOfDate.value,
      branch_id: branchId.value,
      loan_product_id: productId.value,
      loan_officer_id: officerId.value,
      status: status.value,
    }
    const res = await reportsApi.loanBalancesExport(params)
    exportToExcel(res.data, 'loan-balances-report')
  } catch (e) {
    console.error('Failed to export report:', e)
  }
}

function fmt(value: string | number | null | undefined): string {
  return formatMoneyValue(value ?? 0)
}

function handlePageChange(page: number) {
  fetchReport(page)
}

function handlePerPageChange(newPerPage: number) {
  perPage.value = newPerPage
  fetchReport(1)
}

const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < lastPage.value)

const router = useRouter()

function navigateToMemberProfile(memberData: any) {
  setLocalValues(keysToUse.memberProfile, memberData)
  router.push(`/tenant/member/profile`)
}

onMounted(() => {
  fetchFilterOptions()
  fetchReport()
})
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Loan Balances Report</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Total principal, interest, charges and penalties outstanding across all loans as of {{ asOfDate }}
        </p>
      </div>
      <button
        @click="exportReport"
        class="inline-flex items-center gap-2 rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-nfuko-primary/90 shadow-sm"
      >
        <Download class="h-4 w-4" />
        Export
      </button>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
        <Filter class="h-4 w-4" />
        Filters
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">As Of Date</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            v-model="asOfDate"
            type="date"
            class="rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1 min-w-[160px]">
        <label class="text-xs text-neutral-400">Branch</label>
        <SearchableSelect
          v-model="branchId"
          :options="branchOptions"
          placeholder="All Branches"
        />
      </div>

      <div class="flex flex-col gap-1 min-w-[160px]">
        <label class="text-xs text-neutral-400">Product</label>
        <SearchableSelect
          v-model="productId"
          :options="productOptions"
          placeholder="All Products"
        />
      </div>

      <div class="flex flex-col gap-1 min-w-[160px]">
        <label class="text-xs text-neutral-400">Loan Officer</label>
        <SearchableSelect
          v-model="officerId"
          :options="officerOptions"
          placeholder="All Officers"
        />
      </div>

      <div class="flex flex-col gap-1 min-w-[140px]">
        <label class="text-xs text-neutral-400">Status</label>
        <SearchableSelect
          v-model="status"
          :options="statusSelectOptions"
          placeholder="All Statuses"
        />
      </div>

      <button
        @click="fetchReport()"
        class="inline-flex items-center gap-2 rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-nfuko-primary/90 shadow-sm"
      >
        <RefreshCw class="h-4 w-4" />
        Generate
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h3 class="text-xs font-medium text-neutral-500">Total Loans</h3>
        <p class="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
          {{ summary.loan_count }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h3 class="text-xs font-medium text-neutral-500">Principal Outstanding</h3>
        <p class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
          {{ fmt(summary.total_principal) }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h3 class="text-xs font-medium text-neutral-500">Interest Outstanding</h3>
        <p class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
          {{ fmt(summary.total_interest) }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h3 class="text-xs font-medium text-neutral-500">Charges Outstanding</h3>
        <p class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
          {{ fmt(summary.total_charges) }}
        </p>
      </div>
      <div
        class="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h3 class="text-xs font-medium text-neutral-500">Penalty Outstanding</h3>
        <p class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
          {{ fmt(summary.total_penalty) }}
        </p>
      </div>
      <div class="rounded-2xl border border-nfuko-primary bg-nfuko-primary p-4 shadow-sm">
        <h3 class="text-xs font-medium text-white/80">Total Portfolio Outstanding</h3>
        <p class="mt-1 text-xl font-bold text-white">{{ fmt(summary.grand_total) }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-6 w-6 text-nfuko-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center">
      <div class="rounded-full bg-red-100 p-4">
        <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 class="mt-4 text-lg font-semibold text-neutral-900">Failed to load report</h3>
      <p class="mt-2 text-sm text-neutral-500">{{ error }}</p>
      <button
        @click="fetchReport()"
        class="mt-4 rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="loans.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <div class="rounded-full bg-neutral-100 p-4">
        <svg class="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 class="mt-4 text-lg font-semibold text-neutral-900">No loans found</h3>
      <p class="mt-2 text-sm text-neutral-500">No loan balances match your current filters.</p>
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-neutral-50 dark:bg-neutral-800/40">
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Loan #
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Member
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Product
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Branch
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Officer
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Principal Outstanding
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Interest Outstanding
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Charges Outstanding
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Penalty Outstanding
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Total Outstanding
            </th>
            <th
              class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
          <tr
            v-for="loan in loans"
            :key="loan.loan_id"
            class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
          >
            <!-- Loan # — clickable link to loan account -->
            <td class="px-4 py-3">
              <button
                class="font-mono text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                @click="router.push({ name: 'tenant-loan-account', params: { id: String(loan.loan_id) } })"
              >
                {{ loan.loan_no }}
              </button>
            </td>
            <!-- Member — name links to profile, number is plain text -->
            <td class="px-4 py-3">
              <button
                class="font-medium text-nfuko-green hover:text-nfuko-action hover:underline"
                @click="navigateToMemberProfile({ id: loan.member_id, name: loan.member_name, member_number: loan.member_number })"
              >
                {{ loan.member_name }}
              </button>
              <div class="text-xs text-neutral-400">{{ loan.member_number }}</div>
            </td>
            <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">
              {{ loan.product_name }}
            </td>
            <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">
              {{ loan.branch_name }}
            </td>
            <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">
              {{ loan.loan_officer_name }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
              {{ fmt(loan.principal) }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
              {{ fmt(loan.interest_remaining) }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
              {{ fmt(loan.charges_remaining) }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
              {{ fmt(loan.penalty_remaining) }}
            </td>
            <td class="px-4 py-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
              {{ fmt(loan.outstanding_balance) }}
            </td>
            <td class="px-4 py-3 text-center">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-green-100 text-green-700': loan.status === 'disbursed',
                  'bg-red-100 text-red-700': loan.status === 'arrears',
                  'bg-neutral-100 text-neutral-700': loan.status === 'closed',
                }"
              >
                {{ loan.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination — same style as tenant/loans -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400"
      >
        <span>
          Showing {{ (currentPage - 1) * perPage + 1 }}–{{
            Math.min(currentPage * perPage, totalItems)
          }}
          of {{ totalItems.toLocaleString() }} records
        </span>
        <div class="flex items-center gap-2">
          <button
            :disabled="!hasPrev"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-neutral-700 dark:hover:bg-neutral-800"
            @click="handlePageChange(currentPage - 1)"
          >
            <ChevronLeft class="h-4 w-4" /> Prev
          </button>
          <span class="px-2 text-xs">{{ currentPage }} / {{ lastPage }}</span>
          <button
            :disabled="!hasNext"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-neutral-700 dark:hover:bg-neutral-800"
            @click="handlePageChange(currentPage + 1)"
          >
            Next <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
