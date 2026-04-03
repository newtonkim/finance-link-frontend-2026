<template>
    <div class="h-[83vh]">
        <TableDrawer :showAddButton="false" :drawerWidth="drawerTitle?.width" :url="tableUrl" state="members-account"
            :drawerTitle="drawerTitle?.title" " :columns="columns">
            <template #searchSideAction>
                <TabelActionButtons @action="() => checkall()" title="Select all" color="danger" icon="check"
                    class="mx-1" />
            </template>
            <template #check="{ item }">
                <div
                    class="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 max-h-[58vh] overflow-y-auto custom-scrollbar">
                    <label :key="item?.code"
                        class="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border border-transparent  transition group">
                        <input :checked="!!selected[item.code]" type="checkbox" @click="() => selectMember(item)"
                            class="w-4 h-4 accent-nfuko-primary-600 cursor-pointer export-meber-opening-balance" />
                    </label>
                </div>
            </template>
            <template #footer>
                <div class=" flex justify-between px-5  border-t border-neutral-200 "
                   >
                    <span class="text-xs text-neutral-500">
                        {{ Object.keys(selected).length }} selected
                    </span>
                    <Button   :disabled="!Object.keys(selected).length" type='button' @click="exportTemplate"
                        class="px-4 py-2 text-sm font-medium bg-nfuko-primary-600 text-white rounded-xl hover:bg-nfuko-primary-700 active:scale-95 transition">
                        Export
                    </Button>
                </div>
            </template>
        </TableDrawer>
    </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { exportToExcel, TabelActionButtons, TableDrawer, } from '@/Global'
import { pomPinia } from 'septor-store';
const Store = pomPinia();
const selected = ref<Record<string, any>>({}),
    drawerTitle = ref('Create Tenant'),
    tableUrl = computed(() => `members-account/template`)
const columns = [
    { key: 'check', label: 'check', width: '4em', copy: true },
    { key: 'code', label: 'member code', copy: true },
    { key: 'member_name', label: 'Member', },
]
function selectMember(data) {
    if (selected.value[data.code]) {
        delete selected.value[data.code]
        return
    }
    selected.value[data.code] = { ...data, }
}
function checkall() {
    const theCurrentData = Store['members-account']?.payload?.data ?? []
    theCurrentData.forEach(element => {
        selectMember(element)
    });
}
function exportTemplate() {
    exportToExcel({
        data: Object.values(selected.value),
        name: 'members-account-Template',
    })
}
</script>