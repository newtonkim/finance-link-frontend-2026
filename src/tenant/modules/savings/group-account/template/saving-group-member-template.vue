<template>
    <div class="h-[97vh]">
        <div v-if="showSelected && Object.values(selected).length " class="bg-white  rounded-xl shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3   bg-gray-50">
                <div class="font-medium text-gray-700">
                    Selected Members
                    <span class="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        {{ Object.values(selected).length }}
                    </span>
                </div>

                <button class="text-xs text-gray-500 hover:text-gray-700" @click="showSelected = false">
                    Hide
                </button>
            </div>

            <div class="max-h-[250px] overflow-y-auto">
                <div v-for="item in Object.values(selected)" :key="item.member_code"
                    class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                    <div>
                        <div class="text-sm font-medium text-gray-800">
                            Member Name: {{ item.member_name }}
                        </div>
                        <div class="text-xs text-gray-500">
                            Member Code: {{ item.member_code }}
                        </div>
                        <div class="text-xs font-medium text-gray-400">
                            Group Code: {{ item.group_code }}
                        </div>
                    </div>

                    <button @click.stop="removeMember(item.member_code)"
                        class="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition">
                        Remove
                    </button>
                </div>

                <div v-if="!Object.values(selected).length" class="text-center py-6 text-gray-400 text-sm">
                    No members selected
                </div>
            </div>
        </div>
        <TableDrawer :showAddButton="false" :drawerWidth="drawerTitle?.width" :url="tableUrl"
            state="group-members-accounts" :drawerTitle="drawerTitle?.title" :columns="columns">
            <template #sub-header>
                <div v-if="!selectedGroup">Select Group</div>
            </template>
            <template #searchSideAction>
                <SearchableSelect url="group-account-savings/groups-drop-down-list" placeholder="Select groups"
                    v-model="selectedGroup" />
                <TabelActionButtons @action="() => showSelected = !showSelected" title="show Selected" color="success"
                    icon="check" class="mx-1" />
                <TabelActionButtons @action="() => checkall()" title="Select all" color="danger" icon="check"
                    class="mx-1" />
            </template>
            <template #check="{ item }">
                <div
                    class="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 max-h-[58vh] overflow-y-auto custom-scrollbar">
                    <label :key="item?.code"
                        class="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border border-transparent  transition group">
                        <input :checked="!!selected[item.member_code]" type="checkbox" @click="() => selectMember(item)"
                            class="w-4 h-4 accent-nfuko-primary-600 cursor-pointer export-meber-opening-balance" />
                    </label>
                </div>
            </template>
            <template #footer>
            </template>
        </TableDrawer>
        <div class="  absolute bottom-10 w-full">
            <div class='flex justify-between px-5  border-t border-neutral-200 z-50 '>

                <span class="text-xs text-neutral-500">
                    {{ Object.keys(selected).length }} selected
                </span>
                <Button :disabled="!Object.keys(selected).length" type='button' @click="exportTemplate"
                    class="px-4 py-2 text-sm font-medium bg-nfuko-primary-600 text-white rounded-xl hover:bg-nfuko-primary-700 active:scale-95 transition">
                    Export
                </Button>

            </div>
        </div>

    </div>


</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { exportToExcel, TabelActionButtons, TableDrawer, SearchableSelect } from '@/Global'
import { pomPinia } from 'septor-store';
const Store = pomPinia();
const selectedGroup = ref<any>(null)
const showSelected = ref<any>(false)
const selected = ref<Record<string, any>>({}),
    drawerTitle = ref({ title: 'Account Template', width: '600px' }),
    tableUrl = computed(() => `group-account-savings/download-group-member-saving-template?groud_id=` + selectedGroup.value)
const columns = [
    { key: 'check', label: 'check', width: '4em', copy: true },
    { key: 'code', label: 'member code', copy: true },
    { key: 'member_name', label: 'Member', },
]
function selectMember(data: any) {
    if (selected.value[data.member_code]) {
        delete selected.value[data.member_code]
        return
    }
    selected.value[data.member_code] = { ...data, }
}
function checkall() {
    const theCurrentData = (Store as any)['group-members-accounts']?.payload?.data ?? []
    theCurrentData.forEach((element: any) => {
        selectMember(element)
    });
}
function exportTemplate() {
    exportToExcel({
        data: Object.values(selected.value),
        name: 'group-members-account-Template',
    })
}

function removeMember(code: string) {
    delete selected.value[code]
    selected.value = { ...selected.value }
}
</script>