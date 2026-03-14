import { apiClient } from './client'

export interface CreateTenantPayload {
  name: string
  subdomain: string
  admin_name: string
  admin_email: string
  admin_phone?: string
  admin_password: string
  plan: string
  license_months: number
}


export function createTenant(payload: CreateTenantPayload) {
  return apiClient.post('/central/tenants', payload)
}

export function getTenants(page = 1) {
  return apiClient.get('/central/tenants', { params: { page } })
}

export function getTenant(id: string) {
  return apiClient.get(`/central/tenants/${id}`)
}

export function deleteTenant(id: string) {
  return apiClient.delete(`/central/tenants/${id}`)
}
