<script setup lang="ts">
import { Calculator } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'

defineProps<{
    schedulePreview: {
        installment_amount: number
        total_interest: number
        total_repayment: number
        schedule_preview: { period: number; principal: number; interest: number; installment: number; balance: number }[]
    } | null
    previewLoading: boolean
}>()

const { formatAmount } = useLoanApplicationHelpers()
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mb-4 flex items-center gap-2">
            <Calculator class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Repayment Preview</h3>
        </div>
        <div v-if="previewLoading" class="space-y-2">
            <div v-for="n in 4" :key="n" class="h-4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
        <div v-else-if="schedulePreview">
            <div class="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div class="text-center">
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Installment</p>
                    <p class="mt-0.5 text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(schedulePreview.installment_amount) }}</p>
                </div>
                <div class="text-center">
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Total Interest</p>
                    <p class="mt-0.5 text-sm font-bold text-neutral-900 dark:text-white">{{ formatAmount(schedulePreview.total_interest) }}</p>
                </div>
                <div class="text-center">
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Total Repay</p>
                    <p class="mt-0.5 text-sm font-bold text-nfuko-primary dark:text-bg-nfuko-yellow">{{ formatAmount(schedulePreview.total_repayment) }}</p>
                </div>
            </div>
            <div v-if="schedulePreview.schedule_preview.length" class="max-h-64 overflow-y-auto">
                <table class="w-full text-xs">
                    <thead class="sticky top-0 bg-white dark:bg-neutral-900">
                        <tr class="border-b border-neutral-100 text-left font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                            <th class="py-1.5 pr-3">#</th>
                            <th class="py-1.5 pr-3 text-right">Principal</th>
                            <th class="py-1.5 pr-3 text-right">Interest</th>
                            <th class="py-1.5 pr-3 text-right">Installment</th>
                            <th class="py-1.5 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                        <tr v-for="row in schedulePreview.schedule_preview" :key="row.period">
                            <td class="py-1.5 pr-3 text-neutral-500">{{ row.period }}</td>
                            <td class="py-1.5 pr-3 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.principal) }}</td>
                            <td class="py-1.5 pr-3 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.interest) }}</td>
                            <td class="py-1.5 pr-3 text-right font-medium text-neutral-900 dark:text-white">{{ formatAmount(row.installment) }}</td>
                            <td class="py-1.5 text-right text-neutral-500">{{ formatAmount(row.balance) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-8 text-center">
            <Calculator class="mb-2 h-6 w-6 text-neutral-300 dark:text-neutral-600" />
            <p class="text-xs text-neutral-400 dark:text-neutral-500">Enter an amount and term to see the repayment preview.</p>
        </div>
    </div>
</template>
