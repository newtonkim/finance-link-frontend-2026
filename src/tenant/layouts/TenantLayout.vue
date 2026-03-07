<script setup lang="ts">
import { SidebarProvider, SidebarInset } from '@/Global/ui/sidebar'
import TenantSidebar from './TenantSidebar.vue'
import TopBar from '@/Global/TopBar.vue'
</script>

<template>
  <SidebarProvider>
    <TenantSidebar />
    <SidebarInset class="bg-[#f8faf9] dark:bg-[#0a0a0a]">
      <TopBar title="Tenant Portal" />
      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
