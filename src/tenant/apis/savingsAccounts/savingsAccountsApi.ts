import { tenantClient } from '@/tenant/apis/tenantClient'

export const savingsAccountsApi = {
  list(params?: { search?: string; status?: string; page?: number; member_id?: number }) {
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
  postRegularInterest() {
    return tenantClient.post('/savings/regular-interest/post-interest')
  },
  // Fixed deposit endpoints
  interestPostings(id: number) {
    return tenantClient.get(`/savings-accounts/${id}/interest-postings`)
  },
  processMaturity(id: number, data: { action: 'rollover' | 'convert' | 'close' }) {
    return tenantClient.post(`/savings-accounts/${id}/maturity/process`, data)
  },
}
