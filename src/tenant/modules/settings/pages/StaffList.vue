<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Users, Plus, Trash2, Edit, ChevronLeft, Eye, ShieldCheck, UserCog } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staffStore'

import { toast } from 'vue-sonner'
import { List } from '@/tenant/modules/staff/index.ts'
import type { Staff } from '@/tenant/apis/staff/api'
import { branchesApi } from '@/tenant/apis/branches/branchesApi'
import type { Branch } from '@/tenant/apis/branches/branchesApi'

const staffStore = useStaffStore()

const isDrawerOpen = ref(false)
const isEditing = ref(false)
const currentStaffId = ref<number | null>(null)
const branches = ref<Branch[]>([])

const formData = ref({
    name: '',
    email: '',
    role: 'Staff',
    password: '',
    status: 'active' as 'active' | 'inactive',
    is_tenant_admin: false,
    branch_id: null as number | null,
})

onMounted(async () => {
    await staffStore.fetchStaffList()
    try {
        const res = await branchesApi.list()
        branches.value = (res.data?.data ?? []).filter((b: Branch) => b.is_active)
    } catch {}
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
        is_tenant_admin: false,
        branch_id: null,
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
        is_tenant_admin: staff.is_tenant_admin || false,
        branch_id: staff.branch_id ?? null,
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
        <!-- <div class="flex items-center my-2 pt-2 ">
            <RouterLink to="/tenant/settings/members"
                class="mr-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition">
                <ChevronLeft class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </RouterLink>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <UserCog class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div class="flex-1">
                --
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Staff Management
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage SACCO staff accounts and track
                    their onboarding performance</p>
            </div>

        </div> -->
        <List>

        </List>


                <div class="flex-1 overflow-y-auto px-3 py-6 space-y-5">
                    <div class="space-y-1.5">
                        <Label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</Label>
                        <input type="text" v-model="formData.name" class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow" placeholder="e.g. John Doe" />
                    </div>

                    <div class="space-y-1.5">
                        <Label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Address</Label>
                        <input type="email" v-model="formData.email" class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow" placeholder="john@sacco.com" />
                    </div>

                    <div class="space-y-1.5">
                        <Label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password <span v-if="isEditing" class="text-xs text-neutral-400 font-normal">(Leave blank to keep current)</span></Label>
                        <input type="password" v-model="formData.password" class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow" placeholder="••••••••" />
                    </div>

                    <div class="space-y-1.5">
                        <Label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Role</Label>
                        <select v-model="formData.role" class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow">
                            <option value="Staff">Regular Staff</option>
                            <option value="Manager">Manager</option>
                            <option value="Teller">Teller</option>
                        </select>
                    </div>

                    <div class="space-y-1.5">
                        <Label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Branch</Label>
                        <select v-model="formData.branch_id" class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-nfuko-primary focus:outline-none focus:ring-1 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                            <option :value="null">— No Branch —</option>
                            <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                        </select>
                    </div>

                    <div class="space-y-1.5">
                        <Label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Account Status</Label>
                        <select v-model="formData.status" class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:border-bg-nfuko-yellow dark:focus:ring-bg-nfuko-yellow">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div class="flex items-start space-x-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 mt-4">
                        <input id="is-tenant-admin" type="checkbox" v-model="formData.is_tenant_admin" class="mt-1 h-4 w-4 rounded border-neutral-300 accent-[ bg-nfuko-primary] cursor-pointer" />
                        <div class="grid gap-1.5 leading-none">
                            <Label for="is-tenant-admin" class="text-sm font-semibold leading-none text-neutral-900 dark:text-white cursor-pointer">
                                System Administrator
                            </Label>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Grants this user full override permissions within this tenant workspace.
                            </p>
                        </div>
                    </div>
                </div>

                <SheetFooter class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/20 flex flex-row justify-between gap-3">
                    <SheetClose as-child>
                        <Button variant="outline" class="rounded-xl px-6">Cancel</Button>
                    </SheetClose>
                    <Button type="button" @click="saveStaff" :disabled="staffStore.isLoading" class="rounded-xl px-6 bg-[#3ab88a] hover:bg-[#32a87e] text-white shadow-sm flex items-center justify-center min-w-[120px]">
                        <span v-if="staffStore.isLoading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                        <span v-else>{{ isEditing ? 'Save Changes' : 'Create Staff' }}</span>
                    </Button>
                </SheetFooter>
            <!-- </SheetContent>
        </Sheet> -->
    </div>
</template>
