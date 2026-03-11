<script setup lang="ts">
import { PieChart } from 'lucide-vue-next'
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <PieChart class="h-5 w-5 text-[#001d22] dark:text-[#C9A84C]" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Shares & Dividends</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure share capital, pricing, and
                    distributions</p>
            </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Share Capital</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Manage share capital structure and
                    limits.</p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Manage Capital
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Share Pricing</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Set and update share prices over time.
                </p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Configure Pricing
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Share Transfers</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define rules for transferring shares
                    between members.</p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Manage Transfers
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Dividend Distribution</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup rules and schedules for dividend
                    payouts.</p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Configure
                    Dividends →</button>
            </div>
        </div>
    </div>
</template>
