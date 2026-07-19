<script setup lang="ts">
import { BookOpen } from 'lucide-vue-next'
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <BookOpen class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Accounting & GL</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage chart of accounts, GL mapping, and tax
                    settings</p>
            </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Chart of Accounts</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define and manage your general ledger
                    structure.</p>
                <button class="inline-flex items-center justify-center rounded-xl bg-[#06265a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90">Manage COA
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">GL Mapping</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Map products and transactions to GL
                    accounts.</p>
                <button class="inline-flex items-center justify-center rounded-xl bg-[#06265a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90">Configure Mapping
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Tax Settings</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup tax rates and reporting
                    requirements.</p>
                <button class="inline-flex items-center justify-center rounded-xl bg-[#06265a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90">Manage Taxes
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Multi Currency</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure multiple currencies and
                    exchange rates.</p>
                <button class="inline-flex items-center justify-center rounded-xl bg-[#06265a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90">Setup Currencies
                    →</button>
            </div>
        </div>
    </div>
</template>
