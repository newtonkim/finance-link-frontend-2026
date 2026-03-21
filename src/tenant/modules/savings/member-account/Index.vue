<template>
    <TableDrawer :drawerWidth="drawerTitle?.width" :url="tableUrl" state="memberAccountList" :drawerTitle="drawerTitle?.title" " :columns="
        columns" @save="saveUser">
        <template #member_name="{item}">
       <div class="px-1 py-4">
       <div class="font-semibold text-nfuko-action text-sm dark:text-white">
       {{item.member_name}}
       </div>
       <div class="font-semibold text-nfuko-black dark:text-white">
       {{item.account_code}}
       </div>
       <div class="text-[11px] uppercase tracking-wide ">
       {{item.type}}
       </div>
       </div>
        </template>
<template #header-action>
<div><h1 class="text-2xl font-bold text-neutral-900 dark:text-white my-3">
Members Savings Account</h1>
<p class="text-sm text-neutral-500 dark:text-neutral-400 ">Manage all member savings accounts and their balances.</p></div>
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
import { TableDrawer, StatusButtonsHorizontal } from '@/Global'
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
 drawerTitle = ref('Create Tenant'), filters = ['all', 'active', 'suspended', 'expired', 'trial'], 
 tableUrl = computed(() => `/members-account/list?status=${statusFilter.value}`), 
 title: Record<string, string> = {
    "view": {title:"Viewmember saving's Account Details",width:"w-1/2"},
    "edit":{title: "Edit member saving's Account",width:"w-1/3"},
    "add": {title:"Create a member saving's Account",width:"w-1/3"},
}
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}

const columns = [
    { key: 'member_name', label: 'Member', sticky: 'left', width: '14em ', },
    { key: 'product', label: 'product', sticky: 'left', width: '14em ', },
    { key: 'status', label: 'status', type:'status' },
    { key: 'blc', label: 'balance',  type:'money' },
    { key: 'created at', label: 'created_at', type:'status' },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
</script>