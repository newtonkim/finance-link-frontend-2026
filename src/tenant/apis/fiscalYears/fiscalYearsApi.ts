import { tenantClient } from '@/tenant/apis/tenantClient'

export const fiscalYearsApi = {
  list(params?: { search?: string; page?: number }) {
    return tenantClient.get('/financial-years', { params })
  },
  show(id: number) {
    return tenantClient.get(`/financial-years/${id}`)
  },
  store(data: Record<string, any>) {
    return tenantClient.post('/financial-years', data)
  },
  update(id: number, data: Record<string, any>) {
    return tenantClient.put(`/financial-years/${id}`, data)
  },
  destroy(id: number) {
    return tenantClient.delete(`/financial-years/${id}`)
  },
}
