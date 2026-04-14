<template>
    <TableDrawer
  
     :showAddButton="false" :importDefaults="importDefaults" drawerWidth="w-2/3" :url="tableUrl"
        state="garanteedgroupdLoan" :columns="columns" :showTableAction="false">
        <template #member_name="{ item }">
            <Button @click="navigateToProfile(item)"
                class="flex items-center gap-2 font-semibold text-nfuko-action text-sm dark:text-white">
                {{ item?.member_name }}
            </Button>
        </template>

        <!-- Search Side Filters -->
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
    </TableDrawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { TableDrawer, StatusButtonsHorizontal, setLocalValues, getLocalValues } from '@/Global'
const router = useRouter()
const statusFilter = ref<'all' | 'disbursed' | 'arrears' | 'active' | 'closed'>('all')
const groupId = computed(() => getLocalValues('groupProfile')?.id)
const filters = ['all', 'disbursed', 'arrears', 'active', 'closed']
const importDefaults = ['id', 'branch_id', 'dob']
const tableUrl = computed(() => {
    const params = new URLSearchParams()
    params.append('status', statusFilter.value)
    if (groupId.value) params.append('group_id', groupId.value)
    return `/group-account-savings/profile/group-members-with-running-loans?${params.toString()}`
}) 
const columns = [
    { key: 'code', label: 'Reference', sticky: 'left' },
    { key: 'member_code', label: 'Member Code', sticky: 'left' },
    { key: 'member_name', label: 'Member Name', sticky: 'left' },
    { key: 'member_phone', label: 'Member Phone' },
    { key: 'blc', label: 'Balance', type: 'money' },
    { key: 'loan_status', label: 'Status', type: 'status' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'actions', label: 'Actions', show: ['view'] }
]

function navigateToProfile(item: any) {
    setLocalValues('memberProfile', {
        ...item,
        id: item.member_id
    })

    router.push('/tenant/member/profile')
}
</script>