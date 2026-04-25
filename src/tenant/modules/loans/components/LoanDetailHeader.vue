<script setup lang="ts">
import { computed } from 'vue'
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  History,
  ChevronDown,
  TrendingUp,
  Calendar,
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/ui/dropdown-menu'
import type { LoanDetail } from '@/tenant/apis/loans/loansApi'
import { isRestructuredTopupLoan, loanStatusLabel } from '../utils/loanStatus'

const props = defineProps<{
  loan: LoanDetail
  statusColor: (s: string) => string
  fmtDate: (d: string | null | undefined) => string
  interestMethodLabel: string
  principalDisplay: string
  netDisbursedDisplay: string
  outstandingDisplay: string
  totalOutstandingDisplay: string
  totalAmountPaidDisplay: string
  repaidPercent: number
  canTopup?: boolean
}>()

const emit = defineEmits<{
  (e: 'topup'): void
  (e: 'reschedule'): void
}>()

const isRestructuredTopup = computed(() => isRestructuredTopupLoan(props.loan))
</script>

<template>
  <div
    class="rounded-2xl border border-neutral-200/70 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800/70"
  >
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div class="flex items-start gap-4">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30"
        >
          <Banknote class="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-lg font-bold font-mono text-neutral-900 dark:text-white">
              {{ loan.loan_no }}
            </h1>
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
              :class="statusColor(loan.status)"
            >
              <CheckCircle2 v-if="loan.status === 'closed'" class="h-3 w-3" />
              <AlertCircle v-else-if="loan.status === 'arrears'" class="h-3 w-3" />
              <History v-else-if="loan.status === 'rescheduled'" class="h-3 w-3" />
              {{ loanStatusLabel(loan) }}
            </span>
          </div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            {{ loan.member?.name }}
            <span v-if="loan.member?.member_number" class="text-neutral-400">
              · {{ loan.member.member_number }}</span
            >
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {{ loan.loan_product?.name ?? 'Loan Product' }}
            </span>
            <span
              class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              {{ loan.interest_rate }}% · {{ interestMethodLabel }}
            </span>
            <span
              class="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              {{ loan.term_months }} months
            </span>
            <span
              class="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              Disbursed {{ fmtDate(loan.disbursed_at) }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <template v-if="['active', 'disbursed', 'running', 'arrears'].includes(loan.status) && !isRestructuredTopup">
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
            :disabled="!canTopup"
            :title="!canTopup ? 'Top-up feature is disabled in settings' : ''"
            @click="emit('topup')"
          >
            <TrendingUp class="h-4 w-4" />
            Top-Up Loan
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white"
              >
                <span>Manage</span>
                <ChevronDown class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem
                class="flex items-center gap-2 cursor-pointer"
                @click="emit('reschedule')"
              >
                <Calendar class="h-4 w-4 text-neutral-500" />
                <span>Reschedule Loan</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
      </div>
    </div>

    <!-- Stat row -->
    <div class="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <div
        class="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-800/40 dark:from-blue-900/20 dark:to-neutral-900"
      >
        <div
          class="text-[11px] font-semibold uppercase tracking-wider text-blue-700/80 dark:text-blue-300/80"
        >
          Total Principal
        </div>
        <div class="mt-1 text-2xl font-black leading-tight text-neutral-900 dark:text-white">
          {{ principalDisplay }}
        </div>
        <div class="mt-1 text-[11px] text-blue-700/70 dark:text-blue-300/70">
          Loan amount requested
        </div>
      </div>

      <div
        class="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-neutral-900"
      >
        <div
          class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80"
        >
          Net Disbursed
        </div>
        <div class="mt-1 text-2xl font-black leading-tight text-emerald-700 dark:text-emerald-400">
          {{ netDisbursedDisplay }}
        </div>
        <div class="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-300/70">
          Actual amount paid out
        </div>
      </div>

      <div
        class="rounded-xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white p-4 dark:border-neutral-800/40 dark:from-neutral-900/20 dark:to-neutral-900"
      >
        <div
          class="text-[11px] font-semibold uppercase tracking-wider text-neutral-700/80 dark:text-neutral-300/80"
        >
          Principal Outstanding
        </div>
        <div
          class="mt-1 text-2xl font-black leading-tight"
          :class="
            loan.status === 'arrears'
              ? 'text-red-600 dark:text-red-400'
              : 'text-neutral-900 dark:text-white'
          "
        >
          {{ outstandingDisplay }}
        </div>
        <div class="mt-1 text-[11px] text-neutral-700/70 dark:text-neutral-300/70">
          Remaining principal (excl. interest)
        </div>
      </div>

      <div
        class="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-4 dark:border-indigo-800/40 dark:from-indigo-900/20 dark:to-neutral-900"
      >
        <div
          class="text-[11px] font-semibold uppercase tracking-wider text-indigo-700/80 dark:text-indigo-300/80"
        >
          Outstanding Total Amount
        </div>
        <div
          class="mt-1 text-2xl font-black leading-tight"
          :class="
            loan.status === 'arrears'
              ? 'text-red-600 dark:text-red-400'
              : 'text-indigo-900 dark:text-white'
          "
        >
          {{ totalOutstandingDisplay }}
        </div>
        <div class="mt-1 text-[11px] text-indigo-700/70 dark:text-indigo-300/70">
          Total balance (Principal + Int + Fees)
        </div>
      </div>

      <div
        class="rounded-xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-white p-4 dark:border-neutral-800/40 dark:from-neutral-900/20 dark:to-neutral-900"
      >
        <div
          class="text-[11px] font-semibold uppercase tracking-wider text-neutral-700/80 dark:text-neutral-300/80"
        >
          Total Paid
        </div>
        <div class="mt-1 text-2xl font-black leading-tight text-neutral-900 dark:text-white">
          {{ totalAmountPaidDisplay }}
        </div>
        <div class="mt-1 text-[11px] text-neutral-700/70 dark:text-neutral-300/70">
          Collected so far
        </div>
      </div>

      <div
        class="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-neutral-900"
      >
        <div
          class="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80"
        >
          Repaid %
        </div>
        <div class="mt-1 text-2xl font-black leading-tight text-emerald-700 dark:text-emerald-300">
          {{ repaidPercent }}%
        </div>
        <div class="mt-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            class="h-1.5 rounded-full bg-emerald-500 transition-all"
            :style="{ width: repaidPercent + '%' }"
          />
        </div>
        <div class="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-300/70">
          Principal cleared
        </div>
      </div>
    </div>
  </div>
</template>
