<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Form, Card, Table } from '@/Global'
import { ACTION_CONFIG } from '@/Global/landingLayout/util';
const emits = defineEmits(['update:form']);
const featuresSelected = ref<any[]>([]);
const loading = ref(true)

const FEATURE_OPTIONS = [
    { name: 'Monthly statements', id: 'reports' },
    { name: 'Loans & SACCO module', id: 'loans' },
    { name: 'Core ledger & savings', id: 'savings' },
    { name: 'Shares module', id: 'shares' },
    { name: 'NFC offline payments', id: 'nfc' },
    { name: 'REST API access', id: 'api' },
    { name: 'SSO & audit logs', id: 'sso' },
    { name: 'White-label & SSO', id: 'whitelabel' },
    { name: 'Email support', id: 'email_support' },
    { name: 'Priority support', id: 'priority_support' },
]

const form: any = ref([
    {
        label: 'Plan Name',
        name: 'name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Basic Plan',
    },
    {
        label: 'Cost (USD)',
        name: 'cost',
        type: 'number',
        min: 0,
        required: true,
        placeholder: 'e.g. 29.99',
    },
    {
        label: 'Billing Cycle',
        name: 'billing_type',
        type: 'select',
        options: [
            { name: 'Daily', id: 'daily' },
            { name: 'Weekly', id: 'weekly' },
            { name: 'Monthly', id: 'monthly' },
            { name: 'Yearly', id: 'yearly' },
        ],
        required: true,
        placeholder: 'Select billing cycle',
    },
    {
        label: 'Max Members (0 = unlimited)',
        name: 'mx_mbrs',
        type: 'number',
        min: 0,
        required: true,
        placeholder: 'e.g. 100',
    },
    {
        label: 'Max Users (0 = unlimited)',
        name: 'mxusrs',
        type: 'number',
        min: 0,
        required: true,
        placeholder: 'e.g. 5',
    },
    {
        label: 'Features',
        name: 'features',
        type: 'select',
        options: FEATURE_OPTIONS,
        required: false,
        placeholder: 'Select a feature to add',
    },
])

const props = defineProps({
    data: {
        type: Object,
        default: () => ({}),
    },
})

watch(() => form.value, (value) => {
    if (value) {
        const featuresField = value.find((f: any) => f.name === 'features');
        if (featuresField?.selected?.id) {
            const already = featuresSelected.value.find((p: any) => p.id === featuresField.selected.id)
            if (!already) featuresSelected.value.push(featuresField.selected)
        }
        emits('update:form', { ...value, selectedfeatures: featuresSelected.value });
    }
}, { deep: true })

function removefeatures(feature: any) {
    featuresSelected.value = featuresSelected.value.filter((p: any) => p.id !== feature.id)
}

const columns = [
    { key: 'name', label: 'Feature' },
    { key: 'actions', label: '', show: ['close'] },
]
const actions: any = {
    close: (item: any) => removefeatures(item),
}
function handleAction(item: any, action: string) {
    actions?.[action]?.(item)
}

function parseFeaturesFromData(raw: any): Record<string, boolean> {
    if (!raw) return {}
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
        try { return JSON.parse(raw) } catch { return {} }
    }
    return {}
}

async function promtValueOnUpdate() {
    loading.value = true
    try {
        if (props.data?.action === 'edit') {
            // Map API field names → form field names
            const fieldMap: Record<string, string> = {
                plan_name: 'name',
                cost: 'cost',
                billing_type: 'billing_type',
                mx_mbrs: 'mx_mbrs',
                mxusrs: 'mxusrs',
            }

            Object.entries(fieldMap).forEach(([apiKey, formKey]) => {
                const val = (props.data as any)[apiKey]
                if (val === undefined || val === null) return
                const field = form.value.find((f: any) => f.name === formKey)
                if (field) field.value = val
            })

            // Parse features (may be JSON string or object)
            const featObj = parseFeaturesFromData((props.data as any).features)
            featuresSelected.value = Object.entries(featObj)
                .filter(([, enabled]) => enabled)
                .map(([key]) => {
                    const opt = FEATURE_OPTIONS.find((o) => o.id === key)
                    return opt ?? { name: key, id: key }
                })

            // Hidden id field for update
            if ((props.data as any).id) {
                const existing = form.value.find((f: any) => f.name === 'id')
                if (!existing) {
                    form.value = [...form.value, {
                        name: 'id',
                        type: 'hidden',
                        value: (props.data as any).id,
                        required: true,
                    }]
                } else {
                    existing.value = (props.data as any).id
                }
            }
        }
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    promtValueOnUpdate()
})
</script>
<template>
        <div v-if="loading"> </div>
        <Card v-else class="border-neutral-100 dark:border-white/10 dark:bg-[#151515] shadow-sm rounded-2xl ">
            <Form v-model:form="form" parentStyle="grid grid-cols-1 gap-3 px-4 py-0" />
            <div class="h-[40vh] overflow-auto">
                <Table :action_config="ACTION_CONFIG" :handleAction="handleAction" :dataFilter="featuresSelected"
                    :data="featuresSelected" :columns="columns">
                </Table>
            </div>
        </Card>
</template>
