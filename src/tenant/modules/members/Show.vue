<script setup>
import Details from '@/Global/DetailsTable/Details.vue';
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
    header: 'Plan Details',
    type: 'Descriptions',
    column: 5,
    list: [
        { key: 'memeber_code', label: 'Member Code',copy:1 },
        { key: 'salutation_name', label: 'Salutation Name' },
        { key: 'member_type', label: 'Member Type' },
        { key: 'profile', label: 'Profile' },
        { key: 'NIN', label: 'NIN' },
        { key: 'email', label: 'Email' },
        { key: 'sex', label: 'Sex' },
        { key: 'primary_contact', label: 'Primary Contact' },
        { key: 'other_contacts', label: 'Other Contacts' },
        { key: 'marital_status', label: 'Marital Status' },
        { key: 'MM_number', label: 'Mobile Money Number' },
        { key: 'dob', label: 'Date of Birth' },
        { key: 'address', label: 'Address' },
        { key: 'nokin', label: 'Next of Kin' },
        { key: 'next_contact', label: 'Next Contact' },
        { key: 'shareholder', label: 'Shareholder' },
        { key: 'status', label: 'Status', type:"status" },
        { key: 'from ', label: 'From' },
        { key: 'referred_by', label: 'Referred By' },
        { key: 'created_by', label: 'Created By' },
        { key: 'joined_date', label: 'Joined Date',type: 'date' },
        { key: 'created_at', label: 'Created At' },
        { key: 'updated_at', label: 'Updated At' },
    ]
},
    {
        header: 'Transaction List Details',
        type: 'Table',
        column: [
          
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
    <!-- {{ data }} -->
    <div v-if="loading">Loading...</div>
    <Details v-else :data="data" :columns="columns" />
</template>