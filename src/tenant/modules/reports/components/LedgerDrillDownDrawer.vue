<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import { X } from 'lucide-vue-next'
import { Spinner, formatMoneyValue } from '@/Global'
import { trialBalanceApi } from '@/tenant/apis/reports/trialBalanceApi'

export interface DrillAccount {
  id: number
  gl_code: string | null
  name: string
}

const props = defineProps<{ account: DrillAccount | null; from: string; to: string }>()
const open = defineModel<boolean>('open', { required: true })

interface LedgerLine {
  date: string
  entry_no: string
  description: string | null
  debit: number
  credit: number
}
const lines = ref<LedgerLine[]>([])
const page     = ref(1)
const total    = ref(0)
const lastPage = ref(1)
const loading  = ref(false)
const error    = ref<string | null>(null)

let version = 0
let failedPage = 1

async function fetchPage(nextPage = 1) {
  if (!props.account) return
  const requestVersion = ++version
  failedPage = nextPage
  loading.value = true
  error.value = null
  try {
    const res = await trialBalanceApi.getLedgerLines({
      account_id: props.account.id, from: props.from, to: props.to, page: nextPage,
    })
    if (requestVersion !== version) return
    lines.value = nextPage === 1 ? res.data : [...lines.value, ...res.data]
    page.value = nextPage
    total.value = res.total
    lastPage.value = res.last_page
  } catch (e: unknown) {
    if (requestVersion === version) error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load ledger lines.'
  } finally {
    if (requestVersion === version) loading.value = false
  }
}

function loadMore() {
  if (!loading.value && page.value < lastPage.value) void fetchPage(page.value + 1)
}

watch(
  () => [open.value, props.account?.id, props.from, props.to] as const,
  ([isOpen]) => {
    ++version
    loading.value = false
    if (!isOpen || !props.account) return
    page.value = 1
    lastPage.value = 1
    total.value = 0
    lines.value = []
    void fetchPage()
  },
  { immediate: true },
)
onBeforeUnmount(() => { ++version })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-neutral-950/20" />
      <DialogContent class="fixed right-0 top-0 z-50 h-full w-full max-w-xl bg-white dark:bg-neutral-900 shadow-2xl flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <p class="text-xs font-mono text-neutral-400">{{ account?.gl_code }}</p>
            <DialogTitle class="font-bold text-neutral-900 dark:text-white">{{ account?.name }}</DialogTitle>
            <DialogDescription class="text-xs text-neutral-400 mt-0.5">{{ from }} → {{ to }}</DialogDescription>
          </div>
          <button type="button" aria-label="Close" @click="open = false"
            class="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X class="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="loading && page === 1" class="flex items-center justify-center py-12">
            <Spinner class="h-6 w-6 text-nfuko-primary" />
          </div>
          <div v-else-if="error" role="alert" class="px-6 py-12 text-center text-sm text-rose-600 dark:text-rose-400"><p>{{ error }}</p><button type="button" class="mt-3 underline" @click="fetchPage(failedPage)">Retry</button></div>
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
              <tr v-for="(line, i) in lines" :key="i" class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                <td class="px-4 py-2.5 text-neutral-500">{{ line.date }}</td>
                <td class="px-4 py-2.5">
                  <div class="font-mono text-neutral-700 dark:text-neutral-300">{{ line.entry_no }}</div>
                  <div class="text-neutral-400 truncate max-w-[180px]">{{ line.description }}</div>
                </td>
                <td class="px-4 py-2.5 text-right text-blue-600 font-semibold">{{ line.debit ? formatMoneyValue(line.debit) : '—' }}</td>
                <td class="px-4 py-2.5 text-right text-orange-600 font-semibold">{{ line.credit ? formatMoneyValue(line.credit) : '—' }}</td>
              </tr>
              <tr v-if="!lines.length && !loading">
                <td colspan="4" class="px-4 py-12 text-center text-neutral-400">No transactions in this period.</td>
              </tr>
            </tbody>
          </table>

          <div v-if="!error && page < lastPage" class="p-4 text-center">
            <button type="button" @click="loadMore" :disabled="loading"
              class="text-xs font-bold text-nfuko-primary hover:underline disabled:opacity-50">
              {{ loading ? 'Loading...' : `Load more — page ${page + 1} of ${lastPage}` }}
            </button>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
          {{ total }} transaction{{ total !== 1 ? 's' : '' }}
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
