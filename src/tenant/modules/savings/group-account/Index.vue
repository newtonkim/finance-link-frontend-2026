<template>
    <TableDrawer :drawerWidth="drawerTitle?.width" :url="tableUrl" state="memberAccountList" :drawerTitle="drawerTitle?.title" " :columns="
        columns" @save="saveUser">
       
<template #header-action>
<div  class="space-y-3 ">
 <nav  class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
 <a  href="/tenant/dashboard" class="hover:text-[#0A2318] transition-colors">Dashboard</a>
 <svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide h-3 w-3 lucide-chevron-right-icon lucide-chevron-right h-3 w-3" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg><span  class="text-[#0A2318]">Group Savings -</span>
 </nav>
 
 <h1  class="text-4xl font-black text-[#0A2318] dark:text-white tracking-tight">Group Savings</h1>
 <p  class="text-sm text-neutral-500 max-w-lg">Manage and monitor institutional savings groups, their membership tiers, and overall performance.</p></div>
</template>
<template #sub-header>
<AnalysisTile :data='stats'/> 
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
import { ref, computed,watch } from 'vue'
import { Create, Details } from '.'
import { Users, DollarSign, TrendingUp, AlertTriangle, ShieldAlert, CreditCard, } from 'lucide-vue-next';

import { TableDrawer, StatusButtonsHorizontal, addCommasCurrency, Card, CardContent,AnalysisTile } from '@/Global'
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
 drawerTitle = ref('Create Tenant'), filters = ['all', 'active', 'suspended', 'expired', 'trial'], 
 tableUrl = computed(() => `/members-account/list?status=${statusFilter.value}`), 
 stats=ref(),
 title: Record<string, string> = {
    "view": {title:"Viewmember saving's Account Details",width:"w-1/2"},
    "edit":{title: "Edit member saving's Account",width:"w-1/3"},
    "add": {title:"Create a member saving's Account",width:"w-1/3"},
}
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
const props={}
const columns = [
    { key: 'member_name', label: 'Member', sticky: 'left', width: '14em ', },
    { key: 'product', label: 'product', sticky: 'left', width: '14em ', },
    { key: 'status', label: 'status', type:'status' },
    { key: 'blc', label: 'balance',  type:'money' },
    { key: 'created at', label: 'created_at', type:'status' },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
function setData() {

    stats.value = [
        {
            title: 'Total Group',
            value: addCommasCurrency(props?.data?.tenants?.tatal_tenants ?? 0),
            trendColor: 'text-emerald-500',
            bgColor: 'bg-[#f0f9f6]', // Light greenish/mint
            iconColor: 'text-[#2d9d78]'
        },
        {
            title: 'Active portifolios',
            value: props?.data?.revenue?.monthly ?? "0.00",
            trendColor: 'text-neutral-400',
            bgColor: 'bg-[#f0f9f6]',
            iconColor: 'text-[#2d9d78]'
        },
        {
            title: 'Growth Rate',
            value: addCommasCurrency(props?.data?.revenue?.yearly ?? "0.00"),
            trendColor: 'text-neutral-400',
            bgColor: 'bg-[#f0f9f6]',
            iconColor: 'text-[#2d9d78]'
        },
       
    ];
}

watch(() => props?.data, () => {
    setData()
}, {
    immediate: true,
    deep: true
})
</script>