<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Search, Zap, Clock, CheckCircle2, Eye, Plus } from 'lucide-vue-next'
import { fixedDepositsApi } from '@/tenant/apis/fixedDeposits/fixedDepositsApi'
import { toast } from 'vue-sonner'
import { useCurrencyStore } from '@/stores/currency'
import ViewAccountDrawer from '../components/ViewAccountDrawer.vue'
import EditAccountDrawer from '../components/EditAccountDrawer.vue'
import CreateAccountDrawer from '../components/CreateAccountDrawer.vue'
import { useRouter } from 'vue-router'
import { setLocalValues } from '@/Global'
import { savingsProductsApi } from '@/tenant/apis/savingsProducts/api'
import { licenseState } from '@/tenant/apis/licenseState'

const router = useRouter()

interface FdAccount {
  id: number
  account_no: string
  balance: string
  status: string
  maturity_date: string | null
  next_interest_date: string | null
  tenor_months: number | null
  member: { id: number; name: string; member_number: string } | null
  savings_product: { id: number; name: string } | null
}

interface SweepResult { posted: number; skipped: number; matured: number; errors: number }
interface Meta { current_page: number; last_page: number; total: number }

const currencyStore = useCurrencyStore()
const currency = computed(() => currencyStore.currencyCode)

const accounts = ref<FdAccount[]>([])
const meta = ref<Meta>({ current_page: 1, last_page: 1, total: 0 })
const loading = ref(false)
const sweeping = ref(false)
const search = ref('')
const sweepResult = ref<SweepResult | null>(null)
const targetPage = ref(1)
const viewDrawer = ref<InstanceType<typeof ViewAccountDrawer> | null>(null)
const editDrawer = ref<InstanceType<typeof EditAccountDrawer> | null>(null)
const createDrawer = ref<InstanceType<typeof CreateAccountDrawer> | null>(null)
const savingsProducts = ref<any[]>([])

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchAccounts(page = 1) {
  loading.value = true
  try {
    const res = await fixedDepositsApi.list({ search: search.value || undefined, page })
    accounts.value = res.data?.data ?? []
    if (res.data?.meta) meta.value = res.data.meta
  } catch {
    toast.error('Failed to load fixed deposit accounts.')
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchAccounts(1), 400)
}

async function runSweep() {
  if (licenseState.readOnly) return
  sweeping.value = true
  sweepResult.value = null
  try {
    const res = await fixedDepositsApi.postInterest()
    sweepResult.value = res.data?.data ?? null
    toast.success(`Sweep complete — ${sweepResult.value?.posted ?? 0} postings made.`)
    await fetchAccounts(1)
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Sweep failed.')
  } finally {
    sweeping.value = false
  }
}

function isMatured(account: FdAccount) {
  if (!account.maturity_date) return false
  return new Date(account.maturity_date) <= new Date()
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatBalance(v: string | number) {
  const n = Number(v)
  return isNaN(n) ? '—' : `${currency.value} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}

async function fetchSavingsProducts() {
  try {
    const res = await savingsProductsApi.list({ status: 'active' })
    savingsProducts.value = res.data?.data ?? []
  } catch {}
}

function statusClass(s: string) {
  if (s === 'active') return 'bg-green-100 text-green-700'
  if (s === 'matured') return 'bg-red-100 text-red-700'
  return 'bg-neutral-100 text-neutral-500'
}

async function onCreateSuccess(newAccount: any) {
  await fetchAccounts(1)
  if (newAccount?.id) {
    viewDrawer.value?.openDrawer({ id: newAccount.id })
  }
}

function navigateToProfile(member: any) {
  if (!member) return
  setLocalValues('memberProfile', member)
  router.push('/tenant/member/profile')
}

onMounted(() => {
  fetchAccounts()
  fetchSavingsProducts()
})
onUnmounted(() => { if (searchTimer) clearTimeout(searchTimer) })
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Fixed Deposits</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ meta.total }} total accounts
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          :disabled="licenseState.readOnly"
          :title="licenseState.readOnly ? 'License expired — renew to add an account' : ''"
          class="inline-flex items-center gap-2 rounded-lg border-0 bg-[#052659] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#052659]/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#052659]"
          @click="createDrawer?.openDrawer()"
        >
          <Plus class="h-4 w-4" />
          Add Account
        </button>
        <button
          type="button" @click="runSweep" :disabled="sweeping || licenseState.readOnly"
          :title="licenseState.readOnly ? 'License expired — renew to post interest' : ''"
          class="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          <Zap class="h-4 w-4" />
          {{ sweeping ? 'Running sweep...' : 'Post Monthly Interest' }}
        </button>
      </div>
    </div>

    <!-- Sweep result banner -->
    <div v-if="sweepResult" class="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
      <p class="text-sm font-semibold text-green-800 dark:text-green-300">Sweep completed</p>
      <div class="mt-2 flex gap-6 text-sm text-green-700 dark:text-green-400">
        <span class="flex items-center gap-1"><CheckCircle2 class="h-4 w-4" /> {{ sweepResult.posted }} posted</span>
        <span>{{ sweepResult.skipped }} skipped</span>
        <span>{{ sweepResult.matured }} matured</span>
        <span v-if="sweepResult.errors > 0" class="text-red-600 dark:text-red-400">{{ sweepResult.errors }} errors</span>
      </div>
    </div>

    <!-- Search -->
    <div class="flex gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search" @input="onSearch" type="text"
          placeholder="Search by member or account..."
          class="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div v-if="loading" class="space-y-3 p-4">
        <div v-for="i in 5" :key="i" class="h-10 rounded bg-neutral-100 animate-pulse dark:bg-neutral-800" />
      </div>

      <div v-else-if="accounts.length === 0" class="py-16 text-center text-sm text-neutral-400">
        No fixed deposit accounts found.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-neutral-200 text-left text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            <tr>
              <th class="px-4 py-3 font-medium">Account</th>
              <th class="px-4 py-3 font-medium">Member</th>
              <th class="px-4 py-3 font-medium">Product</th>
              <th class="px-4 py-3 font-medium">Balance</th>
              <th class="px-4 py-3 font-medium">Tenor</th>
              <th class="px-4 py-3 font-medium">Maturity Date</th>
              <th class="px-4 py-3 font-medium text-right">Status</th>
              <th class="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
            <tr v-for="acc in accounts" :key="acc.id" class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
              <td class="px-4 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{{ acc.account_no }}</td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  @click="navigateToProfile(acc.member)"
                  class="text-left hover:text-nfuko-primary transition-colors group"
                >
                  <span class="block font-medium text-neutral-900 dark:text-white group-hover:text-nfuko-primary group-hover:underline transition-colors">
                    {{ acc.member?.name ?? '—' }}
                  </span>
                  <span class="block text-xs text-neutral-400">{{ acc.member?.member_number }}</span>
                </button>
              </td>
              <td class="px-4 py-3 text-neutral-500">{{ acc.savings_product?.name ?? '—' }}</td>
              <td class="px-4 py-3 font-medium text-neutral-900 dark:text-white">{{ formatBalance(acc.balance) }}</td>
              <td class="px-4 py-3 text-neutral-500">{{ acc.tenor_months != null ? acc.tenor_months + 'mo' : '—' }}</td>
              <td class="px-4 py-3 text-neutral-500">
                <div class="flex items-center gap-1">
                  <Clock v-if="!isMatured(acc)" class="h-3 w-3 text-blue-400" />
                  <span :class="isMatured(acc) ? 'text-red-600 font-medium dark:text-red-400' : ''">
                    {{ formatDate(acc.maturity_date) }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="[
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  isMatured(acc)
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                ]">
                  {{ isMatured(acc) ? 'Matured' : 'Active' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  @click="viewDrawer?.openDrawer({ id: acc.id })"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Eye class="h-3.5 w-3.5" />
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.last_page > 1" class="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <p class="text-xs text-neutral-500">Page {{ meta.current_page }} of {{ meta.last_page }}</p>
        <div class="flex gap-2">
          <button
            type="button" @click="fetchAccounts(meta.current_page - 1)"
            :disabled="meta.current_page === 1"
            class="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >Previous</button>
          <button
            type="button" @click="fetchAccounts(meta.current_page + 1)"
            :disabled="meta.current_page === meta.last_page"
            class="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >Next</button>
        </div>
      </div>
    </div>
  </div>

  <ViewAccountDrawer
    ref="viewDrawer"
    :currency="currency"
    :format-balance="formatBalance"
    :status-class="statusClass"
    @edit-account="(acc) => editDrawer?.openDrawer(acc, acc)"
  />

  <EditAccountDrawer
    ref="editDrawer"
    :savings-products="savingsProducts"
    @success="fetchAccounts(meta.current_page)"
  />

  <CreateAccountDrawer
    ref="createDrawer"
    :savings-products="savingsProducts"
    @success="onCreateSuccess"
  />
</template>
