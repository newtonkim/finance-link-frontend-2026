<template>
    <TableDrawer ref="drawer" drawerWidth="w-1/2" url="/central/settings/roles/list" state="roles_list"
        drawerTitle="Add roles to staff" title="roles list" :columns="columns" @save="saveUser">
        <template #drawer="{ action, submit, data }">

            <Details v-if="injectingData" :data="injectingData" />
            <Create :data="data" v-else-if="['edit', 'add'].includes(action)" :watcher="{ action, submit }"
                v-model:form="formData" />
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
import { ref } from 'vue'
import { TableDrawer } from '@/Global'
import { rolesApi } from '@/central/modules/apis';
import { Details, Create } from '.';
import { UserCog2 } from 'lucide-vue-next';
const formData = ref<Record<string, any>>({})
const injectingData = ref()
const drawer = ref(null)
const { create, } = rolesApi()
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
    injectingData.value = item
    setTimeout(() => {
        drawer.value.toggleDrawer()
    }, 100)
}

function saveUser(type: string, data: any) {
    injectingData.value = null
    triggerAction[type]?.(data)
}

const columns = [
    { key: 'name', label: 'Name' },
    { key: 'created_at', label: 'Created Date', },
    { key: 'actions', label: 'action', show: ['edit', 'delete'] },

]



</script>
