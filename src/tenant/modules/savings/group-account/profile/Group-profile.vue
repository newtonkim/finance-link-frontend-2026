<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';
import { FileText, Wallet, BarChart3, RotateCcw, Users } from 'lucide-vue-next';
import { formatMoneyValue } from '@/Global';
import { tenantClient } from '@/tenant/apis/tenantClient';
import { useCurrencyStore } from '@/stores/currency';
import { groupSavingsApi } from '@/tenant/apis/savings/group-savingsApi';
import { GroupMembersGurranttedTab, MemberAccountsTable, MemberTransactionsTab, MemberGroupList, MemberSidebar } from './index.ts';
import { pomPinia } from 'septor-store'
const { getGroupProfileDetail } = groupSavingsApi();
const { currencyCode } = storeToRefs(useCurrencyStore());
const pageLoading = ref<any>(null)
const profileDetails = ref<any>(null)
const member = ref<any>({})
const Store = pomPinia()



async function initialize() {
    pageLoading.value = true;
    const details = await getGroupProfileDetail({})
    let data = {};
    if (details) {
        const { group_details, group_accounts, group_members } = details
        for (const key in group_details) {
            const element = group_details[key];
            data[key] = element;
        }
        profileDetails.value = { details: data, accounts: group_accounts, members: group_members };
        Store.groupProfileDetails = profileDetails.value
    }
    pageLoading.value = false;
}

// ── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref('members');
onBeforeMount(() => {
    profileDetails.value = null
    initialize();
    // fetchMember()
});

const tabs = computed(() => [
    { id: 'members', label: 'members', icon: Users, count: null },
    { id: 'transactions', label: 'Transactions', icon: FileText, count: member?.transactions?.length || 0 },
    { id: 'loans', label: 'Loans', icon: Wallet, count: member?.loans?.length || 0 },
    { id: 'shares', label: 'Shares', icon: BarChart3, count: null },
]);

// ── Drawer refs ──────────────────────────────────────────────────────────────
const depositDrawer = ref<InstanceType<typeof DepositWithdrawDrawer> | null>(null);
const newAccountDrawer = ref<InstanceType<typeof NewAccountDrawer> | null>(null);
const customFeeDrawer = ref<InstanceType<typeof CustomFeeDrawer> | null>(null);

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
        // fetchMember(true);
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


</script>

<template>
    <!-- Loading state -->
    <!-- Loading -->
    <div v-if="pageLoading" class="flex items-center justify-center min-h-[60vh]">
        <div class="flex flex-col items-center gap-3">
            <div class="relative h-12 w-12">
                <div class="absolute inset-0 rounded-full border-4 border-[#cda434]/20"></div>
                <div
                    class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#cda434] border-r-[#cda434] animate-spin">
                </div>
                <div class="absolute inset-2 rounded-full bg-[#cda434]/10"></div>
            </div>
            <div class="text-[12px] font-bold uppercase tracking-widest text-[#cda434]">
                Loading Member Data
            </div>
        </div>
    </div>

    <!-- Main -->
    <div v-else>
        <div class="min-h-screen bg-background text-foreground relative overflow-x-hidden">

            <!-- Layout -->
            <div class="relative z-10 p-5 flex flex-col lg:flex-row gap-5 max-w-full overflow-hidden">

                <!-- Sidebar -->
                <MemberSidebar class="w-full lg:w-[300px] shrink-0" :data="profileDetails?.details ?? {}"
                    :computed-age="computedAge" :format-date="formatDate" />

                <!-- Main Content -->
                <div class="flex-1 flex flex-col gap-5 min-w-0">

                    <!-- Accounts -->
                    <div v-if="profileDetails?.accounts" class="w-full overflow-x-auto">
                        <MemberAccountsTable @reload="initialize" :member="profileDetails?.details ?? {}"
                            :accounts="Array.isArray(profileDetails.accounts) ? profileDetails.accounts : []"
                            :currency-code="currencyCode" :format-currency="formatCurrency"
                            @new-account="newAccountDrawer?.openDrawer()"
                            @custom-fee="(account) => customFeeDrawer?.openDrawer(account)" />
                    </div>

                    <!-- Tabs -->
                    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

                        <!-- Tab bar -->
                        <div class="flex overflow-x-auto border-b border-gray-100 px-4 whitespace-nowrap">
                            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                                'relative flex items-center gap-2 px-4 py-4 text-[13px] font-bold transition-colors whitespace-nowrap',
                                activeTab === tab.id ? 'text-[#cda434]' : 'text-[#788896] hover:text-gray-900'
                            ]">
                                <component :is="tab.icon" :size="16" />
                                {{ tab.label }}

                                <span v-if="tab.count !== null"
                                    class="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-md text-[11px] font-bold font-mono bg-gray-100 text-[#788896]">
                                    {{ tab.count }}
                                </span>

                                <div v-if="activeTab === tab.id"
                                    class="absolute bottom-0 left-4 right-4 h-[3px] bg-[#cda434] rounded-t-full">
                                </div>
                            </button>
                        </div>

                        <!-- Members -->
                        <div v-if="activeTab === 'members'" class="w-full overflow-x-auto">
                            <MemberGroupList @reload="initialize" :member="profileDetails?.members ?? {}"
                                :accounts="Array.isArray(profileDetails.members) ? profileDetails.members : []"
                                @new-account="newAccountDrawer?.openDrawer()" />
                        </div>

                        <!-- Transactions -->
                        <div class="w-full overflow-x-auto" v-if="activeTab === 'transactions'">
                            <MemberTransactionsTab :transactions="member?.transactions" mode="all"
                                action-color="bg-[#cda434]" :format-date="formatDate" :format-date-time="formatDateTime"
                                :format-currency="formatCurrency" @print="printReceipt" />
                        </div>
                        <div class="w-full overflow-x-auto" v-if="activeTab === 'loans'">
                            <GroupMembersGurranttedTab mode="all" action-color="bg-[#cda434]" :format-date="formatDate"
                                :format-date-time="formatDateTime" :format-currency="formatCurrency"
                                @print="printReceipt" />
                        </div>

                        <!-- Shares -->
                        <div v-show="activeTab === 'shares'" class="p-12 text-center">
                            <div
                                class="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-3">
                                <BarChart3 :size="20" class="text-[#64748b]" />
                            </div>
                            <h4 class="text-[15px] font-bold text-[#0f172a]">Shares History</h4>
                            <p class="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">
                                Track and manage member shares, certificates, and dividends here.
                            </p>
                        </div>


                    </div>
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
