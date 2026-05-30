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

const { state } = useSidebar();
const Store = pomPinia();
const { getBranding } = brandingApi();

onMounted(() => {
    if (!(Store as any).central_branding) getBranding();
});

const branding = computed(() => (Store as any).central_branding?.payload);
const sidebarName = computed(() => branding.value?.platform_name || 'Finance Link');
const sidebarTagline = computed(() => branding.value?.tagline || '');
const sidebarLogo = computed(() => branding.value?.logo_url || null);

// Dark mode toggle
const isDark = ref(document.documentElement.classList.contains('dark'));
function toggleDarkMode() {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark', isDark.value);
}
</script>

<template>
    <Sidebar collapsible="icon" variant="inset"
        class="bg-gradient-to-b from-[#001020] to-[#A8E6FF] text-white border-r-0 flex-grow px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <SidebarHeader class="px">
            <div class="flex items-center justify-center w-full">
                <div class="flex shrink-0 items-center justify-center bg-white rounded-xl shadow-md p-2 h-16 w-24">
                    <img :src="sidebarLogo || '/images/finance-link-logo.png'" alt="Logo"
                        class="h-full w-full transition-all object-contain"
                        :class="state === 'collapsed' ? 'scale-110' : ''" />
                </div>
            </div>
        </SidebarHeader>

        <SidebarContent class="px-3 flex flex-col flex-1">
            <OutClickNav class="flex-1 h-full" :links="centarRoutes" prefix="central" />
        </SidebarContent>

        <SidebarFooter class="p-4 mt-auto">
            <div v-if="state === 'expanded'" class="mb-4 flex items-center justify-between px-3 py-2">
                <span class="text-sm font-medium text-nfuko-nav-text/60">Dark Mode</span>
                <button @click="toggleDarkMode"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                    :class="isDark ? 'bg-white/20' : 'bg-white/5'">
                    <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow-sm"
                        :class="isDark ? 'translate-x-6' : 'translate-x-1'" />
                </button>
            </div>
        </SidebarFooter>
        <SidebarRail />
    </Sidebar>
</template>

<style scoped>
:deep(.bg-sidebar) {
    background-color: bg-nfuko-primary;
}
</style>
