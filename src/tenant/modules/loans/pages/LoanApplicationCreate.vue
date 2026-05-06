<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ArrowLeft, HandCoins, ChevronRight, Printer } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useLoanApplicationCreate } from '../composables/useLoanApplicationCreate'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import LoanFormStepIndicator from '../components/LoanFormStepIndicator.vue'
import LoanFormRepaymentPreview from '../components/LoanFormRepaymentPreview.vue'
import LoanFormCollateralSection from '../components/LoanFormCollateralSection.vue'
import LoanCreateStep1Panel from '../components/LoanCreateStep1Panel.vue'
import LoanCreateStep3Panel from '../components/LoanCreateStep3Panel.vue'
import loanApplicationPagePrint from '@/tenant/modules/loans/components/loanApplicationPagePrint.vue'
import { type MemberOption } from '../composables/useLoanApplicationForm'
import { type LoanProduct } from '@/tenant/apis/loanProducts/loanProductsApi'
import { type CollateralItem } from '../components/LoanFormCollateralSection.vue'

const router = useRouter()
const { formatAmount } = useLoanApplicationHelpers()

const {
  saving,
  submitting,
  form,
  selectedProduct,
  schedulePreview,
  previewLoading,
  eligibilityResult,
  eligibilityLoading,
  triggerEligibilityCheck,
  members,
  products,
  staffOptions,
  branches,
  showBranchSelect,
  onProductChange,
  fieldError,
  save,
  saveAndSubmit,
} = useLoanApplicationCreate()

const props = defineProps({
  from: {
    type: String,
    default: null,
  }
})
// ─── Member / Product selection ───────────────────────────────────────────────
const selectedMember = ref<MemberOption | null>(null)
const memberOptions = computed(() =>
  members.value.map((m) => ({ ...m, name: `${m.name} (${m.member_no})` })),
)
const productOptions = computed(() =>
  products.value.map((p) => ({ ...p, name: `${p.name} (${p.code})` })),
)

function selectMember(m: MemberOption) {
  form.value.member_id = m.id
  selectedMember.value = m
}
function clearMember() {
  form.value.member_id = null
  selectedMember.value = null
}
function selectProduct(p: LoanProduct) {
  form.value.loan_product_id = p.id
  void onProductChange()
}

// ─── Amount input ─────────────────────────────────────────────────────────────
const printTheApplication = ref(false)
const amountInputRef = ref<HTMLInputElement | null>(null)

const FMT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const FMT_LIVE = new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 })

onMounted(() => {
  if (amountInputRef.value && form.value.requested_amount != null)
    amountInputRef.value.value = FMT.format(Number(form.value.requested_amount))
})
watch(() => form.value.requested_amount, (v) => {
  if (amountInputRef.value && document.activeElement !== amountInputRef.value)
    amountInputRef.value.value = v != null ? FMT.format(Number(v)) : ''
})

function onAmountInput(e: Event) {
  const input = e.target as HTMLInputElement
  const cursor = input.selectionStart ?? input.value.length
  const prevLen = input.value.length
  const raw = input.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(raw)
  form.value.requested_amount = isNaN(num) ? null : num
  if (!raw) { input.value = ''; return }
  // keep decimal suffix untouched while user types it
  const dotIdx = raw.indexOf('.')
  const intRaw = dotIdx >= 0 ? raw.slice(0, dotIdx) : raw
  const decSuffix = dotIdx >= 0 ? raw.slice(dotIdx) : ''
  const intFormatted = FMT_LIVE.format(parseInt(intRaw || '0', 10))
  const formatted = intFormatted + decSuffix
  input.value = formatted
  const newPos = Math.max(0, cursor + (formatted.length - prevLen))
  input.setSelectionRange(newPos, newPos)
}
function onAmountBlur() {
  if (amountInputRef.value)
    amountInputRef.value.value = form.value.requested_amount != null ? FMT.format(form.value.requested_amount) : ''
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
const currentStep = ref(1)
const steps = [
  { id: 1, label: 'Member & Product' },
  { id: 2, label: 'Loan Details' },
  { id: 3, label: 'Review & Submit' },
]
function goToStep(n: number) {
  currentStep.value = n
}
function nextStep() {
  if (currentStep.value < steps.length) currentStep.value++
}
function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

const step1Valid = computed(
  () => !!(form.value.member_id && form.value.loan_product_id && form.value.loan_officer_id),
)

// ─── Collateral ───────────────────────────────────────────────────────────────
const collateralItems = ref<CollateralItem[]>([])
const collateralRef = ref<InstanceType<typeof LoanFormCollateralSection> | null>(null)
const step2Valid = computed(() => {
  if (!form.value.requested_amount || !form.value.requested_term) return false
  return collateralRef.value?.isSecured ?? true
})

const eligibilityReady = computed(
  () =>
    !!(
      form.value.member_id &&
      form.value.loan_product_id &&
      form.value.requested_amount &&
      form.value.requested_term
    ),
)
const canSubmit = computed(
  () =>
    !(
      eligibilityResult.value &&
      !eligibilityResult.value.eligible &&
      eligibilityResult.value.failed.length > 0
    ),
)

function printDataInLoan(v) {
printTheApplication.value = v
}
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4" v-if="from!=='drawer'">

        <button @click="router.back()" class="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 
             hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
          <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
        </button>

        <div class="flex h-11 w-11 items-center justify-center rounded-2xl
                bg-nfuko-primary/10 dark:bg-nfuko-primary/20">
          <HandCoins class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>

        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white">
            New Loan Application
          </h1>
          <p class="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
            Fill in the details and save or submit for review
          </p>
        </div>
      </div>
      <div v-else></div>

      <div class="flex items-center gap-2 no-print">

        <button @click="()=>printDataInLoan(true)" class="flex items-center gap-1 px-4 py-1 rounded-lg 
             bg-nfuko-primary text-white text-sm font-medium
             hover:bg-nfuko-primary-700 transition shadow-sm">

          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 9V2h12v7M6 18h12M6 14h12M6 22h12M6 18v4m12-4v4" />
          </svg>

          <span>Print</span>
        </button>

      </div>
    </div>

    <LoanFormStepIndicator :steps="steps" :current-step="currentStep" @goto="goToStep" />

    <form @submit.prevent="save()">
      <LoanCreateStep1Panel v-show="currentStep === 1" :form="form" :selected-member="selectedMember"
        :selected-product="selectedProduct" :member-options="memberOptions" :product-options="productOptions"
        :staff-options="staffOptions" :branches="branches" :show-branch-select="showBranchSelect"
        :field-error="fieldError" :step1-valid="step1Valid" @select-member="selectMember" @clear-member="clearMember"
        @select-product="selectProduct" @next="nextStep" />

      <div v-show="currentStep === 2" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div class="flex flex-col gap-6">
          <div
            class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">
              Loan Details
            </h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Requested Amount
                  <span class="text-red-500">*</span></label>
                <input ref="amountInputRef" type="text" inputmode="decimal" placeholder="0.00"
                  class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
                  :class="fieldError('requested_amount')
                    ? 'border-red-400'
                    : 'border-neutral-200 dark:border-neutral-700'
                    " @input="onAmountInput" @blur="onAmountBlur" />
                <p v-if="fieldError('requested_amount')" class="mt-1 text-xs text-red-500">
                  {{ fieldError('requested_amount') }}
                </p>
                <p v-if="selectedProduct?.min_amount || selectedProduct?.max_amount"
                  class="mt-1 text-xs text-neutral-400">
                  Range: {{ formatAmount(selectedProduct.min_amount) }} –
                  {{ formatAmount(selectedProduct.max_amount) }}
                </p>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan Duration <span
                    class="text-red-500">*</span></label>
                <div class="flex items-center gap-2">
                  <input v-model="form.requested_term" type="number" min="1" placeholder="e.g. 12"
                    class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
                    :class="fieldError('requested_term')
                      ? 'border-red-400'
                      : 'border-neutral-200 dark:border-neutral-700'
                      " />
                  <span v-if="selectedProduct?.duration_type" class="shrink-0 text-sm text-neutral-500">{{
                    selectedProduct.duration_type }}</span>
                </div>
                <p v-if="fieldError('requested_term')" class="mt-1 text-xs text-red-500">
                  {{ fieldError('requested_term') }}
                </p>
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Purpose <span
                    class="text-red-500">*</span></label>
                <textarea v-model="form.purpose" rows="3" placeholder="Briefly describe the purpose of this loan…"
                  class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Repayment
                  Source</label>
                <input v-model="form.repayment_source" type="text" placeholder="e.g. Monthly salary, Business income…"
                  class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
              </div>
            </div>
          </div>

          <LoanFormCollateralSection ref="collateralRef" v-model="collateralItems" :selected-product="selectedProduct"
            :selected-member="selectedMember" :requested-amount="Number(form.requested_amount) || null" />

          <div class="flex items-center justify-between">
            <button type="button"
              class="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300"
              @click="prevStep">
              <ArrowLeft class="h-4 w-4" /> Back
            </button>
            <button type="button" :disabled="!step2Valid"
              class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-40"
              @click="nextStep">
              Next: Review
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <LoanFormRepaymentPreview :schedule-preview="schedulePreview" :preview-loading="previewLoading" />
        </div>
      </div>

      <LoanCreateStep3Panel v-show="currentStep === 3" :form="form" :selected-member="selectedMember"
        :selected-product="selectedProduct" :collateral-items="collateralItems" :schedule-preview="schedulePreview"
        :eligibility-result="eligibilityResult" :eligibility-loading="eligibilityLoading"
        :eligibility-ready="eligibilityReady" :saving="saving" :submitting="submitting" :can-submit="canSubmit"
        @prev="prevStep" @go-to-step="goToStep" @save="save()" @save-and-submit="saveAndSubmit()"
        @retry-eligibility="triggerEligibilityCheck" />
    </form>
  </div>
  <span v-if="printTheApplication">

  <loanApplicationPagePrint :print="printTheApplication" :data="form" @close="()=>printDataInLoan(false)"/>
  </span>
</template>
