<template>
    <div class="card shadow-md p-4 bg-white dark:bg-neutral-800 rounded-md h-[80vh] overflow-y-auto">
        <Form :action="data?.action" parentStyle="grid grid-cols-1 gap-4 md:gap-6" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Form } from '@/Global'
const props = defineProps({
    data: {
        type: Object,
        default: () => ({}),
    },
}), fields = ref<any[]>([
    {
        label: 'share capital',
        name: 'capital',
        type: 'number',
        required: true,
        helper: 'The total number of shares in the company(points) that will be used to calculate capital.',
        change: culWath
    },
    {
        label: 'share price',
        name: 'share_price',
        type: 'number',
        required: true,
        helper: "Per share price used to calculate capital",
        change: culWath

    },
    {
        label: 'opening balance',
        name: 'balance',
        type: 'number',
        required: true,
        helper: "Alternate opening balance for the share capital",
    },
    {
        label: 'id',
        name: 'id',
        type: 'number',
        required: true,
        disabled: true,
        hidden: true,
        helper: 'The share capital value calculated based on the share price and the total number of shares in the company.',
    },
    {
        label: 'capital calculated value',
        name: 'points_value',
        type: 'number',
        required: true,
        disabled: true,
        helper: 'The share capital value calculated based on the share price and the total number of shares in the company.',
    },
    {
        label: 'status',
        name: 'status',
        type: 'select',
        value: 'active',
        options: [
            { name: 'Active', id: 'active' },
            { name: 'Inactive', id: 'inactive' },
        ],
        required: true,
    },
])
function culWath() {
    setTimeout(() => {
        const capital = fields.value.find((f: any) => f.name === 'capital')
        const price = fields.value.find((f: any) => f.name === 'share_price')
        const field = fields.value.find((f: any) => f.name === 'points_value')

        if (field && price && capital) {
            field.value = (Number(capital.value) || 0) * (Number(price.value) || 0)
        }
    }, 100)
}

function populateForm(data: any) {
    if (!data) return
    fields.value.forEach((field: any) => {
        if (field.name === 'balance') field.value = data['blc']
        if (data[field.name] !== undefined) {
            field.value = data[field.name]
        }
    })
    culWath()
}
onMounted(() => {
    populateForm(props.data)
})
watch(() => props.data, (newVal) => {
    populateForm(newVal)
},
    { deep: true, immediate: true }
)
</script>