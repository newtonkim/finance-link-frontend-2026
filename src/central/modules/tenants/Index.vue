<template>
    <TableDrawer drawerWidth="w-1/2" :drawerShowFooter="Store.showSaveButton" :url="tableUrl" state="staff"
        :drawerTitle="drawerTitle" title="Tenants" :columns="columns" @save="saveUser">
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
import { tenantsApi } from '../apis'
import { pomPinia } from 'septor-store'
import Show from './Show.vue'
const Store = pomPinia()
const formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref('Create Tenant')
const filters = ['all', 'active', 'suspended', 'trial']
const { create, Erase } = tenantsApi()
const tableUrl = computed(() => `/central/tenants/list?status=${statusFilter.value}`)
const triggerAction: Record<string, Function> = {
    delete: Erase,
    async create() {
        await create(formData.value)
        formData.value = {}
    }
}
const title: Record<string, string> = {
    "view": "View Tenant",
    "edit": "Edit Tenant",
    "add": "Create Tenant",
}
function saveUser(type: string, data: any) {
    triggerAction[type]?.(data)
    console.log(type);
    if (title?.[type])
        drawerTitle.value = title?.[type]

}
const columns = [
    { key: 'sacco_name', label: 'Sacco Name', width: '150', sticky: 'left' },
    { key: 'sacco_domain', label: 'Sacco Domain' },
    { key: 'host_domain', label: 'Host Name',width: '200', },
    { key: 'storage', label: 'Database' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'created_at', label: 'Created Date', type: 'dateTime' ,width: '200',},
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>