<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CreditCard, ArrowLeft, Pencil, ToggleRight, ToggleLeft } from 'lucide-vue-next'
import { useLoanProductShow } from '../composables/useLoanProductShow'

const router = useRouter()
const { product, loading, fetch, interestMethodLabel, orDash } = useLoanProductShow()

onMounted(fetch)

function moneyOrDash(formatted?: string | null, raw?: string | number | null) {
    if (formatted) return formatted
    return orDash(raw)
}

function processingFeeLabel() {
    if (!product.value) return '—'
    const feeType = product.value.processing_fee_type
    if (!feeType || feeType === 'none') return 'None'
    if (feeType === 'percentage') return `${product.value.processing_fee_value ?? '—'}%`
    return moneyOrDash(product.value.processing_fee_value_formatted, product.value.processing_fee_value)
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">

        <!-- Header -->
        <div class="flex items-center justify-between">
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
                        {{ loading ? 'Loading…' : product?.name }}
                    </h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ product?.code ? `${product.code} · ` : '' }}Loan product details
                    </p>
                </div>
            </div>
            <button
                v-if="product"
                class="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="router.push({ name: 'tenant-settings-loan-products-edit', params: { id: product.id } })"
            >
                <Pencil class="h-4 w-4" />
                Edit
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">
            Loading…
        </div>

        <template v-else-if="product">

            <!-- General -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">General Information</h2>
                <div class="grid gap-4 sm:grid-cols-2">

                    <div class="sm:col-span-2 flex items-center gap-3">
                        <span
                            class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            :class="product.is_active
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'"
                        >
                            <component :is="product.is_active ? ToggleRight : ToggleLeft" class="h-3 w-3" />
                            {{ product.is_active ? 'Active' : 'Inactive' }}
                        </span>
                        <span v-if="product.is_in_use" class="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            In use by {{ product.loan_count ?? 0 }} loans
                        </span>
                    </div>

                    <div class="sm:col-span-2">
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Description</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ orDash(product.description) }}</p>
                    </div>

                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Minimum Amount</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ moneyOrDash(product.min_amount_formatted, product.min_amount) }}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Maximum Amount</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ moneyOrDash(product.max_amount_formatted, product.max_amount) }}</p>
                    </div>
                </div>
            </div>

            <!-- Interest -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">Interest Settings</h2>
                <div class="grid gap-4 sm:grid-cols-3">
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Interest Method</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ interestMethodLabel(product.interest_method) }}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Repayment Structure</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ orDash(product.repayment_structure) }}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Interest Rate</p>
                        <p class="text-sm text-neutral-900 dark:text-white">
                            {{ product.interest_rate != null ? `${product.interest_rate}%` : '—' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Interest Period</p>
                        <p class="text-sm text-neutral-900 dark:text-white capitalize">{{ orDash(product.interest_period) }}</p>
                    </div>
                </div>
            </div>

            <!-- Term & Repayment -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">Loan Term &amp; Repayment</h2>
                <div class="grid gap-4 sm:grid-cols-3">
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Loan Duration</p>
                        <p class="text-sm text-neutral-900 dark:text-white">
                            {{ product.loan_duration != null ? `${product.loan_duration} ${product.duration_type ?? ''}` : '—' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Repayment Cycle</p>
                        <p class="text-sm text-neutral-900 dark:text-white capitalize">{{ orDash(product.repayment_cycle) }}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Grace Period</p>
                        <p class="text-sm text-neutral-900 dark:text-white">
                            {{ product.grace_period != null ? `${product.grace_period} days` : '—' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Requires Approval</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ product.requires_approval ? 'Yes' : 'No' }}</p>
                    </div>
                </div>
            </div>

            <!-- Workflow & Fees -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">Workflow, Fees and Guarantors</h2>
                <div class="grid gap-4 sm:grid-cols-3">
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Minimum Guarantors</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ orDash(product.min_guarantors) }}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Maximum Guarantors</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ orDash(product.max_guarantors) }}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Processing Fee</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ processingFeeLabel() }}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Allow Top-up</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ product.allow_top_up ? 'Yes' : 'No' }}</p>
                    </div>
                    <div>
                        <p class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Allow Reschedule</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ product.allow_reschedule ? 'Yes' : 'No' }}</p>
                    </div>
                </div>
            </div>

            <!-- Penalty Rules -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white mb-5">Penalty Rules</h2>

                <div v-if="!product.penalty_rules?.length" class="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
                    No penalty rules configured.
                </div>

                <div v-else class="overflow-hidden rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <table class="w-full text-sm">
                        <thead class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                            <tr class="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                <th class="px-4 py-3">Type</th>
                                <th class="px-4 py-3">Rate (%)</th>
                                <th class="px-4 py-3">Grace Days</th>
                                <th class="px-4 py-3">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                            <tr v-for="(rule, idx) in product.penalty_rules" :key="idx">
                                <td class="px-4 py-3 text-neutral-900 dark:text-white">{{ orDash(rule.penalty_type) }}</td>
                                <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">{{ orDash(rule.penalty_rate) }}</td>
                                <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">{{ orDash(rule.grace_days) }}</td>
                                <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">{{ moneyOrDash(rule.amount_formatted, rule.amount) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </template>

    </div>
</template>
