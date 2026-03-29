<script setup lang="ts">
import { watch } from 'vue'
import { X, Banknote, Hash, Calendar, ArrowRight, Loader2 } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import type { PostRepaymentData, RepaymentPreview } from '@/tenant/apis/loans/loansApi'

const props = defineProps<{
    open: boolean
    posting: boolean
    previewing: boolean
    form: PostRepaymentData
    preview: RepaymentPreview | null
    errors: Record<string, string | string[]>
    outstandingBalance?: string | null
}>()

const emit = defineEmits<{
    close: []
    submit: []
    previewRequest: []
}>()

watch(() => props.form.amount, () => {
    if (props.open) emit('previewRequest')
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
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95">
            <div v-if="open"
                class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                    <!-- Header -->
                    <div class="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                <Banknote class="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Post Repayment</h2>
                                <p v-if="outstandingBalance" class="text-xs text-neutral-500 dark:text-neutral-400">
                                    Outstanding: {{ outstandingBalance }}
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
                    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                        <!-- Amount & method -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Amount <span class="text-red-400">*</span>
                                </label>
                                <input
                                    v-model="form.amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="errMsg('amount') ? 'border-red-300 dark:border-red-700' : ''" />
                                <p v-if="errMsg('amount')" class="mt-1 text-xs text-red-500">{{ errMsg('amount') }}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Method <span class="text-red-400">*</span>
                                </label>
                                <select
                                    v-model="form.payment_method"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="errMsg('payment_method') ? 'border-red-300 dark:border-red-700' : ''">
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="mobile_money">Mobile Money</option>
                                </select>
                                <p v-if="errMsg('payment_method')" class="mt-1 text-xs text-red-500">{{ errMsg('payment_method') }}</p>
                            </div>
                        </div>

                        <!-- Date & Receipt -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    <Calendar class="inline h-3.5 w-3.5 mr-0.5" />Payment Date <span class="text-red-400">*</span>
                                </label>
                                <input
                                    v-model="form.payment_date"
                                    type="date"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="errMsg('payment_date') ? 'border-red-300 dark:border-red-700' : ''" />
                                <p v-if="errMsg('payment_date')" class="mt-1 text-xs text-red-500">{{ errMsg('payment_date') }}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    <Hash class="inline h-3.5 w-3.5 mr-0.5" />Receipt No
                                    <span class="font-normal text-neutral-400">(optional)</span>
                                </label>
                                <input
                                    v-model="form.receipt_no"
                                    type="text"
                                    placeholder="e.g. RCP001"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            </div>
                        </div>

                        <!-- Allocation preview -->
                        <div v-if="preview || previewing">
                            <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                                Allocation Preview
                                <Loader2 v-if="previewing" class="inline h-3 w-3 animate-spin ml-1" />
                            </h3>
                            <div v-if="preview" class="rounded-xl border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40 divide-y divide-neutral-100 dark:divide-neutral-800">
                                <div v-if="preview.penalty > 0" class="flex justify-between px-4 py-2.5 text-sm">
                                    <span class="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                        <ArrowRight class="h-3 w-3 text-red-400" />Penalty
                                    </span>
                                    <span class="font-medium text-red-600 dark:text-red-400">{{ fmt(preview.penalty) }}</span>
                                </div>
                                <div v-if="preview.charges > 0" class="flex justify-between px-4 py-2.5 text-sm">
                                    <span class="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                        <ArrowRight class="h-3 w-3 text-amber-400" />Charges
                                    </span>
                                    <span class="font-medium text-amber-600 dark:text-amber-400">{{ fmt(preview.charges) }}</span>
                                </div>
                                <div class="flex justify-between px-4 py-2.5 text-sm">
                                    <span class="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                        <ArrowRight class="h-3 w-3 text-blue-400" />Interest
                                    </span>
                                    <span class="font-medium text-blue-600 dark:text-blue-400">{{ fmt(preview.interest) }}</span>
                                </div>
                                <div class="flex justify-between px-4 py-2.5 text-sm">
                                    <span class="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                        <ArrowRight class="h-3 w-3 text-emerald-400" />Principal
                                    </span>
                                    <span class="font-medium text-emerald-600 dark:text-emerald-400">{{ fmt(preview.principal) }}</span>
                                </div>
                                <div v-if="preview.overpayment > 0" class="flex justify-between px-4 py-2.5 text-sm bg-amber-50/60 dark:bg-amber-900/10">
                                    <span class="text-amber-700 dark:text-amber-400">Overpayment (unallocated)</span>
                                    <span class="font-medium text-amber-700 dark:text-amber-400">{{ fmt(preview.overpayment) }}</span>
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
                            :disabled="posting || !form.payment_method || !form.amount"
                            class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            @click="emit('submit')">
                            <Loader2 v-if="posting" class="h-4 w-4 animate-spin" />
                            <Banknote v-else class="h-4 w-4" />
                            {{ posting ? 'Posting…' : 'Post Repayment' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
