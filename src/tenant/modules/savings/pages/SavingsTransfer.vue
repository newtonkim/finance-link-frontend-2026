<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ArrowLeftRight, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { tenantClient } from '@/tenant/apis/tenantClient'
import SearchableSelect from '@/Global/SearchableSelect.vue'
import { useCurrencyStore } from '@/stores/currency'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Account {
    id: number
    account_no: string
    account_type: string
    balance: number
    consider_min_balance: boolean
    member_name: string
    member_number: string
}

// ── State ─────────────────────────────────────────────────────────────────────
const accounts       = ref<Account[]>([])
const loadingAccounts = ref(false)
const processing     = ref(false)
const errors         = ref<Record<string, string>>({})

const form = ref({
    from_account_id:       '' as string | number,
    to_account_id:         '' as string | number,
    amount:                '' as string | number,
    transfer_date:         new Date().toISOString().split('T')[0],
    transaction_reference: generateRef(),
    narration:             '',
})
const currencyStore = useCurrencyStore()
const { currencyCode } = storeToRefs(currencyStore)

function generateRef() {
    const date = (new Date().toISOString().split('T')[0] ?? '').replace(/-/g, '')
    const rand = Math.floor(10000 + Math.random() * 90000)
    return `TRF-${date}-${rand}`
}

// ── Fetching accounts ─────────────────────────────────────────────────────────
async function fetchAccounts() {
    loadingAccounts.value = true
    try {
        const res = await tenantClient.get('/savings-transfer/accounts')
        accounts.value = res.data.data ?? []
    } catch {
        toast.error('Failed to load savings accounts.')
    } finally {
        loadingAccounts.value = false
    }
}

onMounted(fetchAccounts)

// ── From account details ──────────────────────────────────────────────────────
const fromAccount = computed(() =>
    accounts.value.find(a => String(a.id) === String(form.value.from_account_id)) ?? null
)

// "Select To" excludes the selected from account
const toAccountOptions = computed(() =>
    accounts.value.filter(a => String(a.id) !== String(form.value.from_account_id))
)

// SearchableSelect expects { id, name } shape
const fromSelectOptions = computed(() =>
    accounts.value.map(a => ({ id: a.id, name: `${accountLabel(a)} — ${currencyCode.value} ${fmtCurrency(a.balance)}` }))
)
const toSelectOptions = computed(() =>
    toAccountOptions.value.map(a => ({ id: a.id, name: `${accountLabel(a)} — ${currencyCode.value} ${fmtCurrency(a.balance)}` }))
)

// Reset "To" when "From" changes
watch(() => form.value.from_account_id, () => {
    form.value.to_account_id = ''
    form.value.amount = ''
    errors.value = {}
})

// ── Withdrawable amount on source ─────────────────────────────────────────────
const maxTransferable = computed(() => {
    if (!fromAccount.value) return null
    if (!fromAccount.value.consider_min_balance) return fromAccount.value.balance
    // We don't have minimum_balance here directly — show full balance, backend validates
    return fromAccount.value.balance
})

// ── Amount validation ─────────────────────────────────────────────────────────
const amountError = computed(() => {
    const amt = Number(form.value.amount)
    if (!amt || amt <= 0) return ''
    if (maxTransferable.value !== null && amt > maxTransferable.value) {
        return `Exceeds available balance (${currencyCode.value} ${maxTransferable.value.toLocaleString('en-US', { minimumFractionDigits: 2 })})`
    }
    return ''
})

// ── Formatted amount (comma-separated display, raw value for submission) ─────
const formattedAmount = computed({
    get: () => {
        if (form.value.amount === '' || form.value.amount === null || form.value.amount === undefined) return ''
        const parts = form.value.amount.toString().split('.')
        if (parts[0] !== undefined) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return parts.join('.')
    },
    set: (val: string) => {
        const stripped = val.replace(/[^0-9.]/g, '')
        const parts = stripped.split('.')
        form.value.amount = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '')
    },
})

const canSubmit = computed(() =>
    form.value.from_account_id &&
    form.value.to_account_id &&
    Number(form.value.amount) > 0 &&
    !amountError.value &&
    form.value.transfer_date
)

// ── Submit ────────────────────────────────────────────────────────────────────
async function submit() {
    if (!canSubmit.value) return
    processing.value = true
    errors.value = {}
    try {
        const res = await tenantClient.post('/savings-transfer', {
            from_account_id:       form.value.from_account_id,
            to_account_id:         form.value.to_account_id,
            amount:                form.value.amount,
            transfer_date:         form.value.transfer_date,
            transaction_reference: form.value.transaction_reference,
            narration:             form.value.narration || undefined,
        })
        toast.success('Funds Transferred Successfully', { duration: 3000 })
        resetForm()
        fetchAccounts() // refresh balances
    } catch (err: any) {
        if (err.response?.status === 422) {
            const errData = err.response.data.errors ?? {}
            Object.entries(errData).forEach(([k, v]) => {
                errors.value[k] = Array.isArray(v) ? (v[0] ?? '') : String(v)
            })
            if (!Object.keys(errData).length && err.response.data.message) {
                errors.value.form = err.response.data.message
            }
        } else {
            toast.error('Transfer failed. Please try again.')
        }
    } finally {
        processing.value = false
    }
}

function resetForm() {
    form.value = {
        from_account_id:       '',
        to_account_id:         '',
        amount:                '',
        transfer_date:         new Date().toISOString().split('T')[0] ?? '',
        transaction_reference: generateRef(),
        narration:             '',
    }
    errors.value = {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function accountLabel(a: Account) {
    return `${a.account_no} — ${a.member_name} (${a.account_type})`
}
</script>

<template>
    <div class="min-h-screen bg-[#f2f6f5] p-6">
3456789
        <!-- Page header -->
        <div class="mb-6 flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl  bg-nfuko-primary/10">
                <ArrowLeftRight class="h-5 w-5  text-nfuko-primary" />
            </div>
            <div>
                <h1 class="text-xl font-bold text-neutral-900">Fund Transfer</h1>
                <p class="text-[13px] text-neutral-500">Move funds between savings accounts</p>
            </div>
            <button @click="fetchAccounts" :disabled="loadingAccounts"
                class="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-neutral-500 hover:bg-neutral-200 transition-all disabled:opacity-50">
                <RefreshCw :size="13" :class="loadingAccounts ? 'animate-spin' : ''" />
                Refresh
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- ── Transfer Form ── -->
            <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">

                <!-- Card header -->
                <div class="px-6 py-4 border-b border-neutral-100 flex items-center gap-3">
                    <ArrowLeftRight class="h-4 w-4  text-nfuko-primary" />
                    <h2 class="text-[15px] font-bold text-neutral-900">Transfer Details</h2>
                </div>

                <div class="p-6 space-y-5">

                    <!-- Global error -->
                    <div v-if="errors.form"
                        class="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">
                        <AlertCircle class="h-4 w-4 shrink-0 mt-0.5" />
                        {{ errors.form }}
                    </div>

                    <!-- Transfer Date -->
                    <div class="grid gap-1.5">
                        <label class="block text-[13px] font-semibold text-neutral-700">
                            Transfer Date <span class="text-red-500">*</span>
                        </label>
                        <input v-model="form.transfer_date" type="date"
                            class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-800 focus:outline-none focus: border-nfuko-primary focus:ring-1 focus:ring-bg-nfuko-primary/20 transition-all" />
                        <p v-if="errors.transfer_date" class="text-[11px] text-red-600">{{ errors.transfer_date }}</p>
                    </div>

                    <!-- Select From -->
                    <div class="grid gap-1.5">
                        <label class="block text-[13px] font-semibold text-neutral-700">
                            Select From <span class="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                            :modelValue="form.from_account_id"
                            @update:modelValue="form.from_account_id = $event"
                            :options="fromSelectOptions"
                            placeholder="Please select an account"
                            :error="errors.from_account_id" />

                        <!-- Source account balance info -->
                        <div v-if="fromAccount"
                            class="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100 text-[12px] text-neutral-500">
                            <span>Balance:</span>
                            <strong class="text-neutral-800 font-mono">{{ currencyCode }} {{ fmtCurrency(fromAccount.balance) }}</strong>
                        </div>
                    </div>

                    <!-- Select To -->
                    <div class="grid gap-1.5">
                        <label class="block text-[13px] font-semibold text-neutral-700">
                            Select To <span class="text-red-500">*</span>
                        </label>
                        <SearchableSelect
                            :modelValue="form.to_account_id"
                            @update:modelValue="form.to_account_id = $event"
                            :options="toSelectOptions"
                            placeholder="Please select an account"
                            :disabled="!form.from_account_id"
                            :error="errors.to_account_id" />
                        <p v-if="!form.from_account_id" class="text-[11px] text-neutral-400">
                            Select a source account first.
                        </p>
                    </div>

                    <!-- Amount to transfer -->
                    <div class="grid gap-1.5">
                        <label class="block text-[13px] font-semibold text-neutral-700">
                            Amount to transfer <span class="text-red-500">*</span>
                        </label>
                        <div :class="[
                            'flex overflow-hidden rounded-xl border focus-within:ring-1 transition-all',
                            amountError || errors.amount
                                ? 'border-red-400 focus-within:ring-red-300'
                                : 'border-neutral-200 focus-within: border-nfuko-primary focus-within:ring-bg-nfuko-primary/20'
                        ]">
                            <span class="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-[13px] font-semibold text-neutral-500">
                                {{ currencyCode }}
                            </span>
                            <input v-model="formattedAmount" type="text" inputmode="decimal"
                                placeholder="0.00"
                                class="flex-1 bg-white px-4 py-3 text-[15px] font-mono font-bold text-neutral-800 outline-none placeholder:text-neutral-400" />
                        </div>
                        <p v-if="amountError" class="text-[11px] text-red-600 font-medium">{{ amountError }}</p>
                        <p v-else-if="errors.amount" class="text-[11px] text-red-600">{{ errors.amount }}</p>
                    </div>

                    <!-- Narration (optional) -->
                    <div class="grid gap-1.5">
                        <label class="block text-[13px] font-semibold text-neutral-700">
                            Narration <span class="text-[12px] font-normal text-neutral-400">(Optional)</span>
                        </label>
                        <input v-model="form.narration" type="text" placeholder="Reason for transfer..."
                            class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-800 focus:outline-none focus: border-nfuko-primary focus:ring-1 focus:ring-bg-nfuko-primary/20 transition-all" />
                    </div>

                    <!-- Submit -->
                    <div class="pt-2">
                        <button @click="submit" :disabled="!canSubmit || processing" :class="[
                            'w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold transition-all',
                            canSubmit && !processing
                                ? ' bg-nfuko-primary hover:bg-[#003030] text-white shadow-sm'
                                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        ]">
                            <Loader2 v-if="processing" class="h-4 w-4 animate-spin" />
                            <ArrowLeftRight v-else class="h-4 w-4" />
                            {{ processing ? 'Processing...' : 'Submit Transfer' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- ── Transfer Summary Panel ── -->
            <div class="space-y-4">

                <!-- How it works -->
                <div class="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 space-y-4">
                    <h3 class="text-[13px] font-bold text-neutral-700 uppercase tracking-wider">How it works</h3>
                    <div class="space-y-3">
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 rounded-full  bg-nfuko-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                            <p class="text-[12px] text-neutral-500 leading-relaxed">Select the source account to transfer <strong class="text-neutral-700">from</strong>.</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 rounded-full  bg-nfuko-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                            <p class="text-[12px] text-neutral-500 leading-relaxed">Select the destination account to transfer <strong class="text-neutral-700">to</strong>.</p>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 rounded-full  bg-nfuko-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                            <p class="text-[12px] text-neutral-500 leading-relaxed">Enter the amount and submit. Both accounts update instantly.</p>
                        </div>
                    </div>
                </div>

                <!-- Live preview -->
                <div v-if="form.from_account_id && form.to_account_id && Number(form.amount) > 0 && !amountError"
                    class="bg-white rounded-2xl shadow-sm border border-emerald-200 p-5 space-y-3">
                    <div class="flex items-center gap-2 text-[12px] font-bold text-emerald-700 uppercase tracking-wider">
                        <CheckCircle2 class="h-4 w-4" />
                        Transfer Preview
                    </div>
                    <div class="space-y-2 text-[13px]">
                        <div class="flex justify-between">
                            <span class="text-neutral-500">From</span>
                            <span class="font-semibold text-neutral-800">{{ accounts.find(a => String(a.id) === String(form.from_account_id))?.account_no }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-neutral-500">To</span>
                            <span class="font-semibold text-neutral-800">{{ accounts.find(a => String(a.id) === String(form.to_account_id))?.account_no }}</span>
                        </div>
                        <div class="border-t border-neutral-100 pt-2 flex justify-between">
                            <span class="text-neutral-500">Amount</span>
                            <span class="font-black text-[15px] text-emerald-700 font-mono">{{ currencyCode }} {{ fmtCurrency(Number(form.amount)) }}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>
