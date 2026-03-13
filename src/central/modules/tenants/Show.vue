<script setup>
import { DetailsTable } from '@/Global/DetailsTable';
import { onMounted, ref } from 'vue';
const loading = ref(true)
const props = defineProps({
    data: {
        type: Object,
        required: true
    }
});
const columns = [
    {
        header: "Sacco Details",
        type: "Descriptions",
        column: 3,
        list: [
            { key: "sacco_name", label: "Sacco Name" },
            { key: "sacco_domain", label: "Sacco Domain" },
            { key: "host_domain", label: "Host Domain" },
            { key: "storage", label: "Database" },
            { key: "status", label: "Status", type: "status" },
            { key: "cogs", label: "Cogs" },
            { key: "plan_name", label: "Plan" },
            { key: "plan_slug", label: "Plan Slug" },
            { key: "mxusrs", label: "Users" },
            { key: "mx_mbrs", label: "Members" },
            { key: "billing_type", label: "Billing Type" },
            { key: "cost", label: "Cost" },
            { key: "created_at", label: "Created At" }
        ]
    },
    {
        header: 'Features Details',
        type: 'Table',
        column: [
            { key: 'feature', label: 'feature' },
            { key: 'accessbility', label: 'accessbility' },
        ],
        list: []
    }
]
async function prepareTheFeaturesData() {
    loading.value = true
    if (props.data.features) 
        for (const key in props.data.features) {
            columns[1].list.push({ feature: key, accessbility: key })
    }
    loading.value = false
}
onMounted(async () => {
    await prepareTheFeaturesData()
})
</script>
<template>
    <DetailsTable v-if="!loading" :data="props.data" :columns="columns" />
</template>