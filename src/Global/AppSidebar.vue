<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
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
import { CreditCard } from 'lucide-vue-next';

const { state } = useSidebar();
const Store = pomPinia() as any;
const { getBranding } = brandingApi();
const route = useRoute();

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

const isOnRenewPage = computed(() => route.path.includes('/licenses/') && route.path.endsWith('/renew'));

const isDark = ref(document.documentElement.classList.contains('dark'));
function toggleDarkMode() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark', isDark.value);
}

</script>

<template>
    <Sidebar collapsible="icon" variant="inset" class="border-r-0 overflow-visible text-white">
        <!-- Header: logo + name -->
        <SidebarHeader class="px-4 pt-5 pb-4 border-b border-white/5 shrink-0">
            <div class="flex flex-col items-center gap-2 w-full">
                <div class="size-32 rounded-2xl overflow-hidden shadow-lg">
                    <img :src="sidebarLogo || '/images/finance-link-logo.webp'" alt="Finance Link"
                        class="w-full h-full object-contain" />
                </div>
                <div v-if="state === 'expanded'" class="text-center">
                    <p class="text-sm font-bold text-white leading-tight">{{ sidebarName }}</p>
                    <p class="text-[10px] font-semibold text-white/35 uppercase tracking-[0.15em] mt-0.5">CENTRAL</p>
                </div>
            </div>
        </SidebarHeader>

        <!-- Nav -->
        <SidebarContent class="px-3 py-3 flex flex-col flex-1 overflow-y-auto">
            <OutClickNav class="flex-1 h-full" :links="centarRoutes" prefix="central" />

            <!-- Payment Plan sub-item — visible only on the renew page -->
            <div v-if="isOnRenewPage && state === 'expanded'" class="mt-1 ml-3 pl-3 border-l border-white/10">
                <button
                    class="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-bold text-white bg-nfuko-nav-active cursor-default"
                >
                    <CreditCard :size="16" class="shrink-0 text-[#53b3da]" />
                    <span>Payment Plan</span>
                </button>
            </div>
        </SidebarContent>

        <!-- Footer: dark mode -->
        <SidebarFooter class="px-4 py-4 border-t border-white/5 mt-auto shrink-0 space-y-3">
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
