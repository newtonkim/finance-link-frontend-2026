<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Search, Plus, Eye, Pencil, Trash2, SlidersHorizontal } from 'lucide-vue-next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Spinner, InputError, Label,
} from '@/Global'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SavingsAccount {
  id: number
  account_no: string
  account_type: string
  balance: string
  status: string
  member: { id: number; name: string; member_number: string } | null
  savings_product: { id: number; name: string } | null
}
interface Meta { current_page: number; last_page: number; total: number }

// ─── State ────────────────────────────────────────────────────────────────────
const accounts  = ref<SavingsAccount[]>([])
const meta      = ref<Meta>({ current_page: 1, last_page: 1, total: 0 })
const loading   = ref(false)
const search    = ref('')
let   searchTimer: ReturnType<typeof setTimeout> | null = null

// delete dialog
const showDelete   = ref(false)
const deleteTarget = ref<SavingsAccount | null>(null)
const deleting     = ref(false)
const deleteError  = ref('')

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchAccounts(page = 1) {
  loading.value = true
  try {
    const res = await savingsAccountsApi.list({ search: search.value || undefined, page })
    accounts.value = res.data?.data ?? []
    if (res.data?.meta) meta.value = res.data.meta
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchAccounts(1), 400)
})

onMounted(() => fetchAccounts(1))

// ─── Delete ───────────────────────────────────────────────────────────────────
function confirmDelete(account: SavingsAccount) {
  deleteTarget.value = account
  deleteError.value  = ''
  showDelete.value   = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await savingsAccountsApi.destroy(deleteTarget.value.id)
    showDelete.value = false
    await fetchAccounts(meta.value.current_page)
  } catch (err: any) {
    deleteError.value = err?.response?.data?.message ?? 'Failed to delete account.'
  } finally {
    deleting.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBalance(val: string | number) {
  return new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val))
}

function statusClass(s: string) {
  if (s === 'active')  return 'bg-green-100 text-green-700'
  if (s === 'dormant') return 'bg-yellow-100 text-yellow-700'
  return 'bg-neutral-100 text-neutral-500'
}

const pages = () => Array.from({ length: meta.value.last_page }, (_, i) => i + 1)
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Members Savings Account</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage all member savings accounts and their balances.</p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-full bg-[#001d22] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#001d22]/90 transition-colors shadow-sm"
      >
        <Plus class="h-4 w-4" />
        Add Account
      </button>
    </div>

    <!-- Search + Filters -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by account no or member..."
          class="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#001d22] focus:ring-1 focus:ring-[#001d22] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>
      <button class="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
        <SlidersHorizontal class="h-4 w-4" />
        Filters
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-100 dark:border-neutral-800">
              <th class="px-6 py-4 text-left font-semibold text-neutral-800 dark:text-white">Account No</th>
              <th class="px-6 py-4 text-left font-semibold text-neutral-800 dark:text-white">Member</th>
              <th class="px-6 py-4 text-left font-semibold text-neutral-800 dark:text-white">Savings Product Type</th>
              <th class="px-6 py-4 text-right font-semibold text-neutral-800 dark:text-white">Balance</th>
              <th class="px-6 py-4 text-left font-semibold text-neutral-800 dark:text-white">Status</th>
              <th class="px-6 py-4 text-right font-semibold text-neutral-800 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            <!-- Loading -->
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td v-for="j in 6" :key="j" class="px-6 py-5">
                  <div class="h-4 rounded bg-neutral-100 dark:bg-neutral-800" :class="j === 3 ? 'w-40' : 'w-24'" />
                </td>
              </tr>
            </template>

            <!-- Empty -->
            <tr v-else-if="accounts.length === 0">
              <td colspan="6" class="px-6 py-16 text-center text-sm text-neutral-400">
                No savings accounts found.
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-else
              v-for="account in accounts"
              :key="account.id"
              class="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <!-- Account No -->
              <td class="px-6 py-4">
                <div class="font-semibold text-neutral-900 dark:text-white">{{ account.account_no }}</div>
                <div class="text-[11px] uppercase tracking-wide text-neutral-400">{{ account.account_type }}</div>
              </td>

              <!-- Member -->
              <td class="px-6 py-4">
                <div class="font-medium text-neutral-800 dark:text-neutral-200">{{ account.member?.name ?? '—' }}</div>
                <div class="text-[11px] text-neutral-400">{{ account.member?.member_number ?? '' }}</div>
              </td>

              <!-- Product -->
              <td class="px-6 py-4">
                <span v-if="account.savings_product" class="inline-flex rounded-full border border-[#3ab88a]/30 bg-[#3ab88a]/10 px-3 py-1 text-xs font-semibold text-[#3ab88a]">
                  {{ account.savings_product.name }}
                </span>
                <span v-else class="text-neutral-400">—</span>
              </td>

              <!-- Balance -->
              <td class="px-6 py-4 text-right font-semibold text-[#3ab88a]">
                Ksh {{ formatBalance(account.balance) }}
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize" :class="statusClass(account.status)">
                  {{ account.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-1">
                  <button class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors">
                    <Eye class="h-3.5 w-3.5" />
                    View
                  </button>
                  <button class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors">
                    <Pencil class="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    @click="confirmDelete(account)"
                    class="flex items-center justify-center rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="flex items-center justify-between border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
        <p class="text-xs text-neutral-400">
          Page {{ meta.current_page }} of {{ meta.last_page }} ({{ meta.total }} accounts)
        </p>
        <div class="flex gap-1">
          <button
            v-for="page in pages()"
            :key="page"
            @click="fetchAccounts(page)"
            class="h-8 w-8 rounded-lg text-xs font-medium transition-colors"
            :class="page === meta.current_page ? 'bg-[#001d22] text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation -->
  <Dialog v-model:open="showDelete">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Delete Savings Account</DialogTitle>
      </DialogHeader>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Are you sure you want to delete account
        <span class="font-semibold text-neutral-900 dark:text-white">{{ deleteTarget?.account_no }}</span>?
        This action cannot be undone.
      </p>
      <p v-if="deleteError" class="text-sm text-red-600">{{ deleteError }}</p>
      <DialogFooter class="flex justify-end gap-2 pt-2">
        <button
          @click="showDelete = false"
          class="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="doDelete"
          :disabled="deleting"
          class="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          <Spinner v-if="deleting" class="h-4 w-4" />
          Delete
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
