<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Users, Plus, Trash2, Edit, ChevronLeft, Eye, ShieldCheck, UserCog } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staffStore'

import { toast } from 'vue-sonner'
import { List } from '@/tenant/modules/staff/index.ts'
import type { Staff } from '@/tenant/apis/staff/api'

const staffStore = useStaffStore()

const isDrawerOpen = ref(false)
const isEditing = ref(false)
const currentStaffId = ref<number | null>(null)

const formData = ref({
    name: '',
    email: '',
    role: 'Staff',
    password: '',
    status: 'active' as 'active' | 'inactive',
    is_tenant_admin: false
})

onMounted(async () => {
    await staffStore.fetchStaffList()
})

const openAddDrawer = () => {
    isEditing.value = false
    currentStaffId.value = null
    formData.value = {
        name: '',
        email: '',
        role: 'Staff',
        password: '',
        status: 'active',
        is_tenant_admin: false
    }
    isDrawerOpen.value = true
}

const openEditDrawer = (staff: Staff) => {
    isEditing.value = true
    currentStaffId.value = staff.id!
    formData.value = {
        name: staff.name,
        email: staff.email,
        role: staff.role,
        password: '', // leave empty for editing unless changing
        status: staff.status,
        is_tenant_admin: staff.is_tenant_admin || false
    }
    isDrawerOpen.value = true
}

const saveStaff = async () => {
    if (!formData.value.name || !formData.value.email) {
        toast.error('Name and Email are required.')
        return
    }
    if (!isEditing.value && !formData.value.password) {
        toast.error('Password is required for new staff.')
        return
    }

    try {
        if (isEditing.value && currentStaffId.value) {
            const dataToUpdate: Partial<Staff> = { ...formData.value }
            if (!dataToUpdate.password) {
                delete dataToUpdate.password
            }
            await staffStore.updateStaff(currentStaffId.value, dataToUpdate)
        } else {
            await staffStore.createStaff(formData.value as Staff)
        }
        isDrawerOpen.value = false
    } catch (e) {
        // Error handled in store
    }
}

const deleteStaff = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate or delete this staff member?')) return
    await staffStore.deleteStaff(id)
}
</script>

<template>
    <div class="  bg-[#f8faf9] dark:bg-[#0a0a0a] ">
        <div class="flex items-center my-2 pt-2 ">
            <RouterLink to="/tenant/settings/members"
                class="mr-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition">
                <ChevronLeft class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </RouterLink>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <UserCog class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div class="flex-1">
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Staff Management
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage SACCO staff accounts and track
                    their onboarding performance</p>
            </div>

        </div>
        <List>

        </List>


    </div>
</template>
