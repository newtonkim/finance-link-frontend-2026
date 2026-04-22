<template>
    <TableDrawer :tableDetaultHeight="'min-h-[20vh]'" drawerWidth="w-2/4"
        :addButtonText="{ text: 'View SMS Setting', icon: Plus }" :drawerShowFooter="false" :url="tableUrl"
        state="MySMSSettingList" :drawerTitle="drawerTitle" :showTableAction="false" :columns="columns">
        <template #header-action>
            <PainPageHeader title="SMS Settings"
                dec="Manage SACCO SMS accounts and track their onboarding performance" />
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
        <template #length_min="{ item }">
            <div class="flex items-center justify-center w-1/2">
                <span>
                    {{ item?.length_min }} - {{ item?.length_max }}
                </span>
            </div>
        </template>
        <template #drawer="{ }">
            <settings />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { settings } from '.'
import { Plus } from 'lucide-vue-next'
const statusFilter = ref<'all' | 'active' | 'pending'>('all')
const drawerTitle = ref('Create SACCO SMS')
const filters = ['active', 'pending']
const tableUrl = computed(() => `settings/notifications/sms-settings/list?channel=sms&status=${statusFilter.value}`)
const columns = [
    { key: 'code', label: 'Code', copy: true },
    { key: 'cost', label: 'Cost' },
    { key: 'length_unit', label: 'Unit' },
    { key: 'length_min', label: 'Range', width: '7em' },
    { key: 'status', label: 'Status', type: 'status' },
    { key: 'created_at', label: 'Created At', type: 'date' }
]
</script>