<script setup lang="ts">
import type { LoanProduct } from '@/tenant/apis/loanProducts/loanProductsApi'

defineProps<{
  form: LoanProduct
  fieldError: (field: string) => string | null
}>()
</script>

<template>
  <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Interest and Repayment Structure</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Method</label>
        <div class="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-2xl border p-4 text-left transition-colors"
            :class="form.interest_method === 'flat' ? 'border-nfuko-primary bg-nfuko-primary/5 dark:border-bg-nfuko-yellow dark:bg-bg-nfuko-yellow/10' : 'border-neutral-200 dark:border-neutral-700'"
            @click="form.interest_method = 'flat'"
          >
            <p class="text-sm font-semibold text-neutral-900 dark:text-white">Flat Rate</p>
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Interest stays on original principal throughout the term.</p>
          </button>
          <button
            type="button"
            class="rounded-2xl border p-4 text-left transition-colors"
            :class="form.interest_method === 'reducing_balance' ? 'border-nfuko-primary bg-nfuko-primary/5 dark:border-bg-nfuko-yellow dark:bg-bg-nfuko-yellow/10' : 'border-neutral-200 dark:border-neutral-700'"
            @click="form.interest_method = 'reducing_balance'"
          >
            <p class="text-sm font-semibold text-neutral-900 dark:text-white">Reducing Balance</p>
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Interest declines as the outstanding balance reduces.</p>
          </button>
        </div>
        <p v-if="fieldError('interest_method')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_method') }}</p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Rate (%)</label>
        <input
          v-model="form.interest_rate"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        <p v-if="fieldError('interest_rate')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_rate') }}</p>
      </div>
      <div v-if="form.interest_method === 'reducing_balance'">
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Repayment Structure</label>
        <select
          v-model="form.repayment_structure"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option value="equal_installment">Equal Installments</option>
          <option value="equal_principal">Equal Principal</option>
          <option value="interest_only_balloon">Interest Only with Balloon</option>
        </select>
        <p v-if="fieldError('repayment_structure')" class="mt-1 text-xs text-red-500">{{ fieldError('repayment_structure') }}</p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Rate Period</label>
        <select
          v-model="form.interest_period"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option value="per_month">Per Month</option>
          <option value="per_year">Per Year</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
    </div>
  </div>
</template>
