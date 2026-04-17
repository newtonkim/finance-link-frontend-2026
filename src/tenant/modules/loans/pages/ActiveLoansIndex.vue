<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ChevronLeft, ChevronRight, InboxIcon, Loader2, Eye, Filter, FileText, Download, X, FileSpreadsheet } from 'lucide-vue-next'
import { useActiveLoans } from '../composables/useActiveLoans'
import type { LoanTab } from '@/tenant/apis/loans/loansApi'
import { ref } from 'vue'
import { loansApi } from '@/tenant/apis/loans/loansApi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const router = useRouter()

const {
    loading, loans, meta, filters, activeTab, summary,
    products, branches,
    fetch, fetchSummary, switchTab, applyFilters, clearFilters,
} = useActiveLoans()

const showFilters = ref(false)

const statusOptions = [
    { value: 'disbursed', label: 'Disbursed' },
    { value: 'active',    label: 'Active' },
    { value: 'arrears',   label: 'In Arrears' },
    { value: 'closed',    label: 'Closed' },
    { value: 'approved',  label: 'Approved' },
]

async function exportToExcel() {
    try {
        const res = await loansApi.export({ ...filters, tab: activeTab.value })
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `loans_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch {
        // Handle error
    }
}

function exportToPdf() {
    const doc = new jsPDF('l', 'mm', 'a4')

    doc.setFontSize(18)
    doc.text('Loans Report', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

    const tableHeaders = [
        ['#ID', 'Customer Name', 'Principal', 'Current Balance', 'Approval Date', 'Disbursement Date', 'Product', 'Status']
    ]

    const tableRows = loans.value.map(loan => [
        loan.loan_no,
        loan.member?.name ?? '—',
        loan.principal_formatted,
        loan.outstanding_balance_formatted,
        fmtDate(loan.approved_at),
        fmtDate(loan.disbursed_at),
        loan.loan_product?.name ?? '—',
        statusLabel(loan.status)
    ])

    autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8 },
    })

    doc.save(`loans_report_${new Date().toISOString().slice(0, 10)}.pdf`)
}

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

function effectiveStatus(loan: { status: string; is_rescheduled?: boolean }) {
  return loan.is_rescheduled ? 'rescheduled' : loan.status
}

function statusBadge(status: string) {
  switch (status) {
    case 'active':
    case 'disbursed':
      return 'bg-emerald-100 text-emerald-700'
    case 'closed':
      return 'bg-nfuko-primary text-white'
    case 'arrears':
      return 'bg-red-100 text-red-700'
    case 'rescheduled':
      return 'bg-amber-100 text-amber-700'
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
  if (status === 'rescheduled') return 'Rescheduled'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const tabs: { key: LoanTab; label: string; countKey: keyof typeof summary.value; color: string }[] = [
  { key: 'all', label: 'All Loans', countKey: 'all', color: 'nfuko-primary' },
  { key: 'disbursed', label: 'Disbursed Loans', countKey: 'disbursed', color: 'nfuko-action' },
  { key: 'arrears', label: 'In Arrears', countKey: 'arrears', color: 'nfuko-danger' },
  { key: 'closed', label: 'Closed Loans', countKey: 'closed', color: 'nfuko-primary' },
  { key: 'approved', label: 'Approved Loans', countKey: 'approved', color: 'nfuko-blue' },
  { key: 'rescheduled', label: 'Rescheduled Loans', countKey: 'rescheduled', color: 'nfuko-action' },
  { key: 'topup', label: 'Topped Up Loans', countKey: 'topup', color: 'nfuko-blue' },
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
          class="flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2"
          :style="{
            color: activeTab === tab.key ? `var(--color-${tab.color})` : '',
            borderColor: activeTab === tab.key ? `var(--color-${tab.color})` : 'transparent',
          }"
          :class="
            activeTab === tab.key
              ? ''
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          "
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span
            class="rounded px-2 py-0.5 text-[11px] font-bold tabular-nums transition-colors"
            :style="{
              backgroundColor: activeTab === tab.key ? `var(--color-${tab.color})` : '',
              color: activeTab === tab.key ? 'white' : '',
            }"
            :class="
              activeTab === tab.key
                ? ''
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            "
          >
            {{ tab.key === 'topup' ? '—' : summary[tab.countKey]?.toLocaleString() ?? '0' }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-4 sm:p-6 space-y-4">

      <!-- Coming Soon: Topped Up Loans -->
      <div
        v-if="activeTab === 'topup'"
        class="flex flex-col items-center justify-center py-24 gap-4 text-neutral-400"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p class="text-base font-semibold text-neutral-600 dark:text-neutral-300">Topped Up Loans</p>
        <p class="text-sm text-neutral-400 dark:text-neutral-500 text-center max-w-xs">
          This feature is currently under development. Topped-up loan tracking will be available in a future release.
        </p>
      </div>

      <template v-else>
      <!-- Search bar & Export -->
      <div class="flex items-center justify-between gap-3">
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
          <button
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            :class="{ 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900/10': showFilters }"
            @click="showFilters = !showFilters"
          >
            <Filter class="h-4 w-4" />
            Filters
          </button>
        </div>

        <div class="flex items-center gap-2">
            <button
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              @click="exportToExcel"
            >
              <FileSpreadsheet class="h-4 w-4 text-emerald-600" />
              Excel
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              @click="exportToPdf"
            >
              <FileText class="h-4 w-4 text-rose-600" />
              PDF
            </button>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div
        v-if="showFilters"
        class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer Name</label>
          <input
            v-model="filters.member_name"
            type="text"
            placeholder="Name..."
            class="px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Loan Product</label>
          <select
            v-model="filters.loan_product_id"
            class="px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          >
            <option value="">All Products</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ p.code }})</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</label>
          <select
            v-model="filters.status"
            class="px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Approved Date (From)</label>
          <input
            v-model="filters.approved_date_from"
            type="date"
            class="px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Approved Date (To)</label>
          <input
            v-model="filters.approved_date_to"
            type="date"
            class="px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Disbursed Date (From)</label>
          <input
            v-model="filters.disbursed_date_from"
            type="date"
            class="px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Disbursed Date (To)</label>
          <input
            v-model="filters.disbursed_date_to"
            type="date"
            class="px-3 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
        <div class="flex items-end gap-2 lg:col-span-3">
          <button
            class="px-6 py-2 text-sm font-medium rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            @click="applyFilters"
          >
            Apply Filters
          </button>
          <button
            class="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors dark:border-neutral-700 dark:hover:bg-neutral-800 dark:text-neutral-300"
            @click="clearFilters"
          >
            Clear
          </button>
        </div>
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
                    :class="statusBadge(effectiveStatus(loan))"
                  >
                    {{ statusLabel(effectiveStatus(loan)) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    @click="
                      loan._source === 'application'
                        ? router.push({
                            name: 'tenant-loans-show',
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
      </template>

    </div>
  </div>
</template>
