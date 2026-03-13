<template>
    <TableDrawer :permissions="{
        create: 'settings-plans-create',
        view: 'settings-plans-details',
        edit: 'settings-plans-update',
        delete: 'settings-plans-delete'
    }" 
    :outerlinks="{ //  
        edit: 'details',
    }" ref="drawer" :drawerShowFooter="hideFooterButtons" drawerWidth="w-1/2" url="/central/settings/plans/list"
        state="plans_list" drawerTitle="Add plans " title="plans list" :columns="columns" @save="saveUser">

        <template #drawer="{ action, submit, data }">
          
            <Create :data="{...data,action}" v-if="['edit', 'add'].includes(action)" :action="action" v-model:form="formData" />
            <Details v-else-if="action === 'view'" :data="data" />
        </template>
    </TableDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TableDrawer } from '@/Global'
import { plansApi } from '@/central/modules/apis';
import { Details, Create } from '.';
const formData = ref<Record<string, any>>({})
const hideFooterButtons = ref(true)
const { create, } = plansApi()
const triggerAction: Record<string, Function> = {
    async create() {
        const featuresSelected = formData.value.selectedfeatures
        formData.value = Object.values(formData.value).map((item: any) => {
            if (item.name === "features") {
                item.value = featuresSelected.map((items: any) => items.id)
                delete item.selectedfeatures
            }
            return item
        })
        await create(formData.value)
        formData.value = {}
    }
}

function saveUser(type: string, data: any) {
    hideFooterButtons.value = true
    triggerAction[type]?.(data);
    if (type === 'view') {
        hideFooterButtons.value = false
    }
}

const columns = [
    { key: 'plan_name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'billing_type', label: 'billing' },
    { key: 'cost', label: 'cost' },
    { key: 'mx_mbrs', label: 'members' },
    { key: 'mxusrs', label: 'users' },
    { key: 'created_at', label: 'Created Date', },
    { key: 'actions', label: 'action', show: ['view', 'edit', 'delete'] },
];
</script>
