<script setup lang="ts">
import { ref, watch } from 'vue'
import { Form, Card } from '@/Global'
const emits = defineEmits(['update:form']);
const remount = ref<boolean>(true), formValues = ref([]);

const form = ref([
    {
        label: 'Staff Name',
        name: 'staff_fall_name',
        type: 'text',
        required: true,
        props: { placeholder: 'Enter   Staff Name' },
    },
    {
        label: 'Email',
        name: 'staff_email',
        type: 'email',
        required: true,
        props: { placeholder: 'Enter Email' },
    },

    {
        label: 'Status',
        name: 'status',
        type: 'select',
        required: true,
        options: [
            { name: 'Active', id: 'active' },
            { name: 'Trial', id: 'trial' },
            { name: 'Suspended', id: 'suspended' },
            { name: 'Expired', id: 'expired' },
        ],
        props: { placeholder: 'Select Status' },
    },
    {
        label: 'Role',
        name: 'system_role',
        type: 'select',
        required: true,
        options: [
            { name: 'Supper Admin', id: 'super-admin' },
            { name: 'Manager', id: 'manager' },
            { name: 'Accountant', id: 'accountant' },
            { name: 'Ordinally', id: 'ordinally' },
        ],
        props: { placeholder: 'Select Status' },
    },
    {
        label: 'Password',
        name: 'password',
        type: 'password',
        required: true,
        placeholder: 'Enter Password'
    },
    {
        label: 'Confirm Password',
        name: 'password_confirmation',
        type: 'password',
        required: true,
        placeholder: 'Enter Password'
    },
])

const props = defineProps({
    watcher: {
        type: Object,
        default: {},
        required: false
    }
})

const onFormResults = (fields: any) => {
    const pwd = fields.find((f: any) => f.name === 'password')
    const pconfirm = fields.find((f: any) => f.name === 'password_confirmation')
    if (pwd && pconfirm) {
        pconfirm.value = pwd.value
            ?.replace(/\s+/g, '')
            ?.toLowerCase()

        form.value = fields
    }
    formValues.value = [...new Set([...formValues.value, ...fields])]
}
watch(() => formValues.value, (value) => {
    if (value) {
        emits('update:form', value);
    }
}, { deep: true, immediate: true })
</script>
<template>
    <div class="">
        <Card
            class="border-neutral-100 h-[74vh] dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
            <div v-if="remount">
                <Form v-model:form="form" parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-4 md:gap-6 p-4"
                    @results="onFormResults" />
            </div>
        </Card>
    </div>
</template>