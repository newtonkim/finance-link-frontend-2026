<script setup>
import { DetailsTable } from '@/Global';
import { ref } from 'vue'
const props = defineProps({
    data: {
        type: Object,
        required: true
    }
})
const columns = [
    {
        header: 'Branch Details',
        type: 'Descriptions',
        column: 1,
        list: [
            { key: 'name', label: 'name', sticky: 'left', },
            { key: 'branch_code', label: 'code' },
            { key: 'created_at', label: 'created_at', },
            { key: 'contact_number', label: 'phone' },
            { key: 'created_at', label: 'created', type: "dateTime" },
            { key: 'manager', label: 'manager', },
        ]
    },
]

</script>

<template>
    <DetailsTable :data="data" :columns="columns" />
</template>