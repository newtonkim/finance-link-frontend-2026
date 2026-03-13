<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Users, Plus, Trash2, Edit, ChevronLeft, Eye, ShieldCheck, UserCog } from 'lucide-vue-next'
import { useStaffStore } from '@/stores/staffStore'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
    Label,
    Button
} from '@/Global'
import { toast } from 'vue-sonner'
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
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <RouterLink to="/tenant/settings/members" class="mr-2 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition">
                <ChevronLeft class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </RouterLink>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <UserCog class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div class="flex-1">
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Staff Management</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage SACCO staff accounts and track their onboarding performance</p>
            </div>

            <button @click="openAddDrawer"
                class="flex items-center gap-2 rounded-lg  bg-nfuko-primary dark:bg-bg-nfuko-yellow px-4 py-2 text-sm font-medium text-white dark: text-nfuko-primary hover: bg-nfuko-primary/90 dark:hover:bg-bg-nfuko-yellow/90 transition-colors shadow-sm">
                <Plus class="h-4 w-4" />
                <span>Add Staff</span>
            </button>
        </div>

        <div class="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-neutral-500 dark:text-neutral-400">
                    <thead class="bg-neutral-50 text-xs uppercase text-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400">
                        <tr>
                            <th scope="col" class="px-6 py-4 font-semibold">Name</th>
                            <th scope="col" class="px-6 py-4 font-semibold">Email</th>
                            <th scope="col" class="px-6 py-4 font-semibold">Role</th>
                            <th scope="col" class="px-6 py-4 font-semibold text-center">Status</th>
                            <th scope="col" class="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="staffStore.isLoading && staffStore.staffList.length === 0">
                            <td colspan="5" class="px-6 py-8 text-center text-neutral-500">Loading staff...</td>
                        </tr>
                        <tr v-else-if="staffStore.staffList.length === 0">
                            <td colspan="5" class="px-6 py-8 text-center text-neutral-500">No staff accounts found.</td>
                        </tr>
                        <tr v-for="staff in staffStore.staffList" :key="staff.id" class="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50 transition-colors">
                            <td class="whitespace-nowrap px-6 py-4 font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                                <div class="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                    {{ staff.name.charAt(0).toUpperCase() }}
                                </div>
                                {{ staff.name }}
                                <ShieldCheck v-if="staff.is_tenant_admin" class="h-4 w-4 text-emerald-500 ml-1" title="Tenant Admin" />
                            </td>
                            <td class="whitespace-nowrap px-6 py-4">
                                {{ staff.email }}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4">
                                {{ staff.role }}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-center">
                                <span :class="[
                                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                    staff.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
                                ]">
                                    {{ staff.status }}
                                </span>
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <RouterLink :to="`/tenant/settings/staff/${staff.id}`" class="p-1.5 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View Profile & KPI">
                                        <Eye class="h-4 w-4" />
                                    </RouterLink>
                                    <button @click="openEditDrawer(staff)" class="p-1.5 text-neutral-500 hover: text-nfuko-primary dark:hover:text-bg-nfuko-yellow transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Edit Staff">
                                        <Edit class="h-4 w-4" />
                                    </button>
                                    <button @click="deleteStaff(staff.id!)" class="p-1.5 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Deactivate">
                                        <Trash2 class="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add/Edit Drawer -->
        <Sheet v-model:open="isDrawerOpen">
            <SheetContent side="right" class="w-[400px] sm:w-[540px] bg-white dark:bg-neutral-950 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col h-full p-0">
                <div class="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <SheetHeader>
                        <SheetTitle>{{ isEditing ? 'Edit Staff Account' : 'Add New Staff' }}</SheetTitle>
                        <SheetDescription>
                            {{ isEditing ? 'Update the details for this staff member.' : 'Create a new staff account.' }}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div class="flex-1 overflow-y-auto px-6 py-6 space-y-5">
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
            </SheetContent>
        </Sheet>
    </div>
</template>
