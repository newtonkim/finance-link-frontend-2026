<template>
    <div class="h-[83vh]">
        <TableDrawer :showAddButton="false" :drawerWidth="drawerTitle?.width" :url="tableUrl" state="loan-repayment-template"
            :drawerTitle="drawerTitle?.title" :columns="columns">
            <template #searchSideAction>
                <TabelActionButtons @action="() => checkall()" title="Select all" color="danger" icon="check"
                    class="mx-1" />
            </template>
            <template #check="{ item }">
                <div class="g ">
                    <label :key="item?.loan_no"
                        class=" py-2 rounded-xl cursor-pointer border border-transparent  transition group">
                        <input :checked="!!selected[item.loan_no]" type="checkbox" @click="() => selectMember(item)"
                            class="w-4 h-4 accent-nfuko-primary-600 cursor-pointer export-meber-opening-balance" />
                    </label>
                </div>
            </template>
            <template #footer>
                <div class=" flex justify-between px-5  border-t border-neutral-200 ">
                    <span class="text-xs text-neutral-500">
                        {{ Object.keys(selected).length }} selected
                    </span>
                    <Button :disabled="!Object.keys(selected).length" type='button' @click="exportTemplate"
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
import { exportToExcel, } from '@/Global'
import { pomPinia } from 'septor-store';
const Store = pomPinia();
const selected = ref<Record<string, any>>({}),
    drawerTitle = ref({ title: 'Loan Repayment Template', width: 'w-2/3' }),
    tableUrl = computed(() => `/loan-applications/loan-repayment-template`)
const columns = [
    { key: 'check', label: 'check', width: "3em" },
    { key: 'loan_no', label: 'Loan Code', },
    { key: 'salutation_name', label: 'Name', },
    { key: 'member_code', label: 'Member Code', },
]
function selectMember(data) {
    if (selected.value[data.loan_no]) {
        delete selected.value[data.loan_no]
        return
    }
    selected.value[data.loan_no] = { ...data, }
}
function checkall() {
    const theCurrentData = Store['loan-repayment-template']?.payload?.data ?? []
    theCurrentData.forEach(element => {
        selectMember(element)
    });
}
function exportTemplate() {
    exportToExcel({
        data: Object.values(selected.value),
        name: 'loan-repayment-template',
    })
}
</script>