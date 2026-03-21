<script setup lang="ts">
import { ref, computed } from 'vue';
import { RotateCcw, Printer } from 'lucide-vue-next';

const props = defineProps<{
    transactions: any[];
    mode: 'all' | 'deposit' | 'withdrawal'; // which tab we are on
    actionColor: string; // bg class for pagination current page button
    formatDate: (d?: string) => string;
    formatDateTime: (d?: string) => string;
    formatCurrency: (v?: string | number) => string;
    showAccountColumn?: boolean; // savings/withdrawal tabs show the account column
}>();

const emit = defineEmits<{
    print: [txn: any];
    reverse: [txn: any];
    openDrawer: [];
}>();

// Local pagination & filtering (shared across tabs via v-model-like pattern)
const currentPage = ref(1);
const perPage = ref(10);
const searchQuery = ref('');
const startDate = ref('');
const endDate = ref('');

const isWithdrawal = (t: any) => ['withdrawal', 'withdraw'].includes((t?.type || '').toLowerCase());
const isDeposit = (t: any) => (t?.type || '').toLowerCase() === 'deposit';

const filtered = computed(() => {
    let txns = props.transactions || [];
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        txns = txns.filter(t =>
            t.reference?.toLowerCase().includes(q) ||
            t.narration?.toLowerCase().includes(q) ||
            t.deposited_by?.toLowerCase().includes(q)
        );
    }
    if (startDate.value) txns = txns.filter(t => (t.transaction_date || t.created_at || '').slice(0, 10) >= startDate.value);
    if (endDate.value) txns = txns.filter(t => (t.transaction_date || t.created_at || '').slice(0, 10) <= endDate.value);

    if (props.mode === 'deposit' || props.mode === 'withdrawal') {
        const rootFilter = props.mode === 'deposit' ? isDeposit : isWithdrawal;
        // Collect references of root transactions that match this tab
        const rootRefs = new Set(txns.filter(rootFilter).map((t: any) => t.reference).filter(Boolean));
        // Also collect reversal_of IDs for reversal transactions whose original is in this group
        const rootIds = new Set(txns.filter(rootFilter).map((t: any) => t.id));
        return txns.filter((t: any) => {
            if (rootFilter(t)) return true;
            // Charges linked to a root transaction on this tab
            if (t.type === 'charge' && rootRefs.has(t.grouped_with)) return true;
            // Reversal of a root transaction or one of its charges
            if (t.type === 'reversal') {
                const original = txns.find((o: any) => o.id === t.reversal_of);
                if (!original) return false;
                // Reversal of the root itself
                if (rootIds.has(original.id)) return true;
                // Reversal of a charge that belongs to a root on this tab
                if (original.type === 'charge' && rootRefs.has(original.grouped_with)) return true;
            }
            return false;
        });
    }

    return txns;
});

const totalPages = computed(() => Math.ceil(filtered.value.length / perPage.value));

const paginated = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    return filtered.value.slice(start, start + perPage.value);
});

const clearDates = () => { startDate.value = ''; endDate.value = ''; };
</script>

<template>
    <div class="flex flex-col">
        <!-- Top Controls -->
        <div class="py-4 bg-transparent flex flex-wrap gap-4 justify-between items-center px-4 md:px-6">
            <div class="flex items-center gap-3">
                <input v-model="startDate" type="date"
                    class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
                <input v-model="endDate" type="date"
                    class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
                <button @click="clearDates"
                    class="h-10 px-5 text-[13px] font-bold rounded-full bg-[#f1f5f9] text-gray-700 hover:bg-[#e2e8f0] transition-colors">
                    Clear
                </button>
            </div>
            <div>
                <button v-if="mode === 'all'"
                    class="h-10 px-6 text-[13px] font-bold rounded-full bg-[#334155] text-white hover:bg-[#1e293b] transition-colors shadow-sm">
                    Export
                </button>
                <button v-else-if="mode === 'deposit'" @click="emit('openDrawer')"
                    class="h-10 px-6 text-[13px] font-bold rounded-full bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors shadow-sm">
                    Record Deposit
                </button>
                <button v-else @click="emit('openDrawer')"
                    class="h-10 px-6 text-[13px] font-bold rounded-full bg-[#ea580c] text-white hover:bg-[#c2410c] transition-colors shadow-sm">
                    Record Withdrawal
                </button>
            </div>
        </div>

        <!-- Table filters row -->
        <div class="py-2 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4 px-4 md:px-6">
            <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
                Show
                <select v-model="perPage" @change="currentPage = 1"
                    class="h-8 px-2 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50 cursor-pointer">
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                </select>
                entries
            </div>
            <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
                Search:
                <input v-model="searchQuery" @input="currentPage = 1" type="text"
                    class="h-9 w-[200px] sm:w-[250px] px-3 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50"
                    placeholder="Ref, Narration, Added by..." />
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto border-y border-gray-100">
            <table class="w-full text-left min-w-[900px]">
                <thead>
                    <tr class="border-b border-gray-100 bg-transparent text-[#64748b]">
                        <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">S/N</th>
                        <th v-if="mode === 'all'" class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Trans Type</th>
                        <th v-if="showAccountColumn" class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Account &#x21C5;</th>
                        <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Amount &#x21C5;</th>
                        <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Description &#x21C5;</th>
                        <th v-if="mode !== 'all'" class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Paid by &#x21C5;</th>
                        <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">{{ mode === 'all' ? 'Date' : 'Transaction Date &#x21C5;' }}</th>
                        <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">{{ mode === 'all' ? 'Receipt' : 'Reference &#x21C5;' }}</th>
                        <th v-if="mode !== 'all'" class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Date Added &#x21C5;</th>
                        <th v-if="mode === 'all'" class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Added by</th>
                        <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="!paginated.length">
                        <td :colspan="8" class="py-8 text-center text-[13px] text-muted-foreground">No transactions found.</td>
                    </tr>
                    <tr v-for="(txn, index) in paginated" :key="txn.id"
                        :class="['border-b border-transparent transition-colors',
                            txn.is_reversed ? 'opacity-50' : txn.type === 'reversal' ? 'bg-amber-50/50' : 'hover:bg-accent/30']">
                        <td class="py-3.5 px-5 text-[13px] text-muted-foreground">{{ (currentPage - 1) * perPage + index + 1 }}.</td>

                        <!-- Trans type badge (all tab only) -->
                        <td v-if="mode === 'all'" class="py-3.5 px-5">
                            <div class="flex flex-col gap-0.5">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit"
                                    :class="{
                                        'bg-emerald-100 text-emerald-700': txn.type === 'deposit',
                                        'bg-amber-100 text-amber-700':    txn.type === 'reversal',
                                        'bg-purple-100 text-purple-700':  txn.type === 'charge',
                                        'bg-red-100 text-red-700':        txn.type === 'withdrawal',
                                    }">
                                    {{ txn.type }}
                                </span>
                                <span v-if="txn.is_reversed" class="text-[9px] text-neutral-400 italic">reversed</span>
                            </div>
                        </td>

                        <!-- Account column (savings/withdrawal tabs) -->
                        <td v-if="showAccountColumn" class="py-3.5 px-5">
                            <div class="font-semibold text-[13px] text-foreground font-mono">{{ txn.account?.account_no || '—' }}</div>
                            <div class="text-[11px] text-muted-foreground capitalize">({{ txn.account?.account_type || 'Account' }})</div>
                        </td>

                        <!-- Amount -->
                        <td class="py-3.5 px-5">
                            <span class="text-[14px] font-mono font-bold"
                                :class="txn.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'">
                                {{ txn.type === 'deposit' ? '+' : '-' }}{{ formatCurrency(txn.amount) }}
                            </span>
                        </td>

                        <!-- Description -->
                        <td class="py-3.5 px-5 text-[13px] text-foreground">
                            <div>{{ txn.narration || (txn.type === 'deposit' ? 'Deposit' : 'Withdrawal') }}</div>
                            <div v-if="txn.charge_name" class="text-[11px] text-purple-600 font-semibold mt-0.5">{{ txn.charge_name }}</div>
                        </td>

                        <!-- Paid by (savings/withdrawal tabs) -->
                        <td v-if="mode !== 'all'" class="py-3.5 px-5 text-[13px] text-foreground">
                            {{ formatDate(txn.transaction_date || txn.created_at) }}
                        </td>

                        <!-- Date / Reference -->
                        <td class="py-3.5 px-5 text-[13px] text-foreground">
                            <template v-if="mode === 'all'">{{ formatDate(txn.transaction_date || txn.created_at) }}</template>
                            <template v-else>
                                <div class="flex items-center gap-2 font-mono">
                                    {{ txn.reference || '—' }}
                                    <button v-if="txn.reference" @click="emit('print', txn)"
                                        class="text-blue-600 hover:text-blue-800 transition-colors no-print" title="Print Receipt">
                                        <Printer :size="14" />
                                    </button>
                                </div>
                            </template>
                        </td>

                        <!-- Receipt (all tab) / Date Added (others) -->
                        <td v-if="mode === 'all'" class="py-3.5 px-5 text-[13px] text-foreground font-mono">
                            <div class="flex items-center gap-2">
                                {{ txn.reference || '—' }}
                                <button v-if="txn.reference" @click="emit('print', txn)"
                                    class="text-blue-600 hover:text-blue-800 transition-colors no-print" title="Print Receipt">
                                    <Printer :size="14" />
                                </button>
                            </div>
                        </td>
                        <td v-if="mode !== 'all'" class="py-3.5 px-5 text-[13px] text-foreground">
                            {{ formatDateTime(txn.created_at) }}
                        </td>

                        <!-- Added by (all tab) -->
                        <td v-if="mode === 'all'" class="py-3.5 px-5 text-[13px] text-foreground">{{ txn.deposited_by || '—' }}</td>

                        <!-- Action -->
                        <td class="py-3.5 px-5 text-center">
                            <button @click="emit('reverse', txn)"
                                :disabled="txn.is_reversed || txn.type === 'reversal' || txn.is_reversible === false"
                                :title="txn.is_reversed ? 'Already reversed' : txn.type === 'reversal' ? 'Reversal entry' : txn.is_reversible === false ? 'Non-reversible charge' : 'Reverse Transaction'"
                                :class="['flex mx-auto h-8 w-8 items-center justify-center rounded-full transition-colors',
                                    (txn.is_reversed || txn.type === 'reversal' || txn.is_reversible === false)
                                        ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100']">
                                <RotateCcw :size="14" stroke-width="2.5" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="py-5 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#64748b]">
            <div>
                Showing {{ filtered.length ? (currentPage - 1) * perPage + 1 : 0 }}
                to {{ Math.min(currentPage * perPage, filtered.length) }} of {{ filtered.length }} entries
            </div>
            <div class="flex items-center gap-2">
                <button @click="currentPage--" :disabled="currentPage === 1"
                    class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50">&lsaquo;</button>
                <button :class="['w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-[12px]', actionColor]">
                    {{ currentPage }}
                </button>
                <button @click="currentPage++" :disabled="currentPage === totalPages"
                    class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50">&rsaquo;</button>
            </div>
        </div>
    </div>
</template>
