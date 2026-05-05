<template>
    <TableDrawer  drawerWidth=" w-2/4"   :drawerShowFooter="false"  :showAddButton="false" :url="tableUrl" state="staffList" :drawerTitle="drawerTitle"
        :showTableAction="false" :columns="columns" @save="saveUser">
        <template #header-action>
            <PainPageHeader title="Audit Logs" dec="Manage system logs" />
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <!-- --- -->
            <!-- <Create v-if="['add'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
            <Edit v-if="['edit'].includes(action)" :data="{ ...data, action }" v-model:form="formData" /> -->
            <Details v-if="['view'].includes(action)" :data="data" />
        </template>
        
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Create, Details, Edit } from '.'
const formData = ref<Record<string, any>>({}), statusFilter = ref('all'),
    drawerTitle = ref('Create a sacco staff'), filters = ['active', 'pendding'],
    tableUrl = computed(() => `settings/system-audit-log/list?status=${statusFilter.value}`),
    title: Record<string, string> = {
        "view": "View  Details",
        "edit": "Edit staff",
        "add": "Create a sacco staff",
    }
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
 
const columns = [
    // { key: 'code', label: 'code', copy: true },
    // { key: 'staff_fall_name', label: 'Full Name', sticky: 'left', },
    // { key: 'staff_email', label: 'Email Address' },
    // { key: 'system_role', label: 'role', },
    // { key: 'workflow_permissions', label: 'Permissions', width: '220px' },
    // { key: 'status', label: 'status', type: 'status' },
    // { key: 'created_at', label: 'created_at', },
    // { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }
]
</script>
