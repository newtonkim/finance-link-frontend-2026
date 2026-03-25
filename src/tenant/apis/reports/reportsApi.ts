import { tenantClient } from '@/tenant/apis/tenantClient'

export interface ReportFilters {
  branch_id?: number | null
  staff_id?: number | null
  date_from?: string | null
  date_to?: string | null
}

export interface FilterOptions {
  show_branch_filter: boolean
  branches: { id: number; name: string; code: string }[]
  staff: { id: number; name: string; email: string; branch_id: number | null; status: string }[]
}

export const reportsApi = {
  index(params?: ReportFilters) {
    return tenantClient.get('/reports', { params })
  },
  filterOptions() {
    return tenantClient.get('/reports/filter-options')
  },
}
