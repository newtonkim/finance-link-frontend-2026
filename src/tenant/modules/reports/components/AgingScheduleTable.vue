<script setup lang="ts">
import { Spinner, ExternalLink } from 'lucide-vue-next'

defineProps<{
  loanId: number
  loanNo: string
  loadingScheduleId: number | null
  schedule: any[]
  scheduleRowClass: (status: string, dueDate: string) => string
  scheduleStatusBadge: (status: string) => string
  fmt: (v: any) => string
}>()
</script>

<template>
  <div class="border-t border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-800/40">

    <!-- Loading schedule -->
    <div v-if="loadingScheduleId === loanId" class="flex items-center justify-center py-6">
      <Spinner class="h-5 w-5 text-nfuko-primary" />
      <span class="ml-2 text-xs text-neutral-400">Loading schedule…</span>
    </div>

    <!-- Schedule table -->
    <template v-else-if="schedule.length > 0">
      <div class="px-6 py-3">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Installment Schedule — {{ loanNo }}
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-neutral-100/80 dark:bg-neutral-700/40">
              <th class="px-4 py-2 text-left font-semibold uppercase tracking-wide text-neutral-400">#</th>
              <th class="px-4 py-2 text-left font-semibold uppercase tracking-wide text-neutral-400">Due Date</th>
              <th class="px-4 py-2 text-right font-semibold uppercase tracking-wide text-neutral-400">Principal</th>
              <th class="px-4 py-2 text-right font-semibold uppercase tracking-wide text-neutral-400">Interest</th>
              <th class="px-4 py-2 text-right font-semibold uppercase tracking-wide text-neutral-400">Charges</th>
              <th class="px-4 py-2 text-right font-semibold uppercase tracking-wide text-neutral-400">Penalty</th>
              <th class="px-4 py-2 text-right font-semibold uppercase tracking-wide text-neutral-400">Total Due</th>
              <th class="px-4 py-2 text-right font-semibold uppercase tracking-wide text-neutral-400">Paid</th>
              <th class="px-4 py-2 text-right font-semibold uppercase tracking-wide text-neutral-400">Outstanding</th>
              <th class="px-4 py-2 text-center font-semibold uppercase tracking-wide text-neutral-400">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700">
            <tr
              v-for="inst in schedule"
              :key="inst.id"
              class="transition-colors"
              :class="scheduleRowClass(inst.status, inst.due_date)"
            >
              <td class="px-4 py-2 font-mono text-neutral-500">{{ inst.installment_no }}</td>
              <td class="px-4 py-2 text-neutral-700 dark:text-neutral-300">{{ inst.due_date }}</td>
              <td class="px-4 py-2 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(inst.principal_due) }}</td>
              <td class="px-4 py-2 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(inst.interest_due) }}</td>
              <td class="px-4 py-2 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(inst.charges_due) }}</td>
              <td class="px-4 py-2 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(inst.penalty_due) }}</td>
              <td class="px-4 py-2 text-right font-mono font-semibold text-neutral-900 dark:text-white">{{ fmt(inst.total_due) }}</td>
              <td class="px-4 py-2 text-right font-mono text-emerald-700 dark:text-emerald-400">
                {{ fmt((inst.principal_paid ?? 0) + (inst.interest_paid ?? 0) + (inst.charges_paid ?? 0) + (inst.penalty_paid ?? 0)) }}
              </td>
              <td class="px-4 py-2 text-right font-mono text-neutral-700 dark:text-neutral-300">{{ fmt(inst.outstanding_balance) }}</td>
              <td class="px-4 py-2 text-center">
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize" :class="scheduleStatusBadge(inst.status)">
                  {{ inst.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-6 py-2 text-right border-t border-neutral-100 dark:border-neutral-700">
        <router-link
          :to="{ name: 'tenant-loan-account', params: { id: loanId } }"
          class="inline-flex items-center gap-1 text-xs font-medium text-nfuko-primary hover:underline"
        >
          Open full loan account <ExternalLink class="h-3 w-3" />
        </router-link>
      </div>
    </template>

    <!-- Empty schedule -->
    <div v-else class="px-6 py-4 text-xs text-neutral-400">
      No schedule data available for this loan.
    </div>
  </div>
</template>
