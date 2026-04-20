<script setup lang="ts">
import { Filter, Calendar, RotateCcw } from 'lucide-vue-next'
import type { CollectionsFilters, CollectionsPeriodType } from '@/tenant/apis/reports/reportsApi'

defineProps<{
  filters: CollectionsFilters & { month: string; as_of_date: string }
  periodTypes: CollectionsPeriodType[]
  showBranchFilter: boolean
  branches: { id: number; name: string }[]
  officers: { id: number; name: string }[]
  applyFilters: () => void
  resetFilters: () => void
}>()
</script>

<template>
  <div class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
    <div class="flex flex-wrap items-end gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
        <Filter class="h-4 w-4" /> Filters
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Period Type</label>
        <select
          v-model="filters.period_type"
          class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        >
          <option v-for="periodType in periodTypes" :key="periodType" :value="periodType">
            {{ periodType }}
          </option>
        </select>
      </div>

      <template v-if="filters.period_type === 'Date Range'">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Date From</label>
          <div class="relative">
            <Calendar class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              v-model="filters.date_from"
              type="date"
              class="rounded-md border border-neutral-300 py-1.5 pl-9 pr-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Date To</label>
          <div class="relative">
            <Calendar class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              v-model="filters.date_to"
              type="date"
              class="rounded-md border border-neutral-300 py-1.5 pl-9 pr-3 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
        </div>
      </template>

      <div v-else-if="filters.period_type === 'Month'" class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Month</label>
        <input
          v-model="filters.month"
          type="month"
          class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
      </div>

      <div v-else class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">As of Date</label>
        <input
          v-model="filters.as_of_date"
          type="date"
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
          <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Loan Officer</label>
        <select
          v-model="filters.loan_officer_id"
          class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        >
          <option :value="null">All Officers</option>
          <option v-for="officer in officers" :key="officer.id" :value="officer.id">{{ officer.name }}</option>
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
</template>
