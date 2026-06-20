<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { X, Lock, Wallet } from 'lucide-vue-next'
import { InputError, Label, Spinner, formatMoneyValue } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import { useCurrencyStore } from '@/stores/currency'
import { toast } from 'vue-sonner'
import type { SavingsProduct } from '@/tenant/apis/savingsProducts/api'

const props = defineProps<{
  savingsProducts: SavingsProduct[]
}>()

const emit = defineEmits<{ success: [] }>()

const currencyStore = useCurrencyStore()
const { currencyCode } = storeToRefs(currencyStore)

const open = ref(false)
const loading = ref(false)
const processing = ref(false)
const errors = ref<Record<string, any>>({})
const accountId = ref(0)

type AccountMeta = {
  account_no?: string
  balance?: string | number
  status?: string
  member?: { name?: string; member_number?: string } | null
}
const meta = ref<AccountMeta>({})

const form = ref({
  savings_product_id: '' as string | number,
  account_type: '',
  status: 'active',
  initial_deposit: '' as string | number,
  opening_balance: '' as string | number,
  consider_min_balance: false,
})

const productOptions = computed(() =>
  (props.savingsProducts ?? []).map(p => ({ id: p.id!, name: p.name }))
)

const initials = computed(() => {
  const n = meta.value.member?.name?.trim()
  if (!n) return '--'
  const parts = n.split(/\s+/)
  return (parts[0]?.[0] ?? '' ) + (parts[1]?.[0] ?? '')
})

const statusTone = computed(() => {
  switch (form.value.status) {
    case 'active': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
    case 'dormant': return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
    case 'closed': return 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400'
    default: return 'bg-neutral-100 text-neutral-600 ring-neutral-500/20'
  }
})

watch(() => form.value.savings_product_id, (newVal) => {
  if (!newVal) return
  const product = props.savingsProducts.find(p => p.id === Number(newVal))
  if (product) form.value.account_type = product.type
})

async function openDrawer(account: { id: number } & AccountMeta, prefetchedData?: Record<string, any>) {
  errors.value = {}
  loading.value = true
  open.value = true
  accountId.value = account.id
  meta.value = {
    account_no: account.account_no,
    balance: account.balance,
    status: account.status,
    member: account.member,
  }
  try {
    const data = prefetchedData ?? (await savingsAccountsApi.show(account.id)).data?.data
    form.value = {
      savings_product_id: data.savings_product?.id ?? data.savings_product_id ?? '',
      account_type: data.account_type ?? '',
      status: data.status ?? 'active',
      initial_deposit: data.initial_deposit ?? '',
      opening_balance: data.opening_balance ?? '',
      consider_min_balance: data.consider_min_balance ?? false,
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'Failed to load account for editing.')
    open.value = false
  } finally {
    loading.value = false
  }
}

async function submit() {
  processing.value = true
  errors.value = {}
  try {
    await savingsAccountsApi.update(accountId.value, form.value)
    toast.success('Account updated successfully.')
    open.value = false
    emit('success')
  } catch (err: any) {
    if (err?.response?.status === 422) {
      errors.value = err.response.data.errors || {}
    } else {
      toast.error(err?.response?.data?.message ?? 'Failed to update account.')
    }
  } finally {
    processing.value = false
  }
}

function close() {
  open.value = false
  errors.value = {}
}

defineExpose({ openDrawer })
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm" @click="close"></div>
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-neutral-50 shadow-2xl dark:bg-neutral-950"
          role="dialog"
          aria-label="Edit Savings Account"
        >
          <!-- Identity header -->
          <header class="relative overflow-hidden bg-nfuko-primary-800 px-6 pb-5 pt-5 text-white">
            <div class="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/5"></div>
            <div class="absolute -bottom-16 -left-6 h-32 w-32 rounded-full bg-white/5"></div>

            <div class="relative flex items-start justify-between">
              <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">Edit savings account</span>
              <button type="button" @click="close" aria-label="Close"
                class="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                <X class="h-4 w-4" />
              </button>
            </div>

            <div class="relative mt-4 flex items-center gap-3.5">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sm font-bold uppercase ring-1 ring-white/20">
                {{ initials }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-[15px] font-semibold leading-tight">
                  {{ meta.member?.name ?? 'Member' }}
                </p>
                <p class="mt-0.5 flex items-center gap-2 text-xs text-white/70">
                  <span class="font-mono">{{ meta.account_no ?? 'N/A' }}</span>
                  <span v-if="meta.member?.member_number" class="h-1 w-1 rounded-full bg-white/40"></span>
                  <span v-if="meta.member?.member_number">{{ meta.member.member_number }}</span>
                </p>
              </div>
            </div>

            <div class="relative mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 ring-1 ring-white/10">
              <span class="flex items-center gap-2 text-xs font-medium text-white/70">
                <Wallet class="h-3.5 w-3.5" /> Current balance
              </span>
              <span class="text-sm font-bold tabular-nums">
                {{ currencyCode }} {{ formatMoneyValue(Number(meta.balance ?? 0)) }}
              </span>
            </div>
          </header>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <div v-if="loading" class="space-y-5">
              <div v-for="i in 5" :key="i" class="space-y-2">
                <div class="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div class="h-11 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
            </div>

            <form v-else @submit.prevent="submit" class="space-y-6">
              <!-- Section: configuration -->
              <section class="rounded-2xl border border-neutral-200/70 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h4 class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Configuration</h4>
                <div class="space-y-4">
                  <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Savings Product</Label>
                    <SearchableSelect
                      :modelValue="form.savings_product_id"
                      @update:modelValue="form.savings_product_id = $event"
                      :options="productOptions"
                      placeholder="Select savings product"
                      state="edit-account-product"
                      :error="errors.savings_product_id?.[0] ?? errors.savings_product_id"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Account Type</Label>
                    <div class="relative">
                      <input
                        :value="form.account_type"
                        type="text"
                        disabled
                        placeholder="Set by product"
                        class="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3.5 py-2.5 text-sm capitalize text-neutral-500 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                      />
                      <Lock class="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                    </div>
                    <p class="text-[11px] text-neutral-400">Derived from the selected product.</p>
                  </div>

                  <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Status</Label>
                    <div class="flex items-center gap-2.5">
                      <select v-model="form.status"
                        class="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm capitalize outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/15 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                        <option value="active">Active</option>
                        <option value="dormant">Dormant</option>
                        <option value="closed">Closed</option>
                      </select>
                      <span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset" :class="statusTone">
                        {{ form.status }}
                      </span>
                    </div>
                    <InputError v-if="errors.status" :message="errors.status?.[0] ?? errors.status" />
                  </div>

                  <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Consider Minimum Balance</Label>
                    <select v-model="form.consider_min_balance"
                      class="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/15 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                      <option :value="true">Yes</option>
                      <option :value="false">No</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- Section: balances -->
              <section class="rounded-2xl border border-neutral-200/70 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h4 class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Balances</h4>
                <div class="space-y-4">
                  <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Initial Deposit</Label>
                    <div class="relative">
                      <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400">{{ currencyCode }}</span>
                      <input v-model="form.initial_deposit" type="number" step="0.01" min="0"
                        class="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-12 pr-3.5 text-sm tabular-nums outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/15 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                    <InputError v-if="errors.initial_deposit" :message="errors.initial_deposit?.[0] ?? errors.initial_deposit" />
                  </div>

                  <div class="space-y-1.5">
                    <Label class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Opening Balance</Label>
                    <div class="relative">
                      <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400">{{ currencyCode }}</span>
                      <input v-model="form.opening_balance" type="number" step="0.01" min="0"
                        class="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-12 pr-3.5 text-sm tabular-nums outline-none transition focus:border-nfuko-primary focus:ring-2 focus:ring-nfuko-primary/15 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                    <InputError v-if="errors.opening_balance" :message="errors.opening_balance?.[0] ?? errors.opening_balance" />
                  </div>
                </div>
              </section>
            </form>
          </div>

          <!-- Footer -->
          <footer class="flex items-center gap-3 border-t border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
            <button type="button" @click="close"
              class="flex-1 rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
              Cancel
            </button>
            <button type="button" @click="submit" :disabled="processing || loading"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-nfuko-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-nfuko-primary/25 transition-colors hover:bg-nfuko-primary-800 disabled:opacity-60">
              <Spinner v-if="processing" class="h-4 w-4" />
              {{ processing ? 'Saving...' : 'Save Changes' }}
            </button>
          </footer>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
