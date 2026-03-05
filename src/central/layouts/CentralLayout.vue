<template>
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset class="bg-[#f8faf9]">
            <TopBar title="Dashboard" />
            <main class="flex-1 overflow-y-auto">
                <router-view />
            </main>
        </SidebarInset>
    </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider, SidebarInset } from '@/Global/ui/sidebar';
import AppSidebar from '@/Global/AppSidebar.vue';
import TopBar from '@/Global/TopBar.vue';
</script>

<style scoped>
/* Any layout specific styles */
</style>
