<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import { UserCircle2, FileText, TrendingUp, MinusCircle, Wallet, BarChart3, RotateCcw, Printer } from 'lucide-vue-next';
import { formatMoneyValue } from '@/Global';
import { tenantClient } from '@/tenant/apis/tenantClient';
import { useCurrencyStore } from '@/stores/currency';
import { useMember } from '../composables/useMember';
import MemberSidebar from './MemberSidebar.vue';
import MemberActionBar from './MemberActionBar.vue';
import MemberAccountsTable from './MemberAccountsTable.vue';
import MemberTransactionsTab from './MemberTransactionsTab.vue';
import MemberLoansTab from './MemberLoansTab.vue';
import DepositWithdrawDrawer from './DepositWithdrawDrawer.vue';
import NewAccountDrawer from './NewAccountDrawer.vue';
import CustomFeeDrawer from './CustomFeeDrawer.vue';
import { memberProfileApi } from '@/tenant/apis/savings/member-profileApi';
import Details from '@/Global/DetailsTable/Details.vue';
import Statement from './statement.vue';
const { getMemberProfileDetail } = memberProfileApi();

const router = useRouter();
const { currencyCode } = storeToRefs(useCurrencyStore());

const {
    member, savingsProducts, pageLoading, fetchMember,
    memberInitials, computedAge, currentBalance,
    avatarInput, uploadProcessing, triggerAvatarUpload, handleAvatarUpload,
    approving, rejecting, approveMember, rejectMember,
    deleting, deleteMember,
} = useMember();
interface ProfileDetails {
    details: Record<string, unknown>;
    accounts: unknown[];
}
const profileDetails = ref<ProfileDetails | null>(null)


async function initialize() {
    pageLoading.value = true;
    const details = await getMemberProfileDetail({})
    const data: Record<string, unknown> = {};
    const { member_details, member_accounts } = details
    // const accounts = details.member_accounts
    for (const key in member_details) {
        const element = member_details[key];
        data[key] = element;
    }
    profileDetails.value = { details: data, accounts: member_accounts };
    pageLoading.value = false;
      fetchMember()
}

// ── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref('profile');
onBeforeMount(() => {
    profileDetails.value = null
    initialize();
  
});

const tabs = computed(() => [
    { id: 'profile', label: 'member Profile', icon: UserCircle2, count: null },
    { id: 'transactions', label: 'member Transactions', icon: FileText, count: member.transactions?.length || 0 },
    { id: 'savings', label: 'member Savings', icon: TrendingUp, count: member.transactions?.filter((t: { type?: string }) => t.type?.toLowerCase() === 'deposit').length || 0 },
    { id: 'withdrawal', label: 'member Withdrawal', icon: MinusCircle, count: member.transactions?.filter((t: { type?: string }) => ['withdrawal', 'withdraw'].includes(t.type?.toLowerCase())).length || 0 },
    { id: 'loans', label: 'member Loans', icon: Wallet, count: member.loans?.length || 0 },
    { id: 'shares', label: 'member Shares', icon: BarChart3, count: null },
    { id: 'statement', label: 'member Statement', icon: Printer, },
]);

// ── Drawer refs ──────────────────────────────────────────────────────────────
const depositDrawer = ref<InstanceType<typeof DepositWithdrawDrawer> | null>(null);
const newAccountDrawer = ref<InstanceType<typeof NewAccountDrawer> | null>(null);
const customFeeDrawer = ref<InstanceType<typeof CustomFeeDrawer> | null>(null);

// ── Transaction reversal ────────────────────────────────────────────────────
const showTxnDeleteDialog = ref(false);
const txnToDelete = ref<{ id: number; reference: string; is_reversed: boolean; type: string; is_reversible: boolean } | null>(null);
const isDeletingTxn = ref(false);
const formData = ref<any>({});

const confirmDeleteTxn = (txn: { id: number; reference: string; is_reversed: boolean; type: string; is_reversible: boolean }) => {
    if (txn.is_reversed || txn.type === 'reversal' || txn.is_reversible === false) return;
    txnToDelete.value = txn;
    showTxnDeleteDialog.value = true;
};

const executeDeleteTxn = async () => {
    if (!txnToDelete.value) return;
    isDeletingTxn.value = true;
    try {
        await tenantClient.post(`/transactions/${txnToDelete.value.id}/reverse`, formData.value);
        toast.success('Transaction reversed successfully.');
        showTxnDeleteDialog.value = false;
        txnToDelete.value = null;
        // Refresh member data so balances and the full transaction list are up to date
        fetchMember(true);
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err?.response?.data?.message || 'Failed to reverse transaction.');
    } finally {
        isDeletingTxn.value = false;
    }
};

// ── Receipt printing ─────────────────────────────────────────────────────────
const printingTxn = ref<{
    type: string;
    reference: string;
    amount: number;
    amount_formatted?: string;
    charge?: number;
    deposited_by?: string;
} | null>(null);

const printReceipt = (txn: {
    type: string;
    reference: string;
    amount: number;
    amount_formatted?: string;
    charge?: number;
    deposited_by?: string;
}) => {
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
const columns = [
    {
        header: '',
        type: 'Descriptions',
        column: 3,
        list: [
            { key: 'memeber_code', label: 'Member Code', copy: true },
            { key: 'full_name', label: 'Full Name' },
            { key: 'email', label: 'Email' },
            { key: 'from', label: 'From' },
            { key: 'marital_status', label: 'Marital Status', type: 'status' },
            { key: 'primary_contact', label: 'Primary Contact' },
            { key: 'NIN', label: 'NIN' },
            { key: 'other_contacts', label: 'Other Contacts' },
            { key: 'o_contact', label: 'Other Contact' },
            { key: 'MM_number', label: 'Mobile Money Number' },
            { key: 'dob', label: 'Date of Birth' },
            { key: 'address', label: 'Address' },
            { key: 'nokin', label: 'Next of Kin' },
            { key: 'next_contact', label: 'Next Contact' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'initial_deposit', label: 'Initial Deposit' },
            { key: 'opb', label: 'opening balance' },
            { key: 'referred_by', label: 'Referred By' },
            { key: 'created_by', label: 'Created By' },
            { key: 'joined_date', label: 'Joined Date', type: 'date' },
            { key: 'created_at', label: 'Created At' },
        ]
    },
]
</script>

<template>
    <!-- Loading state -->
    <div v-if="pageLoading" class="flex items-center justify-center min-h-[60vh]">
        <div class="flex flex-col items-center gap-3">
            <div class="relative h-12 w-12">
                <div class="absolute inset-0 rounded-full border-4 border-[#cda434]/20"></div>
                <div
                    class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#cda434] border-r-[#cda434] animate-spin">
                </div>
                <div class="absolute inset-2 rounded-full bg-[#cda434]/10"></div>
            </div>
            <div class="text-[12px] font-bold uppercase tracking-widest text-[#cda434]">Loading Member Data</div>
        </div>
    </div>

    <div v-else>
        <div class="min-h-screen bg-background text-foreground relative">
            <div class="relative z-10 p-5 flex flex-col lg:flex-row gap-5">

                <!-- Left Sidebar -->
                <MemberSidebar :member="profileDetails?.details ?? {}" :member-initials="memberInitials"
                    :computed-age="computedAge" :upload-processing="uploadProcessing" :format-date="formatDate"
                    @avatar-click="triggerAvatarUpload" />
                <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept="image/*" class="hidden" />

                <!-- Right Main Area -->
                <div class="flex-1 flex flex-col gap-5">

                    <!-- Approval/Rejection banners + action buttons -->
                    <MemberActionBar :member="profileDetails?.details" :approving="approving" :rejecting="rejecting"
                        :deleting="deleting" @deposit="depositDrawer?.open('deposit')"
                        @withdraw="depositDrawer?.open('withdraw')" @approve="approveMember"
                        @reject="(reason) => rejectMember(reason)" @delete="handleDelete" />

                    <!-- Accounts table -->
                    <div v-if="profileDetails?.accounts">

                        <MemberAccountsTable @reload="initialize" :member="profileDetails?.details ?? {}"
                            :accounts="profileDetails.accounts ?? []" :currency-code="currencyCode"
                            :format-currency="formatCurrency" @new-account="newAccountDrawer?.openDrawer()"
                            @custom-fee="(account) => customFeeDrawer?.openDrawer(account)" />
                    </div>

                    <!-- Tabs -->
                    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <!-- Tab bar -->
                        <div class="flex overflow-x-auto border-b border-gray-100 px-4">
                            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="['relative flex items-center gap-2 px-4 py-4 text-[13px] font-bold transition-colors whitespace-nowrap',
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
                        <div v-show="activeTab === 'profile'" class="p-1">
                            <span v-if="Object.keys(profileDetails?.details ?? {}).length"
                                class="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                <Details :data="profileDetails.details" :columns="columns" />
                            </span>
                        </div>

                        <!-- Transactions tab -->
                        <MemberTransactionsTab v-show="activeTab === 'transactions'" :transactions="member.transactions"
                            mode="all" action-color="bg-[#cda434]" :format-date="formatDate" :show-table="false"
                            :format-date-time="formatDateTime" :format-currency="formatCurrency" @print="printReceipt"
                            @reverse="confirmDeleteTxn" />

                        <!-- Savings tab -->
                        <MemberTransactionsTab v-show="activeTab === 'savings'" :transactions="member.transactions"
                            mode="deposit" action-color="bg-[#16a34a]" :show-account-column="true" :show-table="false"
                            :format-date="formatDate" :format-date-time="formatDateTime"
                            :format-currency="formatCurrency" @print="printReceipt" @reverse="confirmDeleteTxn"
                            @open-drawer="depositDrawer?.open('deposit')" />

                        <!-- Withdrawal tab -->
                        <MemberTransactionsTab v-show="activeTab === 'withdrawal'" :transactions="member.transactions"
                            mode="withdrawal" action-color="bg-[#ea580c]" :show-account-column="true" :show-table="false"
                            :format-date="formatDate" :format-date-time="formatDateTime"
                            :format-currency="formatCurrency" @print="printReceipt" @reverse="confirmDeleteTxn"
                            @open-drawer="depositDrawer?.open('withdraw')" />

                        <MemberTransactionsTab v-show="activeTab === 'shares'" :transactions="member.transactions"
                            mode="share-transaction" action-color="bg-[#ea580c]" :show-account-column="true" :show-table="false"
                            :format-date="formatDate" :format-date-time="formatDateTime"
                            :format-currency="formatCurrency" @print="printReceipt" @reverse="confirmDeleteTxn"
                            @open-drawer="depositDrawer?.open('withdraw')" />
                        <MemberLoansTab :loans="member.loans" v-if="activeTab === 'loans'" :formatDate="formatDate"
                            :formatDateTime="formatDateTime" :formatCurrency="formatCurrency" actionColor="bg-[#cda434]"
                            @view="() => { }" />
                            
                        <Statement v-if="activeTab === 'statement'" :profileDetails="profileDetails" :data="member" :formatDate="formatDate"
                            :formatDateTime="formatDateTime" :formatCurrency="formatCurrency" actionColor="bg-[#cda434]"
                            @view="() => { }" />


                        <!-- Shares placeholder -->
                        <!-- <div v-show="activeTab === 'shares'" class="p-12 text-center">
                            <div
                                class="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                                <BarChart3 :size="20" class="text-[#64748b]" />
                            </div>
                            <h4 class="text-[15px] font-bold text-[#0f172a]">Shares History</h4>
                            <p class="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">Track and manage member shares,
                                certificates, and
                                dividends here.</p>
                        </div> -->

                        <!-- Loans placeholder -->
                        <!-- <div v-show="activeTab === 'loans'" class="p-12 text-center">
                            <div
                                class="w-12 h-12 rounded-full bg-[#eff6ff] flex items-center justify-center mx-auto mb-3">
                                <Wallet :size="20" class="text-[#2563eb]" />
                            </div>
                            <h4 class="text-[15px] font-bold text-[#0f172a]">Loans Management</h4>
                            <p class="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">Manage loan applications,
                                disbursements, and repayments
                                for this member.</p>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Drawers -->
        <DepositWithdrawDrawer ref="depositDrawer" :member="member" :currency-code="currencyCode"
            :current-balance="currentBalance" @success="fetchMember(true)" />

        <NewAccountDrawer ref="newAccountDrawer" :member-id="member.id" :savings-accounts="member.savings_accounts"
            :savings-products="savingsProducts" :currency-code="currencyCode" @success="fetchMember(true)" />

        <CustomFeeDrawer ref="customFeeDrawer" :currency-code="currencyCode" @success="fetchMember(true)" />

        <Transition name="fade">
            <div v-if="showTxnDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showTxnDeleteDialog = false">
                </div>
                <div
                    class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
                    <div class="flex items-start gap-4">
                        <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <RotateCcw :size="20" class="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <!-- <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Reverse Transaction
                            </h3> -->
                            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Reverse transaction <strong class="text-neutral-700 dark:text-neutral-200">{{txnToDelete?.reference }}</strong>?
                            </p>
                            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                <textarea class="w-full"  placeholder="Enter  a reason for the reversal" v-model="formData.reason" rows="2" />
                            </p>
                            <p class="mt-2 text-[12px] text-neutral-400 dark:text-neutral-500">
                                A counter-transaction will be created to undo this entry. The original transaction
                                remains
                                in the audit trail marked as <em>reversed</em>.
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
                            <span v-if="isDeletingTxn"
                                class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                            <RotateCcw v-else :size="14" />
                            Confirm Reversal
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

    </div>

    <!-- Printable Receipt -->
    <div v-if="printingTxn"
        class="print-only fixed inset-0 bg-white z-[9999] p-10 font-serif leading-relaxed text-[#1a1a1a]">
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
                    <span class="font-bold">{{ new Date().toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short',
                        year: 'numeric'
                    }) }}</span>
                </div>
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Printing Time:</span>
                    <span class="font-bold">{{ new Date().toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute:
                            '2-digit',
                        hour12: true
                    }).toUpperCase() }}</span>
                </div>
            </div>
            <div class="space-y-4 mb-8 text-sm pt-2">
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Account Names:</span>
                    <span class="font-bold uppercase">{{ member.name }}</span>
                </div>
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Total Amount:</span>
                    <span class="font-bold">{{ printingTxn.amount_formatted || `${currencyCode}
                        ${formatCurrency(printingTxn.amount)}` }}</span>
                </div>
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Trans Charge:</span>
                    <span class="font-bold">{{ currencyCode }} {{ formatCurrency(printingTxn.charge || 0) }}</span>
                </div>
            </div>
            <div class="text-center mt-10 space-y-4">
                <p class="text-[13px] font-bold tracking-wider">Served By: <span class="uppercase">{{
                    printingTxn.deposited_by || 'SYSTEM ADMIN' }}</span></p>
                <div class="pt-8">
                    <p class="text-[12px] italic text-gray-500 mb-2">Signature & stamp</p>
                    <div class="w-48 mx-auto border-b border-gray-400"></div>
                </div>
            </div>
            <div class="mt-12 text-center text-[12px] space-y-4 border-t-2 border-double border-gray-800 pt-6">
                <p class="font-bold italic">Thank you for Saving with <span class="uppercase">Nugsoft Main Testing
                        Sacco</span>.</p>
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
    body.receipt-print * {
        visibility: hidden !important;
    }

    body.receipt-print .print-only,
    body.receipt-print .print-only * {
        visibility: visible !important;
    }

    body.receipt-print .print-only {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
    }

    body.receipt-print .no-print {
        display: none !important;
    }

    @page {
        margin: 0.5cm;
        size: auto;
    }
}

.print-only {
    display: none;
}
</style>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
