<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, Pencil, X } from 'lucide-vue-next'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import { toast } from 'vue-sonner'
import InterestPostingHistory from './InterestPostingHistory.vue'
import FdMaturityDrawer from './FdMaturityDrawer.vue'

const props = defineProps<{
  currency: string
  formatBalance: (v: string | number) => string
  statusClass: (s: string) => string
}>()

const emit = defineEmits<{
  editAccount: [account: any]
}>()

const open = ref(false)
const loading = ref(false)
const account = ref<Record<string, any> | null>(null)

const isFixedDeposit = computed(() => account.value?.account_type === 'fixed')

const isMatured = computed(() => {
  if (!isFixedDeposit.value || !account.value?.maturity_date) return false
  return new Date(account.value.maturity_date) <= new Date()
})

const maturityDrawerRef = ref<InstanceType<typeof FdMaturityDrawer> | null>(null)

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function openMaturityDrawer() {
  if (!account.value) return
  maturityDrawerRef.value?.openDrawer({
    id: account.value.id,
    account_no: account.value.account_no,
    maturity_date: account.value.maturity_date ?? null,
  })
}

function onMaturitySuccess() {
  if (account.value) openDrawer({ id: account.value.id })
}

async function openDrawer(row: { id: number }) {
  account.value = null
  loading.value = true
  open.value = true
  try {
    const res = await savingsAccountsApi.show(row.id)
    account.value = res.data?.data ?? res.data
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to load account details.')
    open.value = false
  } finally {
    loading.value = false
  }
}

function close() {
  open.value = false
  account.value = null
}

defineExpose({ openDrawer })
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="View Savings Account"
        >
          <div class="flex h-full flex-col">
            <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <div class="flex items-center gap-3">
                <button type="button" @click="close"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                  <ArrowLeft class="h-4 w-4" />
                </button>
                <div>
                  <h3 class="text-[15px] font-bold text-neutral-900 dark:text-white">Account Details</h3>
                  <p class="text-xs text-neutral-500">View savings account information.</p>
                </div>
              </div>
              <button type="button" @click="close"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                <X class="h-4 w-4" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-5">
              <div v-if="loading" class="space-y-6">
                <div v-for="i in 6" :key="i" class="space-y-2">
                  <div class="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  <div class="h-5 w-48 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>

              <div v-else-if="account" class="space-y-6">
                <div class="rounded-2xl border border-neutral-100 bg-gradient-to-br from-neutral-50 to-white p-5 dark:border-neutral-800 dark:from-neutral-800/50 dark:to-neutral-900">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs font-medium uppercase tracking-wider text-neutral-400">Account Number</p>
                      <p class="mt-1 text-xl font-bold text-neutral-900 dark:text-white">{{ account.account_no }}</p>
                    </div>
                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize" :class="statusClass(account.status)">
                      {{ account.status }}
                    </span>
                  </div>
                  <div class="mt-4 flex items-baseline gap-1">
                    <span class="text-sm text-neutral-500">Balance</span>
                    <span class="text-2xl font-bold text-[#3ab88a]">{{ props.currency }} {{ formatBalance(account.balance ?? 0) }}</span>
                  </div>
                </div>

                <div class="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Account Type</span>
                    <span class="text-sm font-semibold text-neutral-900 capitalize dark:text-white">{{ account.account_type ?? '—' }}</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Member</span>
                    <div class="text-right">
                      <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ account.member?.name ?? '—' }}</p>
                      <p class="text-xs text-neutral-400">{{ account.member?.member_number ?? '' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Savings Product</span>
                    <span v-if="account.savings_product" class="inline-flex rounded-full border border-[#3ab88a]/30 bg-[#3ab88a]/10 px-3 py-1 text-xs font-semibold text-[#3ab88a]">
                      {{ account.savings_product.name }}
                    </span>
                    <span v-else class="text-sm text-neutral-400">—</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Initial Deposit</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ props.currency }} {{ formatBalance(account.initial_deposit ?? 0) }}</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Opening Balance</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ props.currency }} {{ formatBalance(account.opening_balance ?? 0) }}</span>
                  </div>
                  <div class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Min Balance Enforced</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ account.consider_min_balance ? 'Yes' : 'No' }}</span>
                  </div>
                  <div v-if="account.created_at" class="flex items-center justify-between px-5 py-3.5">
                    <span class="text-sm text-neutral-500">Created</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ new Date(account.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</span>
                  </div>
                </div>

                <!-- FD Info Section -->
                <div v-if="isFixedDeposit" class="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/10">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Fixed Deposit</p>
                    <span
                      :class="[
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        isMatured
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                      ]"
                    >
                      {{ isMatured ? 'Matured' : 'Active' }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs text-neutral-500">Tenor</p>
                      <p class="font-medium text-neutral-800 dark:text-neutral-200">
                        {{ account.tenor_months != null ? account.tenor_months + ' months' : '—' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-neutral-500">Maturity Date</p>
                      <p class="font-medium text-neutral-800 dark:text-neutral-200">
                        {{ formatDate(account.maturity_date) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-neutral-500">Interest Rate</p>
                      <p class="font-medium text-neutral-800 dark:text-neutral-200">
                        {{ account.interest_rate != null ? (account.interest_rate * 100).toFixed(2) + '%' : '—' }} p.a.
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-neutral-500">Next Interest Date</p>
                      <p class="font-medium text-neutral-800 dark:text-neutral-200">
                        {{ formatDate(account.next_interest_date) }}
                      </p>
                    </div>
                  </div>

                  <!-- Process Maturity Button -->
                  <button
                    v-if="isMatured"
                    type="button"
                    @click="openMaturityDrawer"
                    class="mt-1 w-full rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200 transition dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
                  >
                    Process Maturity
                  </button>
                </div>

                <!-- Interest Posting History -->
                <div v-if="isFixedDeposit">
                  <InterestPostingHistory :account-id="account.id" :currency="currency" />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <button type="button" @click="close"
                class="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800">
                Close
              </button>
              <button v-if="account" type="button" @click="() => { close(); emit('editAccount', account) }"
                class="inline-flex items-center gap-2 rounded-full bg-nfuko-primary px-5 py-2 text-sm font-semibold text-white hover:bg-nfuko-primary/90 transition-colors">
                <Pencil class="h-3.5 w-3.5" />
                Edit Account
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>

  <FdMaturityDrawer
    ref="maturityDrawerRef"
    @success="onMaturitySuccess"
  />
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
