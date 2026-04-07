<script setup>
import {DetailsTable,TabelActionButtons} from '@/Global';
import { memberAccountApi } from '@/tenant/apis'


import { onMounted, ref } from 'vue'
const { memebrAccountReversalAmount } = memberAccountApi()
const loading = ref(true)
const props = defineProps({
    data: {
        type: Object,
        required: true
    }
})
const columns = [
    {
        header: 'Saving Account Details',
        type: 'Descriptions',
        column: 3,
        list: [
            { key: 'account_code', label: 'code',copy:true },
            { key: 'phone', label: 'phone' },
            { key: 'member_name', label: 'name' },
            { key: 'type', label: 'type' },
            { key: 'intrest', label: 'intrest' },
            { key: 'opblc', label: 'opening balance',type:"money" },
            { key: 'minBalance', label: 'min balance',type:"money" },
            { key: 'blc', label: 'Account balance',type:"money", },
            { key: 'status', label: 'status' ,type:"status"},
            { key: 'product', label: 'product' },
            { key: 'created_at', label: 'created',type:"dateTime" },
        ]
    },
    {
        header: 'Account Transactions Details',
        type: 'Table',
        column: [
            { key: 'type', label: 'type',sticky:"left" },
            { key: 'amount', label: 'amount',type:"money",sticky:"left" },
            { key: 'mode', label: 'mode',type:"status",sticky:"left" },
            { key: 'reference', label: 'reference',sticky:"left" },
            { key: 'narration', label: 'narration' },
            { key: 'ntransfer Byarration', label: 'transfer By' },
            { key: 'transaction_date', label: 'transaction date',width:"10em" },
            { key: 'created_at', label: 'created at',sticky:"right",width:"10em",type:"dateTime" },
            { key: 'actions', label: 'actions',sticky:"right",width:"10em",  },
        ],
        list: []
    }
]
async function prepareTheFeaturesData() {
    loading.value = true
    if (props.data.transactionList)
        props.data.transactionList.forEach(element => {
            columns[1].list.push({amount:element.amount,created_at:element.created_at,"narration":element.narration,transaction_date:element.transaction_date, type: element.type, mode: element.mode,"transfer By":element.by,reference:element.reference })
        });
    loading.value = false
}
onMounted(async () => {
    await prepareTheFeaturesData()
})
</script>

<template>
   <div class="h-[90vh] overflow-auto">
     <div v-if="loading">Loading...</div>
    <DetailsTable v-else :data="data" :columns="columns" >
        <template #actions="{ item }">
            <TabelActionButtons :disabled="item.type=='reversed'" :data="item" @action="() => memebrAccountReversalAmount(item)" :color="item.type=='reversed'?'secondary':'danger'" icon="Undo" title="reversal"/>
            <!-- <TabelActionButtons :disabled="item.type!='reversed'" :data="item" @action="() => memebrAccountReversalAmount(item)" color="danger" icon="Undo" title="reversal"/> -->
        </template>
    </DetailsTable>
   </div>
</template>