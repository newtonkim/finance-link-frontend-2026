<script setup lang="ts">
import { Wallet, Plus } from 'lucide-vue-next'

const products = [
    { name: 'Regular Savings', rate: '5.0%', minDeposit: 'KES 500', status: 'Active' },
    { name: 'Fixed Deposit', rate: '8.5%', minDeposit: 'KES 10,000', status: 'Active' },
    { name: 'Junior Savings', rate: '4.0%', minDeposit: 'KES 200', status: 'Active' },
    { name: 'Holiday Savings', rate: '6.0%', minDeposit: 'KES 1,000', status: 'Inactive' },
]
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Wallet class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Savings Products</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage savings account types and interest
                        rates</p>
                </div>
            </div>
            <button
                class="border-0 flex items-center gap-2 rounded-xl bg-[#052659] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#052659]/90 active:scale-[0.98] dark:bg-nfuko-yellow dark:text-[#0050D8] dark:hover:bg-[#052659]/90">
                <Plus class="h-4 w-4" />
                Add Product
            </button>
        </div>

        <!-- Products Table -->
        <div
            class="rounded-2xl border border-neutral-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="border-b border-neutral-100 dark:border-neutral-700/50">
                            <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                Product Name</th>
                            <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                Interest Rate</th>
                            <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">Min.
                                Deposit</th>
                            <th class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                Status</th>
                            <th
                                class="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 text-right">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(product, idx) in products" :key="product.name"
                            :class="idx < products.length - 1 ? 'border-b border-neutral-50 dark:border-neutral-800' : ''"
                            class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                            <td class="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">{{ product.name
                                }}</td>
                            <td class="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{{ product.rate }}</td>
                            <td class="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{{ product.minDeposit
                                }}</td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                    :class="product.status === 'Active'
                                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'">
                                    {{ product.status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button
                                    class="bg-[#052659] hover:bg-[#052659]/90 text-white border-0 text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
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
