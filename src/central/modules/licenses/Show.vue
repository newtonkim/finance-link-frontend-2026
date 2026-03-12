<script setup>
import Details from '@/Global/DetailsTable/Details.vue';
import { onMounted, ref } from 'vue'
const loading = ref(true)

//  "id": "019ce19b-6f46-7243-bec7-c2cc655fd9ce",
//             "tenant_name": "Melissa Clayton",
//             "starts": "2026-03-12",
//             "expires": "2028-03-12",
//             "grace_ends": null,
//             "status": "active",
//             "created_at": "2026-03-12 10:33:06",
//             
//             "billing_type": null,
//             "features": null,
//             "plan_slug": null,
//             "cost": null,
//             "plan_name": "premium"

const props = defineProps({
    data: {
        type: Object,
        required: true
    }
})
const columns = [
    {
        header: 'Plan Details',
        type: 'Descriptions',
        column: 3,
        list: [
            { key: 'status', label: 'status' },
            { key: 'plan_name', label: 'name' },
            { key: 'tenant_name', label: 'Tenant Name' },
            { key: 'plan_slug', label: 'slug' },
            { key: 'billing_type', label: 'type' },
            { key: 'cost', label: 'cost' },
            { key: 'mx_mbrs', label: 'members' },
            { key: 'mxusrs', label: 'users' },
            { key: 'starts', label: 'starts' },
            { key: 'expires', label: 'expires' },
            { key: 'grace_ends', label: 'grace ends' },
            { key: 'created_at', label: 'Created Date', },
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
    if(props.data.features)
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
    <div v-if="loading">Loading...</div>
    <Details v-else :data="data" :columns="columns" />


</template>