<template>
    <TableDrawer :permissions="{
        create: 'branch-create',
        // view: 'branch-details',
        // edit: 'branch-update',
        delete: 'branch-delete'
    }" drawerWidth=" w-2/4" :url="tableUrl" state="branchList" :drawerTitle="drawerTitle" " :columns="columns"
        @save="saveUser">
        <template #header-action>
            <PainPageHeader title="Branch list" dec="Manage SACCO Branches" />
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
import { TableDrawer, PainPageHeader } from '@/Global'
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    drawerTitle = ref('Create Tenant'),
    tableUrl = computed(() => `settings/branches/list?status`),
    title: Record<string, string> = {
        "view": "View  Details",
        "edit": "Edit Branch",
        "add": "Create a sacco Branch",
    }
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
const columns = [
    { key: 'name', label: 'name', sticky: 'left', width: '14em ', },
    { key: 'branch_code', label: 'code' },
    { key: 'contact_number', label: 'phone' },
    { key: 'created_at', label: 'created_at', width: '14em ', },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }

]
</script>