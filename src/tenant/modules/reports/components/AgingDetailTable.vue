<script setup lang="ts">
import { Search, ChevronDown, ChevronRight, ExternalLink, Loader } from 'lucide-vue-next'
import { Pagination } from '@/Global'
import AgingScheduleTable from './AgingScheduleTable.vue'
import type { AgingLoanRow, AgingBucket } from '@/tenant/apis/reports/reportsApi'

defineProps<{
  total: number
  search: string
  activeBucketTab: AgingBucket | null
  BUCKET_TABS: { value: AgingBucket | null; label: string }[]
  loadingTable: boolean
  filteredRows: AgingLoanRow[]
  expandedLoanId: number | null
  loadingScheduleId: number | null
  paginationLinks: any
  filters: { page: number; per_page: number }
  tabCount: (b: AgingBucket | null) => number
  bucketRowClass: (b: AgingBucket) => string
  bucketBadgeClass: (b: AgingBucket) => string
  bucketLabel: (b: AgingBucket) => string
  dpdClass: (d: number) => string
  assetQualityClass: (b: AgingBucket) => string
  assetQualityLabel: (b: AgingBucket) => string
  scheduleStatusBadge: (s: string) => string
  scheduleRowClass: (s: string, d: string) => string
  fmt: (v: any) => string
  scheduleForLoan: (id: number) => any[]
  selectBucketTab: (b: AgingBucket|null) => void
  toggleSchedule: (id: number) => void
  onPageChange: (p: number) => void
  onPerPageChange: (p: number) => void
}>()

defineEmits(['update:search'])
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

    <!-- Section header -->
    <div class="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Loan Detail</h2>
          <p class="text-xs text-neutral-400">
            Click any row to expand the installment schedule.
            <span v-if="total > 0" class="font-medium text-neutral-500">{{ total }} loan{{ total === 1 ? '' : 's' }} found.</span>
          </p>
        </div>
        <!-- Search box -->
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            :value="search"
            @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Search member, loan no…"
            class="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-50"
          />
        </div>
      </div>
    </div>

    <!-- Bucket Tabs -->
    <div class="flex items-center gap-1 overflow-x-auto border-b border-neutral-100 px-4 pt-2 dark:border-neutral-800">
      <button
        v-for="tab in BUCKET_TABS"
        :key="String(tab.value)"
        @click="selectBucketTab(tab.value)"
        class="flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors"
        :class="activeBucketTab === tab.value
          ? 'border-nfuko-primary text-nfuko-primary dark:text-nfuko-primary'
          : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'"
      >
        {{ tab.label }}
        <span
          class="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold"
          :class="activeBucketTab === tab.value
            ? 'bg-nfuko-primary text-white'
            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'"
        >
          {{ tabCount(tab.value) }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loadingTable" class="flex items-center justify-center py-14">
      <Loader class="h-6 w-6 text-nfuko-primary" />
    </div>

    <template v-else>
      <!-- Empty state -->
      <div v-if="filteredRows.length === 0" class="flex flex-col items-center justify-center gap-2 py-14">
        <p class="text-sm font-medium text-neutral-500">No overdue loans found for the selected filters.</p>
        <p class="text-xs text-neutral-400">Try adjusting the date or removing a filter.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-neutral-50 dark:bg-neutral-800/40">
              <th class="w-8 px-3 py-3"></th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Member</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Loan No</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Product / Officer</th>
              <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Bal. Outstanding</th>
              <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Total Arrears</th>
              <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Arrears by Bucket</th>
              <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">DPD</th>
              <th class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Classification</th>
              <th class="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Last Payment</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <template v-for="row in filteredRows" :key="row.loan_id">
              <tr
                class="cursor-pointer transition-colors hover:brightness-95"
                :class="[
                  bucketRowClass(row.bucket),
                  expandedLoanId === row.loan_id ? 'brightness-95' : '',
                ]"
                @click="toggleSchedule(row.loan_id)"
              >
                <td class="w-8 px-3 py-3 text-neutral-400">
                  <Loader v-if="loadingScheduleId === row.loan_id" class="h-4 w-4 text-nfuko-primary" />
                  <ChevronDown v-else-if="expandedLoanId === row.loan_id" class="h-4 w-4 text-nfuko-primary" />
                  <ChevronRight v-else class="h-4 w-4" />
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1.5">
                    <span class="font-medium text-neutral-900 dark:text-white">{{ row.member_name }}</span>
                    <span v-if="row.is_rescheduled" class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" title="Rescheduled loan">R</span>
                  </div>
                  <div class="text-xs text-neutral-400">{{ row.member_no }}</div>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1">
                    <span class="font-mono text-xs text-neutral-700 dark:text-neutral-300">{{ row.loan_no }}</span>
                    <router-link :to="{ name: 'tenant-loan-account', params: { id: row.loan_id } }" class="ml-0.5 text-neutral-300 hover:text-nfuko-primary dark:text-neutral-600 dark:hover:text-nfuko-primary" title="Open loan" @click.stop>
                      <ExternalLink class="h-3 w-3" />
                    </router-link>
                  </div>
                  <div class="text-xs text-neutral-400">{{ row.branch_name }}</div>
                </td>
                <td class="px-5 py-3">
                  <div class="text-neutral-700 dark:text-neutral-300">{{ row.product_name }}</div>
                  <div class="text-xs text-neutral-400">{{ row.loan_officer_name }}</div>
                </td>
                <td class="px-5 py-3 text-right">
                  <div class="font-mono font-medium text-neutral-900 dark:text-white">{{ fmt(row.balance_outstanding) }}</div>
                  <div class="mt-0.5 text-xs text-neutral-400">Princ: {{ fmt(row.principal_balance_outstanding) }}</div>
                </td>
                <td class="px-5 py-3 text-right">
                  <div class="font-mono font-semibold text-red-700 dark:text-red-400">{{ fmt(row.total_arrears) }}</div>
                  <div class="mt-0.5 text-xs text-neutral-400">P:{{ fmt(row.principal_arrears) }} / I:{{ fmt(row.interest_arrears) }}</div>
                </td>
                <td class="px-5 py-3 text-right text-xs">
                  <div v-if="Number(row.arrears_1_30) > 0" class="text-yellow-700 dark:text-yellow-400">1–30: {{ fmt(row.arrears_1_30) }}</div>
                  <div v-if="Number(row.arrears_31_60) > 0" class="text-orange-600 dark:text-orange-400">31–60: {{ fmt(row.arrears_31_60) }}</div>
                  <div v-if="Number(row.arrears_61_90) > 0" class="text-red-600 dark:text-red-400">61–90: {{ fmt(row.arrears_61_90) }}</div>
                  <div v-if="Number(row.arrears_91_180)> 0" class="text-red-700 dark:text-red-300">91–180: {{ fmt(row.arrears_91_180) }}</div>
                  <div v-if="Number(row.arrears_180plus)> 0" class="font-semibold text-neutral-800 dark:text-neutral-200">180+: {{ fmt(row.arrears_180plus) }}</div>
                </td>
                <td class="px-5 py-3 text-right font-mono text-base" :class="dpdClass(row.days_past_due)">
                  {{ row.days_past_due }}
                </td>
                <td class="px-5 py-3 text-center">
                  <span class="mb-1 inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold" :class="assetQualityClass(row.bucket)">{{ assetQualityLabel(row.bucket) }}</span>
                  <div class="mt-1">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="bucketBadgeClass(row.bucket)">{{ bucketLabel(row.bucket) }}</span>
                  </div>
                </td>
                <td class="px-5 py-3 text-right">
                  <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ row.last_payment_date ?? '—' }}</div>
                  <div class="mt-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">Paid: {{ fmt(row.total_paid_to_date) }}</div>
                </td>
              </tr>

              <tr v-if="expandedLoanId === row.loan_id" :class="bucketRowClass(row.bucket)">
                <td colspan="10" class="px-0 py-0">
                  <AgingScheduleTable
                    :loan-id="row.loan_id"
                    :loan-no="row.loan_no"
                    :loading-schedule-id="loadingScheduleId"
                    :schedule="scheduleForLoan(row.loan_id)"
                    :schedule-row-class="scheduleRowClass"
                    :schedule-status-badge="scheduleStatusBadge"
                    :fmt="fmt"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <Pagination
          :links="paginationLinks"
          :page="filters.page"
          :per-page="filters.per_page"
          @change="onPageChange"
          @update:page="onPageChange"
          @update:per-page="onPerPageChange"
        />
      </div>
    </template>
  </div>
</template>
