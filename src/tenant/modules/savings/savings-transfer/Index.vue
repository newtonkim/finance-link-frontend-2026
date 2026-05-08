<template>
    <TableDrawer ref="drawer" :drawerWidth="drawerTitle?.width" :url="tableUrl" state="transferList"
        :drawerTitle="drawerTitle?.title" :columns="columns" @save="saveUser">
            <template #member_name="{ item }">
            <span>
                <Button @click="navigateToProfile(item)"
                    class="flex items-center gap-2 font-semibold text-nfuko-action text-sm dark:text-white">
                    <span>{{ item?.member_name }}</span>
                </Button>
            </span>
        </template>
        <template #code="{ item }"  >
            <div class=" items-center gap-1 font-semibold text-nfuko-action text-sm dark:text-white" >
                <CopyData :show="item.code" />
                <div class="flex items-center justify-between" @click="navigateToProfileFulldetailes(item)">
                    <div :class="(statusMap as any)[item.status]?.className" class="text-[10px]  tracking-wide " >{{
                        item.status }}</div>
                    <div v-if="item.count > 1"
                        class="mx-10 bg-nfuko-primary text-white text-[9px] font-bold  rounded-full min-w-[20px] text-center "
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
            <Details v-if="['view'].includes(action)" :data="data" @actionTaken="() => refresh()" />
            <Create v-else :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Create, Details } from '.'
import {  setLocalValues, statusMap } from '@/Global'

import { useRouter } from 'vue-router';

const router = useRouter()
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    drawer = ref<any>(null),
    drawerTitle = ref<any>({ title: 'Create Transfer', width: 'w-1/2' }),
    filters = ["All", "rejected", "pending", "approved", "cancelled", "completed", "failed",],
    tableUrl = computed(() => `/savings-transfer/list?status=${statusFilter.value}`),
    title: Record<string, any> = {
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
    { key: 'transfer_from_product', label: 'transfer from', width: '14em ', },
    { key: 'transfer_to_product', label: 'transfer to', width: '14em ', },
    { key: 'transfer_amount', label: 'transfer', type: "money" },
    { key: 'account_balance', label: 'balance', type: "money" },
    { key: 'created_at', label: 'created at', type: 'date' , width: '10em',},
    { key: 'actions', label: 'Actions', show: ['view', 'delete'] }
]

function refresh() {
    drawer.value?.toggleDrawer()
    setTimeout(() => {
        drawer.value?.toggleDrawer()
    }, 300)
}
function navigateToProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', {...item,id: item?.member_id})
}
function navigateToProfileFulldetailes(item: any) {
    router.push(`/tenant/savings-transfer-details`)
    setLocalValues('transaferDetails', {...item})
}
</script>