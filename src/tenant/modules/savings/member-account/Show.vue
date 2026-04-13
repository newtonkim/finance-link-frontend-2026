<script setup>
import { DetailsTable, TabelActionButtons } from '@/Global';
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
            { key: 'account_code', label: 'code', copy: true },
            { key: 'phone', label: 'phone' },
            { key: 'member_name', label: 'name' },
            { key: 'type', label: 'type' },
            { key: 'intrest', label: 'intrest' },
            { key: 'opblc', label: 'opening balance', type: "money" },
            { key: 'minBalance', label: 'min balance', type: "money" },
            { key: 'blc', label: 'Account balance', type: "money", },
            { key: 'status', label: 'status', type: "status" },
            { key: 'product', label: 'product' },
            { key: 'created_at', label: 'created', type: "dateTime" },
        ]
    },
    {
        header: 'Account Transactions Details',
        type: 'Table',
        column: [
            { key: 'reference', label: 'reference', sticky: "left" },
            { key: 'total', label: 'total', type: "money" },
            { key: 'charge', label: 'charge', type: "money", sticky: "left" },
            { key: 'amount', label: 'balance', type: "money", sticky: "left" },
            { key: 'type', label: 'type', sticky: "left" },
            { key: 'mode', label: 'mode', type: "status", sticky: "left" },
            { key: 'narration', label: 'narration' },
            { key: 'transfer_by', label: 'transfer By' },
            { key: 'transaction_date', label: 'transaction date', width: "10em" },
            { key: 'created_at', label: 'created at', sticky: "right", width: "10em", type: "dateTime" },
            { key: 'actions', label: 'actions', sticky: "right", },
        ],
        list: []
    }
]
async function prepareTheFeaturesData() {
    loading.value = true
    if (props.data.transactionList)
        props.data.transactionList.forEach(element => {
            columns[1].list.push({ amount: element.amount, total: element.total, charge: element.charge, created_at: element.created_at, "narration": element.narration, transaction_date: element.transaction_date, type: element.type, mode: element.mode, "transfer_by": element.by, reference: element.reference })
        });
    loading.value = false
}
onMounted(async () => {
    // await prepareTheFeaturesData()
})
</script>
<template>
    <div class="h-[90vh] overflow-auto">
        <div v-if="loading">Loading...</div>
        <DetailsTable v-else :data="data" :columns="columns">
            <template #actions="{ item }">
                <div class="flex gap-2 ">
                    <TabelActionButtons :disabled="['true','1',true].includes(item.reversed)" :data="item"
                        @action="() => memebrAccountReversalAmount({ ...item, charge_reversal: true })"
                        :color="['charge-reversal', 'reversed'].includes(item.type) ? 'secondary' : 'default'" icon="Undo"
                        title="charge reversal" />
                    <TabelActionButtons :disabled="['true','1',true].includes(item.reversed)" :data="item"
                        @action="() => memebrAccountReversalAmount(item)"
                        :color="['charge-reversal', 'reversed'].includes(item.type) ? 'secondary' : 'danger'" icon="Undo"
                        title="full reversal" />
                </div>
            </template>
        </DetailsTable>
    </div>
</template>