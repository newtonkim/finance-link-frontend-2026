<script setup lang="ts">
import { Spinner } from '@/Global'
import { useCollectionsReport } from '../composables/useCollectionsReport'
import CollectionsReportHeader from '../components/CollectionsReportHeader.vue'
import CollectionsReportFilters from '../components/CollectionsReportFilters.vue'
import CollectionsSummarySection from '../components/CollectionsSummarySection.vue'
import CollectionsDetailTable from '../components/CollectionsDetailTable.vue'

const {
  PERIOD_TYPES,
  filters,
  showBranchFilter,
  branches,
  officers,
  loading,
  loadingSummary,
  loadingLoans,
  exporting,
  isPrinting,
  error,
  activeTab,
  summary,
  loans,
  meta,
  expandedLoanId,
  transactionCache,
  transactionLoading,
  transactionErrors,
  hasSummaryRows,
  showEmptyState,
  canGoPrev,
  canGoNext,
  fromRecord,
  toRecord,
  fmt,
  fmtRate,
  getRateClass,
  toNumber,
  summaryDisplayName,
  applyFilters,
  resetFilters,
  goToPage,
  toggleExpand,
  retryTransactions,
  exportExcel,
  printReport,
} = useCollectionsReport()
</script>

<template>
  <div class="flex flex-col gap-6 p-4 md:p-6">
    <!-- Header -->
    <CollectionsReportHeader
      :date-from="filters.date_from"
      :date-to="filters.date_to"
      :is-printing="isPrinting"
      :exporting="exporting"
      :loading="loading"
      :print-report="printReport"
      :export-excel="exportExcel"
    />

    <!-- Filters -->
    <CollectionsReportFilters
      :filters="filters"
      :period-types="PERIOD_TYPES"
      :show-branch-filter="showBranchFilter"
      :branches="branches"
      :officers="officers"
      :apply-filters="applyFilters"
      :reset-filters="resetFilters"
    />

    <!-- Error state -->
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Main Loading (initial) -->
    <div v-if="loading && !hasSummaryRows && loans.length === 0" class="flex items-center justify-center py-14">
      <Spinner class="h-8 w-8 text-blue-500" />
    </div>

    <template v-else>
      <!-- Summary Section -->
      <CollectionsSummarySection
        v-model:active-tab="activeTab"
        :summary="summary"
        :to-number="toNumber"
        :fmt="fmt"
        :fmt-rate="fmtRate"
        :get-rate-class="getRateClass"
        :summary-display-name="summaryDisplayName"
      />

      <!-- Empty State -->
      <div v-if="showEmptyState" class="rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p class="text-base font-semibold text-green-700">No collections recorded for this period</p>
      </div>

      <!-- Detail Table -->
      <CollectionsDetailTable
        v-if="!showEmptyState"
        :loans="loans"
        :meta="meta"
        :expanded-loan-id="expandedLoanId"
        :transaction-cache="transactionCache"
        :transaction-loading="transactionLoading"
        :transaction-errors="transactionErrors"
        :from-record="fromRecord"
        :to-record="toRecord"
        :can-go-prev="canGoPrev"
        :can-go-next="canGoNext"
        :to-number="toNumber"
        :fmt="fmt"
        :fmt-rate="fmtRate"
        :get-rate-class="getRateClass"
        :toggle-expand="toggleExpand"
        :go-to-page="goToPage"
        :retry-transactions="retryTransactions"
      />
    </template>

    <!-- Async Loading Indicator -->
    <div v-if="loadingSummary || loadingLoans" class="fixed bottom-5 right-5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
      <Spinner class="mr-2 inline h-3.5 w-3.5" /> Updating report...
    </div>
  </div>
</template>
