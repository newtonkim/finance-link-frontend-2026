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
const sidebarName = computed(() => branding.value?.platform_name || 'Boss Portal');
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
        class=" bg-nfuko-primary text-white border-r-0 flex-grow px-4 space-y-2 overflow-y-a uto custom-scrollbar">
        <SidebarHeader class="px">
            <div class="flex items-center gap-2 truncate">
                <div class="flex shrink-0 items-center justify-center h-14 w-14">
                    <img :src="sidebarLogo || '/images/mfuko_plus_logo.webp'" alt="Logo"
                        class="h-12 w-12 transition-all object-contain"
                        :class="state === 'collapsed' ? 'scale-125' : ''" />
                </div>
                <div v-if="state !== 'collapsed'" class="flex flex-col min-w-0">
                    <span class="text-lg font-bold leading-tight tracking-tight text-white italic truncate">
                        {{ sidebarName }}
                    </span>
                    <span v-if="sidebarTagline" class="text-[11px] text-white/50 truncate">
                        {{ sidebarTagline }}
                    </span>
                </div>
            </div>
        </SidebarHeader>

        <SidebarContent class="px-3 flex flex-col flex-1">
            <OutClickNav class="flex-1 h-full" :links="centarRoutes" />
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
