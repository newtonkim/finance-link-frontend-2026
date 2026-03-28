<script setup>
import { DetailsTable } from '@/Global';
import { onMounted, ref } from 'vue'
const loading = ref(true)
const props = defineProps({
    data: {
        type: Object,
        required: true
    }
})
const columns = [
    {
        header: 'Group Saving Account Details',
        type: 'Descriptions',
        column: 3,
        list: [
            { key: 'group_name', label: 'group name' },
            { key: 'group_code', label: 'code',copy:true },
            { key: 'blc', label: 'Account balance', type: "money" },
            { key: 'status', label: 'status', type: "status" },
            { key: 'total_members', label: 'total members', type: "number" },
            { key: 'phone', label: 'phone' },
            { key: 'phone2', label: 'phone2' },
            { key: 'dcreated', label: 'joined Date' },
            { key: 'location', label: 'location' },
            { key: 'created_by', label: 'created_by' },
            { key: 'desc', label: 'description' },
            { key: 'created_at', label: 'created', type: "dateTime" },
        ]
    },
    {
        header: 'Group Members',
        type: 'Table',
        column: [
            { key: 'group_code', label: 'group code', copy:true },
            { key: 'name', label: 'name', sticky: "left" },
            { key: 'phone', label: 'phone', sticky: "left" },
            { key: 'product', label: 'product' },
            { key: 'member_code', label: 'memebr code',   },
            { key: 'created_at', label: 'created at',  width: "10em", type: "dateTime", sticky: "right" },
        ],
        list: []
    }
]
async function prepareTheFeaturesData() {
    loading.value = true
    if (props.data.memebers)
        props.data.memebers.forEach(element => {
            columns[1].list.push({ created_at: element?.created_at, "phone": element?.phone, product: element?.product, 'group_code': element?.member_group_code, member_code: element?.member_code, name: element?.member_name })
        });
    loading.value = false
}
onMounted(async () => {
    await prepareTheFeaturesData()
})
</script>
<template>
    <div v-if="loading">Loading...</div>
    <DetailsTable v-else :data="data" :columns="columns" />
</template>