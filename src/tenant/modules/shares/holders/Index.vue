<template>
    <TableDrawer :showTableAction="false" ref="drawer"
        :addButtonText="{ text: 'Create/Change Share holder', icon: Plus }" :printTable="true" drawerWidth=" w-2/3"
        :url="tableUrl" state="ShareholderList" :drawerTitle="drawerTitle" :columns="columns">
        <template #header-action>
            <PainPageHeader title="Shares Holders List" dec="Manage all share holders." />
        </template>
        <template #salutation_name="{ item }">
            <span>
                <Button @click="navigateToProfile(item)"
                    class=" font-semibold text-nfuko-action text-sm dark:text-white">
                    <span>{{ item?.salutation_name }}</span>
                </Button>
            </span>
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters"
                @update:modelValue="(e) => { OpenThedrawer(e) }" />
        </template>
        <template #actions="{ item }">
            <div>

            <TabelActionButtons title="full certificate" color="neutral" icon="Printer"
                @action="() => printShareCertificate(item,'print-full-certificate')" />
            <TabelActionButtons title="last certificate" color="info" icon="Printer"
                @action="() => printShareCertificate(item)" />
            </div>

        </template>
        <template #drawer="{ action, data }">
            <component :is="drawerComponet" :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTableHelpers, Confirm, setLocalValues } from '@/Global'
import { shareCenterApi } from '@/tenant/apis/shares';
import { SellShares, TransferShares, WithdrawShares } from '@/tenant/modules/shares/center/index.ts'

const { TranUniShares: SellSharesApi, revertShareTransaction } = shareCenterApi()
import { useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
const router = useRouter();
const { handlePrint } = useTableHelpers({});
const statusFilter = ref('sell shares'), drawer = ref<any>(null),
    drawerTitle = ref('Create Tenant'), filters = ['sell shares', 'transfer shares', 'share withdrawal'],
    tableUrl = computed(() => `/shares/holders/list?status=${statusFilter.value}`)
const drawerComponet = computed(() => automaticCreate.value[statusFilter.value]?.componet)
const formData = ref<any[]>([]), automaticCreate = ref<any>({
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
        action: (data: any) => submitData('share-transaction-revert', 'Are you sure you want to revert this transaction(not yet working)', 'warning', false, data)
    },

})
function submitData(end: string = '', des?: string, type: string = 'warning', toggle: boolean = true, data = null) {
    Confirm({
        title: 'Confirm shares transaction',
        des,
        type,
        confirm: async () => {
            if (end == 'share-transaction-revert') {
                revertShareTransaction(`holders/${end}`, data).then(v => {
                    statusFilter.value = "y"
                    statusFilter.value = ''
                })
                return

            }
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
const columns = [
    { key: 'share_code', label: 'code', sticky: 'left', copy: true, width: '16em' },
    // { key: 'member_type', label: 'Member type' },
    { key: 'salutation_name', label: 'Member', sticky: 'left', },
    { key: 'primary_contact', label: 'phone', },
    { key: 'other_contacts', label: 'Other Contacts', },
    { key: 'share_value', label: 'share value', type: "money", tooltip: true },
    { key: 'share_no', label: 'share no', type: "number", tooltip: true },
    { key: 'total_value', label: 'total value', type: "money", tooltip: true },
    { key: 'purchased_at', label: 'purchased at', type: 'date', width: '8em ', },
    { key: 'created_at', label: 'created at', type: 'date', width: '8em ', },
    { key: 'actions', label: 'Actions', show: ['share'] }
]
function navigateToProfile(item: any) {
    router.push(`/tenant/member/profile`)
    setLocalValues('memberProfile', { ...item, id: item?.member_id })
}
function printShareCertificate(item: any,endpoint='print-certificate') {
    // alert()
    handlePrint({ value: item }, '/shares/holders/'+endpoint)
}
function OpenThedrawer(item: any, action = "") {
    statusFilter.value = item
    setTimeout(() => {
        drawer.value.toggleDrawer();
    }, 100);
}
</script>
