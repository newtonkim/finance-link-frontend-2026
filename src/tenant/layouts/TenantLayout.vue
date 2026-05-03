<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { pomPinia } from 'septor-store'
import { SidebarProvider, SidebarInset, TopBar, Toaster } from '@/Global'
import TenantSidebar from './TenantSidebar.vue'
import { useCurrencyStore } from '@/stores/currency'
import { saccoBrandingApi } from '@/tenant/apis/saccobranding/saccoBrandingApi'

const currencyStore = useCurrencyStore()

onMounted(() => {
  currencyStore.load()
  saccoBrandingApi.get()
})
const Store = pomPinia() as any, route = useRoute()
const routeKey = computed(() => route.fullPath)
const fullRemount = computed(() => Store.fullRemount)
const toggleSubmenu = () => {
    Store.showSubmenu = null
    
}
</script>

<template>
  <SidebarProvider :key="fullRemount">
    <TenantSidebar />
    <SidebarInset class="bg-[#f8faf9] dark:bg-[#0a0a0a]" @click="toggleSubmenu">
      <TopBar title="Tenant Portal" />
      <main class="flex-1 overflow-y-auto mx-2">
        <router-view :key="routeKey" />
      </main>
    </SidebarInset>
    <Toaster position="top-right" richColors />
  </SidebarProvider>
</template>
