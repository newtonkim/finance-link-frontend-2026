<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
    Search,
    Plus,
    FileText,
    Building2,
    ExternalLink,
    Clock,
    Eye,
    Ban,
} from 'lucide-vue-next';
import { Card } from '@/Global/ui/card';
import { Button } from '@/Global/ui/button';
import { Input } from '@/Global/ui/input';
import type { Tenant } from '@/types';
import { getTenants } from '@/central/api/tenants';

const router = useRouter();

// Filter tabs
type FilterTab = 'all' | 'active' | 'suspended' | 'trial';
const activeFilter = ref<FilterTab>('all');
const searchQuery = ref('');
const isLoading = ref(false);

const filterTabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Trial', value: 'trial' },
];

const tenants = ref<Tenant[]>([]);

onMounted(async () => {
    isLoading.value = true;
    try {
        const res = await getTenants();
        tenants.value = res.data.data ?? res.data;
    } catch {
        // leave empty
    } finally {
        isLoading.value = false;
    }
});

// Filtered tenants
const filteredTenants = computed(() => {
    let result = tenants.value;

    if (activeFilter.value !== 'all') {
        result = result.filter((t) => t.status === activeFilter.value);
    }

    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(
            (t) =>
                t.name.toLowerCase().includes(q) ||
                t.subdomain.toLowerCase().includes(q)
        );
    }

    return result;
});

function statusDotClass(status?: string) {
    switch (status) {
        case 'active': return 'bg-emerald-500';
        case 'suspended': return 'bg-rose-500';
        case 'trial': return 'bg-amber-500';
        default: return 'bg-neutral-400';
    }
}

function statusTextClass(status?: string) {
    switch (status) {
        case 'active': return 'text-emerald-600 dark:text-emerald-400';
        case 'suspended': return 'text-rose-600 dark:text-rose-400';
        case 'trial': return 'text-amber-600 dark:text-amber-400';
        default: return 'text-neutral-500 dark:text-neutral-400';
    }
}

function daysLeft(expiresAt?: string): number | null {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

</script>

<template>
    <div class="p-6 space-y-6">
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
                        <!-- Loading skeleton rows -->
                        <template v-if="isLoading">
                            <tr v-for="i in 6" :key="`skeleton-${i}`"
                                class="border-b border-neutral-50 dark:border-white/5">
                                <!-- Tenant cell -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="size-10 rounded-xl bg-neutral-200 dark:bg-white/10 animate-pulse shrink-0">
                                        </div>
                                        <div class="space-y-2">
                                            <div class="h-3.5 rounded-md bg-neutral-200 dark:bg-white/10 animate-pulse"
                                                :style="{ width: `${90 + (i * 17) % 60}px` }"></div>
                                            <div
                                                class="h-2.5 w-24 rounded-md bg-neutral-100 dark:bg-white/5 animate-pulse">
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <!-- Subdomain cell -->
                                <td class="px-6 py-4">
                                    <div class="h-7 rounded-lg bg-neutral-100 dark:bg-white/5 animate-pulse"
                                        :style="{ width: `${70 + (i * 13) % 40}px` }"></div>
                                </td>
                                <!-- Plan cell -->
                                <td class="px-6 py-4">
                                    <div class="h-3.5 w-16 rounded-md bg-neutral-100 dark:bg-white/5 animate-pulse">
                                    </div>
                                </td>
                                <!-- License expiry cell -->
                                <td class="px-6 py-4">
                                    <div class="space-y-2">
                                        <div
                                            class="h-3.5 w-20 rounded-md bg-neutral-200 dark:bg-white/10 animate-pulse">
                                        </div>
                                        <div class="h-2.5 w-24 rounded-md bg-neutral-100 dark:bg-white/5 animate-pulse">
                                        </div>
                                    </div>
                                </td>
                                <!-- Status cell -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <div class="size-2 rounded-full bg-neutral-200 dark:bg-white/10 animate-pulse">
                                        </div>
                                        <div class="h-3.5 w-14 rounded-md bg-neutral-100 dark:bg-white/5 animate-pulse">
                                        </div>
                                    </div>
                                </td>
                                <!-- Actions cell -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center justify-end gap-2">
                                        <div class="size-8 rounded-lg bg-neutral-100 dark:bg-white/5 animate-pulse">
                                        </div>
                                        <div class="size-8 rounded-lg bg-neutral-100 dark:bg-white/5 animate-pulse">
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </template>

                        <!-- Tenant rows -->
                        <template v-if="!isLoading">
                            <tr v-for="tenant in filteredTenants" :key="tenant.id"
                                class="group hover:bg-neutral-50/50 dark:hover:bg-white/3 transition-colors">
                                <!-- Tenant -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="size-10 rounded-xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                            <img src="/images/mfuko_plus_logo.webp" alt="Tenant"
                                                class="size-full object-contain p-1.5" />
                                        </div>
                                        <div>
                                            <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{
                                                tenant.name }}</p>
                                            <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Created {{
                                                formatDate(tenant.created_at) }}</p>
                                        </div>
                                    </div>
                                </td>

                                <!-- Subdomain -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-1.5">
                                        <span
                                            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/10 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                                            {{ tenant.subdomain }}
                                        </span>
                                        <a :href="tenant.full_url ? `${tenant.full_url}/tenant/login` : '#'"
                                            target="_blank"
                                            class="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                                            <ExternalLink class="size-3.5" />
                                        </a>
                                    </div>
                                </td>

                                <!-- Plan -->
                                <td class="px-6 py-4">
                                    <span class="text-sm text-neutral-600 dark:text-neutral-300 capitalize">
                                        {{ tenant.active_license?.plan_slug || '—' }}
                                    </span>
                                </td>

                                <!-- License Expiry -->
                                <td class="px-6 py-4">
                                    <template v-if="tenant.active_license?.expires_at">
                                        <div class="flex items-center gap-1.5">
                                            <Clock class="size-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                                            <div>
                                                <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                    {{ daysLeft(tenant.active_license.expires_at) }}d left
                                                </p>
                                                <p class="text-xs text-neutral-400 dark:text-neutral-500">{{
                                                    formatDate(tenant.active_license.expires_at) }}</p>
                                            </div>
                                        </div>
                                    </template>
                                    <span v-else class="text-sm text-neutral-400">—</span>
                                </td>

                                <!-- Status -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <span class="size-2 rounded-full shrink-0"
                                            :class="statusDotClass(tenant.status)"></span>
                                        <span class="text-sm font-medium capitalize"
                                            :class="statusTextClass(tenant.status)">
                                            {{ tenant.status || 'unknown' }}
                                        </span>
                                    </div>
                                </td>

                                <!-- Actions -->
                                <td class="px-6 py-4">
                                    <div class="flex items-center justify-end gap-1">
                                        <button @click="router.push(`/central/tenants/${tenant.id}`)"
                                            class="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                                            title="View">
                                            <Eye class="size-4" />
                                        </button>
                                        <button
                                            class="p-2 rounded-lg text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                            title="Suspend">
                                            <Ban class="size-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </template>

                        <!-- Empty state -->
                        <tr v-if="!isLoading && filteredTenants.length === 0">
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
/* Staggered skeleton fade-in */
tr:nth-child(1) td>* {
    animation-delay: 0ms;
}

tr:nth-child(2) td>* {
    animation-delay: 80ms;
}

tr:nth-child(3) td>* {
    animation-delay: 160ms;
}

tr:nth-child(4) td>* {
    animation-delay: 240ms;
}

tr:nth-child(5) td>* {
    animation-delay: 320ms;
}

tr:nth-child(6) td>* {
    animation-delay: 400ms;
}

@keyframes shimmer {
    0% {
        opacity: 0.5;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: shimmer 1.6s ease-in-out infinite;
}
</style>
