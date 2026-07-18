<script setup lang="ts">
import {
  Banknote,
  ChevronDown,
  History,
  CreditCard,
  Wallet,
  ClipboardList,
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/ui/dropdown-menu'
import type { LoanScheduleEntry } from '@/tenant/apis/loans/loansApi'
import { licenseState } from '@/tenant/apis/licenseState'

interface ScheduleTotals {
  principal_due: number
  interest_due: number
  charges_due: number
  penalty_due: number
  total_due: number
  total_paid: number
  outstanding: number
}

defineProps<{
  schedule: LoanScheduleEntry[]
  filteredSchedule: LoanScheduleEntry[]
  scheduleTotals: ScheduleTotals
  currency: string
  canShowMore: (row: LoanScheduleEntry) => boolean
  fmt: (v: number | string | null | undefined) => string
  fmtDate: (d: string | null | undefined) => string
  scheduleStatusColor: (s: string) => string
}>()

const emit = defineEmits<{
  (e: 'openReceiveCash', row: LoanScheduleEntry): void
  (e: 'openSavingsRepayment', row: LoanScheduleEntry): void
}>()
</script>

<template>
  <div>
    <div
      v-if="schedule.length"
      class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 flex items-center justify-between">
        <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
          Current Repayment Schedule
        </h3>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          >
            {{ filteredSchedule.length }} installments
          </span>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-[13px]">
          <thead
            class="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[11px] border-b border-neutral-100 dark:border-neutral-800"
          >
            <tr>
              <th class="px-2 py-3 text-left">#ID</th>
              <th class="px-3 py-3 text-left">Due Date</th>
              <th class="px-3 py-3 text-right">Principal</th>
              <th class="px-3 py-3 text-right">Interest</th>
              <th class="px-3 py-3 text-right">Penalty</th>
              <th class="px-3 py-3 text-right">Total</th>
              <th class="px-3 py-3 text-right">Paid</th>
              <th class="px-3 py-3 text-right">Pending</th>
              <th class="px-3 py-3 text-left">Status</th>
              <th class="px-3 py-3 text-right">Arrears Days</th>
              <th class="px-3 py-3 text-right">Running Balance</th>
              <th class="px-3 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr
              v-for="row in filteredSchedule"
              :key="row.id"
              class="even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <td class="px-2 py-3 text-neutral-500">{{ row.installment_no }}</td>
              <td class="px-3 py-3 text-neutral-700 dark:text-neutral-300">
                {{ fmtDate(row.due_date) }}
              </td>
              <td class="px-3 py-3 text-right">{{ currency }} {{ fmt(row.principal_due) }}</td>
              <td class="px-3 py-3 text-right">{{ currency }} {{ fmt(row.interest_due) }}</td>
              <td class="px-3 py-3 text-right">{{ currency }} {{ fmt(row.penalty_due) }}</td>
              <td class="px-3 py-3 text-right font-semibold">
                {{ currency }} {{ fmt(row.total_due) }}
              </td>
              <td class="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                {{ currency }}
                {{
                  fmt(
                    Number(row.principal_paid) +
                      Number(row.interest_paid) +
                      Number(row.charges_paid) +
                      Number(row.penalty_paid),
                  )
                }}
              </td>
              <td class="px-3 py-3 text-right">
                {{ currency }}
                {{
                  fmt(
                    Number(row.total_due) -
                      (Number(row.principal_paid) +
                        Number(row.interest_paid) +
                        Number(row.charges_paid) +
                        Number(row.penalty_paid)),
                  )
                }}
              </td>
              <td class="px-3 py-3">
                <span
                  class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-200"
                  :class="scheduleStatusColor(row.status)"
                >
                  {{ row.status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—' }}
                </span>
              </td>
              <td class="px-3 py-3 text-right text-neutral-600">
                {{ row.days_overdue || 0 }}
              </td>
              <td class="px-3 py-3 text-right text-neutral-700 dark:text-neutral-300">
                {{ currency }} {{ fmt(row.outstanding_balance) }}
              </td>
              <td class="px-3 py-3 text-center">
                <DropdownMenu v-if="canShowMore(row)">
                  <DropdownMenuTrigger as-child>
                    <button
                      :disabled="licenseState.readOnly"
                      :title="licenseState.readOnly ? 'License expired — renew to post a repayment' : ''"
                      class="inline-flex items-center justify-between gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      More
                      <ChevronDown class="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    class="w-48 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl"
                  >
                    <DropdownMenuItem
                      class="cursor-pointer gap-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      @click="emit('openReceiveCash', row)"
                    >
                      <Banknote class="h-4 w-4" />
                      Receive Cash
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer gap-2">
                      <History class="h-4 w-4" />
                      Mobile Money
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer gap-2">
                      <CreditCard class="h-4 w-4" />
                      Shares Payments
                    </DropdownMenuItem>
                    <DropdownMenuItem class="cursor-pointer gap-2">
                      <CreditCard class="h-4 w-4" />
                      Equity Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="cursor-pointer gap-2 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      @click="emit('openSavingsRepayment', row)"
                    >
                      <Wallet class="h-4 w-4" />
                      Receive from Savings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          </tbody>
          <tfoot
            class="bg-neutral-50 dark:bg-neutral-800/60 font-bold text-neutral-900 dark:text-white border-t border-neutral-200 dark:border-neutral-700"
          >
            <tr>
              <td colspan="2" class="px-3 py-3 font-semibold text-neutral-700">Total Due</td>
              <td class="px-3 py-3 text-right">
                {{ currency }} {{ fmt(scheduleTotals.principal_due) }}
              </td>
              <td class="px-3 py-3 text-right">
                {{ currency }} {{ fmt(scheduleTotals.interest_due) }}
              </td>
              <td class="px-3 py-3 text-right">
                {{ currency }} {{ fmt(scheduleTotals.penalty_due) }}
              </td>
              <td class="px-3 py-3 text-right font-bold">
                {{ currency }} {{ fmt(scheduleTotals.total_due) }}
              </td>
              <td class="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">
                {{ currency }} {{ fmt(scheduleTotals.total_paid) }}
              </td>
              <td class="px-3 py-3 text-right font-bold">
                {{ currency }} {{ fmt(scheduleTotals.total_due - scheduleTotals.total_paid) }}
              </td>
              <td colspan="4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
      <ClipboardList class="h-8 w-8" />
      <p class="text-sm">No payment schedule available.</p>
    </div>
  </div>
</template>
