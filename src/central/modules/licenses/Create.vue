<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';
import { Form } from '@/Global';
const emits = defineEmits(['update:form']);
const planSearch = ref('');
const planOptions = [
    { name: 'Basic', id: 'basic' },
    { name: 'Standard', id: 'standard' },
    { name: 'Premium', id: 'premium' },
];

const filteredPlans = computed(() => {
    if (!planSearch.value.trim()) return planOptions;
    const q = planSearch.value.toLowerCase();
    return planOptions.filter(o => o.label.toLowerCase().includes(q));
});
const form = reactive({
    full_name: '',
    plan: '',
    date: { start: '', end: '' },
    status: '',
    payment_number: '',
    phone: '',
    errors: {},
    processing: false,
});

const statusOptions = [
    { name: 'Active', id: 'active' },
    { name: 'Trial', id: 'trial' },
    { name: 'Suspended', id: 'suspended' },
    { name: 'Expired', id: 'expired' },
];
const fields = ref([
    {
        label: 'Select Tenant',
        name: 'full_name',
        type: 'select',
        required: true,
        placeholder: 'Search Full Name/ Email/ Phone Number',
        remote: true,
        url: "central/licenses/licenses-drop-down",
    },
    {
        label: 'Select Plan',
        name: 'plan',
        type: 'select',
        required: true,
        options: filteredPlans,
        props: { placeholder: 'Select a Plan' },
    },
    {
        label: 'Starts At / Expires At',
        name: 'date',
        type: 'datec',
        required: true,
        range: true,
        'multi-calendars': true,
        props: { placeholder: 'Select Start & End Dates' },
    },
    {
        label: 'Select Status',
        name: 'status',
        type: 'select',
        required: true,
        options: statusOptions,
        props: { placeholder: 'Select Status' },
    },
]);
watch(
    form,
    (newVal) => {
        emits('update:form', newVal);
    },
    { deep: true }
);
</script>

<template>
    <div class="card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md">
        <Form parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />

    </div>
</template>