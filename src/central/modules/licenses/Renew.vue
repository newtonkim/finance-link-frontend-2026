<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
    <!-- Header -->
    <div class="px-6 pt-6 pb-5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-400">
            <button class="text-blue-600 hover:underline font-semibold" @click="router.push('/central/licenses')">Admin</button>
            <span>/</span>
            <span class="text-neutral-600 dark:text-neutral-300 font-semibold">Payment Plan</span>
          </div>
          <h1 class="text-3xl font-black tracking-tight">Renew License Subscription</h1>
          <p class="mt-1.5 text-sm text-neutral-500">
            Choose a payment method to renew this tenant subscription and keep access active.
          </p>
        </div>
        <div class="flex gap-3">
          <button
            class="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-5 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            @click="toggleInvoices"
          >
            <ReceiptText class="size-4" />
            View Invoices
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
            :disabled="submitting || loading"
            @click="confirmRenewal"
          >
            <CheckCircle2 class="size-4" />
            Confirm Renewal
          </button>
        </div>
      </div>
    </div>

    <div class="px-6 py-6">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24 text-sm text-neutral-400">
        <div class="flex flex-col items-center gap-3">
          <div class="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Loading renewal details...</span>
        </div>
      </div>

      <template v-else>
        <!-- Summary cards -->
        <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
              <Crown class="size-6" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Current Plan</p>
              <p class="mt-1 truncate text-lg font-black">{{ preview.plan_name || '-' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-300">
              <CalendarDays class="size-6" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Renewal Period</p>
              <p class="mt-1 truncate text-lg font-black">{{ renewalPeriod }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-300">
              <Clock3 class="size-6" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Next Billing Date</p>
              <p class="mt-1 truncate text-lg font-black">{{ formatDate(preview.next_billing_date) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-300">
              <WalletCards class="size-6" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">Amount Due</p>
              <p class="mt-1 truncate text-lg font-black text-red-500">{{ formatMoney(preview.total) }}</p>
            </div>
          </div>
        </div>

        <!-- Main grid -->
        <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <!-- Payment method panel -->
          <section class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <h2 class="text-xl font-black tracking-tight">Select Payment Method</h2>

            <!-- Method tabs -->
            <div class="mt-5 flex gap-2">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                type="button"
                :class="[
                  'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-150',
                  form.payment_method === method.value
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700',
                ]"
                @click="selectPaymentMethod(method.value)"
              >
                <component :is="method.icon" class="size-4" />
                {{ method.label }}
              </button>
            </div>

            <!-- Provider pills -->
            <div class="mt-5">
              <p class="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2.5">Provider</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="p in currentProviders"
                  :key="p.value"
                  type="button"
                  :class="[
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border-2 transition-all duration-150',
                    form.provider === p.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300',
                  ]"
                  @click="form.provider = p.value"
                >
                  <span :class="['text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none', p.badgeClass]">
                    {{ p.badge }}
                  </span>
                  {{ p.label }}
                </button>
              </div>
            </div>

            <!-- Form fields -->
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <!-- Amount (read-only, from plan) -->
              <label class="flex flex-col gap-1.5">
                <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Amount to Pay</span>
                <div class="field bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between cursor-default">
                  <span class="font-black text-blue-600">{{ formatMoney(preview.total) }}</span>
                  <span class="text-xs font-semibold text-neutral-400 ml-2">{{ preview.currency || 'UGX' }}</span>
                </div>
              </label>

              <label class="flex flex-col gap-1.5">
                <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">
                  {{ form.payment_method === 'bank' ? 'Account Number' : 'Phone Number' }}
                </span>
                <input
                  v-model="form.phone_number"
                  class="field"
                  :type="form.payment_method === 'bank' ? 'text' : 'tel'"
                  :placeholder="form.payment_method === 'bank' ? 'e.g. 0001234567890' : 'e.g. 0772 123 456'"
                />
              </label>

              <label class="flex flex-col gap-1.5 md:col-span-2">
                <span class="text-xs font-bold uppercase tracking-wide text-neutral-400">Account Name</span>
                <input v-model="form.account_name" class="field" placeholder="e.g. John Doe" />
              </label>
            </div>

            <label class="mt-4 flex items-center gap-3 cursor-pointer select-none">
              <div
                class="relative flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
                :class="form.save_payment_method ? 'bg-blue-600 border-blue-600' : 'border-neutral-300 dark:border-neutral-600'"
                @click="form.save_payment_method = !form.save_payment_method"
              >
                <svg v-if="form.save_payment_method" class="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">Save this payment method for future renewals</span>
            </label>

            <div class="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-5 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                  <LockKeyhole class="size-4" />
                </div>
                <div class="text-xs text-neutral-500 leading-relaxed">
                  <p class="font-bold text-neutral-700 dark:text-neutral-300">Secure Payment</p>
                  <p>Payments are encrypted and securely processed.</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button
                  class="rounded-xl px-5 py-2.5 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  @click="router.push('/central/licenses')"
                >
                  Cancel
                </button>
                <button
                  class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  :disabled="submitting"
                  @click="confirmRenewal"
                >
                  <LockKeyhole class="size-4" />
                  {{ submitting ? 'Processing...' : `Pay ${formatMoney(preview.total)}` }}
                </button>
              </div>
            </div>
          </section>

          <!-- Order summary panel -->
          <aside class="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <h2 class="text-xl font-black tracking-tight">Order Summary</h2>
              <span :class="['inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', statusBadgeClass]">
                <div class="size-1.5 rounded-full bg-current opacity-70" />
                Current License {{ preview.status_label || 'Active' }}
              </span>
            </div>

            <!-- Plan highlight box -->
            <div class="mt-4 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  <Crown class="size-5" />
                </div>
                <div>
                  <p class="text-xs font-semibold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide">License Plan</p>
                  <p class="text-base font-black text-blue-900 dark:text-blue-100">{{ preview.plan_name || '-' }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Per {{ billingCycleLabel }}</p>
                <p class="text-base font-black text-blue-700 dark:text-blue-300">{{ formatMoney(preview.subtotal) }}</p>
              </div>
            </div>

            <dl class="mt-5 space-y-3.5">
              <div class="flex items-center justify-between gap-4 text-sm">
                <dt class="text-neutral-500 font-medium">Tenant</dt>
                <dd class="font-bold text-right truncate max-w-[55%]">{{ preview.tenant || '-' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 text-sm">
                <dt class="text-neutral-500 font-medium">Billing Cycle</dt>
                <dd class="font-bold text-right capitalize">{{ billingCycleLabel }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 text-sm">
                <dt class="text-neutral-500 font-medium">Renewal Start</dt>
                <dd class="font-bold text-right">{{ formatDate(preview.renewal_start) }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 text-sm">
                <dt class="text-neutral-500 font-medium">Renewal End</dt>
                <dd class="font-bold text-right">{{ formatDate(preview.renewal_end) }}</dd>
              </div>
            </dl>

            <div class="my-5 border-t border-dashed border-neutral-200 dark:border-neutral-700" />

            <dl class="space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-neutral-500 font-medium">Subtotal</dt>
                <dd class="font-bold">{{ formatMoney(preview.subtotal) }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-neutral-500 font-medium">Service Fee</dt>
                <dd class="font-bold">{{ formatMoney(preview.service_fee) }}</dd>
              </div>
            </dl>

            <div class="my-5 border-t border-neutral-200 dark:border-neutral-700" />

            <div class="flex items-center justify-between">
              <span class="text-base font-black">Total</span>
              <span class="text-xl font-black text-blue-600">{{ formatMoney(preview.total) }}</span>
            </div>

            <div class="mt-5 flex gap-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4 text-sm text-blue-900 dark:text-blue-200">
              <Info class="mt-0.5 size-4 shrink-0 text-blue-500" />
              <span class="font-semibold">Your subscription will renew immediately after successful payment.</span>
            </div>

            <!-- Invoices drawer -->
            <div v-if="showInvoices" class="mt-5 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <h3 class="text-sm font-black">Recent Invoices</h3>
                <button class="text-xs font-bold text-neutral-400 hover:text-neutral-600" @click="showInvoices = false">Hide</button>
              </div>
              <div v-if="loadingInvoices" class="p-4 text-sm text-neutral-400 text-center">Loading invoices...</div>
              <div v-else-if="!invoices.length" class="p-4 text-sm text-neutral-400 text-center">No invoices found.</div>
              <div v-else class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <div v-for="invoice in invoices" :key="invoice.id" class="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p class="font-bold">{{ invoice.invoice_number }}</p>
                    <p class="text-xs text-neutral-400 mt-0.5">{{ formatDate(invoice.paid_at || invoice.due_at) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-black">{{ formatMoney(invoice.total) }}</p>
                    <span class="text-xs font-bold text-green-600">{{ invoice.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pomPinia } from 'septor-store'
import {
  Banknote, CalendarDays, CheckCircle2, Clock3, Crown,
  Info, LockKeyhole, ReceiptText, Smartphone, WalletCards, CreditCard,
} from 'lucide-vue-next'
import { fetchTableData } from '@/Global/landingLayout/util'
import { notify } from '@/Global/Toasters/ToastMsg'

const route = useRoute()
const router = useRouter()
const Store = pomPinia() as any

const loading = ref(true)
const submitting = ref(false)
const loadingInvoices = ref(false)
const preview = ref<Record<string, any>>({})
const invoices = ref<any[]>([])
const showInvoices = ref(false)

const form = reactive({
  payment_method: 'mobile_money',
  provider: 'mtn',
  phone_number: '',
  account_name: '',
  save_payment_method: true,
})

const paymentMethods = [
  { label: 'Mobile Money', value: 'mobile_money', icon: Smartphone },
  { label: 'Card', value: 'card', icon: CreditCard },
  { label: 'Bank', value: 'bank', icon: Banknote },
]

const allProviders: Record<string, Array<{ value: string; label: string; badge: string; badgeClass: string }>> = {
  mobile_money: [
    { value: 'mtn', label: 'MTN Mobile Money', badge: 'MTN', badgeClass: 'bg-yellow-400 text-yellow-900' },
    { value: 'airtel', label: 'Airtel Money', badge: 'AIR', badgeClass: 'bg-red-500 text-white' },
  ],
  card: [
    { value: 'visa', label: 'Visa Card', badge: 'VISA', badgeClass: 'bg-blue-700 text-white' },
    { value: 'mastercard', label: 'Mastercard', badge: 'MC', badgeClass: 'bg-orange-500 text-white' },
  ],
  bank: [
    { value: 'bank', label: 'Bank Transfer', badge: 'BNK', badgeClass: 'bg-neutral-700 text-white' },
  ],
}

const currentProviders = computed(() => allProviders[form.payment_method] ?? [])

function selectPaymentMethod(method: string) {
  form.payment_method = method
  // default to first provider of the new method
  form.provider = allProviders[method]?.[0]?.value ?? ''
}

// keep provider in sync if user somehow ends up with wrong provider
watch(currentProviders, (providers) => {
  if (!providers.find((p) => p.value === form.provider)) {
    form.provider = providers[0]?.value ?? ''
  }
})

const statusBadgeClass = computed(() => {
  const status = (preview.value.status_label ?? '').toLowerCase()
  if (status === 'active') return 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300'
  if (status === 'trial') return 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
  if (status === 'expired') return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
  if (status === 'in grace') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
  if (status === 'suspended') return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
  return 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300'
})

const renewalPeriod = computed(() => {
  const months = Number(preview.value.renewal_months ?? 0)
  return months > 0 ? `${months} ${months === 1 ? 'Month' : 'Months'}` : 'Custom'
})

const billingCycleLabel = computed(() => {
  const cycle = `${preview.value.billing_cycle ?? ''}`.replace(/_/g, ' ')
  return cycle ? cycle.charAt(0).toUpperCase() + cycle.slice(1) : '-'
})

async function loadPreview() {
  loading.value = true
  const res = await fetchTableData({
    data: { id: route.params.id },
    props: { state: 'licenseRenewalPreview', url: 'central/licenses/renewal-preview', reload: false, time: 0 },
    Store,
  })
  preview.value = res?.payload ?? {}
  loading.value = false
}

async function toggleInvoices() {
  if (showInvoices.value) {
    showInvoices.value = false
    return
  }
  showInvoices.value = true
  if (invoices.value.length) return
  loadingInvoices.value = true
  const res = await fetchTableData({
    data: { id: route.params.id },
    props: { state: 'licenseRenewalInvoices', url: 'central/licenses/invoices', reload: false, time: 0 },
    Store,
  })
  invoices.value = res?.payload ?? []
  loadingInvoices.value = false
}

async function confirmRenewal() {
  if (!form.provider) {
    notify({ msg: 'Please select a provider.', type: 'error' })
    return
  }
  submitting.value = true
  const res = await fetchTableData({
    data: {
      id: route.params.id,
      plan_id: preview.value.plan_id,
      billing_cycle: preview.value.billing_cycle,
      ...form,
    },
    props: { state: 'licenseRenewalSubmit', url: 'central/licenses/renew', reload: false, time: 0 },
    Store,
  })
  submitting.value = false

  if (res?.error || res?.payload?.error) {
    notify({ msg: res?.payload?.message ?? res?.error?.message ?? 'Failed to renew license.', type: 'error' })
    return
  }

  notify({ msg: res?.payload?.message ?? 'License renewed successfully.', type: 'success' })
  router.push('/central/licenses')
}

function formatMoney(value: any) {
  const amount = Number(value ?? 0)
  return `UGX ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatDate(value: any) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(loadPreview)
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.75rem;
  border: 1.5px solid rgb(229 231 235);
  background: transparent;
  padding: 0.8125rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.15);
}

.dark .field {
  border-color: rgb(55 65 81);
}

.dark .field:focus {
  border-color: rgb(96 165 250);
}
</style>
