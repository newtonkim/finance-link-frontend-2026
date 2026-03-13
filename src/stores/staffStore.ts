import { defineStore } from 'pinia'
import { ref } from 'vue'
import { staffApi, type Staff } from '@/tenant/apis/staff/api'
import { toast } from 'vue-sonner'

export const useStaffStore = defineStore('staff', () => {
    const staffList = ref<Staff[]>([])
    const currentStaff = ref<Staff | null>(null)
    const referredMembers = ref<any[]>([])
    const isLoading = ref(false)
    const isDrawerOpen = ref(false)

    async function fetchStaffList(search?: string) {
        isLoading.value = true
        try {
            const { data } = await staffApi.list({ search })
            staffList.value = data.data || data
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch staff list')
        } finally {
            isLoading.value = false
        }
    }

    async function fetchStaffDetails(id: number) {
        isLoading.value = true
        try {
            const { data } = await staffApi.get(id)
            currentStaff.value = data.data || data
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch staff details')
        } finally {
            isLoading.value = false
        }
    }

    async function fetchReferredMembers(id: number) {
        isLoading.value = true
        try {
            const { data } = await staffApi.getReferredMembers(id)
            referredMembers.value = data.data || data
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch referred members')
        } finally {
            isLoading.value = false
        }
    }

    async function createStaff(staffData: Staff) {
        isLoading.value = true
        try {
            const { data } = await staffApi.create(staffData)
            toast.success('Staff member created successfully')
            isDrawerOpen.value = false
            await fetchStaffList()
            return data
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create staff')
            throw error
        } finally {
            isLoading.value = false
        }
    }

    async function updateStaff(id: number, staffData: Partial<Staff>) {
        isLoading.value = true
        try {
            const { data } = await staffApi.update(id, staffData)
            toast.success('Staff member updated successfully')
            isDrawerOpen.value = false
            if (currentStaff.value?.id === id) {
                currentStaff.value = data.data || data
            }
            await fetchStaffList()
            return data
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update staff')
            throw error
        } finally {
            isLoading.value = false
        }
    }

    async function deleteStaff(id: number) {
        isLoading.value = true
        try {
            await staffApi.delete(id)
            toast.success('Staff member removed successfully')
            await fetchStaffList()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to remove staff')
            throw error
        } finally {
            isLoading.value = false
        }
    }

    return {
        staffList,
        currentStaff,
        referredMembers,
        isLoading,
        isDrawerOpen,
        fetchStaffList,
        fetchStaffDetails,
        fetchReferredMembers,
        createStaff,
        updateStaff,
        deleteStaff
    }
})
