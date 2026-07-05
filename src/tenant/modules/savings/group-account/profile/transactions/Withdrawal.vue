<template>
    <div class="card shadow-sm px-4 h-full bg-white dark:bg-neutral-800 rounded-md" v-if="fields?.length">
        <div class="  mb-6">
            <DetailsTable :data="props.data" :columns="columns" />
        </div>
        <Form :action="data.action" parentStyle="grid  grid-cols-2 gap-4 px-2 md:gap-6" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { DetailsTable, Form } from '../../../../../../Global/index'
const emits = defineEmits(['update:form']),
    props = defineProps({
        data: {
            type: Object,
            default: {},
        },
    }),
    columns = [{
        header: 'Saving Account Details',
        type: 'Descriptions',
        column: 2,
        list: [
            { key: 'account_code', label: 'account code', copy: true },
            { key: 'product', label: 'product', },
            { key: 'blc', label: 'balance', type: "money" },
            { key: 'created_at', label: 'created', tyope: "dateTime" },
        ]
    },
    ],
    fields = ref<any>([]);
const paymentModeOptions = [
    { id: 'cash', name: 'Cash' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'mobile_money', name: 'Mobile Money' },
    { id: 'cheque', name: 'Cheque' },
    { id: 'teller', name: 'Teller' },
    { id: 'ussd', name: 'USSD' },
];
function initialize() {
    fields.value = [
        {
            label: 'withdraw amount',
            name: 'amount',
            type: 'money',
            required: true,
            placeholder: 'Amount to withdraw',
            // disabled: true,
        },
        {
            label: 'transaction date ',
            name: 'transaction_date',
            type: 'datec',
            maxDate: new Date(),

            required: false,
            placeholder: 'Amount to withdraw',
            value: new Date().toISOString().split('T')[0],

        },
        {
            label: 'withdrawal member',
            name: 'member_id',
            type: 'select',
            required: true,
            url: `group-account-savings/active-group-member-dropdown-list?group_id=${props.data?.group_id}`,
            placeholder: 'Enter member name',
        },
        {
            label: 'withdrawal by',
            name: 'deposited_by',
            type: 'text',
            // required: true, 
            placeholder: 'Enter name of person making the deposit',
        },
        {
            label: 'payment mode (Debit Account)',
            name: 'payment_mode_id',
            type: 'select',
            url: "global/chart-of-accounts",
            data: { account_type: 'ASSET' },
            dataOnMount: true,
            options: [],
            required: true,

            // selectDefaultIndex: 0,
            placeholder: 'Select income account',

        },
        {
            label: 'Transaction Reference',
            name: 'transaction_reference',
            type: 'text',
            required: false,
            placeholder: 'Transaction Reference',
        },
        {
            label: 'withdrawal by',
            name: 'withdrawal_by',
            type: 'text',
            required: false,
            placeholder: 'who withdrawed',
        },
        {
            label: 'narration',
            name: 'narration',
            type: 'textarea',
            required: false,
            placeholder: 'Amount to withdraw reason',
        },
    ]
}
watch(fields, (val) => {
    emits('update:form', val)
})
onMounted(() => {
    initialize()
})
</script>
