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
        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">
                <MinusCircle :size="13" /> Withdrawal Details
            </p>
            <Form :action="data.action" parentStyle="grid grid-cols-2 gap-4 md:gap-5" v-model:form="fields" />

            <!-- Live balance-after preview -->
            <div v-if="enteredAmount > 0"
                class="mt-5 flex items-center justify-between rounded-xl border px-4 py-3"
                :class="balanceAfter < 0 ? 'border-rose-200 bg-rose-50/60' : 'border-gray-100 bg-gray-50/70'">
                <div class="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <TrendingDown :size="15" class="text-gray-400" /> Balance after withdrawal
                </div>
                <span class="text-base font-black tabular-nums" :class="balanceAfter < 0 ? 'text-rose-600' : 'text-gray-900'">
                    {{ currencyCode }} {{ formatMoneyValue(balanceAfter) }}
                </span>
            </div>
            <p v-if="enteredAmount > 0 && balanceAfter < 0" class="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <AlertTriangle :size="13" /> Amount exceeds the available balance.
            </p>
        </div>

        <!-- Note -->
        <div class="mt-5 flex items-start gap-2.5 rounded-xl bg-amber-50/60 border border-amber-100 px-4 py-3">
            <Info :size="15" class="text-amber-500 shrink-0 mt-0.5" />
            <p class="text-[12px] text-amber-700 leading-relaxed">
                This withdrawal is recorded immediately in the member's account and the general ledger. Reversing it requires a separate transaction.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Copy, Check, Wallet, MinusCircle, TrendingDown, AlertTriangle, Info } from 'lucide-vue-next'
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

// Live "balance after withdrawal" preview from the entered amount.
const enteredAmount = computed(() => {
    const f = fields.value.find((x: any) => x.name === 'amount')
    const n = Number(f?.value)
    return isNaN(n) ? 0 : n
})
const balanceAfter = computed(() => Number(props.data?.blc ?? 0) - enteredAmount.value)

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
