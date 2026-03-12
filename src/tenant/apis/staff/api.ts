import { tenantClient } from '../tenantClient'

export interface Staff {
  id?: number
  name: string
  email: string
  role: string
  password?: string
  status: 'active' | 'inactive'
  is_tenant_admin?: boolean
  created_at?: string
}

export const staffApi = {
  list(params?: { search?: string }) {
    return tenantClient.get('/staff', { params })
  },
  get(id: number) {
    return tenantClient.get(`/staff/${id}`)
  },
  create(data: Staff) {
    return tenantClient.post('/staff', data)
  },
  update(id: number, data: Partial<Staff>) {
    return tenantClient.put(`/staff/${id}`, data)
  },
  delete(id: number) {
    return tenantClient.delete(`/staff/${id}`)
  },
  getOnboardedMembers(id: number) {
    return tenantClient.get(`/staff/${id}/onboarded-members`)
  }
}
