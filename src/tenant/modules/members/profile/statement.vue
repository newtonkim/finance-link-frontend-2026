<script setup lang="ts">
import { ref, computed } from 'vue';
import { Printer } from 'lucide-vue-next';
import { formatCurrency, printElementId } from '@/Global';
import { useAccountStatement } from './composables/useAccountStatement';

const props = defineProps<{
  data?: { savings_accounts?: Array<{ id: number; account_no: string | null; account_type: string }> };
  profileDetails?: any;
}>();

const accounts = computed(() => props.data?.savings_accounts ?? []);
const accountId = ref<number | null>(accounts.value[0]?.id ?? null);

const today = new Date().toISOString().slice(0, 10);
const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
const dateFrom = ref(ninetyDaysAgo);
const dateTo   = ref(today);

const { statement, loading, error, refresh } = useAccountStatement(accountId, dateFrom, dateTo);

function onPrint() { printElementId('statement-print-area'); }

function fmtDate(d?: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
}
</script>

<template>
  <div>
    <!-- Controls (hidden on print) -->
    <div class="no-print flex items-end gap-3 my-4">
      <label class="text-xs font-bold uppercase tracking-wider">
        Account
        <select v-model="accountId" class="block mt-1 border rounded px-3 py-2 text-sm">
          <option v-for="a in accounts" :key="a.id" :value="a.id">
            {{ a.account_no ?? `Account #${a.id}` }} ({{ a.account_type }})
          </option>
        </select>
      </label>
      <label class="text-xs font-bold uppercase tracking-wider">
        From
        <input type="date" v-model="dateFrom" class="block mt-1 border rounded px-3 py-2 text-sm" />
      </label>
      <label class="text-xs font-bold uppercase tracking-wider">
        To
        <input type="date" v-model="dateTo" class="block mt-1 border rounded px-3 py-2 text-sm" />
      </label>
      <button @click="onPrint" :disabled="!statement"
              class="ml-auto inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-40">
        <Printer :size="14" /> Print
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="no-print mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
      {{ error }}
      <button @click="refresh" class="ml-3 underline font-semibold">Retry</button>
    </div>

    <!-- Statement print area -->
    <div id="statement-print-area" class="relative bg-white p-8 border border-gray-200 text-gray-900">
      <!-- Page indicator -->
      <div class="absolute right-8 top-6 text-sm">Page 1 of 1</div>

      <!-- Header grid -->
      <div class="grid grid-cols-2 gap-12 mb-8">
        <!-- Left -->
        <div class="space-y-1 text-sm">
          <div class="grid grid-cols-[140px_1fr] gap-2">
            <div class="text-gray-700">Account Number:</div>
            <div>{{ statement?.account.account_no ?? '—' }}</div>
            <div class="text-gray-700">Statement Date:</div>
            <div>{{ fmtDate(statement?.period.statement_date) }}</div>
            <div class="text-gray-700">Period Covered:</div>
            <div>{{ fmtDate(statement?.period.date_from) }} to {{ fmtDate(statement?.period.date_to) }}</div>
          </div>
          <div class="pt-2 text-base font-semibold">{{ statement?.member.name }}</div>
          <div>{{ statement?.member.address }}</div>
          <div v-if="statement?.member.address_city">{{ statement.member.address_city }}</div>
        </div>
        <!-- Right -->
        <div class="text-sm">
          <div class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono">
            <div class="text-gray-700 font-sans">Opening Balance:</div>
            <div class="text-right">{{ formatCurrency(statement?.balances.opening ?? 0) }}</div>
            <div class="text-gray-700 font-sans">Total Credit Amount:</div>
            <div class="text-right">{{ formatCurrency(statement?.balances.total_credit ?? 0) }}</div>
            <div class="text-gray-700 font-sans">Total Debit Amount:</div>
            <div class="text-right">{{ formatCurrency(statement?.balances.total_debit ?? 0) }}</div>
            <div class="text-gray-700 font-sans">Closing Balance:</div>
            <div class="text-right font-semibold">{{ formatCurrency(statement?.balances.closing ?? 0) }}</div>
            <div class="text-gray-700 font-sans">Account Type:</div>
            <div class="text-right">{{ statement?.account.account_type ?? '—' }}</div>
            <div class="text-gray-700 font-sans">Number of Transactions:</div>
            <div class="text-right">{{ statement?.balances.count ?? 0 }}</div>
          </div>
        </div>
      </div>

      <div class="text-sm mb-4">&lt;{{ statement?.branch.name ?? 'Main branch' }}&gt;</div>

      <!-- Transactions table -->
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-y border-gray-200 text-xs uppercase tracking-wide text-gray-600">
          <tr>
            <th class="px-3 py-2 text-left w-32">Date</th>
            <th class="px-3 py-2 text-left">Description</th>
            <th class="px-3 py-2 text-right w-32">Credit</th>
            <th class="px-3 py-2 text-right w-32">Debit</th>
            <th class="px-3 py-2 text-right w-32">Balance</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in 5" :key="i" class="border-b border-gray-100">
              <td colspan="5" class="px-3 py-3"><div class="h-3 bg-gray-100 rounded animate-pulse" /></td>
            </tr>
          </template>
          <template v-else-if="statement && statement.transactions.length > 0">
            <tr v-for="t in statement.transactions" :key="t.id" class="even:bg-gray-50">
              <td class="px-3 py-2">{{ fmtDate(t.date) }}</td>
              <td class="px-3 py-2">{{ t.is_reversal ? '(Reversal) ' : '' }}{{ t.description }}</td>
              <td class="px-3 py-2 text-right font-mono">{{ t.credit ? formatCurrency(t.credit) : '' }}</td>
              <td class="px-3 py-2 text-right font-mono">{{ t.debit ? formatCurrency(t.debit) : '' }}</td>
              <td class="px-3 py-2 text-right font-mono">{{ formatCurrency(t.running_balance) }}</td>
            </tr>
            <tr class="bg-gray-50">
              <td colspan="5" class="px-3 py-2 text-center text-gray-500 text-xs">--- End of Transactions ---</td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="5" class="px-3 py-8 text-center text-gray-500">No transactions in this period.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@media print {
  :global(body) > :not(#statement-print-area-container),
  .no-print { display: none !important; }
  #statement-print-area { border: none; padding: 0; }
  table, tr, td, th { break-inside: avoid; }
  * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
</style>
