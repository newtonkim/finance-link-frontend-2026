<script setup lang="ts">
import { memberAccountApi } from '@/tenant/apis'
import { onMounted, ref, computed } from 'vue'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import InterestPostingHistory from '@/tenant/modules/savings/components/InterestPostingHistory.vue'
import { useCurrencyStore } from '@/stores/currency'
import { notify } from '@/Global/Toasters'

const { memebrAccountReversalAmount } = memberAccountApi()
const currencyStore = useCurrencyStore()
const currency = computed(() => currencyStore.currencyCode)

const loading = ref(true)
const fdLoading = ref(false)
const fdAccount = ref<Record<string, any> | null>(null)

const props = defineProps({
    data: {
        type: Object,
        required: true
    }
})

const isFixed = computed(() => props.data?.type === 'fixed' || props.data?.account_type === 'fixed')

const columns: any[] = [
    {
        header: 'Saving Account Details',
        type: 'Descriptions',
        column: 3,
        list: [
            { key: 'account_code', label: 'code', copy: true },
            { key: 'phone', label: 'phone' },
            { key: 'member_name', label: 'name' },
            { key: 'type', label: 'type' },
            { key: 'intrest', label: 'intrest' },
            { key: 'opblc', label: 'opening balance', type: "money" },
            { key: 'minBalance', label: 'min balance', type: "money" },
            { key: 'blc', label: 'Account balance', type: "money", },
            { key: 'status', label: 'status', type: "status" },
            { key: 'product', label: 'product' },
            { key: 'created_at', label: 'created', type: "dateTime" },
        ]
    },
    {
        header: 'Account Transactions Details',
        type: 'Table',
        column: [
            { key: 'reference', label: 'reference', sticky: "left" },
            { key: 'total', label: 'before charge', type: "money" },
            { key: 'charge', label: 'charge', type: "money", sticky: "left" },
            { key: 'amount', label: 'balance', type: "money", sticky: "left" },
            { key: 'type', label: 'type', sticky: "left" },
            { key: 'mode', label: 'mode', type: "status", sticky: "left" },
            { key: 'narration', label: 'narration' },
            { key: 'transfer_by', label: 'transfer By' },
            { key: 'transaction_date', label: 'transaction date', width: "10em" },
            { key: 'created_at', label: 'created at', sticky: "right", width: "10em", type: "dateTime" },
            { key: 'actions', label: 'actions', sticky: "right", },
        ],
        list: []
    }
]

function formatDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRate(r: number | null | undefined) {
    if (r == null) return '—'
    return (Number(r) * 100).toFixed(2) + '%'
}

const isMatured = computed(() => {
    const md = fdAccount.value?.maturity_date
    if (!md) return false
    return new Date(md) <= new Date()
})

async function loadFdDetails() {
    if (!props.data?.id) return
    fdLoading.value = true
    try {
        const res = await savingsAccountsApi.show(props.data.id)
        fdAccount.value = res.data?.data ?? res.data
    } catch {
        // non-critical — FD panel just won't show extra data
    } finally {
        fdLoading.value = false
    }
}

async function prepareTheFeaturesData() {
    loading.value = true


    if (props.data.transactionList)
        props.data.transactionList.forEach((element: any) => {
            columns[1]?.list.push({ amount: element.amount, total: element.total, charge: element.charge, created_at: element.created_at, "narration": element.narration, transaction_date: element.transaction_date, type: element.type, mode: element.mode, "transfer_by": element.by, reference: element.reference } as any)
        });
    loading.value = false
}

onMounted(async () => {
    await prepareTheFeaturesData()
    if (isFixed.value) loadFdDetails()
})
</script>

<template>
    <div class="h-[90vh] overflow-auto">
        <!-- {{ columns }} -->
        <div v-if="loading">Loading...</div>
        <DetailsTable v-else :data="data" :columns="columns">
            <template #actions="{ item }">
                <div class="flex gap-2 ">
                    <TabelActionButtons v-if="item?.charge > 0" :disabled="['true', '1', true].includes(item.reversed)"
                        :data="item" @action="() => memebrAccountReversalAmount({ ...item, charge_reversal: true })"
                        :color="['charge-reversal', 'reversed'].includes(item.type) ? 'secondary' : 'default'"
                        icon="Undo" title="charge reversal" />
                    <TabelActionButtons @action="() => notify({msg:'Not implemented',type:'warning'})" v-else :data="item" color="default" icon="Undo" title="charge reversal" />
                    <TabelActionButtons :disabled="['true', '1', true].includes(item.reversed)" :data="item"
                        @action="() => memebrAccountReversalAmount(item)"
                        :color="['charge-reversal', 'reversed'].includes(item.type) ? 'secondary' : 'danger'"
                        icon="Undo" title="full reversal" />
                </div>
            </template>
        </DetailsTable>

        <!-- Fixed Deposit Details Panel -->
        <template v-if="isFixed">
            <div class="px-4 pb-6 mt-2">
                <!-- Loading skeleton -->
                <div v-if="fdLoading" class="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                    <div class="h-3 w-32 rounded bg-amber-100 animate-pulse" />
                    <div class="grid grid-cols-2 gap-3">
                        <div v-for="i in 4" :key="i" class="space-y-1">
                            <div class="h-2.5 w-20 rounded bg-amber-100 animate-pulse" />
                            <div class="h-4 w-28 rounded bg-amber-100 animate-pulse" />
                        </div>
                    </div>
                </div>

                <!-- FD data -->
                <div v-else-if="fdAccount" class="space-y-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold uppercase tracking-wide text-amber-600">Fixed Deposit</p>
                        <span :class="[
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            isMatured
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                        ]">
                            {{ isMatured ? 'Matured' : 'Active' }}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-xs text-neutral-500">Tenor</p>
                            <p class="font-semibold text-neutral-800">
                                {{ fdAccount.tenor_months != null ? fdAccount.tenor_months + ' months' : '—' }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-neutral-500">Maturity Date</p>
                            <p class="font-semibold text-neutral-800">{{ formatDate(fdAccount.maturity_date) }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-neutral-500">Interest Rate</p>
                            <p class="font-semibold text-neutral-800">{{ formatRate(fdAccount.interest_rate) }} p.a.</p>
                        </div>
                        <div>
                            <p class="text-xs text-neutral-500">Next Interest Date</p>
                            <p class="font-semibold text-neutral-800">{{ formatDate(fdAccount.next_interest_date) }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-neutral-500">Maturity Action</p>
                            <p class="font-semibold text-neutral-800 capitalize">{{ fdAccount.maturity_action ?? '—' }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Interest Posting History -->
                <div v-if="fdAccount" class="mt-4">
                    <InterestPostingHistory :account-id="data.id" :currency="currency" />
                </div>
            </div>
        </template>
    </div>
</template>
