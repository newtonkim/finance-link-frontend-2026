<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from '@/Global';
import { centarRoutes } from '@/central/modules/routes';
import { OutClickNav } from './OutClicknavigation';
import { brandingApi } from '@/central/modules/apis';
import { pomPinia } from 'septor-store';
import { fetchTableData } from '@/Global/landingLayout/util';

const { state } = useSidebar();
const Store = pomPinia() as any;
const { getBranding } = brandingApi();

onMounted(() => {
    if (!Store.central_branding) getBranding();
    if (!Store.licenseStats) {
        fetchTableData({ data: {}, props: { state: 'licenseStats', url: 'central/licenses/stats', reload: false, time: 0 }, Store });
    }
    if (!Store.tenantList) {
        fetchTableData({ data: { page: 1 }, props: { state: 'tenantList', url: 'central/tenants/list', reload: false, time: 0 }, Store });
    }
});

const branding = computed(() => Store.central_branding?.payload);
const sidebarName = computed(() => branding.value?.platform_name || 'Finance Link');
const sidebarLogo = computed(() => branding.value?.logo_url || null);

const isDark = ref(document.documentElement.classList.contains('dark'));
function toggleDarkMode() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark', isDark.value);
}

const usedSeats = computed(() => Store.platformStats?.payload?.used_seats ?? 187);
const totalSeats = computed(() => Store.platformStats?.payload?.total_seats ?? 240);
const availableSeats = computed(() => totalSeats.value - usedSeats.value);
const seatsPercent = computed(() =>
    totalSeats.value ? Math.min(100, Math.round((usedSeats.value / totalSeats.value) * 100)) : 0
);
</script>

<template>
    <Sidebar collapsible="icon" variant="inset" class="border-r-0 overflow-hidden text-white">
        <!-- Header: logo + name -->
        <SidebarHeader class="px-4 pt-5 pb-4 border-b border-white/5 shrink-0">
            <div class="flex items-center gap-3 min-w-0">
                <div class="shrink-0 size-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                    <img v-if="sidebarLogo" :src="sidebarLogo" alt="Logo" class="size-6 object-contain rounded" />
                    <svg v-else class="size-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
                <div v-if="state === 'expanded'" class="min-w-0 overflow-hidden">
                    <p class="text-[15px] font-bold text-white leading-tight truncate">{{ sidebarName }}</p>
                    <p class="text-[10px] font-semibold text-white/35 uppercase tracking-[0.15em] mt-0.5">CENTRAL</p>
                </div>
            </div>
        </SidebarHeader>

        <!-- Nav -->
        <SidebarContent class="px-3 py-3 flex flex-col flex-1 overflow-y-auto">
            <OutClickNav class="flex-1 h-full" :links="centarRoutes" prefix="central" />
        </SidebarContent>

        <!-- Footer: seats + dark mode -->
        <SidebarFooter class="px-4 py-4 border-t border-white/5 mt-auto shrink-0 space-y-3">
            <div v-if="state === 'expanded'" class="rounded-xl bg-white/5 px-3 py-3 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-white/50">Platform seats</span>
                    <span class="text-xs font-semibold text-white/60">{{ usedSeats }} / {{ totalSeats }}</span>
                </div>
                <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full transition-all duration-500"
                        :style="{ width: `${seatsPercent}%` }" />
                </div>
                <p class="text-[11px] text-white/35">{{ availableSeats }} seats available across all tenants</p>
            </div>
            <div class="flex items-center justify-between px-1">
                <span v-if="state === 'expanded'" class="text-sm font-medium text-white/50">Dark mode</span>
                <button @click="toggleDarkMode"
                    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200"
                    :class="isDark ? 'bg-blue-600' : 'bg-white/15'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow"
                        :class="isDark ? 'translate-x-6' : 'translate-x-1'" />
                </button>
            </div>
        </SidebarFooter>

        <SidebarRail />
    </Sidebar>
</template>

<style scoped>
:deep([data-sidebar="sidebar"]) {
    background-color: #0c1427 !important;
}
:deep(.bg-sidebar) {
    background-color: #0c1427 !important;
}
</style>
