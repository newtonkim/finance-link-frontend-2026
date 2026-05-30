<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { Search, Plus, SlidersHorizontal, Zap, CheckCircle2 } from 'lucide-vue-next'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import { savingsProductsApi, type SavingsProduct } from '@/tenant/apis/savingsProducts/api'
import { toast } from 'vue-sonner'
import { useCurrencyStore } from '@/stores/currency'
import SavingsAccountsTable from '../components/SavingsAccountsTable.vue'
import DeleteAccountDialog from '../components/DeleteAccountDialog.vue'
import ViewAccountDrawer from '../components/ViewAccountDrawer.vue'
import EditAccountDrawer from '../components/EditAccountDrawer.vue'
import CreateAccountDrawer from '../components/CreateAccountDrawer.vue'

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
interface PostingResult { posted: number; skipped: number; errors: { account_no: string; reason: string }[] }

const currencyStore = useCurrencyStore()
const currency = computed(() => currencyStore.currencyCode)

const accounts = ref<SavingsAccount[]>([])
const meta = ref<Meta>({ current_page: 1, last_page: 1, total: 0 })
const loading = ref(false)
const posting = ref(false)
const postingResult = ref<PostingResult | null>(null)
const search = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const savingsProducts = ref<SavingsProduct[]>([])

// delete state
const showDelete = ref(false)
const deleteTarget = ref<SavingsAccount | null>(null)
const deleting = ref(false)
const deleteError = ref('')

// drawer refs
const viewDrawer = ref<InstanceType<typeof ViewAccountDrawer> | null>(null)
const editDrawer = ref<InstanceType<typeof EditAccountDrawer> | null>(null)
const createDrawer = ref<InstanceType<typeof CreateAccountDrawer> | null>(null)


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

async function fetchSavingsProducts() {
  try {
    const res = await savingsProductsApi.list({ status: 'active' })
    savingsProducts.value = res.data?.data ?? []
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to load savings products.')
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchAccounts(1), 400)
})

onMounted(() => fetchAccounts(1))
onMounted(() => fetchSavingsProducts())

function confirmDelete(account: SavingsAccount) {
  deleteTarget.value = account
  deleteError.value = ''
  showDelete.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await savingsAccountsApi.destroy(deleteTarget.value.id)
    toast.success('Account deleted successfully.')
    showDelete.value = false
    await fetchAccounts(meta.value.current_page)
  } catch (err: any) {
    deleteError.value = err?.response?.data?.message ?? 'Failed to delete account.'
  } finally {
    deleting.value = false
  }
}

function formatBalance(val: string | number) {
  return new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val))
}

function statusClass(s: string) {
  if (s === 'active') return 'bg-green-100 text-green-700'
  if (s === 'dormant') return 'bg-yellow-100 text-yellow-700'
  return 'bg-neutral-100 text-neutral-500'
}

async function onCreateSuccess(newAccount: any) {
  await fetchAccounts(1)
  if (newAccount?.id) {
    viewDrawer.value?.openDrawer({ id: newAccount.id })
  }
}

async function runPostInterest() {
  posting.value = true
  postingResult.value = null
  try {
    const res = await savingsAccountsApi.postRegularInterest()
    postingResult.value = res.data?.summary ?? null
    toast.success(`Interest posting complete — ${postingResult.value?.posted ?? 0} accounts posted.`)
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Interest posting failed.')
  } finally {
    posting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Members Savings Account</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage all member savings accounts and their balances.</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button" @click="runPostInterest" :disabled="posting"
          class="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap class="h-4 w-4" />
          {{ posting ? 'Posting...' : 'Post Monthly Interest' }}
        </button>
        <button
          class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 inline-flex items-center gap-2 rounded-full  px-5 py-2.5 text-sm font-semibold text-white hover:/90 transition-colors shadow-sm
          @click="createDrawer?.openDrawer()"
        >
          <Plus class="h-4 w-4" />
          Add Account
        </button>
      </div>
    </div>

    <!-- Interest posting result banner -->
    <div v-if="postingResult" class="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
      <p class="text-sm font-semibold text-green-800 dark:text-green-300">Interest posting complete</p>
      <div class="mt-2 flex flex-wrap gap-6 text-sm text-green-700 dark:text-green-400">
        <span class="flex items-center gap-1"><CheckCircle2 class="h-4 w-4" /> {{ postingResult.posted }} posted</span>
        <span>{{ postingResult.skipped }} skipped</span>
        <span v-if="postingResult.errors.length > 0" class="text-red-600 dark:text-red-400">
          {{ postingResult.errors.length }} error{{ postingResult.errors.length > 1 ? 's' : '' }}
        </span>
      </div>
      <ul v-if="postingResult.errors.length > 0" class="mt-2 space-y-0.5 text-xs text-red-600 dark:text-red-400">
        <li v-for="err in postingResult.errors" :key="err.account_no">
          {{ err.account_no }}: {{ err.reason }}
        </li>
      </ul>
    </div>

    <!-- Search + Filters -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by account no or member..."
          class="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>
      <button class="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
        <SlidersHorizontal class="h-4 w-4" />
        Filters
      </button>
    </div>

    <SavingsAccountsTable
      :accounts="accounts"
      :meta="meta"
      :loading="loading"
      :currency="currency"
      :format-balance="formatBalance"
      :status-class="statusClass"
      @view="viewDrawer?.openDrawer($event)"
      @edit="editDrawer?.openDrawer($event)"
      @delete="confirmDelete"

      @page="fetchAccounts"
    />
  </div>

  <DeleteAccountDialog
    v-model:open="showDelete"
    :account-no="deleteTarget?.account_no"
    :deleting="deleting"
    :error="deleteError"
    @confirm="doDelete"
  />

  <ViewAccountDrawer
    ref="viewDrawer"
    :currency="currency"
    :format-balance="formatBalance"
    :status-class="statusClass"
    @edit-account="editDrawer?.openDrawer($event)"
  />

  <EditAccountDrawer
    ref="editDrawer"
    :savings-products="savingsProducts as any[]"
    @success="fetchAccounts(meta.current_page)"
  />

  <CreateAccountDrawer
    ref="createDrawer"
    :savings-products="savingsProducts as any[]"
    @success="onCreateSuccess"
  />


</template>
