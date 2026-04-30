<script setup lang="ts">
import { ref, watch } from 'vue'
import { Form, Card } from '@/Global'
const emits = defineEmits(['update:form']);
const remount = ref<boolean>(true)
const form = ref<any[]>([
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
        url: 'central/staff/roles-drop-down', 
        props: { placeholder: 'Select Status' },
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
    const pwd = fields.find((f: any) => f.name === 'password'), pconfirm = fields.find((f: any) => f.name === 'password_confirmation')
    if (pwd.value !== pconfirm.value) {
        pconfirm.error = 'Password does not match'
        pwd.error = 'Password does not match'
    } else {
        pconfirm.error = null
        pwd.error = null
    }
}
watch(() => form.value, (value) => {
    if (value){
        emits('update:form', value);
        
    }
}, { deep: true, immediate: true })
</script>
<template>
    <div class="">
       
        <Card
            class="border-neutral-100 h-[79vh] dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
            <div v-if="remount">
                <Form v-model:form="form" parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-3 px-4 py-0"
                    @results="onFormResults" />
            </div>
        </Card>
    </div>
</template>