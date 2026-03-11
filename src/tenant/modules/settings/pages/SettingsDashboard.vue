<script setup lang="ts">
import { useRouter } from 'vue-router'
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
    Shield
} from 'lucide-vue-next'

const router = useRouter()

const modules = [
    { name: 'Organisation', icon: Building2, path: '/tenant/settings/organisation', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { name: 'Members', icon: Users, path: '/tenant/settings/members', color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
    { name: 'Loans', icon: CreditCard, path: '/tenant/settings/loans', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
    { name: 'Savings', icon: Landmark, path: '/tenant/settings/savings', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
    { name: 'Shares', icon: PieChart, path: '/tenant/settings/shares', color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' },
    { name: 'Transactions', icon: ArrowLeftRight, path: '/tenant/settings/transactions', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
    { name: 'Accounting', icon: BookOpen, path: '/tenant/settings/accounting', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400' },
    { name: 'Compliance', icon: ShieldCheck, path: '/tenant/settings/compliance', color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
    { name: 'Notifications', icon: Bell, path: '/tenant/settings/notifications', color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' },
    { name: 'System', icon: Shield, path: '/tenant/settings/system', color: 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400' },
]

const navigate = (path: string) => {
    router.push(path)
}
</script>

<template>
    <div class="flex-1 overflow-y-auto p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">System Settings Architecture</h1>
                <p class="mt-2 text-neutral-500 dark:text-neutral-400 text-lg">Clicking a module jumps to its
                    configuration page.</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
                <button v-for="mod in modules" :key="mod.name" @click="navigate(mod.path)"
                    class="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 dark:bg-neutral-900 dark:border-neutral-800">
                    <div :class="['p-3 rounded-xl mb-3', mod.color]">
                        <component :is="mod.icon" class="h-6 w-6" />
                    </div>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ mod.name }}</span>
                </button>
            </div>
        </div>
    </div>
</template>
