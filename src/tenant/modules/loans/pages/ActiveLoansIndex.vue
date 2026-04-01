<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ChevronLeft, ChevronRight, InboxIcon, Loader2, Eye } from 'lucide-vue-next'
import { useActiveLoans } from '../composables/useActiveLoans'
import type { LoanTab } from '@/tenant/apis/loans/loansApi'

const router = useRouter()

const { loading, loans, meta, filters, activeTab, summary, fetch, switchTab, applyFilters } =
  useActiveLoans()

const hasPrev = computed(() => meta.current_page > 1)
const hasNext = computed(() => meta.current_page < meta.last_page)

function prevPage() {
  if (hasPrev.value) void fetch(meta.current_page - 1)
}
function nextPage() {
  if (hasNext.value) void fetch(meta.current_page + 1)
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusBadge(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700'
    case 'arrears':
      return 'bg-red-100 text-red-700'
    case 'closed':
      return 'bg-neutral-100 text-neutral-500'
    case 'approved':
      return 'bg-blue-100 text-blue-700'
    case 'submitted':
    case 'under_review':
    case 'recommended':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-neutral-100 text-neutral-500'
  }
}

function statusLabel(status: string) {
  if (status === 'active') return 'Disbursed'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const tabs: { key: LoanTab; label: string; countKey: keyof typeof summary.value }[] = [
  { key: 'disbursed', label: 'Disbursed Loans', countKey: 'disbursed' },
  { key: 'approved', label: 'Approved Loans', countKey: 'approved' },
  { key: 'pending', label: 'Pending Loans', countKey: 'pending' },
  { key: 'arrears', label: 'In Arrears', countKey: 'arrears' },
  { key: 'all', label: 'All Loans', countKey: 'all' },
]
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Tab bar -->
    <div
      class="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 px-4 sm:px-6"
    >
      <nav class="flex overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2"
          :class="
            activeTab === tab.key
              ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          "
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span
            class="rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
            :class="
              activeTab === tab.key
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            "
          >
            {{ summary[tab.countKey].toLocaleString() }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
      <!-- Search bar -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by ID or customer name…"
            class="pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white w-72"
            @keyup.enter="applyFilters"
          />
        </div>
        <button
          class="px-4 py-2 text-sm font-medium rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          @click="applyFilters"
        >
          Search
        </button>
      </div>

      <!-- Table card -->
      <div
        class="rounded-2xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden"
      >
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20 gap-2 text-neutral-400">
          <Loader2 class="h-5 w-5 animate-spin" />
          <span class="text-sm">Loading…</span>
        </div>

        <!-- Empty -->
        <div
          v-else-if="!loans.length"
          class="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400"
        >
          <InboxIcon class="h-10 w-10" />
          <p class="text-sm">No loans found.</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b border-neutral-100 dark:border-neutral-800">
              <tr
                class="text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
              >
                <th class="px-4 py-3">#ID</th>
                <th class="px-4 py-3">Customer Name</th>
                <th class="px-4 py-3 text-right">Principal</th>
                <th class="px-4 py-3 text-right">Current Balance</th>
                <th class="px-4 py-3">Approval Date</th>
                <th class="px-4 py-3">Disbursement Date</th>
                <th class="px-4 py-3">Loan Products</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800/60">
              <tr
                v-for="loan in loans"
                :key="loan.id"
                class="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <td class="px-4 py-3">
                  <span class="font-mono text-xs font-medium text-blue-600 dark:text-blue-400">
                    {{ loan.loan_no }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ loan.member?.name ?? '—' }}
                  </p>
                  <p v-if="loan.member?.member_number" class="text-xs text-neutral-400 mt-0.5">
                    {{ loan.member.member_number }}
                  </p>
                </td>
                <td class="px-4 py-3 text-right font-medium text-neutral-800 dark:text-neutral-200">
                  {{ loan.principal_formatted }}
                </td>
                <td
                  class="px-4 py-3 text-right font-semibold"
                  :class="
                    loan.status === 'arrears'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-neutral-800 dark:text-neutral-200'
                  "
                >
                  {{ loan.outstanding_balance_formatted }}
                </td>
                <td class="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {{ fmtDate(loan.approved_at) }}
                </td>
                <td class="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {{ fmtDate(loan.disbursed_at) }}
                </td>
                <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                  {{ loan.loan_product?.name ?? '—' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                    :class="statusBadge(loan.status)"
                  >
                    {{ statusLabel(loan.status) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    @click="
                      loan._source === 'application'
                        ? router.push({
                            name: 'tenant-loan-application-show',
                            params: { id: String(loan.id) },
                          })
                        : router.push({
                            name: 'tenant-loan-account',
                            params: { id: String(loan.id) },
                          })
                    "
                  >
                    <Eye class="h-3.5 w-3.5" />
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta.total > 0"
        class="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400"
      >
        <span>
          Showing {{ (meta.current_page - 1) * meta.per_page + 1 }}–{{
            Math.min(meta.current_page * meta.per_page, meta.total)
          }}
          of {{ meta.total.toLocaleString() }} records
        </span>
        <div class="flex items-center gap-2">
          <button
            :disabled="!hasPrev"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-neutral-700 dark:hover:bg-neutral-800"
            @click="prevPage"
          >
            <ChevronLeft class="h-4 w-4" /> Prev
          </button>
          <span class="px-2 text-xs">{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button
            :disabled="!hasNext"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-neutral-700 dark:hover:bg-neutral-800"
            @click="nextPage"
          >
            Next <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
