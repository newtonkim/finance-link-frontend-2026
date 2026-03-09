<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
    Plus,
    MoreHorizontal,
    Eye,
    Pencil,
    RefreshCw,
    Trash2,
} from 'lucide-vue-next';
import { Card } from '@/Global/ui/card';
import { Button } from '@/Global/ui/button';

const router = useRouter();

interface License {
    id: number;
    tenantName: string;
    plan: string;
    startsAt: string;
    expiresAt: string;
    status: 'active' | 'expired' | 'suspended' | 'trial';
}

// Mock licenses data (empty for now to show empty state)
const licenses = ref<License[]>([]);

// Actions dropdown
const openActionMenu = ref<number | null>(null);

function toggleActionMenu(id: number) {
    openActionMenu.value = openActionMenu.value === id ? null : id;
}

function closeActionMenus() {
    openActionMenu.value = null;
}

// Status badge styles
function statusClasses(status: string) {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
        case 'expired':
            return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
        case 'suspended':
            return 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
        case 'trial':
            return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
        default:
            return 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-400';
    }
}
</script>

<template>
    <div class="p-6 space-y-6" click="closeActionMenus">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Tenant Licenses
            </h1>
            <Button @click="router.push('/central/licenses/create')"
                class="bg-[#001d22] hover:bg-[#002e35] dark:bg-white dark:text-[#001d22] dark:hover:bg-neutral-200 text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm transition-all duration-200 flex items-center gap-2">
                <Plus class="size-4" />
                Create License
            </Button>
        </div>

        <!-- Table Card -->
        <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr
                            class="text-left text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest border-b border-neutral-100 dark:border-white/10">
                            <th class="px-6 py-4 font-bold">Tenant</th>
                            <th class="px-6 py-4 font-bold">Plan</th>
                            <th class="px-6 py-4 font-bold">Starts At</th>
                            <th class="px-6 py-4 font-bold">Expires At</th>
                            <th class="px-6 py-4 font-bold">Status</th>
                            <th class="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-50 dark:divide-white/5">
                        <!-- License rows -->
                        <tr v-for="license in licenses" :key="license.id"
                            class="group hover:bg-neutral-50/50 dark:hover:bg-white/[0.03] transition-colors">
                            <td class="px-6 py-4">
                                <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{
                                    license.tenantName
                                }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-neutral-600 dark:text-neutral-300 capitalize">{{
                                    license.plan
                                }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-neutral-500 dark:text-neutral-400">{{
                                    license.startsAt
                                }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-neutral-500 dark:text-neutral-400">{{
                                    license.expiresAt
                                }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span :class="statusClasses(license.status)"
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize">
                                    {{ license.status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="relative inline-block">
                                    <button @click.stop="toggleActionMenu(license.id)"
                                        class="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                                        <MoreHorizontal class="size-4 text-neutral-400 dark:text-neutral-500" />
                                    </button>
                                    <Transition enter-active-class="transition duration-100 ease-out"
                                        enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                                        leave-active-class="transition duration-75 ease-in"
                                        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                                        <div v-if="openActionMenu === license.id"
                                            class="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1a1a1a] border border-neutral-100 dark:border-white/10 rounded-xl shadow-lg py-1 z-50">
                                            <button
                                                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                                                <Eye class="size-3.5" /> View
                                            </button>
                                            <button
                                                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                                                <Pencil class="size-3.5" /> Edit
                                            </button>
                                            <button
                                                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                                                <RefreshCw class="size-3.5" /> Renew
                                            </button>
                                            <button
                                                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                <Trash2 class="size-3.5" /> Revoke
                                            </button>
                                        </div>
                                    </Transition>
                                </div>
                            </td>
                        </tr>

                        <!-- Empty state -->
                        <tr v-if="licenses.length === 0">
                            <td colspan="6" class="px-6 py-16">
                                <div class="text-center">
                                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                                        No licenses found.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    </div>
</template>

<style scoped>
/* Licenses page specific styles */
</style>
