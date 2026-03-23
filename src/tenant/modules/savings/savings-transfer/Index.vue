<template>
    <TableDrawer :drawerWidth="drawerTitle?.width" :url="tableUrl" state="memberAccountList" :drawerTitle="drawerTitle?.title" " :columns="columns" @save="saveUser">
<template #header-action>
      <PainPageHeader  title="Transfer Savings Account" dec="Manage all transfers savings accounts ." />
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
import { TableDrawer, StatusButtonsHorizontal,PainPageHeader } from '@/Global'
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
 drawerTitle = ref('Create Tenant'), 
 filters = ["rejected","pending","approved","cancelled","completed","no-funds",], 
 tableUrl = computed(() => `/savings-transfer/list?status=${statusFilter.value}`), 
 title: Record<string, string> = {
    "view": {title:"Viewmember saving's Account Details",width:"w-1/2"}, 
    "add": {title:"Create a peer to peer transfer",width:"w-3/4"},
}
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
    // "id": 5,
    //                             "code": "STS-1774275320",
    //                             "transfer_amount": "123.00",
    //                             "status": "approved",
    //                             "created_at": "2026-03-23 17:15:20",
    //                             "account_balance": "323.00",
    //                             "transfer_to_product": "General Savings Account",
    //                             "member_name": "Mrs:Blaze Hawkins"
const columns = [
    { key: 'member_name', label: 'Member', sticky: 'left', width: '14em ', },
    { key: 'transfer_to_product', label: 'product', sticky: 'left', width: '14em ', },
    { key: 'transfer_amount', label: 'transfer',  },
    { key: 'account_balance', label: 'balance',  },
    { key: 'status', label: 'status',  type:'status' },
    { key: 'created_at', label: 'created at', type:'status' },
    { key: 'actions', label: 'Actions', show: ['view', 'delete'] }
]
</script>