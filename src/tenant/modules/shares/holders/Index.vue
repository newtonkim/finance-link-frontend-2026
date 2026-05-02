<template>
    <TableDrawer
   
    :addButtonText="{ text: 'Create/Change Share holder', icon: Plus }"
     :printTable="true"  drawerWidth=" w-2/3" :url="tableUrl"
        state="ShareholderList" :drawerTitle="drawerTitle" :columns="columns" 
        :showTableAction="true">
        <template #header-action>
            <PainPageHeader title="Shares Holders List" dec="Manage all share holders." />
        </template>
        <template #salutation_name="{ item }">
            <span>
                <Button @click="navigateToProfile(item)"
                    class="flex items-center gap-2 font-semibold text-nfuko-action text-sm dark:text-white">
                    <span>{{ item?.salutation_name }}</span>
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
// import { Create, Details, Edit } from '.'
import { TableDrawer, StatusButtonsHorizontal, setLocalValues } from '@/Global'
import { useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
const router = useRouter();
const statusFilter = ref('sell shares'),
    drawerTitle = ref('Create Tenant'), filters = ['sell shares', 'transfer shares', 'share withdrawal'],
    tableUrl = computed(() => `/shares/holders/list?status=${statusFilter.value}`)
    // title: Record<string, string> = {
    //     "view": "View Member Details",
    //     "edit": "Edit member",
    //     "add": "Create a sacco member",
    // }
// function saveUser(type: string, data: any) {
//     if (title?.[type]) drawerTitle.value = title?.[type]
// }
const columns = [
    { key: 'share_code', label: 'code', sticky: 'left', copy: true },
    { key: 'member_type', label: 'Member type' },
    { key: 'salutation_name', label: 'Member', sticky: 'left',  },
    { key: 'primary_contact', label: 'phone', },
    { key: 'other_contacts', label: 'Other Contacts', },
    { key: 'share_value', label: 'share value', type: "money",width: '9em',tooltip: true },
    { key: 'share_no', label: 'share no', type: "money",width: '9em',tooltip: true },
    { key: 'total_value', label: 'total value', type: "money",width: '9em',tooltip: true },
    { key: 'purchased_at', label: 'purchased at', type: 'date',width: '8em ', },
    { key: 'created_at', label: 'created at', type: 'date',width: '8em ', },
    // { key: 'actions', label: 'Actions', show: ['edit'] }
]
function navigateToProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', { ...item, id: item?.member_id })
}
</script>
