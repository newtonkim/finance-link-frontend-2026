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
  getMembers(id: number) {
    return tenantClient.get(`/savings-groups/${id}/members`)
  },
  addMember(id: number, data: any) {
    return tenantClient.post(`/savings-groups/${id}/members`, data)
  },
  removeMember(groupId: number, memberId: number) {
    return tenantClient.delete(`/savings-groups/${groupId}/members/${memberId}`)
  },
  exportUrl(id: number) {
    const baseURL = tenantClient.defaults.baseURL || ''
    return `${baseURL}/savings-groups/${id}/export`
  }
}
