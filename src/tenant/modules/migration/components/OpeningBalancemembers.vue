<template>
    <div class="h-[83vh]">
        <TableDrawer :showAddButton="false" :drawerWidth="drawerTitle?.width" :url="tableUrl"
            state="members-opening-balance" :drawerTitle="drawerTitle?.title" " :columns="columns">
            <template #searchSideAction>
                <TabelActionButtons @action="() => checkall()" title="Selct all" color="danger" icon="check"
                    class="mx-1" />
                <!-- <TabelActionButtons @action="() => exportTemplate()" title="Export" color="primary" icon="export" /> -->
            </template>
            <template #id="{ item }">
                <div
                    class=" sm:grid-cols-3 gap-2 px-4 py-2">
                    <label :key="item?.id"
                        class="flex items-center gap-3 px-3 rounded-xl cursor-pointer border border-transparent  transition group">
                        <input :checked="!!selected[item.id]" type="checkbox" @click="() => selectMember(item)"
                            class="w-4 h-4 accent-nfuko-primary-600 cursor-pointer export-meber-opening-balance" />
                    </label>
                </div>
            </template>
            <template #footer>
                <div class=" flex justify-between px-5  border-t border-neutral-200 " v-if="Object.keys(selected).length">
                    <span class="text-xs text-neutral-500">
                        {{ Object.keys(selected).length }} selected
                    </span>
                    <Button type='button' @click="exportTemplate"
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
const Store:any = pomPinia();
const selected = ref<Record<string, any>>({}),
    drawerTitle = ref('Create Tenant'),
    tableUrl = computed(() => `members/download-members-import-template/list`)
const columns = [
    { key: 'id', label: 'check', copy: true,width:"3em" },
    { key: 'salutation_name', label: 'Member', width: '12em ', },
    { key: 'memeber_code', label: 'member code', width: '14em', copy: true },
    { key: 'account_number', label: 'member code', width: '14em', copy: true },
]

function selectMember(data:any) {
    if (selected.value[data.id]) {
        delete selected.value[data.id]
        return
    }
    selected.value[data.id] = { ...data, date: '', 'opening_balance': 0 }
}

function checkall() {
    const theCurrentData = Store['members-opening-balance']?.payload?.data ?? []
    theCurrentData.forEach((element:any) => {
        selectMember(element)
    });
}

function exportTemplate() {
    exportToExcel({
        data: Object.values(selected.value),
        name: 'Opening-Balances-Import-Template',
    })
}
</script>