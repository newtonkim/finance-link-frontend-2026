<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { pomPinia } from 'septor-store'
import { SidebarProvider, SidebarInset, TopBar, Toaster } from '@/Global'
import TenantSidebar from './TenantSidebar.vue'
import LicenseBanner from './LicenseBanner.vue'
import { useCurrencyStore } from '@/stores/currency'
import { saccoBrandingApi } from '@/tenant/apis/saccobranding/saccoBrandingApi'
import { tenantClient } from '@/tenant/apis/tenantClient'
import { applyLicenseStatus, type LicenseStatusPayload } from '@/tenant/apis/licenseState'

const currencyStore = useCurrencyStore()

async function loadLicenseStatus() {
  try {
    const { data } = await tenantClient.get<{ data: LicenseStatusPayload }>('/license-status')
    applyLicenseStatus(data.data)
  } catch {
    // The shared response interceptor handles license-specific failures. Other
    // startup errors should not prevent the tenant shell from loading.
  }
}

onMounted(() => {
  void loadLicenseStatus()
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
      <LicenseBanner />
      <main class="flex-1 overflow-y-auto mx-2">
        <router-view :key="routeKey" />
      </main>
    </SidebarInset>
    <Toaster position="top-right" richColors />
  </SidebarProvider>
</template>
