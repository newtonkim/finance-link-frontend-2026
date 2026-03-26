<template>
    <div class="card shadow-md p-4 py-10 bg-white dark:bg-neutral-800 rounded-md" v-if="fields?.length">
        <div class="  mb-6">
            <DetailsTable :data="props.data" :columns="columns" />
        </div>
        <Form :action="data.action" parentStyle="grid  grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { DetailsTable, Form } from '@/Global'
const emits = defineEmits(['update:form']),
    props = defineProps({
        data: {
            type: Object,
            default: {},
        },
    }),
    columns = [
        {
            header: 'Saving Account Details',
            type: 'Descriptions',
            column: 3,
            list: [
                { key: 'member_name', label: 'memeber name', },
                { key: 'account_code', label: 'account code', copy: true },
                { key: 'product', label: 'product', },
                { key: 'blc', label: 'balance', },
                { key: 'type', label: 'type', copy: true },
                { key: 'created_at', label: 'created', tyope: "dateTime" },
            ]
        },

    ],
    fields = ref<any>([]);
function initialize() {
    fields.value = [
        {
            label: 'deposit amount',
            name: 'deposit',
            type: 'money',
            required: true,
            placeholder: 'select a ',
            disabled: true,
        },
      

    ]
}
watch(fields, (val) => {
    emits('update:form', val)
})
onMounted(() => {
    initialize()
})
</script>
