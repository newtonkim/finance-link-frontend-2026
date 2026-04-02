<template>
    <div class="card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md" style="overflow: auto;height: 88%;">
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Form } from '@/Global'
import { APPLICATION_OPTIONS, CHARGE_TYPE_OPTIONS, WHERE_TO_APPLY_OPTIONS, INTERVAL_TYPE_OPTIONS, IS_FINE_OPTIONS, IS_REVENUE_OPTIONS } from '../constants'
const props = defineProps({
    data: {
        type: Object,
        default: {},
    },
})
const fields = ref([
    {
        label: 'Is it a revenue',
        name: 'is_revenue',
        type: 'select',
        required: true,
        options: IS_REVENUE_OPTIONS,
        placeholder: 'Select option',
    },
    {
        label: 'Charge Name',
        name: 'name',
        type: 'text',
        required: true,
        placeholder: 'Enter charge name',
    },
    {
        label: 'Application',
        name: 'application',
        type: 'select',
        required: true,
        options: APPLICATION_OPTIONS,
        placeholder: 'Select application',
    },
    {
        label: 'Applies To',
        name: 'where_to_apply',
        type: 'select',
        options: WHERE_TO_APPLY_OPTIONS,
        placeholder: 'Select where to apply',
    },
    // Saving products
    {
        label: 'Saving Products',
        name: 'saving_product_ids',
        type: 'multi-select',
        dependsOn: {
            field: 'application',
            value: 'on_registration',
        },
        url: "global/savings-products",
        placeholder: 'Choose saving products',
    },
    // Loan products
    {
        label: 'Loan Products',
        name: 'loan_product_ids',
        type: 'multi-select',
        dependsOn: {
            field: 'application',
            value: 'on_loan_application',
        },
        url: "global/loan-products",
        placeholder: 'Choose loan products',
    },
    // Charge type
    {
        label: 'Charge Type',
        name: 'charge_type',
        type: 'select',
        options: CHARGE_TYPE_OPTIONS,
        dependsOn: {
            field: 'application',
            value: 'on_loan_application',
        },
        placeholder: 'Select type',
    },
    // Amount
    {
        label: 'Amount',
        name: 'amount',
        type: 'number',
        required: true,
        placeholder: 'Enter amount',
    },
    // Interval type
    {
        label: 'Interval Type',
        name: 'interval_type',
        type: 'select',
        options: INTERVAL_TYPE_OPTIONS,
        dependsOn: {
            field: 'application',
            value: 'other',
        },
    },
    // Interval value
    {
        label: 'Interval',
        name: 'interval',
        type: 'number',
        dependsOn: {
            field: 'application',
            value: 'other',
        },
        placeholder: 'Enter interval',
    },
    // Is fine
    {
        label: 'Is Fine?',
        name: 'is_fine',
        type: 'select',
        options: IS_FINE_OPTIONS,
        dependsOn: {
            field: 'where_to_apply',
            value: 'loans',
        },
    },
    // Credit account
    {
        label: 'Credit Account',
        name: 'credit_account_id',
        type: 'select',
        url: "global/chart-of-accounts",
        data: { account_type: 'INCOME' },
        options: [],
        placeholder: 'Select account',
        
        condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val)// dispaly if application is on_registration or on_loan_application
        // condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val)// dispaly if application is on_registration or on_loan_application
    },
])
// Prefill (edit mode)
function promtValueOnUpdate() {
    if (!props.data) return
    Object.entries(props.data).forEach(([key, value]) => {
        const field = fields.value.find((f: any) => f.name === key)
        if (field) field.value = value
    })
}
onMounted(() => {
    promtValueOnUpdate()
})
</script>