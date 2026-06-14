<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Form, Card } from '@/Global'

const emits = defineEmits(['update:form'])

const props = defineProps({
    watcher: {
        type: Object,
        default: () => ({}),
        required: false,
    },
})

const formReady = ref(false)

const form = ref<any[]>([
    {
        label: 'Staff Name',
        name: 'staff_fall_name',
        type: 'text',
        required: true,
        props: { placeholder: 'Enter Staff Name' },
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
            { name: 'Active',    id: 'active' },
            { name: 'Trial',     id: 'trial' },
            { name: 'Suspended', id: 'suspended' },
            { name: 'Expired',   id: 'expired' },
        ],
        props: { placeholder: 'Select Status' },
    },
    {
        label: 'Role',
        name: 'system_role',
        type: 'select',
        required: true,
        url: 'central/staff/roles-drop-down',
        props: { placeholder: 'Select Role' },
    },
    {
        label: 'Password',
        name: 'password',
        type: 'password',
        required: true,
        placeholder: 'Enter Password',
    },
    {
        label: 'Confirm Password',
        name: 'password_confirmation',
        type: 'password',
        required: true,
        placeholder: 'Confirm Password',
    },
])

function prefillForEdit(data: Record<string, any>) {
    const fieldMap: Record<string, string> = {
        staff_fall_name: 'staff_fall_name',
        staff_email:     'staff_email',
        status:          'status',
        system_role:     'system_role',
    }

    Object.entries(fieldMap).forEach(([apiKey, formKey]) => {
        const val = data[apiKey]
        if (val === undefined || val === null) return
        const field = form.value.find((f: any) => f.name === formKey)
        if (field) field.value = val
    })

    // Password is optional on edit
    const pwdField   = form.value.find((f: any) => f.name === 'password')
    const pwdConfirm = form.value.find((f: any) => f.name === 'password_confirmation')
    if (pwdField)   { pwdField.required = false;   pwdField.props   = { placeholder: 'Leave blank to keep current' } }
    if (pwdConfirm) { pwdConfirm.required = false; pwdConfirm.props = { placeholder: 'Leave blank to keep current' } }

    // Hidden id for update
    if (data.id) {
        const existing = form.value.find((f: any) => f.name === 'id')
        if (!existing) {
            form.value = [...form.value, { name: 'id', type: 'hidden', value: data.id, required: true }]
        } else {
            existing.value = data.id
        }
    }
}

const onFormResults = (fields: any) => {
    const pwd      = fields.find((f: any) => f.name === 'password')
    const pconfirm = fields.find((f: any) => f.name === 'password_confirmation')
    if (pwd?.value && pconfirm?.value && pwd.value !== pconfirm.value) {
        pconfirm.error = 'Password does not match'
        pwd.error      = 'Password does not match'
    } else {
        if (pconfirm) pconfirm.error = null
        if (pwd)      pwd.error      = null
    }
}

watch(() => form.value, (value) => {
    if (value) emits('update:form', value)
}, { deep: true, immediate: true })

onMounted(() => {
    const action = props.watcher?.action
    const data   = props.watcher?.data

    if (action === 'edit' && data && Object.keys(data).length > 0) {
        prefillForEdit(data)
    }

    // Mount the Form AFTER prefill so DynamicForm copies already-filled values
    formReady.value = true
})
</script>

<template>
    <div>
        <Card class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
            <Form
                v-if="formReady"
                v-model:form="form"
                parentStyle="grid grid-cols-1 gap-4 px-4 py-0"
                @results="onFormResults"
            />
        </Card>
    </div>
</template>
