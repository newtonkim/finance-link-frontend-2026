<script setup lang="ts">
import { Download, Printer } from 'lucide-vue-next'

defineProps<{
  exportCsv: () => void
  exportPdf: () => void
  printReport: () => void
}>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Loan Aging Report</h1>
      <p class="text-sm text-neutral-500 dark:text-neutral-400">
        Overdue loans grouped by effective days past due (after grace period). PAR = outstanding balance of at-risk loans ÷ total portfolio.
      </p>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <button @click="exportCsv"
        class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
        <Download class="h-4 w-4 text-emerald-600" /> Excel
      </button>
      <button @click="exportPdf"
        class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
        <Download class="h-4 w-4 text-rose-600" /> PDF
      </button>
      <button @click="printReport"
        class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
        <Printer class="h-4 w-4 text-blue-600" /> Print
      </button>
    </div>
  </div>
</template>
