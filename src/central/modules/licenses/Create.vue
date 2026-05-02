<script setup lang="ts">
import {  ref, watch, onMounted } from 'vue';
import {  Form } from '@/Global';
const emits = defineEmits(['update:form']);
const statusOptions = [
    { name: 'Active', id: 'active' },
    { name: 'Trial', id: 'trial' },
    { name: 'Suspended', id: 'suspended' },
    { name: 'Expired', id: 'expired' },
];
const loading = ref(true)
const fields = ref<any[]>([
    {
        label: 'Select Tenant',
        name: 'tenant_id',
        type: 'select',
        required: true,
        placeholder: 'Search Full Name/ Email/ Phone Number',
        remote: true,
        dataOnMount: true,
        url: "central/licenses/licenses-drop-down",
    },
    {
        label: 'Select Plan',
        name: 'plan',
        type: 'select',
        required: true,
        url: "central/global/plans-drop-down",
        placeholder: 'Select a Plan',
        dataOnMount: true,
        state:"plans-drop-down"
    },
    {
        label: 'Starts At / Expires At',
        name: 'date',
        type: 'datec',
      maxDate: new Date(),

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
    fields,
    (newVal) => {
        emits('update:form', newVal);
    },
    { deep: true }
);
const props = defineProps({
    data: {
        type: Object,
        default: {},
    },
    action: {
        type: String,
        default: {},
    }
})
function onFormResults() {
    
}
async function promtValueOnUpdate() {
    loading.value = true
    if (props.data.action == 'add') {
        fields.value = fields.value.map((f: any) => ({ value: null, ...f })) // remove the values of the fields
    }else{
        const data = { tenant_id: props.data.tenant_id, plan: props.data.plan_id, date: [props.data.starts, props.data.expires], status: props.data.status }
       await Object.entries(data).forEach(([key, value]) => {
            const field = fields.value.find((f: any) => f.name === key)
            if (field) {
                field.value = value
                
            }
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

    <div class="card shadow-md px-4 py-3 bg-white dark:bg-neutral-800 rounded-md">
        <span v-if='loading'></span>
        <Form v-else @results="onFormResults" parentStyle="grid  grid-cols-1 gap-3" v-model:form="fields" />
    </div>
</template>