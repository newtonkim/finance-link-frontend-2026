<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Printer, CalendarDays, Wallet, Plus, Minus, Equal, ArrowDownLeft, ArrowUpRight } from 'lucide-vue-next';
import { formatCurrency, formatDateUs, printElementId } from '@/Global';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import { saccoBrandingApi, saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi';
import { useAccountStatement } from './composables/useAccountStatement';

const props = defineProps<{
  data?: { savings_accounts?: Array<{ id: number; account_no: string | null; code?: string | null; account_type: string }> };
}>();

const accounts = computed(() => props.data?.savings_accounts ?? []);
const accountId = ref<number | null>(accounts.value[0]?.id ?? null);

const accountOptions = computed(() =>
  accounts.value.map((a) => ({
    id: a.id,
    name: `${a.account_no ?? a.code ?? `Account #${a.id}`} · ${a.account_type}`,
  })),
);

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

onMounted(() => {
  if (!saccoBrandingState.loaded) {
    saccoBrandingApi.get().catch(() => { /* letterhead falls back to a monogram */ });
  }
});

const saccoName = computed(() => saccoBrandingState.sacco_name || 'Savings & Credit Cooperative');
const saccoInitials = computed(() =>
  saccoName.value.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'SA',
);
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
          <SearchableSelect v-model="accountId" :options="accountOptions" placeholder="Search account number…" />
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

    <!-- ───────────── Statement document ───────────── -->
    <div id="statement-print-area" class="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <!-- Letterhead: the issuing SACCO -->
      <header class="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#182538] px-6 py-6 sm:px-8">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#182538] ring-2 ring-[#cda434]/40">
            <img v-if="saccoBrandingState.logo_url" :src="saccoBrandingState.logo_url" :alt="saccoName" class="h-full w-full object-contain p-1.5" />
            <span v-else class="text-lg font-black text-[#cda434]">{{ saccoInitials }}</span>
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-lg font-black tracking-tight text-[#182538] sm:text-xl">{{ saccoName }}</h1>
            <p v-if="saccoBrandingState.tagline" class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {{ saccoBrandingState.tagline }}
            </p>
            <p v-else class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Savings &amp; credit cooperative</p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[11px] font-black uppercase tracking-[0.24em] text-[#cda434]">Statement of Account</div>
          <div class="mt-1 text-sm font-bold text-[#182538]">{{ formatDateUs(statement?.period.statement_date) }}</div>
          <div class="mt-0.5 text-[11px] font-medium text-slate-400">
            {{ formatDateUs(statement?.period.date_from) }} – {{ formatDateUs(statement?.period.date_to) }}
          </div>
        </div>
      </header>

      <!-- Account holder · Account details -->
      <section class="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2">
        <div class="bg-white px-6 py-5 sm:px-8">
          <div class="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Account holder</div>
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#182538]/5 text-sm font-black text-[#182538] ring-1 ring-[#182538]/10">
              {{ memberInitials }}
            </div>
            <div class="min-w-0">
              <div class="truncate text-base font-bold text-slate-900">{{ statement?.member.name ?? '—' }}</div>
              <div class="font-mono text-xs font-semibold text-slate-500">{{ statement?.member.member_number ?? '—' }}</div>
              <div class="mt-1 text-xs font-medium text-slate-500">
                {{ statement?.member.address || 'Address not on file' }}<span v-if="statement?.member.address_city">, {{ statement.member.address_city }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white px-6 py-5 sm:px-8">
          <div class="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Account details</div>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt class="text-slate-500">Account no.</dt>
            <dd class="text-right font-mono font-bold text-slate-900">{{ statement?.account.account_no ?? '—' }}</dd>
            <dt class="text-slate-500">Product</dt>
            <dd class="truncate text-right font-semibold capitalize text-slate-900">{{ statement?.account.product_name ?? statement?.account.account_type ?? '—' }}</dd>
            <dt class="text-slate-500">Type</dt>
            <dd class="text-right font-semibold capitalize text-slate-900">{{ statement?.account.account_type ?? '—' }}</dd>
            <dt class="text-slate-500">Branch</dt>
            <dd class="text-right font-semibold text-slate-900">{{ statement?.branch.name ?? 'Head Office' }}</dd>
          </dl>
        </div>
      </section>

      <div class="px-6 py-6 sm:px-8">
        <!-- Signature: balance-flow ribbon -->
        <div class="flex flex-col items-stretch gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:flex-row sm:items-center">
          <div class="flex-1 rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200">
            <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Opening</div>
            <div class="mt-0.5 font-mono text-base font-bold text-slate-900">{{ formatCurrency(statement?.balances.opening ?? 0) }}</div>
          </div>
          <div class="flex shrink-0 items-center justify-center self-center rounded-full bg-emerald-100 p-1 text-emerald-700 sm:mx-0.5">
            <Plus :size="14" stroke-width="3" />
          </div>
          <div class="flex-1 rounded-lg bg-white px-4 py-3 ring-1 ring-emerald-200">
            <div class="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700"><ArrowDownLeft :size="12" /> Credits</div>
            <div class="mt-0.5 font-mono text-base font-bold text-emerald-800">{{ formatCurrency(statement?.balances.total_credit ?? 0) }}</div>
          </div>
          <div class="flex shrink-0 items-center justify-center self-center rounded-full bg-rose-100 p-1 text-rose-700 sm:mx-0.5">
            <Minus :size="14" stroke-width="3" />
          </div>
          <div class="flex-1 rounded-lg bg-white px-4 py-3 ring-1 ring-rose-200">
            <div class="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700"><ArrowUpRight :size="12" /> Debits</div>
            <div class="mt-0.5 font-mono text-base font-bold text-rose-800">{{ formatCurrency(statement?.balances.total_debit ?? 0) }}</div>
          </div>
          <div class="flex shrink-0 items-center justify-center self-center rounded-full bg-[#cda434]/20 p-1 text-[#cda434] sm:mx-0.5">
            <Equal :size="14" stroke-width="3" />
          </div>
          <div class="relative flex-1 overflow-hidden rounded-lg bg-[#182538] px-4 py-3">
            <div class="absolute inset-y-0 left-0 w-1 bg-[#cda434]"></div>
            <div class="text-[10px] font-black uppercase tracking-wider text-[#cda434]">Closing</div>
            <div class="mt-0.5 font-mono text-base font-black text-white">{{ formatCurrency(statement?.balances.closing ?? 0) }}</div>
          </div>
        </div>

        <!-- Transactions ledger -->
        <div class="mt-6 overflow-x-auto">
          <table class="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr class="border-y-2 border-[#182538] text-[11px] font-black uppercase tracking-wider text-slate-500">
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
                <!-- opening balance row -->
                <tr class="bg-slate-50/70">
                  <td class="whitespace-nowrap px-3 py-2.5 font-medium text-slate-400">{{ formatDateUs(statement.period.date_from) }}</td>
                  <td class="px-3 py-2.5 font-semibold text-slate-600">Balance brought forward</td>
                  <td class="px-3 py-2.5 text-right text-slate-300">—</td>
                  <td class="px-3 py-2.5 text-right text-slate-300">—</td>
                  <td class="px-3 py-2.5 text-right font-mono font-bold text-slate-700">{{ formatCurrency(statement.balances.opening) }}</td>
                </tr>
                <tr v-for="t in statement.transactions" :key="t.id" class="odd:bg-white even:bg-slate-50/40 transition hover:bg-[#cda434]/5">
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
                <td colspan="5" class="px-3 py-14 text-center">
                  <p class="text-sm font-bold text-slate-700">No transactions in this period</p>
                  <p class="mt-1 text-xs font-medium text-slate-500">Widen the date range above to see more history.</p>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="statement && statement.transactions.length > 0">
              <tr class="border-t-2 border-[#182538] bg-slate-50">
                <td colspan="2" class="px-3 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Closing balance
                  <span class="ml-1 font-mono text-slate-400">· {{ statement.balances.count }} entr{{ statement.balances.count === 1 ? 'y' : 'ies' }}</span>
                </td>
                <td class="px-3 py-3 text-right font-mono text-xs font-semibold text-emerald-700">{{ formatCurrency(statement.balances.total_credit) }}</td>
                <td class="px-3 py-3 text-right font-mono text-xs font-semibold text-rose-700">{{ formatCurrency(statement.balances.total_debit) }}</td>
                <td class="px-3 py-3 text-right font-mono text-sm font-black text-slate-900">{{ formatCurrency(statement.balances.closing) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="statement && statement.transactions.length > 0" class="mt-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-slate-200"></div>
          <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">End of statement</p>
          <div class="h-px flex-1 bg-slate-200"></div>
        </div>
        <p class="mt-3 text-center text-[10px] font-medium text-slate-400">
          This is a computer-generated statement and does not require a signature.
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
