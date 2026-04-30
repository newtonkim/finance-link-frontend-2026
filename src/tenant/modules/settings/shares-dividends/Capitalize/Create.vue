<template>
    <div class="card shadow-md p-4  bg-white dark:bg-neutral-800 rounded-md h-[80vh] overflow-y-auto"
        style="overflow: auto">
        <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-3" v-model:form="fields" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Form } from '@/Global'
const props = defineProps({
    data: {
        type: Object,
        default: {},
    },
})
function culWath() {
    setTimeout(() => {
        const field = fields.value.find((f: any) => f.name === 'points_value')
        const price = fields.value.find((f: any) => f.name === 'share_price')
        const capital = fields.value.find((f: any) => f.name === 'capital')
        if (field && price) field.value = capital.value * price.value
    }, 300);
}

const fields = ref<any[]>([
    {
        label: 'share capital',
        name: 'capital',
        type: 'number',
        required: true,
        helper: 'The total number of shares in the company(points) that will be used to calculate capital.',
        change: (value: any) => {
            culWath()

        }
    },
    {
        label: 'share price',
        name: 'share_price',
        type: 'number',
        required: true,
        helper: "Per share price used to calculate capital",
        change: (value: any) => {
            culWath()

        }

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
// Prefill (edit mode)


</script>