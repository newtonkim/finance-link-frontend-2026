<template>
    <TableDrawer :showTableAction="true" :drawerWidth="drawerTitle?.width" :url="tableUrl" state="memberAccountList"
        :drawerTitle="drawerTitle?.title" " :columns="columns" @save="saveUser">
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
        <template #header-action>

            <PainPageHeader title="Members Savings Account"
                dec="Manage all member savings accounts and their balances." />

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
import { TableDrawer, StatusButtonsHorizontal, PainPageHeader, CopyData } from '@/Global'
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    drawerTitle = ref('Create Tenant'), filters = ['all', 'active', 'suspended', 'expired', 'trial'],
    tableUrl = computed(() => `/members-account/list?status=${statusFilter.value}`),
    title: Record<string, string> = {
        "view": { title: "Viewmember saving's Account Details", width: "w-1/2" },
        "edit": { title: "Edit member saving's Account", width: "w-1/3" },
        "add": { title: "Create a member saving's Account", width: "w-1/3" },
    }
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}

const columns = [
    { key: 'member_name', label: 'Member', sticky: 'left', width: '14em ', },
    { key: 'product', label: 'product', sticky: 'left', width: '14em ', },
    { key: 'status', label: 'status', type: 'status' },
    { key: 'blc', label: 'balance', type: 'money' },
    { key: 'created at', label: 'created at', type: 'status' },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
</script>