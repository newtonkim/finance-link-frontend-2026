<script setup>
import { DetailsTable } from '@/Global';
const props = defineProps({
    data: {
        type: Object,
        required: true
    }
}), columns = [
    {
        header: 'charge  Details',
        type: 'Descriptions',
        column: 1,
        list: [
            { key: 'charge_code', label: 'code', sticky: 'left', copy: true, width: '10em', },
            { key: 'charge_name', label: 'charge', sticky: 'left', },
            { key: 'charge_amount', label: 'amount', sticky: 'left', copy: true, width: '10em', },
            { key: 'charge_applys', label: 'applys', sticky: 'left', },
            { key: 'products', label: 'products', sticky: 'left', },
            { key: 'charge_type', label: 'type', sticky: 'left', },
            { key: 'is_revenue', label: 'revenue', sticky: 'left', },
            { key: 'created_at', label: 'created at', width: '14em ', type: 'date' },
        ]
    },
]
</script>
<template>
    <DetailsTable :data="data" :columns="columns" />
</template>