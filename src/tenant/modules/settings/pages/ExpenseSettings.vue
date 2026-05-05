<script setup lang="ts">
import { ref } from 'vue'
import { Wallet, CalendarClock } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import AccountingPeriodDrawer from '../components/AccountingPeriodDrawer.vue'

const router = useRouter()
const isPeriodDrawerOpen = ref(false)

const navigate = (path: string) => {
    router.push(path)
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
                <Wallet class="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Expense Management</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure approval workflows, budgets, and categories.</p>
            </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
            <!-- Card 1: Approval Thresholds -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Approval Thresholds</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure multi-level approval matrices based on expense amounts.</p>
                <button @click="navigate('/tenant/settings/expense-management/approvals')" class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
                    Manage Approvals →
                </button>
            </div>

            <!-- Card 2: Budget Planning -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Budget Planning</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Set annual and monthly spending limits for each category.</p>
                <button @click="navigate('/tenant/expenses?mode=Budgets')" class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
                    Configure Budgets →
                </button>
            </div>

            <!-- Card 3: Expense Categories -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Expense Categories</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Organize and map expenses to your chart of accounts.</p>
                <button @click="navigate('/tenant/expenses?mode=Categories')" class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
                    Manage Categories →
                </button>
            </div>

            <!-- Card 4: Policy Settings -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Policy Configuration</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define institutional policies for receipts and recurring expenses.</p>
                <button class="text-sm font-medium text-neutral-300 dark:text-neutral-600 cursor-not-allowed">
                    Coming Soon
                </button>
            </div>

            <!-- Card 5: Accounting Periods -->
            <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div class="flex items-center gap-2 mb-4">
                    <CalendarClock class="w-5 h-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                    <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Accounting Periods</h3>
                </div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Lock historical financial periods to prevent retroactive expense postings.</p>
                <button @click="isPeriodDrawerOpen = true" class="text-sm font-medium text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
                    Manage Periods →
                </button>
            </div>
        </div>

        <AccountingPeriodDrawer 
            :is-open="isPeriodDrawerOpen" 
            @close="isPeriodDrawerOpen = false" 
        />
    </div>
</template>
