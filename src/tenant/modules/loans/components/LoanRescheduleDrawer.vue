<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Loader2 as LucideSpinner,
  CalendarClock as LucideCalendarClock,
  Percent as LucidePercent,
  Banknote as LucideBanknote,
  CheckCircle as LucideCheckCircle,
  AlertTriangle as LucideAlertTriangle,
  X,
  RefreshCw,
} from 'lucide-vue-next'
import { notify } from '@/Global/Toasters/ToastMsg'
import { loansApi, type RescheduleParams, type ReschedulePreviewResult } from '@/tenant/apis/loans/loansApi'
import { loanProductsApi, type LoanProduct } from '@/tenant/apis/loanProducts/loanProductsApi'
import { formatMoneyValue } from '@/Global'

const props = defineProps<{
  open: boolean
  loan: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

// ─── Step state ───────────────────────────────────────────────────────────────
const step = ref<1 | 2 | 3>(1)
const isPreviewing = ref(false)
const isSubmitting = ref(false)
const previewData = ref<ReschedulePreviewResult | null>(null)

// ─── Form state ───────────────────────────────────────────────────────────────
const rescheduleType = ref<'tenor_extension' | 'rate_change' | 'capitalization' | 'tenor_rate_change'>('tenor_extension')
const newTenorMonths = ref<number | null>(null)
const newInterestRate = ref<number | null>(null)
const capitalizeArrears = ref(true)
const penaltiesWaived = ref<number>(0)
const interestWaived = ref<number>(0)
const reason = ref('')
const rescheduleDate = ref(new Date().toISOString().slice(0, 10))
const newLoanProductId = ref<number | null>(null)
const applyOtherCharges = ref(false)

// ─── Loan products ────────────────────────────────────────────────────────────
const loanProducts = ref<LoanProduct[]>([])
const loanProductOptions = computed(() =>
  loanProducts.value.map((p) => ({ id: p.id, name: p.name })),
)

onMounted(async () => {
  try {
    const res = await loanProductsApi.list({ is_active: '1', per_page: 200 })
    loanProducts.value = res.data?.data ?? []
  } catch {
    // non-fatal
  }
})

// Reset when loan changes or drawer opens
watch(
  () => props.loan,
  (newLoan) => {
    if (newLoan) {
      newTenorMonths.value = newLoan.term_months || 0
      newInterestRate.value = parseFloat(newLoan.interest_rate || '0')
      capitalizeArrears.value = true
      penaltiesWaived.value = 0
      interestWaived.value = 0
      reason.value = ''
      newLoanProductId.value = null
      applyOtherCharges.value = false
      step.value = 1
      previewData.value = null
    }
  },
  { immediate: true },
)

watch(
  () => props.open,
  (val) => {
    if (val) {
      step.value = 1
      previewData.value = null
    }
  },
)

// ─── Validation ───────────────────────────────────────────────────────────────
const canPreview = computed(() => {
  if (!reason.value.trim()) return false
  if (rescheduleType.value === 'tenor_extension' && !newTenorMonths.value) return false
  if (rescheduleType.value === 'rate_change' && newInterestRate.value === null) return false
  if (rescheduleType.value === 'tenor_rate_change' && (!newTenorMonths.value || newInterestRate.value === null)) return false
  return true
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number | string | null | undefined) {
  if (v == null || v === '') return '—'
  return formatMoneyValue(v)
}

function buildParams(): RescheduleParams {
  const apiType: RescheduleParams['reschedule_type'] =
    rescheduleType.value === 'tenor_rate_change' ? 'tenor_extension' : rescheduleType.value
  return {
    reschedule_type: apiType,
    new_tenor_months: newTenorMonths.value ? Number(newTenorMonths.value) : undefined,
    new_interest_rate: newInterestRate.value !== null ? Number(newInterestRate.value) : undefined,
    capitalize_arrears: capitalizeArrears.value,
    penalties_waived: penaltiesWaived.value ? Number(penaltiesWaived.value) : 0,
    interest_waived: interestWaived.value ? Number(interestWaived.value) : 0,
    reschedule_date: rescheduleDate.value,
    reason: reason.value,
    new_loan_product_id: newLoanProductId.value ?? undefined,
    apply_other_charges: applyOtherCharges.value || undefined,
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function handlePreview() {
  if (!props.loan?.id) return
  isPreviewing.value = true
  try {
    const response = await loansApi.reschedulePreview(props.loan.id, buildParams())
    previewData.value = response.data.data
    step.value = 2
  } catch (error: any) {
    let errorMsg = 'Failed to generate schedule preview.'
    if (error.response?.data?.errors) {
      errorMsg = Object.values(error.response.data.errors).flat()[0] as string
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    }
    notify({ type: 'error', msg: errorMsg })
  } finally {
    isPreviewing.value = false
  }
}

async function handleSubmit() {
  if (!props.loan?.id) return
  isSubmitting.value = true
  try {
    await loansApi.reschedule(props.loan.id, buildParams())
    emit('success')
    step.value = 3
    notify({ type: 'success', msg: 'Loan rescheduled successfully.' })
  } catch (error: any) {
    let errorMsg = 'An error occurred during rescheduling.'
    if (error.response?.data?.errors) {
      errorMsg = Object.values(error.response.data.errors).flat()[0] as string
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    }
    notify({ type: 'error', msg: errorMsg })
  } finally {
    isSubmitting.value = false
  }
}

function close() {
  emit('update:open', false)
  setTimeout(() => {
    step.value = 1
    previewData.value = null
  }, 250)
}

function handleDone() {
  emit('success')
  close()
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        @mousedown.self="close"
      />
    </Transition>

    <!-- Drawer panel -->
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-neutral-900"
      >

        <!-- ── Header ────────────────────────────────────────────────────── -->
        <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800 shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <RefreshCw class="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-neutral-900 dark:text-white">
                Reschedule Loan
              </h2>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ loan?.loan_no }}
                <span class="mx-1">·</span>
                <span
                  v-if="step === 1"
                  class="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400"
                >Step 1 of 2 — Configure</span>
                <span
                  v-else-if="step === 2"
                  class="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400"
                >Step 2 of 2 — Review &amp; Confirm</span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400"
                >Complete</span>
              </p>
            </div>
          </div>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            @click="close"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- ── Step 1: Configure ─────────────────────────────────────────── -->
        <div v-if="step === 1" class="flex flex-1 flex-col px-6 py-4 gap-4 overflow-hidden">

          <!-- Loan summary bar -->
          <div class="grid grid-cols-4 gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-800/40 shrink-0">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Balance</p>
              <p class="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">{{ loan?.outstanding_balance_formatted }}</p>
            </div>
            <div>
              <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Term</p>
              <p class="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">{{ loan?.term_months }} mo</p>
            </div>
            <div>
              <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Rate</p>
              <p class="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">{{ loan?.interest_rate }}%</p>
            </div>
            <div>
              <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Status</p>
              <span class="mt-0.5 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {{ loan?.status }}
              </span>
            </div>
          </div>

          <!-- Type selector -->
          <div class="shrink-0">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Reschedule Type</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="rescheduleType = 'tenor_extension'"
                class="flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all hover:border-blue-400"
                :class="rescheduleType === 'tenor_extension'
                  ? 'border-transparent ring-2 ring-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'"
              >
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                  <LucideCalendarClock class="h-3.5 w-3.5" />
                </div>
                <div>
                  <p class="text-xs font-semibold text-neutral-900 dark:text-white">Extend Term</p>
                  <p class="text-[11px] text-neutral-500">Longer duration</p>
                </div>
              </button>

              <button
                type="button"
                @click="rescheduleType = 'rate_change'"
                class="flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all hover:border-emerald-400"
                :class="rescheduleType === 'rate_change'
                  ? 'border-transparent ring-2 ring-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'"
              >
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40">
                  <LucidePercent class="h-3.5 w-3.5" />
                </div>
                <div>
                  <p class="text-xs font-semibold text-neutral-900 dark:text-white">Change Rate</p>
                  <p class="text-[11px] text-neutral-500">Adjust interest</p>
                </div>
              </button>

              <button
                type="button"
                @click="rescheduleType = 'capitalization'"
                class="flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all hover:border-amber-400"
                :class="rescheduleType === 'capitalization'
                  ? 'border-transparent ring-2 ring-amber-600 bg-amber-50/50 dark:bg-amber-900/10'
                  : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'"
              >
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40">
                  <LucideBanknote class="h-3.5 w-3.5" />
                </div>
                <div>
                  <p class="text-xs font-semibold text-neutral-900 dark:text-white">Capitalize</p>
                  <p class="text-[11px] text-neutral-500">Roll arrears in</p>
                </div>
              </button>

              <button
                type="button"
                @click="rescheduleType = 'tenor_rate_change'"
                class="flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all hover:border-violet-400"
                :class="rescheduleType === 'tenor_rate_change'
                  ? 'border-transparent ring-2 ring-violet-600 bg-violet-50/50 dark:bg-violet-900/10'
                  : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'"
              >
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40">
                  <RefreshCw class="h-3.5 w-3.5" />
                </div>
                <div>
                  <p class="text-xs font-semibold text-neutral-900 dark:text-white">Extend + Rate</p>
                  <p class="text-[11px] text-neutral-500">Term &amp; rate change</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Dynamic type-specific field -->
          <div class="shrink-0">
            <!-- Tenor extension -->
            <div v-if="rescheduleType === 'tenor_extension'">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                New Total Remaining Term (Months) <span class="text-red-400">*</span>
              </label>
              <input
                v-model="newTenorMonths"
                type="number"
                min="1"
                placeholder="e.g. 24"
                class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
              <p class="mt-1 text-xs text-neutral-500">Total months remaining to pay off the balance.</p>
            </div>

            <!-- Rate change -->
            <div v-if="rescheduleType === 'rate_change'">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                New Interest Rate (%) <span class="text-red-400">*</span>
              </label>
              <input
                v-model="newInterestRate"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 18.5"
                class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <!-- Capitalization -->
            <div v-if="rescheduleType === 'capitalization'">
              <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <input
                  v-model="capitalizeArrears"
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-300"
                />
                <div>
                  <p class="text-sm font-medium text-amber-900 dark:text-amber-300">Capitalize outstanding arrears</p>
                  <p class="mt-0.5 text-xs text-amber-700 dark:text-amber-400">Adds penalty, interest, and charge arrears to the new principal.</p>
                </div>
              </label>
            </div>

            <!-- Extend Term + Change Rate (combination) -->
            <div v-if="rescheduleType === 'tenor_rate_change'" class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  New Total Term (Months) <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="newTenorMonths"
                  type="number"
                  min="1"
                  placeholder="e.g. 24"
                  class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <p class="mt-1 text-xs text-neutral-500">Total remaining months to repay.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  New Interest Rate (%) <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="newInterestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 18.5"
                  class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
                <p class="mt-1 text-xs text-neutral-500">New monthly interest rate.</p>
              </div>
            </div>
          </div>

          <!-- Waivers + Date — 3-col row -->
          <div class="grid grid-cols-3 gap-3 shrink-0">
            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Penalties Waived</label>
              <input
                v-model="penaltiesWaived"
                type="number"
                min="0"
                placeholder="0"
                class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Interest Waived</label>
              <input
                v-model="interestWaived"
                type="number"
                min="0"
                placeholder="0"
                class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Effective Date</label>
              <input
                v-model="rescheduleDate"
                type="date"
                class="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>

          <!-- Change Loan Product -->
          <div>
            <label class="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Change Loan Product
              <span class="ml-1 text-[10px] text-neutral-400">(optional — leave blank to keep current product)</span>
            </label>
            <select
              v-model="newLoanProductId"
              class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option :value="null">— Keep current product —</option>
              <option
                v-for="product in loanProductOptions"
                :key="product.id"
                :value="product.id"
              >{{ product.name }}</option>
            </select>
            <p
              v-if="newLoanProductId && newLoanProductId !== props.loan?.loan_product_id"
              class="mt-1 text-[11px] text-blue-600 dark:text-blue-400"
            >
              Product change fee will apply if configured in settings.
            </p>
          </div>

          <!-- Apply Other Charges -->
          <div class="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div>
              <p class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Apply Other Charges</p>
              <p class="text-[11px] text-amber-700 dark:text-amber-400">Admin-configured one-off charge for this reschedule.</p>
            </div>
            <input
              v-model="applyOtherCharges"
              type="checkbox"
              class="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-400 dark:border-gray-600"
            />
          </div>

          <!-- Reason — flex-1 so it fills remaining space -->
          <div class="flex flex-1 flex-col min-h-0">
            <label class="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Reason / Justification <span class="text-red-400">*</span>
            </label>
            <textarea
              v-model="reason"
              placeholder="Enter the rationale for restructuring this loan…"
              class="flex-1 min-h-[72px] w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
        </div>

        <!-- ── Step 2: Preview ───────────────────────────────────────────── -->
        <div v-if="step === 2 && previewData" class="flex flex-1 flex-col px-6 py-4 gap-4 overflow-hidden">

          <!-- Capitalized arrears alert -->
          <div
            v-if="previewData.capitalized_arrears > 0"
            class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20 shrink-0"
          >
            <LucideAlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p class="text-xs text-amber-700 dark:text-amber-300">
              Arrears of <span class="font-semibold">{{ fmt(previewData.capitalized_arrears) }}</span> included in new principal.
            </p>
          </div>

          <!-- Before / After comparison -->
          <div class="grid grid-cols-2 gap-3 shrink-0">
            <!-- Before -->
            <div class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/40">
              <p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                <span class="h-2 w-2 rounded-full bg-neutral-400 inline-block"></span>Before
              </p>
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-500">Balance</span>
                  <span class="font-medium text-neutral-900 dark:text-white">{{ fmt(previewData.old_snapshot.outstanding_balance) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">Term</span>
                  <span class="font-medium text-neutral-900 dark:text-white">{{ previewData.old_snapshot.remaining_periods }} mo</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">Rate</span>
                  <span class="font-medium text-neutral-900 dark:text-white">{{ previewData.old_snapshot.interest_rate }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">Maturity</span>
                  <span class="font-medium text-neutral-900 dark:text-white tabular-nums">{{ previewData.old_snapshot.maturity_date || '—' }}</span>
                </div>
                <div v-if="previewData.old_snapshot.arrears_amount > 0" class="flex justify-between border-t border-neutral-200 pt-1.5 dark:border-neutral-700">
                  <span class="text-amber-600">Arrears</span>
                  <span class="font-medium text-amber-700">{{ fmt(previewData.old_snapshot.arrears_amount) }}</span>
                </div>
              </div>
            </div>

            <!-- After -->
            <div class="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/10">
              <p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-500">
                <span class="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>After
              </p>
              <div class="space-y-1.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-500">New Principal</span>
                  <span class="font-semibold text-blue-900 dark:text-blue-200">{{ fmt(previewData.new_snapshot.principal_balance) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">New Term</span>
                  <span class="font-medium text-blue-900 dark:text-blue-200">{{ previewData.new_snapshot.tenor_months }} mo</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">New Rate</span>
                  <span class="font-medium text-blue-900 dark:text-blue-200">{{ previewData.new_snapshot.interest_rate }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500">New Maturity</span>
                  <span class="font-medium text-blue-900 dark:text-blue-200 tabular-nums">{{ previewData.new_snapshot.maturity_date }}</span>
                </div>
                <div v-if="previewData.capitalized_arrears > 0" class="flex justify-between">
                  <span class="text-amber-600">Incl. arrears</span>
                  <span class="font-medium text-amber-700">{{ fmt(previewData.capitalized_arrears) }}</span>
                </div>
                <div class="flex justify-between border-t border-blue-200 pt-1.5 dark:border-blue-700">
                  <span class="text-blue-700">Installment</span>
                  <span class="font-semibold text-blue-800 dark:text-blue-300">{{ fmt(previewData.new_snapshot.installment_amount) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Preview schedule — fills remaining height with internal scroll only -->
          <div class="flex flex-1 flex-col min-h-0 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div class="border-b border-neutral-100 px-4 py-2 dark:border-neutral-800 shrink-0">
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-400">New Schedule Preview</p>
            </div>
            <div class="flex-1 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-0 border-b border-neutral-100 bg-neutral-50 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800">
                  <tr>
                    <th class="px-4 py-2 text-left font-medium">No.</th>
                    <th class="px-4 py-2 text-left font-medium">Date</th>
                    <th class="px-4 py-2 text-right font-medium">Principal</th>
                    <th class="px-4 py-2 text-right font-medium">Interest</th>
                    <th class="px-4 py-2 text-right font-medium">Total</th>
                    <th class="px-4 py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                  <tr
                    v-for="row in previewData.preview_schedule"
                    :key="row.period"
                    class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                  >
                    <td class="px-4 py-2 text-neutral-600 dark:text-neutral-400">{{ row.period }}</td>
                    <td class="px-4 py-2 tabular-nums text-neutral-700 dark:text-neutral-300">{{ row.due_date }}</td>
                    <td class="px-4 py-2 tabular-nums text-right text-neutral-700 dark:text-neutral-300">{{ fmt(row.principal) }}</td>
                    <td class="px-4 py-2 tabular-nums text-right text-neutral-700 dark:text-neutral-300">{{ fmt(row.interest) }}</td>
                    <td class="px-4 py-2 tabular-nums text-right font-medium text-neutral-900 dark:text-white">{{ fmt(row.installment) }}</td>
                    <td class="px-4 py-2 tabular-nums text-right text-neutral-500">{{ fmt(row.balance) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ── Step 3: Success ───────────────────────────────────────────── -->
        <div v-if="step === 3" class="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
            <LucideCheckCircle class="h-8 w-8" />
          </div>
          <div>
            <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">Loan Rescheduled</h3>
            <p class="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
              The loan has been successfully restructured and the repayment schedule has been updated.
            </p>
          </div>
        </div>

        <!-- ── Footer ────────────────────────────────────────────────────── -->
        <div class="flex items-center justify-between border-t border-neutral-100 px-6 py-4 dark:border-neutral-800 shrink-0">

          <!-- Step 1 footer -->
          <template v-if="step === 1">
            <button
              class="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              @click="close"
            >
              Cancel
            </button>
            <button
              :disabled="!canPreview || isPreviewing"
              class="flex items-center gap-2 rounded-xl bg-nfuko-action px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              @click="handlePreview"
            >
              <LucideSpinner v-if="isPreviewing" class="h-4 w-4 animate-spin" />
              Preview New Schedule
            </button>
          </template>

          <!-- Step 2 footer -->
          <template v-else-if="step === 2">
            <button
              :disabled="isSubmitting"
              class="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              @click="step = 1"
            >
              Back
            </button>
            <div class="flex gap-2">
              <button
                :disabled="isSubmitting"
                class="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300"
                @click="close"
              >
                Cancel
              </button>
              <button
                :disabled="isSubmitting"
                class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                @click="handleSubmit"
              >
                <LucideSpinner v-if="isSubmitting" class="h-4 w-4 animate-spin" />
                Confirm Reschedule
              </button>
            </div>
          </template>

          <!-- Step 3 footer -->
          <template v-else>
            <div />
            <button
              class="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              @click="handleDone"
            >
              Close &amp; View Schedule
            </button>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>
