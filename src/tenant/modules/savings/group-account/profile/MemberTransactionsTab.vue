<template>
    <TableDrawer :downloadItems="downloadItems" :printItems="printItems" :showAddButton="false"
        :importDefaults="['id', 'branch_id', 'dob']" drawerWidth=" w-2/3" :url="tableUrl"
        state="groupdAccountTransactions" :drawerTitle="drawerTitle" :columns="columns"
        :showTableAction="['download', 'print']">
        <template #member_name="{ item }">
            <span>
                <Button @click="navigateToProfile(item)"
                    class="flex items-center gap-2 font-semibold text-nfuko-action text-sm dark:text-white">
                    <span>{{ item?.member_name }}</span>
                </Button>
            </span>
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { TableDrawer, StatusButtonsHorizontal, setLocalValues, getLocalValues } from '@/Global'
import { useRouter } from 'vue-router';
const router = useRouter();

const statusFilter = ref('all'), groupId = getLocalValues('groupProfile')?.id,
    drawerTitle = ref('Create Tenant'), filters = ['withdrawal', 'deposit', 'all'],
    tableUrl = computed(() => `/group-account-savings/profile/group-transactions?status=${statusFilter.value}&&group_id=${groupId}`)
const downloadItems = [
    { label: 'PDF', value: 'PDF', route: 'export-pdf', status: statusFilter.value, group_id: groupId },
    { label: 'Excel', value: 'xlsx', route: 'export-excel', status: statusFilter.value, group_id: groupId },
    { label: 'CSV', value: 'csv', route: 'export-csv', status: statusFilter.value, group_id: groupId },];
const printItems = [
    { label: 'print', value: 'print', route: 'export-print', status: statusFilter.value, group_id: groupId },];
const columns = [
    { key: 'code', label: 'reference', sticky: 'left', },
    { key: 'member_name', label: 'Member Name', sticky: 'left', },
    { key: 'product', label: 'Product', sticky: 'left', width: '16em' },
    { key: 'amount', label: 'Amount', type: 'money', },
    { key: 'charge', label: 'Charge', type: 'money', },
    { key: 'status', label: 'Status', type: 'status', },
    { key: 'transaction_date', label: 'Transaction Date', type: "date" },
    { key: 'created_at', label: 'Created At', type: "date" },
    { key: 'narration', label: 'Narration', width: '24em' },
]
function navigateToProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', { ...item, id: item.member_id })
}
</script>
