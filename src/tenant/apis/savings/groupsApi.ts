import { tenantClient } from '@/tenant/apis/tenantClient'

export const groupsApi = {
  list(params?: { search?: string; page?: number }) {
    return tenantClient.get('/savings-groups', { params })
  },
  store(data: Record<string, any>) {
    return tenantClient.post('/savings-groups', data)
  },
  storeFormData(data: FormData) {
    return tenantClient.post('/savings-groups', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  show(id: number) {
    return tenantClient.get(`/savings-groups/${id}`)
  },
  update(id: number, data: Record<string, any>) {
    return tenantClient.put(`/savings-groups/${id}`, data)
  },
  updateFormData(id: number, data: FormData) {
    return tenantClient.post(`/savings-groups/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  destroy(id: number) {
    return tenantClient.delete(`/savings-groups/${id}`)
  },
}
