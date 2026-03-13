<script setup lang="ts">
import { ArrowLeftRight } from 'lucide-vue-next'
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <ArrowLeftRight class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Transactions</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure transaction types, fees, and
                    channels</p>
            </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Deposits</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure rules and limits for member
                    deposits.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage Deposits
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Withdrawals</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define withdrawal procedures and
                    restrictions.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage
                    Withdrawals →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Fees & Charges</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup fees for various transaction types.
                </p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Configure Fees
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Payment Channels</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Manage integration with various payment
                    gateways.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage Channels
                    →</button>
            </div>
        </div>
    </div>
</template>
