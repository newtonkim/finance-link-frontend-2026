<script setup lang="ts">
import { ref, watch } from 'vue'
import { Form, Card, Table } from '@/Global'
import { ACTION_CONFIG } from '@/Global/landingLayout/util';
const emits = defineEmits(['update:form']);
const featuresSelected = ref([]);
const counter = {
    type: 'select',
    options: Array.from({ length: 10 }, (_, index) => ({ name: (index + 1).toString(), id: index + 1 })),
}
const form = ref([
    {
        label: 'plan name',
        name: 'name',
        type: 'text',
        required: true,
    },
    {
        label: 'cost',
        name: 'cost',
        type: 'number',
        "min": 100,
        url: "/central/settings/roles/featuress-drop-down",
        required: true, placeholder: 'Enter Description'
    },
    {
        label: 'billing cycle',
        name: 'billing_type',
        type: "select",
        options: [{ name: 'daily', id: 'daily' }, { name: 'weekly', id: 'weekly' }, { name: 'monthly', id: 'monthly' }, { name: 'yearly', id: 'yearly' },],
        required: true, placeholder: 'Enter billing cycle'
    },
    {
        label: 'max members',
        name: 'mx_mbrs',
        ...counter,

        required: true, placeholder: 'Enter Description'
    },
    {
        label: 'max users',
        name: 'mxusrs',
        ...counter,
        required: true, placeholder: 'Enter Description'
    },
    {
        label: 'features',
        name: 'features',
        type: 'select',
        options: [{ name: 'reports', id: 'reports' }, { name: 'loans', id: 'loans' }, { name: 'savings', id: 'savings' }, { name: 'shares', id: 'shares' },],
        required: true, placeholder: 'Enter Description'
    }
])
const props = defineProps({

    watcher: {
        type: Object,
        default: {},
        required: false
    }
})
watch(() => form.value, (value) => {
    if (value) {
        const features = value.find((f: any) => f.name === 'features');
        if (features?.value) {

            featuresSelected.value = [...new Set([features.selected, ...featuresSelected.value.filter(p => p.id !== features.selected.id),])];
        }

        emits('update:form', { ...value, selectedfeatures: featuresSelected.value });
    }
}, { deep: true, })
function removefeatures(features: any) {
    featuresSelected.value = featuresSelected.value.filter(p => p.id !== features.id)
}
const columns = [
    { key: 'name', label: 'Name' },
    { key: 'actions', label: 'Actions', show: ['close'] },
]
const actions: any = {
    close: (item: any) => removefeatures(item)
}
function handleAction(item: any, action: string) {
    actions?.[action]?.(item)
}
</script>
<template>
    <div class="">
        <Card
            class="border-neutral-100 h-[100vh] dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl overflow-hidden">
            <Form v-model:form="form" parentStyle="grid grid-cols-2 sm:grid-cols-1 gap-4 md:gap-6 px-4 py-0" />
            <div class="h-[40vh] overflow-auto">
                <Table :action_config="ACTION_CONFIG" :handleAction="handleAction" :dataFilter="featuresSelected"
                    :columns="columns">
                </Table>
            </div>
        </Card>
    </div>
</template>