<template>
    <TableDrawer :showAddButton="false" :importDefaults="importDefaults" drawerWidth="w-2/3" :url="tableUrl"
        state="garanteedgroupdLoan" :columns="columns" :showTableAction="false">
        <template #member_name="{ item }">
            <Button @click="navigateToProfile(item)"
                class="flex items-center gap-2 font-semibold text-nfuko-action text-sm dark:text-white">
                {{ item?.member_name }}
            </Button>
        </template>
        <template #code="{ item }">

            <span>
                <CopyData :show="item?.code ?? item?.application_code" :copy="item?.code ?? item?.application_code">
                    <template #text>
                        <button v-if="item?.code" @click="navigateIntoLoanDetails(item)"
                            class=" font-semibold text-nfuko-action text-sm dark:text-white  cursor-pointer">
                            <span>{{ item?.code }}</span>
                        </button>
                        <button v-else @click="navigateIntoLoanDetails(item)"
                            class=" font-semibold text-nfuko-action text-sm dark:text-white  cursor-pointer">
                            <span>{{ item?.application_code }}</span>
                        </button>
                    </template>
                </CopyData>
            </span>
        </template>

        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters" v-model="statusFilter" />
        </template>
    </TableDrawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { setLocalValues, getLocalValues, } from '@/Global'
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
function navigateIntoLoanDetails(item: any) {
    if (item?.loan_id) {
        router.push(`/tenant/loans/${item?.loan_id}`)
    } else

        router.push(`/tenant/loan-applications/${item?.application_id}`)
}
const columns = [
    { key: 'code', label: 'Reference', sticky: 'left' },
    { key: 'member_code', label: 'Member Code', sticky: 'left' },
    { key: 'member_name', label: 'Member Name', sticky: 'left' },
    { key: 'member_phone', label: 'Member Phone' },
    { key: 'blc', label: 'Balance', type: 'money' },
    { key: 'loan_status', label: 'Status', type: 'status' },
    // { key: 'created_at', label: 'Created At', type: 'date' },
]

function navigateToProfile(item: any) {
    setLocalValues('memberProfile', {
        ...item,
        id: item.member_id
    })

    router.push('/tenant/member/profile')
}
</script>