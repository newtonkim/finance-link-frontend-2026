import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTenantContextStore = defineStore('tenantContext', () => {
  const currentTenant = ref<unknown | null>(null)

  function setTenant(tenant: unknown) {
    currentTenant.value = tenant
  }

  return { currentTenant, setTenant }
})
