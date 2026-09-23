<script setup lang="ts">
import { ref } from 'vue'
import { Landmark, Download, AlertTriangle, ChevronsDownUp, ChevronsUpDown, RotateCw } from 'lucide-vue-next'
import { saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi'
import type { BalanceSheetLine } from '@/tenant/apis/reports/balanceSheetApi'
import { useBalanceSheet } from '../composables/useBalanceSheet'
import { useBalanceSheetExport } from '../composables/useBalanceSheetExport'
import { formatAccounting, formatLongDate, formatShortDate } from '../utils/accountingFormat'
import BalanceSheetRow from '../components/BalanceSheetRow.vue'
import BalanceSheetKpis from '../components/BalanceSheetKpis.vue'
import LedgerDrillDownDrawer, { type DrillAccount } from '../components/LedgerDrillDownDrawer.vue'

const {
  asAt, compareTo, hideZero, loading, error, result,
  rows, totals, isBalanced, kpis, drillRange,
  generate, toggle, expandAll, collapseAll,
} = useBalanceSheet()

const { exporting, exportCsv, exportExcel, exportPdf } = useBalanceSheetExport(result, rows)

const drawerOpen    = ref(false)
const drawerAccount = ref<DrillAccount | null>(null)

function openDrill(line: BalanceSheetLine) {
  if (line.id === null) return
  drawerAccount.value = { id: line.id, gl_code: line.gl_code, name: line.name }
  drawerOpen.value    = true
}

const inputClass = 'rounded-lg border border-neutral-200 bg-white py-2 px-3 text-sm outline-none focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/15 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
const ghostBtn   = 'flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
</script>

<template>
  <div class="flex flex-col gap-6 p-4 sm:p-6">

    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-nfuko-primary/10">
          <Landmark class="h-5 w-5 text-nfuko-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Balance Sheet</h1>
          <p class="text-sm text-neutral-500">Statement of Financial Position · All branches consolidated.</p>
        </div>
      </div>

      <div v-if="result" class="flex items-center gap-2">
        <button type="button" :class="ghostBtn" :disabled="exporting" @click="exportCsv"><Download class="h-3.5 w-3.5" />CSV</button>
        <button type="button" :class="ghostBtn" :disabled="exporting" @click="exportExcel"><Download class="h-3.5 w-3.5" />Excel</button>
        <button type="button" :disabled="exporting" @click="exportPdf"
          class="flex items-center gap-1.5 rounded-lg bg-nfuko-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-nfuko-primary/90 disabled:opacity-50">
          <Download class="h-3.5 w-3.5" />PDF
        </button>
      </div>
    </div>

    <!-- Controls -->
    <form class="flex flex-wrap items-end gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      @submit.prevent="generate">
      <label class="flex flex-col gap-1">
        <span class="text-xs text-neutral-400">As at</span>
        <input v-model="asAt" type="date" required :class="inputClass" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs text-neutral-400">Compare to</span>
        <input v-model="compareTo" type="date" :max="asAt" :class="inputClass" />
      </label>
      <button type="submit" :disabled="loading"
        class="rounded-full bg-nfuko-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-nfuko-primary/90 disabled:opacity-60">
        Generate
      </button>

      <div class="ml-auto flex flex-wrap items-center gap-4">
        <div v-if="result" class="flex items-center gap-1">
          <button type="button" :class="ghostBtn" @click="expandAll"><ChevronsUpDown class="h-3.5 w-3.5" />Expand all</button>
          <button type="button" :class="ghostBtn" @click="collapseAll"><ChevronsDownUp class="h-3.5 w-3.5" />Collapse all</button>
        </div>
        <label class="flex cursor-pointer select-none items-center gap-2">
          <button type="button" role="switch" aria-label="Hide zero balances" :disabled="loading" :aria-checked="hideZero" @click="hideZero = !hideZero; generate()"
            :class="['relative h-5 w-9 rounded-full transition-colors', hideZero ? 'bg-nfuko-primary' : 'bg-neutral-300 dark:bg-neutral-600']">
            <span :class="['absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', hideZero ? 'translate-x-4' : '']" />
          </button>
          <span class="text-xs font-medium text-neutral-500">Hide zero balances</span>
        </label>
      </div>
    </form>

    <!-- Error -->
    <div v-if="error && !loading"
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20">
      <p class="flex items-center gap-2 text-sm font-semibold text-rose-800 dark:text-rose-300">
        <AlertTriangle class="h-4 w-4" />{{ error }}
      </p>
      <button type="button" :class="ghostBtn" @click="generate"><RotateCw class="h-3.5 w-3.5" />Retry</button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900" aria-busy="true">
      <div class="mx-auto mb-8 h-4 w-64 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      <div v-for="i in 10" :key="i" class="flex items-center justify-between py-2.5">
        <div class="h-3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" :style="{ width: `${30 + (i * 7) % 35}%`, marginLeft: `${(i % 3) * 1.25}rem` }" />
        <div class="h-3 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>

    <template v-if="result && totals && !loading">
      <BalanceSheetKpis :kpis="kpis" :is-balanced="isBalanced" :difference="totals.current.difference" :compare-to="result.compare_to" />

      <!-- Out-of-balance banner -->
      <div v-if="!isBalanced"
        class="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20">
        <AlertTriangle class="h-5 w-5 flex-shrink-0 text-rose-600" />
        <p class="text-sm font-semibold text-rose-800 dark:text-rose-300">
          Assets differ from Liabilities + Equity by {{ formatAccounting(Math.abs(totals.current.difference)) }}.
        </p>
        <RouterLink to="/tenant/reports/trial-balance" class="text-sm font-bold text-rose-700 underline underline-offset-4 dark:text-rose-300">
          Check the Trial Balance
        </RouterLink>
      </div>

      <!-- Statement -->
      <section class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header class="border-b border-neutral-100 px-6 py-6 text-center dark:border-neutral-800">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">{{ saccoBrandingState.sacco_name || 'SACCO' }}</p>
          <h2 class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">Statement of Financial Position</h2>
          <p class="text-sm text-neutral-500">As at {{ formatLongDate(result.as_at) }}</p>
        </header>

        <div class="overflow-x-auto px-2 pb-4">
          <table class="w-full min-w-[640px] border-collapse">
            <thead>
              <tr class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <th class="px-4 pt-4 pb-2 text-left font-bold">Account</th>
                <th class="px-4 pt-4 pb-2 text-right font-bold text-neutral-700 dark:text-neutral-200">{{ formatShortDate(result.as_at) }}</th>
                <th class="px-4 pt-4 pb-2 text-right font-bold">{{ formatShortDate(result.compare_to) }}</th>
                <th class="px-4 pt-4 pb-2 text-right font-bold">Change</th>
              </tr>
            </thead>
            <tbody>
              <BalanceSheetRow v-for="row in rows" :key="row.key" :row="row" @toggle="toggle" @drill="openDrill" />
            </tbody>
          </table>
        </div>

        <footer class="flex flex-wrap justify-between gap-2 border-t border-neutral-100 px-6 py-3 text-xs text-neutral-400 dark:border-neutral-800">
          <span>Amounts in brackets are negative (contra accounts). Click an account amount to see its ledger.</span>
          <span>Generated {{ new Date(result.generated_at).toLocaleString() }}</span>
        </footer>
      </section>
    </template>

    <LedgerDrillDownDrawer
      v-if="drillRange"
      v-model:open="drawerOpen"
      :account="drawerAccount"
      :from="drillRange.from"
      :to="drillRange.to"
    />
  </div>
</template>
