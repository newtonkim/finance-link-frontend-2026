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
                <PainPageHeader title="General charges list" dec="Manage SACCO general charges" />
                <router-link
                    :to="{ name: 'tenant-settings-loan-charges' }"
                    class="inline-flex items-center gap-2 self-start rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                >
                    <span>Managing loan charges? Go to the Loan Charges page →</span>
                </router-link>
            </div>
        </template>
        <template #products="{ item }">
            <div class="flex flex-wrap gap-1">
                <span v-for="p in resolveAllProducts(item)" :key="p" class="inline-flex items-center rounded-md bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-500/10 dark:bg-neutral-800 dark:text-neutral-300">
                    {{ p }}
                </span>
                <span v-if="!resolveAllProducts(item).length" class="text-neutral-400 text-xs">—</span>
            </div>
        </template>
        <template #charge_applys="{ item }">
            <div class="flex flex-wrap gap-1">
                <template v-if="item.charge_applys">
                    <span v-if="Array.isArray(item.charge_applys)" v-for="(a, i) in item.charge_applys" :key="i" class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">
                        {{ a }}
                    </span>
                    <span v-else class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">
                        {{ item.charge_applys }}
                    </span>
                </template>
                <template v-else-if="item.application">
                    <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300">
                        {{ applicationLabel(item.application) }}
                    </span>
                    <span v-if="item.where_to_apply" class="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-700/10 dark:bg-sky-900/30 dark:text-sky-300">
                        {{ item.where_to_apply }}
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
import { ref, computed, onMounted } from 'vue'
import { Create, Details } from '.'
import { TableDrawer, PainPageHeader, formatMoneyValue } from '@/Global'
import ToggleSwitch from '@/Global/ToggleSwitch.vue'
import { useGeneralCharges } from '../composables/useGeneralCharges'
const { toggleActive, applicationLabel, savingProductOptions, fetchOptions } = useGeneralCharges()
const formData = ref<Record<string, any>>({}), 
    drawerTitle = ref('Create Tenant'),
    tableUrl = computed(() => `settings/general-charges/list?status`),
    title: Record<string, string> = {
        "view": "View  Details",
        "edit": "Edit general-charges",
        "add": "Create a sacco general-charges",
    }
onMounted(() => {
    fetchOptions()
})
function resolveAllProducts(item: any) {
  const products: string[] = []

  // 1. Try direct names returned by the API.
  const keys = ['products', 'saving_products', 'applicable_products']
  keys.forEach((k) => {
    const val = item[k]
    if (Array.isArray(val)) {
      val.forEach((v) => {
        const name = typeof v === 'object' ? v.name || v.label || v.product_name : v
        if (name) products.push(String(name))
      })
    } else if (val) {
      const name = typeof val === 'object' ? val.name || val.label : val
      if (name) products.push(String(name))
    }
  })

  if (products.length) return [...new Set(products)]

  // 2. Fallback: resolve names from savings product IDs only.
  const idKeys = ['saving_product_ids', 'saving_product_id']
  idKeys.forEach((k) => {
    const val = item[k]
    const ids = Array.isArray(val) ? val : val ? String(val).split(',') : []
    ids.forEach((id) => {
      const cleanId = String(id).trim()
      if (!cleanId) return
      const option = savingProductOptions.value.find((o) => String(o.id) === cleanId)
      products.push(option ? option.name : `ID: ${cleanId}`)
    })
  })

  return [...new Set(products)]
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
    { key: 'products', label: 'product', sticky: 'left', width: '14em', },
    { key: 'charge_name', label: 'charge', sticky: 'left', },
    { key: 'charge_amount', label: 'amount', },
    { key: 'charge_applys', label: 'applys', sticky: 'left', },
    { key: 'is_active', label: 'Active', sticky: 'left', },
    { key: 'created_at', label: 'created at', width: '14em ', type: 'date' },
    { key: 'actions', label: 'Actions', show: ['view', 'edit', 'delete'] }

]
</script>
