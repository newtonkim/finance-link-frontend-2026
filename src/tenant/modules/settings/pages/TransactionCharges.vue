<script setup lang="ts">
import { Receipt, Plus } from 'lucide-vue-next'
import { useCurrencyStore } from '@/stores/currency'

const { currencyCode } = useCurrencyStore()
const charges = [
    { name: 'Loan Processing Fee', type: 'Percentage', value: '2.0%', appliesTo: 'All Loans' },
    { name: 'Withdrawal Fee', type: 'Flat', value: `${currencyCode} 50`, appliesTo: 'Savings Withdrawals' },
    { name: 'Late Payment Penalty', type: 'Percentage', value: '3.0%', appliesTo: 'Arrears Loans' },
    { name: 'Account Statement Fee', type: 'Flat', value: `${currencyCode} 100`, appliesTo: 'On Request' },
    { name: 'Transfer Fee', type: 'Flat', value: `${currencyCode} 30`, appliesTo: 'Inter-Account Transfers' },
]
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Receipt class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Transaction Charges
                    </h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage fees and charges applied to
                        transactions</p>
                </div>
            </div>
            <button
                class="flex items-center gap-2 rounded-xl  bg-nfuko-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#002e35] active:scale-[0.98] dark:bg-nfuko-yellow dark:text-[#0A2318] dark:hover:bg-[#b8973f]">
                <Plus class="h-4 w-4" />
                Add Charge
            </button>
        </div>

        <!-- Charges Table -->
        <div
            class="rounded-2xl border border-neutral-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="border-b border-neutral-100 dark:border-neutral-700/50">
                            <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                Charge Name</th>
                            <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">Type
                            </th>
                            <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                Value</th>
                            <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                Applies To</th>
                            <th
                                class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 text-right">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(charge, idx) in charges" :key="charge.name"
                            :class="idx < charges.length - 1 ? 'border-b border-neutral-50 dark:border-neutral-800' : ''"
                            class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                            <td class="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">{{ charge.name }}
                            </td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                    :class="charge.type === 'Percentage'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'">
                                    {{ charge.type }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm font-semibold text-neutral-900 dark:text-white">{{ charge.value
                                }}</td>
                            <td class="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{{ charge.appliesTo }}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button
                                    class="text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                                    Edit
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
