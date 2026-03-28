<template>
    <TableDrawer :permissions="{
        // create: 'general-charges-create',
        // view: 'general-charges-details',
        // edit: 'general-charges-update',
        // delete: 'general-charges-delete'
    }" drawerWidth=" w-2/4" :url="tableUrl" state="general-chargesList" :drawerTitle="drawerTitle" " :columns="
        columns" @save="saveUser">
        <template #header-action>
            <PainPageHeader title="General charges list" dec="Manage SACCO general chargeses" />
        </template>
        <template #Revenue="{ item }">
            <ToggleSwitch 
            :value="item.Reversible" @toggle="() => { toggleReversibleChange(item) }" />
        </template>
        <template #charge_amount="{ item }">
            <div class="flex flex-col gap-1"><span class="font-mono font-semibold text-neutral-600 dark:text-white">
                    {{ item?.charge_type === 'percentage' ? item?.charge_amount + ' %' :
                        formatMoneyValue(item?.charge_amount) }}
                </span><span
                    class="inline-flex w-fit rounded px-1.5 py-0.5 text-xs font-medium capitalize bg-amber-50 text-amber-800">
                    {{ item?.charge_type ?? 'flat amount' }}
                </span>
            </div>
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
import { TableDrawer, PainPageHeader, formatMoneyValue } from '@/Global'
import ToggleSwitch from '@/Global/ToggleSwitch.vue'
import { useGeneralCharges } from '../composables/useGeneralCharges'
const { toggleReversible } = useGeneralCharges()
const formData = ref<Record<string, any>>({}), 
    drawerTitle = ref('Create Tenant'),
    tableUrl = computed(() => `settings/general-charges/list?status`),
    title: Record<string, string> = {
        "view": "View  Details",
        "edit": "Edit general-charges",
        "add": "Create a sacco general-charges",
    }
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
function toggleReversibleChange(item: any) {
    item.Reversible = item.id
    toggleReversible(item) 
}
const columns = [
    { key: 'products', label: 'product', sticky: 'left', width: '14em', },
    { key: 'charge_name', label: 'charge', sticky: 'left', },
    { key: 'charge_amount', label: 'amount', },
    { key: 'charge_applys', label: 'applys', sticky: 'left', },
    { key: 'Revenue', label: 'Revenue', sticky: 'left', },
    { key: 'created_at', label: 'created at', width: '14em ', type: 'date' },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }

]
</script>
