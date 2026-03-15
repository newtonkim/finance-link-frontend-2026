<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { Search, Plus, Eye, Pencil, Trash2, SlidersHorizontal, X, ArrowLeft } from 'lucide-vue-next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Spinner, InputError, Label,
} from '@/Global'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import { savingsProductsApi, type SavingsProduct } from '@/tenant/apis/savingsProducts/api'
import { membersApi } from '@/tenant/apis/members/membersApi'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { toast } from 'vue-sonner'
import { useCurrencyStore } from '@/stores/currency'

const currencyStore = useCurrencyStore()
const currency = computed(() => currencyStore.currencyCode)

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
interface MemberOption { id: number; name: string; member_number: string }
interface MemberDetails {
  id: number
  name: string
  member_number: string
  status: string
  savings_accounts: Array<{ id: number; account_no: string; account_type: string }>
}

// ─── State ────────────────────────────────────────────────────────────────────
const accounts  = ref<SavingsAccount[]>([])
const meta      = ref<Meta>({ current_page: 1, last_page: 1, total: 0 })
const loading   = ref(false)
const search    = ref('')
let   searchTimer: ReturnType<typeof setTimeout> | null = null

// create drawer state
const showCreate = ref(false)
const createProcessing = ref(false)
const createErrors = ref<Record<string, any>>({})

const memberSelectValue = ref<string | number>('')
const memberLoading = ref(false)
const memberOptions = ref<MemberOption[]>([])
const selectedMember = ref<MemberDetails | null>(null)

const savingsProducts = ref<SavingsProduct[]>([])
const showChargeDropdown = ref(false)

const newAccountForm = ref({
  member_id: 0,
  savings_product_id: '' as string | number,
  account_type: '',
  is_new_account: true,
  initial_deposit: '' as string | number,
  opening_balance: '' as string | number,
  consider_min_balance: false,
  credited_account_id: '' as string | number,
  charges: [] as number[],
  status: 'active',
})

// delete dialog
const showDelete   = ref(false)
const deleteTarget = ref<SavingsAccount | null>(null)
const deleting     = ref(false)
const deleteError  = ref('')

// view drawer state
const showView    = ref(false)
const viewAccount = ref<Record<string, any> | null>(null)
const viewLoading = ref(false)

// edit drawer state
const showEdit       = ref(false)
const editAccountId  = ref<number>(0)
const editProcessing = ref(false)
const editErrors     = ref<Record<string, any>>({})
const editLoading    = ref(false)
const editForm       = ref({
  savings_product_id: '' as string | number,
  account_type: '',
  status: 'active',
  initial_deposit: '' as string | number,
  opening_balance: '' as string | number,
  consider_min_balance: false,
})

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

async function fetchSavingsProducts() {
  try {
    const res = await savingsProductsApi.list({ status: 'active' })
    savingsProducts.value = res.data?.data ?? []
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to load savings products.')
  }
}

async function fetchMemberDetails(memberId: number) {
  try {
    const res = await membersApi.show(memberId)
    const body = res.data
    const memberData: Record<string, any> =
      body?.data?.member ??
      body?.member ??
      body?.data ??
      body ?? {}
    selectedMember.value = {
      id: memberData.id,
      name: memberData.name,
      member_number: memberData.member_number,
      status: memberData.status,
      savings_accounts: memberData.savings_accounts ?? [],
    }
  } catch (err: any) {
    selectedMember.value = null
    toast.error(err?.response?.data?.message ?? 'Failed to load member details.')
  }
}

async function searchMembers(query: string) {
  memberLoading.value = true
  try {
    const res = await membersApi.list({ search: query || undefined, page: 1 })
    const list = res.data?.data ?? []
    memberOptions.value = list.map((m: any) => ({
      id: m.id,
      name: m.name,
      member_number: m.member_number,
    }))
  } catch (err: any) {
    memberOptions.value = []
  } finally {
    memberLoading.value = false
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchAccounts(1), 400)
})

onMounted(() => fetchAccounts(1))
onMounted(() => fetchSavingsProducts())

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
    toast.success('Account deleted successfully.')
    showDelete.value = false
    await fetchAccounts(meta.value.current_page)
  } catch (err: any) {
    deleteError.value = err?.response?.data?.message ?? 'Failed to delete account.'
  } finally {
    deleting.value = false
  }
}

// ─── View (Show) ──────────────────────────────────────────────────────────────
async function openView(account: SavingsAccount) {
  viewAccount.value = null
  viewLoading.value = true
  showView.value = true
  try {
    const res = await savingsAccountsApi.show(account.id)
    viewAccount.value = res.data?.data ?? res.data
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to load account details.')
    showView.value = false
  } finally {
    viewLoading.value = false
  }
}

function closeView() {
  showView.value = false
  viewAccount.value = null
}

// ─── Edit ────────────────────────────────────────────────────────────────────
async function openEdit(account: SavingsAccount) {
  editErrors.value = {}
  editLoading.value = true
  showEdit.value = true
  editAccountId.value = account.id
  try {
    const res = await savingsAccountsApi.show(account.id)
    const data = res.data?.data ?? res.data
    editForm.value = {
      savings_product_id: data.savings_product?.id ?? data.savings_product_id ?? '',
      account_type: data.account_type ?? '',
      status: data.status ?? 'active',
      initial_deposit: data.initial_deposit ?? '',
      opening_balance: data.opening_balance ?? '',
      consider_min_balance: data.consider_min_balance ?? false,
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to load account for editing.')
    showEdit.value = false
  } finally {
    editLoading.value = false
  }
}

function closeEdit() {
  showEdit.value = false
  editErrors.value = {}
}

async function submitEdit() {
  editProcessing.value = true
  editErrors.value = {}
  try {
    await savingsAccountsApi.update(editAccountId.value, editForm.value)
    toast.success('Account updated successfully.')
    showEdit.value = false
    await fetchAccounts(meta.value.current_page)
  } catch (err: any) {
    if (err?.response?.status === 422) {
      editErrors.value = err.response.data.errors || {}
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to update account.')
    }
  } finally {
    editProcessing.value = false
  }
}

const editProductOptions = computed(() =>
  (savingsProducts.value ?? []).map(p => ({ id: p.id!, name: p.name }))
)

watch(() => editForm.value.savings_product_id, (newVal) => {
  if (!newVal) return
  const product = savingsProducts.value.find(p => p.id === Number(newVal))
  if (product) {
    editForm.value.account_type = product.type
  }
})

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

// ─── Create Helpers ──────────────────────────────────────────────────────────
const selectedProductCharges = computed(() => {
  if (!newAccountForm.value.savings_product_id) return []
  const product = savingsProducts.value.find(p => p.id === Number(newAccountForm.value.savings_product_id))
  return product?.charges ?? []
})

const productOptions = computed(() => (
  savingsProducts.value ?? []).map(p => ({ id: p.id!, name: p.name }))
)

const isNewAccountOptions = [
  { id: 'yes', name: 'Yes' },
  { id: 'no', name: 'No' },
]

const isNewAccountValue = computed(() => (newAccountForm.value.is_new_account ? 'yes' : 'no'))

const setIsNewAccount = (val: string | number) => {
  newAccountForm.value.is_new_account = val === 'yes'
}

const minBalanceOptions = [
  { id: 'no', name: 'No' },
  { id: 'yes', name: 'Yes' },
]

const minBalanceValue = computed(() => (newAccountForm.value.consider_min_balance ? 'yes' : 'no'))

const setMinBalance = (val: string | number) => {
  newAccountForm.value.consider_min_balance = val === 'yes'
}

const creditedAccountOptions = computed(() => {
  const accounts = selectedMember.value?.savings_accounts ?? []
  return accounts.map(a => ({ id: a.id, name: `${a.account_no} — ${a.account_type}` }))
})

const memberHasAccounts = computed(() => (selectedMember.value?.savings_accounts?.length ?? 0) > 0)

const getChargeNameById = (id: number) => {
  const charge = selectedProductCharges.value.find(c => c.id === id)
  return charge?.type ?? `Charge ${id}`
}

const isChargeSelected = (id: number) => newAccountForm.value.charges.includes(id)

const toggleCharge = (chargeId: number) => {
  const idx = newAccountForm.value.charges.indexOf(chargeId)
  if (idx > -1) newAccountForm.value.charges.splice(idx, 1)
  else newAccountForm.value.charges.push(chargeId)
}

watch(() => newAccountForm.value.savings_product_id, async (newVal) => {
  if (!newVal) return
  const product = savingsProducts.value.find(p => p.id === Number(newVal))
  if (product) {
    newAccountForm.value.account_type = product.type
    if (!product.charges) {
      try {
        const res = await savingsProductsApi.get(Number(newVal))
        const full = res.data?.data ?? res.data
        const idx = savingsProducts.value.findIndex(p => p.id === Number(newVal))
        if (idx > -1) savingsProducts.value[idx] = { ...savingsProducts.value[idx], ...full }
        const updated = savingsProducts.value.find(p => p.id === Number(newVal))
        newAccountForm.value.charges = updated?.charges?.map(c => c.id!) ?? []
      } catch {}
      return
    }
    newAccountForm.value.charges = product.charges?.map(c => c.id!) ?? []
  }
})

const memberSelectOptions = computed(() => (
  memberOptions.value ?? []
).map(m => ({
  id: m.id,
  name: `${m.name} — ${m.member_number}`,
})))

const openCreate = () => {
  createErrors.value = {}
  selectedMember.value = null
  memberSelectValue.value = ''
  memberOptions.value = []
  newAccountForm.value = {
    member_id: 0,
    savings_product_id: '',
    account_type: '',
    is_new_account: true,
    initial_deposit: '',
    opening_balance: '',
    consider_min_balance: false,
    credited_account_id: '',
    charges: [],
    status: 'active',
  }
  showCreate.value = true
  searchMembers('')
}

const closeCreate = () => {
  showCreate.value = false
}

const selectMember = async (opt: MemberOption) => {
  memberSelectValue.value = opt.id
  newAccountForm.value.member_id = opt.id
  createErrors.value.member_id = null
  await fetchMemberDetails(opt.id)
}

watch(memberSelectValue, async (val) => {
  const memberId = Number(val || 0)
  if (!memberId) {
    selectedMember.value = null
    newAccountForm.value.member_id = 0
    return
  }
  newAccountForm.value.member_id = memberId
  const opt = memberOptions.value.find(o => o.id === memberId)
  if (opt) await fetchMemberDetails(opt.id)
})

const submitCreate = async () => {
  createErrors.value = {}
  if (!newAccountForm.value.member_id) {
    createErrors.value.member_id = 'Member is required.'
    return
  }
  if (!newAccountForm.value.savings_product_id) {
    createErrors.value.savings_product_id = 'Savings product is required.'
    return
  }
  if (memberHasAccounts.value) {
    createErrors.value.member_id = 'This member already has savings accounts.'
    return
  }

  createProcessing.value = true
  try {
    await savingsAccountsApi.store(newAccountForm.value)
    toast.success('Savings account created successfully.')
    showCreate.value = false
    await fetchAccounts(meta.value.current_page)
  } catch (err: any) {
    if (err?.response?.status === 422) {
      createErrors.value = err.response.data.errors || {}
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to create savings account.')
    }
  } finally {
    createProcessing.value = false
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
      <button
        class="inline-flex items-center gap-2 rounded-full  bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white hover: bg-nfuko-primary/90 transition-colors shadow-sm"
        @click="openCreate"
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
          class="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
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
                {{ currency }} {{ formatBalance(account.balance) }}
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
                  <button
                    @click="openView(account)"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors"
                  >
                    <Eye class="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    @click="openEdit(account)"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-[#c7d7f5] bg-[#eef3fd] px-3 py-1.5 text-xs font-semibold text-[#4f6cad] hover:bg-[#dce8fb] transition-colors"
                  >
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
            :class="page === meta.current_page ? ' bg-nfuko-primary text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation -->
  <Dialog v-model:open="showDelete">
    <DialogContent class="max-w-sm !bg-white dark:!bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl">
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

  <!-- View Account Drawer -->
  <Transition name="drawer-fade">
    <div v-if="showView" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeView"></div>

      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="View Savings Account"
        >
          <div class="flex h-full flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  @click="closeView"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  <ArrowLeft class="h-4 w-4" />
                </button>
                <div>
                  <h3 class="text-[15px] font-bold text-neutral-900 dark:text-white">Account Details</h3>
                  <p class="text-xs text-neutral-500">View savings account information.</p>
                </div>
              </div>
              <button
                type="button"
                @click="closeView"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <!-- Loading skeleton -->
              <div v-if="viewLoading" class="space-y-6">
                <div v-for="i in 6" :key="i" class="space-y-2">
                  <div class="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  <div class="h-5 w-48 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>

              <!-- Account Details -->
              <div v-else-if="viewAccount" class="space-y-6">
                <!-- Account Badge -->
                <div class="rounded-2xl border border-neutral-100 bg-gradient-to-br from-neutral-50 to-white p-5 dark:border-neutral-800 dark:from-neutral-800/50 dark:to-neutral-900">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs font-medium uppercase tracking-wider text-neutral-400">Account Number</p>
                      <p class="mt-1 text-xl font-bold text-neutral-900 dark:text-white">{{ viewAccount.account_no }}</p>
                    </div>
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize"
                      :class="statusClass(viewAccount.status)"
                    >
                      {{ viewAccount.status }}
                    </span>
                  </div>
                  <div class="mt-4 flex items-baseline gap-1">
                    <span class="text-sm text-neutral-500">Balance</span>
                    <span class="text-2xl font-bold text-[#3ab88a]">{{ currency }} {{ formatBalance(viewAccount.balance ?? 0) }}</span>
                  </div>
                </div>

                <!-- Detail Rows -->
                <div class="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Account Type</span>
                    <span class="text-sm font-semibold text-neutral-900 capitalize dark:text-white">{{ viewAccount.account_type ?? '—' }}</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Member</span>
                    <div class="text-right">
                      <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ viewAccount.member?.name ?? '—' }}</p>
                      <p class="text-xs text-neutral-400">{{ viewAccount.member?.member_number ?? '' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Savings Product</span>
                    <span v-if="viewAccount.savings_product" class="inline-flex rounded-full border border-[#3ab88a]/30 bg-[#3ab88a]/10 px-3 py-1 text-xs font-semibold text-[#3ab88a]">
                      {{ viewAccount.savings_product.name }}
                    </span>
                    <span v-else class="text-sm text-neutral-400">—</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Initial Deposit</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ currency }} {{ formatBalance(viewAccount.initial_deposit ?? 0) }}</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Opening Balance</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ currency }} {{ formatBalance(viewAccount.opening_balance ?? 0) }}</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Min Balance Enforced</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ viewAccount.consider_min_balance ? 'Yes' : 'No' }}</span>
                  </div>
                  <div v-if="viewAccount.created_at" class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Created</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ new Date(viewAccount.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <button
                type="button"
                @click="closeView"
                class="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Close
              </button>
              <button
                v-if="viewAccount"
                type="button"
                @click="closeView(); openEdit(viewAccount as any)"
                class="inline-flex items-center gap-2 rounded-full  bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white hover: bg-nfuko-primary/90 transition-colors"
              >
                <Pencil class="h-3.5 w-3.5" />
                Edit Account
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>

  <!-- Edit Account Drawer -->
  <Transition name="drawer-fade">
    <div v-if="showEdit" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeEdit"></div>

      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="Edit Savings Account"
        >
          <div class="flex h-full flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <div>
                <h3 class="text-[15px] font-bold text-neutral-900 dark:text-white">Edit Savings Account</h3>
                <p class="text-xs text-neutral-500">Update savings account details.</p>
              </div>
              <button
                type="button"
                @click="closeEdit"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <!-- Loading skeleton -->
              <div v-if="editLoading" class="space-y-6">
                <div v-for="i in 5" :key="i" class="space-y-2">
                  <div class="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  <div class="h-10 w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>

              <!-- Edit Form -->
              <form v-else @submit.prevent="submitEdit" class="space-y-5">
                <!-- Savings Product -->
                <div class="space-y-2">
                  <Label>Savings Product</Label>
                  <SearchableSelect
                    :modelValue="editForm.savings_product_id"
                    @update:modelValue="editForm.savings_product_id = $event"
                    :options="editProductOptions"
                    placeholder="Select savings product"
                    :error="editErrors.savings_product_id?.[0] ?? editErrors.savings_product_id"
                  />
                </div>

                <!-- Account Type (read-only from product) -->
                <div class="space-y-2">
                  <Label>Account Type</Label>
                  <input
                    :value="editForm.account_type"
                    type="text"
                    disabled
                    class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-500 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                  />
                </div>

                <!-- Status -->
                <div class="space-y-2">
                  <Label>Status</Label>
                  <select
                    v-model="editForm.status"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="dormant">Dormant</option>
                    <option value="closed">Closed</option>
                  </select>
                  <InputError v-if="editErrors.status" :message="editErrors.status?.[0] ?? editErrors.status" />
                </div>

                <!-- Initial Deposit -->
                <div class="space-y-2">
                  <Label>Initial Deposit</Label>
                  <input
                    v-model="editForm.initial_deposit"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                  <InputError v-if="editErrors.initial_deposit" :message="editErrors.initial_deposit?.[0] ?? editErrors.initial_deposit" />
                </div>

                <!-- Opening Balance -->
                <div class="space-y-2">
                  <Label>Opening Balance</Label>
                  <input
                    v-model="editForm.opening_balance"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                  <InputError v-if="editErrors.opening_balance" :message="editErrors.opening_balance?.[0] ?? editErrors.opening_balance" />
                </div>

                <!-- Consider Min Balance -->
                <div class="space-y-2">
                  <Label>Consider Minimum Balance</Label>
                  <select
                    v-model="editForm.consider_min_balance"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  >
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                </div>
              </form>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <button
                type="button"
                @click="closeEdit"
                class="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="submitEdit"
                :disabled="editProcessing"
                class="inline-flex items-center gap-2 rounded-full  bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white hover: bg-nfuko-primary/90 transition-colors disabled:opacity-60"
              >
                <Spinner v-if="editProcessing" class="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>

  <!-- Create Savings Account Drawer -->
  <Transition name="drawer-fade">
    <div v-if="showCreate" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeCreate"></div>

      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl ring-1 ring-black/5"
          role="dialog"
          aria-label="Add Savings Account"
        >
          <div class="flex h-full flex-col">
            <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <div>
                <h3 class="text-[15px] font-bold text-neutral-900">Add Savings Account</h3>
                <p class="text-xs text-neutral-500">Create a savings account for eligible members.</p>
              </div>
              <button
                type="button"
                @click="closeCreate"
                class="h-8 w-8 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <form @submit.prevent="submitCreate" class="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <!-- Member Search -->
              <div class="space-y-2">
                <Label>Member</Label>
                <SearchableSelect
                  :modelValue="memberSelectValue"
                  @update:modelValue="memberSelectValue = $event"
                  :options="memberSelectOptions"
                  placeholder="Search by name or member number"
                />
                <InputError v-if="createErrors.member_id" :message="createErrors.member_id" />

                <div v-if="selectedMember" class="mt-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                  <div class="text-sm font-semibold text-neutral-900">{{ selectedMember.name }}</div>
                  <div class="text-xs text-neutral-500">Member #{{ selectedMember.member_number }} · {{ selectedMember.status }}</div>
                  <p v-if="memberHasAccounts" class="mt-2 text-xs font-semibold text-amber-600">
                    This member already has {{ selectedMember.savings_accounts.length }} savings account(s).
                  </p>
                  <p v-else class="mt-2 text-xs text-emerald-600 font-semibold">
                    Eligible: no existing savings account.
                  </p>
                </div>
              </div>

              <!-- Savings Product -->
              <div class="space-y-2">
                <Label>Account Type</Label>
                <SearchableSelect
                  :modelValue="newAccountForm.savings_product_id"
                  @update:modelValue="newAccountForm.savings_product_id = $event"
                  :options="productOptions"
                  placeholder="Select savings product"
                  :error="createErrors.savings_product_id"
                />
              </div>

              <!-- Is New Account -->
              <div class="space-y-2">
                <Label>Is New Account</Label>
                <SearchableSelect
                  :modelValue="isNewAccountValue"
                  @update:modelValue="setIsNewAccount($event)"
                  :options="isNewAccountOptions"
                  placeholder="Select"
                />
              </div>

              <!-- New Account fields -->
              <template v-if="newAccountForm.is_new_account">
                <div class="space-y-2">
                  <Label>Charges</Label>
                  <div class="relative">
                    <div
                      @click="showChargeDropdown = !showChargeDropdown"
                      class="min-h-[46px] cursor-pointer rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5"
                    >
                      <template v-if="newAccountForm.charges.length">
                        <span
                          v-for="cid in newAccountForm.charges"
                          :key="cid"
                          class="mr-1 inline-flex items-center gap-1 rounded-md border border-bg-nfuko-yellow/20 bg-bg-nfuko-yellow/10 px-2.5 py-1 text-[11px] font-semibold text-bg-nfuko-yellow"
                        >
                          {{ getChargeNameById(cid) }}
                        </span>
                      </template>
                      <span v-else class="text-xs text-neutral-400">Select charges</span>
                    </div>

                    <div
                      v-if="showChargeDropdown"
                      class="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl"
                    >
                      <div v-if="!selectedProductCharges.length" class="px-4 py-3 text-sm text-neutral-400">
                        Select an account type first
                      </div>
                      <button
                        v-for="charge in selectedProductCharges"
                        :key="charge.id"
                        type="button"
                        @click="toggleCharge(charge.id!)"
                        class="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-50"
                      >
                        <span class="capitalize">{{ charge.type }}</span>
                        <span class="text-xs text-neutral-400">{{ isChargeSelected(charge.id!) ? 'Selected' : '' }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="space-y-2">
                    <Label>Initial Deposit</Label>
                    <input
                      v-model="newAccountForm.initial_deposit"
                      type="number"
                      step="0.01"
                      min="0"
                      class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-[ bg-nfuko-primary]"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label>Consider Minimum Balance</Label>
                  <SearchableSelect
                    :modelValue="minBalanceValue"
                    @update:modelValue="setMinBalance($event)"
                    :options="minBalanceOptions"
                    placeholder="Select"
                  />
                </div>
              </template>

              <!-- Existing Account Credit -->
              <template v-else>
                <div>
                  <Label>Credited Account</Label>
                  <SearchableSelect
                    :modelValue="newAccountForm.credited_account_id"
                    @update:modelValue="newAccountForm.credited_account_id = $event"
                    :options="creditedAccountOptions"
                    placeholder="Select account"
                    :disabled="!creditedAccountOptions.length"
                  />
                  <p v-if="!creditedAccountOptions.length" class="mt-1 text-xs text-amber-600">
                    This member has no existing savings account to credit.
                  </p>
                </div>
              </template>

              <div class="space-y-2">
                <Label>Status</Label>
                <select
                  v-model="newAccountForm.status"
                  class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus: border-nfuko-primary focus:ring-1 focus:ring-[ bg-nfuko-primary]"
                >
                  <option value="active">Active</option>
                  <option value="dormant">Dormant</option>
                </select>
              </div>
            </form>

            <div class="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
              <button
                type="button"
                @click="closeCreate"
                class="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="submitCreate"
                :disabled="createProcessing || memberHasAccounts"
                class="inline-flex items-center gap-2 rounded-full  bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white hover: bg-nfuko-primary/90 transition-colors disabled:opacity-60"
              >
                <Spinner v-if="createProcessing" class="h-4 w-4" />
                Create Account
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
