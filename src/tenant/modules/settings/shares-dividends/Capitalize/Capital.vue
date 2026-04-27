<template>
    <TableDrawer v-auth="'view-capitalization-list'" tableDetaultHeight="h-3/4"
        :permissions="{ create: 'create-capitalization', edit: 'edit-capitalization-list', }" drawerWidth=" w-2/4"
        :url="tableUrl" state="shareCapitalize" :drawerTitle="drawerTitle" :columns="columns" @save="saveUser">
        <template #header-action>
            <PainPageHeader title="Capitalize list2" dec="Manage SACCO  share capital" />
        </template>
        <template #drawer="{ action, data }">
            <Create v-if="['add'].includes(action)" :data="{ ...data, action }" v-model:form="formData" />
            <Edit v-else :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Create, Edit } from '.'
const drawerTitle = ref('SACCO SMS Settings List')
const  formData = ref<Record<string, any>>({}), tableUrl = computed(() => `settings/shares-dividends/capitalize/list?status`),
    title: Record<string, string> = {
        "view": "View  Details",
        "edit": "Edit Share Capital",
        "add": "Create Share Capital <span class='text-red-400 text-xs'>( create if not exist / update if exist )</span>",
    },
    columns = [
        { key: 'code', label: 'Code', copy: true },
        { key: 'share_price', label: 'share price', width: '14em ', type: 'money' },
        { key: 'capital', label: 'capital', width: '14em ', type: 'money' },
        { key: 'blc', label: 'balance', width: '14em ', type: 'money' },
        { key: 'amount', label: 'amount', width: '14em ', type: 'money' },
        { key: 'created_at', label: 'created at', width: '14em ', type: 'date' },
        { key: 'actions', label: 'Actions', show: ['edit'] }
    ]
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
} 
</script>