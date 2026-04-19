<script setup lang="ts">
import type { DisbursementKpis, DisbursementPending } from '@/tenant/apis/reports/reportsApi'
import { TrendingUp, Banknote, Users, Clock } from 'lucide-vue-next'

const props = defineProps<{
  kpis: DisbursementKpis
  pending: DisbursementPending
  fmt: (v: unknown) => string
}>()

const cards = [
  { label: 'Total Disbursed', key: 'total_disbursed', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Loans Disbursed', key: 'loan_count', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Avg Loan Size', key: 'avg_loan_size', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
] as const
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="card in cards"
      :key="card.key"
      class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <div class="flex items-center gap-3">
        <div class="rounded-lg p-2" :class="card.bg">
          <component :is="card.icon" class="h-5 w-5" :class="card.color" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">{{ card.label }}</p>
          <p class="text-lg font-bold text-neutral-900 dark:text-white">
            <template v-if="card.key === 'loan_count'">{{ kpis.loan_count }}</template>
            <template v-else>{{ fmt(kpis[card.key]) }}</template>
          </p>
        </div>
      </div>
    </div>

    <!-- Pending card -->
    <div class="rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-800 dark:bg-orange-900/10">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-orange-100 p-2">
          <Clock class="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-orange-500">Pending Approval</p>
          <p class="text-lg font-bold text-orange-700 dark:text-orange-400">
            {{ pending.pending_count }} loans
          </p>
          <p class="text-xs text-orange-500">{{ fmt(pending.pending_amount) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
