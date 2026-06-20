<template>
    <div class="flex flex-col h-full px-1" v-if="fields?.length">
        <!-- Account summary -->
        <div class="rounded-2xl bg-gradient-to-br from-[#052659] to-[#0a3a7a] p-5 text-white shadow-sm mb-6 relative overflow-hidden">
            <div class="absolute -top-8 -right-8 size-32 rounded-full bg-white/5 blur-2xl"></div>
            <div class="relative">
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                        <p class="text-[10px] uppercase tracking-wider text-white/50 font-bold">Withdrawing from</p>
                        <h3 class="text-lg font-black mt-0.5 truncate">{{ data.member_name || '—' }}</h3>
                        <button type="button" @click="copyCode"
                            class="flex items-center gap-1.5 mt-1 text-white/70 hover:text-white text-[13px] font-mono transition-colors">
                            {{ data.account_code || '—' }}
                            <component :is="copied ? Check : Copy" :size="12" :class="copied ? 'text-emerald-300' : ''" />
                        </button>
                    </div>
                    <span v-if="data.product || data.account_type"
                        class="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[12px] font-semibold capitalize ring-1 ring-white/10">
                        <Wallet :size="13" /> {{ data.product || data.account_type }}
                    </span>
                </div>

                <div class="mt-4 pt-4 border-t border-white/10">
                    <p class="text-[10px] uppercase tracking-wider text-white/50 font-bold">Available Balance</p>
                    <p class="text-[28px] font-black mt-0.5 leading-none tabular-nums">
                        {{ currencyCode }} {{ formatMoneyValue(data.blc ?? 0) }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Withdrawal form -->
        <div>
            <p class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                <MinusCircle :size="13" /> Withdrawal Details
            </p>
            <Form :action="data.action" parentStyle="grid grid-cols-2 gap-4 md:gap-5" v-model:form="fields" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Copy, Check, Wallet, MinusCircle } from 'lucide-vue-next'
import { Form, formatMoneyValue } from '@/Global'
import { useCurrencyStore } from '@/stores/currency'

const emits = defineEmits(['update:form'])
const props = defineProps({
    data: {
        type: Object,
        default: () => ({}),
    },
})

const { currencyCode } = storeToRefs(useCurrencyStore())

const copied = ref(false)
function copyCode() {
    const code = props.data?.account_code
    if (!code) return
    navigator.clipboard?.writeText(String(code)).then(() => {
        copied.value = true
        setTimeout(() => (copied.value = false), 1500)
    })
}

const fields = ref<any>([])

function initialize() {
    fields.value = [
        {
            label: 'withdraw amount',
            name: 'amount',
            type: 'money',
            required: true,
            placeholder: 'Amount to withdraw',
        },
        {
            label: 'payment mode (Debit Account)',
            name: 'payment_mode_id',
            type: 'select',
            value: props?.data?.payment_mod,
            url: 'global/chart-of-accounts',
            data: { account_type: 'ASSET' },
            dataOnMount: true,
            options: [],
            required: true,
            placeholder: 'Select income account',
        },
        {
            label: 'transaction date ',
            name: 'transaction_date',
            type: 'datec',
            maxDate: new Date(),
            required: false,
            placeholder: 'Amount to withdraw',
            value: new Date().toISOString().split('T')[0],
        },
        {
            label: 'Transaction Reference',
            name: 'transaction_reference',
            type: 'text',
            required: false,
            placeholder: 'Transaction Reference',
        },
        {
            label: 'withdrawal by',
            name: 'withdrawal_by',
            type: 'text',
            required: false,
            placeholder: 'who withdrawed',
        },
        {
            label: 'narration',
            name: 'narration',
            type: 'textarea',
            required: false,
            placeholder: 'Amount to withdraw reason',
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
