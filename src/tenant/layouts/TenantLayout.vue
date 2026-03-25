<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { pomPinia } from 'septor-store'
import { SidebarProvider, SidebarInset, TopBar, Toaster } from '@/Global'
import TenantSidebar from './TenantSidebar.vue'
import { useCurrencyStore } from '@/stores/currency'
const currencyStore = useCurrencyStore()
onMounted(() => {
  currencyStore.load()
})
const Store = pomPinia(), route = useRoute()
const routeKey = computed(() => {
  return `${route.fullPath}-${Store.activeBranch?.id ?? Store.activeBranch}`
})
</script>

<template>
  <SidebarProvider>
    <TenantSidebar />
    <SidebarInset class="bg-[#f8faf9] dark:bg-[#0a0a0a]">
      <TopBar title="Tenant Portal" />
      <main class="flex-1 overflow-y-auto">
        <router-view :key="routeKey" />
      </main>
    </SidebarInset>
    <Toaster position="top-right" richColors />
  </SidebarProvider>
</template>
