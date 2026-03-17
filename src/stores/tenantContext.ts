import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SaccoBranding {
  sacco_name: string | null
  tagline: string | null
  logo_url: string | null
}

export const useTenantContextStore = defineStore('tenantContext', () => {
  const currentTenant = ref<unknown | null>(null)
  const branding = ref<SaccoBranding | null>(null)
  const memberCount = ref<number | null>(null)

  function setTenant(tenant: unknown) {
    currentTenant.value = tenant
  }

  function setBranding(data: SaccoBranding) {
    branding.value = data
  }

  function setMemberCount(count: number) {
    memberCount.value = count
  }

  return { currentTenant, setTenant, branding, setBranding, memberCount, setMemberCount }
})
