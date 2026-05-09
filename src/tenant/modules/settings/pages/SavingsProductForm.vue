<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Landmark, ArrowLeft, Plus, Save, X } from 'lucide-vue-next'
import { savingsProductsApi, type SavingsProduct, type Charge } from '../../../apis/savingsProducts/api'
import { toast } from 'vue-sonner'
import { useRoute, useRouter } from 'vue-router'
import { useCurrencyStore } from '@/stores/currency'
import FdSettingsCard from '../components/FdSettingsCard.vue'
import { useProductFormSupport } from '../composables/useProductFormSupport'
import { useMonthlyFeeSummary } from '../composables/useMonthlyFeeSummary'

const route = useRoute()
const router = useRouter()
const currencyStore = useCurrencyStore()
const currency = computed(() => currencyStore.currencyCode)

const isEditing = computed(() => route.params.id !== undefined)
const loading = ref(false)
const saving = ref(false)
const selectedChargeTab = ref<Charge['type']>('deposit')
const { chartAccounts, savingsProductList, loadSupportingData } = useProductFormSupport()

const form = ref<SavingsProduct>({
    name: '',
    type: 'fixed',
    minimum_balance: 0,
    minimum_maturity_months: 0,
    dormancy_period_months: 6,
    charge_on_deposit: false,
    charge_on_withdraw: false,
    charge_on_transfer: false,
    status: 'active',
    monthly_fee_enabled: false,
    monthly_fee_type: 'amount',
    monthly_fee_amount: null,
    monthly_fee_deduction_day: 1,
    loyalty_fee_enabled: false,
    loyalty_adjustment_type: 'discount_percentage',
    loyalty_adjustment_value: null,
    charges: [],
    // FD fields (ignored by backend for standard products)
    interest_rate: null,
    interest_payout_type: 'at_maturity' as const,
    interest_posting_frequency: 'monthly' as const,
    default_tenor_months: 6,
    maturity_action: 'manual' as const,
    convert_to_product_id: null,
    interest_expense_account_id: null,
    interest_payable_account_id: null,
})

const loadProduct = async () => {
    if (!isEditing.value) return

    loading.value = true
    try {
        const id = Number(route.params.id)
        const response = await savingsProductsApi.get(id)
        const product = response.data.data
        form.value = {
            ...form.value,
            ...product,
            charges: product.charges || []
        }
    } catch (error) {
        toast.error('Failed to load savings product')
        router.push('/tenant/settings/savings-products')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadProduct()
    loadSupportingData()
})

const normalizeNumberInput = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return ''
    return String(value).replace(/,/g, '')
}

const formatNumberInput = (value: number | string | null | undefined) => {
    const normalized = normalizeNumberInput(value)
    if (normalized === '') return ''
    const parsed = Number(normalized)
    if (Number.isNaN(parsed)) return normalized
    return new Intl.NumberFormat('en-US').format(parsed)
}

const getNextMinimum = (type: Charge['type'], excludeIndex?: number) => {
    const charges = form.value.charges ?? []
    const maxValues = charges
        .filter((charge, index) => charge.type === type && index !== excludeIndex)
        .map((charge) => Number(normalizeNumberInput(charge.maximum_amount)))
        .filter((value) => Number.isFinite(value))

    if (maxValues.length === 0) return 0
    return Math.max(...maxValues) + 1
}

const addCharge = () => {
    if (!form.value.charges) form.value.charges = []

    const nextMinimum = getNextMinimum(selectedChargeTab.value)

    form.value.charges.push({
        type: selectedChargeTab.value,
        charge_type: 'amount',
        amount: 0,
        minimum_amount: nextMinimum,
        maximum_amount: null,
    })
}

const removeCharge = (index: number) => {
    if (!form.value.charges) return
    form.value.charges.splice(index, 1)
}

const chargeRows = computed(() => {
    const charges = form.value.charges ?? []
    return charges
        .map((charge, index) => ({ charge, index }))
        .filter((row) => row.charge.type === selectedChargeTab.value)
})

// Auto-check activity when a charge of that type is added
watch(() => form.value.charges, (charges) => {
    if (!charges) return
    if (charges.some(c => c.type === 'deposit'))  form.value.charge_on_deposit = true
    if (charges.some(c => c.type === 'withdraw')) form.value.charge_on_withdraw = true
    if (charges.some(c => c.type === 'transfer')) form.value.charge_on_transfer = true
}, { deep: true })

// Warn when charges exist but the activity toggle is off
const activityWarnings = computed(() => {
    const charges = form.value.charges ?? []
    const warnings: string[] = []
    if (charges.some(c => c.type === 'deposit')  && !form.value.charge_on_deposit)  warnings.push('Deposit')
    if (charges.some(c => c.type === 'withdraw') && !form.value.charge_on_withdraw) warnings.push('Withdraw')
    if (charges.some(c => c.type === 'transfer') && !form.value.charge_on_transfer) warnings.push('Transfer')
    return warnings
})

const saveProduct = async () => {
    saving.value = true
    try {
        const payload: SavingsProduct = {
            ...form.value,
            charges: (form.value.charges ?? []).map(c => ({
                ...c,
                minimum_amount: Number(normalizeNumberInput(c.minimum_amount)) || 0,
                maximum_amount: c.maximum_amount !== null && c.maximum_amount !== undefined && String(c.maximum_amount).trim() !== '' ? Number(normalizeNumberInput(c.maximum_amount)) : null,
                amount: Number(normalizeNumberInput(c.amount)) || 0,
            }))
        }
        if (isEditing.value) {
            await savingsProductsApi.update(Number(route.params.id), payload)
            toast.success('Savings product updated successfully')
        } else {
            await savingsProductsApi.create(payload)
            toast.success('Savings product created successfully')
        }
        router.push('/tenant/settings/savings-products')
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to save savings product')
    } finally {
        saving.value = false
    }
}

const { monthlyFeeSummary } = useMonthlyFeeSummary(form, currency)

</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <RouterLink to="/tenant/settings/savings-products" class="mr-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition">
                <ArrowLeft class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </RouterLink>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Landmark class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div class="flex-1">
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {{ isEditing ? 'Edit Savings Product' : 'Create Savings Product' }}
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure parameters and attach charges</p>
            </div>
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center gap-3 py-24">
            <svg class="h-8 w-8 animate-spin text-nfuko-primary dark:text-bg-nfuko-yellow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Loading details...</span>
        </div>

        <div v-else class="grid gap-6 lg:grid-cols-[1fr_400px]">
            <!-- Main Details -->
            <div class="flex flex-col gap-6">
                <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">General Information</h2>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="col-span-2">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</label>
                            <input v-model="form.name" type="text" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow" placeholder="e.g. Fixed Deposit 6 Months">
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Type</label>
                            <select v-model="form.type" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow">
                                <option value="fixed">Fixed</option>
                                <option value="standard">Standard</option>
                            </select>
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Minimum Balance ({{ currency }})</label>
                            <input v-model="form.minimum_balance" type="number" step="0.01" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow">
                        </div>

                        <div v-if="form.type === 'fixed'">
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Min Maturity (Months)</label>
                            <input v-model="form.minimum_maturity_months" type="number" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow">
                        </div>

                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Dormancy Period (Months)</label>
                            <input v-model="form.dormancy_period_months" type="number" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow">
                        </div>
                    </div>
                </div>

                <!-- Monthly fees -->
                <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Monthly fees</h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">Configure compulsory monthly or maintenance fees.</p>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Enable</span>
                            <div class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-bg-nfuko-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-900" :class="form.monthly_fee_enabled ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out" :class="form.monthly_fee_enabled ? 'translate-x-6' : 'translate-x-1'"></span>
                                <input v-model="form.monthly_fee_enabled" type="checkbox" class="sr-only">
                            </div>
                        </label>
                    </div>

                    <div v-if="form.monthly_fee_enabled" class="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                        <div class="grid gap-4">
                            <div class="rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                                <div class="mb-3 flex items-center gap-2">
                                    <span class="rounded-full  bg-nfuko-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-nfuko-yellow dark:text-neutral-900">Step 1</span>
                                    <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Choose fee type</h3>
                                </div>
                                <div class="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Fee type</label>
                                        <select v-model="form.monthly_fee_type" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow">
                                            <option value="amount">Fixed amount</option>
                                            <option value="percentage">Percentage (%)</option>
                                        </select>
                                    </div>
                                    <div class="text-xs text-neutral-500 dark:text-neutral-400 sm:pt-7">
                                        Fixed amount charges a flat fee. Percentage charges a rate on end-of-month balance.
                                    </div>
                                </div>
                            </div>

                            <div class="rounded-lg border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                                <div class="mb-3 flex items-center gap-2">
                                    <span class="rounded-full  bg-nfuko-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-nfuko-yellow dark:text-neutral-900">Step 2</span>
                                    <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Set base fee (all members)</h3>
                                </div>
                                <div class="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Base fee amount</label>
                                        <input v-model="form.monthly_fee_amount" type="number" step="0.01" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow">
                                        <p v-if="form.monthly_fee_type === 'percentage'" class="mt-1 text-xs text-neutral-500">Calculated on end-of-month balance.</p>
                                    </div>
                                    <div class="rounded-lg border border-dashed border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                        This fee is compulsory for all members using this product.
                                    </div>
                                </div>
                            </div>

                            <div class="rounded-lg border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                                <div class="mb-3 flex items-center gap-2">
                                    <span class="rounded-full  bg-nfuko-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-nfuko-yellow dark:text-neutral-900">Step 3</span>
                                    <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Select deduction timing</h3>
                                </div>
                                <div class="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Deduction day</label>
                                        <select v-model="form.monthly_fee_deduction_day" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow">
                                            <option :value="1">1st of the month</option>
                                            <option :value="15">15th of the month</option>
                                            <option :value="28">28th of the month</option>
                                            <option :value="31">End of month</option>
                                        </select>
                                    </div>
                                    <div class="text-xs text-neutral-500 dark:text-neutral-400 sm:pt-7">
                                        Fees are deducted once per month on the selected day.
                                    </div>
                                </div>
                            </div>

                            <div class="rounded-lg border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                                <div class="mb-3 flex items-center gap-2">
                                    <span class="rounded-full  bg-nfuko-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-nfuko-yellow dark:text-neutral-900">Step 4</span>
                                    <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Adjust fee for loyal members</h3>
                                </div>

                                <div class="flex items-center justify-between gap-4">
                                    <div>
                                        <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Enable loyalty adjustment</p>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400">Offer a reduced or custom fee for loyal members.</p>
                                    </div>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Enable</span>
                                        <div class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-bg-nfuko-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-900" :class="form.loyalty_fee_enabled ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'">
                                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out" :class="form.loyalty_fee_enabled ? 'translate-x-6' : 'translate-x-1'"></span>
                                            <input v-model="form.loyalty_fee_enabled" type="checkbox" class="sr-only">
                                        </div>
                                    </label>
                                </div>

                                <div class="mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400">
                                    <span class="font-medium text-neutral-700 dark:text-neutral-300">Loyal member criteria:</span>
                                    Configured in
                                    <RouterLink to="/tenant/settings/members" class="underline text-nfuko-primary dark:text-bg-nfuko-yellow hover:opacity-80">Members &amp; Roles → Member Onboarding</RouterLink>
                                    (minimum tenure months).
                                </div>

                                <div v-if="form.loyalty_fee_enabled" class="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Adjustment type</label>
                                        <select v-model="form.loyalty_adjustment_type" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow">
                                            <option value="discount_percentage">Reduced by percentage</option>
                                            <option value="fixed_discount">Fixed discount</option>
                                            <option value="custom_fee">Custom fee</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            <span v-if="form.loyalty_adjustment_type === 'discount_percentage'">Discount (%)</span>
                                            <span v-else-if="form.loyalty_adjustment_type === 'fixed_discount'">Discount amount</span>
                                            <span v-else>Custom fee amount</span>
                                        </label>
                                        <input v-model="form.loyalty_adjustment_value" type="number" step="0.01" class="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:text-white dark:focus:border-bg-nfuko-yellow">
                                        <p v-if="form.loyalty_adjustment_type === 'custom_fee' && form.monthly_fee_type === 'percentage'" class="mt-1 text-xs text-neutral-500">Uses the base fee format (percentage).</p>
                                    </div>
                                </div>
                            </div>

                            <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-300">
                                <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Summary</div>
                                <div>{{ monthlyFeeSummary || 'Complete the steps above to see a summary.' }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Attached Charges -->
                <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Attached Charges</h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">Define charge ranges per transaction type.</p>
                        </div>
                        <button @click="addCharge" type="button" class="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                            <Plus class="h-3.5 w-3.5" />
                            Add Charge
                        </button>
                    </div>

                    <div class="mb-4 inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        <button
                            type="button"
                            class="rounded-md px-3 py-1.5 transition"
                            :class="selectedChargeTab === 'deposit' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'"
                            @click="selectedChargeTab = 'deposit'"
                        >
                            Deposit charges
                        </button>
                        <button
                            type="button"
                            class="rounded-md px-3 py-1.5 transition"
                            :class="selectedChargeTab === 'withdraw' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'"
                            @click="selectedChargeTab = 'withdraw'"
                        >
                            Withdraw charges
                        </button>
                        <button
                            type="button"
                            class="rounded-md px-3 py-1.5 transition"
                            :class="selectedChargeTab === 'transfer' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'"
                            @click="selectedChargeTab = 'transfer'"
                        >
                            Transfer charges
                        </button>
                    </div>

                    <div v-if="chargeRows.length === 0" class="text-sm text-neutral-500 py-6 text-center border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-xl">
                        No charges added yet.
                    </div>

                    <div v-else class="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <table class="min-w-full text-sm">
                            <thead class="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                                <tr>
                                    <th class="px-4 py-3 text-left font-semibold">S/N</th>
                                    <th class="px-4 py-3 text-left font-semibold">Minimum</th>
                                    <th class="px-4 py-3 text-left font-semibold">Maximum</th>
                                    <th class="px-4 py-3 text-left font-semibold">Charge</th>
                                    <th class="px-4 py-3 text-left font-semibold">Charge measure</th>
                                    <th class="px-4 py-3 text-left font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                <tr v-for="(row, index) in chargeRows" :key="row.index" class="bg-white dark:bg-neutral-900">
                                    <td class="px-4 py-3 text-neutral-500">{{ index + 1 }}</td>
                                    <td class="px-4 py-3">
                                        <input
                                            v-model="row.charge.minimum_amount"
                                            type="text"
                                            inputmode="decimal"
                                            readonly
                                            class="w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm text-neutral-700 cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                        >
                                    </td>
                                    <td class="px-4 py-3">
                                        <input
                                            v-model="row.charge.maximum_amount"
                                            type="text"
                                            inputmode="decimal"
                                            class="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm focus: border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-bg-nfuko-yellow"
                                            @focus="row.charge.maximum_amount = normalizeNumberInput(row.charge.maximum_amount)"
                                            @blur="row.charge.maximum_amount = formatNumberInput(row.charge.maximum_amount)"
                                        >
                                    </td>
                                    <td class="px-4 py-3">
                                        <input
                                            v-model="row.charge.amount"
                                            type="text"
                                            inputmode="decimal"
                                            class="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm focus: border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-bg-nfuko-yellow"
                                            @focus="row.charge.amount = normalizeNumberInput(row.charge.amount)"
                                            @blur="row.charge.amount = formatNumberInput(row.charge.amount)"
                                        >
                                    </td>
                                    <td class="px-4 py-3">
                                        <select v-model="row.charge.charge_type" class="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm focus: border-nfuko-primary focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-bg-nfuko-yellow">
                                            <option value="amount">Fixed amount</option>
                                            <option value="percentage">Percentage (%)</option>
                                        </select>
                                    </td>
                                    <td class="px-4 py-3">
                                        <button @click="removeCharge(row.index)" type="button" class="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 transition hover:border-red-200 hover:text-red-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-red-400">
                                            <X class="h-3 w-3" />
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p v-if="chargeRows.length > 0" class="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                        Next minimum auto-fills as previous maximum + 1 for the same transaction type.
                    </p>
                </div>

                <!-- Fixed Deposit Settings (only for type = fixed) -->
                <FdSettingsCard
                    v-if="form.type === 'fixed'"
                    :form="form"
                    :products="savingsProductList"
                    :chart-accounts="chartAccounts"
                />
            </div>

            <!-- Side Panel Actions -->
            <div class="flex flex-col gap-6">
                <!-- Event Triggers Helper -->
                <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Applies To Activity</h3>

                    <div v-if="activityWarnings.length" class="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                        <span class="font-semibold">Warning:</span>
                        {{ activityWarnings.join(', ') }} {{ activityWarnings.length === 1 ? 'charge is' : 'charges are' }} attached but the activity toggle is off — those fees will never apply.
                    </div>

                    <div class="space-y-3">
                        <label class="flex items-center gap-3">
                            <input v-model="form.charge_on_deposit" type="checkbox" class="h-4 w-4 rounded border-neutral-300  text-nfuko-primary focus:ring-bg-nfuko-primary dark:border-neutral-600 dark:bg-neutral-700 dark:ring-offset-neutral-900 dark:checked:bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow focus:outline-none cursor-pointer">
                            <span class="text-sm text-neutral-700 dark:text-neutral-300">Evaluate events on Deposit</span>
                        </label>
                        <label class="flex items-center gap-3">
                            <input v-model="form.charge_on_withdraw" type="checkbox" class="h-4 w-4 rounded border-neutral-300  text-nfuko-primary focus:ring-bg-nfuko-primary dark:border-neutral-600 dark:bg-neutral-700 dark:ring-offset-neutral-900 dark:checked:bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow focus:outline-none cursor-pointer">
                            <span class="text-sm text-neutral-700 dark:text-neutral-300">Evaluate events on Withdraw</span>
                        </label>
                        <label class="flex items-center gap-3">
                            <input v-model="form.charge_on_transfer" type="checkbox" class="h-4 w-4 rounded border-neutral-300  text-nfuko-primary focus:ring-bg-nfuko-primary dark:border-neutral-600 dark:bg-neutral-700 dark:ring-offset-neutral-900 dark:checked:bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow focus:outline-none cursor-pointer">
                            <span class="text-sm text-neutral-700 dark:text-neutral-300">Evaluate events on Transfer</span>
                        </label>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <button @click="saveProduct" :disabled="saving" class="flex w-full items-center justify-center gap-2 rounded-xl  bg-nfuko-primary dark:bg-nfuko-yellow px-4 py-3 text-sm font-medium text-white dark: text-nfuko-primary hover: bg-nfuko-primary/90 dark:hover:bg-nfuko-yellow/90 shadow-lg disabled:opacity-50 transition-colors">
                        <Save v-if="!saving" class="h-4 w-4" />
                        <span>{{ saving ? 'Saving Product...' : (isEditing ? 'Update Savings Product' : 'Create Savings Product') }}</span>
                    </button>
                    <RouterLink to="/tenant/settings/savings-products" class="mt-3 block w-full rounded-xl bg-neutral-100 px-4 py-3 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors">
                        Cancel
                    </RouterLink>
                </div>
            </div>
        </div>
    </div>
</template>
