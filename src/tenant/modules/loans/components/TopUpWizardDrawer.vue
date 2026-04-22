<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { X, Calculator, Zap, FileText } from 'lucide-vue-next'
import { Drawer, Spinner, Label, SearchableSelect } from '@/Global'
import { toast } from 'vue-sonner'

const props = defineProps<{
  show: boolean
  loan: any // Define a proper type later or import Loan
}>()

const emit = defineEmits(['update:show', 'close', 'submit'])

const loading = ref(false)
const eligibilityResults = ref<any>(null)

const form = reactive({
  topup_type: 'consolidated',
  fresh_cash_amount: 0,
  requested_term: 0,
})

// Calculate projected total
const projectedTotal = computed(() => {
  if (!props.loan) return 0
  if (form.topup_type === 'consolidated') {
    return Number(props.loan.outstanding_balance) + Number(form.fresh_cash_amount)
  }
  return Number(form.fresh_cash_amount)
})

// Simulated DSR Check (simplified for UI demonstration)
const memberMonthlyIncome = computed(() => {
    // Usually fetched from member details, defaulting to a placeholder for the wizard UI
    return 5000 // Placeholder 
})

const estimatedMonthlyInstallment = computed(() => {
  if (!form.requested_term || form.requested_term <= 0) return 0
  // Simple straight-line estimation for UI DSR preview
  const interestRate = Number(props.loan?.interest_rate || 0) / 100
  const totalWithInterest = projectedTotal.value * (1 + (interestRate * (form.requested_term / 12)))
  return totalWithInterest / form.requested_term
})

const dsrAfter = computed(() => {
  if (memberMonthlyIncome.value === 0) return 0
  return (estimatedMonthlyInstallment.value / memberMonthlyIncome.value) * 100
})

const dsrExceedsLimit = computed(() => dsrAfter.value > 40)

function handleClose() {
  emit('update:show', false)
  emit('close')
  // Reset
  form.topup_type = 'consolidated'
  form.fresh_cash_amount = 0
  form.requested_term = 0
  eligibilityResults.value = null
}

async function checkEligibility() {
  if (!form.fresh_cash_amount || !form.requested_term) {
    toast.error('Please enter amount and term')
    return
  }
  
  loading.value = true
  // TODO: Call actual API endpoint for TopupEligibilityService
  // Simulate API call for now
  setTimeout(() => {
    loading.value = false
    eligibilityResults.value = {
      eligible: !dsrExceedsLimit.value,
      passed: [
        { label: 'Repayment Threshold', message: 'Member has paid 45%, meeting the 40% minimum.' },
        { label: 'Savings Balance', message: 'Savings balance meets the 3:1 ratio requirement.' }
      ],
      failed: dsrExceedsLimit.value ? [
        { label: 'Debt Service Ratio', reason: `DSR of ${dsrAfter.value.toFixed(1)}% exceeds the 40% limit.` }
      ] : []
    }
  }, 1000)
}

function finalize() {
    if (!eligibilityResults.value?.eligible) {
        toast.error('Cannot finalize an ineligible top-up')
        return
    }
    emit('submit', { ...form, projectedTotal: projectedTotal.value })
}

watch(() => props.show, (newVal) => {
    if (newVal && props.loan) {
        form.requested_term = props.loan.original_term_months || 12
    }
})

</script>

<template>
  <Drawer :open="show" title="Top-Up Loan Application" @update:open="handleClose" width="max-w-2xl">
    <div class="flex h-full flex-col bg-white dark:bg-neutral-900">
      <div v-if="!loan" class="flex-1 flex items-center justify-center">
          <Spinner class="h-6 w-6 text-neutral-400" />
      </div>
      <div v-else class="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        
        <!-- Context Card -->
        <div class="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Current Loan Reference</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-neutral-500 block text-xs uppercase">Loan No</span>
                    <span class="font-mono font-medium">{{ loan.loan_no }}</span>
                </div>
                <div>
                    <span class="text-neutral-500 block text-xs uppercase">Outstanding Balance</span>
                    <span class="font-bold text-red-600">{{ loan.outstanding_balance_formatted || loan.outstanding_balance }}</span>
                </div>
            </div>
        </div>

        <!-- Step 1: Type -->
        <div class="space-y-4">
            <h3 class="text-base font-bold flex items-center gap-2">
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-nfuko-primary/10 text-xs text-nfuko-primary">1</span>
                Top-Up Strategy
            </h3>
            
            <div class="grid grid-cols-2 gap-4">
                <label 
                    class="cursor-pointer rounded-xl border-2 p-4 transition-all"
                    :class="form.topup_type === 'consolidated' ? 'border-nfuko-primary bg-nfuko-primary/5' : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'"
                >
                    <input type="radio" v-model="form.topup_type" value="consolidated" class="sr-only" />
                    <div class="flex items-center gap-2 mb-1">
                        <Zap class="h-4 w-4" :class="form.topup_type === 'consolidated' ? 'text-nfuko-primary' : 'text-neutral-400'" />
                        <span class="font-bold text-sm">Consolidated</span>
                    </div>
                    <p class="text-xs text-neutral-500">Merges old balance into new loan. Closes current loan.</p>
                </label>

                <label 
                    class="cursor-pointer rounded-xl border-2 p-4 transition-all"
                    :class="form.topup_type === 'parallel' ? 'border-nfuko-primary bg-nfuko-primary/5' : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'"
                >
                    <input type="radio" v-model="form.topup_type" value="parallel" class="sr-only" />
                    <div class="flex items-center gap-2 mb-1">
                        <FileText class="h-4 w-4" :class="form.topup_type === 'parallel' ? 'text-nfuko-primary' : 'text-neutral-400'" />
                        <span class="font-bold text-sm">Parallel</span>
                    </div>
                    <p class="text-xs text-neutral-500">Creates a completely separate new loan account.</p>
                </label>
            </div>
        </div>

        <!-- Step 2: Details -->
        <div class="space-y-4">
            <h3 class="text-base font-bold flex items-center gap-2">
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-nfuko-primary/10 text-xs text-nfuko-primary">2</span>
                Amount & Term
            </h3>

            <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                    <Label class="text-xs font-semibold uppercase text-neutral-500">Fresh Cash Amount</Label>
                    <input 
                        v-model.number="form.fresh_cash_amount" 
                        type="number" 
                        min="0"
                        placeholder="e.g. 50000"
                        class="block w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
                    />
                </div>
                <div class="space-y-2">
                    <Label class="text-xs font-semibold uppercase text-neutral-500">Term (Months)</Label>
                    <input 
                        v-model.number="form.requested_term" 
                        type="number" 
                        min="1"
                        class="block w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800"
                    />
                </div>
            </div>

            <div class="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900 flex justify-between items-center">
                <div>
                    <p class="text-xs text-neutral-500">Projected New Total Loan Amount</p>
                    <p class="text-lg font-bold text-neutral-900 dark:text-white">{{ Number(projectedTotal).toLocaleString() }}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-neutral-500">Estimated DSR</p>
                    <p class="text-lg font-bold" :class="dsrExceedsLimit ? 'text-red-600' : 'text-emerald-600'">
                        {{ dsrAfter.toFixed(1) }}%
                    </p>
                </div>
            </div>
        </div>

        <!-- Eligibility Results -->
        <div v-if="eligibilityResults" class="space-y-4">
             <h3 class="text-base font-bold flex items-center gap-2">
                <span class="flex h-6 w-6 items-center justify-center rounded-full text-xs" :class="eligibilityResults.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">3</span>
                Eligibility Results
            </h3>
            <div class="space-y-2 text-sm">
                <div v-for="fail in eligibilityResults.failed" :key="fail.label" class="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20">
                    <X class="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p class="font-bold">{{ fail.label }}</p>
                        <p class="text-xs opacity-90">{{ fail.reason }}</p>
                    </div>
                </div>
                <div v-for="pass in eligibilityResults.passed" :key="pass.label" class="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-900/20">
                    <svg class="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <div>
                        <p class="font-bold">{{ pass.label }}</p>
                        <p class="text-xs opacity-90">{{ pass.message || 'Check passed successfully.' }}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900 shrink-0">
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 transition-colors dark:text-neutral-300 dark:hover:bg-neutral-800"
            @click="handleClose"
          >
            Cancel
          </button>
          
          <button
            v-if="!eligibilityResults"
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors dark:bg-white dark:text-neutral-900"
            :disabled="loading"
            @click="checkEligibility"
          >
            <Spinner v-if="loading" class="h-4 w-4" />
            <Calculator v-else class="h-4 w-4" />
            Check Eligibility
          </button>

           <button
            v-else
            type="button"
            class="inline-flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-medium text-white transition-colors"
            :class="eligibilityResults.eligible ? 'bg-nfuko-primary hover:bg-nfuko-primary/90' : 'bg-neutral-300 cursor-not-allowed'"
            :disabled="!eligibilityResults.eligible"
            @click="finalize"
          >
            Finalize Top-Up
          </button>
        </div>
      </div>
    </div>
  </Drawer>
</template>
