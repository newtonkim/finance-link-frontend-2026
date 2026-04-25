<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Calculator, Zap, FileText, CheckCircle2, XCircle, ArrowRight } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/Global/ui/dialog'
import { Label } from '@/Global'
import { toast } from 'vue-sonner'
import { loansApi } from '@/tenant/apis/loans/loansApi'

const props = defineProps<{
  loan: any
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'close'): void
}>()

const router = useRouter()
const open = ref(false)
const step = ref(1) // 1 = config, 2 = eligibility, 3 = preview
const loading = ref(false)
const eligibilityResults = ref<any>(null)

const form = reactive({
  topup_type: 'consolidated' as 'consolidated' | 'parallel',
  requested_amount: 0,
  requested_term: 12,
})

// ── Computed helpers ──────────────────────────────────────────────────────────

const currentBalance = computed(() => Number(props.loan?.total_outstanding ?? props.loan?.outstanding_balance ?? 0))
const currentPrincipal = computed(() => Number(props.loan?.principal ?? 0))
const interestRate = computed(() => Number(props.loan?.interest_rate ?? 0))

const freshCashAmount = computed(() => {
  const req = Number(form.requested_amount) || 0
  if (form.topup_type === 'consolidated') {
    return Math.max(0, req - currentBalance.value)
  }
  return req
})

const projectedTotal = computed(() => Number(form.requested_amount) || 0)

const estimatedMonthlyInstallment = computed(() => {
  if (!form.requested_term || form.requested_term <= 0) return 0
  const rate = interestRate.value / 100
  const totalWithInterest = projectedTotal.value * (1 + rate * (form.requested_term / 12))
  return totalWithInterest / form.requested_term
})

const repaidPercent = computed(() => {
  const total = Number(props.loan?.total_expected ?? 0)
  const paid = Number(props.loan?.total_paid ?? 0)
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, (paid / total) * 100))
})

// ── Methods ───────────────────────────────────────────────────────────────────

function show() {
  open.value = true
  step.value = 1
  eligibilityResults.value = null
  form.requested_amount = 0
  form.requested_term = props.loan?.term_months ?? props.loan?.original_term_months ?? 12
}

function close() {
  open.value = false
  emit('close')
}

function goToEligibility() {
  if (!form.requested_amount || form.requested_amount <= 0) {
    toast.error('Please enter a valid requested amount.')
    return
  }
  if (!form.requested_term || form.requested_term <= 0) {
    toast.error('Please enter a valid loan term.')
    return
  }
  step.value = 2
  runEligibility()
}

async function runEligibility() {
  loading.value = true
  
  try {
    const res = await loansApi.topupEligibility(props.loan.id, {
      fresh_cash_amount: freshCashAmount.value,
      requested_term: form.requested_term,
      topup_type: form.topup_type,
    })
    
    eligibilityResults.value = res.data.data
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to check eligibility')
    eligibilityResults.value = { eligible: false, passed: [], failed: [{ key: 'error', label: 'System Error', reason: 'Could not connect to the eligibility engine.' }] }
  } finally {
    loading.value = false
  }
}

function goToPreview() {
  if (!eligibilityResults.value?.eligible) return
  step.value = 3
}

async function finalize() {
  try {
    const res = await loansApi.executeTopup(props.loan.id, {
      fresh_cash_amount: freshCashAmount.value,
      requested_term: form.requested_term,
      topup_type: form.topup_type,
    })

    const data = res.data.data
    toast.success(data.message || 'Top-up submitted successfully.')
    emit('success')
    close()

    if (data.new_loan_id) {
      router.push({ name: 'tenant-loan-account', params: { id: data.new_loan_id } })
    }
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to submit top-up')
  }
}

function fmtCurrency(val: number): string {
  return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

defineExpose({ show, close })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[640px] p-0 gap-0 overflow-hidden">

      <!-- Header -->
      <DialogHeader class="border-b border-neutral-100 dark:border-neutral-800 px-6 py-4">
        <DialogTitle class="flex items-center gap-2">
          <Zap class="h-5 w-5 text-nfuko-primary" />
          Loan Top-Up Application
        </DialogTitle>
        <p class="text-xs text-neutral-500 mt-0.5">
          {{ loan?.loan_no }} · {{ loan?.member?.name }}
        </p>
      </DialogHeader>

      <!-- Step Indicator -->
      <div class="flex items-center gap-0 px-6 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
        <div v-for="(s, i) in ['Strategy & Amount', 'Eligibility Check', 'Review & Submit']" :key="i"
          class="flex items-center gap-2 text-xs font-semibold"
          :class="step > i + 1 ? 'text-emerald-600' : step === i + 1 ? 'text-nfuko-primary' : 'text-neutral-400'"
        >
          <span class="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            :class="step > i + 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50' : step === i + 1 ? 'bg-nfuko-primary/10 text-nfuko-primary' : 'bg-neutral-200 dark:bg-neutral-700'"
          >
            <CheckCircle2 v-if="step > i + 1" class="h-3 w-3" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          {{ s }}
          <ArrowRight v-if="i < 2" class="h-3 w-3 text-neutral-300 mx-1" />
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 max-h-[60vh] overflow-y-auto">

        <!-- ── STEP 1: Configuration ───────────────────────────────── -->
        <div v-if="step === 1" class="space-y-6">

          <!-- Reference Loan Card -->
          <div class="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <h4 class="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">Current Loan</h4>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-neutral-500 block text-[11px]">Principal</span>
                <span class="font-bold">{{ fmtCurrency(currentPrincipal) }}</span>
              </div>
              <div>
                <span class="text-neutral-500 block text-[11px]">Outstanding Balance</span>
                <span class="font-bold text-red-600">{{ fmtCurrency(currentBalance) }}</span>
              </div>
              <div>
                <span class="text-neutral-500 block text-[11px]">Repaid</span>
                <span class="font-bold text-emerald-600">{{ repaidPercent.toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <!-- Type Selection -->
          <div class="space-y-3">
            <Label class="text-xs font-bold uppercase tracking-wider text-neutral-500">Top-Up Strategy</Label>
            <div class="grid grid-cols-2 gap-3">
              <label
                class="cursor-pointer rounded-xl border-2 p-4 transition-all"
                :class="form.topup_type === 'consolidated' ? 'border-nfuko-primary bg-nfuko-primary/5 shadow-sm' : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'"
              >
                <input type="radio" v-model="form.topup_type" value="consolidated" class="sr-only" />
                <div class="flex items-center gap-2 mb-1">
                  <Zap class="h-4 w-4" :class="form.topup_type === 'consolidated' ? 'text-nfuko-primary' : 'text-neutral-400'" />
                  <span class="font-bold text-sm">Consolidated</span>
                </div>
                <p class="text-[11px] text-neutral-500 leading-tight">Merges old balance into a new, larger loan.</p>
              </label>
              <label
                class="cursor-pointer rounded-xl border-2 p-4 transition-all"
                :class="form.topup_type === 'parallel' ? 'border-nfuko-primary bg-nfuko-primary/5 shadow-sm' : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'"
              >
                <input type="radio" v-model="form.topup_type" value="parallel" class="sr-only" />
                <div class="flex items-center gap-2 mb-1">
                  <FileText class="h-4 w-4" :class="form.topup_type === 'parallel' ? 'text-nfuko-primary' : 'text-neutral-400'" />
                  <span class="font-bold text-sm">Parallel</span>
                </div>
                <p class="text-[11px] text-neutral-500 leading-tight">Creates a separate new loan account.</p>
              </label>
            </div>
          </div>

          <!-- Amount & Term -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {{ form.topup_type === 'consolidated' ? 'New Loan Principal' : 'Fresh Cash Amount' }}
              </Label>
              <input
                v-model.number="form.requested_amount"
                type="number"
                min="0"
                :placeholder="form.topup_type === 'consolidated' ? 'e.g. 2000000' : 'e.g. 500000'"
                class="block w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-bold uppercase tracking-wider text-neutral-500">Term (Months)</Label>
              <input
                v-model.number="form.requested_term"
                type="number"
                min="1"
                class="block w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          </div>

          <!-- Projection Summary -->
          <div class="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">New Total Loan</p>
                <p class="text-xl font-black text-neutral-900 dark:text-white">{{ fmtCurrency(projectedTotal) }}</p>
              </div>
              <div class="text-right">
                <p class="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Est. Monthly Installment</p>
                <p class="text-xl font-black text-neutral-900 dark:text-white">{{ fmtCurrency(estimatedMonthlyInstallment) }}</p>
              </div>
            </div>
            <p v-if="form.topup_type === 'consolidated'" class="text-[11px] text-neutral-400 mt-2">
              = New Loan {{ fmtCurrency(projectedTotal) }} - Outstanding {{ fmtCurrency(currentBalance) }} = Fresh Cash {{ fmtCurrency(freshCashAmount) }}
            </p>
          </div>
        </div>

        <!-- ── STEP 2: Eligibility ─────────────────────────────────── -->
        <div v-else-if="step === 2" class="space-y-5">
          <div v-if="loading" class="flex flex-col items-center justify-center py-12 gap-3">
            <div class="h-10 w-10 rounded-full border-2 border-neutral-200 border-t-nfuko-primary animate-spin" />
            <p class="text-sm text-neutral-500 font-medium">Running eligibility checks…</p>
          </div>

          <template v-else-if="eligibilityResults">
            <!-- Overall Status -->
            <div class="rounded-xl p-4 text-center"
              :class="eligibilityResults.eligible ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/40'"
            >
              <CheckCircle2 v-if="eligibilityResults.eligible" class="h-8 w-8 mx-auto text-emerald-600" />
              <XCircle v-else class="h-8 w-8 mx-auto text-red-600" />
              <p class="text-sm font-bold mt-2" :class="eligibilityResults.eligible ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'">
                {{ eligibilityResults.eligible ? 'All Eligibility Checks Passed' : 'Eligibility Check Failed' }}
              </p>
            </div>

            <!-- Failed Checks -->
            <div v-for="fail in eligibilityResults.failed" :key="fail.key"
              class="flex items-start gap-3 rounded-xl bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-300"
            >
              <XCircle class="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p class="text-sm font-bold">{{ fail.label }}</p>
                <p class="text-xs opacity-80 mt-0.5">{{ fail.reason }}</p>
              </div>
            </div>

            <!-- Passed Checks -->
            <div v-for="pass in eligibilityResults.passed" :key="pass.key"
              class="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
            >
              <CheckCircle2 class="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p class="text-sm font-bold">{{ pass.label }}</p>
                <p class="text-xs opacity-80 mt-0.5">{{ pass.message }}</p>
              </div>
            </div>
          </template>
        </div>

        <!-- ── STEP 3: Preview & Submit ────────────────────────────── -->
        <div v-else-if="step === 3" class="space-y-5">
          <div class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <table class="w-full text-sm">
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr>
                  <td class="px-4 py-3 text-neutral-500 font-medium">Top-Up Type</td>
                  <td class="px-4 py-3 font-bold capitalize text-right">{{ form.topup_type }}</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-neutral-500 font-medium">New Loan Total</td>
                  <td class="px-4 py-3 font-black text-right text-neutral-900 dark:text-white">{{ fmtCurrency(projectedTotal) }}</td>
                </tr>
                <tr v-if="form.topup_type === 'consolidated'">
                  <td class="px-4 py-3 text-neutral-500 font-medium">Less Outstanding Balance</td>
                  <td class="px-4 py-3 font-bold text-right text-red-600">- {{ fmtCurrency(currentBalance) }}</td>
                </tr>
                <tr class="bg-neutral-50 dark:bg-neutral-800/50">
                  <td class="px-4 py-3 text-neutral-900 dark:text-white font-bold">Fresh Cash Disbursed</td>
                  <td class="px-4 py-3 font-bold text-right text-emerald-600">{{ fmtCurrency(freshCashAmount) }}</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-neutral-500 font-medium">Term</td>
                  <td class="px-4 py-3 font-bold text-right">{{ form.requested_term }} months</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-neutral-500 font-medium">Est. Monthly Installment</td>
                  <td class="px-4 py-3 font-bold text-right">{{ fmtCurrency(estimatedMonthlyInstallment) }}</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-neutral-500 font-medium">Reference Loan</td>
                  <td class="px-4 py-3 font-mono font-bold text-right">{{ loan?.loan_no }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 dark:bg-amber-900/20 dark:border-amber-800/40">
            <p class="text-xs text-amber-800 dark:text-amber-300">
              <template v-if="form.topup_type === 'consolidated'">
                <strong>Note:</strong> Once finalized, the current loan will be marked as <strong>Closed</strong> and a new loan will be created based on your selected workflow (Auto-Disbursement or Standard Application). You will be redirected to the new loan automatically.
              </template>
              <template v-else>
                <strong>Note:</strong> Once finalized, the current loan will remain <strong>Disbursed</strong> and a new separate loan will be created based on your selected workflow (Auto-Disbursement or Standard Application). You will be redirected to the new loan automatically.
              </template>
            </p>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="border-t border-neutral-100 dark:border-neutral-800 px-6 py-4 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
        <button
          class="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          @click="close"
        >
          Cancel
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="step > 1"
            class="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            @click="step--"
          >
            Back
          </button>

          <!-- Step 1 → 2 -->
          <button
            v-if="step === 1"
            class="flex items-center gap-2 rounded-xl bg-nfuko-action px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            @click="goToEligibility"
          >
            <Calculator class="h-4 w-4" />
            Check Eligibility
          </button>

          <!-- Step 2 → 3 -->
          <button
            v-else-if="step === 2 && eligibilityResults?.eligible"
            class="flex items-center gap-2 rounded-xl bg-nfuko-action px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            @click="goToPreview"
          >
            <ArrowRight class="h-4 w-4" />
            Continue to Review
          </button>

          <!-- Step 3 → Submit -->
          <button
            v-else-if="step === 3"
            class="flex items-center gap-2 rounded-xl bg-nfuko-action px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            @click="finalize"
          >
            <Zap class="h-4 w-4" />
            Finalize Top-Up
          </button>
        </div>
      </div>

    </DialogContent>
  </Dialog>
</template>
