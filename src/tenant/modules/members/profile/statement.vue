<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Printer, CalendarDays, Wallet } from 'lucide-vue-next';
import { formatCurrency, formatDateUs, printElementId } from '@/Global';
import { useAccountStatement } from './composables/useAccountStatement';

const props = defineProps<{
  data?: { savings_accounts?: Array<{ id: number; account_no: string | null; account_type: string }> };
}>();

const accounts = computed(() => props.data?.savings_accounts ?? []);
const accountId = ref<number | null>(accounts.value[0]?.id ?? null);

watch(accounts, (list) => {
  if (accountId.value === null && list.length > 0) accountId.value = list[0].id;
});

// Default to a wide window so a fresh statement shows the account's full history
// out of the box. The user can narrow via the date pickers.
const DAY_MS = 86_400_000;
const today = new Date().toISOString().slice(0, 10);
const fiveYearsAgo = new Date(Date.now() - 5 * 365 * DAY_MS).toISOString().slice(0, 10);
const dateFrom = ref(fiveYearsAgo);
const dateTo   = ref(today);

const { statement, loading, error, refresh } = useAccountStatement(accountId, dateFrom, dateTo);

const memberInitials = computed(() => {
  const name = statement.value?.member.name ?? '';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '—';
});

function onPrint() { printElementId('statement-print-area'); }
</script>

<template>
  <div class="statement">
    <!-- Toolbar (hidden on print) -->
    <div class="no-print mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="grid w-full grid-cols-1 gap-3 sm:max-w-2xl sm:grid-cols-3">
        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <Wallet :size="13" /> Account
          </span>
          <select v-model="accountId"
                  class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20">
            <option v-for="a in accounts" :key="a.id" :value="a.id">
              {{ a.account_no ?? `Account #${a.id}` }} ({{ a.account_type }})
            </option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <CalendarDays :size="13" /> From
          </span>
          <input type="date" v-model="dateFrom"
                 class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20" />
        </label>
        <label class="block">
          <span class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <CalendarDays :size="13" /> To
          </span>
          <input type="date" v-model="dateTo"
                 class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20" />
        </label>
      </div>
      <button @click="onPrint" :disabled="!statement"
              class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#182538] px-5 text-sm font-bold text-white transition hover:bg-[#22344f] disabled:cursor-not-allowed disabled:opacity-40">
        <Printer :size="15" /> Print statement
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="no-print mb-4 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      <span>{{ error }}</span>
      <button @click="refresh" class="ml-auto rounded-md bg-rose-600 px-3 py-1 text-xs font-bold text-white">Try again</button>
    </div>

    <!-- Statement document -->
    <div id="statement-print-area" class="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <!-- Masthead -->
      <div class="relative bg-[#182538] px-6 py-6 sm:px-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#cda434] text-sm font-black text-[#cda434]">
              {{ memberInitials }}
            </div>
            <div>
              <div class="text-[11px] font-bold uppercase tracking-[0.2em] text-[#cda434]">Account Statement</div>
              <h2 class="mt-0.5 text-xl font-black tracking-tight text-white">{{ statement?.member.name ?? '—' }}</h2>
              <p class="text-sm font-medium text-slate-300">
                {{ statement?.member.address || 'Address not on file' }}
                <span v-if="statement?.member.address_city"> · {{ statement.member.address_city }}</span>
              </p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Statement date</div>
            <div class="text-sm font-bold text-white">{{ formatDateUs(statement?.period.statement_date) }}</div>
            <div class="mt-1 text-[11px] font-medium text-slate-400">Page 1 of 1</div>
          </div>
        </div>
      </div>
      <div class="h-1 w-24 bg-[#cda434]"></div>

      <div class="px-6 py-6 sm:px-8">
        <!-- Balance flow summary -->
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Opening balance</div>
            <div class="mt-1 font-mono text-base font-bold text-slate-900">{{ formatCurrency(statement?.balances.opening ?? 0) }}</div>
          </div>
          <div class="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total credit</div>
            <div class="mt-1 font-mono text-base font-bold text-emerald-800">+ {{ formatCurrency(statement?.balances.total_credit ?? 0) }}</div>
          </div>
          <div class="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total debit</div>
            <div class="mt-1 font-mono text-base font-bold text-rose-800">− {{ formatCurrency(statement?.balances.total_debit ?? 0) }}</div>
          </div>
          <div class="relative overflow-hidden rounded-lg bg-[#182538] px-4 py-3">
            <div class="absolute inset-y-0 left-0 w-1 bg-[#cda434]"></div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-[#cda434]">Closing balance</div>
            <div class="mt-1 font-mono text-base font-black text-white">{{ formatCurrency(statement?.balances.closing ?? 0) }}</div>
          </div>
        </div>

        <!-- Account meta -->
        <div class="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-3">
          <div class="flex justify-between sm:block">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Account number</span>
            <span class="font-mono font-semibold text-slate-900 sm:mt-0.5 sm:block">{{ statement?.account.account_no ?? '—' }}</span>
          </div>
          <div class="flex justify-between sm:block">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Account type</span>
            <span class="font-semibold capitalize text-slate-900 sm:mt-0.5 sm:block">{{ statement?.account.account_type ?? '—' }}</span>
          </div>
          <div class="flex justify-between sm:block">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Branch</span>
            <span class="font-semibold text-slate-900 sm:mt-0.5 sm:block">{{ statement?.branch.name ?? 'Head Office' }}</span>
          </div>
          <div class="flex justify-between sm:block">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Period covered</span>
            <span class="font-semibold text-slate-900 sm:mt-0.5 sm:block">
              {{ formatDateUs(statement?.period.date_from) }} – {{ formatDateUs(statement?.period.date_to) }}
            </span>
          </div>
          <div class="flex justify-between sm:block">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Transactions</span>
            <span class="font-mono font-semibold text-slate-900 sm:mt-0.5 sm:block">{{ statement?.balances.count ?? 0 }}</span>
          </div>
        </div>

        <!-- Transactions -->
        <div class="mt-6 overflow-x-auto">
          <table class="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr class="border-y border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th class="px-3 py-2.5 text-left">Date</th>
                <th class="px-3 py-2.5 text-left">Description</th>
                <th class="px-3 py-2.5 text-right">Credit</th>
                <th class="px-3 py-2.5 text-right">Debit</th>
                <th class="px-3 py-2.5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <template v-if="loading">
                <tr v-for="i in 5" :key="i">
                  <td colspan="5" class="px-3 py-3"><div class="h-3 animate-pulse rounded bg-slate-100"></div></td>
                </tr>
              </template>
              <template v-else-if="statement && statement.transactions.length > 0">
                <tr v-for="t in statement.transactions" :key="t.id" class="transition hover:bg-slate-50/70">
                  <td class="whitespace-nowrap px-3 py-2.5 font-medium text-slate-500">{{ formatDateUs(t.date) }}</td>
                  <td class="px-3 py-2.5">
                    <span class="font-medium text-slate-800">{{ t.description }}</span>
                    <span v-if="t.is_reversal" class="ml-2 inline-flex rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-600/20">Reversal</span>
                  </td>
                  <td class="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">{{ t.credit ? formatCurrency(t.credit) : '—' }}</td>
                  <td class="px-3 py-2.5 text-right font-mono font-semibold text-rose-700">{{ t.debit ? formatCurrency(t.debit) : '—' }}</td>
                  <td class="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{{ formatCurrency(t.running_balance) }}</td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="5" class="px-3 py-12 text-center">
                  <p class="text-sm font-bold text-slate-700">No transactions in this period</p>
                  <p class="mt-1 text-xs font-medium text-slate-500">Widen the date range above to see more history.</p>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="statement && statement.transactions.length > 0">
              <tr class="border-t-2 border-slate-200 bg-slate-50">
                <td colspan="2" class="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Closing balance</td>
                <td class="px-3 py-3 text-right font-mono text-xs font-semibold text-emerald-700">{{ formatCurrency(statement.balances.total_credit) }}</td>
                <td class="px-3 py-3 text-right font-mono text-xs font-semibold text-rose-700">{{ formatCurrency(statement.balances.total_debit) }}</td>
                <td class="px-3 py-3 text-right font-mono text-sm font-black text-slate-900">{{ formatCurrency(statement.balances.closing) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p v-if="statement && statement.transactions.length > 0" class="mt-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          End of statement
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .no-print { display: none !important; }
  #statement-print-area { border: none; box-shadow: none; border-radius: 0; }
  table, tr, td, th { break-inside: avoid; }
  * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
</style>
