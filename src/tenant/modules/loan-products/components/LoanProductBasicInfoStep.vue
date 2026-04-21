<script setup lang="ts">
import type { LoanProduct } from '@/tenant/apis/loanProducts/loanProductsApi'

defineProps<{
  form: LoanProduct
  fieldError: (field: string) => string | null
}>()
</script>

<template>
  <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Basic Information</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Product Name <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="e.g. Salary Advance Loan"
          class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
          :class="fieldError('name') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'"
        />
        <p v-if="fieldError('name')" class="mt-1 text-xs text-red-500">
          {{ fieldError('name') }}
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Product Code
        </label>
        <input
          :value="form.code"
          type="text"
          readonly
          class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 cursor-default dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-400"
        />
        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Auto-generated from product name.</p>
      </div>
      <div class="sm:col-span-2">
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Description
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Short operational description for staff"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>
      <div class="sm:col-span-2 flex items-center gap-3">
        <button
          type="button"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          :class="form.is_active ? 'bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
          @click="form.is_active = !form.is_active"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
            :class="form.is_active ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
        <span class="text-sm text-neutral-700 dark:text-neutral-300">
          {{ form.is_active ? 'Active product' : 'Draft / inactive product' }}
        </span>
        <span
          v-if="form.is_in_use"
          class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        >
          In use by {{ form.loan_count ?? 0 }} loans
        </span>
      </div>
    </div>
  </div>
</template>
