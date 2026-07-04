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
    if (props.mode === 'deposit') return 'Posted deposit entries, receipts, and running balances.';
    if (props.mode === 'withdrawal') return 'Posted withdrawal entries, receipts, and running balances.';
    if (props.mode === 'share-transaction') return 'Share activity with receipt references and account audit trail.';
    return 'Unified member ledger with debit, credit, account context, receipt, and running balance.';
});

const showLedgerAccountColumn = computed(() => props.showAccountColumn || props.mode === 'all');
const hideDebitAndCharges = computed(() => props.mode === 'deposit');
const hideChargeRows = computed(() => props.mode === 'deposit' || props.mode === 'withdrawal');
const showDebitColumn = computed(() => !hideDebitAndCharges.value);
const showCreditColumn = computed(() => props.mode !== 'withdrawal');

const normalizedType = (txn: any) => String(txn?.type ?? '').toLowerCase();
const isWithdrawal = (txn: any) => ['withdrawal', 'withdraw'].includes(normalizedType(txn));
const isDeposit = (txn: any) => normalizedType(txn) === 'deposit';
const isCharge = (txn: any) => normalizedType(txn).includes('charge');
const isReversal = (txn: any) => normalizedType(txn) === 'reversal';
const isShare = (txn: any) => normalizedType(txn) === 'share-transaction';
const canPrintReceipt = (txn: any) => Boolean(txn?.id) && !isCharge(txn);
const canReverseTransaction = (txn: any) => !isCharge(txn) && !txn?.is_reversed && !isReversal(txn) && txn?.is_reversible !== false;

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

function principalAmount(txn: any): number {
    const beforeCharges = amountOf(txn?.amount_before_charge);
    if (beforeCharges) return absoluteAmount(beforeCharges);
    const amount = amountOf(txn?.amount);
    if (amount) return absoluteAmount(amount);
    return absoluteAmount(txn?.amount_after_charge);
}

function debitAmount(txn: any): number {
    if (isCharge(txn)) return chargeAmount(txn);
    if (isWithdrawal(txn)) return principalAmount(txn);
    if (isReversal(txn) && amountOf(txn?.amount) < 0) return principalAmount(txn);
    return 0;
}

function creditAmount(txn: any): number {
    if (isDeposit(txn) || isShare(txn)) return principalAmount(txn);
    if (isReversal(txn) && amountOf(txn?.amount) >= 0) return principalAmount(txn);
    return 0;
}

function accountNumber(txn: any): string {
    return txn?.account?.account_no || txn?.account_no || txn?.savings_account?.account_no || txn?.member_account?.account_no || '-';
}

function accountType(txn: any): string {
    return txn?.account?.account_type || txn?.account_type || txn?.savings_account?.account_type || txn?.member_account?.account_type || 'Member account';
}

function transactionKey(txn: any): string {
    return String(txn?.id ?? txn?.reference ?? txn?.receipt_number ?? `${transactionDate(txn)}-${typeLabel(txn)}-${principalAmount(txn)}-${chargeAmount(txn)}`);
}

function transactionGroupKey(txn: any): string {
    return String(txn?.receipt_number || txn?.umbrella_code || txn?.grouped_with || txn?.reference || transactionKey(txn));
}

function transactionDate(txn: any): string {
    return txn?.transaction_date || txn?.created_at || '';
}

function postingOrder(txn: any): number {
    if (isDeposit(txn) || isWithdrawal(txn) || isShare(txn)) return 0;
    if (isCharge(txn)) return 1;
    if (isReversal(txn)) return 2;
    return 3;
}

function compareTransactionsAscending(a: any, b: any): number {
    const da = transactionDate(a) || '';
    const db = transactionDate(b) || '';
    if (da !== db) return da < db ? -1 : 1;

    if (transactionGroupKey(a) === transactionGroupKey(b)) {
        const pa = postingOrder(a);
        const pb = postingOrder(b);
        if (pa !== pb) return pa - pb;
    }

    const ca = String(a?.created_at || '');
    const cb = String(b?.created_at || '');
    if (ca !== cb) return ca < cb ? -1 : 1;

    return amountOf(a?.id) - amountOf(b?.id);
}

function sortTransactionsAscending(txns: any[]): any[] {
    return [...txns].sort(compareTransactionsAscending);
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

function formatNarrationAmount(value: string): string {
    return amountOf(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function displayNarration(txn: any): string {
    const fallback = isDeposit(txn) ? 'Member deposit' : isWithdrawal(txn) ? 'Member withdrawal' : typeLabel(txn);
    const narration = String(txn?.narration || fallback).trim();

    if (!isCharge(txn)) return narration;

    const chargeOfMatch = narration.match(/^(.+?\bcharges?\s+of\s+)(-?\d[\d,]*(?:\.\d+)?)/i);
    if (chargeOfMatch) {
        return `${chargeOfMatch[1]}${formatNarrationAmount(chargeOfMatch[2])}`;
    }

    const chargeColonMatch = narration.match(/^(.+?\bcharges?\s*:?\s*)(-?\d[\d,]*(?:\.\d+)?)/i);
    if (chargeColonMatch) {
        return `${chargeColonMatch[1]}${formatNarrationAmount(chargeColonMatch[2])}`;
    }

    if (chargeAmount(txn)) return `${typeLabel(txn)} of ${formatNarrationAmount(String(chargeAmount(txn)))}`;
    return narration;
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
                accountNumber(txn),
                accountType(txn),
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
            const rootGroups = new Set(txns.filter(rootFilter).map(transactionGroupKey).filter(Boolean));
            const rootIds = new Set(txns.filter(rootFilter).map((txn: any) => txn.id));

            txns = txns.filter((txn: any) => {
                if (rootFilter(txn)) return true;
                if (hideChargeRows.value && isCharge(txn)) return false;
                if (isCharge(txn) && rootGroups.has(transactionGroupKey(txn))) return true;
                if (isReversal(txn)) {
                    const original = txns.find((candidate: any) => candidate.id === txn.reversal_of);
                    if (!original) return false;
                    if (rootIds.has(original.id)) return true;
                    return isCharge(original) && rootGroups.has(transactionGroupKey(original));
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

    return sortTransactionsAscending(txns);
});

function accountKey(txn: any): string {
    return String(txn?.account?.id ?? txn?.account_id ?? accountNumber(txn) ?? 'default');
}

const balanceTransactions = computed(() => {
    if (props.mode === 'share-transaction') {
        return (props.transactions || []).filter(isShare);
    }

    if (props.mode === 'deposit') {
        return (props.transactions || []).filter(isDeposit);
    }

    if (props.mode === 'withdrawal') {
        return (props.transactions || []).filter(isWithdrawal);
    }

    return props.transactions || [];
});

// Running balance is computed on the FULL transaction set, oldest-first, and
// segregated per account — never on the filtered/sorted view. This makes each
// row's balance reflect the real account position after that posting, no matter
// how the ledger is currently sorted, paged, or filtered.
const ledgerBalances = computed(() => {
    const byTxn = new Map<string, number>();
    const byAccount = new Map<string, number>();

    const ordered = sortTransactionsAscending(balanceTransactions.value);

    ordered.forEach((txn: any) => {
        const acct = accountKey(txn);
        const movement = props.mode === 'withdrawal'
            ? debitAmount(txn)
            : creditAmount(txn) - debitAmount(txn);
        const next = (byAccount.get(acct) ?? 0) + movement;
        byAccount.set(acct, next);
        byTxn.set(transactionKey(txn), next);
    });

    let current = 0;
    byAccount.forEach((value) => (current += value));

    return { byTxn, current };
});

function displayRunningBalance(txn: any): number | null {
    return ledgerBalances.value.byTxn.get(transactionKey(txn)) ?? null;
}

const totals = computed(() => {
    const debit = filtered.value.reduce((sum: number, txn: any) => sum + debitAmount(txn), 0);
    const credit = filtered.value.reduce((sum: number, txn: any) => sum + creditAmount(txn), 0);
    const charges = filtered.value.reduce((sum: number, txn: any) => sum + chargeAmount(txn), 0);

    return {
        debit,
        credit,
        charges,
        net: credit - debit,
        latestBalance: props.transactions?.length ? ledgerBalances.value.current : null,
        postedCount: filtered.value.filter((txn: any) => transactionStatus(txn) === 'posted').length,
    };
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)));

const paginated = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    return filtered.value.slice(start, start + perPage.value);
});

const tableColspan = computed(() => {
    let count = 7;
    if (showDebitColumn.value) count += 1;
    if (showCreditColumn.value) count += 1;
    if (!props.showTable) count += 1;
    if (showLedgerAccountColumn.value) count += 1;
    if (props.mode === 'all') count += 1;
    return count;
});

const totalsLabelColspan = computed(() => 2 + (showLedgerAccountColumn.value ? 1 : 0));

const totalsTrailingColspan = computed(() => {
    let count = 2;
    if (showCreditColumn.value) count += 1;
    if (props.mode === 'all') count += 1;
    if (!props.showTable) count += 1;
    return count;
});

const balanceFooterLabel = computed(() => (props.mode === 'all' ? 'Latest balance' : 'Closing balance'));
const balanceHelpText = computed(() => {
    if (props.mode === 'deposit') {
        return 'Running balance is the cumulative total of deposits shown in this ledger.';
    }

    if (props.mode === 'withdrawal') {
        return 'Running balance is the cumulative total of withdrawals shown in this ledger.';
    }

    return 'Running balance is the per-account ledger position after each posting (full history, oldest first) — independent of the filters, sort, or page above.';
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

                <div
                    :class="[
                        'grid w-full grid-cols-2 gap-3 sm:grid-cols-3 xl:ml-auto xl:shrink-0',
                        hideChargeRows ? 'xl:max-w-2xl xl:grid-cols-3' : 'xl:max-w-3xl xl:grid-cols-5',
                    ]"
                >
                    <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500">Posted</p>
                        <p class="mt-1 font-mono text-sm font-bold text-slate-950">{{ totals.postedCount }}</p>
                    </div>
                    <div v-if="showCreditColumn" class="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                        <p class="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Credit</p>
                        <p class="mt-1 font-mono text-sm font-bold text-emerald-800">{{ formatCurrency(totals.credit) }}</p>
                    </div>
                    <div v-if="!hideDebitAndCharges" class="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
                        <p class="text-[10px] font-bold uppercase tracking-wide text-rose-700">Debit</p>
                        <p class="mt-1 font-mono text-sm font-bold text-rose-800">{{ formatCurrency(totals.debit) }}</p>
                    </div>
                    <div v-if="!hideChargeRows" class="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
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
                            <option v-if="!hideDebitAndCharges" value="withdrawal">Withdrawals</option>
                            <option v-if="!hideChargeRows" value="charge">Charges</option>
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
            <table class="w-full min-w-[1160px] border-collapse text-left">
                <thead>
                    <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        <th class="px-5 py-3">Value date</th>
                        <th class="px-5 py-3">Transaction</th>
                        <th v-if="showLedgerAccountColumn" class="px-5 py-3">Account</th>
                        <th v-if="showDebitColumn" class="px-5 py-3 text-right">Debit</th>
                        <th v-if="showCreditColumn" class="px-5 py-3 text-right">Credit</th>
                        <th class="px-5 py-3 text-right">Running balance</th>
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

                        <td v-if="showLedgerAccountColumn" class="px-5 py-4 align-top">
                            <div class="font-mono text-sm font-bold text-slate-900">{{ accountNumber(txn) }}</div>
                            <div class="mt-0.5 text-[11px] font-semibold capitalize text-slate-500">{{ accountType(txn) }}</div>
                        </td>

                        <td v-if="showDebitColumn" class="px-5 py-4 text-right align-top">
                            <span v-if="debitAmount(txn)" class="font-mono text-sm font-bold text-rose-700">
                                {{ formatCurrency(debitAmount(txn)) }}
                            </span>
                            <span v-else class="text-slate-300">-</span>
                        </td>

                        <td v-if="showCreditColumn" class="px-5 py-4 text-right align-top">
                            <span v-if="creditAmount(txn)" class="font-mono text-sm font-bold text-emerald-700">
                                {{ formatCurrency(creditAmount(txn)) }}
                            </span>
                            <span v-else class="text-slate-300">-</span>
                        </td>

                        <td class="px-5 py-4 text-right align-top">
                            <span v-if="displayRunningBalance(txn) !== null" class="font-mono text-sm font-bold text-slate-900">
                                {{ formatCurrency(displayRunningBalance(txn) ?? 0) }}
                            </span>
                            <span v-else class="text-slate-300">-</span>
                        </td>

                        <td class="max-w-[340px] px-5 py-4 align-top">
                            <div class="line-clamp-2 text-sm font-semibold text-slate-800">
                                {{ displayNarration(txn) }}
                            </div>
                            <div v-if="txn.grouped_with" class="mt-1 font-mono text-[11px] font-semibold text-slate-400">
                                Group: {{ txn.grouped_with }}
                            </div>
                        </td>

                        <td class="px-5 py-4 align-top">
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <div class="truncate font-mono text-sm font-bold text-slate-900">{{ txn.receipt_number || txn.umbrella_code || txn.grouped_with || txn.reference || '-' }}</div>
                                    <div class="mt-0.5 text-[11px] font-semibold text-slate-500">
                                        {{ txn.transaction_date ? formatDate(txn.transaction_date) : 'No value date' }}
                                    </div>
                                </div>
                                <button
                                    v-if="canPrintReceipt(txn)"
                                    type="button"
                                    class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
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
                                v-if="!isCharge(txn)"
                                type="button"
                                :disabled="!canReverseTransaction(txn)"
                                :title="txn.is_reversed ? 'Already reversed' : isReversal(txn) ? 'Reversal entry' : txn.is_reversible === false ? 'Locked transaction' : 'Reverse transaction'"
                                :class="[
                                    'mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border transition',
                                    !canReverseTransaction(txn)
                                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                                        : 'border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100',
                                ]"
                                @click="emit('reverse', txn)"
                            >
                                <RotateCcw :size="15" stroke-width="2.5" />
                                <span class="sr-only">Reverse transaction</span>
                            </button>
                            <span v-else class="text-slate-300">-</span>
                        </td>
                    </tr>
                </tbody>
                <tfoot v-if="filtered.length" class="border-t-2 border-slate-200 bg-slate-50">
                    <tr>
                        <td :colspan="totalsLabelColspan" class="px-5 py-4">
                            <div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">Filtered totals</div>
                            <div class="mt-0.5 text-xs font-semibold text-slate-500">
                                {{ filtered.length }} ledger entr{{ filtered.length === 1 ? 'y' : 'ies' }}
                            </div>
                        </td>
                        <td v-if="showDebitColumn" class="px-5 py-4 text-right align-top">
                            <div class="text-[11px] font-bold uppercase tracking-wide text-rose-600">Total debit</div>
                            <div class="mt-1 font-mono text-sm font-bold text-rose-800">{{ formatCurrency(totals.debit) }}</div>
                        </td>
                        <td v-if="showCreditColumn" class="px-5 py-4 text-right align-top">
                            <div class="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Total credit</div>
                            <div class="mt-1 font-mono text-sm font-bold text-emerald-800">{{ formatCurrency(totals.credit) }}</div>
                        </td>
                        <td class="px-5 py-4 text-right align-top">
                            <div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">{{ balanceFooterLabel }}</div>
                            <div v-if="totals.latestBalance !== null" class="mt-1 font-mono text-sm font-bold text-slate-950">
                                {{ formatCurrency(totals.latestBalance ?? 0) }}
                            </div>
                            <div v-else class="mt-1 text-sm font-bold text-slate-300">-</div>
                        </td>
                        <td :colspan="totalsTrailingColspan" class="px-5 py-4 align-top">
                            <div class="max-w-md text-xs font-semibold text-slate-500">
                                {{ balanceHelpText }}
                            </div>
                        </td>
                    </tr>
                </tfoot>
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
