<template>

    <TableDrawer ref="drawer"
  :drawerShowFooter="['add', 'edit'].includes(drawerTitle.action)"
     drawerWidth="w-1/2" url="/settings/roles/list" state="tenant_settings_roles_list"
        :outerlinks="{
            edit: 'details'
        }" :drawerTitle="drawerTitle?.title" title="roles list" :columns="columns" @save="saveUser">
        <template #drawer="{ action, submit, data }">
 
            <EditUserRole v-if="dispalyAlterUserRole.show" :data="dispalyAlterUserRole.data" />
            <Details v-else-if="action == 'view'" :data="data" />
            <Create :data="{...data,action}" v-else-if="['edit', 'add'].includes(action)" :watcher="{ action, submit }"
                v-model:form="formData" />
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #actions="{ item }">
            <span type="span"
                class="btn bg-red-500 flex items-center gap-1.5 rounded-full  px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-100 dark:bg-blue-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                @click="() => toggleDrawer(item)">
                <UserCog2 class="size-3.5" />
            </span>
        </template>
    </TableDrawer>
</template>

<script setup lang="ts">
import { ref, watch, reactive,shallowReactive } from 'vue'
import { TableDrawer, StatusButtonsHorizontal } from '@/Global'
import { UserCog2 } from 'lucide-vue-next';
const formData = ref<Record<string, any>>({})
const drawer = ref(null)
const statusFilter = ref('roles');
const filters = ['roles', 'permissions',]
import { Details, Create, EditUserRole } from '.';
import { tenantRolesApi } from '../../../../apis/onboardingSettings';
const { create, } = tenantRolesApi()
let dispalyAlterUserRole = reactive({ show: false })
const emit = defineEmits(['update:modelValue',]);
watch(() => statusFilter.value, (filter) => {
    if (filter)
        emit('update:modelValue', filter)
})
let drawerTitle = shallowReactive({
    title: "Create role",

})
const title = shallowReactive({
    add:"Create role",
    edit:"Edit role",
    view:"View role",
})
const triggerAction: Record<string, Function> = {
    async create() {
        const selectedpermission = formData.value.selectedpermission
        formData.value = Object.values(formData.value).map((item: any) => {
            if (item.name === "permission") {
                item.value = selectedpermission.map((items: any) => items.id)
                delete item.selectedpermission
            }
            return item
        })
        await create(formData.value)
        formData.value = {}
    }
}
function toggleDrawer(item: any) {
    dispalyAlterUserRole = { show: true, data: item }
    drawerTitle = {title:'alter staff Roles',action:'alter'}
    setTimeout(() => {
        drawer.value.toggleDrawer()
    }, 100)
}
function saveUser(type: string, data: any) {
    triggerAction[type]?.(data)
    dispalyAlterUserRole.show = false
        if (title?.[type]){
        drawerTitle = {title:title?.[type],action:type}

        }
}
const columns = [
    { key: 'name', label: 'Name' },
    { key: 'created_at', label: 'Created Date', },
    { key: 'actions', label: 'action', show: ['view', 'edit', 'delete'] },
]
</script>
