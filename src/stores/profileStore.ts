import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { staffApi, type Staff } from '@/tenant/apis/staff/api'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import { useAuthStore } from './auth'
import { useTenantUserStore } from './tenantUserStore'
import { getLocalValues } from '@/Global'
import { toast } from 'vue-sonner'

export const useProfileStore = defineStore('profile', () => {
  const authStore = useAuthStore()
  const tenantUserStore = useTenantUserStore()

  const staffDetails = ref<Staff | null>(null)
  const permissions = ref<string[]>([])
  const isLoading = ref(false)
  const isUpdating = ref(false)
  const isUploadingAvatar = ref(false)
  const branchName = ref<string | null>(null)

  const combinedProfile = computed(() => {
    const authUser = authStore.user
    const tenantUser = tenantUserStore.user
    const details = staffDetails.value

    return {
      id: details?.id || tenantUser?.id || authUser?.id,
      name: details?.name || tenantUser?.name || authUser?.name || 'User',
      email: details?.email || tenantUser?.email || authUser?.email || '',
      role: details?.role || (authUser as any)?.role || 'Administrator',
      avatar: tenantUser?.avatar || null,
      status: details?.status || 'active',
      is_tenant_admin: details?.is_tenant_admin || false,
      branch_id: details?.branch_id || null,
      permissions: permissions.value,
      staff_data: details,
    }
  })

  async function resolveBranchName(branchId: number | null) {
    if (!branchId) return
    try {
      const { data } = await branchesApi.list()
      const branches: any[] = (data as any).data || data
      const match = branches.find((b: any) => b.id === branchId)
      branchName.value = match?.name || null
    } catch {
      branchName.value = null
    }
  }

  async function fetchFullProfile() {
    isLoading.value = true

    const storedPerms = getLocalValues('userPermissions')
    if (storedPerms?.data) {
      permissions.value = storedPerms.data.map((p: any) => p.name || p)
    }

    const userId = tenantUserStore.user?.id || authStore.user?.id

    if (userId) {
      try {
        const { data } = await staffApi.get(userId)
        staffDetails.value = data.data || data
        await resolveBranchName(staffDetails.value?.branch_id ?? null)
      } catch (error: any) {
        console.error('Failed to fetch staff details:', error)
      }
    }

    isLoading.value = false
  }

  async function updateProfile(data: Partial<Staff>) {
    const id = staffDetails.value?.id
    if (!id) throw new Error('No staff ID')
    isUpdating.value = true
    try {
      await staffApi.update(id, data)
      staffDetails.value = { ...staffDetails.value!, ...data }
    } finally {
      isUpdating.value = false
    }
  }

  async function uploadAvatar(file: File) {
    const id = staffDetails.value?.id
    if (!id) throw new Error('No staff ID')
    isUploadingAvatar.value = true
    try {
      const { data } = await staffApi.uploadAvatar(id, file)
      if (tenantUserStore.user) {
        tenantUserStore.user.avatar = (data as any).avatar_url
      }
    } finally {
      isUploadingAvatar.value = false
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const id = staffDetails.value?.id
    if (!id) throw new Error('No staff ID')
    await staffApi.update(id, { password: newPassword })
  }

  return {
    staffDetails,
    permissions,
    isLoading,
    isUpdating,
    isUploadingAvatar,
    branchName,
    combinedProfile,
    fetchFullProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
  }
})
