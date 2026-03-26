<script setup lang="ts">

import { useRoute, useRouter } from 'vue-router'
import {
    Building2,
    Users,
    CreditCard,
    Landmark,
    PieChart,
    ArrowLeftRight,
    BookOpen,
    ShieldCheck,
    Bell,
    Shield,
    ChevronRight
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const modules = [
    { name: 'Organisation', icon: Building2, path: '/tenant/settings/organisation' },
    { name: 'Members & Roles', icon: Users, path: '/tenant/settings/members' },
    { name: 'Loans & Loan Products', icon: CreditCard, path: '/tenant/settings/loans' },
    { name: 'Savings Products', icon: Landmark, path: '/tenant/settings/savings' },
    { name: 'Shares & Dividends', icon: PieChart, path: '/tenant/settings/shares' },
    { name: 'Transactions', icon: ArrowLeftRight, path: '/tenant/settings/transactions' },
    { name: 'Accounting & GL', icon: BookOpen, path: '/tenant/settings/accounting' },
    { name: 'Compliance & Audit', icon: ShieldCheck, path: '/tenant/settings/compliance' },
    { name: 'Notifications', icon: Bell, path: '/tenant/settings/notifications' },
    { name: 'System & Security', icon: Shield, path: '/tenant/settings/system' },
]

const isActive = (path: string) => route.path.startsWith(path)

const navigate = (path: string) => {
    router.push(path)
}
</script>

<template>
    <aside
        class="w-64 border-r border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 flex flex-col h-full overflow-y-auto">
        <div class="p-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Settings
                Modules</h2>
        </div>
        <nav class="flex-1 p-2 space-y-1">
            <button v-for="mod in modules" :key="mod.name" @click="navigate(mod.path)" :class="[
                'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors capitalize',
                isActive(mod.path)
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white'
            ]">
                <div class="flex items-center gap-3">
                    <component :is="mod.icon" class="h-4 w-4" />
                    <span>{{ mod.name }}</span>
                </div>
                <ChevronRight v-if="isActive(mod.path)" class="h-3 w-3" />
            </button>
        </nav>
    </aside>
</template>
