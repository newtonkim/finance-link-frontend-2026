<script setup lang="ts">
import { computed } from 'vue'
import { X, CheckCircle2, RotateCcw, ArrowRightLeft } from 'lucide-vue-next'
import type { SavingsProduct, Charge } from '../../../apis/savingsProducts/api'

const props = defineProps<{
    isOpen: boolean
    product: SavingsProduct | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const hasCharges = computed(() => {
    return props.product?.charges && props.product.charges.length > 0
})

const getChargeIcon = (type: Charge['type']) => {
    switch (type) {
        case 'deposit': return CheckCircle2
        case 'withdraw': return RotateCcw
        case 'transfer': return ArrowRightLeft
        default: return CheckCircle2
    }
}

const formatValue = (charge: Charge) => {
    if (charge.charge_type === 'percentage') {
        return `${charge.amount}%`
    }
    return `KSh ${Number(charge.amount).toLocaleString()}`
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="emit('close')"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900 sm:my-8">
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

            <div class="px-6 py-6">
                <div v-if="!hasCharges" class="text-center py-8">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                        <CheckCircle2 class="h-6 w-6 text-neutral-400" />
                    </div>
                    <p class="text-neutral-500 dark:text-neutral-400 font-medium">No charges are attached to this product.</p>
                </div>

                <ul v-else class="space-y-4">
                    <li v-for="(charge, index) in product?.charges" :key="index" class="flex items-start gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-neutral-900">
                            <component :is="getChargeIcon(charge.type)" class="h-5 w-5 text-[#001d22] dark:text-[#C9A84C]" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold capitalize text-neutral-900 dark:text-white">
                                {{ charge.type }} Charge
                            </p>
                            <div class="mt-1 flex items-baseline gap-2 text-sm">
                                <span class="font-medium text-neutral-900 dark:text-white">{{ formatValue(charge) }}</span>
                                <span class="text-neutral-500">Value</span>
                            </div>
                            <div class="mt-1 flex gap-4 text-xs text-neutral-500">
                                <span>Min: {{ charge.minimum_amount ? `KSh ${Number(charge.minimum_amount).toLocaleString()}` : 'None' }}</span>
                                <span v-if="charge.maximum_amount">Max: KSh {{ Number(charge.maximum_amount).toLocaleString() }}</span>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            <div class="bg-neutral-50 px-6 py-4 dark:bg-neutral-800/50 justify-end flex">
                <button @click="emit('close')" class="rounded-lg bg-[#001d22] px-4 py-2 bg-neutral-800 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white shadow">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>
