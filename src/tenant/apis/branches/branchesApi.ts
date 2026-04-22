import { tenantClient } from '@/tenant/apis/tenantClient'
import { getLocalValues, keysToUse } from '@/Global/Helpers'

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

export interface BranchWithDefault {
  branches: Branch[]
  default_branch_id: number | null
}

export const branchesApi = {
  list() {
    return tenantClient.get<{ data: Branch[] }>('/branches')
  },
  async listWithDefault(): Promise<any> {
    const activeBranch = getLocalValues(keysToUse.activeBranch as any)
    const res = await tenantClient.get<{ data: BranchWithDefault }>('/branches', {
      params: { include_default: true, default_branch_id: activeBranch },
    })
    return res.data
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
    return tenantClient.patch<{ message: string; is_active: boolean }>(
      `/branches/${id}/toggle-active`,
    )
  },
}
