<script setup lang="ts">
import { onMounted, watch } from 'vue'
import type { LoanProduct } from '@/tenant/apis/loanProducts/loanProductsApi'
import { amountHint } from '../utils/loanProductHelpers'

const props = defineProps<{
  form: LoanProduct
  fieldError: (field: string) => string | null
}>()

const amountFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20
})

function formatValue(val: number | string | null | undefined): string {
    if (val == null || val === '') return ''
    
    // Ensure we are working with a string representation of the number
    const strVal = val.toString().replace(/,/g, '')
    const parts = strVal.split('.')
    
    // Format the integer part with commas
    const integerPart = parts[0]
    const formattedInteger = integerPart ? amountFormatter.format(Number(integerPart)) : '0'
    
    // Reattach the decimal part if it exists
    return parts.length > 1 ? `${formattedInteger}.${parts[1]}` : formattedInteger
}

function handleAmountInput(event: Event, field: 'min_amount' | 'max_amount') {
    const input = event.target as HTMLInputElement
    const cursorPosition = input.selectionStart || 0
    const originalValue = input.value
    
    // Count commas before cursor to preserve position later
    const commasBefore = (originalValue.substring(0, cursorPosition).match(/,/g) || []).length
    
    // 1. Remove all commas
    let clean = originalValue.replace(/,/g, '')
    
    // 2. Handle multiple dots (keep only the first one)
    const dotIndex = clean.indexOf('.')
    if (dotIndex !== -1) {
        clean = clean.substring(0, dotIndex + 1) + clean.substring(dotIndex + 1).replace(/\./g, '')
    }
    
    // 3. Final strip of any other non-numeric chars (except the one allowed dot)
    clean = clean.replace(/[^0-9.]/g, '')
    
    // Update the model
    props.form[field] = clean === '' ? null : (clean === '.' ? 0 : Number(clean))
    
    // 4. Format for display
    const formattedValue = formatValue(clean)
    input.value = formattedValue
    
    // 5. Restore cursor position
    const commasAfter = (formattedValue.substring(0, cursorPosition).match(/,/g) || []).length
    const newCursorPos = cursorPosition + (commasAfter - commasBefore)
    
    requestAnimationFrame(() => {
        input.setSelectionRange(newCursorPos, newCursorPos)
    })
}
</script>

<template>
  <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Amount and Term</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Minimum Amount</label>
        <input
          :value="formatValue(form.min_amount)"
          @input="handleAmountInput($event, 'min_amount')"
          type="text"
          inputmode="decimal"
          placeholder="0.00"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        <p v-if="fieldError('min_amount')" class="mt-1 text-xs text-red-500">{{ fieldError('min_amount') }}</p>
        <p v-else-if="amountHint(form.min_amount)" class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Formatted: {{ amountHint(form.min_amount) }}
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Maximum Amount</label>
        <input
          :value="formatValue(form.max_amount)"
          @input="handleAmountInput($event, 'max_amount')"
          type="text"
          inputmode="decimal"
          placeholder="0.00"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        <p v-if="fieldError('max_amount')" class="mt-1 text-xs text-red-500">{{ fieldError('max_amount') }}</p>
        <p v-else-if="amountHint(form.max_amount)" class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Formatted: {{ amountHint(form.max_amount) }}
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan Duration</label>
        <input
          v-model="form.loan_duration"
          type="number"
          min="1"
          placeholder="e.g. 12"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        <p v-if="fieldError('loan_duration')" class="mt-1 text-xs text-red-500">{{ fieldError('loan_duration') }}</p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Duration Unit</label>
        <select
          v-model="form.duration_type"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months</option>
          <option value="years">Years</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Repayment Cycle</label>
        <select
          v-model="form.repayment_cycle"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Period used to create repayment schedules eg payment is per week etc.
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Grace Period (days)</label>
        <input
          v-model="form.grace_period"
          type="number"
          min="0"
          placeholder="0"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Days beyond due date before penalty or cancellation.</p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Warning Days</label>
        <input
          v-model="form.warning_days"
          type="number"
          min="0"
          placeholder="e.g. 7"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          :class="fieldError('warning_days') ? 'border-red-400 dark:border-red-500' : ''"
        />
        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Days before due date to start sending repayment reminders.</p>
        <p v-if="fieldError('warning_days')" class="mt-1 text-xs text-red-500">{{ fieldError('warning_days') }}</p>
      </div>
    </div>
  </div>
</template>
