<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import type { LoanProduct, DocumentTypeOption } from '@/tenant/apis/loanProducts/loanProductsApi'

defineProps<{
  form: LoanProduct
  documentTypes: DocumentTypeOption[]
  fieldError: (field: string) => string | null
  addRequiredDocument: () => void
  removeRequiredDocument: (index: number) => void
}>()

function yesNoClass(enabled: boolean) {
  return enabled
    ? 'bg-nfuko-primary text-white dark:bg-bg-nfuko-yellow dark:text-black'
    : 'border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
}
</script>

<template>
  <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Workflow and Eligibility</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Savings Appraisal Threshold (%)</label>
        <div class="relative">
          <input
            v-model="form.savings_appraisal_threshold"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="0"
            class="w-full rounded-xl border border-neutral-200 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            :class="fieldError('savings_appraisal_threshold') ? 'border-red-400 dark:border-red-500' : ''"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
        </div>
        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Percentage of applicant savings that does not require appraisal.</p>
        <p v-if="fieldError('savings_appraisal_threshold')" class="mt-1 text-xs text-red-500">{{ fieldError('savings_appraisal_threshold') }}</p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Maximum Securities</label>
        <input
          v-model="form.max_securities"
          type="number"
          min="1"
          placeholder="3"
          class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          :class="fieldError('max_securities') ? 'border-red-400 dark:border-red-500' : ''"
        />
        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Maximum number of securities allowed for a loan.</p>
        <p v-if="fieldError('max_securities')" class="mt-1 text-xs text-red-500">{{ fieldError('max_securities') }}</p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Security Value (%)</label>
        <div class="relative">
          <input
            v-model="form.security_value_percentage"
            type="number"
            min="0"
            step="0.01"
            placeholder="150"
            class="w-full rounded-xl border border-neutral-200 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            :class="fieldError('security_value_percentage') ? 'border-red-400 dark:border-red-500' : ''"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
        </div>
        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Required security value as a percentage of the loan amount.</p>
        <p v-if="fieldError('security_value_percentage')" class="mt-1 text-xs text-red-500">{{ fieldError('security_value_percentage') }}</p>
      </div>
    </div>

    <div class="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Required Documents</h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Define which documents are required for applications under this product.</p>
        </div>
        <button
          type="button"
          class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover: dark:border-neutral-700 dark:text-neutral-400 dark:hover:"
          @click="addRequiredDocument"
        >
          <Plus class="h-3.5 w-3.5" />
          Add Document
        </button>
      </div>

      <div v-if="form.required_documents?.length" class="space-y-3">
        <div
          v-for="(row, index) in form.required_documents"
          :key="index"
          class="grid gap-3 rounded-2xl border border-neutral-200 p-4 sm:grid-cols-12 dark:border-neutral-700"
        >
          <div class="sm:col-span-4">
            <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Document Type</label>
            <select
              v-model="row.document_type_id"
              class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option :value="null">Select document type</option>
              <option v-for="type in documentTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
          </div>
          <div class="sm:col-span-3">
            <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Required Stage</label>
            <select
              v-model="row.required_stage"
              class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="submission">Submission</option>
              <option value="review">Review</option>
              <option value="approval">Approval</option>
              <option value="disbursement">Disbursement</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Order</label>
            <input
              v-model="row.sort_order"
              type="number"
              min="0"
              class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Flags</label>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-xl px-3 py-2 text-xs font-medium"
                :class="yesNoClass(!!row.is_required)"
                @click="row.is_required = !row.is_required"
              >
                {{ row.is_required ? 'Required' : 'Optional' }}
              </button>
              <button
                type="button"
                class="rounded-xl px-3 py-2 text-xs font-medium"
                :class="yesNoClass(!!row.is_active)"
                @click="row.is_active = !row.is_active"
              >
                {{ row.is_active ? 'Active' : 'Inactive' }}
              </button>
            </div>
          </div>
          <div class="sm:col-span-1 flex items-end justify-end">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              @click="removeRequiredDocument(index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
          <div class="sm:col-span-12">
            <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Notes</label>
            <input
              v-model="row.notes"
              type="text"
              placeholder="Optional notes for this requirement"
              class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
        </div>
      </div>
      <div v-else class="rounded-xl border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
        No required documents configured.
      </div>
      <p v-if="fieldError('required_documents')" class="mt-2 text-xs text-red-500">{{ fieldError('required_documents') }}</p>
    </div>
  </div>
</template>
