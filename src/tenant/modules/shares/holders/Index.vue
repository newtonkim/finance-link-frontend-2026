<template>
    <TableDrawer ref="drawer" :show-add-button="false"   drawerWidth=" w-2/3" :url="tableUrl"
        state="ShareholderList" :drawerTitle="drawerTitle" :columns="columns" :showTableAction="true">
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
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters"
                @update:modelValue="(e) => { OpenThedrawer(e) }" />
        </template>
        <template #drawer="{ action, data }">
            <component :is="drawerComponet" :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { SellShares, TransferShares, WithdrawShares } from '.'
import { TableDrawer, StatusButtonsHorizontal, setLocalValues, Confirm } from '@/Global'
import { useRouter } from 'vue-router';
const router = useRouter();
import { shareCenterApi } from '@/tenant/apis/shares';
const { TranUniShares: SellSharesApi } = shareCenterApi()
const drawer = ref<any>(null),
    drawerComponet = computed(() => automaticCreate.value[statusFilter.value]?.componet),
    statusFilter = ref('sell shares'),
    formData = ref<any[]>([]),
    drawerTitle = ref('Create Tenant'), filters = ['sell shares', 'transfer shares', 'share withdrawal'],
    tableUrl = computed(() => `/shares/holders/list?status=${statusFilter.value}`)

const columns = [
    { key: 'share_code', label: 'code', sticky: 'left', copy: true },
    { key: 'member_type', label: 'Member type' },
    { key: 'salutation_name', label: 'Member', sticky: 'left', },
    { key: 'primary_contact', label: 'phone', },
    { key: 'other_contacts', label: 'Other Contacts', },
    { key: 'share_value', label: 'share value', type: "money", width: '9em', tooltip: true },
    { key: 'share_no', label: 'share no', type: "money", width: '9em', tooltip: true },
    { key: 'total_value', label: 'total value', type: "money", width: '9em', tooltip: true },
    { key: 'purchased_at', label: 'purchased at', type: 'date', width: '8em ', },
    { key: 'created_at', label: 'created at', type: 'date', width: '8em ', },
    // { key: 'actions', label: 'Actions', show: ['edit'] }
],
    automaticCreate = ref<any>({
        "sell shares": {
            title: "Sell Shares",
            componet: SellShares,
            action: () => submitData('sell-shares')

        },
        "transfer shares": {
            title: "transfer shares",
            componet: TransferShares,
            action: () => submitData('transfer-shares')

        },
        "share withdrawal": {
            title: "share withdrawal",
            componet: WithdrawShares,
            action: () => submitData('share-withdrawal')

        },
        "share-transaction-revert": {
            title: "share transaction revert",
            componet: WithdrawShares,
            action: () => submitData('share-transaction-revert', 'Are you sure you want to revert this transaction', 'warning', false)

        },

    })
function navigateToProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', { ...item, id: item?.member_id })
}
function OpenThedrawer(item: any, action = "") {
    statusFilter.value = item
    setTimeout(() => {
        drawer.value.toggleDrawer();
    }, 100);
}
function submitData(end: string = '', des?: string, type?: 'warning', toggle: boolean = true) {
    Confirm({
        title: 'Confirm shares transaction',
        des,
        type,
        confirm: async () => {
            SellSharesApi(`holders/${end}`, formData.value).then(v => {
                if (v?.code == 200)
                    statusFilter.value = "y"
                if (toggle)
                    drawer.value?.toggleDrawer()
                statusFilter.value = ''
            })
        }, cancel: () => { },
    });
}

</script>
