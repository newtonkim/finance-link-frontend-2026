<script setup lang="ts">
import { History, Calendar, ChevronDown } from 'lucide-vue-next'
import type { RescheduleHistoryEntry } from '@/tenant/apis/loans/loansApi'

const props = defineProps<{
  reschedules: RescheduleHistoryEntry[]
  currency: string
  fmt: (v: number | string | null | undefined) => string
  fmtDate: (d: string | null | undefined) => string
}>()
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="!reschedules.length"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 p-12 text-center dark:border-neutral-800"
    >
      <History class="mb-4 h-12 w-12 text-neutral-300" />
      <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">No Rescheduling History</h3>
      <p class="mt-1 text-sm text-neutral-500">This loan has never been rescheduled.</p>
    </div>

    <div
      v-for="reschedule in reschedules"
      :key="reschedule.id"
      class="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden"
    >
      <!-- Header -->
      <div
        class="bg-neutral-50/50 border-b border-neutral-200 px-5 py-4 dark:bg-neutral-800/20 dark:border-neutral-800"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
            >
              <Calendar class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
                Rescheduled on {{ fmtDate(reschedule.reschedule_date) }}
              </h4>
              <p class="text-xs text-neutral-500">
                {{ reschedule.reschedule_id }} · Performed by {{ reschedule.performed_by }}
              </p>
            </div>
          </div>
          <span
            class="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          >
            {{ reschedule.reschedule_type.replace(/_/g, ' ') }}
          </span>
        </div>

        <div
          v-if="reschedule.reason"
          class="mt-4 rounded-lg bg-blue-50/50 p-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100/50 dark:border-blue-800/50"
        >
          <strong class="font-bold">Reason:</strong> {{ reschedule.reason }}
        </div>
      </div>

      <!-- Comparison Grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-100 dark:divide-neutral-800"
      >
        <!-- OLD TERMS -->
        <div class="p-5">
          <h5 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
            Previous Terms (Snapshot)
          </h5>
          <div class="grid grid-cols-2 gap-y-4">
            <div>
              <p class="text-[10px] text-neutral-500 uppercase tracking-wider">
                Outstanding Balance
              </p>
              <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {{ currency }} {{ fmt(reschedule.old_outstanding) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-neutral-500 uppercase tracking-wider">Interest Rate</p>
              <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {{ reschedule.old_interest_rate }}%
              </p>
            </div>
            <div>
              <p class="text-[10px] text-neutral-500 uppercase tracking-wider">Remaining Periods</p>
              <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {{ reschedule.old_remaining_periods }} months
              </p>
            </div>
          </div>
        </div>

        <!-- NEW TERMS -->
        <div class="p-5 bg-neutral-50/30 dark:bg-neutral-800/10">
          <h5 class="mb-3 text-[11px] font-bold uppercase tracking-widest text-blue-500">
            New Terms (Applied)
          </h5>
          <div class="grid grid-cols-2 gap-y-4">
            <div>
              <p class="text-[10px] text-neutral-500 uppercase tracking-wider">New Principal</p>
              <p class="text-sm font-bold text-blue-600 dark:text-blue-400">
                {{ currency }} {{ fmt(reschedule.new_principal) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-neutral-500 uppercase tracking-wider">New Rate</p>
              <p class="text-sm font-bold text-blue-600 dark:text-blue-400">
                {{ reschedule.new_rate }}%
              </p>
            </div>
            <div>
              <p class="text-[10px] text-neutral-500 uppercase tracking-wider">New Duration</p>
              <p class="text-sm font-bold text-blue-600 dark:text-blue-400">
                {{ reschedule.new_duration }} months
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Historical Schedule -->
      <div class="border-t border-neutral-100 dark:border-neutral-800">
        <div
          class="px-5 py-3 pointer-events-none select-none bg-neutral-50/30 dark:bg-neutral-800/30"
        >
          <span
            class="text-[11px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2"
          >
            Historical Installments (Superseded)
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead
              class="bg-neutral-50 dark:bg-neutral-800/40 text-[10px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider border-y border-neutral-100 dark:border-neutral-800"
            >
              <tr>
                <th class="px-5 py-3 text-left font-extrabold">#</th>
                <th class="px-5 py-3 text-left font-extrabold">DUE DATE</th>
                <th class="px-5 py-3 text-right font-extrabold">PRINCIPAL ({{ currency }})</th>
                <th class="px-5 py-3 text-right font-extrabold">INTEREST ({{ currency }})</th>
                <th class="px-5 py-3 text-right font-extrabold">TOTAL ({{ currency }})</th>
                <th class="px-5 py-3 text-right font-extrabold">STATUS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              <tr
                v-for="row in reschedule.superseded_schedule"
                :key="row.id"
                class="transition-colors"
                :class="[
                  row.status?.toLowerCase() === 'paid'
                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 text-neutral-900 dark:text-neutral-100 font-bold'
                    : 'text-neutral-500 dark:text-neutral-400 opacity-80',
                ]"
              >
                <td class="px-5 py-3">{{ row.installment_no }}</td>
                <td class="px-5 py-3">{{ fmtDate(row.due_date) }}</td>
                <td class="px-5 py-3 text-right">{{ fmt(row.principal_due) }}</td>
                <td class="px-5 py-3 text-right">{{ fmt(row.interest_due) }}</td>
                <td class="px-5 py-3 text-right">
                  {{
                    fmt(
                      (row as any).total_due_calc ||
                        Number(row.principal_due) + Number(row.interest_due),
                    )
                  }}
                </td>
                <td class="px-5 py-3 text-right">
                  <span
                    v-if="row.status?.toLowerCase() === 'paid'"
                    class="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    PAID
                  </span>
                  <span
                    v-else
                    class="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                  >
                    {{ row.status?.toUpperCase() ?? 'SUPERSEDED' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
