<script setup lang="ts">
import { onMounted } from 'vue'
import { Download, Filter, RotateCcw } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { useDisbursementReport } from '../composables/useDisbursementReport'
import DisbursementKpiCards from '../components/DisbursementKpiCards.vue'
import DisbursementSummaryTabs from '../components/DisbursementSummaryTabs.vue'
import DisbursementTrendChart from '../components/DisbursementTrendChart.vue'
import DisbursementRegisterTable from '../components/DisbursementRegisterTable.vue'

const {
  filters, loading, exporting, error, activeTab,
  showBranchFilter, branches, officers,
  kpis, pending, byProduct, byChannel, byBranch, byOfficer, trend,
  loans, meta, showEmptyState, canGoPrev, canGoNext,
  loadFilterOptions, fetchReport, applyFilters, resetFilters, goToPage, exportExcel,
  fmt, fmtPct,
} = useDisbursementReport()

onMounted(async () => {
  await loadFilterOptions()
  await fetchReport()
})
</script>

<template>
  <div class="flex flex-col gap-6 p-4 md:p-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Loan Disbursement Report</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Disbursements for
          <span class="font-semibold text-neutral-700 dark:text-neutral-300">
            {{ filters.date_from }} to {{ filters.date_to }}
          </span>
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
        :disabled="exporting || loading"
        @click="exportExcel"
      >
        <Spinner v-if="exporting" class="h-4 w-4" />
        <Download v-else class="h-4 w-4" />
        Export Excel
      </button>
    </div>

    <!-- Filters -->
    <div class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
          <Filter class="h-4 w-4" /> Filters
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Month</label>
          <input
            v-model="filters.month"
            type="month"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>

        <div v-if="showBranchFilter" class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Branch</label>
          <select
            v-model="filters.branch_id"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="null">All Branches</option>
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Loan Officer</label>
          <select
            v-model="filters.loan_officer_id"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="null">All Officers</option>
            <option v-for="o in officers" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            class="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            @click="applyFilters"
          >
            <Filter class="h-3.5 w-3.5" /> Apply
          </button>
          <button
            class="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
            @click="resetFilters"
          >
            <RotateCcw class="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading && showEmptyState" class="flex items-center justify-center py-14">
      <Spinner class="h-8 w-8 text-blue-500" />
    </div>

    <template v-else>
      <!-- KPIs -->
      <DisbursementKpiCards :kpis="kpis" :pending="pending" :fmt="fmt" />

      <!-- Summary Tabs -->
      <DisbursementSummaryTabs
        :active-tab="activeTab"
        :by-product="byProduct"
        :by-channel="byChannel"
        :by-branch="byBranch"
        :by-officer="byOfficer"
        :fmt="fmt"
        :fmt-pct="fmtPct"
        @update:active-tab="activeTab = $event"
      />

      <!-- Trend Chart -->
      <DisbursementTrendChart :trend="trend" :fmt="fmt" />

      <!-- Empty State -->
      <div v-if="showEmptyState" class="rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p class="text-base font-semibold text-green-700">No disbursements recorded for this period</p>
      </div>

      <!-- Register -->
      <DisbursementRegisterTable
        v-if="!showEmptyState"
        :loans="loans"
        :total="meta.total"
        :fmt="fmt"
        :fmt-pct="fmtPct"
      />

      <!-- Pagination -->
      <div v-if="meta.total > 0" class="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
        <p class="text-sm text-neutral-500">
          Showing {{ meta.from ?? 0 }}–{{ meta.to ?? 0 }} of {{ meta.total }}
        </p>
        <div class="flex gap-2">
          <button
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40"
            :disabled="!canGoPrev"
            @click="goToPage(meta.current_page - 1)"
          >
            Previous
          </button>
          <button
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40"
            :disabled="!canGoNext"
            @click="goToPage(meta.current_page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
