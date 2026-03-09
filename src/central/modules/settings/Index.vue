<template>
    <TableDrawer drawerWidth="w-1/2" :drawerShowFooter="Store.showSaveButton" :url="tableUrl" state="staff"
        :drawerTitle="drawerTitle" title="Tenants" :columns="columns" @save="saveUser">
        <template #expiry="{ item }">
            <div v-if="item?.active_license?.expires_at" class="flex items-center gap-1.5">
                <Clock class="size-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                <div>
                    <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {{ daysLeft(item?.active_license?.expires_at) }}d left
                    </p>
                    <p class="text-xs text-neutral-400 dark:text-neutral-500">{{
                        formatDateUs(item?.active_license?.expires_at) }}</p>
                </div>
            </div>
            <span v-else class="text-sm  font-bold text-red-600/60">No active license</span>
        </template>
 
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
import { daysLeft, formatDateUs, StatusButtonsHorizontal, TableDrawer } from '@/Global'
import { Clock, ExternalLink, } from 'lucide-vue-next';
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
    { key: 'url', label: 'Sacco Domain', type: 'link' },
    { key: 'host_domain', label: 'Host Name', width: '100', },
    { key: 'storage', label: 'Database' },
    { key: 'expiry', label: 'license expiry', width: '150', },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'created_at', label: 'Created Date', type: 'dateTime', width: '200', },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]


</script>
