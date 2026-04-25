<template>
    <TableDrawer :automaticCreate="false" ref="drawer" :printTable="true" drawerWidth=" w-1/2" :show-add-button="false"
        :url="tableUrl" state="recentShareTransactionList" :drawerTitle="automaticCreate?.[statusFilter]?.['title']"
        :columns="columns" @save="saveUser" :showTableAction="true">
        <template #header-action>
            <PainPageHeader title="Shares Center" dec="Manage all share accounts/Recent shares transactions ." />
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
        <template #actions>
            <TabelActionButtons title="revert" color="danger" icon="CirclePlus" @action="() => { }" />
        </template>
        <template #drawer="{ action, data }">
            <component :is="drawerComponet" :data="{ ...data, action }" v-model:form="formData" />
        </template>
    </TableDrawer>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { SellShares, TransferShares, WithdrawShares } from '.'
import { setLocalValues } from '@/Global'
import { useRouter } from 'vue-router';
import { shareCenterApi } from '@/tenant/apis/shares';
const { TranUniShares: SellSharesApi } = shareCenterApi()
const router = useRouter(), drawer = ref<any>(null),
    formData = ref<any[]>([]), statusFilter = ref<string>(''),
    filters = ['sell shares', 'transfer shares', 'share withdrawal'],
    tableUrl = computed(() => `/shares/transactions/list?status=${statusFilter.value}`),
    automaticCreate = ref<any>({
        "sell shares": {
            title: "Sell Shares",
            componet: SellShares,
            action: () => {
                submitData('holders/sell-shares')
            }
        },
        "transfer shares": {
            title: "transfer shares",
            componet: TransferShares,
            action: () => {
                submitData('holders/transfer-shares')
            }
        },
        "share withdrawal": {
            title: "share withdrawal",
            componet: WithdrawShares,
            action: () => {
                submitData('holders/share-withdrawal')
            }
        },

    })

function submitData(end: string = '') {
    SellSharesApi(end, formData.value).then(v => {
        if (v?.code == 200)
        statusFilter.value = "y"
            drawer.value?.toggleDrawer()
        statusFilter.value = ''
    })
}
function saveUser(type: string, data: any) {
    if (automaticCreate.value[statusFilter.value]?.action) automaticCreate.value[statusFilter.value]?.action()

}
const columns = [
    { key: 'member_code', label: 'code', sticky: 'left', width: '14em', },
    { key: 'salutation_name', label: 'Member', },
    { key: 'reference', label: 'reference', width: '14em', copy: true },
    { key: 'amount', label: 'amount', type: "money" },
    { key: 'charge_amount', label: 'charges', type: "money" },
    { key: 'payment_mode', label: 'method', },
    { key: 'narration', label: 'narration', },
    { key: 'actions', label: 'Actions', }
]
const drawerComponet = computed(() => automaticCreate.value[statusFilter.value]?.componet)
function OpenThedrawer(item: any, action = "") {
    statusFilter.value = item
    setTimeout(() => {
        drawer.value.toggleDrawer();
    }, 100);
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
</script>
