<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Plus, Search, FileText, Calendar, X } from 'lucide-vue-next'
import { Spinner, Pagination, formatMoneyValue } from '@/Global'
import { journalEntriesApi } from '@/tenant/apis/journalEntries/journalEntriesApi'
import { downloadFile } from '@/Global/Helpers'
import JournalEntryForm from '../components/JournalEntryForm.vue'

const showForm = ref(false)
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const loading = ref(false)
const exporting = ref(false)
const entries = ref<any[]>([])
const links = ref<any>(null)
const meta = ref({ current_page: 1, last_page: 1, total: 0, per_page: 10 })

async function fetchEntries(page = 1) {
  loading.value = true
  try {
    const params = {
      search: search.value || undefined,
      page,
      per_page: meta.value.per_page,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined
    }
    const res = await journalEntriesApi.list(params)
    entries.value = res.data?.data ?? res.data ?? []
    if (res.data?.links) links.value = res.data.links
    if (res.data?.current_page) {
       meta.value = {
         current_page: res.data.current_page,
         last_page: res.data.last_page,
         total: res.data.total,
         per_page: res.data.per_page
       }
    }
  } finally {
    loading.value = false
  }
}

async function exportEntries(format: 'csv' | 'pdf') {
  exporting.value = true
  try {
    const params = {
      search: search.value || undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
      format
    }
    const res = await journalEntriesApi.export(params)
    const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv' : 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `journal_entries_${new Date().toISOString().split('T')[0]}.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    console.error('Export failed', e)
  } finally {
    exporting.value = false
  }
}

function clearFilters() {
  search.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  fetchEntries(1)
}

onMounted(() => fetchEntries())

let timer: any
watch([search, dateFrom, dateTo], () => {
  clearTimeout(timer)
  timer = setTimeout(() => fetchEntries(1), 400)
})

function fmt(n: string | number | null) {
  return formatMoneyValue(n ?? 0)
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Journal Entries</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Manual journal vouchers and ledger postings.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="exportEntries('csv')"
          :disabled="exporting || entries.length === 0"
          class="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
        >
          <FileText class="h-4 w-4" />
          Export CSV
        </button>
        <button
          @click="showForm = true"
          class="inline-flex items-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white hover:bg-nfuko-primary/90 transition-colors shadow-sm"
        >
          <Plus class="h-4 w-4" />
          New Entry
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
      <div class="relative lg:col-span-2">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by voucher, narration..."
          class="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-nfuko-primary focus:bg-white focus:ring-1 focus:ring-nfuko-primary/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>
      
      <div class="relative">
        <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="dateFrom"
          type="date"
          class="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-nfuko-primary focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>

      <div class="relative">
        <Calendar class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="dateTo"
          type="date"
          class="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-nfuko-primary focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="clearFilters"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-red-500 transition-colors"
        >
          <X class="h-4 w-4" />
          Clear
        </button>
      </div>
    </div>


    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-6 w-6 text-nfuko-primary" />
    </div>

    <div v-else-if="entries.length === 0" class="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white py-16 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
      <p class="text-sm text-neutral-400">No journal entries found matching your criteria.</p>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-neutral-50 dark:bg-neutral-800/40">
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Date</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Voucher No</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Description</th>
              <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-neutral-400">Total Amount</th>
              <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <tr v-for="entry in entries" :key="entry.id" class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
              <td class="px-6 py-4 text-neutral-700 dark:text-neutral-300">{{ String(entry.entry_date).split(' ')[0] }}</td>
              <td class="px-6 py-4 font-mono font-semibold text-nfuko-primary">{{ entry.voucher_number }}</td>
              <td class="px-6 py-4">
                 <div class="flex flex-col">
                   <span class="font-medium text-neutral-900 dark:text-white">{{ entry.description || 'No description' }}</span>
                   <span v-if="entry.reference" class="text-xs text-neutral-400">Ref: {{ entry.reference }}</span>
                 </div>
              </td>
              <td class="px-6 py-4 text-right font-mono font-bold">{{ fmt(entry.total_amount) }}</td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {{ entry.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <Pagination
        :links="links"
        :page="meta.current_page"
        @change="fetchEntries"
      />
    </div>

    <!-- Create Form -->
    <JournalEntryForm
      v-model:open="showForm"
      @saved="fetchEntries(1)"
    />
  </div>
</template>
