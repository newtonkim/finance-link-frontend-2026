<script setup lang="ts">
import { Printer, Download } from 'lucide-vue-next'
import { Spinner } from '@/Global'

defineProps<{
  dateFrom: string
  dateTo: string
  isPrinting: boolean
  exporting: boolean
  loading: boolean
  printReport: () => void
  exportExcel: () => void
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Loan Collections Report</h1>
      <p class="mt-1 text-sm text-neutral-500">
        Period-level collections summary and loan-level payment detail
        <span class="font-semibold text-neutral-700 dark:text-neutral-300">
          ({{ dateFrom }} to {{ dateTo }})
        </span>
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
        class="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        :disabled="isPrinting || loading"
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
</template>
