import { tenantClient } from '@/tenant/apis/tenantClient'

export const chartOfAccountsApi = {
  list(params?: { search?: string; page?: number }) {
    return tenantClient.get('/chart-of-accounts', { params })
  },
  store(data: Record<string, any>) {
    return tenantClient.post('/chart-of-accounts', data)
  },
  update(id: number, data: Record<string, any>) {
    return tenantClient.put(`/chart-of-accounts/${id}`, data)
  },
  destroy(id: number) {
    return tenantClient.delete(`/chart-of-accounts/${id}`)
  },
}
