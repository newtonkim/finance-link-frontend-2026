import { tenantClient } from '@/tenant/apis/tenantClient'

export const membersApi = {
  list(params?: { search?: string; page?: number }) {
    return tenantClient.get('/members', { params })
  },
  store(data: Record<string, any>) {
    return tenantClient.post('/members', data)
  },
  storeFormData(data: FormData) {
    return tenantClient.post('/members', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  show(id: number) {
    return tenantClient.get(`/members/${id}`)
  },
  update(id: number, data: Record<string, any>) {
    return tenantClient.put(`/members/${id}`, data)
  },
  destroy(id: number) {
    return tenantClient.delete(`/members/${id}`)
  },
}
