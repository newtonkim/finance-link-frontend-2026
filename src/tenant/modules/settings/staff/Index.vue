<template>
    <TableDrawer ref="staffTable" :permissions="{
        create: 'staff-create',
        view: 'staff-details',
        edit: 'staff-update',
        delete: 'staff-delete'
    }" drawerWidth=" w-2/4"
    :drawerShowFooter="false"
     :addButtonText="{ icon: UserPlus, text: 'Add Staff' }"
     :showAddButton="true" :url="tableUrl" state="staffList" :drawerTitle="drawerTitle"
        :showTableAction="false" :columns="columns" @save="saveUser">
        <template #header-action>
            <PainPageHeader title="Staff list"
                dec="Manage SACCO staff accounts and track their onboarding performance" />


        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <Edit
                v-if="['add', 'edit'].includes(action)"
                :data="{ ...data, action }"
                @cancel="closeDrawer"
                @saved="handleSaved"
            />
            <Details v-if="['view'].includes(action)" :data="data" />
        </template>
        <template #workflow_permissions="{ item }">
            <div class="flex flex-wrap gap-1.5">
                <span
                    v-for="permission in permissionTags(item)"
                    :key="permission"
                    class="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                    {{ permission }}
                </span>
                <span
                    v-if="permissionTags(item).length === 0"
                    class="text-xs text-neutral-400 dark:text-neutral-500"
                >
                    —
                </span>
            </div>
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserPlus } from 'lucide-vue-next'
import { Details, Edit } from '.'
import { TableDrawer, StatusButtonsHorizontal, PainPageHeader } from '@/Global'
const staffTable = ref<any>(null)
const statusFilter = ref('all'),
    drawerTitle = ref('Add Staff'), filters = ['active', 'inactive'],
    tableUrl = computed(() => `/staff/list?status=${statusFilter.value}`),
    title: Record<string, string> = {
        "view": "View  Details",
        "edit": "Edit staff",
        "add": "Create a sacco staff",
    }
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}

function closeDrawer() {
    if (staffTable.value?.drawerOpen) staffTable.value.toggleDrawer()
}

function handleSaved() {
    closeDrawer()
    staffTable.value?.refresh()
}

function permissionTags(item: any): string[] {
    const permissions: string[] = []
    const isEnabled = (value: unknown) => value === true || value === 1 || value === '1'
    if (isEnabled(item?.is_loan_officer)) permissions.push('Loan Officer')
    if (isEnabled(item?.can_vote_on_loans)) permissions.push('Vote')
    if (isEnabled(item?.can_manage_branch)) permissions.push('Manage Branch')
    if (isEnabled(item?.can_finalise_loan)) permissions.push('Finalise Loan')
    return permissions
}

const columns = [
    { key: 'code', label: 'code', copy: true },
    { key: 'staff_fall_name', label: 'Full Name', sticky: 'left', },
    { key: 'staff_email', label: 'Email Address' },
    { key: 'system_role', label: 'role', },
    { key: 'workflow_permissions', label: 'Permissions', width: '220px' },
    { key: 'status', label: 'status', type: 'status' },
    { key: 'created_at', label: 'created_at', },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
</script>
