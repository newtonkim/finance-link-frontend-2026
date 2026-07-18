<template>
    <TableDrawer :permissions="{
        // create: 'general-charges-create',
        // view: 'general-charges-details',
        // edit: 'general-charges-update',
        // delete: 'general-charges-delete'
    }" drawerWidth=" w-2/4" :url="tableUrl" state="general-chargesList" :drawerTitle="drawerTitle"  :columns="
        columns" @save="saveUser">
        <template #header-action>
            <div class="flex flex-col gap-3">
                <PainPageHeader title="General charges list" title-color="#06265a" dec="Manage SACCO general charges" />
                <router-link
                    :to="{ name: 'tenant-settings-loan-charges' }"
                    class="inline-flex items-center gap-2 self-start rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                >
                    <span>Managing loan charges? Go to the Loan Charges page →</span>
                </router-link>
            </div>
        </template>
        <template #charge_applys="{ item }">
            <div class="flex flex-wrap items-center gap-1">
                <template v-if="item.application">
                    <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">
                        {{ applicationLabel(item.application) }}
                    </span>
                    <span v-if="item.application === 'other' && item.charge_applys" class="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium capitalize text-sky-700 ring-1 ring-inset ring-sky-700/10 dark:bg-sky-900/30 dark:text-sky-300">
                        {{ item.charge_applys }}
                    </span>
                    <span v-for="p in productChips(item)" :key="p" class="inline-flex items-center rounded-md bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-500/10 dark:bg-neutral-800 dark:text-neutral-300">
                        {{ p }}
                    </span>
                </template>
                <span v-else class="text-neutral-400 text-xs">—</span>
            </div>
        </template>
        <template #is_active="{ item }">
            <ToggleSwitch
                :value="item.is_active"
                @toggle="() => { handleActiveToggle(item) }" />
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
const { toggleActive, applicationLabel } = useGeneralCharges()
const formData = ref<Record<string, any>>({}),
    drawerTitle = ref('Create Tenant'),
    tableUrl = computed(() => `settings/general-charges/list?status`),
    title: Record<string, string> = {
        "view": "View  Details",
        "edit": "Edit general-charges",
        "add": "Create a sacco general-charges",
    }
function productChips(item: any): string[] {
    // The backend returns `products` as a GROUP_CONCAT'd string of savings
    // product names — only populated for application=other + where_to_apply=savings
    // charges that have pivot rows. Split and clean for chip rendering.
    const raw = item?.products
    if (Array.isArray(raw)) return raw.map((p) => String(p)).filter(Boolean)
    if (typeof raw !== 'string' || !raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
}
function saveUser(type: string, data: any) {
    if (title?.[type]) drawerTitle.value = title?.[type]
}
function handleActiveToggle(item: any) {
    // Optimistic UI flip so the toggle feels responsive — the backend PATCH
    // /general-charges/{id}/toggle flips is_active to match this value.
    item.is_active = !item.is_active
    toggleActive(item)
}
const columns = [
    { key: 'charge_name', label: 'charge', sticky: 'left', },
    { key: 'charge_amount', label: 'amount', },
    { key: 'charge_applys', label: 'applies to', sticky: 'left', width: '20em' },
    { key: 'is_active', label: 'Active', sticky: 'left', },
    { key: 'created_at', label: 'created at', width: '14em ', type: 'date' },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }

]
</script>
