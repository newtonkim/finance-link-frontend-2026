<script setup lang="ts">
import Spinner from '@/Global/Components/Loading/Spinner.vue'
import { useAgingReport } from '../composables/useAgingReport'
import AgingReportHeader from '../components/AgingReportHeader.vue'
import AgingReportFilters from '../components/AgingReportFilters.vue'
import AgingReportKpiCards from '../components/AgingReportKpiCards.vue'
import AgingSummaryTable from '../components/AgingSummaryTable.vue'
import AgingDetailTable from '../components/AgingDetailTable.vue'

const {
  filters,
  showBranchFilter,
  branches,
  officers,
  products,
  BUCKET_TABS,
  loadingKpis,
  loadingTable,
  total,
  buckets,
  totals,
  expandedLoanId,
  loadingScheduleId,
  search,
  activeBucketTab,
  paginationLinks,
  nplRatio,
  filteredRows,
  applyFilters,
  onPageChange,
  onPerPageChange,
  selectBucketTab,
  resetFilters,
  toggleSchedule,
  scheduleForLoan,
  tabCount,
  exportCsv,
  exportPdf,
  printReport,
  bucketBadgeClass,
  bucketRowClass,
  bucketTableRowClass,
  dpdClass,
  assetQualityLabel,
  assetQualityClass,
  scheduleRowClass,
  scheduleStatusBadge,
  fmt,
  fmtPct,
  bucketLabel,
} = useAgingReport()
</script>

<template>
  <div class="flex flex-col gap-6 p-6">

    <!-- Header -->
    <AgingReportHeader
      :export-csv="exportCsv"
      :export-pdf="exportPdf"
      :print-report="printReport"
    />

    <!-- Filters -->
    <AgingReportFilters
      :filters="filters"
      :show-branch-filter="showBranchFilter"
      :branches="branches"
      :officers="officers"
      :products="products"
      :apply-filters="applyFilters"
      :reset-filters="resetFilters"
    />

    <!-- KPI Loading -->
    <div v-if="loadingKpis" class="flex items-center justify-center py-10">
      <Spinner class="h-6 w-6 text-nfuko-primary" />
    </div>

    <!-- KPI & Tables -->
    <template v-else>
      <AgingReportKpiCards
        :totals="totals"
        :buckets="buckets"
        :npl-ratio="nplRatio"
        :fmt="fmt"
        :fmt-pct="fmtPct"
      />

      <!-- Portfolio Aging Summary -->
      <AgingSummaryTable
        :buckets="buckets"
        :totals="totals"
        :bucket-label="bucketLabel"
        :bucket-badge-class="bucketBadgeClass"
        :asset-quality-class="assetQualityClass"
        :asset-quality-label="assetQualityLabel"
        :bucket-table-row-class="bucketTableRowClass"
        :fmt="fmt"
        :fmt-pct="fmtPct"
      />

      <!-- Loan Detail Section -->
      <AgingDetailTable
        v-model:search="search"
        :total="total"
        :active-bucket-tab="activeBucketTab"
        :BUCKET_TABS="BUCKET_TABS"
        :loading-table="loadingTable"
        :filtered-rows="filteredRows"
        :expanded-loan-id="expandedLoanId"
        :loading-schedule-id="loadingScheduleId"
        :pagination-links="paginationLinks"
        :filters="filters"
        :tab-count="tabCount"
        :bucket-row-class="bucketRowClass"
        :bucket-badge-class="bucketBadgeClass"
        :bucket-label="bucketLabel"
        :dpd-class="dpdClass"
        :asset-quality-class="assetQualityClass"
        :asset-quality-label="assetQualityLabel"
        :schedule-status-badge="scheduleStatusBadge"
        :schedule-row-class="scheduleRowClass"
        :fmt="fmt"
        :schedule-for-loan="scheduleForLoan"
        :select-bucket-tab="selectBucketTab"
        :toggle-schedule="toggleSchedule"
        :on-page-change="onPageChange"
        :on-per-page-change="onPerPageChange"
      />
    </template>
  </div>
</template>

<style>
@media print {
  body > *:not(#app) { display: none !important; }
  nav, aside, header, footer, .sidebar, [data-sidebar], button, .no-print { display: none !important; }
  #app, .flex-col { overflow: visible !important; }
  * { box-shadow: none !important; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }
}
</style>
