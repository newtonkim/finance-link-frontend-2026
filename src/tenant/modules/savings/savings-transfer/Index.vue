<template>
    <TableDrawer :drawerWidth="drawerTitle?.width" :url="tableUrl" state="transferList"
        :drawerTitle="drawerTitle?.title" :columns="columns" @save="saveUser">
        <template #code="{ item }">
            <div class=" items-center gap-2">
                <CopyData :show="item.code" />
                <div class="flex items-center justify-between">
                    <div :class="statusMap[item.status]?.className" class="text-[11px] uppercase tracking-wide">{{
                        item.status }}</div>
                    <div v-if="item.count > 1"
                        class="mx-10 bg-nfuko-primary text-white text-[10px] font-bold px-0 py-0.5 rounded-full min-w-[20px] text-center mx-2 "
                        title=" contains more transaction in it">
                        {{ item.count }}
                    </div>
                </div>
            </div>
        </template>
        <template #header-action>
            <PainPageHeader title="Transfer Savings Account" dec="Manage all transfers savings accounts ." />
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <Details v-if="['view'].includes(action)" :data="data" />
            <!-- <Create v-if="['add', 'edit','',' '].includes(action)" :data="{ ...data, action }" v-model:form="formData" /> -->
            <Create ref="createComponent" v-else :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Create, Details } from '.'
import { TableDrawer, StatusButtonsHorizontal, PainPageHeader, CopyData, statusMap } from '@/Global'
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    createComponent = ref(''),
    drawerTitle = ref('Create Tenant'),
    filters = ["All", "rejected", "pending", "approved", "cancelled", "completed", "failed",],
    tableUrl = computed(() => `/savings-transfer/list?status=${statusFilter.value}`),
    title: Record<string, string> = {
        "view": { title: "View Savings Transfer Details", width: "w-2/3" },
        "add": { title: "Create a peer to peer transfer", width: "w-3/4" },
    }
function saveUser(type: string, data: any) {
    if (title?.[type])
        drawerTitle.value = title?.[type]
}

const columns = [
    { key: 'code', label: 'transfer code', sticky: 'left', width: '14em', copy: true },
    { key: 'member_name', label: 'Member', width: '14em ', },
    // { key: 'status', label: 'status', type: 'status' },
    { key: 'transfer_from_product', label: 'transfer from', width: '14em ', },
    { key: 'transfer_to_product', label: 'transfer to', width: '14em ', },
    { key: 'transfer_amount', label: 'transfer', type: "money" },
    { key: 'account_balance', label: 'balance', type: "money" },
    { key: 'created_at', label: 'created at', type: 'date' },
    { key: 'actions', label: 'Actions', show: ['view', 'delete'] }
]
</script>