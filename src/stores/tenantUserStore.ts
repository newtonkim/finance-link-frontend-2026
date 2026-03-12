import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TenantUser {
  id: number
  name: string
  email: string
  avatar?: string | null
}

export const useTenantUserStore = defineStore('tenantUser', () => {
  const user = ref<TenantUser | null>(null)

  function load() {
    const raw = localStorage.getItem('tenant_user')
    if (raw) {
      try { user.value = JSON.parse(raw) } catch { user.value = null }
    }
  }

  function clear() {
    user.value = null
    localStorage.removeItem('tenant_token')
    localStorage.removeItem('tenant_subdomain')
    localStorage.removeItem('tenant_user')
  }

  return { user, load, clear }
})
