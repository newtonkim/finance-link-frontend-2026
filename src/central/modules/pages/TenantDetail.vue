<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
    Building2,
    ArrowLeft,
    ExternalLink,
    Clock,
    Calendar,
    Database,
    Globe,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from 'lucide-vue-next';
import { Card } from '@/Global/ui/card';
import { Button } from '@/Global/ui/button';
import type { Tenant, TenantLicense } from '@/types';
import { getTenant } from '@/central/api/tenants';

const router = useRouter();
const route = useRoute();

const tenant = ref<Tenant | null>(null);
const licenses = ref<TenantLicense[]>([]);
const isLoading = ref(false);
const error = ref('');

onMounted(async () => {
    isLoading.value = true;
    try {
        const res = await getTenant(route.params.id as string);
        const data = res.data;
        tenant.value = data;
        licenses.value = data.licenses ?? [];
    } catch {
        error.value = 'Failed to load tenant details.';
    } finally {
        isLoading.value = false;
    }
});

const hasSettings = computed(() => {
    const s = tenant.value?.settings;
    return s != null && Object.values(s).some(Boolean);
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

function licenseStatusIcon(status?: string) {
    switch (status) {
        case 'active': return CheckCircle2;
        case 'expired': return XCircle;
        default: return AlertCircle;
    }
}

function licenseStatusClass(status?: string) {
    switch (status) {
        case 'active': return 'text-emerald-500';
        case 'expired': return 'text-rose-500';
        default: return 'text-amber-500';
    }
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysLeft(expiresAt?: string): number | null {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
</script>

<template>
    <div class="p-6 space-y-6 max-w-5xl mx-auto">
        <!-- Back Button -->
        <button @click="router.push('/central/tenants')"
            class="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors font-medium">
            <ArrowLeft class="size-4" />
            Back to Tenants
        </button>

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-32 text-sm text-neutral-400 dark:text-neutral-500">
            Loading tenant details...
        </div>

        <!-- Error -->
        <div v-else-if="error"
            class="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-600 dark:text-rose-400">
            {{ error }}
        </div>

        <template v-else-if="tenant">
            <!-- Header -->
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-4">
                    <div class="size-14 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                        <Building2 class="size-7 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                            {{ tenant.name }}
                        </h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="size-2 rounded-full shrink-0" :class="statusDotClass(tenant.status)"></span>
                            <span class="text-sm font-medium capitalize" :class="statusTextClass(tenant.status)">
                                {{ tenant.status || 'unknown' }}
                            </span>
                            <span class="text-neutral-300 dark:text-white/20">·</span>
                            <span class="text-sm text-neutral-400 dark:text-neutral-500">
                                Created {{ formatDate(tenant.created_at) }}
                            </span>
                        </div>
                    </div>
                </div>

                <a v-if="tenant.full_url" :href="`${tenant.full_url}/tenant/login`" target="_blank">
                    <Button variant="outline"
                        class="flex items-center gap-2 rounded-xl border-neutral-200 dark:border-white/10 text-sm font-semibold">
                        <ExternalLink class="size-4" />
                        Open Portal
                    </Button>
                </a>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Subdomain -->
                <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] rounded-2xl p-5 space-y-2">
                    <div class="flex items-center gap-2 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                        <Globe class="size-3.5" />
                        Subdomain
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-mono font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                            {{ tenant.subdomain }}
                        </span>
                        <a v-if="tenant.full_url" :href="`${tenant.full_url}/tenant/login`" target="_blank"
                            class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                            <ExternalLink class="size-3.5" />
                        </a>
                    </div>
                </Card>

                <!-- Database -->
                <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] rounded-2xl p-5 space-y-2">
                    <div class="flex items-center gap-2 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                        <Database class="size-3.5" />
                        Database
                    </div>
                    <p class="text-sm font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {{ tenant.database_name || '—' }}
                    </p>
                </Card>

                <!-- License Expiry -->
                <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] rounded-2xl p-5 space-y-2">
                    <div class="flex items-center gap-2 text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                        <Clock class="size-3.5" />
                        License Expiry
                    </div>
                    <template v-if="tenant.active_license?.expires_at">
                        <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                            {{ daysLeft(tenant.active_license.expires_at) }}d left
                        </p>
                        <p class="text-xs text-neutral-400 dark:text-neutral-500">
                            {{ formatDate(tenant.active_license.expires_at) }}
                        </p>
                    </template>
                    <p v-else class="text-sm text-neutral-400 dark:text-neutral-500">No active license</p>
                </Card>
            </div>

            <!-- Active License -->
            <Card v-if="tenant.active_license"
                class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] rounded-2xl overflow-hidden">
                <div class="px-6 py-4 border-b border-neutral-100 dark:border-white/10">
                    <h2 class="text-sm font-bold text-neutral-900 dark:text-white">Active License</h2>
                </div>
                <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Plan</p>
                        <p class="text-sm font-semibold text-neutral-900 dark:text-white capitalize">
                            {{ tenant.active_license.plan_slug || '—' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Status</p>
                        <p class="text-sm font-semibold capitalize" :class="statusTextClass(tenant.active_license.status)">
                            {{ tenant.active_license.status }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Expires</p>
                        <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                            {{ formatDate(tenant.active_license.expires_at) }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Days Left</p>
                        <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                            {{ daysLeft(tenant.active_license.expires_at) ?? '—' }}d
                        </p>
                    </div>
                </div>
            </Card>

            <!-- Settings -->
            <Card v-if="hasSettings"
                class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] rounded-2xl overflow-hidden">
                <div class="px-6 py-4 border-b border-neutral-100 dark:border-white/10">
                    <h2 class="text-sm font-bold text-neutral-900 dark:text-white">Organization Settings</h2>
                </div>
                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-if="tenant.settings?.email">
                        <p class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Email</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ tenant.settings.email }}</p>
                    </div>
                    <div v-if="tenant.settings?.address">
                        <p class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Address</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ tenant.settings.address }}</p>
                    </div>
                    <div v-if="tenant.settings?.slogan">
                        <p class="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Slogan</p>
                        <p class="text-sm text-neutral-900 dark:text-white">{{ tenant.settings.slogan }}</p>
                    </div>
                </div>
            </Card>

            <!-- License History -->
            <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] rounded-2xl overflow-hidden">
                <div class="px-6 py-4 border-b border-neutral-100 dark:border-white/10">
                    <h2 class="text-sm font-bold text-neutral-900 dark:text-white">License History</h2>
                </div>

                <div v-if="licenses.length === 0" class="px-6 py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
                    No license history found.
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest border-b border-neutral-100 dark:border-white/10">
                                <th class="px-6 py-3 font-bold">Plan</th>
                                <th class="px-6 py-3 font-bold">Status</th>
                                <th class="px-6 py-3 font-bold">Expires</th>
                                <th class="px-6 py-3 font-bold">Days Left</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-50 dark:divide-white/5">
                            <tr v-for="license in licenses" :key="license.id"
                                class="hover:bg-neutral-50/50 dark:hover:bg-white/3 transition-colors">
                                <td class="px-6 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                                    {{ license.plan_slug }}
                                </td>
                                <td class="px-6 py-3">
                                    <div class="flex items-center gap-1.5">
                                        <component :is="licenseStatusIcon(license.status)"
                                            class="size-4 shrink-0" :class="licenseStatusClass(license.status)" />
                                        <span class="text-sm font-medium capitalize" :class="licenseStatusClass(license.status)">
                                            {{ license.status }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                                    <div class="flex items-center gap-1.5">
                                        <Calendar class="size-3.5 text-neutral-400 shrink-0" />
                                        {{ formatDate(license.expires_at) }}
                                    </div>
                                </td>
                                <td class="px-6 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                                    {{ daysLeft(license.expires_at) ?? '—' }}d
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </template>
    </div>
</template>

<style scoped>
/* Tenant detail page specific styles */
</style>
