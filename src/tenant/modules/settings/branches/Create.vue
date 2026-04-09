<template>
    <div class="card shadow-md p-4 py-1 h-full bg-white dark:bg-neutral-800 rounded-md">
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, } from 'vue';
import { Form } from '@/Global';
const emits = defineEmits(['update:form']);
const props = defineProps({
    data: {
        type: Object,
        default: {},
    },
}), fields = ref([
    {
        label: 'Name',
        name: 'branch_name',
        type: 'text',
        required: true,
        placeholder: 'Enter full name'
    },
    {
        label: 'Phone',
        name: 'branch_phone',
        type: 'text',
        required: false,
        placeholder: 'Enter phone number'
    },
    {
        label: 'Email',
        name: 'branch_email',
        type: 'email',
        required: false,
        placeholder: 'Enter email address'
    },
    {
        label: 'Address',
        name: 'branch_address',
        type: 'text',
        required: false,
        placeholder: 'Enter address'
    },
    {
        label: 'Manager',
        name: 'in_charge',
        url: 'global/member-dropdown-list',
        type: 'select',
        dataOnMount: true,
        required: true,
        placeholder: 'Select manager'
    },
    {
        label: 'Active Status',
        name: 'is_active',
        type: 'checkbox',
        required: false,
        value: true
    },
]);
async function promtValueOnUpdate() {
    if (props.data) {
        const data = { branch_name: props.data.name, branch_phone: props.data.phone, branch_email: props.data.branch_email, address: props.data.address, in_charge: props.data.in_charge, is_active: props.data.is_active }
        await Object.entries(data).forEach(([key, value]) => {
            const field = fields.value.find((f: any) => f.name === key)
            if (field) field.value = value
        });
    }
}
onMounted(() => promtValueOnUpdate())
</script>