<template>
    <TableDrawer ref="drawer" drawerWidth="w-1/2" :showAddButton="false" url="/central/settings/permisions/list"
        state="Permisions_list" drawerTitle="Add permisions to staff" title="Permisions list" :columns="columns"
        @save="saveUser">
        <template #name="{ item }: { item: any }">
            {{ `${item?.name}`.replace(/[-_]/gi, ' ') }}
        </template>
        <template #actions="{ item }: { item: any }">
            <div class="w-full gap-2 flex items-center justify-center">
                <button @click="() => OpenThedrawer(item)"
                    class="flex items-center  rounded-full bg-amber-300 p-2  text-xs font-bold text-neutral-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60" ">
                    <UserPlus size=" 13" />
                </button>
            </div>
        </template>
        <template #drawer="{ }">
            <Details :data="data" />
        </template>
    </TableDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TableDrawer } from '@/Global'
import { permissionsApi } from '@/central/modules/apis';
import { UserPlus } from 'lucide-vue-next';
import { Details } from '.';
const formData = ref<Record<string, any>>({})
const drawer = ref(null)
const data = ref(null)
const { create, Erase } = permissionsApi()
const triggerAction: Record<string, Function> = {
    delete: Erase,
    async create() {
        await create(formData.value)
        formData.value = {}
    }
}

function saveUser(type: string, data: any) {
    triggerAction[type]?.(data)
    console.log(type);

}

const columns = [
    { key: 'name', label: 'Name' },
    { key: 'module', label: 'Module', },
    { key: 'created_at', label: 'Created Date', },

]

function OpenThedrawer(item: any) {
    data.value = item
    setTimeout(() => {
        drawer.value.toggleDrawer()
    }, 1000)

}

</script>
