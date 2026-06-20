import { apiClient } from '@/central/api/client'
import { notify } from '@/Global/Toasters/ToastMsg'

export interface CentralProfile {
  id: number | string
  staff_fall_name: string | null
  staff_email: string | null
  system_role: string | null
  status: string | null
  avatar: string | null
  avatar_url: string | null
  email_verified_time: string | null
  created_at: string | null
}

export interface CentralProfileUpdate {
  staff_fall_name?: string
  staff_email?: string
  system_role?: string
  password?: string
  avatar?: File | null
}

export function centralProfileApi() {
  /** Fetch the logged-in central user's profile. */
  async function getProfile(): Promise<CentralProfile | null> {
    const res = await apiClient.get('/central/profile')
    return res.data?.payload ?? null
  }

  /** Update the logged-in central user's profile (multipart for avatar). */
  async function updateProfile(data: CentralProfileUpdate): Promise<CentralProfile | null> {
    const fd = new FormData()
    if (data.staff_fall_name !== undefined) fd.append('staff_fall_name', data.staff_fall_name ?? '')
    if (data.staff_email !== undefined) fd.append('staff_email', data.staff_email ?? '')
    if (data.system_role !== undefined) fd.append('system_role', data.system_role ?? '')
    if (data.password) fd.append('password', data.password)
    if (data.avatar) fd.append('avatar', data.avatar)

    try {
      const res = await apiClient.post('/central/profile/update', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      notify({ msg: res.data?.msg ?? 'Profile updated successfully', type: 'success' })
      return res.data?.payload ?? null
    } catch (e: any) {
      notify({ msg: e?.response?.data?.message ?? 'Failed to update profile', type: 'error' })
      throw e
    }
  }

  /** Delete (soft) the logged-in central user's own account. */
  async function deleteProfile(): Promise<{ redirect_url?: string } | null> {
    try {
      const res = await apiClient.post('/central/profile/delete')
      notify({ msg: res.data?.msg ?? 'Account deleted', type: 'success' })
      return res.data?.payload ?? null
    } catch (e: any) {
      notify({ msg: e?.response?.data?.message ?? 'Failed to delete account', type: 'error' })
      throw e
    }
  }

  return { getProfile, updateProfile, deleteProfile }
}
