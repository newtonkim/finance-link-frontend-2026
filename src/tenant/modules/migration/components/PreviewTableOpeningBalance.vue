<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

export interface ObRow {
  id?: number
  member_number: string
  account_number: string
  opening_balance: string
  as_of_date: string
  notes: string
  date?: any
}

const props:any = defineProps<{ rows: ObRow[] }>()
const emit = defineEmits<{ (e: 'delete', index: number): void }>()
function hasError(row: ObRow) {


  return (
    !row.id ||
    !row.account_number ||
    !row.date ||
    !row.opening_balance
  )

}

const cols:any = computed(() => {
  if (!props.rows?.length) return []

  return Object.keys(props.rows[0]).map((key) => ({
    key,
    label: key.replace(/_/g, ' ').toUpperCase(),
    required: ['member_number', 'account_number', 'opening_balance'].includes(key),
    width: 'min-w-[140px]'
  }))
})

const currentPage = ref<number>(1)
const perPage = ref<number>(500)

const totalPages:any = computed(() =>
  Math.ceil(props.rows.length / perPage.value)
)

const paginatedRows:any = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return props.rows.slice(start, start + perPage.value)
})

/* Reset page when data changes */
watch(
  () => props.rows.length,
  () => (currentPage.value = 1)
)


function deleteRow(localIndex: number) {
  const globalIndex =
    (currentPage.value - 1) * perPage.value + localIndex

  emit('delete', globalIndex)
}
</script>

<template>
  <div class="rounded-xl border border-neutral-200 dark:border-neutral-700">

    <!-- TABLE -->
    <div class="max-h-[70vh] overflow-auto">
      <table class="w-full border-collapse text-xs">
        <thead class="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-800">
          <tr>
            <th class="px-2 py-2 text-left text-[10px] font-semibold text-neutral-400">#</th>

            <th v-for="col in cols" :key="col.key"
              class="px-2 py-2 text-left text-[10px] font-semibold uppercase whitespace-nowrap">
              {{ col.label }}
              <span v-if="col.required" class="text-red-500">*</span>
            </th>

            <th />
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, i) in paginatedRows" :key="i" :class="[
            hasError(row)
              ? 'bg-red-50/70 dark:bg-red-900/10'
              : i % 2 === 0
                ? 'bg-white dark:bg-neutral-900'
                : 'bg-neutral-50/40 dark:bg-neutral-800/20'
          ]">
            <td class="px-2 py-2 text-neutral-400">
              {{ (currentPage) - 1 * perPage + i + 1 }}
            </td>

            <td v-for="col in cols" :key="col.key" class="px-1 py-1" :class="col.width">
              <input :type="col.key=='date'?'datetime-local':'text'" v-model="row[col.key]" class="w-full rounded border px-1 py-2 text-xs outline-none" :class="col.required && !row[col.key]
                  ? 'border-red-400 bg-red-50/50'
                  : 'border-neutral-200 dark:border-neutral-700'
                " />
            </td>

            <td class="px-1 py-1">
              <button @click="deleteRow(i)" class="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="props.rows.length === 0" class="py-10 text-center text-sm text-neutral-400">
        All rows removed.
      </div>
    </div>

    <!-- PAGINATION -->
    <div v-if="props.rows.length" class="flex items-center justify-between   px-3 py-2 text-xs">
      <div>
        Page {{ currentPage }} of {{ totalPages }}
      </div>

      <div class="flex items-center gap-2">
        <button :disabled="currentPage === 1" @click="currentPage--"
          class="px-2 py-1 border rounded disabled:opacity-40">
          Prev
        </button>

        <button :disabled="currentPage === totalPages" @click="currentPage++"
          class="px-2 py-1 border rounded disabled:opacity-40">
          Next
        </button>

        <select v-model="perPage" class="border rounded px-1 py-0.5">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>
  </div>
</template>