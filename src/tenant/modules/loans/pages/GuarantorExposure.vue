<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { RotateCcw } from 'lucide-vue-next'
import { Spinner, formatMoneyValue } from '@/Global'
import { notify } from '@/Global/Toasters'
import { loanApplicationsApi } from '@/tenant/apis/loans'
import type {
  GuarantorExposureRow,
  GuarantorPendingConsentRow,
  GuarantorReleaseRequestRow,
} from '@/tenant/apis/loans/loanApplicationsApi'

// Guarantor reports: how exposed each guarantor is, requests still waiting for an
// answer, and guarantors who have asked to be replaced. Replacing someone is done
// from the loan application's guarantor panel.
type Tab = 'exposure' | 'pending' | 'release'

const tab = ref<Tab>('exposure')
const loading = ref(false)
const exposure = ref<GuarantorExposureRow[]>([])
const pending = ref<GuarantorPendingConsentRow[]>([])
const releases = ref<GuarantorReleaseRequestRow[]>([])

const tabs: { key: Tab; label: string }[] = [
  { key: 'exposure', label: 'Exposure' },
  { key: 'pending', label: 'Waiting for an answer' },
  { key: 'release', label: 'Asked to be replaced' },
]

async function load() {
  loading.value = true
  try {
    if (tab.value === 'exposure')
      exposure.value = (await loanApplicationsApi.guarantorExposure()).data.data
    if (tab.value === 'pending')
      pending.value = (await loanApplicationsApi.guarantorPendingConsents()).data.data
    if (tab.value === 'release')
      releases.value = (await loanApplicationsApi.guarantorReleaseRequests()).data.data
  } catch {
    notify({ type: 'error', msg: 'Could not load the report.' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(tab, load)

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'
}

function shareClass(share: number | null) {
  if (share === null) return 'text-neutral-400'
  if (share >= 90) return 'text-red-600 font-semibold'
  if (share >= 60) return 'text-orange-600'
  return 'text-neutral-700 dark:text-neutral-200'
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Guarantor Exposure</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Who is guaranteeing what, requests guarantors have not answered, and guarantors who want
          to be replaced. To replace a guarantor, open the loan application and use Replace in its
          Guarantors panel.
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
        :disabled="loading"
        @click="load"
      >
        <RotateCcw class="h-4 w-4" /> Refresh
      </button>
    </div>

    <nav class="flex gap-2 border-b border-neutral-100 dark:border-neutral-800">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="-mb-px border-b-2 px-3 py-2 text-sm font-medium"
        :class="
          tab === t.key
            ? 'border-emerald-600 text-emerald-700'
            : 'border-transparent text-neutral-500 hover:text-neutral-700'
        "
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </nav>

    <div v-if="loading" class="flex justify-center py-16"><Spinner /></div>

    <!-- Exposure -->
    <template v-else-if="tab === 'exposure'">
      <p v-if="!exposure.length" class="py-10 text-center text-sm text-neutral-500">
        Nobody is guaranteeing a loan right now.
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
              <th class="px-4 py-3">Guarantor</th>
              <th class="px-4 py-3 text-right">Guarantees</th>
              <th class="px-4 py-3 text-right">Pledged</th>
              <th class="px-4 py-3 text-right">Held</th>
              <th class="px-4 py-3 text-right">Savings</th>
              <th class="px-4 py-3 text-right">Held share</th>
              <th class="px-4 py-3 text-right">Overdue loans</th>
              <th class="px-4 py-3 text-right">Recovered to date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="row in exposure" :key="`${row.guarantor_type}-${row.guarantor_id}`">
              <td class="px-4 py-3">
                <div class="font-medium">{{ row.name ?? '—' }}</div>
                <div class="text-xs text-neutral-400">
                  {{ row.code }}<span v-if="row.guarantor_type === 'group'"> · group</span>
                  <span v-if="row.release_requested" class="text-orange-600">
                    · asked to be replaced</span
                  >
                </div>
              </td>
              <td class="px-4 py-3 text-right">{{ row.guarantees }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoneyValue(row.pledged_amount) }}</td>
              <td class="px-4 py-3 text-right font-medium">{{ row.held_amount_formatted }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoneyValue(row.savings_balance) }}</td>
              <td class="px-4 py-3 text-right" :class="shareClass(row.held_share)">
                {{ row.held_share === null ? '—' : `${row.held_share}%` }}
              </td>
              <td
                class="px-4 py-3 text-right"
                :class="row.overdue_loans ? 'text-red-600 font-semibold' : ''"
              >
                {{ row.overdue_loans }}
              </td>
              <td class="px-4 py-3 text-right">{{ formatMoneyValue(row.recovered_to_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Waiting for an answer -->
    <template v-else-if="tab === 'pending'">
      <p v-if="!pending.length" class="py-10 text-center text-sm text-neutral-500">
        No guarantor is waiting to answer.
      </p>
      <ul
        v-else
        class="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <li
          v-for="row in pending"
          :key="row.id"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <div>
            <div class="font-medium">
              {{ row.name ?? '—' }}
              <span
                v-if="row.is_replacement"
                class="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700"
                >replacement</span
              >
            </div>
            <div class="text-xs text-neutral-500">
              for {{ row.borrower_name ?? '—' }} ·
              <RouterLink
                :to="{ name: 'tenant-loans-show', params: { id: row.loan_application_id } }"
                class="text-nfuko-action hover:underline"
              >
                {{ row.loan_no ?? row.application_no }}
              </RouterLink>
            </div>
          </div>
          <div class="text-right">
            <div class="font-medium">{{ row.guarantee_amount_formatted }}</div>
            <div class="text-xs text-neutral-500">
              answer by {{ formatDate(row.consent_expires_at) }}
            </div>
          </div>
        </li>
      </ul>
    </template>

    <!-- Asked to be replaced -->
    <template v-else>
      <p v-if="!releases.length" class="py-10 text-center text-sm text-neutral-500">
        No guarantor has asked to be replaced.
      </p>
      <ul
        v-else
        class="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <li
          v-for="row in releases"
          :key="row.id"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <div>
            <div class="font-medium">
              {{ row.name ?? '—' }} · {{ row.guarantee_amount_formatted }}
            </div>
            <div class="text-xs text-neutral-500">
              guarantees {{ row.borrower_name ?? '—' }}'s loan {{ row.loan_no }} · asked
              {{ formatDate(row.release_requested_at) }}
            </div>
            <div v-if="row.release_request_reason" class="text-xs italic text-neutral-500">
              “{{ row.release_request_reason }}”
            </div>
          </div>
          <div class="text-right text-xs">
            <div v-if="row.replacement_pending" class="text-blue-600">
              {{ row.replacement_pending }} asked to take over
            </div>
            <RouterLink
              :to="{ name: 'tenant-loans-show', params: { id: row.loan_application_id } }"
              class="font-medium text-nfuko-action hover:underline"
            >
              Find a replacement
            </RouterLink>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
