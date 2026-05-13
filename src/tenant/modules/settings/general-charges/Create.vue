<template>
    <div class="card shadow-md px-4 py-3 bg-white dark:bg-neutral-800 rounded-md" style="overflow: auto;height: 88%;">
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-3" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Form } from '@/Global'
import { savingsProductsApi } from '@/tenant/apis/savingsProducts/api'
import { APPLICATION_OPTIONS, CHARGE_TYPE_OPTIONS, WHERE_TO_APPLY_OPTIONS, INTERVAL_TYPE_OPTIONS, IS_FINE_OPTIONS, IS_REVENUE_OPTIONS } from '../constants'
const props = defineProps({
    data: {
        type: Object,
        default: {},
    },
})
const fields = ref<any[]>([
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
    // Saving products
    {
        label: 'Saving Products',
        name: 'saving_product_ids',
        type: 'multi-select',
        dependsOn: {
            field: 'application',
            value: 'on_registration',
        },
        options: [],
        placeholder: 'Choose saving products',
    },
    // Loan products
    {
        label: 'Loan Products',
        name: 'loan_product_ids',
        type: 'multi-select',
        dependsOn: {
            conditions: [
                { field: 'application', value: 'on_loan_application' },
                { field: 'where_to_apply', value: 'loans' },
            ],
            operator: 'or',
        },
        url: 'global/loan-products',
        dataOnMount: true,
        placeholder: 'Choose loan products',
    },
    // Charge type
    {
        label: 'Charge Type',
        name: 'charge_type',
        type: 'select',
        options: CHARGE_TYPE_OPTIONS,
        placeholder: 'Select type',
        change: (val: string) => {
            const amountField = fields.value.find((f: any) => f.name === 'amount')
            if (!amountField) return
            if (val === 'percentage') {
                amountField.label = 'Percentage (%)'
                amountField.placeholder = 'Enter percentage (0 - 100)'
            } else {
                amountField.label = 'Amount'
                amountField.placeholder = 'Enter amount'
            }
        },
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
        dataOnMount: true,
        options: [],
        placeholder: 'Select income account',
        condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val)
    },
])
// Prefill (edit mode)
function promtValueOnUpdate() {
    if (!props.data) return
    Object.entries(props.data).forEach(([key, value]) => {
        const field = fields.value.find((f: any) => f.name === key)
        if (field) (field as any).value = value
    })
}

async function fetchSavingProducts() {
    try {
        const res = await savingsProductsApi.list()
        const data = res.data?.data ?? res.data ?? []
        const field = fields.value.find((f: any) => f.name === 'saving_product_ids')
        if (field) field.options = Array.isArray(data)
            ? data.map((p: any) => ({ id: p.id, name: p.name ?? `Product ${p.id}` }))
            : []
    } catch {}
}

onMounted(() => {
    promtValueOnUpdate()
    fetchSavingProducts()
})
</script>