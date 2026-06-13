<template>
  <div class="min-h-screen bg-neutral-50 px-6 py-6 text-neutral-900 dark:bg-neutral-950 dark:text-white">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div class="mb-5 flex items-center gap-2 text-sm font-semibold text-neutral-500">
          <button class="text-blue-600 hover:underline" @click="router.push('/central/licenses')">Admin</button>
          <span>/</span>
          <span>Payment Plan</span>
        </div>
        <h1 class="text-4xl font-black tracking-tight">Renew License Subscription</h1>
        <p class="mt-2 text-sm text-neutral-500">
          Choose a payment method to renew this tenant subscription and keep access active.
        </p>
      </div>

      <div class="flex gap-3">
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
          @click="loadInvoices"
        >
          <ReceiptText class="size-4" />
          View Invoices
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          :disabled="submitting || loading"
          @click="confirmRenewal"
        >
          <CheckCircle2 class="size-4" />
          Confirm Renewal
        </button>
      </div>
    </div>

    <div v-if="loading" class="rounded-xl border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      Loading renewal details...
    </div>

    <template v-else>
      <div class="mb-6 grid gap-4 lg:grid-cols-4">
        <SummaryCard :icon="Crown" tone="blue" label="Current Plan" :value="preview.current_plan || preview.plan_name" />
        <SummaryCard :icon="CalendarDays" tone="green" label="Renewal Period" :value="renewalPeriod" />
        <SummaryCard :icon="Clock3" tone="amber" label="Next Billing Date" :value="formatDate(preview.next_billing_date)" />
        <SummaryCard :icon="WalletCards" tone="red" label="Amount Due" :value="formatMoney(preview.total)" />
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 class="text-xl font-black tracking-tight">Select Payment Method</h2>

          <div class="mt-6 grid overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 sm:grid-cols-3">
            <button
              v-for="method in paymentMethods"
              :key="method.value"
              type="button"
              :class="[
                'inline-flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-colors',
                form.payment_method === method.value
                  ? 'bg-blue-50 text-blue-700 ring-2 ring-inset ring-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800',
              ]"
              @click="form.payment_method = method.value"
            >
              <component :is="method.icon" class="size-5" />
              {{ method.label }}
            </button>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-semibold text-neutral-500">Provider</span>
              <select v-model="form.provider" class="field">
                <option value="mtn">MTN Mobile Money</option>
                <option value="airtel">Airtel Money</option>
                <option value="visa">Visa Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-neutral-500">Phone Number</span>
              <input v-model="form.phone_number" class="field" placeholder="e.g. 0772 123 456" />
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-sm font-semibold text-neutral-500">Account Name</span>
              <input v-model="form.account_name" class="field" placeholder="e.g. John Doe" />
            </label>
          </div>

          <label class="mt-5 flex items-center gap-3 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            <input v-model="form.save_payment_method" type="checkbox" class="size-5 rounded border-neutral-300 accent-blue-600" />
            Save this payment method for future renewals
          </label>

          <div class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <div class="flex items-center gap-3 text-sm font-semibold text-neutral-500">
              <span class="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                <LockKeyhole class="size-5" />
              </span>
              <span>Payments are encrypted<br />and securely processed.</span>
            </div>
            <div class="flex items-center gap-3">
              <button class="rounded-lg px-5 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" @click="router.push('/central/licenses')">
                Cancel
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                :disabled="submitting"
                @click="confirmRenewal"
              >
                <LockKeyhole class="size-4" />
                {{ submitting ? 'Processing...' : `Pay ${formatMoney(preview.total)}` }}
              </button>
            </div>
          </div>
        </section>

        <aside class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-black tracking-tight">Order Summary</h2>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
              <CheckCircle2 class="size-4" />
              {{ preview.status_label || 'License' }}
            </span>
          </div>

          <dl class="mt-6 space-y-4 text-sm">
            <SummaryRow label="Tenant" :value="preview.tenant" />
            <SummaryRow label="License Type" :value="preview.plan_name" />
            <SummaryRow label="Billing Cycle" :value="billingCycleLabel" />
            <SummaryRow label="Renewal Start" :value="formatDate(preview.renewal_start)" />
            <SummaryRow label="Renewal End" :value="formatDate(preview.renewal_end)" />
          </dl>

          <div class="my-6 border-t border-neutral-200 dark:border-neutral-800" />

          <dl class="space-y-4 text-sm">
            <SummaryRow label="Subtotal" :value="formatMoney(preview.subtotal)" />
            <SummaryRow label="Service Fee" :value="formatMoney(preview.service_fee)" />
          </dl>

          <div class="my-6 border-t border-neutral-200 dark:border-neutral-800" />

          <div class="flex items-center justify-between">
            <span class="text-xl font-black">Total</span>
            <span class="text-xl font-black text-blue-600">{{ formatMoney(preview.total) }}</span>
          </div>

          <div class="mt-6 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            <Info class="mt-0.5 size-5 shrink-0 text-blue-600" />
            <span>Your subscription will renew immediately after successful payment.</span>
          </div>

          <div v-if="showInvoices" class="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <h3 class="text-sm font-black">Recent Invoices</h3>
            <div v-if="!invoices.length" class="mt-3 text-sm text-neutral-500">No invoices found.</div>
            <div v-for="invoice in invoices" :key="invoice.id" class="mt-3 flex items-center justify-between text-sm">
              <span class="font-semibold">{{ invoice.invoice_number }}</span>
              <span class="text-neutral-500">{{ formatMoney(invoice.total) }}</span>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, type Component, type PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pomPinia } from 'septor-store'
import {
  Banknote, CalendarDays, CheckCircle2, Clock3, CreditCard, Crown,
  Info, LockKeyhole, ReceiptText, Smartphone, WalletCards,
} from 'lucide-vue-next'
import { fetchTableData } from '@/Global/landingLayout/util'
import { notify } from '@/Global/Toasters/ToastMsg'

const route = useRoute()
const router = useRouter()
const Store = pomPinia() as any
const loading = ref(true)
const submitting = ref(false)
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

const SummaryCard = defineComponent({
  props: {
    icon: { type: Object as PropType<Component>, required: true },
    tone: { type: String, default: 'blue' },
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  computed: {
    toneClass(): string {
      const map: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
        green: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
        red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
      }
      return map[this.tone] ?? map.blue
    },
  },
  template: `
    <div class="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div :class="['flex size-14 shrink-0 items-center justify-center rounded-full', toneClass]">
        <component :is="icon" class="size-7" />
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-neutral-500">{{ label }}</p>
        <p class="mt-1 truncate text-xl font-black">{{ value || '-' }}</p>
      </div>
    </div>
  `,
})

const SummaryRow = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], default: '-' },
  },
  template: `
    <div class="flex items-center justify-between gap-4">
      <dt class="text-neutral-500">{{ label }}</dt>
      <dd class="text-right font-bold">{{ value || '-' }}</dd>
    </div>
  `,
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

async function loadInvoices() {
  const res = await fetchTableData({
    data: { id: route.params.id },
    props: { state: 'licenseRenewalInvoices', url: 'central/licenses/invoices', reload: false, time: 0 },
    Store,
  })
  invoices.value = res?.payload ?? []
  showInvoices.value = true
}

async function confirmRenewal() {
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

  if (res?.error) {
    notify({ msg: res.error?.message ?? 'Failed to renew license', type: 'error' })
    return
  }

  notify({ msg: res?.payload?.message ?? 'License renewed successfully', type: 'success' })
  router.push('/central/licenses')
}

function formatMoney(value: any) {
  const amount = Number(value ?? 0)
  return `UGX ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function formatDate(value: string) {
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
  border: 1px solid rgb(229 231 235);
  background: transparent;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: inherit;
  outline: none;
}

.field:focus {
  border-color: rgb(96 165 250);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.15);
}
</style>
