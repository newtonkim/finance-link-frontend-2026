it commit<script setup lang="ts">
import { CreditCard, Settings2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-8 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">

        <!-- Loan Products Section -->
        <div>
            <div class="flex items-center gap-3 mb-5">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <CreditCard class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Loan Products</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure loan types, interest, and repayment rules</p>
                </div>
            </div>
            <div class="grid gap-5 lg:grid-cols-2">
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Loan Types</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define different categories of loan products.</p>
                    <button
                        class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline"
                        @click="router.push({ name: 'tenant-settings-loan-products' })"
                    >Manage Types →</button>
                </div>
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Interest Settings</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup interest rates and calculation methods.</p>
                    <button class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Configure Interest →</button>
                </div>
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Repayment Rules</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define schedules and rules for loan repayments.</p>
                    <button class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup Rules →</button>
                </div>
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Penalties</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure late payment fees and penalties.</p>
                    <button class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage Penalties →</button>
                </div>
            </div>
        </div>

        <!-- Divider -->
        <hr class="border-neutral-100 dark:border-neutral-800" />

        <!-- Loan Settings Section -->
        <div>
            <div class="flex items-center gap-3 mb-5">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Settings2 class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Loan Settings</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage loan operational behavior and workflows</p>
                </div>
            </div>

            <div class="grid gap-5 lg:grid-cols-2">
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Approval Workflow</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure approval stages and who can authorize loans.</p>
                    <button class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup Workflow →</button>
                </div>
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Eligibility & Requirements</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Set collateral, guarantor, and document requirements.</p>
                    <button class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Configure Requirements →</button>
                </div>
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Disbursement Settings</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define payment methods and disbursement approval limits.</p>
                    <button class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage Disbursement →</button>
                </div>
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Loan Notifications</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure alerts for due dates, overdue loans, and reminders.</p>
                    <button class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup Notifications →</button>
                </div>
            </div>
        </div>

    </div>
</template>
