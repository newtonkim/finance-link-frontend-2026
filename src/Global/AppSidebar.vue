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
    <Sidebar collapsible="icon" variant="inset" class="bg-[#001d22] text-white border-r-0 flex-grow px-4 space-y-2 overflow-y-a uto custom-scrollbar">
        <SidebarHeader class="p-6">
            <div class="flex items-center gap-3">
                <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-white">
                    <div class="size-5 rounded-[4px] bg-[#001d22]"></div>
                </div>
                <div v-if="state === 'expanded'" class="flex flex-col">
                    <span class="text-base font-bold tracking-tight text-white">Mfuko Pro</span>
                </div>
            </div>
        </SidebarHeader>

        <SidebarContent class="px-3">
             <OutClickNav class="mt-4" :links="centarRoutes"/>
        </SidebarContent>

        <SidebarFooter class="p-4 mt-auto">
            <div v-if="state === 'expanded'" class="mb-4 flex items-center justify-between px-3 py-2">
                <span class="text-sm font-medium text-[#9BB5A5]/60">Dark Mode</span>
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
    background-color: #001d22;
}
</style>
