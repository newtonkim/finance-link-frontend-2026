<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { tenantsApi } from '../apis';

import { Form } from '@/Global';
const { create, fetchPositions } = tenantsApi()

const form = reactive({
    payment_number: '',
    phone: '',
    errors: {},
    processing: false,
});
const genderOptions = [
    { id: 'male', name: 'Male' },
    { id: 'female', name: 'Female' },
];

const maritalStatusOptions = [
    { id: 'single', name: 'Single' },
    { id: 'married', name: 'Married' },
];

const staffPositionOptions = [
    { id: 'manager', name: 'Manager' },
    { id: 'teller', name: 'Teller' },
    { id: 'system_admin', name: 'system Admin' },
    { id: 'administrator', name: 'Administrator' },
    { id: 'front_desk', name: 'Front desk' },
];

const fields = [
    {
        label: 'Full Name',
        name: 'full_name',
        type: 'text',
        required: true,
        props: { placeholder: 'Enter Full Name' },
    },

    {
        label: 'Gender',
        name: 'gender',
        type: 'select',
        options: genderOptions,
        required: true,
        props: { placeholder: 'Select Gender' },
    },

    {
        label: 'Email',
        name: 'email',
        type: 'email',
        props: { placeholder: 'Enter Email' },
    },

    {
        label: 'Marital Status',
        name: 'marital_status',
        type: 'select',
        options: maritalStatusOptions,
        props: { placeholder: 'Select Status' },
    },

    {
        label: 'Location',
        name: 'location',
        type: 'textarea',
        props: { placeholder: 'Enter Location' },
    },

    {
        label: 'Staff Position',
        name: 'staff_position',
        type: 'select',
        options: staffPositionOptions,
        required: true,
        props: { placeholder: 'Select Position' },
    },

    {
        label: 'Primary Contact',
        name: 'phone',
        type: 'phone',
        required: true,
        props: { placeholder: 'Enter Contact' },
    },

    {
        label: 'Other Contact',
        name: 'other_contact',
        type: 'phone',
        props: { placeholder: 'Enter Other Contact' },
    },

    {
        label: 'Date of Birth',
        name: 'dob',
        type: 'date',
    },

    {
        label: 'NIN',
        name: 'nin',
        type: 'text',
        props: { placeholder: 'Enter NIN' },
    },

    {
        label: 'Next of Kin',
        name: 'next_of_kin',
        type: 'text',
        props: { placeholder: 'Enter Next of Kin' },
    },

    {
        label: 'Next of Kin Contact',
        name: 'next_of_kin_contact',
        type: 'phone',
        props: { placeholder: 'Enter Contact' },
    },
];
const emits = defineEmits(['update:form']);

watch(
    () => form,
    (newVal) => {
        emits('update:form', newVal);
    },
    { deep: true },
);

onMounted(async () => {
    fetchPositions()
})


</script>

<template>

    <div class="card shadow-md p-4 bg-white dark:bg-neutral-800 rounded-md">
        <Form parentStyle="grid grid-cols-2 s m:grid-cols-1 gap-4 md:gap-6" :fields="fields" v-model:form="form" />
    </div>
</template>