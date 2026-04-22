<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import { UserCircle2, FileText, TrendingUp, MinusCircle, Wallet, BarChart3, RotateCcw, Printer } from 'lucide-vue-next';
import { formatMoneyValue } from '@/Global';
import { tenantClient } from '@/tenant/apis/tenantClient';
import { useCurrencyStore } from '@/stores/currency';
import { useMember } from '../composables/useMember';
import MemberSidebar from '../components/MemberSidebar.vue';
import MemberActionBar from '../components/MemberActionBar.vue';
import MemberAccountsTable from '../components/MemberAccountsTable.vue';
import MemberTransactionsTab from '../components/MemberTransactionsTab.vue';
import DepositWithdrawDrawer from '../components/DepositWithdrawDrawer.vue';
import NewAccountDrawer from '../components/NewAccountDrawer.vue';
import CustomFeeDrawer from '../components/CustomFeeDrawer.vue';

const router = useRouter();
const route = useRoute();
const { currencyCode } = storeToRefs(useCurrencyStore());

const {
    member, savingsProducts, pageLoading, fetchMember,
    memberInitials, computedAge, currentBalance,
    avatarInput, uploadProcessing, triggerAvatarUpload, handleAvatarUpload,
    approving, rejecting, approveMember, rejectMember,
    deleting, deleteMember,
} = useMember();

onMounted(fetchMember);
watch(() => route.params.id, (id) => { if (id) fetchMember(); });

// ── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref('profile');

const tabs = computed(() => [
    { id: 'profile',      label: 'Profile',      icon: UserCircle2, count: null },
    { id: 'transactions', label: 'Transactions',  icon: FileText,    count: member.transactions?.length || 0 },
    { id: 'savings',      label: 'Savings',       icon: TrendingUp,  count: member.transactions?.filter((t: any) => t.type?.toLowerCase() === 'deposit').length || 0 },
    { id: 'withdrawal',   label: 'Withdrawal',    icon: MinusCircle, count: member.transactions?.filter((t: any) => ['withdrawal','withdraw'].includes(t.type?.toLowerCase())).length || 0 },
    { id: 'loans',        label: 'Loans',         icon: Wallet,      count: member.loans?.length || 0 },
    { id: 'shares',       label: 'Shares',        icon: BarChart3,   count: null },
]);

// ── Drawer refs ──────────────────────────────────────────────────────────────
const depositDrawer = ref<any>(null);
const newAccountDrawer = ref<any>(null);
const customFeeDrawer = ref<any>(null);

// ── Transaction reversal ────────────────────────────────────────────────────
const showTxnDeleteDialog = ref(false);
const txnToDelete = ref<any>(null);
const isDeletingTxn = ref(false);

const confirmDeleteTxn = (txn: any) => {
    if (txn.is_reversed || txn.type === 'reversal' || txn.is_reversible === false) return;
    txnToDelete.value = txn;
    showTxnDeleteDialog.value = true;
};

const executeDeleteTxn = async () => {
    if (!txnToDelete.value) return;
    isDeletingTxn.value = true;
    try {
        await tenantClient.post(`/transactions/${txnToDelete.value.id}/reverse`);
        toast.success('Transaction reversed successfully.');
        showTxnDeleteDialog.value = false;
        txnToDelete.value = null;
        // Refresh member data so balances and the full transaction list are up to date
        fetchMember(true);
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to reverse transaction.');
    } finally {
        isDeletingTxn.value = false;
    }
};

// ── Receipt printing ─────────────────────────────────────────────────────────
const printingTxn = ref<any>(null);

const printReceipt = (txn: any) => {
    printingTxn.value = txn;
    setTimeout(() => {
        document.body.classList.add('receipt-print');
        window.print();
        printingTxn.value = null;
        document.body.classList.remove('receipt-print');
    }, 100);
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatCurrency = (amount?: string | number) =>
    formatMoneyValue(amount ?? 0);

// ── Handle member delete ─────────────────────────────────────────────────────
const handleDelete = () => deleteMember(() => router.push('/tenant/members'));
</script>

<template>
    <!-- Loading state -->
    <div v-if="pageLoading" class="flex items-center justify-center min-h-[60vh]">
        <div class="flex flex-col items-center gap-3">
            <div class="relative h-12 w-12">
                <div class="absolute inset-0 rounded-full border-4 border-[#cda434]/20"></div>
                <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#cda434] border-r-[#cda434] animate-spin"></div>
                <div class="absolute inset-2 rounded-full bg-[#cda434]/10"></div>
            </div>
            <div class="text-[12px] font-bold uppercase tracking-widest text-[#cda434]">Loading Member Data</div>
        </div>
    </div>

    <template v-else>
        <div class="min-h-screen bg-background text-foreground relative">
            <div class="relative z-10 p-5 flex flex-col lg:flex-row gap-5">

                <!-- Left Sidebar -->
                <MemberSidebar
                    :member="member"
                    :member-initials="memberInitials"
                    :computed-age="computedAge"
                    :upload-processing="uploadProcessing"
                    :format-date="formatDate"
                    @avatar-click="triggerAvatarUpload"
                />
                <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept="image/*" class="hidden" />

                <!-- Right Main Area -->
                <div class="flex-1 flex flex-col gap-5">

                    <!-- Approval/Rejection banners + action buttons -->
                    <MemberActionBar
                        :member="member"
                        :approving="approving"
                        :rejecting="rejecting"
                        :deleting="deleting"
                        @deposit="() => depositDrawer?.open('deposit')"
                        @withdraw="() => depositDrawer?.open('withdraw')"
                        @approve="approveMember"
                        @reject="(reason: string) => rejectMember(reason)"
                        @delete="handleDelete"
                    />

                    <!-- Accounts table -->
                    <MemberAccountsTable
                        :accounts="member.savings_accounts"
                        :currency-code="currencyCode"
                        :format-currency="formatCurrency"
                        @new-account="() => newAccountDrawer?.openDrawer()"
                        @custom-fee="(account: any) => customFeeDrawer?.openDrawer(account)"
                    />

                    <!-- Tabs -->
                    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <!-- Tab bar -->
                        <div class="flex overflow-x-auto border-b border-gray-100 px-4">
                            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
                                :class="['relative flex items-center gap-2 px-4 py-4 text-[13px] font-bold transition-colors whitespace-nowrap',
                                    activeTab === tab.id ? 'text-[#cda434]' : 'text-[#788896] hover:text-gray-900']">
                                <component :is="tab.icon" :size="16" />
                                {{ tab.label }}
                                <span v-if="tab.count !== null"
                                    class="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-md text-[11px] font-bold font-mono bg-gray-100 text-[#788896]">
                                    {{ tab.count }}
                                </span>
                                <div v-if="activeTab === tab.id"
                                    class="absolute bottom-0 left-4 right-4 h-[3px] bg-[#cda434] rounded-t-full"></div>
                            </button>
                        </div>

                        <!-- Profile tab -->
                        <div v-show="activeTab === 'profile'" class="p-6">
                            <div class="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                    <div class="p-5 border-r border-b border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Date Joined</span>
                                        <p class="text-[16px] font-bold text-gray-900 tracking-tight">{{ formatDate(member.joined_at || member.created_at) }}</p>
                                    </div>
                                    <div class="p-5 border-r border-b border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Referred By</span>
                                        <p class="text-[15px] font-bold text-gray-900 tracking-tight">{{ member.referred_by_name || '—' }}</p>
                                    </div>
                                    <div class="p-5 border-b border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Registered By</span>
                                        <p class="text-[15px] font-bold text-gray-900 tracking-tight">{{ member.registered_by_name || '—' }}</p>
                                    </div>
                                    <div class="p-5 border-r border-b border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Member Type</span>
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ebf7ee] text-[#22a053]">
                                            {{ member.member_type ? member.member_type.replace('_', ' ') : 'new member' }}
                                        </span>
                                    </div>
                                    <div class="p-5 border-r border-b border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Other Contact</span>
                                        <p class="text-[15px] font-bold text-gray-900 font-mono tracking-tight">{{ member.other_contact || '—' }}</p>
                                    </div>
                                    <div class="p-5 border-b border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Mobile Money</span>
                                        <p class="text-[15px] font-bold text-gray-900 font-mono tracking-tight">{{ member.mobile_money_number || '—' }}</p>
                                    </div>
                                    <div class="p-5 border-r border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Address</span>
                                        <p class="text-[16px] font-bold text-gray-900 tracking-tight capitalize">{{ member.address || '—' }}</p>
                                    </div>
                                    <div class="p-5 border-r border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Next Of Kin</span>
                                        <p class="text-[16px] font-bold text-gray-900 tracking-tight capitalize">{{ member.next_of_kin || '—' }}</p>
                                    </div>
                                    <div class="p-5 border-r border-gray-100">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Next of Kin Contacts</span>
                                        <p class="text-[15px] font-bold text-gray-900 font-mono tracking-tight">{{ member.next_of_kin_contact || '—' }}</p>
                                    </div>
                                    <div class="p-5 flex flex-col justify-center">
                                        <span class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Nationality</span>
                                        <p class="text-[16px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                            <template v-if="member.nationality"><span>🇺🇬</span> {{ member.nationality }}</template>
                                            <template v-else><span class="font-mono text-gray-900">—</span></template>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Transactions tab -->
                        <MemberTransactionsTab
                            v-show="activeTab === 'transactions'"
                            :transactions="member.transactions"
                            mode="all"
                            action-color="bg-[#cda434]"
                            :format-date="formatDate"
                            :format-date-time="formatDateTime"
                            :format-currency="formatCurrency"
                            @print="printReceipt"
                            @reverse="confirmDeleteTxn"
                        />

                        <!-- Savings tab -->
                        <MemberTransactionsTab
                            v-show="activeTab === 'savings'"
                            :transactions="member.transactions"
                            mode="deposit"
                            action-color="bg-[#16a34a]"
                            :show-account-column="true"
                            :format-date="formatDate"
                            :format-date-time="formatDateTime"
                            :format-currency="formatCurrency"
                            @print="printReceipt"
                            @reverse="confirmDeleteTxn"
                            @open-drawer="() => depositDrawer?.open('deposit')"
                        />

                        <!-- Withdrawal tab -->
                        <MemberTransactionsTab
                            v-show="activeTab === 'withdrawal'"
                            :transactions="member.transactions"
                            mode="withdrawal"
                            action-color="bg-[#ea580c]"
                            :show-account-column="true"
                            :format-date="formatDate"
                            :format-date-time="formatDateTime"
                            :format-currency="formatCurrency"
                            @print="printReceipt"
                            @reverse="confirmDeleteTxn"
                            @open-drawer="() => depositDrawer?.open('withdraw')"
                        />

                        <!-- Shares placeholder -->
                        <div v-show="activeTab === 'shares'" class="p-12 text-center">
                            <div class="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                                <BarChart3 :size="20" class="text-[#64748b]" />
                            </div>
                            <h4 class="text-[15px] font-bold text-[#0f172a]">Shares History</h4>
                            <p class="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">Track and manage member shares, certificates, and dividends here.</p>
                        </div>

                        <!-- Loans placeholder -->
                        <div v-show="activeTab === 'loans'" class="p-12 text-center">
                            <div class="w-12 h-12 rounded-full bg-[#eff6ff] flex items-center justify-center mx-auto mb-3">
                                <Wallet :size="20" class="text-[#2563eb]" />
                            </div>
                            <h4 class="text-[15px] font-bold text-[#0f172a]">Loans Management</h4>
                            <p class="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">Manage loan applications, disbursements, and repayments for this member.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Drawers -->
        <DepositWithdrawDrawer
            ref="depositDrawer"
            :member="member"
            :currency-code="currencyCode"
            :current-balance="currentBalance"
            @success="fetchMember(true)"
        />

        <NewAccountDrawer
            ref="newAccountDrawer"
            :member-id="member.id"
            :savings-accounts="member.savings_accounts"
            :savings-products="savingsProducts"
            :currency-code="currencyCode"
            @success="fetchMember(true)"
        />

        <CustomFeeDrawer
            ref="customFeeDrawer"
            :currency-code="currencyCode"
            @success="fetchMember(true)"
        />

        <!-- Transaction Reversal Dialog -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="showTxnDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showTxnDeleteDialog = false"></div>
                    <div class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
                        <div class="flex items-start gap-4">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <RotateCcw :size="20" class="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Reverse Transaction</h3>
                                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                    Reverse transaction <strong class="text-neutral-700 dark:text-neutral-200">{{ txnToDelete?.reference }}</strong>?
                                </p>
                                <p class="mt-2 text-[12px] text-neutral-400 dark:text-neutral-500">
                                    A counter-transaction will be created to undo this entry. The original transaction remains in the audit trail marked as <em>reversed</em>.
                                </p>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end gap-3">
                            <button @click="showTxnDeleteDialog = false"
                                class="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                                Cancel
                            </button>
                            <button @click="executeDeleteTxn" :disabled="isDeletingTxn"
                                class="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50">
                                <span v-if="isDeletingTxn" class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                                <RotateCcw v-else :size="14" />
                                Confirm Reversal
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </template>

    <!-- Printable Receipt -->
    <div v-if="printingTxn" class="print-only fixed inset-0 bg-white z-[9999] p-10 font-serif leading-relaxed text-[#1a1a1a]">
        <div class="max-w-[800px] mx-auto border border-gray-200 p-8 shadow-sm">
            <div class="text-center mb-6">
                <h1 class="text-xl font-bold uppercase tracking-wide mb-1">NUGSOFT MAIN TESTING SACCO</h1>
                <p class="text-[13px] font-medium italic mb-1">Address: KAMPALA</p>
                <p class="text-[13px] font-medium italic mb-1">TEL: +256701270153</p>
                <p class="text-[13px] font-medium italic">Email: nugsoftemail@nugsoft.com</p>
                <div class="mt-6 inline-block border-b-2 border-double border-gray-800 px-8 pb-1">
                    <h2 class="text-sm font-bold uppercase tracking-wider">{{ printingTxn.type }} RECEIPT</h2>
                </div>
            </div>
            <div class="space-y-4 mb-8 text-sm">
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Receipt No:</span>
                    <span class="font-bold font-mono">{{ printingTxn.reference }}</span>
                </div>
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Printing Date:</span>
                    <span class="font-bold">{{ new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}</span>
                </div>
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Printing Time:</span>
                    <span class="font-bold">{{ new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() }}</span>
                </div>
            </div>
            <div class="space-y-4 mb-8 text-sm pt-2">
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Account Names:</span>
                    <span class="font-bold uppercase">{{ member.name }}</span>
                </div>
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Total Amount:</span>
                    <span class="font-bold">{{ printingTxn.amount_formatted || `${currencyCode} ${formatCurrency(printingTxn.amount)}` }}</span>
                </div>
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Trans Charge:</span>
                    <span class="font-bold">{{ currencyCode }} {{ formatCurrency(printingTxn.charge || 0) }}</span>
                </div>
            </div>
            <div class="text-center mt-10 space-y-4">
                <p class="text-[13px] font-bold tracking-wider">Served By: <span class="uppercase">{{ printingTxn.deposited_by || 'SYSTEM ADMIN' }}</span></p>
                <div class="pt-8">
                    <p class="text-[12px] italic text-gray-500 mb-2">Signature & stamp</p>
                    <div class="w-48 mx-auto border-b border-gray-400"></div>
                </div>
            </div>
            <div class="mt-12 text-center text-[12px] space-y-4 border-t-2 border-double border-gray-800 pt-6">
                <p class="font-bold italic">Thank you for Saving with <span class="uppercase">Nugsoft Main Testing Sacco</span>.</p>
                <p class="font-bold">For Inquiry About this loan Call: 256701270153.</p>
                <div class="pt-4 border-t border-dashed border-gray-300">
                    <p class="font-mono tracking-tighter text-gray-400">Mfuko Plus - Microfinance Mgt Software</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
@media print {
    body.receipt-print * { visibility: hidden !important; }
    body.receipt-print .print-only,
    body.receipt-print .print-only * { visibility: visible !important; }
    body.receipt-print .print-only { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; display: block !important; }
    body.receipt-print .no-print { display: none !important; }
    @page { margin: 0.5cm; size: auto; }
}
.print-only { display: none; }
</style>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
