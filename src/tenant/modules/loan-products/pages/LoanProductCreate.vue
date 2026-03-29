<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Calculator, CreditCard, Plus, Save, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router'
import { useLoanProductForm } from '../composables/useLoanProductCreate'
import PenaltyRuleRow from '../components/PenaltyRuleRow.vue'
import SearchableSelect from '@/Global/SearchableSelect.vue'

const router = useRouter()

const {
    isEditing, loading, saving, errors, form,
    accounts, documentTypes,
    preview, previewLoading, previewAmount, previewTerm,
    addPenaltyRule, removePenaltyRule,
    addRequiredDocument, removeRequiredDocument,
    fieldError, save,
} = useLoanProductForm()

const showAccountingMapping = ref(true)

function yesNoClass(enabled: boolean) {
    return enabled
        ? 'bg-nfuko-primary text-white dark:bg-bg-nfuko-yellow dark:text-black'
        : 'border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
}

function previewMoney(formatted: string | null | undefined, raw: number | string | null | undefined) {
    if (formatted) return formatted
    if (raw == null || raw === '') return '—'
    return formatMoneyValue(raw)
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <button
                class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                @click="router.back()"
            >
                <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <CreditCard class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {{ isEditing ? 'Edit Loan Product' : 'Create Loan Product' }}
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    Configure pricing, repayment behavior, approval rules, penalties, and accounting mappings.
                </p>
            </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">
            Loading…
        </div>

        <form v-else class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" @submit.prevent="save">
            <div class="flex flex-col gap-6">
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Basic Information</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Product Code</label>
                            <input :value="form.code" type="text" readonly
                                class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 cursor-default dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-400" />
                            <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Auto-generated from product name.</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Product Name <span class="text-red-500">*</span></label>
                            <input v-model="form.name" type="text" placeholder="e.g. Salary Advance Loan"
                                class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
                                :class="fieldError('name') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'" />
                            <p v-if="fieldError('name')" class="mt-1 text-xs text-red-500">{{ fieldError('name') }}</p>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
                            <textarea v-model="form.description" rows="3" placeholder="Short operational description for staff"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                        <div class="sm:col-span-2 flex items-center gap-3">
                            <button
                                type="button"
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                                :class="form.is_active ? 'bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
                                @click="form.is_active = !form.is_active"
                            >
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform" :class="form.is_active ? 'translate-x-6' : 'translate-x-1'" />
                            </button>
                            <span class="text-sm text-neutral-700 dark:text-neutral-300">
                                {{ form.is_active ? 'Active product' : 'Draft / inactive product' }}
                            </span>
                            <span v-if="form.is_in_use" class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                In use by {{ form.loan_count ?? 0 }} loans
                            </span>
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Amount and Term</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Minimum Amount</label>
                            <input v-model="form.min_amount" type="number" min="0" step="0.01" placeholder="0.00"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p v-if="fieldError('min_amount')" class="mt-1 text-xs text-red-500">{{ fieldError('min_amount') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Maximum Amount</label>
                            <input v-model="form.max_amount" type="number" min="0" step="0.01" placeholder="0.00"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p v-if="fieldError('max_amount')" class="mt-1 text-xs text-red-500">{{ fieldError('max_amount') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan Duration</label>
                            <input v-model="form.loan_duration" type="number" min="1" placeholder="e.g. 12"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p v-if="fieldError('loan_duration')" class="mt-1 text-xs text-red-500">{{ fieldError('loan_duration') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Duration Unit</label>
                            <select v-model="form.duration_type"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                                <option value="months">Months</option>
                                <option value="years">Years</option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Repayment Cycle</label>
                            <select v-model="form.repayment_cycle"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Biweekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Grace Period (days)</label>
                            <input v-model="form.grace_period" type="number" min="0" placeholder="0"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Days beyond due date before penalty or cancellation.</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Warning Days</label>
                            <input v-model="form.warning_days" type="number" min="0" placeholder="e.g. 7"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="fieldError('warning_days') ? 'border-red-400 dark:border-red-500' : ''" />
                            <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Days before due date to start sending repayment reminders.</p>
                            <p v-if="fieldError('warning_days')" class="mt-1 text-xs text-red-500">{{ fieldError('warning_days') }}</p>
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Interest and Repayment Structure</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Method</label>
                            <div class="grid gap-3 sm:grid-cols-2">
                                <button type="button" class="rounded-2xl border p-4 text-left transition-colors"
                                    :class="form.interest_method === 'flat' ? 'border-nfuko-primary bg-nfuko-primary/5 dark:border-bg-nfuko-yellow dark:bg-bg-nfuko-yellow/10' : 'border-neutral-200 dark:border-neutral-700'"
                                    @click="form.interest_method = 'flat'">
                                    <p class="text-sm font-semibold text-neutral-900 dark:text-white">Flat Rate</p>
                                    <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Interest stays on original principal throughout the term.</p>
                                </button>
                                <button type="button" class="rounded-2xl border p-4 text-left transition-colors"
                                    :class="form.interest_method === 'reducing_balance' ? 'border-nfuko-primary bg-nfuko-primary/5 dark:border-bg-nfuko-yellow dark:bg-bg-nfuko-yellow/10' : 'border-neutral-200 dark:border-neutral-700'"
                                    @click="form.interest_method = 'reducing_balance'">
                                    <p class="text-sm font-semibold text-neutral-900 dark:text-white">Reducing Balance</p>
                                    <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Interest declines as the outstanding balance reduces.</p>
                                </button>
                            </div>
                            <p v-if="fieldError('interest_method')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_method') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Rate (%)</label>
                            <input v-model="form.interest_rate" type="number" min="0" step="0.01" placeholder="0.00"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p v-if="fieldError('interest_rate')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_rate') }}</p>
                        </div>
                        <div v-if="form.interest_method === 'reducing_balance'">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Repayment Structure</label>
                            <select v-model="form.repayment_structure"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                <option value="equal_installment">Equal Installments</option>
                                <option value="equal_principal">Equal Principal</option>
                                <option value="interest_only_balloon">Interest Only with Balloon</option>
                            </select>
                            <p v-if="fieldError('repayment_structure')" class="mt-1 text-xs text-red-500">{{ fieldError('repayment_structure') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Rate Period</label>
                            <select v-model="form.interest_period"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                <option value="per_month">Per Month</option>
                                <option value="per_year">Per Year</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Allow Sub Schedule</label>
                            <div class="flex gap-2">
                                <button type="button" class="rounded-xl px-3 py-2 text-sm font-medium" :class="yesNoClass(!!form.allow_sub_schedule)" @click="form.allow_sub_schedule = true">Yes</button>
                                <button type="button" class="rounded-xl px-3 py-2 text-sm font-medium" :class="yesNoClass(!form.allow_sub_schedule)" @click="form.allow_sub_schedule = false">No</button>
                            </div>
                            <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Allow reducing balance interest generation on a yearly basis.</p>
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Workflow and Eligibility</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Minimum Guarantors</label>
                            <input v-model="form.min_guarantors" type="number" min="0"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Maximum Guarantors</label>
                            <input v-model="form.max_guarantors" type="number" min="0"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                        <div>
                            <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Requires Approval</label>
                            <div class="flex gap-2">
                                <button type="button" class="rounded-xl px-3 py-2 text-sm font-medium" :class="yesNoClass(!!form.requires_approval)" @click="form.requires_approval = true">Yes</button>
                                <button type="button" class="rounded-xl px-3 py-2 text-sm font-medium" :class="yesNoClass(!form.requires_approval)" @click="form.requires_approval = false">No</button>
                            </div>
                        </div>
                        <div>
                            <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Allow Top-up</label>
                            <div class="flex gap-2">
                                <button type="button" class="rounded-xl px-3 py-2 text-sm font-medium" :class="yesNoClass(!!form.allow_top_up)" @click="form.allow_top_up = true">Yes</button>
                                <button type="button" class="rounded-xl px-3 py-2 text-sm font-medium" :class="yesNoClass(!form.allow_top_up)" @click="form.allow_top_up = false">No</button>
                            </div>
                        </div>
                        <div>
                            <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Allow Reschedule</label>
                            <div class="flex gap-2">
                                <button type="button" class="rounded-xl px-3 py-2 text-sm font-medium" :class="yesNoClass(!!form.allow_reschedule)" @click="form.allow_reschedule = true">Yes</button>
                                <button type="button" class="rounded-xl px-3 py-2 text-sm font-medium" :class="yesNoClass(!form.allow_reschedule)" @click="form.allow_reschedule = false">No</button>
                            </div>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Savings Appraisal Threshold (%)</label>
                            <div class="relative">
                                <input v-model="form.savings_appraisal_threshold" type="number" min="0" max="100" step="0.01" placeholder="0"
                                    class="w-full rounded-xl border border-neutral-200 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="fieldError('savings_appraisal_threshold') ? 'border-red-400 dark:border-red-500' : ''" />
                                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                            </div>
                            <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Percentage of applicant savings that does not require appraisal.</p>
                            <p v-if="fieldError('savings_appraisal_threshold')" class="mt-1 text-xs text-red-500">{{ fieldError('savings_appraisal_threshold') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Maximum Securities</label>
                            <input v-model="form.max_securities" type="number" min="1" placeholder="3"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="fieldError('max_securities') ? 'border-red-400 dark:border-red-500' : ''" />
                            <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Maximum number of securities allowed for a loan.</p>
                            <p v-if="fieldError('max_securities')" class="mt-1 text-xs text-red-500">{{ fieldError('max_securities') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Security Value (%)</label>
                            <div class="relative">
                                <input v-model="form.security_value_percentage" type="number" min="0" step="0.01" placeholder="150"
                                    class="w-full rounded-xl border border-neutral-200 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="fieldError('security_value_percentage') ? 'border-red-400 dark:border-red-500' : ''" />
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
                            <button type="button"
                                class="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                @click="addRequiredDocument">
                                <Plus class="h-3.5 w-3.5" />
                                Add Document
                            </button>
                        </div>

                        <div v-if="form.required_documents?.length" class="space-y-3">
                            <div v-for="(row, index) in form.required_documents" :key="index"
                                class="grid gap-3 rounded-2xl border border-neutral-200 p-4 sm:grid-cols-12 dark:border-neutral-700">
                                <div class="sm:col-span-4">
                                    <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Document Type</label>
                                    <select v-model="row.document_type_id"
                                        class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                        <option :value="null">Select document type</option>
                                        <option v-for="type in documentTypes" :key="type.id" :value="type.id">
                                            {{ type.name }}
                                        </option>
                                    </select>
                                </div>
                                <div class="sm:col-span-3">
                                    <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Required Stage</label>
                                    <select v-model="row.required_stage"
                                        class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                        <option value="draft">Draft</option>
                                        <option value="submission">Submission</option>
                                        <option value="review">Review</option>
                                        <option value="approval">Approval</option>
                                        <option value="disbursement">Disbursement</option>
                                    </select>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Order</label>
                                    <input v-model="row.sort_order" type="number" min="0"
                                        class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Flags</label>
                                    <div class="flex gap-2">
                                        <button type="button" class="rounded-xl px-3 py-2 text-xs font-medium" :class="yesNoClass(!!row.is_required)" @click="row.is_required = !row.is_required">
                                            {{ row.is_required ? 'Required' : 'Optional' }}
                                        </button>
                                        <button type="button" class="rounded-xl px-3 py-2 text-xs font-medium" :class="yesNoClass(!!row.is_active)" @click="row.is_active = !row.is_active">
                                            {{ row.is_active ? 'Active' : 'Inactive' }}
                                        </button>
                                    </div>
                                </div>
                                <div class="sm:col-span-1 flex items-end justify-end">
                                    <button type="button"
                                        class="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                                        @click="removeRequiredDocument(index)">
                                        Remove
                                    </button>
                                </div>
                                <div class="sm:col-span-12">
                                    <label class="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">Notes</label>
                                    <input v-model="row.notes" type="text" placeholder="Optional notes for this requirement"
                                        class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                                </div>
                            </div>
                        </div>
                        <div v-else class="rounded-xl border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                            No required documents configured.
                        </div>
                        <p v-if="fieldError('required_documents')" class="mt-2 text-xs text-red-500">{{ fieldError('required_documents') }}</p>
                    </div>
                </div>

                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Fees and Penalties</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Processing Fee Type</label>
                            <select v-model="form.processing_fee_type"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                <option value="none">None</option>
                                <option value="flat">Flat Amount</option>
                                <option value="percentage">Percentage</option>
                            </select>
                        </div>
                        <div v-if="form.processing_fee_type !== 'none'">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Processing Fee Value</label>
                            <input v-model="form.processing_fee_value" type="number" min="0" step="0.01"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Type</label>
                            <select v-model="form.penalty_type"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                <option value="none">None</option>
                                <option value="flat">Flat Amount</option>
                                <option value="percentage">Percentage</option>
                            </select>
                        </div>
                        <div v-if="form.penalty_type !== 'none'">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Value</label>
                            <input v-model="form.penalty_rate" type="number" min="0" step="0.01"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                    </div>

                    <div class="mt-6">
                        <div class="mb-4 flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Penalty Rules</h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">Optional detailed late-payment rules.</p>
                            </div>
                            <button type="button"
                                class="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                @click="addPenaltyRule">
                                <Plus class="h-3.5 w-3.5" />
                                Add Rule
                            </button>
                        </div>

                        <div v-if="form.penalty_rules?.length" class="flex flex-col gap-3">
                            <PenaltyRuleRow
                                v-for="(rule, index) in form.penalty_rules"
                                :key="index"
                                :rule="rule"
                                @remove="removePenaltyRule(index)"
                            />
                        </div>
                        <div v-else class="rounded-xl border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                            No additional penalty rules configured.
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="mb-5 flex items-center justify-between">
                        <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Accounting Mapping</h2>
                        <button type="button"
                            class="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                            @click="showAccountingMapping = !showAccountingMapping">
                            <component :is="showAccountingMapping ? ChevronUp : ChevronDown" class="h-3.5 w-3.5" />
                            {{ showAccountingMapping ? 'Hide' : 'Show' }}
                        </button>
                    </div>
                    <template v-if="showAccountingMapping">
                    <p class="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
                        These accounts define where journal entries are posted for loan transactions. Defaults are pre-filled from your chart of accounts — change them if needed.
                    </p>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan Portfolio Account</label>
                            <SearchableSelect
                                v-model="form.loan_portfolio_account_id"
                                :options="accounts"
                                placeholder="Select loan portfolio account"
                                :error="fieldError('loan_portfolio_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Income Account</label>
                            <SearchableSelect
                                v-model="form.interest_income_account_id"
                                :options="accounts"
                                placeholder="Select interest income account"
                                :error="fieldError('interest_income_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Receivable Account</label>
                            <SearchableSelect
                                v-model="form.interest_receivable_account_id"
                                :options="accounts"
                                placeholder="Select interest receivable account"
                                :error="fieldError('interest_receivable_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Disbursement Account</label>
                            <SearchableSelect
                                v-model="form.disbursement_account_id"
                                :options="accounts"
                                placeholder="Select disbursement account"
                                :error="fieldError('disbursement_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Income Account</label>
                            <SearchableSelect
                                v-model="form.penalty_income_account_id"
                                :options="accounts"
                                placeholder="Select penalty income account"
                                :error="fieldError('penalty_income_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Receivable Account</label>
                            <SearchableSelect
                                v-model="form.penalty_receivable_account_id"
                                :options="accounts"
                                placeholder="Select penalty receivable account"
                                :error="fieldError('penalty_receivable_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Charges Income Account</label>
                            <SearchableSelect
                                v-model="form.charges_income_account_id"
                                :options="accounts"
                                placeholder="Select charges income account"
                                :error="fieldError('charges_income_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Charges Receivable Account</label>
                            <SearchableSelect
                                v-model="form.charges_receivable_account_id"
                                :options="accounts"
                                placeholder="Select charges receivable account"
                                :error="fieldError('charges_receivable_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                    </div>
                    </template>
                </div>

                <div class="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        @click="router.back()"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="inline-flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:bg-nfuko-primary/90 disabled:opacity-50 dark:bg-bg-nfuko-yellow dark:text-black"
                        :disabled="saving"
                    >
                        <Save class="h-4 w-4" />
                        {{ saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Product' }}
                    </button>
                </div>
            </div>

            <div class="space-y-6">
                <div class="sticky top-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="mb-4 flex items-center gap-2">
                        <Calculator class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                        <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Live Preview</h2>
                    </div>

                    <div class="space-y-4">
                        <div class="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Preview Amount</label>
                                <input v-model="previewAmount" type="number" min="0" step="0.01" placeholder="500000"
                                    class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            </div>
                            <div>
                                <label class="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Preview Term</label>
                                <input v-model="previewTerm" type="number" min="1" placeholder="12"
                                    class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            </div>
                        </div>

                        <div class="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/60">
                            <p class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Method Summary</p>
                            <p class="mt-2 text-sm text-neutral-900 dark:text-white">
                                {{ form.interest_method === 'reducing_balance' ? 'Reducing balance' : form.interest_method === 'flat' ? 'Flat rate' : 'Select an interest method' }}
                            </p>
                            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                <span v-if="form.interest_method === 'reducing_balance' && form.repayment_structure === 'equal_installment'">Installments stay level while principal share rises over time.</span>
                                <span v-else-if="form.interest_method === 'reducing_balance' && form.repayment_structure === 'equal_principal'">Principal stays fixed and total installments decline over time.</span>
                                <span v-else-if="form.interest_method === 'flat'">Interest is spread on original principal for the full term.</span>
                                <span v-else>Preview will update once the core pricing fields are filled in.</span>
                            </p>
                        </div>

                        <div v-if="previewLoading" class="py-10 text-center text-sm text-neutral-400">
                            Calculating preview…
                        </div>

                        <template v-else-if="preview">
                            <div class="grid gap-3">
                                <div class="rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800">
                                    <p class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Estimated Installment</p>
                                    <p class="mt-1 text-xl font-semibold text-neutral-900 dark:text-white">{{ previewMoney(preview.installment_amount_formatted, preview.installment_amount) }}</p>
                                </div>
                                <div class="grid gap-3 sm:grid-cols-2">
                                    <div class="rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800">
                                        <p class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Total Interest</p>
                                        <p class="mt-1 text-base font-semibold text-neutral-900 dark:text-white">{{ previewMoney(preview.total_interest_formatted, preview.total_interest) }}</p>
                                    </div>
                                    <div class="rounded-2xl border border-neutral-100 p-4 dark:border-neutral-800">
                                        <p class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Total Repayment</p>
                                        <p class="mt-1 text-base font-semibold text-neutral-900 dark:text-white">{{ previewMoney(preview.total_repayment_formatted, preview.total_repayment) }}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p class="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Schedule Snapshot</p>
                                <div class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                    <table class="w-full text-xs">
                                        <thead class="bg-neutral-50 text-neutral-500 dark:bg-neutral-800/70 dark:text-neutral-400">
                                            <tr>
                                                <th class="px-3 py-2 text-left">#</th>
                                                <th class="px-3 py-2 text-right">Principal</th>
                                                <th class="px-3 py-2 text-right">Interest</th>
                                                <th class="px-3 py-2 text-right">Installment</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            <tr v-for="row in preview.schedule_preview" :key="row.period">
                                                <td class="px-3 py-2 text-neutral-700 dark:text-neutral-200">{{ row.period }}</td>
                                                <td class="px-3 py-2 text-right text-neutral-600 dark:text-neutral-300">{{ previewMoney(row.principal_formatted, row.principal) }}</td>
                                                <td class="px-3 py-2 text-right text-neutral-600 dark:text-neutral-300">{{ previewMoney(row.interest_formatted, row.interest) }}</td>
                                                <td class="px-3 py-2 text-right font-medium text-neutral-900 dark:text-white">{{ previewMoney(row.installment_formatted, row.installment) }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div v-if="preview.messages?.length" class="space-y-2">
                                <p v-for="message in preview.messages" :key="message" class="text-xs text-neutral-500 dark:text-neutral-400">
                                    {{ message }}
                                </p>
                            </div>
                        </template>

                        <div v-else class="rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                            Fill in interest method, rate, term, and preview amount to generate a repayment sample.
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>
