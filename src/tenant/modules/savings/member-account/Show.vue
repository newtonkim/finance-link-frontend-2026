<script setup lang="ts">
import { memberAccountApi } from '@/tenant/apis'
import { onMounted, ref, computed } from 'vue'
import { savingsAccountsApi } from '@/tenant/apis/savingsAccounts/savingsAccountsApi'
import InterestPostingHistory from '@/tenant/modules/savings/components/InterestPostingHistory.vue'
import { useCurrencyStore } from '@/stores/currency'
import { notify } from '@/Global/Toasters'
import { formatMoneyValue, copyToClipboard } from '@/Global'
import {
    Wallet, Phone, CalendarDays, Percent, Layers, PiggyBank,
    Undo2, Lock, ShieldCheck, ArrowDownLeft, ArrowUpRight, Receipt, Copy, Check,
} from 'lucide-vue-next'

const { memebrAccountReversalAmount } = memberAccountApi()
const currencyStore = useCurrencyStore()
const currency = computed(() => currencyStore.currencyCode)

const loading = ref(true)
const fdLoading = ref(false)
const fdAccount = ref<Record<string, any> | null>(null)

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
})

const isFixed = computed(() => props.data?.type === 'fixed' || props.data?.account_type === 'fixed')

const transactions = ref<any[]>([])

// ---- key-terms tiles ----------------------------------------------------
const stats = computed(() => [
    { label: 'Opening balance', value: money(props.data?.opblc), icon: PiggyBank, mono: true },
    { label: 'Minimum balance', value: money(props.data?.minBalance), icon: ShieldCheck, mono: true },
    { label: 'Interest', value: props.data?.intrest || '—', icon: Percent },
    { label: 'Account type', value: props.data?.type || '—', icon: Layers, cap: true },
    { label: 'Phone', value: props.data?.phone || '—', icon: Phone, mono: true },
    { label: 'Opened', value: fmtDate(props.data?.created_at), icon: CalendarDays },
])

// ---- copy account code --------------------------------------------------
const copied = ref(false)
function copyCode() {
    if (!props.data?.account_code) return
    copyToClipboard(String(props.data.account_code))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
}

// ---- formatting helpers -------------------------------------------------
function money(v: any) {
    return `${currency.value} ${formatMoneyValue(Number(v ?? 0))}`
}
function memberInitials(name?: string): string {
    const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
    return String(name ?? '—').slice(0, 2).toUpperCase()
}
function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
}
function formatRate(r: number | null | undefined) {
    if (r == null) return '—'
    return (Number(r) * 100).toFixed(2) + '%'
}

function statusPill(s?: string): string {
    const v = String(s ?? '').toLowerCase()
    if (['active'].includes(v)) return 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/30'
    if (['suspended', 'expired', 'closed'].includes(v)) return 'bg-rose-400/15 text-rose-100 ring-rose-300/30'
    if (['trial', 'dormant', 'pending'].includes(v)) return 'bg-amber-400/15 text-amber-100 ring-amber-300/30'
    return 'bg-white/10 text-white/80 ring-white/20'
}
function statusDot(s?: string): string {
    const v = String(s ?? '').toLowerCase()
    if (['active'].includes(v)) return 'bg-emerald-400'
    if (['suspended', 'expired', 'closed'].includes(v)) return 'bg-rose-400'
    if (['trial', 'dormant', 'pending'].includes(v)) return 'bg-amber-400'
    return 'bg-white/50'
}

// ---- transaction presentation ------------------------------------------
function isCredit(t?: string) {
    return ['deposit', 'opening', 'opening-balance', 'interest', 'reversed', 'charge-reversal'].includes(
        String(t ?? '').toLowerCase(),
    )
}
function txBadge(t?: string): string {
    const v = String(t ?? '').toLowerCase()
    if (['deposit', 'opening', 'opening-balance', 'interest'].includes(v))
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300'
    if (['withdrawal', 'charge'].includes(v))
        return 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300'
    if (['reversed', 'charge-reversal'].includes(v))
        return 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300'
    return 'bg-neutral-100 text-neutral-600 ring-neutral-500/15 dark:bg-neutral-800 dark:text-neutral-300'
}
function isReversed(item: any) {
    return ['true', '1', true].includes(item?.reversed)
}

function chargeReversal(item: any) {
    if (Number(item?.charge) > 0) {
        memebrAccountReversalAmount({ ...item, charge_reversal: true })
    } else {
        notify({ msg: 'No charge to reverse on this transaction', type: 'warning' })
    }
}
function fullReversal(item: any) {
    memebrAccountReversalAmount(item)
}

// ---- data load ----------------------------------------------------------
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

function prepareTransactions() {
    transactions.value = (props.data?.transactionList ?? []).map((e: any) => ({
        id: e.id,
        reference: e.reference,
        total: e.total,
        charge: e.charge,
        amount: e.amount,
        type: e.type,
        mode: e.mode,
        narration: e.narration,
        transfer_by: e.by,
        transaction_date: e.transaction_date,
        created_at: e.created_at,
        reversed: e.reversed,
    }))
}

onMounted(async () => {
    loading.value = true
    prepareTransactions()
    loading.value = false
    if (isFixed.value) loadFdDetails()
})
</script>

<template>
    <div class="h-[90vh] overflow-y-auto bg-neutral-50/60 dark:bg-neutral-950 px-3 py-4 sm:px-5 space-y-5">
        <!-- ───────────── Passbook hero ───────────── -->
        <section
            class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-nfuko-primary-900 via-nfuko-primary-800 to-nfuko-primary-600 shadow-lg shadow-nfuko-primary-900/20">
            <!-- ledger rule texture -->
            <div class="pointer-events-none absolute inset-0 opacity-[0.07]" :style="{
                backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 34px)',
            }" />
            <div class="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-nfuko-accent/20 blur-3xl" />

            <div class="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between">
                <!-- identity -->
                <div class="flex items-center gap-4 min-w-0">
                    <div class="size-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/25 bg-white/10">
                        <img v-if="data.member_image" :src="data.member_image" :alt="data.member_name"
                            class="size-full object-cover" />
                        <div v-else
                            class="flex size-full items-center justify-center text-base font-black text-white/90">
                            {{ memberInitials(data.member_name) }}
                        </div>
                    </div>
                    <div class="min-w-0">
                        <h2 class="truncate text-lg font-bold leading-tight text-white">
                            {{ data.member_name || 'Unnamed member' }}
                        </h2>
                        <button type="button" @click="copyCode" :disabled="!data.account_code"
                            class="group mt-1 flex items-center gap-1.5 rounded-md text-left transition-colors disabled:cursor-default"
                            :title="data.account_code ? 'Copy account code' : ''">
                            <span class="font-mono text-xs tracking-wide text-nfuko-accent">{{ data.account_code || '—' }}</span>
                            <Check v-if="copied" :size="12" class="text-emerald-300" />
                            <Copy v-else-if="data.account_code" :size="12"
                                class="text-white/40 transition-colors group-hover:text-white/80" />
                        </button>
                        <div class="mt-3 flex flex-wrap items-center gap-2">
                            <span
                                class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-white/90 ring-1 ring-inset ring-white/15">
                                <Wallet :size="12" class="text-nfuko-accent" />
                                {{ data.product || 'No product' }}
                            </span>
                            <span v-if="isFixed"
                                class="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-100 ring-1 ring-inset ring-amber-300/30">
                                <Lock :size="12" /> Fixed deposit
                            </span>
                            <span :class="[
                                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset',
                                statusPill(data.status),
                            ]">
                                <span class="size-1.5 rounded-full" :class="statusDot(data.status)" />
                                {{ data.status || 'unknown' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- balance forward -->
                <div class="shrink-0 sm:text-right">
                    <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-nfuko-accent/80">
                        Account balance
                    </p>
                    <p class="mt-1 text-3xl font-black tabular-nums tracking-tight text-white sm:text-[2rem]">
                        {{ formatMoneyValue(Number(data.blc ?? 0)) }}
                    </p>
                    <p class="mt-0.5 text-xs font-medium text-white/55">
                        {{ currency }} · as of {{ fmtDate(new Date().toISOString()) }}
                    </p>
                </div>
            </div>
        </section>

        <!-- ───────────── Key terms ───────────── -->
        <section class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div v-for="s in stats" :key="s.label"
                class="rounded-2xl border border-neutral-200 bg-white p-3.5 transition-colors hover:border-nfuko-primary-200 dark:border-neutral-800 dark:bg-neutral-900">
                <div class="flex items-center gap-1.5 text-neutral-400">
                    <component :is="s.icon" :size="13" class="text-nfuko-action" />
                    <span class="text-[10px] font-semibold uppercase tracking-wider">{{ s.label }}</span>
                </div>
                <p class="mt-1.5 truncate text-sm font-bold text-neutral-800 dark:text-neutral-100"
                    :class="{ 'tabular-nums': s.mono, 'capitalize': s.cap }" :title="String(s.value)">
                    {{ s.value }}
                </p>
            </div>
        </section>

        <!-- ───────────── Fixed deposit panel ───────────── -->
        <section v-if="isFixed">
            <div v-if="fdLoading"
                class="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                <div class="h-3 w-32 animate-pulse rounded bg-amber-100 dark:bg-amber-500/20" />
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div v-for="i in 4" :key="i" class="space-y-1.5">
                        <div class="h-2.5 w-20 animate-pulse rounded bg-amber-100 dark:bg-amber-500/20" />
                        <div class="h-4 w-24 animate-pulse rounded bg-amber-100 dark:bg-amber-500/20" />
                    </div>
                </div>
            </div>

            <div v-else-if="fdAccount"
                class="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                <div class="mb-4 flex items-center justify-between">
                    <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                        <Lock :size="13" /> Fixed deposit terms
                    </p>
                    <span :class="[
                        'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                        isMatured ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                    ]">
                        {{ isMatured ? 'Matured' : 'Active' }}
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">Tenor</p>
                        <p class="mt-0.5 font-bold text-neutral-800 dark:text-neutral-100">
                            {{ fdAccount.tenor_months != null ? fdAccount.tenor_months + ' months' : '—' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">Maturity date</p>
                        <p class="mt-0.5 font-bold text-neutral-800 dark:text-neutral-100">{{ fmtDate(fdAccount.maturity_date) }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">Interest rate</p>
                        <p class="mt-0.5 font-bold text-neutral-800 dark:text-neutral-100">{{ formatRate(fdAccount.interest_rate) }} p.a.</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">Next interest</p>
                        <p class="mt-0.5 font-bold text-neutral-800 dark:text-neutral-100">{{ fmtDate(fdAccount.next_interest_date) }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 dark:text-amber-300/60">On maturity</p>
                        <p class="mt-0.5 font-bold capitalize text-neutral-800 dark:text-neutral-100">{{ fdAccount.maturity_action ?? '—' }}</p>
                    </div>
                </div>
            </div>

            <div v-if="fdAccount" class="mt-4">
                <InterestPostingHistory :account-id="data.id" :currency="currency" />
            </div>
        </section>

        <!-- ───────────── Transactions ledger ───────────── -->
        <section
            class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <header class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <h3 class="flex items-center gap-2 text-sm font-bold text-neutral-800 dark:text-neutral-100">
                    <Receipt :size="15" class="text-nfuko-action" />
                    Transactions
                </h3>
                <span
                    class="rounded-full bg-nfuko-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-nfuko-primary-700 dark:bg-nfuko-primary-500/10 dark:text-nfuko-primary-300">
                    {{ transactions.length }}
                </span>
            </header>

            <div v-if="loading" class="space-y-2 p-4">
                <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>

            <div v-else-if="!transactions.length" class="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
                <div class="flex size-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                    <Receipt :size="20" class="text-neutral-400" />
                </div>
                <p class="text-sm font-semibold text-neutral-700 dark:text-neutral-200">No transactions yet</p>
                <p class="max-w-xs text-xs text-neutral-400">
                    Deposits, withdrawals and charges on this account will appear here.
                </p>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[860px] border-collapse text-sm">
                    <thead>
                        <tr class="bg-neutral-50/80 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:bg-neutral-800/50">
                            <th class="px-4 py-2.5 font-semibold">Reference</th>
                            <th class="px-4 py-2.5 font-semibold">Type</th>
                            <th class="px-4 py-2.5 text-right font-semibold">Before charge</th>
                            <th class="px-4 py-2.5 text-right font-semibold">Charge</th>
                            <th class="px-4 py-2.5 text-right font-semibold">Balance</th>
                            <th class="px-4 py-2.5 font-semibold">Mode</th>
                            <th class="px-4 py-2.5 font-semibold">Narration</th>
                            <th class="px-4 py-2.5 font-semibold">By</th>
                            <th class="px-4 py-2.5 font-semibold">Date</th>
                            <th class="px-4 py-2.5 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                        <tr v-for="(item, idx) in transactions" :key="item.id ?? idx"
                            class="transition-colors hover:bg-nfuko-primary-50/40 dark:hover:bg-neutral-800/40"
                            :class="{ 'opacity-60': isReversed(item) }">
                            <td class="whitespace-nowrap px-4 py-3">
                                <span class="font-mono text-xs text-neutral-600 dark:text-neutral-300">{{ item.reference || '—' }}</span>
                            </td>
                            <td class="px-4 py-3">
                                <span :class="['inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold capitalize ring-1 ring-inset', txBadge(item.type)]">
                                    <component :is="isCredit(item.type) ? ArrowDownLeft : ArrowUpRight" :size="11" />
                                    {{ item.type || '—' }}
                                </span>
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                                {{ formatMoneyValue(Number(item.total ?? 0)) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums"
                                :class="Number(item.charge) > 0 ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-neutral-400'">
                                {{ formatMoneyValue(Number(item.charge ?? 0)) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-neutral-900 dark:text-white">
                                {{ formatMoneyValue(Number(item.amount ?? 0)) }}
                            </td>
                            <td class="px-4 py-3">
                                <span class="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                    {{ item.mode || '—' }}
                                </span>
                            </td>
                            <td class="max-w-[16rem] px-4 py-3">
                                <span class="line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400" :title="item.narration">
                                    {{ item.narration || '—' }}
                                </span>
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                                {{ item.transfer_by || '—' }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                                {{ fmtDateTime(item.created_at || item.transaction_date) }}
                            </td>
                            <td class="whitespace-nowrap px-4 py-3">
                                <div class="flex items-center justify-end gap-1.5">
                                    <button type="button" :disabled="isReversed(item)" @click="chargeReversal(item)"
                                        title="Reverse charge"
                                        class="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                        <Undo2 :size="12" /> Charge
                                    </button>
                                    <button type="button" :disabled="isReversed(item)" @click="fullReversal(item)"
                                        title="Full reversal"
                                        class="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                                        <Undo2 :size="12" /> Reverse
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</template>
