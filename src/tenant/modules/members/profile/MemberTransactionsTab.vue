<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Filter,
    Printer,
    RotateCcw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-vue-next';

const props = defineProps<{
    showTable: boolean;
    transactions: any[];
    mode: 'all' | 'deposit' | 'withdrawal' | 'share-transaction';
    actionColor: string;
    formatDate: (d?: string) => string;
    formatDateTime: (d?: string) => string;
    formatCurrency: (v?: string | number) => string;
    showAccountColumn?: boolean;
}>();

const emit = defineEmits<{
    print: [txn: any];
    showTable: false;
    reverse: [txn: any];
    openDrawer: [];
}>();

const currentPage = ref(1);
const perPage = ref(10);
const searchQuery = ref('');
const startDate = ref('');
const endDate = ref('');
const typeFilter = ref('all');
const statusFilter = ref('all');

const modeTitle = computed(() => {
    if (props.mode === 'deposit') return 'Savings deposits ledger';
    if (props.mode === 'withdrawal') return 'Withdrawals ledger';
    if (props.mode === 'share-transaction') return 'Share transactions ledger';
    return 'Member transactions ledger';
});

const modeSubtitle = computed(() => {
    if (props.mode === 'deposit') return 'Posted deposit entries, charges, receipts, and resulting balances.';
    if (props.mode === 'withdrawal') return 'Posted withdrawals, withdrawal charges, receipts, and resulting balances.';
    if (props.mode === 'share-transaction') return 'Share activity with receipt references and account audit trail.';
    return 'Unified member ledger with debit, credit, charges, receipt, and reversal status.';
});

const normalizedType = (txn: any) => String(txn?.type ?? '').toLowerCase();
const isWithdrawal = (txn: any) => ['withdrawal', 'withdraw'].includes(normalizedType(txn));
const isDeposit = (txn: any) => normalizedType(txn) === 'deposit';
const isCharge = (txn: any) => normalizedType(txn).includes('charge');
const isReversal = (txn: any) => normalizedType(txn) === 'reversal';
const isShare = (txn: any) => normalizedType(txn) === 'share-transaction';

function amountOf(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;
    const numeric = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
}

function absoluteAmount(value: unknown): number {
    return Math.abs(amountOf(value));
}

function chargeAmount(txn: any): number {
    if (amountOf(txn?.charge_amount) > 0) return absoluteAmount(txn.charge_amount);
    if (amountOf(txn?.charge) > 0) return absoluteAmount(txn.charge);
    if (isCharge(txn)) {
        return absoluteAmount(txn?.amount_after_charge || txn?.amount || txn?.amount_before_charge);
    }
    return 0;
}

function postedAmount(txn: any): number {
    const afterCharges = amountOf(txn?.amount_after_charge);
    if (afterCharges) return absoluteAmount(afterCharges);
    const amount = amountOf(txn?.amount);
    if (amount) return absoluteAmount(amount);
    return absoluteAmount(txn?.amount_before_charge);
}

function debitAmount(txn: any): number {
    if (isWithdrawal(txn) || isCharge(txn)) return isCharge(txn) ? chargeAmount(txn) : postedAmount(txn);
    if (isReversal(txn) && amountOf(txn?.amount) < 0) return postedAmount(txn);
    return 0;
}

function creditAmount(txn: any): number {
    if (isDeposit(txn) || isShare(txn)) return postedAmount(txn);
    if (isReversal(txn) && amountOf(txn?.amount) >= 0) return postedAmount(txn);
    return 0;
}

function balanceAfter(txn: any): number | null {
    if (isCharge(txn)) return null;
    if (txn?.balance_after !== undefined && txn?.balance_after !== null) return amountOf(txn.balance_after);
    if (txn?.running_balance !== undefined && txn?.running_balance !== null) {
        if (txn?.amount !== undefined && txn?.amount !== null) {
            return amountOf(txn.amount) + amountOf(txn.running_balance);
        }
        return amountOf(txn.running_balance);
    }
    return null;
}

function transactionDate(txn: any): string {
    return txn?.transaction_date || txn?.created_at || '';
}

function transactionStatus(txn: any): 'reversed' | 'reversal' | 'locked' | 'posted' {
    if (txn?.is_reversed) return 'reversed';
    if (isReversal(txn)) return 'reversal';
    if (txn?.is_reversible === false) return 'locked';
    return 'posted';
}

function typeLabel(txn: any): string {
    const type = normalizedType(txn);
    if (type === 'deposit') return 'Deposit';
    if (type === 'withdrawal' || type === 'withdraw') return 'Withdrawal';
    if (type === 'share-transaction') return 'Share transaction';
    if (type === 'reversal') return 'Reversal';
    if (type.includes('charge')) return 'Charge';
    return type ? type.replace(/[-_]/g, ' ') : 'Transaction';
}

function typeBadgeClass(txn: any): string {
    if (isDeposit(txn) || isShare(txn)) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    if (isWithdrawal(txn)) return 'bg-rose-50 text-rose-700 ring-rose-600/20';
    if (isCharge(txn)) return 'bg-slate-100 text-slate-700 ring-slate-500/20';
    if (isReversal(txn)) return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    return 'bg-blue-50 text-blue-700 ring-blue-600/20';
}

function statusBadgeClass(status: string): string {
    if (status === 'posted') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    if (status === 'locked') return 'bg-slate-100 text-slate-600 ring-slate-500/20';
    if (status === 'reversal') return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    return 'bg-rose-50 text-rose-700 ring-rose-600/20';
}

const filtered = computed(() => {
    let txns = props.transactions || [];

    if (searchQuery.value.trim()) {
        const query = searchQuery.value.trim().toLowerCase();
        txns = txns.filter((txn: any) => {
            const haystack = [
                txn?.reference,
                txn?.narration,
                txn?.deposited_by,
                txn?.charge_name,
                txn?.account?.account_no,
                txn?.account?.account_type,
                typeLabel(txn),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    }

    if (startDate.value) {
        txns = txns.filter((txn: any) => transactionDate(txn).slice(0, 10) >= startDate.value);
    }

    if (endDate.value) {
        txns = txns.filter((txn: any) => transactionDate(txn).slice(0, 10) <= endDate.value);
    }

    if (props.mode === 'deposit' || props.mode === 'withdrawal' || props.mode === 'share-transaction') {
        if (props.mode === 'share-transaction') {
            txns = txns.filter(isShare);
        } else {
            const rootFilter = props.mode === 'deposit' ? isDeposit : isWithdrawal;
            const rootRefs = new Set(txns.filter(rootFilter).map((txn: any) => txn.reference).filter(Boolean));
            const rootIds = new Set(txns.filter(rootFilter).map((txn: any) => txn.id));

            txns = txns.filter((txn: any) => {
                if (rootFilter(txn)) return true;
                if (isCharge(txn) && rootRefs.has(txn.grouped_with)) return true;
                if (isReversal(txn)) {
                    const original = txns.find((candidate: any) => candidate.id === txn.reversal_of);
                    if (!original) return false;
                    if (rootIds.has(original.id)) return true;
                    return isCharge(original) && rootRefs.has(original.grouped_with);
                }
                return false;
            });
        }
    }

    if (typeFilter.value !== 'all') {
        txns = txns.filter((txn: any) => {
            if (typeFilter.value === 'charge') return isCharge(txn);
            if (typeFilter.value === 'deposit') return isDeposit(txn);
            if (typeFilter.value === 'withdrawal') return isWithdrawal(txn);
            if (typeFilter.value === 'reversal') return isReversal(txn);
            if (typeFilter.value === 'share-transaction') return isShare(txn);
            return normalizedType(txn) === typeFilter.value;
        });
    }

    if (statusFilter.value !== 'all') {
        txns = txns.filter((txn: any) => transactionStatus(txn) === statusFilter.value);
    }

    return txns;
});

const totals = computed(() => {
    const debit = filtered.value.reduce((sum: number, txn: any) => sum + debitAmount(txn), 0);
    const credit = filtered.value.reduce((sum: number, txn: any) => sum + creditAmount(txn), 0);
    const charges = filtered.value.reduce((sum: number, txn: any) => sum + chargeAmount(txn), 0);
    const balanceValues = filtered.value
        .map(balanceAfter)
        .filter((value: number | null): value is number => value !== null);
    const lastBalance = balanceValues.length ? balanceValues[balanceValues.length - 1] : undefined;

    return {
        debit,
        credit,
        charges,
        net: credit - debit,
        closingBalance: lastBalance ?? 0,
        postedCount: filtered.value.filter((txn: any) => transactionStatus(txn) === 'posted').length,
    };
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)));

const paginated = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    return filtered.value.slice(start, start + perPage.value);
});

const tableColspan = computed(() => {
    let count = 10;
    if (props.showAccountColumn) count += 1;
    if (props.mode === 'all') count += 1;
    return count;
});

watch([filtered, perPage], () => {
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
});

function resetPage() {
    currentPage.value = 1;
}

function clearFilters() {
    startDate.value = '';
    endDate.value = '';
    searchQuery.value = '';
    typeFilter.value = 'all';
    statusFilter.value = 'all';
    currentPage.value = 1;
}
</script>

<template>
    <section class="bg-slate-50/70">
        <div v-if="!showTable" class="border-b border-slate-200 bg-white px-4 py-5 md:px-6">
            <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cda434]/10 text-[#9f7b16]">
                            <ShieldCheck :size="18" />
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-slate-950">{{ modeTitle }}</h3>
                            <p class="mt-0.5 text-xs font-medium text-slate-500">{{ modeSubtitle }}</p>
                        </div>
                    </div>
                </div>

                <div class="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 xl:max-w-3xl xl:grid-cols-5">
                    <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Posted</p>
                        <p class="mt-1 font-mono text-sm font-bold text-slate-950">{{ totals.postedCount }}</p>
                    </div>
                    <div class="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                        <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Credit</p>
                        <p class="mt-1 font-mono text-sm font-bold text-emerald-800">{{ formatCurrency(totals.credit) }}</p>
                    </div>
                    <div class="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
                        <p class="text-[10px] font-bold uppercase tracking-wide text-rose-700">Debit</p>
                        <p class="mt-1 font-mono text-sm font-bold text-rose-800">{{ formatCurrency(totals.debit) }}</p>
                    </div>
                    <div class="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                        <p class="text-[10px] font-bold uppercase tracking-wide text-amber-700">Charges</p>
                        <p class="mt-1 font-mono text-sm font-bold text-amber-800">{{ formatCurrency(totals.charges) }}</p>
                    </div>
                    <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Net movement</p>
                        <p
                            :class="[
                                'mt-1 font-mono text-sm font-bold',
                                totals.net >= 0 ? 'text-emerald-700' : 'text-rose-700',
                            ]"
                        >
                            {{ formatCurrency(totals.net) }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="mt-5 grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-end">
                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <label class="block">
                        <span class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            <CalendarDays :size="13" /> From
                        </span>
                        <input
                            v-model="startDate"
                            type="date"
                            class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20"
                            @change="resetPage"
                        />
                    </label>
                    <label class="block">
                        <span class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            <CalendarDays :size="13" /> To
                        </span>
                        <input
                            v-model="endDate"
                            type="date"
                            class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20"
                            @change="resetPage"
                        />
                    </label>
                    <label class="block">
                        <span class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            <Filter :size="13" /> Type
                        </span>
                        <select
                            v-model="typeFilter"
                            class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20"
                            @change="resetPage"
                        >
                            <option value="all">All types</option>
                            <option value="deposit">Deposits</option>
                            <option value="withdrawal">Withdrawals</option>
                            <option value="charge">Charges</option>
                            <option value="share-transaction">Shares</option>
                            <option value="reversal">Reversals</option>
                        </select>
                    </label>
                    <label class="block">
                        <span class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            <SlidersHorizontal :size="13" /> Status
                        </span>
                        <select
                            v-model="statusFilter"
                            class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20"
                            @change="resetPage"
                        >
                            <option value="all">All status</option>
                            <option value="posted">Posted</option>
                            <option value="locked">Locked</option>
                            <option value="reversal">Reversal</option>
                            <option value="reversed">Reversed</option>
                        </select>
                    </label>
                    <label class="block sm:col-span-2 xl:col-span-1">
                        <span class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            <Search :size="13" /> Search ledger
                        </span>
                        <input
                            v-model="searchQuery"
                            type="search"
                            placeholder="Receipt, narration, account..."
                            class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20"
                            @input="resetPage"
                        />
                    </label>
                </div>

                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        class="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        @click="clearFilters"
                    >
                        Clear
                    </button>
                    <select
                        v-model="perPage"
                        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#cda434] focus:ring-2 focus:ring-[#cda434]/20"
                        @change="resetPage"
                    >
                        <option :value="10">10 rows</option>
                        <option :value="25">25 rows</option>
                        <option :value="50">50 rows</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="overflow-x-auto border-b border-slate-200 bg-white">
            <table class="w-full min-w-[1180px] border-collapse text-left">
                <thead>
                    <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        <th class="px-5 py-3">Value date</th>
                        <th class="px-5 py-3">Transaction</th>
                        <th v-if="showAccountColumn" class="px-5 py-3">Account</th>
                        <th class="px-5 py-3 text-right">Debit</th>
                        <th class="px-5 py-3 text-right">Credit</th>
                        <th class="px-5 py-3 text-right">Charge</th>
                        <th class="px-5 py-3 text-right">Balance after</th>
                        <th class="px-5 py-3">Narration</th>
                        <th class="px-5 py-3">Receipt</th>
                        <th v-if="mode === 'all'" class="px-5 py-3">Captured by</th>
                        <th class="px-5 py-3">Status</th>
                        <th v-if="!showTable" class="px-5 py-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr v-if="!paginated.length">
                        <td :colspan="tableColspan" class="px-5 py-14 text-center">
                            <div class="mx-auto max-w-sm">
                                <p class="text-sm font-bold text-slate-700">No transactions found</p>
                                <p class="mt-1 text-xs font-medium text-slate-500">Adjust the date range, type, status, or search terms.</p>
                            </div>
                        </td>
                    </tr>

                    <tr
                        v-for="txn in paginated"
                        :key="txn.id"
                        :class="[
                            'bg-white transition hover:bg-slate-50/80',
                            txn.is_reversed ? 'opacity-60' : '',
                            isReversal(txn) ? 'bg-amber-50/30' : '',
                        ]"
                    >
                        <td class="px-5 py-4 align-top">
                            <div class="text-sm font-bold text-slate-900">{{ formatDate(transactionDate(txn)) }}</div>
                            <div class="mt-0.5 text-[11px] font-semibold text-slate-400">{{ formatDateTime(txn.created_at) }}</div>
                        </td>

                        <td class="px-5 py-4 align-top">
                            <div class="flex flex-col gap-1">
                                <span
                                    :class="[
                                        'inline-flex w-fit items-center rounded-md px-2 py-1 text-[11px] font-bold capitalize ring-1 ring-inset',
                                        typeBadgeClass(txn),
                                    ]"
                                >
                                    {{ typeLabel(txn) }}
                                </span>
                                <span v-if="txn.charge_name" class="text-[11px] font-semibold text-slate-500">{{ txn.charge_name }}</span>
                            </div>
                        </td>

                        <td v-if="showAccountColumn" class="px-5 py-4 align-top">
                            <div class="font-mono text-sm font-bold text-slate-900">{{ txn.account?.account_no || '-' }}</div>
                            <div class="mt-0.5 text-[11px] font-semibold capitalize text-slate-500">{{ txn.account?.account_type || 'Member account' }}</div>
                        </td>

                        <td class="px-5 py-4 text-right align-top">
                            <span v-if="debitAmount(txn)" class="font-mono text-sm font-bold text-rose-700">
                                {{ formatCurrency(debitAmount(txn)) }}
                            </span>
                            <span v-else class="text-slate-300">-</span>
                        </td>

                        <td class="px-5 py-4 text-right align-top">
                            <span v-if="creditAmount(txn)" class="font-mono text-sm font-bold text-emerald-700">
                                {{ formatCurrency(creditAmount(txn)) }}
                            </span>
                            <span v-else class="text-slate-300">-</span>
                        </td>

                        <td class="px-5 py-4 text-right align-top">
                            <span v-if="chargeAmount(txn)" class="font-mono text-sm font-bold text-amber-700">
                                {{ formatCurrency(chargeAmount(txn)) }}
                            </span>
                            <span v-else class="text-slate-300">-</span>
                        </td>

                        <td class="px-5 py-4 text-right align-top">
                            <span v-if="balanceAfter(txn) !== null" class="font-mono text-sm font-bold text-slate-900">
                                {{ formatCurrency(balanceAfter(txn) ?? 0) }}
                            </span>
                            <span v-else class="text-slate-300">-</span>
                        </td>

                        <td class="max-w-[280px] px-5 py-4 align-top">
                            <div class="line-clamp-2 text-sm font-semibold text-slate-800">
                                {{ txn.narration || (isDeposit(txn) ? 'Member deposit' : isWithdrawal(txn) ? 'Member withdrawal' : typeLabel(txn)) }}
                            </div>
                            <div v-if="txn.grouped_with" class="mt-1 font-mono text-[11px] font-semibold text-slate-400">
                                Group: {{ txn.grouped_with }}
                            </div>
                        </td>

                        <td class="px-5 py-4 align-top">
                            <div class="flex items-start gap-2">
                                <div>
                                    <div class="font-mono text-sm font-bold text-slate-900">{{ txn.reference || '-' }}</div>
                                    <div class="mt-0.5 text-[11px] font-semibold text-slate-500">
                                        {{ txn.transaction_date ? formatDate(txn.transaction_date) : 'No value date' }}
                                    </div>
                                </div>
                                <button
                                    v-if="txn.reference"
                                    type="button"
                                    class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                                    title="Print receipt"
                                    @click="emit('print', txn)"
                                >
                                    <Printer :size="15" />
                                    <span class="sr-only">Print receipt</span>
                                </button>
                            </div>
                        </td>

                        <td v-if="mode === 'all'" class="px-5 py-4 align-top">
                            <div class="text-sm font-bold text-slate-800">{{ txn.deposited_by || '-' }}</div>
                        </td>

                        <td class="px-5 py-4 align-top">
                            <span
                                :class="[
                                    'inline-flex rounded-md px-2 py-1 text-[11px] font-bold capitalize ring-1 ring-inset',
                                    statusBadgeClass(transactionStatus(txn)),
                                ]"
                            >
                                {{ transactionStatus(txn) }}
                            </span>
                        </td>

                        <td v-if="!showTable" class="px-5 py-4 text-center align-top">
                            <button
                                type="button"
                                :disabled="txn.is_reversed || isReversal(txn) || txn.is_reversible === false"
                                :title="txn.is_reversed ? 'Already reversed' : isReversal(txn) ? 'Reversal entry' : txn.is_reversible === false ? 'Locked transaction' : 'Reverse transaction'"
                                :class="[
                                    'mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border transition',
                                    txn.is_reversed || isReversal(txn) || txn.is_reversible === false
                                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                                        : 'border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100',
                                ]"
                                @click="emit('reverse', txn)"
                            >
                                <RotateCcw :size="15" stroke-width="2.5" />
                                <span class="sr-only">Reverse transaction</span>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="!showTable" class="flex flex-col gap-3 bg-white px-4 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div>
                Showing
                <span class="font-mono font-bold text-slate-800">{{ filtered.length ? (currentPage - 1) * perPage + 1 : 0 }}</span>
                to
                <span class="font-mono font-bold text-slate-800">{{ Math.min(currentPage * perPage, filtered.length) }}</span>
                of
                <span class="font-mono font-bold text-slate-800">{{ filtered.length }}</span>
                ledger entries
            </div>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="currentPage === 1"
                    @click="currentPage--"
                >
                    <ChevronLeft :size="16" />
                    <span class="sr-only">Previous page</span>
                </button>
                <span class="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#cda434] px-3 font-mono text-sm font-bold text-white">
                    {{ currentPage }} / {{ totalPages }}
                </span>
                <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="currentPage === totalPages"
                    @click="currentPage++"
                >
                    <ChevronRight :size="16" />
                    <span class="sr-only">Next page</span>
                </button>
            </div>
        </div>
    </section>
</template>
