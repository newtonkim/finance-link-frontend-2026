<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Download, Filter, RotateCcw, Printer } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { useDisbursementReport } from '../composables/useDisbursementReport'
import DisbursementKpiCards from '../components/DisbursementKpiCards.vue'
import DisbursementSummaryTabs from '../components/DisbursementSummaryTabs.vue'
import DisbursementTrendChart from '../components/DisbursementTrendChart.vue'
import DisbursementRegisterTable from '../components/DisbursementRegisterTable.vue'

const {
  filters, loading, exporting, error, activeTab,
  showBranchFilter, branches, officers,
  kpis, pending, byProduct, byChannel, byBranch, byOfficer, 
  trend, trendMonths, trendLoading,
  loans, meta, showEmptyState, canGoPrev, canGoNext,
  loadFilterOptions, fetchReport, fetchTrend, applyFilters, resetFilters, goToPage, exportExcel,
  fmt, fmtPct,
} = useDisbursementReport()

onMounted(async () => {
  await loadFilterOptions()
  await fetchReport()
})

const isPrinting = ref(false)

async function printReport() {
  if (isPrinting.value) return
  isPrinting.value = true

  try {
    const params = {
      date_from: filters.value.date_from,
      date_to: filters.value.date_to,
      branch_id: filters.value.branch_id,
      loan_officer_id: filters.value.loan_officer_id,
      loan_product_id: filters.value.loan_product_id,
      per_page: 10000,
      page: 1
    }
    
    // Fetch all dataset for accurate printing rather than just the currently viewed page
    const res = await reportsApi.disbursementLoans(params)
    const allLoans = res.data?.data || []

    const win = window.open('', '_blank')
    if (!win) return

    const renderSummaryTable = (title: string, data: any[]) => {
      if (!data || !data.length) return ''
      const rows = data.map(item => `
        <tr>
          <td style="text-align: left">${item.name}</td>
          <td>${item.loan_count}</td>
          <td>${fmt(item.total_amount)}</td>
          <td>${fmtPct(item.percentage)}%</td>
        </tr>
      `).join('')
      return `
        <div class="summary-box">
          <h3>${title}</h3>
          <table>
            <thead>
              <tr><th style="text-align: left">Name</th><th>Count</th><th>Amount</th><th>%</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `
    }

    const registerRows = allLoans.map(row => `
      <tr>
        <td style="text-align: left">${row.loan_no}</td>
        <td style="text-align: left">${row.member_name}</td>
        <td style="text-align: left">${row.product_name}</td>
        <td>${fmt(row.net_disbursed_amount)}</td>
        <td>${row.disbursement_method}</td>
        <td>${row.disbursed_at}</td>
        <td>${row.branch_name}</td>
        <td>${row.loan_officer_name}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Loan Disbursement Report</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 24px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  p.subtitle { color: #555; margin-top: 0; margin-bottom: 24px; font-size: 13px; }
  h2 { font-size: 14px; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 4px;}
  h3 { font-size: 12px; margin-bottom: 8px; color: #333; }
  .summaries { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 24px; }
  .summary-box { flex: 1; min-width: 300px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #f5f5f5; }
  th { padding: 6px 8px; text-align: right; font-size: 10px; text-transform: uppercase; color: #444; border-bottom: 2px solid #ddd; }
  td { padding: 6px 8px; text-align: right; border-bottom: 1px solid #eee; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <h1>Loan Disbursement Report</h1>
  <p class="subtitle">Disbursements for ${filters.value.date_from} to ${filters.value.date_to}</p>

  <h2>Summary Breakdowns</h2>
  <div class="summaries">
    ${renderSummaryTable('By Product', byProduct.value)}
    ${renderSummaryTable('By Channel', byChannel.value)}
    ${renderSummaryTable('By Branch', byBranch.value)}
    ${renderSummaryTable('By Officer', byOfficer.value)}
  </div>

  <h2>Disbursement Register</h2>
  <table>
    <thead>
      <tr>
        <th style="text-align: left">Loan No</th>
        <th style="text-align: left">Member</th>
        <th style="text-align: left">Product</th>
        <th>Disbursed</th>
        <th>Channel</th>
        <th>Date</th>
        <th>Branch</th>
        <th>Officer</th>
      </tr>
    </thead>
    <tbody>${registerRows}</tbody>
  </table>
</body>
</html>`

    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 200)
  } catch (error) {
    console.error("Failed to fetch full print data", error)
    alert("Failed to prepare print document. Please try again.")
  } finally {
    isPrinting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 p-4 md:p-6 print-container">
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
      <div class="flex items-center gap-3 no-print">
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          :disabled="loading || isPrinting"
          @click="printReport"
        >
          <Spinner v-if="isPrinting" class="h-4 w-4" />
          <Printer v-else class="h-4 w-4" />
          Print
        </button>
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
      <DisbursementKpiCards class="no-print" :kpis="kpis" :pending="pending" :fmt="fmt" />

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
      <DisbursementTrendChart 
        class="no-print"
        :trend="trend" 
        :trend-months="trendMonths"
        :trend-loading="trendLoading"
        :fmt="fmt" 
        @update:trend-months="trendMonths = $event; fetchTrend()"
      />

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
      <div v-if="meta.total > 0" class="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 no-print dark:border-neutral-700 dark:bg-neutral-800">
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

<style>
@media print {
  @page { margin: 10mm; size: landscape; }
  body { background: white !important; }
  .no-print, aside, header, nav, .sidebar { display: none !important; }
  .print-container { 
    margin: 0 !important; 
    padding: 0 !important; 
    width: 100% !important; 
    max-width: 100% !important;
  }
}
</style>
