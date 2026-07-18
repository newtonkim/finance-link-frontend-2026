<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { Search, Plus, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'
import ChartOfAccountForm from '../components/ChartOfAccountForm.vue'
import { licenseState } from '@/tenant/apis/licenseState'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Account {
  id: number
  gl_code: string
  name: string
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  account_subtype: string | null
  normal_balance: 'DR' | 'CR'
  level: number
  parent_id: number | null
  is_control: boolean
  is_postable: boolean
  is_active: boolean
  ifrs_category: string | null
}
type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
type AccountTypeFilter = 'ALL' | AccountType

// ─── State ────────────────────────────────────────────────────────────────────
const accounts  = ref<Account[]>([])
const loading   = ref(false)
const search    = ref('')
const typeFilter = ref<AccountTypeFilter>('ALL')
const showForm  = ref(false)
let   timer: ReturnType<typeof setTimeout> | null = null

function openCreateForm() {
  if (!licenseState.readOnly) showForm.value = true
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
// A chart of accounts is a bounded hierarchy — paginating it slices sections in
// half (e.g. Non-Current Assets landing on page 2), so fetch it whole.
async function fetchAccounts() {
  loading.value = true
  try {
    const res = await chartOfAccountsApi.list({
      list: 1,
      search: search.value || undefined,
      account_type: typeFilter.value === 'ALL' ? undefined : typeFilter.value
    })
    accounts.value = res.data?.data ?? []
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => fetchAccounts(), 400)
})

watch(typeFilter, () => fetchAccounts())

onMounted(() => fetchAccounts())

// ─── Group by account_type ────────────────────────────────────────────────────
const grouped = computed(() => {
  const order = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']
  const map = new Map<string, Account[]>()
  order.forEach(t => map.set(t, []))
  accounts.value.forEach(a => {
    if (map.has(a.account_type)) map.get(a.account_type)!.push(a)
    else map.set(a.account_type, [a])
  })
  return map
})

const collapsedGroups = ref<Set<string>>(new Set())
function toggleGroup(type: string) {
  if (collapsedGroups.value.has(type)) collapsedGroups.value.delete(type)
  else collapsedGroups.value.add(type)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const typeColors: Record<string, string> = {
  ASSET:     'bg-blue-100 text-blue-700',
  LIABILITY: 'bg-orange-100 text-orange-700',
  EQUITY:    'bg-purple-100 text-purple-700',
  INCOME:    'bg-green-100 text-green-700',
  EXPENSE:   'bg-red-100 text-red-700',
}

const typeLabel: Record<string, string> = {
  ASSET:     'Assets',
  LIABILITY: 'Liabilities',
  EQUITY:    'Equity',
  INCOME:    'Income',
  EXPENSE:   'Expenses',
}

const typeFilters: Array<{ value: AccountTypeFilter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ASSET', label: 'Assets' },
  { value: 'LIABILITY', label: 'Liabilities' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expenses' },
]
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Chart of Accounts</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          General ledger account structure for this SACCO.
        </p>
      </div>
      <button
        @click="openCreateForm"
        :disabled="licenseState.readOnly"
        :title="licenseState.readOnly ? 'License expired — renew to add an account' : ''"
        class="inline-flex items-center gap-2 rounded-full border-0 bg-[#052659] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#052659]/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#052659]"
      >
        <Plus class="h-4 w-4" />
        Add Account
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-sm">
      <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Search by code or name..."
        class="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
      />
    </div>

    <!-- Type Filter -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="opt in typeFilters"
        :key="opt.value"
        type="button"
        @click="typeFilter = opt.value"
        class="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
        :class="typeFilter === opt.value
          ? 'bg-nfuko-primary text-white'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-6 w-6  text-nfuko-primary" />
    </div>

    <!-- Empty -->
    <div v-else-if="accounts.length === 0" class="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white py-16 shadow-sm">
      <p class="text-sm text-neutral-400">No chart of accounts found.</p>
    </div>

    <!-- Grouped Table -->
    <template v-else>
      <div
        v-for="[type, rows] in grouped"
        :key="type"
        v-show="rows.length > 0"
        class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <!-- Group Header -->
        <button
          type="button"
          @click="toggleGroup(type)"
          class="flex w-full items-center justify-between px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide" :class="typeColors[type]">
              {{ typeLabel[type] ?? type }}
            </span>
            <span class="text-xs text-neutral-400">{{ rows.length }} accounts</span>
          </div>
          <component :is="collapsedGroups.has(type) ? ChevronRight : ChevronDown" class="h-4 w-4 text-neutral-400" />
        </button>

        <!-- Rows -->
        <div v-show="!collapsedGroups.has(type)">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-neutral-50 dark:bg-neutral-800/40">
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">GL Code</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Account Name</th>
                <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Subtype</th>
                <th class="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Normal Balance</th>
                <th class="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Postable</th>
                <th class="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              <tr
                v-for="account in rows"
                :key="account.id"
                class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <!-- GL Code -->
                <td class="px-6 py-3 font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {{ account.gl_code }}
                </td>

                <!-- Name (indented by level) -->
                <td class="px-6 py-3">
                  <div class="flex items-center gap-1">
                    <span
                      class="inline-block shrink-0"
                      :style="{ width: `${(account.level - 1) * 16}px` }"
                    />
                    <span
                      class="text-neutral-900 dark:text-white"
                      :class="account.is_control ? 'font-semibold' : 'font-normal'"
                    >
                      {{ account.name }}
                    </span>
                    <span
                      v-if="account.is_control"
                      class="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-400 dark:bg-neutral-800"
                    >
                      Header
                    </span>
                  </div>
                </td>

                <!-- Subtype -->
                <td class="px-6 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                  {{ account.account_subtype ?? '—' }}
                </td>

                <!-- Normal Balance -->
                <td class="px-6 py-3 text-center">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    :class="account.normal_balance === 'DR' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'"
                  >
                    {{ account.normal_balance }}
                  </span>
                </td>

                <!-- Postable -->
                <td class="px-6 py-3 text-center">
                  <span
                    class="inline-block h-2 w-2 rounded-full"
                    :class="account.is_postable ? 'bg-green-500' : 'bg-neutral-300'"
                  />
                </td>

                <!-- Status -->
                <td class="px-6 py-3 text-center">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="account.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'"
                  >
                    {{ account.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Create Form -->
    <ChartOfAccountForm
      v-model:open="showForm"
      @saved="fetchAccounts()"
    />
  </div>
</template>
