<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { Banknote, X, Hash, Calendar, AlertTriangle, ArrowRight } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import type { LoanApplication } from '@/tenant/apis/loans/loanApplicationsApi'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'

interface DisburseForm {
    disbursement_method: string
    disbursement_reference: string
    disbursement_date: string
    notes: string
    savings_account_id?: number | null
    mobile_money_provider?: string | null
    mobile_money_number?: string | null
}

const props = defineProps<{
    application: LoanApplication | null
    open: boolean
    disbursing: boolean
    form: DisburseForm
    errors: Record<string, string | string[]>
}>()

const emit = defineEmits<{
    close: []
    submit: []
}>()

// ─── Derived numbers ──────────────────────────────────────────────────────────
const principal = computed(() => Number(props.application?.approved_amount ?? 0))

const processingFee = computed(() => {
    const type = props.application?.loan_product?.processing_fee_type ?? 'flat'
    const value = Number(props.application?.loan_product?.processing_fee_value ?? 0)
    if (value <= 0 || principal.value <= 0) return 0
    return type === 'percentage'
        ? Math.round((principal.value * value / 100) * 100) / 100
        : Math.round(value * 100) / 100
})

const netDisbursed = computed(() => Math.round((principal.value - processingFee.value) * 100) / 100)

const portfolioAccountName = computed(() =>
    props.application?.loan_product?.portfolio_account_name ?? 'Loan Portfolio Account',
)
const disbursementAccountName = computed(() => {
    if (props.form.disbursement_method === 'savings_account') {
        return 'Member Savings Liability (2111)'
    }
    return props.application?.loan_product?.disbursement_account_name ?? 'Disbursement Account'
})
const feeIncomeAccountName = computed(() =>
    props.application?.loan_product?.fee_income_account_name ?? 'Processing Fee Income',
)

const savingsAccounts = ref<any[]>([])
const loadingSavings = ref(false)

async function fetchSavingsAccounts() {
    if (!props.application?.member_id) return
    loadingSavings.value = true
    try {
        const res = await savingsAccountsApi.list({ member_id: props.application.member_id, status: 'active' })
        savingsAccounts.value = res.data?.data || []
    } catch (e) {
        console.error('Failed to fetch savings accounts', e)
    } finally {
        loadingSavings.value = false
    }
}

// Reset form date when drawer opens
watch(() => props.open, (open) => {
    if (open) {
        props.form.disbursement_date = new Date().toISOString().slice(0, 10)
        props.form.disbursement_method = props.form.disbursement_method || 'cash'
        fetchSavingsAccounts()
    }
})

function fmt(v: number | string | null | undefined) {
    if (v == null || v === '') return '—'
    return formatMoneyValue(v)
}

function errMsg(field: string) {
    const e = props.errors[field]
    return e ? (Array.isArray(e) ? e[0] : e) : null
}
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0">
            <div v-if="open" class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" @mousedown.self="emit('close')" />
        </Transition>

        <Transition
            enter-active-class="transition duration-250 ease-out"
            enter-from-class="translate-x-full opacity-0"
            enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="translate-x-0 opacity-100"
            leave-to-class="translate-x-full opacity-0">
            <div v-if="open"
                class="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-neutral-900">

                <!-- Header -->
                <div class="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
                    <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                            <Banknote class="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Confirm Disbursement</h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                {{ application?.application_no }} · {{ application?.member?.name }}
                            </p>
                        </div>
                    </div>
                    <button
                        class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors dark:hover:bg-neutral-800"
                        @click="emit('close')">
                        <X class="h-4 w-4" />
                    </button>
                </div>

                <!-- Scrollable body -->
                <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    <!-- ── Disbursement summary ── -->
                    <div>
                        <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Disbursement Summary</h3>
                        <div class="rounded-2xl border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40">
                            <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                <div class="flex items-center justify-between px-4 py-3">
                                    <span class="text-sm text-neutral-600 dark:text-neutral-400">Gross Amount (Approved)</span>
                                    <span class="font-semibold text-neutral-900 dark:text-white">{{ fmt(principal) }}</span>
                                </div>
                                <div v-if="processingFee > 0" class="flex items-center justify-between px-4 py-3">
                                    <span class="text-sm text-neutral-600 dark:text-neutral-400">
                                        Processing Fee
                                        <span v-if="application?.loan_product?.processing_fee_type === 'percentage'" class="text-xs text-neutral-400 dark:text-neutral-500">
                                            ({{ application?.loan_product?.processing_fee_value }}%)
                                        </span>
                                    </span>
                                    <span class="font-medium text-amber-600 dark:text-amber-400">−{{ fmt(processingFee) }}</span>
                                </div>
                                <div class="flex items-center justify-between bg-emerald-50/60 px-4 py-3 dark:bg-emerald-900/10">
                                    <span class="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Net to Member</span>
                                    <span class="text-lg font-bold text-emerald-700 dark:text-emerald-400">{{ fmt(netDisbursed) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    <!-- ── Disbursement form ── -->
                    <div>
                        <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Disbursement Details</h3>
                        <div class="space-y-4">
                            <!-- Method -->
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Method <span class="text-red-400">*</span>
                                </label>
                                <select v-model="form.disbursement_method"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="errMsg('disbursement_method') ? 'border-red-300 dark:border-red-700' : ''">
                                    <option value="savings_account">Savings Account</option>
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="mobile_money">Mobile Money</option>
                                </select>
                                <p v-if="errMsg('disbursement_method')" class="mt-1 text-xs text-red-500">{{ errMsg('disbursement_method') }}</p>
                            </div>

                            <!-- Savings Account conditional field -->
                            <div v-if="form.disbursement_method === 'savings_account'">
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Target Savings Account <span class="text-red-400">*</span>
                                </label>
                                <select v-model="form.savings_account_id"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="errMsg('savings_account_id') ? 'border-red-300 dark:border-red-700' : ''">
                                    <option :value="null" disabled>Select account...</option>
                                    <template v-if="loadingSavings">
                                        <option disabled>Loading...</option>
                                    </template>
                                    <template v-else-if="savingsAccounts.length === 0">
                                        <option disabled>No active savings accounts found.</option>
                                    </template>
                                    <template v-else>
                                        <option v-for="acc in savingsAccounts" :key="acc.id" :value="acc.id">
                                            {{ acc.savings_product?.name }} — {{ acc.account_number }} (Bal: {{ acc.balance_formatted }})
                                        </option>
                                    </template>
                                </select>
                                <p v-if="errMsg('savings_account_id')" class="mt-1 text-xs text-red-500">{{ errMsg('savings_account_id') }}</p>
                            </div>

                            <!-- Mobile Money conditional fields -->
                            <div v-if="form.disbursement_method === 'mobile_money'" class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Provider <span class="text-red-400">*</span>
                                    </label>
                                    <select v-model="form.mobile_money_provider"
                                        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        :class="errMsg('mobile_money_provider') ? 'border-red-300 dark:border-red-700' : ''">
                                        <option :value="null" disabled>Select...</option>
                                        <option value="mtn">MTN</option>
                                        <option value="airtel">Airtel</option>
                                    </select>
                                    <p v-if="errMsg('mobile_money_provider')" class="mt-1 text-xs text-red-500">{{ errMsg('mobile_money_provider') }}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Phone Number <span class="text-red-400">*</span>
                                    </label>
                                    <input v-model="form.mobile_money_number" type="text"
                                        placeholder="e.g. 07..."
                                        class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                        :class="errMsg('mobile_money_number') ? 'border-red-300 dark:border-red-700' : ''" />
                                    <p v-if="errMsg('mobile_money_number')" class="mt-1 text-xs text-red-500">{{ errMsg('mobile_money_number') }}</p>
                                </div>
                            </div>

                            <!-- Reference -->
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    <Hash class="inline h-3.5 w-3.5 mr-0.5" />Reference
                                    <span class="font-normal text-neutral-400">(optional)</span>
                                </label>
                                <input v-model="form.disbursement_reference" type="text"
                                    placeholder="e.g. TXN123, cheque no…"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="errMsg('disbursement_reference') ? 'border-red-300 dark:border-red-700' : ''" />
                                <p v-if="errMsg('disbursement_reference')" class="mt-1 text-xs text-red-500">{{ errMsg('disbursement_reference') }}</p>
                            </div>

                            <!-- Date -->
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    <Calendar class="inline h-3.5 w-3.5 mr-0.5" />Disbursement Date
                                </label>
                                <input v-model="form.disbursement_date" type="date"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="errMsg('disbursement_date') ? 'border-red-300 dark:border-red-700' : ''" />
                                <p v-if="errMsg('disbursement_date')" class="mt-1 text-xs text-red-500">{{ errMsg('disbursement_date') }}</p>
                            </div>

                            <!-- Notes -->
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Notes <span class="font-normal text-neutral-400">(optional)</span>
                                </label>
                                <textarea v-model="form.notes" rows="2"
                                    placeholder="Any notes about this disbursement…"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="errMsg('notes') ? 'border-red-300 dark:border-red-700' : ''" />
                                <p v-if="errMsg('notes')" class="mt-1 text-xs text-red-500">{{ errMsg('notes') }}</p>
                            </div>

                            <!-- GL mapping error -->
                            <div v-if="errMsg('gl_mapping')"
                                class="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                                <AlertTriangle class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                                <p class="text-xs text-amber-700 dark:text-amber-300">{{ errMsg('gl_mapping') }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                    <button
                        class="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        @click="emit('close')">
                        Cancel
                    </button>
                    <button
                        :disabled="disbursing || !form.disbursement_method"
                        class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        @click="emit('submit')">
                        <Banknote class="h-4 w-4" />
                        {{ disbursing ? 'Disbursing…' : 'Confirm Disbursement' }}
                    </button>
                </div>

            </div>
        </Transition>
    </Teleport>
</template>
