<template>
    <TableDrawer ref="drawer" drawer-Width=" w-2/3" :url="tableUrl" state="sharrTransactionChargesList"
        :drawerTitle="drawerTitle" :columns="columns" :showTableAction="true">
        <template #header-action>
            <PainPageHeader v-once title="Share Transaction Charges List" dec="Manage share transaction charges." />
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #drawer="{ action, data }">
            <Create v-if="['add'].includes(action)" :data="{ ...data, action }" />
            <Edit v-else-if="['edit'].includes(action)" :data="{ ...data, action }" />
            <Details v-else :data="data" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Create, Details, Edit } from '.'
const statusFilter = ref('selling'),
    drawerTitle = ref('Create Tenant'),
    filters = ['selling', 'buying', 'transfer', 'withdrawal'],
    tableUrl = computed(() => `settings/shares-dividends/share-transaction-charges/list?status=${statusFilter.value}`)
    , columns = [
        { key: 'code', label: 'charge code', sticky: 'left', copy: true, width: '14em', },
        { key: 'type', label: 'method', },
        { key: 'charge_type', label: 'type' },
        { key: 'minimum_shares', label: 'min share', type: 'number', width: '7em' },
        { key: 'maximum_shares', label: 'max share', type: 'number', width: '7em' },
        { key: 'charge', label: 'charge', type: 'money' },
        { key: 'created_at', label: 'created at', width: '14em ', type: 'date' },
        { key: 'actions', label: 'Actions', show: ['edit'] }
    ]



</script>
