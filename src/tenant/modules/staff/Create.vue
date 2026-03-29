<template>
    <div class="card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md">
        <span v-if='loadingMount'></span>
        <Form :action="data?.action" v-else parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Form, getSystemSetting } from '@/Global';
const loadingMount = computed(() => loading.value), emits = defineEmits(['update:form']), loading = ref(true), settingList = ref({}), props = defineProps({
    data: {
        type: Object,
        default: {},
    },
}), fields = ref([
    {
        label: 'name',
        name: 'staff_fall_name',
        type: 'text',
        required: true,
    },
    {
        label: 'Email adress',
        name: 'staff_email',
        type: 'email',
        required: true,
        value: '',
        props: { placeholder: 'Select Start & End Dates' },
    },
    {
        label: 'password',
        name: 'password',
        type: 'password',
        required: false,
    },
    {
        label: 'roles',
        name: 'system_role',
        type: 'select',
        required: true,
        url: 'staff/roles-drop-down',
        placeholder: 'Select roles',
        dataOnMount: true,
    },
]);
async function promtValueOnUpdate() {
    loading.value = true
    if (props.data) {
        const data = { tenant_id: props.data.tenant_id, plan: props.data.plan_id, date: [props.data.starts, props.data.expires], status: props.data.status }
        await Object.entries(data).forEach(([key, value]) => {
            const field = fields.value.find((f: any) => f.name === key)
            if (field) field.value = value
        });
    }
    loading.value = false
}
function checkForSettings() {
    const checkForVaailableSetting = getSystemSetting()
    settingList.value = {
        "sacco-members-require-approval-before-members-becomes-active": parseFloat(checkForVaailableSetting?.['sacco-members-require-approval-before-members-becomes-active'] ?? 0),
    }
}
watch(
    () => fields.value,
    (val) => {
        const statusIndex = val.findIndex(f => f.name === 'status')
        const fullNameIndex = val.findIndex(f => f.name === 'full_name')
        if (settingList.value?.['sacco-members-require-approval-before-members-becomes-active']) {
            if (statusIndex === -1 && fullNameIndex !== -1) {
                fields.value.splice(fullNameIndex + 1, 0, {
                    label: 'free input code',
                    name: 'status',
                    type: 'select',
                    value: 'active',
                    required: true,
                    options: [{ id: 'active', name: 'Active' }, { id: 'in-active', name: 'in-active' },]
                })
            }
        } else {
            if (statusIndex !== -1) {
                fields.value.splice(statusIndex, 1)
            }
        }
    },
    { deep: true }
)
onMounted(() => {
    promtValueOnUpdate()
    checkForSettings()
})
</script>