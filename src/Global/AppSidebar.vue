<script setup lang="ts">
import { ref } from 'vue';
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
const { state } = useSidebar();
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
        <SidebarHeader class="px ">
            <div class="flex items-center gap-2 truncate">
                <div
                    class="flex shrink-0 items-center justify-center rounded-2xl bg-nfuko-yellow/20 text-[#0A2318] shadow-xl transition-all duration-500 h-14 w-14">
                    <img src="/images/mfuko_plus_logo.webp" alt="Mfuko Pro" class="h-8 w-auto transition-all"
                    :class="state === 'collapsed' ? 'scale-125' : ''" /></div>
                <div class="flex flex-col min-w-0"><span
                        class="text-lg font-bold leading-tight tracking-tight text-white italic"> Boss Portal</span><!--v-if--></div>
            </div> 

        </SidebarHeader>

        <SidebarContent class="px-3">
            <OutClickNav class="mt-2" :links="centarRoutes" />
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
