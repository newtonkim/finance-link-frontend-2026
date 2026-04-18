<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/Global/ui/dialog'
import { Button } from '@/Global/ui/button'
import { Label } from '@/Global/ui/label'
import { Input } from '@/Global/ui/input'
import { Checkbox } from '@/Global/ui/checkbox'
import { 
  Loader2 as LucideSpinner, 
  CalendarClock as LucideCalendarClock, 
  Percent as LucidePercent, 
  Banknote as LucideBanknote, 
  CheckCircle as LucideCheckCircle,
  AlertTriangle as LucideAlertTriangle
} from 'lucide-vue-next'
import { notify } from '@/Global/Toasters/ToastMsg'
import { loansApi, type RescheduleParams, type ReschedulePreviewResult } from '@/tenant/apis/loans/loansApi'
import { formatMoneyValue } from '@/Global'
import { Alert, AlertDescription, AlertTitle } from '@/Global/ui/alert'

const props = defineProps<{
  loan: any
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'close'): void
}>()



const open = ref(false)
const step = ref<1 | 2 | 3>(1)
const isPreviewing = ref(false)
const isSubmitting = ref(false)
const previewData = ref<ReschedulePreviewResult | null>(null)

// Form state
const rescheduleType = ref<'tenor_extension' | 'rate_change' | 'capitalization'>('tenor_extension')
const newTenorMonths = ref<number | null>(null)
const newInterestRate = ref<number | null>(null)
const capitalizeArrears = ref<boolean>(false)
const penaltiesWaived = ref<number>(0)
const interestWaived = ref<number>(0)
const reason = ref('')
const rescheduleDate = ref(new Date().toISOString().slice(0, 10))

// Reset form when opened with a new loan
watch(() => props.loan, (newLoan) => {
  if (newLoan) {
    newTenorMonths.value = newLoan.term_months || 0
    newInterestRate.value = parseFloat(newLoan.interest_rate || '0')
    capitalizeArrears.value = false
    penaltiesWaived.value = 0
    interestWaived.value = 0
    reason.value = ''
    step.value = 1
    previewData.value = null
  }
}, { immediate: true })

const canPreview = computed(() => {
  if (!reason.value || reason.value.trim() === '') return false
  if (rescheduleType.value === 'tenor_extension' && !newTenorMonths.value) return false
  if (rescheduleType.value === 'rate_change' && newInterestRate.value === null) return false
  return true
})

function buildParams(): RescheduleParams {
  return {
    reschedule_type: rescheduleType.value,
    new_tenor_months: newTenorMonths.value ? Number(newTenorMonths.value) : undefined,
    new_interest_rate: newInterestRate.value !== null ? Number(newInterestRate.value) : undefined,
    capitalize_arrears: capitalizeArrears.value,
    penalties_waived: penaltiesWaived.value ? Number(penaltiesWaived.value) : 0,
    interest_waived: interestWaived.value ? Number(interestWaived.value) : 0,
    reschedule_date: rescheduleDate.value,
    reason: reason.value
  }
}

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
    notify({
      type: 'error',
      msg: errorMsg,
    })
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
    notify({
      type: 'success',
      msg: 'Loan rescheduled successfully.',
    })
  } catch (error: any) {
    let errorMsg = 'An error occurred during rescheduling.'
    if (error.response?.data?.errors) {
      errorMsg = Object.values(error.response.data.errors).flat()[0] as string
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message
    }
    notify({
      type: 'error',
      msg: errorMsg,
    })
  } finally {
    isSubmitting.value = false
  }
}

function handleDone() {
  emit('success')
  close()
}

function show() {
  step.value = 1
  open.value = true
}

function close() {
  open.value = false
  setTimeout(() => {
    step.value = 1
    previewData.value = null
  }, 300)
  emit('close')
}

defineExpose({
  show,
  close
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Reschedule Loan: {{ loan?.loan_no }}</DialogTitle>
      </DialogHeader>
      
      <!-- Step 1: Configuration -->
      <div v-if="step === 1" class="py-2 space-y-6">
        <!-- Loan Summary Card -->
        <div class="bg-neutral-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border border-neutral-100">
          <div>
            <div class="text-neutral-500 mb-1">Outstanding Balance</div>
            <div class="font-medium text-neutral-900">{{ loan?.outstanding_balance_formatted }}</div>
          </div>
          <div>
            <div class="text-neutral-500 mb-1">Current Term</div>
            <div class="font-medium text-neutral-900">{{ loan?.term_months }} months</div>
          </div>
          <div>
            <div class="text-neutral-500 mb-1">Interest Rate</div>
            <div class="font-medium text-neutral-900">{{ loan?.interest_rate }}%</div>
          </div>
          <div>
            <div class="text-neutral-500 mb-1">Status</div>
            <div>
              <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                {{ loan?.status }}
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <Label class="text-base">Select Reschedule Type</Label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div 
              @click="rescheduleType = 'tenor_extension'"
              class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:border-blue-500 focus:outline-none"
              :class="[rescheduleType === 'tenor_extension' ? 'border-transparent ring-2 ring-blue-600' : 'border-gray-200']"
            >
              <div class="flex items-center gap-3">
                <div class="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                  <LucideCalendarClock class="w-4 h-4" />
                </div>
                <div class="flex flex-col">
                  <span class="block text-sm font-medium text-gray-900">Extend Term</span>
                  <span class="block text-xs text-gray-500 mt-0.5">Increase loan duration</span>
                </div>
              </div>
            </div>

            <div 
              @click="rescheduleType = 'rate_change'"
              class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:border-blue-500 focus:outline-none"
              :class="[rescheduleType === 'rate_change' ? 'border-transparent ring-2 ring-blue-600' : 'border-gray-200']"
            >
              <div class="flex items-center gap-3">
                <div class="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600">
                  <LucidePercent class="w-4 h-4" />
                </div>
                <div class="flex flex-col">
                  <span class="block text-sm font-medium text-gray-900">Change Rate</span>
                  <span class="block text-xs text-gray-500 mt-0.5">Adjust interest rate</span>
                </div>
              </div>
            </div>

            <div 
              @click="rescheduleType = 'capitalization'"
              class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:border-amber-500 focus:outline-none"
              :class="[rescheduleType === 'capitalization' ? 'border-transparent ring-2 ring-amber-600' : 'border-gray-200']"
            >
              <div class="flex items-center gap-3">
                <div class="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600">
                  <LucideBanknote class="w-4 h-4" />
                </div>
                <div class="flex flex-col">
                  <span class="block text-sm font-medium text-gray-900">Capitalize</span>
                  <span class="block text-xs text-gray-500 mt-0.5">Roll arrears into principal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-6 p-4 rounded-xl border border-neutral-200 bg-white shadow-sm">
          <!-- Dynamic inputs based on type -->
          <div v-if="rescheduleType === 'tenor_extension'" class="space-y-4">
            <h3 class="font-medium text-sm text-neutral-800">Extend Repayment Term</h3>
            <div class="grid gap-2">
              <Label>New Total Remaining Term (Months)</Label>
              <Input type="number" v-model="newTenorMonths" />
              <p class="text-xs text-neutral-500">The total number of months to pay off the remaining balance.</p>
            </div>
          </div>

          <div v-if="rescheduleType === 'rate_change'" class="space-y-4">
            <h3 class="font-medium text-sm text-neutral-800">Adjust Interest Rate</h3>
            <div class="grid gap-2">
              <Label>New Interest Rate (%)</Label>
              <Input type="number" step="0.01" v-model="newInterestRate" />
            </div>
          </div>

          <div v-if="rescheduleType === 'capitalization'" class="space-y-4">
            <h3 class="font-medium text-sm text-neutral-800">Arrears Capitalization</h3>
            <div class="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-100 rounded-md">
              <Checkbox id="capArrears" v-model:checked="capitalizeArrears" />
              <div class="grid gap-1.5 leading-none">
                <label for="capArrears" class="text-sm font-medium leading-none text-amber-900">
                  Capitalize outstanding arrears
                </label>
                <p class="text-sm text-amber-700">
                  This will add any outstanding penalty, interest, and charge arrears to the new principal balance.
                </p>
              </div>
            </div>
          </div>

          <!-- Common fields -->
          <div class="pt-4 border-t border-neutral-100 space-y-4">
            <h3 class="font-medium text-sm text-neutral-800">Waivers (Optional)</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label>Penalties Waived Amount</Label>
                <Input type="number" v-model="penaltiesWaived" />
              </div>
              <div class="grid gap-2">
                <Label>Interest Waived Amount</Label>
                <Input type="number" v-model="interestWaived" />
              </div>
            </div>
          </div>

          <div class="grid gap-2 pt-2">
            <Label>Effective Date</Label>
            <Input type="date" v-model="rescheduleDate" />
          </div>

          <div class="grid gap-2 pt-2">
            <Label>Reason / Justification <span class="text-red-500">*</span></Label>
            <textarea 
              v-model="reason" 
              placeholder="Enter the rationale for restructuring this loan..." 
              rows="3"
              class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" @click="close">Cancel</Button>
          <Button :disabled="!canPreview || isPreviewing" @click="handlePreview">
            <LucideSpinner v-if="isPreviewing" class="w-4 h-4 mr-2 animate-spin" />
            Preview New Schedule
          </Button>
        </div>
      </div>

      <!-- Step 2: Review Preview -->
      <div v-if="step === 2 && previewData" class="py-2 space-y-6">
        
        <Alert v-if="previewData.capitalized_arrears > 0" class="bg-amber-50 border-amber-200">
          <LucideAlertTriangle class="h-4 w-4 text-amber-600" />
          <AlertTitle class="text-amber-800">Arrears Capitalized</AlertTitle>
          <AlertDescription class="text-amber-700">
            {{ formatMoneyValue(previewData.capitalized_arrears) }} of arrears has been added to the new principal balance.
          </AlertDescription>
        </Alert>

        <div class="grid grid-cols-2 gap-6">
          <!-- Before -->
          <div class="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
            <h3 class="font-medium text-sm mb-3 flex items-center text-neutral-500">
              <span class="w-2 h-2 rounded-full bg-neutral-400 mr-2"></span> Before Reschedule
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-500">Outstanding Balance:</span>
                <span class="font-medium text-neutral-900">{{ formatMoneyValue(previewData.old_snapshot.outstanding_balance) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">Remaining Term:</span>
                <span class="font-medium text-neutral-900">{{ previewData.old_snapshot.remaining_periods }} months</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">Interest Rate:</span>
                <span class="font-medium text-neutral-900">{{ previewData.old_snapshot.interest_rate }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">Maturity Date:</span>
                <span class="font-medium text-neutral-900">{{ previewData.old_snapshot.maturity_date || '-' }}</span>
              </div>
              <div v-if="previewData.old_snapshot.arrears_amount > 0" class="flex justify-between pt-2 border-t text-amber-700">
                <span>Total Arrears:</span>
                <span class="font-medium">{{ formatMoneyValue(previewData.old_snapshot.arrears_amount) }}</span>
              </div>
            </div>
          </div>

          <!-- After -->
          <div class="rounded-lg border border-blue-200 p-4 bg-blue-50/50">
            <h3 class="font-medium text-sm mb-3 flex items-center text-blue-700">
              <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> After Reschedule
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-500">New Principal:</span>
                <span class="font-semibold text-blue-900">{{ formatMoneyValue(previewData.new_snapshot.principal_balance) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">New Term:</span>
                <span class="font-medium text-blue-900">{{ previewData.new_snapshot.tenor_months }} months</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">New Interest Rate:</span>
                <span class="font-medium text-blue-900">{{ previewData.new_snapshot.interest_rate }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">New Maturity:</span>
                <span class="font-medium text-blue-900">{{ previewData.new_snapshot.maturity_date }}</span>
              </div>
              <div class="flex justify-between pt-2 border-t text-blue-800">
                <span>New Installment:</span>
                <span class="font-semibold">{{ formatMoneyValue(previewData.new_snapshot.installment_amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="font-medium text-sm text-neutral-800">Preview of New Schedule</h3>
          <div class="border rounded-md overflow-hidden">
            <div class="max-h-[250px] overflow-y-auto">
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-neutral-500 bg-neutral-50 sticky top-0 border-b">
                  <tr>
                    <th class="px-4 py-2 font-medium">No.</th>
                    <th class="px-4 py-2 font-medium">Date</th>
                    <th class="px-4 py-2 font-medium text-right">Principal</th>
                    <th class="px-4 py-2 font-medium text-right">Interest</th>
                    <th class="px-4 py-2 font-medium text-right">Total</th>
                    <th class="px-4 py-2 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="row in previewData.preview_schedule" :key="row.period" class="hover:bg-neutral-50/50">
                    <td class="px-4 py-2">{{ row.period }}</td>
                    <td class="px-4 py-2 tabular-nums">{{ row.due_date }}</td>
                    <td class="px-4 py-2 tabular-nums text-right">{{ formatMoneyValue(row.principal) }}</td>
                    <td class="px-4 py-2 tabular-nums text-right">{{ formatMoneyValue(row.interest) }}</td>
                    <td class="px-4 py-2 tabular-nums text-right font-medium">{{ formatMoneyValue(row.installment) }}</td>
                    <td class="px-4 py-2 tabular-nums text-right text-neutral-500">{{ formatMoneyValue(row.balance) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="flex justify-between gap-3 pt-4 border-t">
          <Button variant="outline" @click="step = 1" :disabled="isSubmitting">Back</Button>
          <div class="flex gap-2">
            <Button variant="outline" @click="close" :disabled="isSubmitting">Cancel</Button>
            <Button @click="handleSubmit" :disabled="isSubmitting" class="bg-blue-600 hover:bg-blue-700">
              <LucideSpinner v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div v-if="step === 3" class="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
          <LucideCheckCircle class="w-8 h-8" />
        </div>
        <div>
          <h2 class="text-xl font-semibold text-neutral-900">Loan Rescheduled</h2>
          <p class="text-neutral-500 mt-2 max-w-sm mx-auto">
            The loan has been successfully restructured and the repayment schedule has been updated.
          </p>
        </div>
        <div class="pt-6">
          <Button @click="handleDone" class="px-8">Close & View Schedule</Button>
        </div>
      </div>

    </DialogContent>
  </Dialog>
</template>
