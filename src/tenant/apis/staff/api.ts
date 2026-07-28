import { tenantClient } from '../tenantClient'

export interface Staff {
  id?: number
  name: string
  email: string
  role: string
  role_id?: number | null
  password?: string
  status: 'active' | 'inactive'
  is_tenant_admin?: boolean
  is_loan_officer?: boolean
  branch_id?: number | null
  can_vote_on_loans?: boolean
  can_manage_branch?: boolean
  can_finalise_loan?: boolean
  avatar?: string | null
  created_at?: string
  updated_at?: string
}

export const staffApi = {
  list(params?: { search?: string }) {
    return tenantClient.get('/staff', { params })
  },
  get(id: number) {
    return tenantClient.get(`/staff/${id}`)
  },
  create(data: Staff) {
    return tenantClient.post('/staff', data)
  },
  update(id: number, data: Partial<Staff>) {
    return tenantClient.put(`/staff/${id}`, data)
  },
  delete(id: number) {
    return tenantClient.delete(`/staff/${id}`)
  },
  getReferredMembers(id: number) {
    return tenantClient.get(`/staff/${id}/referred-members`)
  },
  uploadAvatar(id: number, file: File) {
    const form = new FormData()
    form.append('avatar', file)
    return tenantClient.post(`/staff/${id}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
