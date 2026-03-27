<template>
    <TableDrawer :automaticCreate="automaticCreate.actionSlot != 'deposit'" ref="drawer" :showTableAction="true"
        :drawerWidth="drawerTitle?.width" :url="tableUrl" state="memberAccountList" :drawerTitle="drawerTitle?.title"
        :columns="columns" @save="saveUser">
        <template #member_name="{ item }">
            <div class="-1">
                <div class="font-semibold text-nfuko-action text-sm dark:text-white">
                    {{ item.member_name }}
                </div>
                <CopyData :show="item.account_code" />
                <div class="text-[11px] uppercase tracking-wide ">
                    {{ item.type }}
                </div>
            </div>
        </template>
        <template #actions="{ item }: { item: any }">
            <TabelActionButtons  @action="() => OpenThedrawer(item)"  title="deposit" color="danger"
                icon="CircleDollarSign"
                />  
        </template>
        <template #header-action>
            <PainPageHeader title="Members Savings Account"
                dec="Manage all member savings accounts and their balances." />
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <Deposit v-if="automaticCreate?.actionSlot == 'deposit'" :data="{ action, ...(automaticCreate ?? {}) }"
                v-model:form="formData" />
            <Create v-else-if="['add', 'edit'].includes(action)" :data="{ ...data, action }" />
            <Details v-else-if="['view'].includes(action)" :data="data" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Create, Details, Deposit } from '.'
import { TableDrawer, StatusButtonsHorizontal, PainPageHeader, CopyData, TabelActionButtons } from '@/Global'
import { memberAccountApi } from '@/tenant/apis'
const
    drawer = ref(null),
    automaticCreate = ref({ drawerActions: true, actionSlot: null })
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    { memebrAccountDepositAmount } = memberAccountApi(),
    drawerTitle = ref('Create Tenant'), filters = ['all', 'active', 'suspended', 'expired', 'trial'],
    tableUrl = computed(() => `/members-account/list?status=${statusFilter.value}`),
    title: Record<string, string> = {
        "view": { title: "Viewmember saving's Account Details", width: "w-1/2" },
        "edit": { title: "Edit member saving's Account", width: "w-1/3" },
        "add": { title: "Create a member saving's Account", width: "w-1/3" },
        "deposit": { width: "w-3/4", title: "deposit Saving's Account", fun: () => memebrAccountDepositAmount(formData.value, automaticCreate.value,), },// this will be the deposite
    }
// automaticCreate.actionSlot// this will help switch off the default drawer actions  and use out side action
function saveUser(type: string, data: any) {
    if (automaticCreate.value.actionSlot == 'deposit') {
        title?.['deposit']?.fun?.()
        return
    } else if (title?.[type]) {
        drawerTitle.value = title?.[type]
    }
    title?.[type]?.fun?.()
    automaticCreate.value = {}// celan the automatic create
}
const columns = [
    { key: 'member_name', label: 'Member', sticky: 'left', width: '14em ', },
    { key: 'product', label: 'product', sticky: 'left', width: '14em ', },
    { key: 'status', label: 'status', type: 'status' },
    { key: 'blc', label: 'balance', type: 'money' },
    { key: 'created at', label: 'created at', type: 'status' },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]

function OpenThedrawer(item: any) {
    automaticCreate.value = { actionSlot: 'deposit', ...item }
    drawerTitle.value = { title: "deposit member saving's Account", width: "w-2/4" }
    setTimeout(() => {
        drawer.value.toggleDrawer()
    }, 1000)

}
</script>