<script setup lang="ts">
import { ref, computed } from 'vue'
import { Scale, X, AlertTriangle, CheckCircle } from 'lucide-vue-next'
import { Spinner, formatMoneyValue } from '@/Global'
import { trialBalanceApi } from '@/tenant/apis/reports/trialBalanceApi'

// ── State ─────────────────────────────────────────────────────────────────────
const mode        = ref<'as_of_date' | 'period'>('as_of_date')
const asOfDate    = ref(new Date().toISOString().split('T')[0])
const periodFrom  = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const periodTo    = ref(new Date().toISOString().split('T')[0])
const loading     = ref(false)
const result      = ref<any>(null)

// Drill-down drawer
const drawerOpen     = ref(false)
const drawerAccount  = ref<any>(null)
const drawerLines    = ref<any[]>([])
const drawerPage     = ref(1)
const drawerTotal    = ref(0)
const drawerLastPage = ref(1)
const drawerLoading  = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────────
const hideZero   = ref(true)
const allAccounts = computed(() => result.value?.accounts ?? [])
const totals      = computed(() => result.value?.totals ?? null)
const isBalanced  = computed(() => totals.value?.is_balanced === true)

const accounts = computed(() => {
  if (!hideZero.value) return allAccounts.value

  // Collect IDs of postable accounts that have any non-zero amount
  const activeIds = new Set(
    allAccounts.value
      .filter((a: any) => a.is_postable && (
        a.closing_debit || a.closing_credit ||
        a.opening_debit || a.opening_credit ||
        a.period_debit  || a.period_credit
      ))
      .map((a: any) => a.id)
  )

  // Keep header accounts only if they have at least one active child
  // Build a parent→children map from gl_code prefixes (level-based)
  // Simpler: keep a header if any postable account after it (before the next same-level header) is active
  const filtered: any[] = []
  let pendingHeader: any = null

  for (const account of allAccounts.value) {
    if (!account.is_postable) {
      pendingHeader = account
    } else {
      if (activeIds.has(account.id)) {
        if (pendingHeader) {
          filtered.push(pendingHeader)
          pendingHeader = null
        }
        filtered.push(account)
      }
    }
  }

  return filtered
})

const drFrom = computed(() => result.value?.from ?? result.value?.date ?? asOfDate.value)
const drTo   = computed(() => result.value?.to   ?? result.value?.date ?? asOfDate.value)

// ── Actions ───────────────────────────────────────────────────────────────────
async function generate() {
  loading.value = true
  result.value  = null
  try {
    if (mode.value === 'period') {
      result.value = await trialBalanceApi.getTrialBalance({ from: periodFrom.value, to: periodTo.value })
    } else {
      result.value = await trialBalanceApi.getTrialBalance({ date: asOfDate.value })
    }
  } finally {
    loading.value = false
  }
}

async function openDrillDown(account: any, side: 'debit' | 'credit') {
  if (!account.is_postable) return
  const amount = side === 'debit'
    ? (mode.value === 'period' ? account.period_debit : account.closing_debit)
    : (mode.value === 'period' ? account.period_credit : account.closing_credit)
  if (!amount) return

  drawerAccount.value = account
  drawerPage.value    = 1
  drawerLines.value   = []
  drawerOpen.value    = true
  await fetchDrillDown()
}

async function fetchDrillDown() {
  if (!drawerAccount.value) return
  drawerLoading.value = true
  try {
    const res = await trialBalanceApi.getLedgerLines({
      account_id: drawerAccount.value.id,
      from: drFrom.value,
      to:   drTo.value,
      page: drawerPage.value,
    })
    drawerLines.value    = drawerPage.value === 1 ? res.data : [...drawerLines.value, ...res.data]
    drawerTotal.value    = res.total
    drawerLastPage.value = res.last_page
  } finally {
    drawerLoading.value = false
  }
}

async function loadMore() {
  drawerPage.value++
  await fetchDrillDown()
}

function fmt(v: number) { return formatMoneyValue(v ?? 0) }
function fmtCell(v: number) { return v ? formatMoneyValue(v) : '—' }

function typeColor(type: string) {
  const map: Record<string, string> = {
    ASSET: 'text-blue-600', LIABILITY: 'text-orange-600',
    EQUITY: 'text-purple-600', INCOME: 'text-green-600', EXPENSE: 'text-red-600',
  }
  return map[type] ?? 'text-neutral-500'
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-nfuko-primary/10 flex items-center justify-center">
          <Scale class="w-5 h-5 text-nfuko-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Trial Balance</h1>
          <p class="text-sm text-neutral-500">Verify that total debits equal total credits across all accounts.</p>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-wrap items-end gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <!-- Mode toggle -->
      <div class="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg gap-1">
        <button
          v-for="m in [{ key: 'as_of_date', label: 'As of Date' }, { key: 'period', label: 'Period' }]"
          :key="m.key"
          @click="mode = m.key as any"
          :class="['px-4 py-1.5 text-xs font-bold rounded-md transition-all', mode === m.key ? 'bg-nfuko-primary text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600']"
        >{{ m.label }}</button>
      </div>

      <!-- As-of-date input -->
      <div v-if="mode === 'as_of_date'" class="flex flex-col gap-1">
        <label class="text-xs text-neutral-400">As at</label>
        <input v-model="asOfDate" type="date"
          class="rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
      </div>

      <!-- Period inputs -->
      <template v-else>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-neutral-400">From</label>
          <input v-model="periodFrom" type="date"
            class="rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-neutral-400">To</label>
          <input v-model="periodTo" type="date"
            class="rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
        </div>
      </template>

      <button @click="generate"
        class="rounded-full bg-nfuko-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-nfuko-primary/90 shadow-sm">
        Generate
      </button>

      <!-- Hide zero-balance toggle -->
      <label class="ml-auto flex items-center gap-2 cursor-pointer select-none">
        <div @click="hideZero = !hideZero"
          :class="['relative w-9 h-5 rounded-full transition-colors', hideZero ? 'bg-nfuko-primary' : 'bg-neutral-300 dark:bg-neutral-600']">
          <span :class="['absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', hideZero ? 'translate-x-4' : '']" />
        </div>
        <span class="text-xs text-neutral-500 font-medium">Hide zero balances</span>
      </label>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Spinner class="h-8 w-8 text-nfuko-primary" />
    </div>

    <template v-if="result && !loading">
      <!-- Balance indicator -->
      <div :class="['flex items-center gap-3 rounded-2xl border p-4',
        isBalanced
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
          : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800']">
        <CheckCircle v-if="isBalanced" class="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <AlertTriangle v-else class="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <p v-if="isBalanced" class="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Books are balanced — Total DR {{ fmt(totals.total_closing_debit) }} = Total CR {{ fmt(totals.total_closing_credit) }}
          </p>
          <p v-else class="text-sm font-bold text-rose-800 dark:text-rose-300">
            Out of balance by {{ fmt(Math.abs(totals.total_closing_debit - totals.total_closing_credit)) }} — investigate unposted transactions
          </p>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
        <table class="w-full text-sm">
          <thead class="bg-neutral-50 dark:bg-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-500">
            <tr>
              <th class="px-4 py-3 text-left w-24">GL Code</th>
              <th class="px-4 py-3 text-left">Account Name</th>
              <th class="px-4 py-3 text-left w-24">Type</th>
              <template v-if="mode === 'period'">
                <th class="px-4 py-3 text-right">Opening DR</th>
                <th class="px-4 py-3 text-right">Opening CR</th>
                <th class="px-4 py-3 text-right">Period DR</th>
                <th class="px-4 py-3 text-right">Period CR</th>
              </template>
              <th class="px-4 py-3 text-right">Closing DR</th>
              <th class="px-4 py-3 text-right">Closing CR</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <template v-for="account in accounts" :key="account.id">
              <!-- Header accounts — section dividers -->
              <tr v-if="!account.is_postable" class="bg-neutral-50 dark:bg-neutral-800/60">
                <td class="px-4 py-2 font-black text-xs text-neutral-500">{{ account.gl_code }}</td>
                <td :colspan="mode === 'period' ? 7 : 3" class="px-4 py-2 font-black text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  {{ account.name }}
                </td>
              </tr>
              <!-- Postable accounts -->
              <tr v-else class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                <td class="px-4 py-2.5 font-mono text-xs text-neutral-400">{{ account.gl_code }}</td>
                <td class="px-4 py-2.5 text-neutral-800 dark:text-neutral-200">
                  <span :class="typeColor(account.account_type)">{{ account.name }}</span>
                </td>
                <td class="px-4 py-2.5">
                  <span class="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{{ account.account_subtype }}</span>
                </td>
                <template v-if="mode === 'period'">
                  <td class="px-4 py-2.5 text-right text-neutral-500 text-xs">{{ fmtCell(account.opening_debit) }}</td>
                  <td class="px-4 py-2.5 text-right text-neutral-500 text-xs">{{ fmtCell(account.opening_credit) }}</td>
                  <td @click="openDrillDown(account, 'debit')"
                    :class="['px-4 py-2.5 text-right text-xs', account.period_debit ? 'cursor-pointer font-bold text-blue-600 hover:text-blue-800 hover:underline' : 'text-neutral-400']">
                    {{ fmtCell(account.period_debit) }}
                  </td>
                  <td @click="openDrillDown(account, 'credit')"
                    :class="['px-4 py-2.5 text-right text-xs', account.period_credit ? 'cursor-pointer font-bold text-orange-600 hover:text-orange-800 hover:underline' : 'text-neutral-400']">
                    {{ fmtCell(account.period_credit) }}
                  </td>
                </template>
                <td @click="openDrillDown(account, 'debit')"
                  :class="['px-4 py-2.5 text-right font-semibold', account.closing_debit ? 'cursor-pointer text-blue-700 hover:text-blue-900 hover:underline' : 'text-neutral-300']">
                  {{ fmtCell(account.closing_debit) }}
                </td>
                <td @click="openDrillDown(account, 'credit')"
                  :class="['px-4 py-2.5 text-right font-semibold', account.closing_credit ? 'cursor-pointer text-orange-700 hover:text-orange-900 hover:underline' : 'text-neutral-300']">
                  {{ fmtCell(account.closing_credit) }}
                </td>
              </tr>
            </template>

            <!-- Totals row -->
            <tr v-if="totals" class="bg-nfuko-primary/5 font-black text-sm border-t-2 border-nfuko-primary/20">
              <td class="px-4 py-3" colspan="3">TOTAL</td>
              <template v-if="mode === 'period'">
                <td class="px-4 py-3 text-right">{{ fmt(totals.total_opening_debit) }}</td>
                <td class="px-4 py-3 text-right">{{ fmt(totals.total_opening_credit) }}</td>
                <td class="px-4 py-3 text-right">{{ fmt(totals.total_period_debit) }}</td>
                <td class="px-4 py-3 text-right">{{ fmt(totals.total_period_credit) }}</td>
              </template>
              <td class="px-4 py-3 text-right text-blue-700">{{ fmt(totals.total_closing_debit) }}</td>
              <td class="px-4 py-3 text-right text-orange-700">{{ fmt(totals.total_closing_credit) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Drill-down drawer -->
    <Teleport to="body">
      <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end" @click.self="drawerOpen = false">
        <div class="h-full w-full max-w-xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col">
          <!-- Drawer header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <p class="text-xs font-mono text-neutral-400">{{ drawerAccount?.gl_code }}</p>
              <p class="font-bold text-neutral-900 dark:text-white">{{ drawerAccount?.name }}</p>
              <p class="text-xs text-neutral-400 mt-0.5">{{ drFrom }} → {{ drTo }}</p>
            </div>
            <button @click="drawerOpen = false" class="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <X class="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          <!-- Drawer body -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="drawerLoading && drawerPage === 1" class="flex items-center justify-center py-12">
              <Spinner class="h-6 w-6 text-nfuko-primary" />
            </div>
            <table v-else class="w-full text-xs">
              <thead class="sticky top-0 bg-neutral-50 dark:bg-neutral-800 font-bold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th class="px-4 py-3 text-left">Date</th>
                  <th class="px-4 py-3 text-left">Reference</th>
                  <th class="px-4 py-3 text-right">Debit</th>
                  <th class="px-4 py-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr v-for="(line, i) in drawerLines" :key="i"
                  class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                  <td class="px-4 py-2.5 text-neutral-500">{{ line.date }}</td>
                  <td class="px-4 py-2.5">
                    <div class="font-mono text-neutral-700 dark:text-neutral-300">{{ line.entry_no }}</div>
                    <div class="text-neutral-400 truncate max-w-[180px]">{{ line.description }}</div>
                  </td>
                  <td class="px-4 py-2.5 text-right text-blue-600 font-semibold">{{ line.debit ? fmt(line.debit) : '—' }}</td>
                  <td class="px-4 py-2.5 text-right text-orange-600 font-semibold">{{ line.credit ? fmt(line.credit) : '—' }}</td>
                </tr>
                <tr v-if="!drawerLines.length && !drawerLoading">
                  <td colspan="4" class="px-4 py-12 text-center text-neutral-400">No transactions in this period.</td>
                </tr>
              </tbody>
            </table>

            <!-- Load more -->
            <div v-if="drawerPage < drawerLastPage" class="p-4 text-center">
              <button @click="loadMore" :disabled="drawerLoading"
                class="text-xs font-bold text-nfuko-primary hover:underline disabled:opacity-50">
                {{ drawerLoading ? 'Loading...' : `Load more — page ${drawerPage + 1} of ${drawerLastPage}` }}
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
            {{ drawerTotal }} transaction{{ drawerTotal !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
