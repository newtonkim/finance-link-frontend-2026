<template>
    <TableDrawer ref="tableRef" drawerWidth="w-1/2" :url="tableUrl" state="tanents_list" :drawerShowFooter="showFooter"
        :automaticCreate="false" :drawerTitle="drawerTitle" title="Tenants" :columns="columns" @save="saveUser">
        <template #expiry="{ item }: { item?: any }">
            <div v-if="item?.license_expires_at" class="flex items-center gap-1.5">
                <Clock class="size-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                <div>
                    <p :class="[
                        'text-sm font-medium',
                        daysLeft(item.license_expires_at) === 0 ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-300'
                    ]">
                        {{ daysLeft(item?.license_expires_at) }}d left
                    </p>
                    <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ formatDateUs(item?.license_expires_at)
                    }}</p>
                </div>
            </div>
            <span v-else class="text-sm  font-bold text-red-600/60 px-4">No license</span>
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <StaffForm v-if="['add', 'edit'].includes(action)" :watcher="{ action, data }" v-model:form="formData"
                @changedStep="changedStep" />
            <Show v-if="['view'].includes(action)" :data="data" />
        </template>
    </TableDrawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import StaffForm from './Create.vue'
import { daysLeft, formatDateUs, StatusButtonsHorizontal, TableDrawer } from '@/Global'
const tableRef = ref<InstanceType<typeof TableDrawer> | null>(null)
import { Clock } from 'lucide-vue-next';
import { tenantsApi } from '../apis'
import Show from './Show.vue'
import { pomPinia } from 'septor-store'
import { notify } from '@/Global/Toasters/ToastMsg'
import { formawtacher } from '@/Global/Forminputs/formWatcher'
const formData = ref<Record<string, any>>({})
const statusFilter = ref('all')
const drawerTitle = ref('Create Tenant')
const filters = ['all', 'active', 'suspended', 'trial']
const { create, Erase } = tenantsApi()
import { toast } from 'vue-sonner';

const Store = pomPinia()
const formStore = formawtacher()

const tableUrl = computed(() => `/central/tenants/list?status=${statusFilter.value}`)
const showFooter = ref(false)
const triggerAction: Record<string, Function> = {
    delete: Erase,
    async create() {
        formStore.setLoading(true)
        try {
            await create(formData.value)
            toast.success('Tenant created successfully.')
            formData.value = {}
            tableRef.value?.refresh()
            tableRef.value?.toggleDrawer()
        } catch (err: any) {
            const errors = err?.response?.data?.errors
            if (errors) {
                // Show each field's first validation message
                Object.values(errors).forEach((messages: any) => {
                    toast.error(messages[0])
                })
            } else {
                const message = err?.response?.data?.message ?? 'Failed to create tenant.'
                toast.error(message)
            }
        } finally {
            formStore.setLoading(false)
        }
    }
}
const title: Record<string, string> = {
    "view": "View Tenant",
    "edit": "Edit Tenant",
    "add": "Create Tenant",
}
function changedStep(vl) {
    
    showFooter.value = vl
    console.log(showFooter.value);

}
function saveUser(type: string, data: any) {
    triggerAction[type]?.(data)
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
