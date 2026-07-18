<script setup lang="ts">
import { History, Eye, CircleMinus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/ui/dropdown-menu'
import type { LoanTransaction } from '@/tenant/apis/loans/loansApi'
import { licenseState } from '@/tenant/apis/licenseState'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const props = defineProps<{
  repayments: LoanTransaction[]
  repaymentsMeta: PaginationMeta
  currency: string
  fmt: (v: number | string | null | undefined) => string
  fmtDate: (d: string | null | undefined) => string
}>()

const emit = defineEmits<{
  (e: 'fetchRepayments', page: number): void
}>()
</script>

<template>
  <div class="space-y-4">
    <div
      class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 flex items-center justify-between">
        <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
          Transaction History
        </h3>
        <span
          v-if="repayments.length"
          class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        >
          {{ repaymentsMeta.total }} transactions
        </span>
      </div>
      <div
        v-if="!repayments.length"
        class="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2"
      >
        <History class="h-8 w-8" />
        <p class="text-sm">No repayments yet.</p>
      </div>
      <table v-else class="w-full text-sm">
        <thead
          class="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-800"
        >
          <tr>
            <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">ID</th>
            <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">Processing Date</th>
            <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">Transaction Type</th>
            <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">Principal Portion</th>
            <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">Interest Portion</th>
            <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">Penalty Portion</th>
            <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">Charge Portion</th>
            <th class="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">Amount</th>
            <th class="px-4 py-3 text-left font-bold text-neutral-900 dark:text-neutral-100">Officer</th>
            <th class="px-4 py-3 text-center font-bold text-neutral-900 dark:text-neutral-100">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
          <tr
            v-for="txn in repayments"
            :key="txn.id"
            class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <td class="px-4 py-3 font-mono text-xs text-neutral-500">
              {{ txn.receipt_no ?? txn.payment_id }}
            </td>
            <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">
              {{ fmtDate(txn.payment_date) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col gap-1">
                <span class="capitalize text-neutral-600 dark:text-neutral-400">
                  {{ txn.payment_method?.replace(/_/g, ' ') ?? '—' }}
                </span>
                <span
                  v-if="txn.reschedule_id"
                  class="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <History class="h-2.5 w-2.5" />
                  Rescheduled Installment
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
              {{ currency }} {{ fmt(txn.principal_portion) }}
            </td>
            <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
              {{ currency }} {{ fmt(txn.interest_portion) }}
            </td>
            <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
              {{ currency }} {{ fmt(txn.penalty_portion) }}
            </td>
            <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
              {{ currency }} {{ fmt(txn.charges_portion) }}
            </td>
            <td
              class="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400"
            >
              {{ currency }} {{ fmt(txn.amount_paid) }}
            </td>
            <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">
              {{ txn.loan_officer?.name ?? txn.collected_by?.name ?? '—' }}
            </td>
            <td class="px-4 py-3 text-center">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    class="inline-flex items-center rounded-lg border border-nfuko-action bg-white p-0 text-[11px] font-bold text-nfuko-action overflow-hidden hover:bg-nfuko-action/5 transition-colors shadow-sm"
                  >
                    <span class="px-2.5 py-1.2">Action</span>
                    <span
                      class="bg-nfuko-action px-1.5 py-1.5 text-white border-l border-nfuko-action flex items-center justify-center"
                    >
                      <ChevronDown class="h-3 w-3 stroke-[3]" />
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  class="w-40 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl p-1"
                >
                  <DropdownMenuItem
                    class="cursor-pointer gap-2.5 py-2 px-3 text-nfuko-action focus:text-nfuko-action focus:bg-nfuko-action/10 rounded-lg"
                  >
                    <Eye class="h-4 w-4 stroke-[2.5]" />
                    <span class="font-bold">View</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    :disabled="licenseState.readOnly"
                    :title="licenseState.readOnly ? 'License expired — renew to reverse this transaction' : ''"
                    class="cursor-pointer gap-2.5 py-2 px-3 text-nfuko-action focus:text-nfuko-action focus:bg-nfuko-action/10 rounded-lg"
                  >
                    <CircleMinus class="h-4 w-4 stroke-[2.5]" />
                    <span class="font-bold">Reverse</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Repayments pagination -->
    <div
      v-if="repaymentsMeta.last_page > 1"
      class="flex items-center justify-between text-sm text-neutral-500"
    >
      <span>{{ repaymentsMeta.total }} repayments</span>
      <div class="flex gap-2">
        <button
          :disabled="repaymentsMeta.current_page <= 1"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-neutral-700 dark:hover:bg-neutral-800"
          @click="emit('fetchRepayments', repaymentsMeta.current_page - 1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <button
          :disabled="repaymentsMeta.current_page >= repaymentsMeta.last_page"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-neutral-700 dark:hover:bg-neutral-800"
          @click="emit('fetchRepayments', repaymentsMeta.current_page + 1)"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
