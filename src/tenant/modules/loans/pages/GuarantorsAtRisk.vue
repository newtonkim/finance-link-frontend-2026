<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { RotateCcw, Send } from 'lucide-vue-next'
import { Spinner, formatMoneyValue } from '@/Global'
import { notify } from '@/Global/Toasters'
import { loanApplicationsApi } from '@/tenant/apis/loans'
import type { GuarantorArrearsRow, GuarantorSummary } from '@/tenant/apis/loans/loanApplicationsApi'

// Overdue loans that guarantees stand behind. Guarantors are warned automatically
// each morning under the SACCO's guarantor settings; staff can also warn them early.
const rows = ref<GuarantorArrearsRow[]>([])
const rules = ref<GuarantorSummary['rules'] | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const notifyingLoanId = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await loanApplicationsApi.guarantorArrears()
    rows.value = res.data.data
    rules.value = res.data.rules
  } catch {
    error.value = 'Could not load overdue guaranteed loans.'
  } finally {
    loading.value = false
  }
}

async function warnNow(row: GuarantorArrearsRow) {
  notifyingLoanId.value = row.loan_id
  try {
    const res = await loanApplicationsApi.notifyGuarantorsOfArrears(row.loan_id)
    notify({ type: 'success', msg: res.data.message })
    await load()
  } catch (err) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    notify({ type: 'error', msg: message ?? 'Could not warn the guarantors.' })
  } finally {
    notifyingLoanId.value = null
  }
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''
}

function daysClass(days: number) {
  if (days > 90) return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (days > 30) return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
}

onMounted(load)
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Guarantors at Risk</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Overdue loans that members' or groups' savings are guaranteeing.
          <template v-if="rules">
            <span v-if="rules.arrears_notice_days > 0">
              Guarantors are warned automatically once a loan is
              {{ rules.arrears_notice_days }} days overdue<span
                v-if="rules.arrears_reminder_days > 0"
                >, and again every {{ rules.arrears_reminder_days }} days while it stays
                overdue</span
              >.
            </span>
            <span v-else>Automatic warnings are switched off in the guarantor settings.</span>
          </template>
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        :disabled="loading"
        @click="load"
      >
        <RotateCcw class="h-4 w-4" /> Refresh
      </button>
    </div>

    <div v-if="loading && !rows.length" class="flex justify-center py-16"><Spinner /></div>
    <p
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ error }}
    </p>
    <p
      v-else-if="!rows.length"
      class="rounded-xl border border-neutral-200 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-800"
    >
      No guaranteed loans are overdue.
    </p>

    <div
      v-else
      class="overflow-x-auto rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <table class="min-w-full text-left text-sm">
        <thead
          class="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800"
        >
          <tr>
            <th class="px-4 py-3">Loan</th>
            <th class="px-4 py-3">Overdue</th>
            <th class="px-4 py-3 text-right">Unpaid</th>
            <th class="px-4 py-3 text-right">Guaranteed</th>
            <th class="px-4 py-3">Guarantors</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
          <tr v-for="row in rows" :key="row.loan_id" class="align-top">
            <td class="px-4 py-3">
              <RouterLink
                :to="{ name: 'tenant-loan-account', params: { id: row.loan_id } }"
                class="font-semibold text-nfuko-action hover:underline"
              >
                {{ row.loan_no }}
              </RouterLink>
              <div class="text-xs text-neutral-500">{{ row.borrower_name ?? '—' }}</div>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="daysClass(row.days_past_due)"
              >
                {{ row.days_past_due }} days
              </span>
              <div class="mt-1 text-xs text-neutral-400">
                since {{ formatDate(row.arrears_since) }}
              </div>
            </td>
            <td class="px-4 py-3 text-right font-medium">{{ row.arrears_amount_formatted }}</td>
            <td class="px-4 py-3 text-right">{{ formatMoneyValue(row.guaranteed_amount) }}</td>
            <td class="px-4 py-3">
              <ul class="space-y-1">
                <li v-for="g in row.guarantors" :key="g.id" class="text-xs">
                  <span class="font-medium text-neutral-800 dark:text-neutral-100">{{
                    g.name ?? '—'
                  }}</span>
                  <span class="text-neutral-400"> · {{ g.guarantee_amount_formatted }}</span>
                  <span v-if="g.guarantor_type === 'group'" class="text-neutral-400"> · group</span>
                  <div class="text-neutral-400">
                    <template v-if="g.arrears_notified_at">
                      Warned {{ formatDate(g.arrears_notified_at) }}
                      <span v-if="g.arrears_notice_count > 1"
                        >({{ g.arrears_notice_count }} times)</span
                      >
                    </template>
                    <template v-else>Not warned yet</template>
                  </div>
                </li>
              </ul>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-xl bg-nfuko-action px-3 py-1.5 text-xs font-medium text-white hover:bg-nfuko-action/90 disabled:opacity-50"
                :disabled="notifyingLoanId === row.loan_id"
                @click="warnNow(row)"
              >
                <Send class="h-3.5 w-3.5" />
                {{ notifyingLoanId === row.loan_id ? 'Sending…' : 'Warn now' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
