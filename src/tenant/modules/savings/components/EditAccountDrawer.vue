<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { InputError, Label, Spinner } from '@/Global'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import { toast } from 'vue-sonner'
import type { SavingsProduct } from '@/tenant/apis/savingsProducts/api'

const props = defineProps<{
  savingsProducts: SavingsProduct[]
}>()

const emit = defineEmits<{ success: [] }>()

const open = ref(false)
const loading = ref(false)
const processing = ref(false)
const errors = ref<Record<string, any>>({})
const accountId = ref(0)

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

watch(() => form.value.savings_product_id, (newVal) => {
  if (!newVal) return
  const product = props.savingsProducts.find(p => p.id === Number(newVal))
  if (product) form.value.account_type = product.type
})

async function openDrawer(account: { id: number }, prefetchedData?: Record<string, any>) {
  errors.value = {}
  loading.value = true
  open.value = true
  accountId.value = account.id
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
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>
      <Transition name="drawer-slide">
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900"
          role="dialog"
          aria-label="Edit Savings Account"
        >
          <div class="flex h-full flex-col">
            <div class="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <div>
                <h3 class="text-[15px] font-bold text-neutral-900 dark:text-white">Edit Savings Account</h3>
                <p class="text-xs text-neutral-500">Update savings account details.</p>
              </div>
              <button type="button" @click="close"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800 dark:hover:text-white">
                <X class="h-4 w-4" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-5">
              <div v-if="loading" class="space-y-6">
                <div v-for="i in 5" :key="i" class="space-y-2">
                  <div class="h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                  <div class="h-10 w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>

              <form v-else @submit.prevent="submit" class="space-y-5">
                <div class="space-y-2">
                  <Label>Savings Product</Label>
                  <SearchableSelect
                    :modelValue="form.savings_product_id"
                    @update:modelValue="form.savings_product_id = $event"
                    :options="productOptions"
                    placeholder="Select savings product"
                    state="edit-account-product"
                    :error="errors.savings_product_id?.[0] ?? errors.savings_product_id"
                  />
                </div>

                <div class="space-y-2">
                  <Label>Account Type</Label>
                  <input
                    :value="form.account_type"
                    type="text"
                    disabled
                    class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-500 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                  />
                </div>

                <div class="space-y-2">
                  <Label>Status</Label>
                  <select v-model="form.status"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                    <option value="active">Active</option>
                    <option value="dormant">Dormant</option>
                    <option value="closed">Closed</option>
                  </select>
                  <InputError v-if="errors.status" :message="errors.status?.[0] ?? errors.status" />
                </div>

                <div class="space-y-2">
                  <Label>Initial Deposit</Label>
                  <input v-model="form.initial_deposit" type="number" step="0.01" min="0"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                  <InputError v-if="errors.initial_deposit" :message="errors.initial_deposit?.[0] ?? errors.initial_deposit" />
                </div>

                <div class="space-y-2">
                  <Label>Opening Balance</Label>
                  <input v-model="form.opening_balance" type="number" step="0.01" min="0"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                  <InputError v-if="errors.opening_balance" :message="errors.opening_balance?.[0] ?? errors.opening_balance" />
                </div>

                <div class="space-y-2">
                  <Label>Consider Minimum Balance</Label>
                  <select v-model="form.consider_min_balance"
                    class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-nfuko-primary focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                </div>
              </form>
            </div>

            <div class="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <button type="button" @click="close"
                class="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800">
                Cancel
              </button>
              <button type="button" @click="submit" :disabled="processing"
                class="inline-flex items-center gap-2 rounded-full bg-[#052659] px-5 py-2 text-sm font-semibold text-white hover:bg-[#052659]/90 transition-colors disabled:opacity-60">
                <Spinner v-if="processing" class="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
