<template>
    <div class="card shadow-sm px-4 h-full bg-white dark:bg-neutral-800 rounded-md" v-if="fields?.length">
        <div class="  mb-6">

            <DetailsTable :data="props.data" :columns="columns" />
        </div>
        <Form :action="data.action" parentStyle="grid  grid-cols-2 gap-3 px-2" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { DetailsTable, Form } from '@/Global'
const emits = defineEmits(['update:form', 'reload']),

    props = defineProps({
        data: {
            type: Object,
            default: {},
        },
    }),
    columns = [{
        header: 'Saving Account Details',
        type: 'Descriptions',
        column: 3,
        list: [
            { key: 'member_name', label: 'memeber name', },
            { key: 'account_code', label: 'account code', copy: true },
            { key: 'product', label: 'product', },
            { key: 'blc', label: 'balance', type: "money" },
            { key: 'type', label: 'type', copy: true },
            { key: 'created_at', label: 'created', tyope: "dateTime" },
        ]
    },
    ],
    fields = ref<any>([]);


function initialize() {
    fields.value = [
        {
            label: 'deposit amount',
            name: 'deposit',
            type: 'money',
            required: true,
            placeholder: 'select a ',
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

            value: props?.data?.payment_mod,

            placeholder: 'Select income account',

            // condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val)
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
            label: 'Transaction Reference',
            name: 'transaction_reference',
            type: 'text',
            required: false,
            placeholder: 'Transaction Reference',
        },
        {
            label: 'deposited by',
            name: 'deposited_by',
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
