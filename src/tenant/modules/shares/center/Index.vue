<template>
    <TableDrawer :exportItems="exportItems" :automaticCreate="false" ref="drawer" drawerWidth=" w-1/2"
        :show-add-button="false" :url="tableUrl" state="recentShareTransactionList"
        :drawerTitle="automaticCreate?.[statusFilter]?.['title'] ?? automaticCreate?.['title']" :columns="columns"
        @save="saveUser" :showTableAction="true">
        <template #sub-header>
            <AnalysisTile :data="stats" grid-class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3" />
        </template>
        <template #header-action>
            <PainPageHeader title="Shares Center" dec="Manage all share accounts/Recent shares transactions ." />
        </template>
        <template #salutation_name="{ item }">
            <Button @click="navigateToProfile(item)" class="  font-semibold text-nfuko-action text-sm dark:text-white">
                <span>{{ item?.salutation_name }}</span>
            </Button>
        </template>
        <template #searchSideAction>
            <StatusButtonsHorizontal v-memo="[statusFilter]" :filters="filters"
                @update:modelValue="(e) => { OpenThedrawer(e) }" />
        </template>
        <template #actions="{ item }">
            <TabelActionButtons v-if="item?.payment_mode != 'withdrawal' && !item?.reversed" title="revert"
                color="danger" icon="CirclePlus" @action="() => {
                    automaticCreate['share-transaction-revert'].action(item)
                }" />
            <TabelActionButtons v-else title="revert" color="default" icon="CirclePlus" />
        </template>
        <template #drawer="{ action, data }">
            <component :is="drawerComponet" :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { SellShares, TransferShares, WithdrawShares } from '.'
import { Confirm, setLocalValues } from '@/Global'
import { useRouter } from 'vue-router';
import { shareCenterApi } from '@/tenant/apis/shares';
import { pomPinia } from 'septor-store';
const { TranUniShares: SellSharesApi, revertShareTransaction } = shareCenterApi()
const Store = pomPinia() as any;
const router = useRouter(), drawer = ref<any>(null),
    formData = ref<any[]>([]), statusFilter = ref<string>(''),
    filters = ['sell shares', 'transfer shares', 'share withdrawal'],
    tableUrl = computed(() => `/shares/transactions/list?status=${statusFilter.value}`),
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
            action: (data: any) => submitData('share-transaction-revert', 'Are you sure you want to revert this transaction(not yet working)', 'warning', false, data)
        },

    })
const columns = [
    { key: 'member_code', label: 'code', sticky: 'left', copy: true },
    { key: 'salutation_name', label: 'Member', },
    { key: 'reference', label: 'reference', width: '14em', copy: true },
    { key: 'amount', label: 'amount', type: "money" },
    { key: 'charge_amount', label: 'charges', type: "money" },
    { key: 'account_type', label: 'method', tooltip: true, width: '7.6em', },
    { key: 'payment_mode', label: 'type', },
    { key: 'narration', label: 'narration', tooltip: true, width: '14em', },
    { key: 'created_at', label: 'created at', type: 'date', width: '10em', onSearch: { type: 'date-range', } },
    { key: 'actions', label: 'Actions', }
]
const exportItems = ref([
    {
        label: "share Transaction Template",
        action: () => {
            const vl = {
                actionSlot: "share-transaction-template-",
                // componet: 
                title: "share Transaction Template",
            };
            OpenThedrawer("share-transaction-template-");
        },
    },
    {
        label: "share sales Template",
        action: () => {
            const vl = {
                actionSlot: "share-sales-template",
                // componet: 
                title: "share sales Template",
            };
            OpenThedrawer("share-sales-template");
        },
    },

    {
        label: "share dividend Template",
        action: () => {
            const vl = {
                actionSlot: "share-dividend-template",
                title: "share dividend Template",
                // componet: 
            };
            OpenThedrawer("share-dividend-template");
        },
    },


]);
// function OpenThedrawer(item: any, action = "") {
//    statusFilter.value = item
//    alert()
//   automaticCreate.value = { actionSlot: action, ...item };
//   setTimeout(() => {
//     drawer.value.toggleDrawer();
//   }, 100);
// }
function OpenThedrawer(item: any, action = "") {
    statusFilter.value = item
    setTimeout(() => {
        drawer.value.toggleDrawer();
    }, 100);
}
const drawerComponet = computed(() => automaticCreate.value[statusFilter.value]?.componet)
function submitData(end: string = '', des?: string, type: string = 'warning', toggle: boolean = true, data = null) {
    Confirm({
        title: 'Confirm shares transaction',
        des,
        type,
        confirm: async () => {
            if (end == 'share-transaction-revert') {
                statusFilter.value = ''
                revertShareTransaction(`holders/${end}`, data).then(v => {
                    setTimeout(() => {
                        statusFilter.value = "y"
                    },)
                 
                })
                return

            }
            SellSharesApi(`holders/${end}`, formData.value).then(v => {
                if (v?.code == 200){
                    setTimeout(() => {
                        statusFilter.value = " "
                    }, 1000);
                }
                if (toggle)
                    drawer.value?.toggleDrawer()
                setTimeout(() => {
                        statusFilter.value = ''
                }, 1000);
            
            })
        }, cancel: () => { },
    });
}
function saveUser(type: string, data: any) {
    if (automaticCreate.value[statusFilter.value]?.action) automaticCreate.value[statusFilter.value]?.action()
}

 
watch(drawer.value?.drawerOpen, (v) => {
    if (!v) {
        formData.value = [];
        automaticCreate.value = {}
    }
})
function navigateToProfile(item: any) {
    setLocalValues('memberProfile', { ...item, id: item?.member_id })
    router.push(`/tenant/member/profile`)
}

const stats = computed(() => [
    {
        title: 'Share balance',
        value: Store?.recentShareTransactionList?.payload?.share_capitalization?.balance ?? 0,
        trendColor: 'text-emerald-500',
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]',
        type: 'number'
    },
    {
        title: 'Share Capitalization',
        value: Store?.recentShareTransactionList?.payload?.share_capitalization?.open_capital ?? 0,
        trendColor: 'text-emerald-500',
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]',
        type: 'number'

    },
    {
        title: 'Share Price',
        value: Store?.recentShareTransactionList?.payload?.price_now_for_share ?? 0,
        trendColor: 'text-emerald-500',
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]',
        type: 'number'

    },
    {
        title: 'Share Limit',
        value: Store?.recentShareTransactionList?.payload?.share_limit ?? 0,
        trendColor: 'text-emerald-500',
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]',
        type: 'number'

    },
    {
        title: "Total Share Value",
        value: Store?.recentShareTransactionList?.payload?.total_share_value ?? 0,
        trendColor: 'text-emerald-500',
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]',
        type: 'number'


    }, {
        title: 'share Holders',
        value: Store?.recentShareTransactionList?.payload?.total_holder ?? 0,
        trendColor: 'text-emerald-500',
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]',
        type: 'number'
    },
    {
        title: 'Total Shares',
        value: Store?.recentShareTransactionList?.payload?.total_share ?? 0,
        trendColor: 'text-emerald-500',
        bgColor: 'bg-[#f0f9f6]',
        iconColor: 'text-[#2d9d78]',
        type: 'number'
    },

])

</script>
