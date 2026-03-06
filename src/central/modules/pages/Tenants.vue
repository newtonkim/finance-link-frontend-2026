<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
    Search,
    Plus,
    FileText,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
} from 'lucide-vue-next';
import { Card } from '@/Global/ui/card';
import { Button } from '@/Global/ui/button';
import { Input } from '@/Global/ui/input';
import type { Tenant } from '@/types';

const router = useRouter();

// Filter tabs
type FilterTab = 'all' | 'active' | 'suspended' | 'trial';
const activeFilter = ref<FilterTab>('all');
const searchQuery = ref('');

const filterTabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Trial', value: 'trial' },
];

// Mock tenants data (empty for now to show empty state)
const tenants = ref<Tenant[]>([]);

// Filtered tenants
const filteredTenants = computed(() => {
    let result = tenants.value;

    // Filter by status tab
    if (activeFilter.value !== 'all') {
        result = result.filter((t) => t.status === activeFilter.value);
    }

    // Filter by search query
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                t.domain.toLowerCase().includes(q) ||
                t.slug.toLowerCase().includes(q)
        );
    }

    return result;
});

// Actions dropdown
const openActionMenu = ref<number | null>(null);

function toggleActionMenu(id: number) {
    openActionMenu.value = openActionMenu.value === id ? null : id;
}

function closeActionMenus() {
    openActionMenu.value = null;
}

// Status badge styles
function statusClasses(status?: string) {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
        case 'suspended':
            return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
        case 'trial':
            return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
        default:
            return 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-400';
    }
}
</script>

<template>
    <div class="p-6 space-y-6" @click="closeActionMenus">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    Tenant Management
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Manage all registered SACCOs and their licenses
                </p>
            </div>
            <Button @click="router.push('/central/tenants/create')"
                class="bg-[#001d22] hover:bg-[#002e35] dark:bg-white dark:text-[#001d22] dark:hover:bg-neutral-200 text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm transition-all duration-200 flex items-center gap-2">
                <Plus class="size-4" />
                New Tenant
            </Button>
        </div>

        <!-- Search & Filters -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <!-- Search Input -->
            <div class="relative flex-1">
                <Search
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                <Input v-model="searchQuery" type="text" placeholder="Search tenants by name or subdomain..."
                    class="pl-10 h-11 rounded-xl border-neutral-200 dark:border-white/10 dark:bg-[#151515] dark:text-white bg-white shadow-sm text-sm focus:ring-2 focus:ring-[#001d22]/10 dark:focus:ring-white/10 transition-shadow" />
            </div>

            <!-- Filter Tabs -->
            <div class="flex items-center bg-neutral-100/80 dark:bg-white/5 p-1 rounded-xl gap-1">
                <button v-for="tab in filterTabs" :key="tab.value" @click="activeFilter = tab.value"
                    class="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200" :class="activeFilter === tab.value
                        ? 'bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                        ">
                    {{ tab.label }}
                </button>
            </div>
        </div>

        <!-- Table Card -->
        <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
            <!-- Table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr
                            class="text-left text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest border-b border-neutral-100 dark:border-white/10">
                            <th class="px-6 py-4 font-bold">Tenant</th>
                            <th class="px-6 py-4 font-bold">Subdomain</th>
                            <th class="px-6 py-4 font-bold">Plan</th>
                            <th class="px-6 py-4 font-bold">License Expiry</th>
                            <th class="px-6 py-4 font-bold">Status</th>
                            <th class="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-50 dark:divide-white/5">
                        <!-- Tenant rows -->
                        <tr v-for="tenant in filteredTenants" :key="tenant.id"
                            class="group hover:bg-neutral-50/50 dark:hover:bg-white/[0.03] transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="size-9 rounded-lg bg-[#001d22]/5 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-[#001d22] dark:text-white">
                                        {{ tenant.name?.charAt(0)?.toUpperCase() }}
                                    </div>
                                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">{{ tenant.name
                                    }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-neutral-500 dark:text-neutral-400 font-mono">{{ tenant.domain
                                    || tenant.slug }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-neutral-600 dark:text-neutral-300">{{
                                    tenant.plan || '—'
                                }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-neutral-500 dark:text-neutral-400">{{
                                    tenant.license_expiry || '—'
                                }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span :class="statusClasses(tenant.status)"
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize">
                                    {{ tenant.status || 'unknown' }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="relative inline-block">
                                    <button @click.stop="toggleActionMenu(tenant.id)"
                                        class="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                                        <MoreHorizontal class="size-4 text-neutral-400 dark:text-neutral-500" />
                                    </button>
                                    <!-- Dropdown -->
                                    <Transition enter-active-class="transition duration-100 ease-out"
                                        enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                                        leave-active-class="transition duration-75 ease-in"
                                        leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                                        <div v-if="openActionMenu === tenant.id"
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
                                                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                <Trash2 class="size-3.5" /> Delete
                                            </button>
                                        </div>
                                    </Transition>
                                </div>
                            </td>
                        </tr>

                        <!-- Empty state -->
                        <tr v-if="filteredTenants.length === 0">
                            <td colspan="6" class="px-6 py-20">
                                <div class="flex flex-col items-center justify-center text-center">
                                    <div
                                        class="size-16 rounded-2xl bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                        <FileText class="size-7 text-neutral-300 dark:text-neutral-600" />
                                    </div>
                                    <h3 class="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        No tenants found
                                    </h3>
                                    <p class="text-sm text-neutral-400 dark:text-neutral-500">
                                        Create your first tenant to get started
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
/* Tenant page specific styles */
</style>
