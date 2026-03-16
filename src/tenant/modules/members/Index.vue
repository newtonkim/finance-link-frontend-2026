<template>
    <TableDrawer drawerWidth=" w-2/3" :url="tableUrl" state="Licesnes"
        :drawerTitle="drawerTitle" " :columns="columns" @save="saveUser">
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
import {Create,Details} from '.'
import { TableDrawer, StatusButtonsHorizontal } from '@/Global'
import { lisenseApi } from '../apis' 
const formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref('Create Tenant')
const filters = ['all', 'active', 'suspended', 'expired', 'trial'] 
const tableUrl = computed(() => `/members/list?status=${statusFilter.value}`)
const triggerAction: Record<string, Function> = {
    delete:()=> {Erase(formData.value.id) },
    async create() {
        // await create(formData.value)
        // formData.value = {}
    }
}
const title: Record<string, string> = {
    "view": "View Liceses",
    "edit": "Edit Liceses",
    "add": "Create a sacco member",
}
function saveUser(type: string, data: any) {
    triggerAction[type]?.(data)
    if (title?.[type])
        drawerTitle.value = title?.[type]
}
const columns = [
    { key: 'Member', label: 'Member', sticky: 'left', width: '0', },
    { key: 'memember_name', label: 'Full Name', },
    { key: 'Phone', label: 'Phone' },
    { key: 'Email', label: 'Email' },
    { key: 'Gender', label: 'Gender', sticky: 'left', },
    { key: 'Status', label: 'Status', type: 'status' },
    { key: 'Joined', label: 'Joined', type: 'date' },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
</script>