<script setup lang="ts">
import { computed } from 'vue'
import { X, CheckCircle2, RotateCcw, ArrowRightLeft, CalendarClock } from 'lucide-vue-next'
import type { SavingsProduct, Charge } from '../../../apis/savingsProducts/api'
import { useCurrencyStore } from '@/stores/currency'

const currencyStore = useCurrencyStore()
const currency = computed(() => currencyStore.currencyCode)

const props = defineProps<{
    isOpen: boolean
    product: SavingsProduct | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const hasCharges = computed(() => {
    return (props.product?.charges && props.product.charges.length > 0) || props.product?.monthly_fee_enabled
})

const monthlyFeeLabel = computed(() => {
    const p = props.product
    if (!p?.monthly_fee_enabled) return ''
    const val = p.monthly_fee_type === 'percentage' ? `${p.monthly_fee_amount}%` : `${currency.value} ${Number(p.monthly_fee_amount).toLocaleString()}`
    return val
})

const getChargeIcon = (type: Charge['type']) => {
    switch (type) {
        case 'deposit': return CheckCircle2
        case 'withdraw': return RotateCcw
        case 'transfer': return ArrowRightLeft
        default: return CheckCircle2
    }
}

const getChargeCardClass = (type: Charge['type']) => {
    switch (type) {
        case 'deposit':  return 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10'
        case 'withdraw': return 'border-rose-100 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-900/10'
        case 'transfer': return 'border-blue-100 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10'
        default:         return 'border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50'
    }
}

const getChargeIconClass = (type: Charge['type']) => {
    switch (type) {
        case 'deposit':  return 'text-emerald-600 dark:text-emerald-400'
        case 'withdraw': return 'text-rose-600 dark:text-rose-400'
        case 'transfer': return 'text-blue-600 dark:text-blue-400'
        default:         return 'text-nfuko-primary dark:text-bg-nfuko-yellow'
    }
}

const formatValue = (charge: Charge) => {
    if (charge.charge_type === 'percentage') {
        return `${charge.amount}%`
    }
    return `${currency.value} ${Number(charge.amount).toLocaleString()}`
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="emit('close')"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900 sm:my-8">
            <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
                        Attached Charges
                    </h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ product?.name }}
                    </p>
                </div>
                <button @click="emit('close')" class="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500 dark:hover:bg-neutral-800 transition-colors">
                    <X class="h-5 w-5" />
                </button>
            </div>

            <div class="max-h-[60vh] overflow-y-auto px-6 py-6">
                <div v-if="!hasCharges" class="text-center py-8">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                        <CheckCircle2 class="h-6 w-6 text-neutral-400" />
                    </div>
                    <p class="text-neutral-500 dark:text-neutral-400 font-medium">No charges are attached to this product.</p>
                </div>

                <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div v-for="(charge, index) in product?.charges" :key="index" :class="['flex items-start gap-3 rounded-xl border p-3', getChargeCardClass(charge.type)]">
                        <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-900">
                            <component :is="getChargeIcon(charge.type)" :class="['h-4 w-4', getChargeIconClass(charge.type)]" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold capitalize text-neutral-900 dark:text-white">
                                {{ charge.type }} Charge
                            </p>
                            <div class="mt-0.5 flex items-baseline gap-1.5 text-sm">
                                <span class="font-medium text-neutral-900 dark:text-white">{{ formatValue(charge) }}</span>
                                <span class="text-xs text-neutral-500">fee</span>
                            </div>
                            <div class="mt-0.5 flex gap-3 text-xs text-neutral-500">
                                <span>Min: {{ charge.minimum_amount ? `${currency} ${Number(charge.minimum_amount).toLocaleString()}` : 'None' }}</span>
                                <span v-if="charge.maximum_amount">Max: {{ currency }} {{ Number(charge.maximum_amount).toLocaleString() }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Monthly fee card -->
                    <div v-if="product?.monthly_fee_enabled" class="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
                        <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-900">
                            <CalendarClock class="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-neutral-900 dark:text-white">Monthly Fee</p>
                            <div class="mt-0.5 flex items-baseline gap-1.5 text-sm">
                                <span class="font-medium text-neutral-900 dark:text-white">{{ monthlyFeeLabel }}</span>
                                <span class="text-xs text-neutral-500">per month</span>
                            </div>
                            <div class="mt-0.5 text-xs text-neutral-500">
                                Deducted on day {{ product.monthly_fee_deduction_day }} of the month
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-neutral-50 px-6 py-4 dark:bg-neutral-800/50 justify-end flex">
                <button @click="emit('close')" class="rounded-lg  bg-nfuko-primary px-4 py-2 bg-neutral-800 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white shadow">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>
