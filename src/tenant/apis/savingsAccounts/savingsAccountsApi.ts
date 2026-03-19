import { tenantClient } from '@/tenant/apis/tenantClient'

export const savingsAccountsApi = {
  list(params?: { search?: string; status?: string; page?: number }) {
    return tenantClient.get('/savings-accounts', { params })
  },
  show(id: number) {
    return tenantClient.get(`/savings-accounts/${id}`)
  },
  store(data: Record<string, any>) {
    return tenantClient.post('/savings-accounts', data)
  },
  update(id: number, data: Record<string, any>) {
    return tenantClient.put(`/savings-accounts/${id}`, data)
  },
  destroy(id: number) {
    return tenantClient.delete(`/savings-accounts/${id}`)
  },
  deposit(id: number, data: Record<string, any>) {
    return tenantClient.post(`/savings-accounts/${id}/deposit`, data)
  },
  withdraw(id: number, data: Record<string, any>) {
    return tenantClient.post(`/savings-accounts/${id}/withdraw`, data)
  },
  charge(id: number, data: Record<string, any>) {
    return tenantClient.post(`/savings-accounts/${id}/charge`, data)
  },
}
