import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { staffApi, type Staff } from '@/tenant/apis/staff/api'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import { useAuthStore } from './auth'
import { useTenantUserStore } from './tenantUserStore'
import { getLocalValues, getSubdomainName } from '@/Global'
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

  function hasPermission(name: string): boolean {
    return permissions.value.includes(name)
  }

  const combinedProfile = computed(() => {
    const authUser = authStore.user
    const tenantUser = tenantUserStore.user
    const details = staffDetails.value

    return {
      id: details?.id || tenantUser?.id || authUser?.id,
      name: details?.name || tenantUser?.name || authUser?.name || 'User',
      email: details?.email || tenantUser?.email || authUser?.email || '',
      role: details?.role || (authUser as any)?.role || 'Administrator',
      avatar: details?.avatar || tenantUser?.avatar || authUser?.avatar || null,
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

  // Guard to prevent duplicate concurrent fetches
  let _fetchPromise: Promise<void> | null = null

  async function fetchFullProfile(force = false) {
    // If already fetched and not forced, skip
    if (!force && staffDetails.value && !isLoading.value) return
    // If a fetch is already in flight, return the same promise
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = _doFetchFullProfile()
    try {
      await _fetchPromise
    } finally {
      _fetchPromise = null
    }
  }

  async function _doFetchFullProfile() {
    isLoading.value = true

    const storedPerms = getLocalValues('userPermissions')
    if (storedPerms?.data) {
      permissions.value = storedPerms.data.map((p: any) => p.name || p)
    }

    const userId = tenantUserStore.user?.id || authStore.user?.id

    // Only fetch tenant staff details when on a tenant page — the staff API
    // requires an active tenant DB connection which is unavailable on central routes.
    if (userId && getSubdomainName()) {
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
      const { avatar_url } = data as any
      if (tenantUserStore.user) {
        tenantUserStore.user.avatar = avatar_url
      }
      if (authStore.user) {
        authStore.user.avatar = avatar_url
        // Update local storage to persist the avatar change
        const storedUser = localStorage.getItem('auth_user')
        if (storedUser) {
          const userObj = JSON.parse(storedUser)
          userObj.avatar = avatar_url
          localStorage.setItem('auth_user', JSON.stringify(userObj))
        }
      }
      if (staffDetails.value) {
        (staffDetails.value as any).avatar = avatar_url
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

  function clear() {
    staffDetails.value = null
    permissions.value = []
    branchName.value = null
  }

  return {
    staffDetails,
    permissions,
    hasPermission,
    isLoading,
    isUpdating,
    isUploadingAvatar,
    branchName,
    combinedProfile,
    fetchFullProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    clear,
  }
})
