import { tenantClient } from '@/tenant/apis/tenantClient'

export const fixedDepositsApi = {
  list(params?: { search?: string; status?: string; page?: number }) {
    return tenantClient.get('/savings/fixed-deposits', { params })
  },
  postInterest() {
    return tenantClient.post('/savings/fixed-deposits/post-interest')
  },
}
