<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { Form } from '@/Global';
const emits = defineEmits(['update:form']);
const OptionList = reactive({
    memberTypeOptions: [{ id: 'new_member', name: 'New Member' }, { id: 'existing_member', name: 'Existing Member' }],
    salutationOptions: [{ id: 'Mr', name: 'Mr' }, { id: 'Mrs', name: 'Mrs' }, { id: 'Ms', name: 'Ms' }, { id: 'Dr', name: 'Dr' }, { id: 'Prof', name: 'Prof' }],
    genderOptions: [{ id: 'male', name: 'Male' }, { id: 'female', name: 'Female' }, { id: 'other', name: 'Other' }],
    maritalOptions: [{ id: 'single', name: 'Single' }, { id: 'married', name: 'Married' }, { id: 'divorced', name: 'Divorced' }, { id: 'widowed', name: 'Widowed' }]
})
const loading = ref(true)
const fields = ref([
    {
        label: 'Member type',
        name: 'member_type',
        type: 'select',
        required: true,
        placeholder: 'Search member type',

        options: OptionList.memberTypeOptions
    },
    {
        label: 'Full Name',
        name: 'full_name',
        type: 'text',
        required: true,
        placeholder: 'Enter Full Name',
    },
    {
        label: 'Salutation',
        name: 'Salutation',
        type: 'select',
        required: true,
        placeholder: 'Search Salutation',

        options: OptionList.salutationOptions
    },
    {
        label: 'gender',
        name: 'gender',
        type: 'select',
        required: true,
        placeholder: 'Search gender',

        options: OptionList.genderOptions
    },
    {
        label: 'Date Of Birth',
        name: 'date_of_birth',
        type: 'datec',
        required: true,
        props: { placeholder: 'Select Start & End Dates' },
    },
    {
        label: 'Primary Contact',
        name: 'primary_contact',
        type: 'phone',
        required: true,
        placeholder: 'Enter Primary Contact',
    },
    {
        label: 'Other Contacts',
        name: 'other_contacts',
        type: 'phone',
        required: true,
        placeholder: 'Enter Other Contacts',
    },
    {
        label: 'Mobile Money Number',
        name: 'mobile_money_number',
        type: 'phone',
        required: true,
        placeholder: 'Enter Primary Contact',
    },
    {
        label: 'Email',
        name: 'email',
        type: 'text',
        required: true,
        placeholder: 'Enter Email',
    },
    {
        label: 'NATIONAL ID (NIN)',
        name: 'national_id',
        type: 'phone',
        required: true,
        placeholder: 'Enter Primary Contact',
    },
    {
        label: 'Marital Status',
        name: 'marital_status',
        type: 'select',
        required: true,
        options: OptionList.maritalOptions,
        placeholder: 'Enter Marital Status',
    },
    {
        label: 'Nationality',
        name: 'nationality',
        type: 'nationality',
        required: true,
        placeholder: 'Enter Nationality',
    },
    {
        label: 'Address',
        name: 'address',
        type: 'textarea',
        required: true,
        placeholder: 'Enter Address',
    },
    {
        label: 'prifile picture',
        name: 'profile_picture',
        type: 'prifile',
        required: true,
        placeholder: 'Enter prifile picture',
    },
    {
        label: 'Next of Kin',
        name: 'next_of_kin',
        type: 'text',
        required: true,
        placeholder: 'Enter Next of Kin',
    },
    {
        label: 'Next of Kin Contact',
        name: 'next_of_kin_contact',
        type: 'phone',
        required: true,
        placeholder: 'Enter Next of Kin Contact',
    },
    {
        label: 'Primary Contact',
        name: 'primary_contact',
        type: 'phone',
        required: true,
        placeholder: 'Enter Primary Contact',
    },
    {
        label: 'inital deposit',
        name: 'inital_deposit',
        type: 'number',
        required: true,
        placeholder: 'Select Status',
    },
    {
        label: 'joined date',
        name: 'joined_date',
        type: 'text',
        required: true,
        placeholder: 'Referred by',
    },
    {
        label: 'referred by',
        name: 'referred_by',
        type: 'select',
        required: true,
        url: 'staff/users-drop-down',
        placeholder: 'Referred by',
        dataOnMount: true,
    },
      {
        label: 'Role',
        name: 'system_role',
        type: 'select',
        required: true,
        url: 'staff/roles-drop-down', 
        dataOnMount: true,
        props: { placeholder: 'Select Status' },
    },
]);
const props = defineProps({
    data: {
        type: Object,
        default: {},
    },
})
async function promtValueOnUpdate() {
    loading.value = true
    if (props.data) {
        const data = { tenant_id: props.data.tenant_id, plan: props.data.plan_id, date: [props.data.starts, props.data.expires], status: props.data.status }
        await Object.entries(data).forEach(([key, value]) => {
            const field = fields.value.find((f: any) => f.name === key)
            if (field) field.value = value
        });
        if (props?.data?.id) {
            fields.value = [...fields.value, {
                name: 'id',
                type: 'hidden',
                value: props.data.id,
                required: true,
            }]
        }
    }
    loading.value = false
}
onMounted(() => {
    promtValueOnUpdate()
})
</script>
<template>
    <div class="card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md">
        <span v-if='loading'></span>
        <Form :action="data?.action" v-else parentStyle="grid  grid-cols-2 gap-4 md:gap-6" v-model:form="fields" />
    </div>
</template>