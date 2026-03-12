<template>
    <TableDrawer drawerWidth=" sm:w-full xs:w-full md:w-1/2 lg:w-1/2" :url="tableUrl" state="Licesnes"
        :drawerTitle="drawerTitle" " :columns="columns" @save="saveUser">
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
import { TableDrawer, StatusButtonsHorizontal } from '@/Global'
import { lisenseApi } from '../apis'
import Show from './Show.vue'
const formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref('Create Tenant')
const filters = ['all', 'active', 'suspended', 'expired', 'trial']
const { create, Erase } = lisenseApi()
const tableUrl = computed(() => `/central/licenses/list?status=${statusFilter.value}`)

const triggerAction: Record<string, Function> = {
    delete: Erase,
    async create() {
        await create(formData.value)
        formData.value = {}
    }
}
const title: Record<string, string> = {
    "view": "View Liceses",
    "edit": "Edit Liceses",
    "add": "Create Liceses",
}
function saveUser(type: string, data: any) {
    triggerAction[type]?.(data)
    if (title?.[type])
        drawerTitle.value = title?.[type]
}
const columns = [
    { key: 'tenant_name', label: 'Tenant', sticky: 'left',width: '0', },
    { key: 'starts', label: 'Starts', },
    { key: 'expires', label: 'Expires' },
    { key: 'grace_ends', label: 'grace ends' },
    { key: 'plan', label: 'Plan', sticky: 'left',  },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'actions', label: 'Actions', show: ['view','edit', 'delete'] }
]
</script>