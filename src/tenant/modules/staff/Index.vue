<template>
    <TableDrawer drawerWidth=" w-2/4" :url="tableUrl" state="memberList" :drawerTitle="drawerTitle" " :columns="
        columns" @save="saveUser">
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
 drawerTitle = ref('Create Tenant'), filters = ['active', 'pendding'], 
 tableUrl = computed(() => `/staff/list?status=${statusFilter.value}`), 
 title: Record<string, string> = {
    "view": "View  Details",
    "edit": "Edit staff",
    "add": "Create a sacco staff",
}
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
const columns = [
    { key: 'salutation_name', label: 'Member', sticky: 'left', width: '14em ', },

]
</script>