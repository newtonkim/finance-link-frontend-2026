<template>
    <TableDrawer :permissions="{
        // create: 'staff-create',
        // view: 'staff-details',
        // edit: 'staff-update',
        // delete: 'staff-delete'
    }" drawerWidth=" w-2/4" :url="tableUrl" state="staffList" :drawerTitle="drawerTitle" " :columns="columns"
        @save="saveUser">
        <template #header-action>
            <PainPageHeader title="Staff list" dec="Manage SACCO staff accounts and track their onboarding performance" />
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <Create v-if="['add', 'edit'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
            <Details v-if="['view'].includes(action)" :data="data" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Create, Details } from '.'
import { TableDrawer, StatusButtonsHorizontal, PainPageHeader } from '@/Global'
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    drawerTitle = ref('Create Tenant'), filters = ['active', 'pendding'],
    tableUrl = computed(() => `/staff/list?status=${statusFilter.value}`),
    title: Record<string, string> = {
        "view": "View  Details",
        "edit": "Edit staff",
        "add": "Create a sacco staff",
    }
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
const columns = [
    { key: 'staff_code', label: 'code', copy: true },
    { key: 'staff_fall_name', label: 'Member', sticky: 'left', },
    { key: 'staff_email', label: 'Member Type' },
    { key: 'system_role', label: 'role', },
    { key: 'status', label: 'status', type: 'status' },
    { key: 'created_at', label: 'created_at', },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
</script>