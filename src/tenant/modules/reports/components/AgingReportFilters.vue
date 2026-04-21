<script setup lang="ts">
import { Calendar, Filter, RotateCcw } from 'lucide-vue-next'
import type { AgingFilters } from '@/tenant/apis/reports/reportsApi'

defineProps<{
  filters: AgingFilters
  showBranchFilter: boolean
  branches: { id: number; name: string }[]
  officers: { id: number; name: string }[]
  products: { id: number; name: string }[]
  applyFilters: () => void
  resetFilters: () => void
}>()
</script>

<template>
  <div class="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
      <Filter class="h-4 w-4" /> Filters
    </div>

    <!-- As of Date -->
    <div class="flex flex-col gap-1">
      <label class="text-xs text-neutral-400">As of Date</label>
      <div class="relative">
        <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input v-model="filters.as_of_date" type="date"
          class="rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
      </div>
    </div>

    <!-- Branch -->
    <div v-if="showBranchFilter" class="flex flex-col gap-1">
      <label class="text-xs text-neutral-400">Branch</label>
      <select v-model="filters.branch_id"
        class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
        <option :value="null">All Branches</option>
        <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>
    </div>

    <!-- Loan Officer -->
    <div v-if="officers.length > 0" class="flex flex-col gap-1">
      <label class="text-xs text-neutral-400">Loan Officer</label>
      <select v-model="filters.loan_officer_id"
        class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
        <option :value="null">All Officers</option>
        <option v-for="o in officers" :key="o.id" :value="o.id">{{ o.name }}</option>
      </select>
    </div>

    <!-- Loan Product -->
    <div v-if="products.length > 0" class="flex flex-col gap-1">
      <label class="text-xs text-neutral-400">Product</label>
      <select v-model="filters.loan_product_id"
        class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
        <option :value="null">All Products</option>
        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <button @click="applyFilters"
      class="rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-nfuko-primary/90">
      Apply
    </button>
    <button @click="resetFilters"
      class="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800">
      <RotateCcw class="h-3.5 w-3.5" /> Reset
    </button>
  </div>
</template>
