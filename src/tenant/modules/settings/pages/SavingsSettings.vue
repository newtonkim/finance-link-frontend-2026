<script setup lang="ts">
import { Landmark } from 'lucide-vue-next'
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Landmark class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Savings Products</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage savings accounts, fixed deposits, and
                    rules</p>
            </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Savings Accounts</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure standard savings account types.
                </p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage Accounts
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Group Savings (Chamas)</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup rules for group/chama savings
                    products.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Configure Groups
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Fixed Deposits</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Manage fixed-term deposit products and
                    rates.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage Fixed
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Transfer Rules</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define rules for internal and external
                    transfers.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup Transfers
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Savings Product Variants</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define savings products and attach charges.</p>
                <RouterLink to="/tenant/settings/savings-products" class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline block">Manage Products
                    →</RouterLink>
            </div>
        </div>
    </div>
</template>
