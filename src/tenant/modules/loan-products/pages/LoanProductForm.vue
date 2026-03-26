<script setup lang="ts">
import { CreditCard, ArrowLeft, Plus, Save } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useLoanProductForm } from '../composables/useLoanProductForm'
import PenaltyRuleRow from '../components/PenaltyRuleRow.vue'

const router = useRouter()

const {
    isEditing, loading, saving, errors, form,
    addPenaltyRule, removePenaltyRule,
    fieldError, save,
} = useLoanProductForm()
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">

        <!-- Header -->
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
                    {{ isEditing ? 'Edit Loan Product' : 'New Loan Product' }}
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    {{ isEditing ? 'Update the loan product details below.' : 'Fill in the details to create a new loan product.' }}
                </p>
            </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">
            Loading…
        </div>

        <form v-else class="flex flex-col gap-6 max-w-3xl" @submit.prevent="save">

            <!-- General Information -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">General Information</h2>
                <div class="grid gap-4 sm:grid-cols-2">

                    <div class="sm:col-span-2">
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Product Name <span class="text-red-500">*</span></label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="e.g. Personal Loan"
                            class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                            :class="fieldError('name') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'"
                        />
                        <p v-if="fieldError('name')" class="mt-1 text-xs text-red-500">{{ fieldError('name') }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Minimum Amount</label>
                        <input
                            v-model="form.min_amount"
                            type="number" min="0" step="0.01" placeholder="0.00"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <p v-if="fieldError('min_amount')" class="mt-1 text-xs text-red-500">{{ fieldError('min_amount') }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Maximum Amount</label>
                        <input
                            v-model="form.max_amount"
                            type="number" min="0" step="0.01" placeholder="0.00"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <p v-if="fieldError('max_amount')" class="mt-1 text-xs text-red-500">{{ fieldError('max_amount') }}</p>
                    </div>

                    <div class="sm:col-span-2 flex items-center gap-3">
                        <button
                            type="button"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                            :class="form.is_active ? 'bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'"
                            @click="form.is_active = !form.is_active"
                        >
                            <span
                                class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                                :class="form.is_active ? 'translate-x-6' : 'translate-x-1'"
                            />
                        </button>
                        <span class="text-sm text-neutral-700 dark:text-neutral-300">
                            {{ form.is_active ? 'Active' : 'Inactive' }}
                        </span>
                    </div>

                </div>
            </div>

            <!-- Interest Settings -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">Interest Settings</h2>
                <div class="grid gap-4 sm:grid-cols-2">

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Interest Method</label>
                        <select
                            v-model="form.interest_method"
                            class="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:bg-neutral-800 dark:text-white"
                            :class="fieldError('interest_method') ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'"
                        >
                            <option :value="null">Select method…</option>
                            <option value="flat">Flat Rate</option>
                            <option value="reducing_balance">Reducing Balance</option>
                        </select>
                        <p v-if="form.interest_method === 'flat'" class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                            Interest is calculated on the original principal throughout the loan term.
                        </p>
                        <p v-else-if="form.interest_method === 'reducing_balance'" class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                            Interest is calculated on the outstanding balance, reducing each period.
                        </p>
                        <p v-if="fieldError('interest_method')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_method') }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Interest Rate (%)</label>
                        <input
                            v-model="form.interest_rate"
                            type="number" min="0" step="0.01" placeholder="0.00"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <p v-if="fieldError('interest_rate')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_rate') }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Interest Period</label>
                        <select
                            v-model="form.interest_period"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        >
                            <option :value="null">Select period…</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        <p v-if="fieldError('interest_period')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_period') }}</p>
                    </div>

                </div>
            </div>

            <!-- Loan Term & Repayment -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">Loan Term &amp; Repayment</h2>
                <div class="grid gap-4 sm:grid-cols-2">

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Loan Duration</label>
                        <input
                            v-model="form.loan_duration"
                            type="number" min="1" placeholder="e.g. 12"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <p v-if="fieldError('loan_duration')" class="mt-1 text-xs text-red-500">{{ fieldError('loan_duration') }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Duration Unit</label>
                        <select
                            v-model="form.duration_type"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        >
                            <option :value="null">Select unit…</option>
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                        </select>
                        <p v-if="fieldError('duration_type')" class="mt-1 text-xs text-red-500">{{ fieldError('duration_type') }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Repayment Cycle</label>
                        <select
                            v-model="form.repayment_cycle"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        >
                            <option :value="null">Select cycle…</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        <p v-if="fieldError('repayment_cycle')" class="mt-1 text-xs text-red-500">{{ fieldError('repayment_cycle') }}</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Grace Period (days)</label>
                        <input
                            v-model="form.grace_period"
                            type="number" min="0" placeholder="0"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <p v-if="fieldError('grace_period')" class="mt-1 text-xs text-red-500">{{ fieldError('grace_period') }}</p>
                    </div>

                </div>
            </div>

            <!-- Guarantors -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">Guarantors</h2>
                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Minimum Guarantors</label>
                        <input
                            v-model="form.min_guarantors"
                            type="number" min="0" placeholder="0"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <p v-if="fieldError('min_guarantors')" class="mt-1 text-xs text-red-500">{{ fieldError('min_guarantors') }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Maximum Guarantors</label>
                        <input
                            v-model="form.max_guarantors"
                            type="number" min="0" placeholder="0"
                            class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        />
                        <p v-if="fieldError('max_guarantors')" class="mt-1 text-xs text-red-500">{{ fieldError('max_guarantors') }}</p>
                    </div>
                </div>
            </div>

            <!-- Penalty Rules -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Penalty Rules</h2>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Define late payment fees for this product.</p>
                    </div>
                    <button
                        type="button"
                        class="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                        @click="addPenaltyRule"
                    >
                        <Plus class="h-3.5 w-3.5" />
                        Add Rule
                    </button>
                </div>

                <div v-if="form.penalty_rules!.length === 0" class="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
                    No penalty rules defined. Click "Add Rule" to configure late payment penalties.
                </div>

                <div v-else class="flex flex-col gap-3">
                    <PenaltyRuleRow
                        v-for="(rule, idx) in form.penalty_rules"
                        :key="idx"
                        :rule="rule"
                        @remove="removePenaltyRule(idx)"
                    />
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pb-6">
                <button
                    type="button"
                    class="rounded-xl px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                    @click="router.back()"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-nfuko-primary/90 transition-colors disabled:opacity-50 dark:bg-bg-nfuko-yellow dark:text-black"
                    :disabled="saving"
                >
                    <Save class="h-4 w-4" />
                    {{ saving ? 'Saving…' : (isEditing ? 'Update Product' : 'Create Product') }}
                </button>
            </div>

        </form>

    </div>
</template>
