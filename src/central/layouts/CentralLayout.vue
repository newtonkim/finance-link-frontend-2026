<template>
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset class="bg-[#f8faf9] dark:bg-[#0a0a0a]" @click="toggleSubmenu">
            <TopBar title="Dashboard" />
            <main class="flex-1 overflow-y-auto ">
                <router-view />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider, SidebarInset } from '@/Global/ui/sidebar';
import AppSidebar from '@/Global/AppSidebar.vue';
import TopBar from '@/Global/TopBar.vue';
import { pomPinia } from 'septor-store';
const Store = pomPinia() as any;

const toggleSubmenu = () => {
    Store.showSubmenu = null
    
}
</script>

<style scoped>
/* Any layout specific styles */
</style>
