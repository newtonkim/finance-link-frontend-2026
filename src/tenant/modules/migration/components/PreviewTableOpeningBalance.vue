<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

export interface ObRow {
  member_number: string
  account_number: string
  opening_balance: string
  as_of_date: string
  notes: string
}

const props = defineProps<{ rows: ObRow[] }>()
const emit  = defineEmits<{ (e: 'delete', index: number): void }>()

function hasError(row: ObRow) {
  return !row.member_number || !row.account_number || !row.opening_balance || !row.as_of_date
}

const cols: { key: keyof ObRow; label: string; required: boolean; width: string }[] = [
  { key: 'member_number',  label: 'Member No.',     required: true,  width: 'min-w-[120px]' },
  { key: 'account_number', label: 'Account No.',    required: true,  width: 'min-w-[120px]' },
  { key: 'opening_balance',label: 'Opening Balance',required: true,  width: 'min-w-[130px]' },
  { key: 'as_of_date',     label: 'As Of Date',     required: true,  width: 'min-w-[120px]' },
  { key: 'notes',          label: 'Notes',          required: false, width: 'min-w-[160px]' },
]
</script>

<template>
  <div class="max-h-[50vh] overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
    <table class="w-full border-collapse text-xs">
      <thead class="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-800">
        <tr>
          <th class="border-b border-neutral-200 px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-700">#</th>
          <th v-for="col in cols" :key="col.key"
            class="border-b border-neutral-200 px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap dark:border-neutral-700"
            :class="col.required ? 'text-neutral-600 dark:text-neutral-300' : 'text-neutral-400'">
            {{ col.label }}<span v-if="col.required" class="ml-0.5 text-red-500">*</span>
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
            <input v-model="row[col.key]"
              :class="['w-full rounded border bg-transparent px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-nfuko-primary/50',
                col.required && !row[col.key] ? 'border-red-400 bg-red-50/50' : 'border-neutral-200 dark:border-neutral-700']" />
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
