import { tenantClient } from '@/tenant/apis/tenantClient'

export interface Branch {
  id: number
  name: string
  code: string | null
  phone: string | null
  email: string | null
  address: string | null
  manager_name: string | null
  is_active: boolean
  created_at: string
}

export interface BranchForm {
  name: string
  code?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  manager_name?: string | null
  is_active?: boolean
}

export const branchesApi = {
  list() {
    return tenantClient.get<{ data: Branch[] }>('/branches')
  },
  store(data: BranchForm) {
    return tenantClient.post<{ message: string; data: Branch }>('/branches', data)
  },
  update(id: number, data: BranchForm) {
    return tenantClient.put<{ message: string; data: Branch }>(`/branches/${id}`, data)
  },
  destroy(id: number) {
    return tenantClient.delete<{ message: string }>(`/branches/${id}`)
  },
  toggleActive(id: number) {
    return tenantClient.patch<{ message: string; is_active: boolean }>(`/branches/${id}/toggle-active`)
  },
}
