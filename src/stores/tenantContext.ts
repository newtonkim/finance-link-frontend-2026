import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTenantContextStore = defineStore('tenantContext', () => {
  const currentTenant = ref(null)

  function setTenant(tenant: any) {
    currentTenant.value = tenant
  }

  return { currentTenant, setTenant }
})
