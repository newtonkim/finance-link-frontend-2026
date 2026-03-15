<script setup lang="ts">
import { computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'

export interface TxRow {
  member_number: string
  account_number: string
  type: string
  amount: string
  transaction_date: string
  narration: string
  payment_mode: string
  reference: string
}

const props = defineProps<{ rows: TxRow[] }>()
const emit  = defineEmits<{ (e: 'delete', index: number): void }>()

function hasError(row: TxRow) {
  return !row.member_number || !row.account_number || !row.type || !row.amount || !row.transaction_date
}

// Running balance per account — computed client-side for preview
const runningBalances = computed(() => {
  const balances: Record<string, number> = {}
  return props.rows.map((row) => {
    const key = row.account_number || '__unknown__'
    balances[key] = balances[key] ?? 0
    const amt = parseFloat(row.amount) || 0
    balances[key] = row.type === 'deposit' ? balances[key] + amt : balances[key] - amt
    return balances[key]
  })
})

const cols: { key: keyof TxRow; label: string; required: boolean; width: string; type?: 'select' }[] = [
  { key: 'member_number',   label: 'Member No.',   required: true,  width: 'min-w-[110px]' },
  { key: 'account_number',  label: 'Account No.',  required: true,  width: 'min-w-[110px]' },
  { key: 'type',            label: 'Type',         required: true,  width: 'min-w-[110px]', type: 'select' },
  { key: 'amount',          label: 'Amount',       required: true,  width: 'min-w-[100px]' },
  { key: 'transaction_date',label: 'Date',         required: true,  width: 'min-w-[110px]' },
  { key: 'narration',       label: 'Narration',    required: false, width: 'min-w-[140px]' },
  { key: 'payment_mode',    label: 'Mode',         required: false, width: 'min-w-[110px]', type: 'select' },
  { key: 'reference',       label: 'Reference',    required: false, width: 'min-w-[110px]' },
]
</script>

<template>
  <div class="max-h-[50vh] overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
    <table class="w-full border-collapse text-xs">
      <thead class="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-800">
        <tr>
          <th class="border-b border-neutral-200 px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-700">#</th>
          <th v-for="col in cols" :key="col.key"
            class="border-b border-neutral-200 px-2 py-2.5 text-left text-[10px] font-semibold uppercase whitespace-nowrap dark:border-neutral-700"
            :class="col.required ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-400'">
            {{ col.label }}<span v-if="col.required" class="ml-0.5 text-red-500">*</span>
          </th>
          <th class="border-b border-neutral-200 px-2 py-2.5 text-left text-[10px] font-semibold uppercase text-neutral-600 dark:border-neutral-700 dark:text-neutral-300 whitespace-nowrap">
            Running Bal.
          </th>
          <th class="border-b border-neutral-200 px-2 py-2.5 dark:border-neutral-700" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i"
          :class="hasError(row) ? 'bg-red-50/70 dark:bg-red-900/10' : i % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50/40 dark:bg-neutral-800/20'">
          <td class="border-b border-neutral-100 px-2 py-1 text-neutral-400 dark:border-neutral-800">{{ i + 1 }}</td>
          <td v-for="col in cols" :key="col.key"
            class="border-b border-neutral-100 px-1 py-1 dark:border-neutral-800" :class="col.width">
            <select v-if="col.key === 'type'" v-model="row.type"
              :class="['w-full rounded border bg-transparent px-1 py-0.5 text-xs outline-none', !row.type ? 'border-red-400' : 'border-neutral-200 dark:border-neutral-700']">
              <option value="">— select —</option>
              <option>deposit</option><option>withdrawal</option>
            </select>
            <select v-else-if="col.key === 'payment_mode'" v-model="row.payment_mode"
              class="w-full rounded border border-neutral-200 bg-transparent px-1 py-0.5 text-xs outline-none dark:border-neutral-700">
              <option value="">—</option>
              <option>cash</option><option>bank</option><option>mobile_money</option>
            </select>
            <input v-else v-model="row[col.key]"
              :class="['w-full rounded border bg-transparent px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-nfuko-primary/50',
                col.required && !row[col.key] ? 'border-red-400 bg-red-50/50' : 'border-neutral-200 dark:border-neutral-700']" />
          </td>
          <td class="border-b border-neutral-100 px-2 py-1 dark:border-neutral-800"
            :class="runningBalances[i] < 0 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'">
            {{ runningBalances[i].toLocaleString('en-KE', { minimumFractionDigits: 2 }) }}
          </td>
          <td class="border-b border-neutral-100 px-1 py-1 dark:border-neutral-800">
            <button @click="emit('delete', i)" class="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="rows.length === 0" class="py-10 text-center text-sm text-neutral-400">All rows removed.</div>
  </div>
</template>
