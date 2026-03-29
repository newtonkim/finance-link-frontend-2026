<template>
    <TableDrawer :drawerWidth="drawerTitle?.width" :url="tableUrl" state="transferList"
        :drawerTitle="drawerTitle?.title" " :columns="columns" @save="saveUser">
        <template #header-action>
            <PainPageHeader title="Transfer Savings Account" dec="Manage all transfers savings accounts ." />
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
    drawerTitle = ref('Create Tenant'),
    filters = ["All", "rejected", "pending", "approved", "cancelled", "completed", "failed",],
    tableUrl = computed(() => `/savings-transfer/list?status=${statusFilter.value}`),
    title: Record<string, string> = {
        "view": { title: "View Savings Transfer Details", width: "w-1/2" },
        "add": { title: "Create a peer to peer transfer", width: "w-3/4" },
    }
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
const columns = [
    { key: 'code', label: 'transfer code', sticky: 'left', width: '14em', copy: true },
    { key: 'member_name', label: 'Member', sticky: 'left', width: '14em ', },
    { key: 'transfer_from_product', label: 'transfer from', sticky: 'left', width: '14em ', },
    { key: 'transfer_to_product', label: 'transfer to', sticky: 'left', width: '14em ', },
    { key: 'transfer_amount', label: 'transfer', type: "money" },
    { key: 'account_balance', label: 'balance', type: "money" },
    { key: 'status', label: 'status', type: 'status' },
    { key: 'created_at', label: 'created at', type: 'date' },
    { key: 'actions', label: 'Actions', show: ['view', 'delete'] }
]
</script>