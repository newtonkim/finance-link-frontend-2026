<template>
    <TableDrawer :tableDetaultHeight="'min-h-[20vh]'" drawerWidth="w-2/4" :addButtonText="{ text: 'View SMS Setting', icon: Plus }" :drawerShowFooter="false" :url="tableUrl"
        state="notificationlist" :drawerTitle="drawerTitle" :showTableAction="false" :columns="columns">
        <template #header-action>
            <PainPageHeader title="Notification List" dec="Message/notification shared" />
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
        <template #drawer>
            <settings />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { settings } from '.'
import { Plus } from 'lucide-vue-next'
const statusFilter = ref<'all' | 'sent' | 'pending'>('all')
const drawerTitle = 'SMS Notification Settings'
const filters = ['all','sent', 'pending',]
const tableUrl = computed(() => `settings/notifications/list?channel=sms&status=${statusFilter.value}`)
const columns = [
    { key: 'code', label: 'Code', copy: true },
    { key: 'from_module', label: 'from',},
    { key: 'sender_id', label: 'sender',width:"8em" },
    { key: 'receiver_id', label: 'receiver',width:"5em" },
    { key: 'cost', label: 'cost',type:"money" },
    { key: 'status', label: 'status',width:"5em",type:"status" },
    { key: 'body', label: 'message', width:"20em",copy: true,tooltip:true },
    { key: 'created_at', label: 'created at',width:"9em",type:"date",onSearch:{type:'date-range'} },
]
</script>