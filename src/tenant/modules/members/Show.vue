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
    column: 3,
    list: [
        { key: 'salutation_name', label: 'Salutation Name' },
        { key: 'id', label: 'ID' },
        { key: 'memeber_code', label: 'Member Code' },
        { key: 'member_type', label: 'Member Type' },
        { key: 'full_name', label: 'Full Name' },
        { key: 'profile', label: 'Profile' },
        { key: 'NIN', label: 'NIN' },
        { key: 'joined_date', label: 'Joined Date',type: 'date' },
        { key: 'email', label: 'Email' },
        { key: 'sex', label: 'Sex' },
        { key: 'primary_contact', label: 'Primary Contact' },
        { key: 'other_contacts', label: 'Other Contacts' },
        { key: 'marital_status', label: 'Marital Status' },
        { key: 'created_at', label: 'Created At' },
        { key: 'initial_deposit', label: 'Initial Deposit' },
        { key: 'updated_at', label: 'Updated At' },
        { key: 'salutation', label: 'Salutation' },
        { key: 'gender', label: 'Gender' },
        { key: 'o_contact', label: 'Other Contact' },
        { key: 'MM_number', label: 'Mobile Money Number' },
        { key: 'dob', label: 'Date of Birth' },
        { key: 'address', label: 'Address' },
        { key: 'nokin', label: 'Next of Kin' },
        { key: 'next_contact', label: 'Next Contact' },
        { key: 'inital_deposit', label: 'Initial Deposit (Duplicate)' },
        { key: 'shareholder', label: 'Shareholder' },
        { key: 'opb', label: 'OPB' },
        { key: 'status', label: 'Status' },
        { key: 'from ', label: 'From' },
        { key: 'referred_by', label: 'Referred By' },
        { key: 'created_by', label: 'Created By' },
        { key: 'role_name', label: 'Role Name' }
    ]
},
    {
        header: 'Transaction List Details',
        type: 'Table',
        column: [
            // { key: 'feature', label: 'feature' },
          
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