<template>

    <TableDrawer :permissions="{
        create: 'staff-create',
        delete: 'staff-delete',
        view: 'staff-view-table-details',
        edit: 'staff-update',
    }" 
    
    drawerWidth="w-1/2" :url="tableUrl" state="staff" :drawerTitle="drawerTitle" title="Central Staff"
        :columns="columns" @save="saveUser">
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <StaffForm v-if="['add', 'edit'].includes(action)" :watcher="{ action, data }" v-model:form="formData" />
            <Show v-if="['view'].includes(action)" :data="data" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import StaffForm from './Create.vue'
import { StatusButtonsHorizontal, TableDrawer } from '@/Global'
import { staffsApi } from '../apis'
import Show from './Show.vue'
const formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref('Create staff')
const filters = ['all', 'active', 'suspended', 'trial']
const { create } = staffsApi()
const tableUrl = computed(() => `/central/staff/list?status=${statusFilter.value}`)
const triggerAction: Record<string, Function> = {
    // delete: Erase,
    async create() {
        await create(formData.value)
        formData.value = {}
    }
}
const title: Record<string, string> = {
    "view": "staff Details",
    "edit": "Edit staff",
    "add": "Create staff",
}
function saveUser(type: string, data: any) {
    triggerAction[type]?.(data)
    console.log(type, data);
    if (title?.[type])
        drawerTitle.value = title?.[type]
}

const columns = [
    { key: 'staff_fall_name', label: 'Name', sticky: 'left' },
    { key: 'staff_email', label: 'Email' },
    { key: 'system_role', label: 'Role' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'created_at', label: 'Created Date', type: 'date', },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
</script>
