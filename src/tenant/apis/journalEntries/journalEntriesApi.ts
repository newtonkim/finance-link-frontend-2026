import { tenantClient } from '@/tenant/apis/tenantClient'

export const journalEntriesApi = {
  list(params?: { search?: string; page?: number; per_page?: number; date_from?: string; date_to?: string }) {
    return tenantClient.get('/journal-entries', { params })
  },
  store(data: Record<string, any>) {
    return tenantClient.post('/journal-entries', data)
  },
  export(params?: { search?: string; date_from?: string; date_to?: string; format: 'csv' | 'pdf' }) {
    return tenantClient.get('/journal-entries/export', { params, responseType: 'blob' })
  }
}
