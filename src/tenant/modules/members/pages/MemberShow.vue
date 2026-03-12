<script setup lang="ts">
import { RouterLink, useRouter, useRoute } from 'vue-router';
import {
    Edit, MinusCircle, PlusCircle, Trash2, Plus, UserCircle2,
    Users, Wallet, FileText, BarChart3, Star, X, TrendingUp, Check,
    Calendar, MessageSquare, ArrowDownLeft, ArrowUpRight, AlertTriangle,
    Printer, ShieldCheck, ShieldX, Clock
} from 'lucide-vue-next';
import { ref, computed, watch, reactive, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import { membersApi } from '@/tenant/apis/members/membersApi';
import { tenantClient } from '@/tenant/apis/tenantClient';

const router = useRouter();
const route = useRoute();

// Reactive member data fetched from API
const member = reactive({
    id: 0,
    member_number: '',
    member_type: '',
    name: '',
    salutation: '',
    gender: '',
    dob: '',
    phone: '',
    phone_country: '',
    other_contact: '',
    other_contact_country: '',
    mobile_money_number: '',
    mobile_money_country: '',
    email: '',
    id_number: '',
    marital_status: '',
    nationality: '',
    address: '',
    next_of_kin: '',
    next_of_kin_contact: '',
    initial_deposit: '',
    status: '',
    joined_at: '',
    created_at: '',
    avatar_url: null as string | null,
    savings_accounts: [] as Array<{ id: number; account_no: string; account_type: string; balance: string }>,
    loans: [] as Array<any>,
    transactions: [] as Array<any>,
});

const savingsProducts = ref<Array<{ id: number; name: string; type: string; minimum_balance: string; charges?: Array<{ id: number; type: string; charge_type: string; amount: string }> }>>([]);

const pageLoading = ref(true);

async function fetchMember(silent = false) {
    const id = Number(route.params.id);
    if (!id) return;
    if (!silent) pageLoading.value = true;
    try {
        const res = await membersApi.show(id);
        // Backend returns: { success, message, data: { member: {...}, savingsProducts: [...] } }
        const body = res.data;
        const memberData: Record<string, any> =
            body?.data?.member ??
            body?.member ??
            body?.data ??
            body ?? {};

        // Assign each property individually so Vue 3 reactive() tracks every update
        for (const key of Object.keys(memberData)) {
            (member as any)[key] = memberData[key];
        }

        // Normalize paginator-style transactions to a plain array
        const rawTxns = (memberData as any)?.transactions;
        if (Array.isArray(rawTxns)) {
            member.transactions = rawTxns;
        } else if (Array.isArray(rawTxns?.data)) {
            member.transactions = rawTxns.data;
        }

        const products = body?.data?.savingsProducts ?? body?.savingsProducts ?? [];
        if (Array.isArray(products)) savingsProducts.value = products;

    } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to load member data.');
    } finally {
        if (!silent) pageLoading.value = false;
    }
}

onMounted(fetchMember);
// Reload when navigating between member detail pages
watch(() => route.params.id, (newId) => { if (newId) fetchMember(); });

const activeTab = ref('profile');
const isWithdrawal = (t: any) => {
    const type = (t?.type || '').toLowerCase();
    return type === 'withdrawal' || type === 'withdraw';
};
const isDeposit = (t: any) => (t?.type || '').toLowerCase() === 'deposit';
const tabs = computed(() => [
    { id: 'profile', label: 'Profile', icon: 'UserCircle2', count: null },
    { id: 'transactions', label: 'Transactions', icon: 'FileText', count: member.transactions?.length || 0 },
    { id: 'savings', label: 'Savings', icon: 'TrendingUp', count: member.transactions?.filter(isDeposit).length || 0 },
    { id: 'withdrawal', label: 'Withdrawal', icon: 'MinusCircle', count: member.transactions?.filter(isWithdrawal).length || 0 },
    { id: 'loans', label: 'Loans', icon: 'Wallet', count: member.loans?.length || 0 },
    { id: 'shares', label: 'Shares', icon: 'BarChart3', count: null },
]);

// Drawer state
const drawerOpen = ref<null | 'deposit' | 'withdraw'>(null);

// Deposit / Withdraw form
const depositForm = reactive({
    deposit_date: new Date().toISOString().split('T')[0],
    savings_account_id: '' as string | number,
    amount: '' as string | number,
    deposited_by: '',
    transaction_reference: '',
    payment_mode: '',
    narration: '',
    use_for_loan_repayment: 'no',
});

const depositProcessing = ref(false);
const depositErrors = ref<Record<string, any>>({});

const paymentModeOptions = [
    { id: 'cash', name: 'Cash' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'mobile_money', name: 'Mobile Money' },
    { id: 'cheque', name: 'Cheque' },
    { id: 'teller', name: 'Teller' },
    { id: 'ussd', name: 'USSD' },
];

const generateTransactionRef = () => {
    const date = (new Date().toISOString().split('T')[0] ?? '').replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `TXN-${date}-${rand}`;
};

const loanRepaymentOptions = [
    { id: 'no', name: 'No (only deposit)' },
    { id: 'yes', name: 'Yes (apply to loan)' },
];

const accountOptions = computed(() =>
    (member.savings_accounts ?? []).map(a => ({
        id: a.id,
        name: `${a.account_no} (${a.account_type})`
    }))
);

const selectedAccount = computed(() =>
    (member.savings_accounts ?? []).find((a: any) => String(a.id) === String(depositForm.savings_account_id))
);

const withdrawableAmount = computed(() => {
    const acc = selectedAccount.value as any;
    if (!acc) return null;
    if (!acc.consider_min_balance) return (acc.balance as number);
    return acc.withdrawable_amount as number;
});

const withdrawalAmountError = computed(() => {
    if (drawerOpen.value !== 'withdraw') return '';
    const amt = Number(depositForm.amount);
    if (!amt || amt <= 0) return '';
    const max = withdrawableAmount.value;
    if (max === null) return '';
    if (amt > max) {
        const acc = selectedAccount.value as any;
        const minBal = acc?.minimum_balance ?? 0;
        return `Exceeds withdrawable amount. Max: UGX ${Number(max).toLocaleString('en-US', { minimumFractionDigits: 2 })}${minBal > 0 ? ` (min balance: UGX ${Number(minBal).toLocaleString('en-US', { minimumFractionDigits: 2 })})` : ''}`;
    }
    return '';
});

const formattedAmount = computed({
    get: () => {
        if (depositForm.amount === null || depositForm.amount === undefined || depositForm.amount === '') return '';
        const parts = depositForm.amount.toString().split('.');
        if (parts[0] !== undefined) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    },
    set: (val: string) => {
        const stripped = val.replace(/[^0-9.]/g, '');
        const parts = stripped.split('.');
        const cleanVal = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
        depositForm.amount = cleanVal;
    }
});

// New Account drawer formatting
const formattedInitialDeposit = computed({
    get: () => {
        if (newAccountForm.initial_deposit === null || newAccountForm.initial_deposit === undefined || newAccountForm.initial_deposit === '') return '';
        const parts = newAccountForm.initial_deposit.toString().split('.');
        if (parts[0] !== undefined) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    },
    set: (val: string) => {
        const stripped = val.replace(/[^0-9.]/g, '');
        const parts = stripped.split('.');
        const cleanVal = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
        newAccountForm.initial_deposit = cleanVal;
    }
});

const formattedOpeningBalance = computed({
    get: () => {
        if (newAccountForm.opening_balance === null || newAccountForm.opening_balance === undefined || newAccountForm.opening_balance === '') return '';
        const parts = newAccountForm.opening_balance.toString().split('.');
        if (parts[0] !== undefined) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    },
    set: (val: string) => {
        const stripped = val.replace(/[^0-9.]/g, '');
        const parts = stripped.split('.');
        const cleanVal = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
        newAccountForm.opening_balance = cleanVal;
    }
});

// New Account drawer
const newAccountDrawerOpen = ref(false);

// Transactions Pagination & Filtering
const currentTxnPage = ref(1);
const txnsPerPage = ref(10);
const txnSearchQuery = ref('');
const txnStartDate = ref('');
const txnEndDate = ref('');

const filteredTransactions = computed(() => {
    let txns = member.transactions || [];

    // Search filter
    if (txnSearchQuery.value) {
        const query = txnSearchQuery.value.toLowerCase();
        txns = txns.filter(t =>
            (t.reference?.toLowerCase().includes(query)) ||
            (t.narration?.toLowerCase().includes(query)) ||
            (t.deposited_by?.toLowerCase().includes(query))
        );
    }

    // Date filter
    if (txnStartDate.value) {
        txns = txns.filter(t => (t.transaction_date || t.created_at || '').slice(0, 10) >= txnStartDate.value);
    }
    if (txnEndDate.value) {
        txns = txns.filter(t => (t.transaction_date || t.created_at || '').slice(0, 10) <= txnEndDate.value);
    }

    return txns;
});

const activeTransactions = computed(() => {
    const txns = filteredTransactions.value;
    if (activeTab.value === 'savings') {
        return txns.filter(isDeposit);
    } else if (activeTab.value === 'withdrawal') {
        return txns.filter(isWithdrawal);
    }
    return txns;
});

const paginatedTransactions = computed(() => {
    const txns = activeTransactions.value;
    const start = (currentTxnPage.value - 1) * txnsPerPage.value;
    const end = start + txnsPerPage.value;
    return txns.slice(start, end);
});

const totalTxnPages = computed(() => {
    return Math.ceil(activeTransactions.value.length / txnsPerPage.value);
});

watch(activeTab, () => {
    if (['transactions', 'savings', 'withdrawal'].includes(activeTab.value)) {
        currentTxnPage.value = 1;
    }
});

const nextTxnPage = () => { if (currentTxnPage.value < totalTxnPages.value) currentTxnPage.value++; };

// Receipt Printing
const printingTxn = ref<any>(null);

const printReceipt = (txn: any) => {
    printingTxn.value = txn;
    setTimeout(() => {
        window.print();
        printingTxn.value = null;
    }, 100);
};
const prevTxnPage = () => { if (currentTxnPage.value > 1) currentTxnPage.value--; };

// Transaction Deletion
const showTxnDeleteDialog = ref(false);
const txnToDelete = ref<any>(null);
const isDeletingTxn = ref(false);

const confirmDeleteTxn = (txn: any) => {
    txnToDelete.value = txn;
    showTxnDeleteDialog.value = true;
};

const cancelDeleteTxn = () => {
    showTxnDeleteDialog.value = false;
    txnToDelete.value = null;
};

const executeDeleteTxn = async () => {
    if (!txnToDelete.value) return;
    isDeletingTxn.value = true;
    try {
        await tenantClient.delete(`/transactions/${txnToDelete.value.id}`);
        toast.success('Transaction deleted successfully.');
        member.transactions = (member.transactions || []).filter(t => t.id !== txnToDelete.value.id);
        showTxnDeleteDialog.value = false;
        txnToDelete.value = null;
    } catch (error) {
        toast.error('Failed to delete transaction.');
    } finally {
        isDeletingTxn.value = false;
    }
};

const newAccountForm = reactive({
    member_id: member.id,
    savings_product_id: '' as string | number,
    account_type: '',
    is_new_account: true,
    initial_deposit: '' as string | number,
    opening_balance: '' as string | number,
    consider_min_balance: false,
    credited_account_id: '' as string | number,
    charges: [] as number[],
    status: 'active',
});

const newAccountProcessing = ref(false);
const newAccountErrors = ref<Record<string, any>>({});

const openNewAccountDrawer = () => {
    Object.assign(newAccountForm, {
        member_id: member.id,
        savings_product_id: '',
        account_type: '',
        is_new_account: true,
        initial_deposit: '',
        opening_balance: '',
        consider_min_balance: false,
        credited_account_id: '',
        charges: [],
        status: 'active',
    });
    newAccountErrors.value = {};
    newAccountDrawerOpen.value = true;
};

const closeNewAccountDrawer = () => {
    newAccountDrawerOpen.value = false;
};

// When product changes, auto-fill account_type and pre-select charges
const selectedProductCharges = computed(() => {
    if (!newAccountForm.savings_product_id) return [];
    const product = savingsProducts.value?.find(p => p.id === Number(newAccountForm.savings_product_id));
    return product?.charges ?? [];
});



watch(() => newAccountForm.savings_product_id, (newVal) => {
    if (newVal) {
        const product = savingsProducts.value?.find(p => p.id === Number(newVal));
        if (product) {
            newAccountForm.account_type = product.type;
            newAccountForm.charges = product.charges?.map(c => c.id) ?? [];
        }
    }
});

const toggleCharge = (chargeId: number) => {
    const idx = newAccountForm.charges.indexOf(chargeId);
    if (idx > -1) {
        newAccountForm.charges.splice(idx, 1);
    } else {
        newAccountForm.charges.push(chargeId);
    }
};

const showChargeDropdown = ref(false);

const isChargeSelected = (id: number) => {
    return newAccountForm.charges.includes(id);
};

const getChargeNameById = (id: number) => {
    const charge = selectedProductCharges.value.find(c => c.id === id);
    return charge?.type ?? `Charge ${id}`;
};

// Searchable select option adapters
const productOptions = computed(() => {
    return (savingsProducts.value ?? []).map(p => ({ id: p.id, name: p.name }));
});

const isNewAccountOptions = [
    { id: 'yes', name: 'Yes' },
    { id: 'no', name: 'No' },
];

const isNewAccountValue = computed(() => newAccountForm.is_new_account ? 'yes' : 'no');

const setIsNewAccount = (val: string | number) => {
    newAccountForm.is_new_account = val === 'yes';
};

const creditedAccountOptions = computed(() => {
    return (member.savings_accounts ?? []).map(a => ({
        id: a.id,
        name: `${a.account_no} — ${a.account_type}`
    }));
});

const minBalanceOptions = [
    { id: 'no', name: 'No' },
    { id: 'yes', name: 'Yes' },
];

const minBalanceValue = computed(() => newAccountForm.consider_min_balance ? 'yes' : 'no');

const setMinBalance = (val: string | number) => {
    newAccountForm.consider_min_balance = val === 'yes';
};

const submitNewAccount = async () => {
    newAccountProcessing.value = true;
    newAccountErrors.value = {};
    try {
        await tenantClient.post('/savings-accounts', newAccountForm);
        closeNewAccountDrawer();
        await fetchMember(true);
        currentTxnPage.value = 1;
        txnSearchQuery.value = '';
        txnStartDate.value = '';
        txnEndDate.value = '';
        toast.success('Savings account created successfully.');
    } catch (error: any) {
        if (error.response?.status === 422) {
            newAccountErrors.value = error.response.data.errors || {};
        } else {
            toast.error('Failed to create savings account.');
        }
    } finally {
        newAccountProcessing.value = false;
    }
};

// Custom Fee Drawer (Overrides)
const customFeeDrawerOpen = ref(false);
const customFeeProcessing = ref(false);
const customFeeErrors = ref<Record<string, any>>({});
const customFeeForm = reactive({
    account_id: 0,
    custom_monthly_fee_enabled: false,
    custom_monthly_fee_type: 'amount',
    custom_monthly_fee_amount: null as number | string | null,
});

const openCustomFeeDrawer = (account: any) => {
    Object.assign(customFeeForm, {
        account_id: account.id,
        custom_monthly_fee_enabled: account.custom_monthly_fee_enabled ?? false,
        custom_monthly_fee_type: account.custom_monthly_fee_type ?? 'amount',
        custom_monthly_fee_amount: account.custom_monthly_fee_amount,
    });
    customFeeErrors.value = {};
    customFeeDrawerOpen.value = true;
};

const closeCustomFeeDrawer = () => {
    customFeeDrawerOpen.value = false;
};

const submitCustomFee = async () => {
    customFeeProcessing.value = true;
    customFeeErrors.value = {};
    try {
        await tenantClient.put(`/savings-accounts/${customFeeForm.account_id}/custom-fees`, customFeeForm);
        toast.success('Custom fee settings updated successfully.');
        closeCustomFeeDrawer();
        await fetchMember(true); // Reload the member details so the new fees reflect in state
    } catch (error: any) {
        if (error.response?.status === 422) {
            customFeeErrors.value = error.response.data.errors || {};
        } else {
            toast.error('Failed to update custom fee settings.');
        }
    } finally {
        customFeeProcessing.value = false;
    }
};

const openDrawer = (type: 'deposit' | 'withdraw') => {
    drawerOpen.value = type;
    const accounts = member.savings_accounts ?? [];
    Object.assign(depositForm, {
        deposit_date: new Date().toISOString().split('T')[0],
        savings_account_id: accounts.length === 1 ? accounts[0]!.id : '',
        amount: '',
        deposited_by: member.name,
        transaction_reference: generateTransactionRef(),
        payment_mode: '',
        narration: '',
        use_for_loan_repayment: 'no',
    });
    depositErrors.value = {};
};

const closeDrawer = () => {
    drawerOpen.value = null;
    Object.assign(depositForm, {
        deposit_date: new Date().toISOString().split('T')[0],
        savings_account_id: '',
        amount: '',
        deposited_by: '',
        transaction_reference: '',
        payment_mode: '',
        narration: '',
        use_for_loan_repayment: 'no',
    });
};

const systemNarration = computed(() => {
    if (!drawerOpen.value) return '';
    const amount = Number(depositForm.amount) || 0;
    const formattedAmount = new Intl.NumberFormat('en-UG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
    // Use the date selected in the form (defaults to today, may be changed)
    const dateStr = depositForm.deposit_date || new Date().toISOString().split('T')[0] || '';
    const formattedDate = dateStr
        ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
    const person = depositForm.deposited_by?.trim() || 'Unknown';
    if (drawerOpen.value === 'deposit') {
        return `A deposit amount of UGX ${formattedAmount} deposited on ${formattedDate} by ${person}.`;
    }
    return `A withdrawal amount of UGX ${formattedAmount} withdrawn on ${formattedDate} by ${person}.`;
});

const submitTransaction = async () => {
    if (!drawerOpen.value) return;
    depositErrors.value = {};

    if (drawerOpen.value === 'withdraw' && withdrawalAmountError.value) return;

    if (!depositForm.deposited_by?.trim()) {
        depositErrors.value.deposited_by = 'Deposited by is required.';
        return;
    }

    depositProcessing.value = true;
    const url = drawerOpen.value === 'deposit'
        ? `/savings-accounts/${depositForm.savings_account_id}/deposit`
        : `/savings-accounts/${depositForm.savings_account_id}/withdraw`;

    try {
        const payload = { ...depositForm } as any;
        const extra = depositForm.narration?.trim();
        if (drawerOpen.value === 'deposit' || drawerOpen.value === 'withdraw') {
            payload.narration = extra ? `${systemNarration.value} ${extra}` : systemNarration.value;
        }
        const res = await tenantClient.post(url, payload);
        const actionLabel = drawerOpen.value === 'deposit' ? 'Deposit' : 'Withdrawal';
        toast.success(`${actionLabel} successful.`);
        closeDrawer();
        await fetchMember(true);
        // Fallback: append returned transaction if API includes it
        const body = res?.data ?? {};
        const returnedTxn =
            body?.data?.transaction ??
            body?.transaction ??
            body?.data?.txn ??
            body?.txn ??
            null;
        if (returnedTxn && Array.isArray(member.transactions)) {
            const exists = member.transactions.some((t: any) => t?.id === returnedTxn?.id);
            if (!exists) member.transactions = [returnedTxn, ...member.transactions];
        }
        currentTxnPage.value = 1;
        txnSearchQuery.value = '';
        txnStartDate.value = '';
        txnEndDate.value = '';
    } catch (error: any) {
        if (error.response?.status === 422) {
            depositErrors.value = error.response.data.errors || {};
        } else {
            toast.error(`Failed to execute ${drawerOpen.value}.`);
        }
    } finally {
        depositProcessing.value = false;
    }
};

const computedAge = computed(() => {
    if (!member.dob) return '—';
    const birth = new Date(member.dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} yrs`;
});

const currentBalance = computed(() => {
    if (!member.savings_accounts?.length) return 0;
    return member.savings_accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
});

const previewBalance = computed(() => {
    const amt = Number(depositForm.amount) || 0;
    if (drawerOpen.value === 'deposit') return currentBalance.value + amt;
    if (drawerOpen.value === 'withdraw') return Math.max(0, currentBalance.value - amt);
    return currentBalance.value;
});

const memberInitials = computed(() => {
    if (!member.name) return '';
    const parts = member.name.split(' ');
    return parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
});

const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).replace(/ /g, ' ');
};

const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(/ /g, ' ').replace(',', ',');
};

const formatCurrency = (amount?: string | number) => {
    if (amount === null || amount === undefined) return '0.00';
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Delete confirmation
const showDeleteDialog = ref(false);
const deleting = ref(false);

const deleteMember = () => {
    showDeleteDialog.value = true;
};

const cancelDelete = () => {
    showDeleteDialog.value = false;
};

const executeDelete = async () => {
    deleting.value = true;
    try {
        await tenantClient.delete(`/members/${member.id}`);
        toast.success('Member deleted successfully.');
        router.push('/tenant/members');
    } catch (error) {
        toast.error('An error occurred. The member could not be deleted.');
    } finally {
        deleting.value = false;
        showDeleteDialog.value = false;
    }
};

// ── Member approval / rejection ──────────────────────────────────────────────
const approving = ref(false);
const rejecting = ref(false);
const showRejectModal = ref(false);
const rejectReason = ref('');

const approveMember = async () => {
    approving.value = true;
    try {
        await tenantClient.put(`/members/${member.id}/approve`);
        toast.success('Member approved successfully. Account is now active.');
        member.status = 'active';
    } catch {
        toast.error('Failed to approve member. Please try again.');
    } finally {
        approving.value = false;
    }
};

const rejectMember = async () => {
    rejecting.value = true;
    try {
        await tenantClient.put(`/members/${member.id}/reject`, { rejection_reason: rejectReason.value });
        toast.success('Member registration rejected.');
        member.status = 'rejected';
        showRejectModal.value = false;
        rejectReason.value = '';
    } catch {
        toast.error('Failed to reject member. Please try again.');
    } finally {
        rejecting.value = false;
    }
};

const avatarInput = ref<HTMLInputElement | null>(null);
const uploadForm = reactive({
    avatar: null as File | null,
});
const uploadProcessing = ref(false);

const triggerAvatarUpload = () => {
    avatarInput.value?.click();
};

const handleAvatarUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        uploadForm.avatar = target.files[0];
        uploadProcessing.value = true;

        const formData = new FormData();
        formData.append('avatar', uploadForm.avatar);

        try {
            await tenantClient.post(`/members/${member.id}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Avatar updated successfully.');
            if (avatarInput.value) avatarInput.value.value = '';
            uploadForm.avatar = null;
            // Ideally reload member data here
        } catch (error) {
            toast.error('Failed to upload avatar.');
        } finally {
            uploadProcessing.value = false;
        }
    }
};
</script>

<template>
    <div v-if="pageLoading" class="flex items-center justify-center min-h-[60vh]">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-[#c9a84c]/30 border-t-[#c9a84c]"></div>
    </div>
    <template v-else>


        <div class="min-h-screen bg-background text-foreground relative">

            <div class="relative z-10 p-5 flex flex-col lg:flex-row gap-5">
                <!-- ==================== LEFT SIDEBAR ==================== -->
                <div class="w-full lg:w-[280px] shrink-0 flex flex-col gap-6">
                    <!-- Member Card -->
                    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <!-- Banner -->
                        <div class="relative h-[88px] bg-[#08262a]">
                            <!-- Status badge -->
                            <div class="absolute top-4 left-1/2 -translate-x-1/2">
                                <span
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[#cda434] border border-[#cda434]/30">
                                    <Star :size="10" fill="currentColor" />
                                    STANDARD
                                </span>
                            </div>
                        </div>

                        <!-- Avatar overlapping banner -->
                        <div class="flex justify-center -mt-12 relative z-10 px-4">
                            <div @click="triggerAvatarUpload"
                                class="w-[96px] h-[96px] rounded-full border-[3px] border-[#cda434] bg-white flex items-center justify-center overflow-hidden cursor-pointer shadow-sm relative">
                                <img v-if="member.avatar_url" :src="member.avatar_url" alt="Avatar"
                                    class="w-full h-full object-cover" />
                                <span v-else class="text-2xl font-bold text-[#cda434]">{{ memberInitials }}</span>
                                <div v-if="uploadProcessing"
                                    class="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <div
                                        class="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept="image/*"
                            class="hidden" />

                        <!-- Member info -->
                        <div class="px-5 pt-3 mb-5 text-center">
                            <h2 class="text-[17px] font-black text-gray-900 tracking-tight">{{ member.salutation ?
                                member.salutation + ' ' : '' }}{{ member.name || '—' }}</h2>
                            <p class="text-[13px] text-[#788896] mt-1 tracking-tight">ID · {{ member.member_number || '—' }}</p>
                            <p class="text-[13px] text-[#788896] mt-0.5 tracking-tight">{{ member.email || '—' }}</p>

                            <div class="mt-4">
                                <!-- Active -->
                                <span v-if="member.status === 'active'"
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#ebf7ee] text-[#22a053]">
                                    <span class="w-1.5 h-1.5 rounded-full bg-[#22a053]"></span>
                                    Active Member
                                </span>
                                <!-- Pending -->
                                <span v-else-if="member.status === 'pending'"
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
                                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    Pending Approval
                                </span>
                                <!-- Rejected -->
                                <span v-else-if="member.status === 'rejected'"
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-500">
                                    <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Rejected
                                </span>
                                <!-- Fallback for any other status -->
                                <span v-else
                                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                                    <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                    {{ member.status || 'Unknown' }}
                                </span>
                            </div>
                        </div>

                        <!-- Stats Grid 2x2 -->
                        <div class="mx-5 mb-5 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                            <div class="grid grid-cols-2">
                                <div class="p-4 border-r border-b border-gray-100">
                                    <span
                                        class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Shares</span>
                                    <span class="text-[17px] font-extrabold text-gray-900">0.0</span>
                                </div>
                                <div class="p-4 border-b border-gray-100">
                                    <span
                                        class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Gender</span>
                                    <span class="text-[16px] font-bold text-gray-900 capitalize">{{ member.gender || '—'
                                    }}</span>
                                </div>
                                <div class="p-4 border-r border-gray-100">
                                    <span
                                        class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Marital</span>
                                    <span class="text-[16px] font-bold text-gray-900 capitalize">{{
                                        member.marital_status || '—' }}</span>
                                </div>
                                <div class="p-4">
                                    <span
                                        class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Age</span>
                                    <span class="text-[16px] font-bold text-gray-900">{{ computedAge }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Edit Profile Button -->
                        <div class="px-5 pb-6">
                            <RouterLink :to="`/tenant/members/${member.id}/edit`"
                                class="flex items-center justify-center gap-2 w-full py-[11px] rounded-[20px] text-[13px] font-semibold text-[#546576] border border-gray-200 hover:bg-gray-50 transition-all">
                                <Edit :size="15" />
                                Edit Profile
                            </RouterLink>
                        </div>
                    </div>

                    <!-- Quick Info Card -->
                    <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h3 class="text-[12px] font-bold text-[#64748b] uppercase tracking-wider mb-5">Quick Info</h3>
                        <div class="space-y-[18px]">
                            <div class="flex justify-between items-center">
                                <span class="text-[13px] text-[#788896]">Date of Birth</span>
                                <span class="text-[13px] font-bold text-gray-900 font-mono tracking-tight">{{
                                    formatDate(member.dob).replace(/,/g, '') }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[13px] text-[#788896]">National ID</span>
                                <span class="text-[13px] font-bold text-gray-900 font-mono tracking-tight">{{
                                    member.id_number || '—' }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[13px] text-[#788896]">Date Joined</span>
                                <span class="text-[13px] font-bold text-gray-900 font-mono tracking-tight">{{
                                    formatDate(member.joined_at || member.created_at).replace(/,/g, '') }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[13px] text-[#788896]">Mobile Money</span>
                                <span class="text-[13px] font-bold text-gray-900 font-mono tracking-medium">{{
                                    member.mobile_money_number || '—' }}</span>
                            </div>
                            <div class="flex justify-between items-center pt-1">
                                <span class="text-[13px] text-[#788896]">Nationality</span>
                                <span class="text-[13px] font-bold text-gray-900 flex items-center gap-2">
                                    <template v-if="member.nationality">
                                        <span>🇺🇬</span> {{ member.nationality }}
                                    </template>
                                    <template v-else>
                                        <span class="font-mono">—</span>
                                    </template>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ==================== RIGHT MAIN AREA ==================== -->
                <div class="flex-1 flex flex-col gap-5">
                    <!-- ── Pending / Rejected approval banner ── -->
                    <div v-if="member.status === 'pending'"
                        class="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-1">
                        <Clock class="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        <div class="flex-1 min-w-0">
                            <p class="text-[13px] font-bold text-amber-800">Awaiting Approval</p>
                            <p class="text-[12px] text-amber-700 mt-0.5">
                                This member is pending approval. Deposits, withdrawals, and loans are blocked until an admin approves the registration.
                            </p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <button @click="showRejectModal = true" :disabled="rejecting"
                                class="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                                <ShieldX :size="13" />
                                Reject
                            </button>
                            <button @click="approveMember" :disabled="approving"
                                class="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50">
                                <ShieldCheck :size="13" />
                                {{ approving ? 'Approving…' : 'Approve Member' }}
                            </button>
                        </div>
                    </div>

                    <div v-if="member.status === 'rejected'"
                        class="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 mb-1">
                        <ShieldX class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                        <div class="flex-1 min-w-0">
                            <p class="text-[13px] font-bold text-red-800">Registration Rejected</p>
                            <p class="text-[12px] text-red-700 mt-0.5">
                                This member's registration was rejected and cannot transact.
                            </p>
                        </div>
                    </div>

                    <!-- ── Reject reason modal ── -->
                    <div v-if="showRejectModal"
                        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <h3 class="text-[15px] font-bold text-gray-900 mb-1">Reject Registration</h3>
                            <p class="text-[12px] text-gray-500 mb-4">Optionally provide a reason for rejection. This will be saved to the member's record.</p>
                            <textarea v-model="rejectReason" rows="3" placeholder="Rejection reason (optional)..."
                                class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-800 focus:border-red-400 focus:outline-none resize-none" />
                            <div class="flex justify-end gap-3 mt-4">
                                <button @click="showRejectModal = false"
                                    class="px-4 py-2 rounded-full text-[12px] font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button @click="rejectMember" :disabled="rejecting"
                                    class="px-5 py-2 rounded-full text-[12px] font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                                    {{ rejecting ? 'Rejecting…' : 'Confirm Reject' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Top Action Bar -->
                    <div class="flex flex-wrap items-center justify-end gap-3">
                        <button
                            class="flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] transition-colors">
                            <Users :size="15" />
                            Member Groups
                        </button>
                        <button @click="openDrawer('withdraw')"
                            :disabled="member.status !== 'active'"
                            :title="member.status !== 'active' ? 'Member must be approved before withdrawals' : ''"
                            :class="member.status !== 'active'
                                ? 'flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors shadow-sm'">
                            <MinusCircle :size="15" stroke-width="2.5" />
                            Withdraw
                        </button>
                        <button @click="openDrawer('deposit')"
                            :disabled="member.status !== 'active'"
                            :title="member.status !== 'active' ? 'Member must be approved before deposits' : ''"
                            :class="member.status !== 'active'
                                ? 'flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors shadow-sm'">
                            <PlusCircle :size="15" stroke-width="2.5" />
                            Deposit
                        </button>
                        <button @click="deleteMember"
                            class="flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full border border-[#fca5a5] bg-[#fff1f2] text-[#ef4444] hover:bg-[#ffe4e6] transition-colors">
                            <Trash2 :size="15" stroke-width="2.5" />
                            Delete Member
                        </button>
                    </div>

                    <!-- ==================== ACCOUNTS TABLE ==================== -->
                    <div class="bg-white border border-gray-100 rounded-2xl shadow-sm mb-2">
                        <div class="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                            <h3 class="text-[13px] font-bold text-[#546576] uppercase tracking-wider">Accounts</h3>
                            <button @click="openNewAccountDrawer"
                                class="flex items-center gap-2 px-[18px] py-[9px] text-[13px] font-bold rounded-full bg-[#08262a] text-white hover:bg-[#001d22] transition-colors shadow-sm">
                                <Plus :size="15" stroke-width="2.5" />
                                New Account
                            </button>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left min-w-[650px]">
                                <thead>
                                    <tr class="border-b border-gray-100 bg-white">
                                        <th
                                            class="py-4 px-6 text-[12px] font-bold text-[#788896] uppercase tracking-wider">
                                            Account
                                            Number</th>
                                        <th
                                            class="py-4 px-6 text-[12px] font-bold text-[#788896] uppercase tracking-wider">
                                            Account Type
                                        </th>
                                        <th
                                            class="py-4 px-6 text-[12px] font-bold text-[#788896] uppercase tracking-wider">
                                            Balance
                                            (UGX)</th>
                                        <th
                                            class="py-4 px-6 text-[12px] font-bold text-[#788896] uppercase tracking-wider">
                                            Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="!member.savings_accounts?.length">
                                        <td colspan="4" class="py-8 text-center text-[13px] text-gray-500">No accounts
                                            found.</td>
                                    </tr>
                                    <tr v-for="account in member.savings_accounts" :key="account.id"
                                        class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td class="py-5 px-6">
                                            <div class="flex items-center gap-4">
                                                <div
                                                    class="w-10 h-10 rounded-full bg-[#fdf8ed] flex items-center justify-center">
                                                    <Wallet :size="16" class="text-[#cda434]" />
                                                </div>
                                                <span
                                                    class="text-[14px] font-bold text-gray-900 font-mono tracking-tight">{{
                                                        account.account_no }}</span>
                                            </div>
                                        </td>
                                        <td class="py-5 px-6">
                                            <span
                                                class="inline-flex px-3 py-1 rounded-full text-[12px] font-semibold bg-[#e0f2fe] text-[#0369a1] capitalize">
                                                {{ account.account_type }}
                                            </span>
                                        </td>
                                        <td class="py-5 px-6">
                                            <span
                                                class="block text-[18px] font-extrabold text-gray-900 font-mono tracking-tight">{{
                                                    formatCurrency(account.balance) }}</span>
                                            <span class="block text-[11px] text-[#788896] mt-0.5">Last updated
                                                today</span>
                                        </td>
                                        <td class="py-5 px-6">
                                            <div class="flex items-center gap-2">
                                                <button
                                                    class="flex items-center gap-2 px-[14px] py-1.5 text-[12px] font-bold rounded-full border border-gray-200 text-[#546576] hover:bg-gray-50 transition-colors">
                                                    <Edit :size="12" />
                                                    Update Details
                                                </button>
                                                <button @click="openCustomFeeDrawer(account)"
                                                    class="flex items-center gap-2 px-[14px] py-1.5 text-[12px] font-bold rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                                                    title="Adjust Compulsory Fees">
                                                    <Star :size="12" />
                                                    Custom Fees
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- ==================== TABS SECTION ==================== -->
                    <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <!-- Tab Bar -->
                        <div class="flex overflow-x-auto border-b border-gray-100 px-4">
                            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                                'relative flex items-center gap-2 px-4 py-4 text-[13px] font-bold transition-colors whitespace-nowrap',
                                activeTab === tab.id
                                    ? 'text-[#cda434]'
                                    : 'text-[#788896] hover:text-gray-900'
                            ]">
                                <component :is="{
                                    'profile': UserCircle2,
                                    'transactions': FileText,
                                    'savings': TrendingUp,
                                    'withdrawal': MinusCircle,
                                    'loans': Wallet,
                                    'shares': BarChart3
                                }[tab.id as string] || UserCircle2" :size="16" />
                                {{ tab.label }}
                                <span v-if="tab.count !== null"
                                    class="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-md text-[11px] font-bold font-mono bg-gray-100 text-[#788896]">
                                    {{ tab.count }}
                                </span>
                                <!-- Gold active indicator -->
                                <div v-if="activeTab === tab.id"
                                    class="absolute bottom-0 left-4 right-4 h-[3px] bg-[#cda434] rounded-t-full"></div>
                            </button>
                        </div>

                        <!-- Profile Tab Content -->
                        <div v-show="activeTab === 'profile'" class="p-6">
                            <div class="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                    <!-- Date Joined -->
                                    <div class="p-5 border-r border-b border-gray-100">
                                        <span
                                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Date
                                            Joined</span>
                                        <p class="text-[16px] font-bold text-gray-900 tracking-tight">{{
                                            formatDate(member.joined_at ||
                                                member.created_at) }}</p>
                                    </div>
                                    <!-- Member Type -->
                                    <div class="p-5 border-r border-b border-gray-100">
                                        <span
                                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Member
                                            Type</span>
                                        <span
                                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ebf7ee] text-[#22a053]">
                                            <Star :size="10" fill="currentColor" />
                                            {{ member.member_type ? member.member_type.replace('_', ' ') : 'new member'
                                            }}
                                        </span>
                                    </div>
                                    <!-- Other Contact -->
                                    <div class="p-5 border-r border-b border-gray-100">
                                        <span
                                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Other
                                            Contact</span>
                                        <p class="text-[15px] font-bold text-gray-900 font-mono tracking-tight">
                                            <template v-if="member.other_contact">{{ member.other_contact }}</template>
                                            <template v-else><span class="font-mono">—</span></template>
                                        </p>
                                    </div>
                                    <!-- Mobile Money -->
                                    <div class="p-5 border-b border-gray-100">
                                        <span
                                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Mobile
                                            Money</span>
                                        <p class="text-[15px] font-bold text-gray-900 font-mono tracking-tight">
                                            <template v-if="member.mobile_money_number">{{ member.mobile_money_number
                                                }}</template>
                                            <template v-else><span class="font-mono">—</span></template>
                                        </p>
                                    </div>

                                    <!-- Row 2 -->
                                    <!-- Address -->
                                    <div class="p-5 border-r border-gray-100">
                                        <span
                                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Address</span>
                                        <p class="text-[16px] font-bold text-gray-900 tracking-tight capitalize">
                                            <template v-if="member.address">{{ member.address }}</template>
                                            <template v-else><span class="font-mono">—</span></template>
                                        </p>
                                    </div>
                                    <!-- Next Of Kin -->
                                    <div class="p-5 border-r border-gray-100">
                                        <span
                                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Next
                                            Of
                                            Kin</span>
                                        <p class="text-[16px] font-bold text-gray-900 tracking-tight capitalize">
                                            <template v-if="member.next_of_kin">{{ member.next_of_kin }}</template>
                                            <template v-else><span class="font-mono">—</span></template>
                                        </p>
                                    </div>
                                    <!-- Next of Kin Contacts -->
                                    <div class="p-5 border-r border-gray-100">
                                        <span
                                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Next
                                            of
                                            Kin Contacts</span>
                                        <p class="text-[15px] font-bold text-gray-900 font-mono tracking-tight">
                                            <template v-if="member.next_of_kin_contact">{{ member.next_of_kin_contact
                                                }}</template>
                                            <template v-else><span class="font-mono">—</span></template>
                                        </p>
                                    </div>
                                    <!-- Nationality -->
                                    <div class="p-5 flex flex-col justify-center">
                                        <span
                                            class="block text-[11px] font-bold text-[#788896] uppercase tracking-wider mb-2">Nationality</span>
                                        <p
                                            class="text-[16px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                            <template v-if="member.nationality">
                                                <span>🇺🇬</span> {{ member.nationality }}
                                            </template>
                                            <template v-else>
                                                <span class="font-mono text-gray-900">—</span>
                                            </template>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Transactions Tab Content -->
                        <div v-show="activeTab === 'transactions'" class="flex flex-col">
                            <!-- Top Controls -->
                            <div class="py-4 bg-transparent flex flex-wrap gap-4 justify-between items-center px-4 md:px-6">
                                <div class="flex items-center gap-3">
                                    <input v-model="txnStartDate" type="date"
                                        class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
                                    <input v-model="txnEndDate" type="date"
                                        class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
                                    <button @click="txnStartDate = ''; txnEndDate = ''"
                                        class="h-10 px-5 text-[13px] font-bold rounded-full bg-[#f1f5f9] text-gray-700 hover:bg-[#e2e8f0] transition-colors">
                                        Clear
                                    </button>
                                </div>
                                <div>
                                    <button
                                        class="h-10 px-6 text-[13px] font-bold rounded-full bg-[#334155] text-white hover:bg-[#1e293b] transition-colors shadow-sm">
                                        Export
                                    </button>
                                </div>
                            </div>

                            <!-- Table Filters -->
                            <div class="py-2 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4 px-4 md:px-6">
                                <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
                                    Show
                                    <select v-model="txnsPerPage" @change="currentTxnPage = 1"
                                        class="h-8 px-2 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50 cursor-pointer">
                                        <option :value="10">10</option>
                                        <option :value="25">25</option>
                                        <option :value="50">50</option>
                                    </select>
                                    entries
                                </div>
                                <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
                                    Search:
                                    <input v-model="txnSearchQuery" @input="currentTxnPage = 1" type="text"
                                        class="h-9 w-[200px] sm:w-[250px] px-3 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50"
                                        placeholder="Ref, Details, Added by..." />
                                </div>
                            </div>

                            <!-- Transactions Table -->
                            <div class="overflow-x-auto border-y border-gray-100">
                                <table class="w-full text-left min-w-[900px]">
                                    <thead>
                                        <tr class="border-b border-gray-100 bg-transparent text-[#64748b]">
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">S/N</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Trans Type</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Amount</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Details</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Date</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Receipt</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Added by</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="!paginatedTransactions.length">
                                            <td colspan="8" class="py-8 text-center text-[13px] text-muted-foreground">
                                                No transactions found.</td>
                                        </tr>
                                        <tr v-for="(txn, index) in paginatedTransactions" :key="txn.id"
                                            class="border-b border-transparent hover:bg-accent/30 transition-colors">
                                            <td class="py-3.5 px-5 text-[13px] text-muted-foreground">{{ (currentTxnPage
                                                - 1) * txnsPerPage + index + 1 }}.</td>
                                            <td class="py-3.5 px-5">
                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                                    :class="txn.type === 'deposit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'">
                                                    {{ txn.type }}
                                                </span>
                                            </td>
                                            <td class="py-3.5 px-5">
                                                <span class="text-[14px] font-mono font-bold"
                                                    :class="txn.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                                                    {{ txn.type === 'deposit' ? '+' : '-' }}{{
                                                        formatCurrency(txn.amount) }}
                                                </span>
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ txn.narration || (txn.type === 'deposit' ? 'Deposit' : 'Withdrawal')
                                                }}
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ formatDate(txn.transaction_date || txn.created_at) }}
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground font-mono">
                                                <div class="flex items-center gap-2">
                                                    {{ txn.reference || '—' }}
                                                    <button v-if="txn.reference" @click="printReceipt(txn)"
                                                        class="text-blue-600 hover:text-blue-800 transition-colors no-print"
                                                        title="Print Receipt">
                                                        <Printer :size="14" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ txn.deposited_by || '—' }}
                                            </td>
                                            <td class="py-3.5 px-5 text-center">
                                                <button @click="confirmDeleteTxn(txn)"
                                                    class="flex mx-auto h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                                                    title="Delete Transaction">
                                                    <Trash2 :size="14" stroke-width="2.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Pagination -->
                            <div
                                class="py-5 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#64748b]">
                                <div>
                                    Showing {{ filteredTransactions.length ? (currentTxnPage - 1) * txnsPerPage + 1 : 0
                                    }} to {{ Math.min(currentTxnPage * txnsPerPage, filteredTransactions.length) }} of
                                    {{ filteredTransactions.length }} entries
                                </div>
                                <div class="flex items-center gap-2">
                                    <button @click="prevTxnPage" :disabled="currentTxnPage === 1"
                                        class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50">&lsaquo;</button>
                                    <button
                                        class="w-8 h-8 rounded-full flex items-center justify-center bg-[#cda434] text-white font-bold shadow-sm text-[12px]">{{
                                            currentTxnPage }}</button>
                                    <button @click="nextTxnPage" :disabled="currentTxnPage === totalTxnPages"
                                        class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50">&rsaquo;</button>
                                </div>
                            </div>
                        </div>

                        <!-- Savings Tab Content -->
                        <div v-show="activeTab === 'savings'" class="flex flex-col">
                            <!-- Top Controls -->
                            <div class="py-4 bg-transparent flex flex-wrap gap-4 justify-between items-center px-4 md:px-6">
                                <div class="flex items-center gap-3">
                                    <input v-model="txnStartDate" type="date"
                                        class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
                                    <input v-model="txnEndDate" type="date"
                                        class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
                                    <button @click="txnStartDate = ''; txnEndDate = ''"
                                        class="h-10 px-5 text-[13px] font-bold rounded-full bg-[#f1f5f9] text-gray-700 hover:bg-[#e2e8f0] transition-colors">
                                        Clear
                                    </button>
                                </div>
                                <div>
                                    <button @click="openDrawer('deposit')"
                                        class="h-10 px-6 text-[13px] font-bold rounded-full bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors shadow-sm">
                                        Record Deposit
                                    </button>
                                </div>
                            </div>

                            <!-- Table Filters -->
                            <div class="py-2 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4 px-4 md:px-6">
                                <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
                                    Show
                                    <select v-model="txnsPerPage" @change="currentTxnPage = 1"
                                        class="h-8 px-2 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50 cursor-pointer">
                                        <option :value="10">10</option>
                                        <option :value="25">25</option>
                                        <option :value="50">50</option>
                                    </select>
                                    entries
                                </div>
                                <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
                                    Search:
                                    <input v-model="txnSearchQuery" @input="currentTxnPage = 1" type="text"
                                        class="h-9 w-[200px] sm:w-[250px] px-3 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50"
                                        placeholder="Ref, Narration, Paid by..." />
                                </div>
                            </div>

                            <!-- Savings Table (Original Transaction Table) -->
                            <div class="overflow-x-auto border-y border-gray-100">
                                <table class="w-full text-left min-w-[900px]">
                                    <thead>
                                        <tr class="border-b border-gray-100 bg-transparent text-[#64748b]">
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">S/N
                                                &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Account
                                                &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider bg-transparent">
                                                Amount &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">
                                                Description &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Paid by
                                                &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">
                                                Transaction Date &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Date
                                                Added &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-center">
                                                Action &#x21C5;</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="!paginatedTransactions.length">
                                            <td colspan="8" class="py-8 text-center text-[13px] text-muted-foreground">
                                                No transactions found.</td>
                                        </tr>
                                        <tr v-for="(txn, index) in paginatedTransactions" :key="txn.id"
                                            class="border-b border-transparent hover:bg-accent/30 transition-colors">
                                            <td class="py-3.5 px-5 text-[13px] text-muted-foreground">{{ (currentTxnPage
                                                - 1) * txnsPerPage + index + 1 }}.</td>
                                            <td class="py-3.5 px-5">
                                                <div class="font-semibold text-[13px] text-foreground font-mono">
                                                    {{ txn.account?.account_no || '—' }}
                                                </div>
                                                <div class="text-[11px] text-muted-foreground capitalize">({{
                                                    txn.account?.account_type || 'Account' }})</div>
                                            </td>
                                            <td class="py-3.5 px-5">
                                                <span class="text-[14px] font-mono font-bold"
                                                    :class="txn.type === 'deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                                                    {{ txn.type === 'deposit' ? '+' : '-' }}{{
                                                        formatCurrency(txn.amount) }}
                                                </span>
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ txn.narration || (txn.type === 'deposit' ? 'Deposit' : 'Withdrawal')
                                                }}
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ formatDate(txn.transaction_date || txn.created_at) }}
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground font-mono">
                                                <div class="flex items-center gap-2">
                                                    {{ txn.reference || '—' }}
                                                    <button v-if="txn.reference" @click="printReceipt(txn)"
                                                        class="text-blue-600 hover:text-blue-800 transition-colors no-print"
                                                        title="Print Receipt">
                                                        <Printer :size="14" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ formatDateTime(txn.created_at) }}
                                            </td>
                                            <td class="py-3.5 px-5 text-center">
                                                <button @click="confirmDeleteTxn(txn)"
                                                    class="flex mx-auto h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                                                    title="Delete Transaction">
                                                    <Trash2 :size="14" stroke-width="2.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Pagination -->
                            <div
                                class="py-5 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#64748b]">
                                <div>
                                    Showing {{ activeTransactions.length ? (currentTxnPage - 1) * txnsPerPage + 1 : 0 }}
                                    to {{ Math.min(currentTxnPage * txnsPerPage, activeTransactions.length) }} of {{
                                        activeTransactions.length }} entries
                                </div>
                                <div class="flex items-center gap-2">
                                    <button @click="prevTxnPage" :disabled="currentTxnPage === 1"
                                        class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50">&lsaquo;</button>
                                    <button
                                        class="w-8 h-8 rounded-full flex items-center justify-center bg-[#16a34a] text-white font-bold shadow-sm text-[12px]">{{
                                            currentTxnPage }}</button>
                                    <button @click="nextTxnPage" :disabled="currentTxnPage === totalTxnPages"
                                        class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50">&rsaquo;</button>
                                </div>
                            </div>
                        </div>

                        <!-- Withdrawal Tab Content -->
                        <div v-show="activeTab === 'withdrawal'" class="flex flex-col">
                            <!-- Top Controls -->
                            <div class="py-4 bg-transparent flex flex-wrap gap-4 justify-between items-center px-4 md:px-6">
                                <div class="flex items-center gap-3">
                                    <input v-model="txnStartDate" type="date"
                                        class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
                                    <input v-model="txnEndDate" type="date"
                                        class="h-10 px-4 rounded-full bg-[#f1f5f9] border-0 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#cda434]/50 cursor-pointer min-w-[140px]" />
                                    <button @click="txnStartDate = ''; txnEndDate = ''"
                                        class="h-10 px-5 text-[13px] font-bold rounded-full bg-[#f1f5f9] text-gray-700 hover:bg-[#e2e8f0] transition-colors">
                                        Clear
                                    </button>
                                </div>
                                <div>
                                    <button @click="openDrawer('withdraw')"
                                        class="h-10 px-6 text-[13px] font-bold rounded-full bg-[#ea580c] text-white hover:bg-[#c2410c] transition-colors shadow-sm">
                                        Record Withdrawal
                                    </button>
                                </div>
                            </div>

                            <!-- Table Filters -->
                            <div class="py-2 pb-5 flex flex-col sm:flex-row justify-between items-center gap-4 px-4 md:px-6">
                                <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
                                    Show
                                    <select v-model="txnsPerPage" @change="currentTxnPage = 1"
                                        class="h-8 px-2 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50 cursor-pointer">
                                        <option :value="10">10</option>
                                        <option :value="25">25</option>
                                        <option :value="50">50</option>
                                    </select>
                                    entries
                                </div>
                                <div class="flex items-center gap-2 text-[13px] text-[#64748b]">
                                    Search:
                                    <input v-model="txnSearchQuery" @input="currentTxnPage = 1" type="text"
                                        class="h-9 w-[200px] sm:w-[250px] px-3 rounded-md bg-[#f1f5f9] border-0 text-gray-700 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#cda434]/50"
                                        placeholder="Ref, Narration, Paid by..." />
                                </div>
                            </div>

                            <!-- Withdrawal Table -->
                            <div class="overflow-x-auto border-y border-gray-100">
                                <table class="w-full text-left min-w-[900px]">
                                    <thead>
                                        <tr class="border-b border-gray-100 bg-transparent text-[#64748b]">
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">S/N
                                                &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Account
                                                &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider bg-transparent">
                                                Amount &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">
                                                Description &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">
                                                Transaction Date &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">
                                                Reference &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider">Date
                                                Added &#x21C5;</th>
                                            <th class="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-center">
                                                Action &#x21C5;</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-if="!paginatedTransactions.length">
                                            <td colspan="8" class="py-8 text-center text-[13px] text-muted-foreground">
                                                No withdrawals found.</td>
                                        </tr>
                                        <tr v-for="(txn, index) in paginatedTransactions" :key="txn.id"
                                            class="border-b border-transparent hover:bg-accent/30 transition-colors">
                                            <td class="py-3.5 px-5 text-[13px] text-muted-foreground">{{ (currentTxnPage
                                                - 1) * txnsPerPage + index + 1 }}.</td>
                                            <td class="py-3.5 px-5">
                                                <div class="font-semibold text-[13px] text-foreground font-mono">
                                                    {{ txn.account?.account_no || '—' }}
                                                </div>
                                                <div class="text-[11px] text-muted-foreground capitalize">({{
                                                    txn.account?.account_type || 'Account' }})</div>
                                            </td>
                                            <td class="py-3.5 px-5">
                                                <span
                                                    class="text-[14px] font-mono font-bold text-red-600 dark:text-red-400">
                                                    -{{ formatCurrency(txn.amount) }}
                                                </span>
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ txn.narration || 'Withdrawal' }}
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ formatDate(txn.transaction_date || txn.created_at) }}
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground font-mono">
                                                <div class="flex items-center gap-2">
                                                    {{ txn.reference || '—' }}
                                                    <button v-if="txn.reference" @click="printReceipt(txn)"
                                                        class="text-blue-600 hover:text-blue-800 transition-colors no-print"
                                                        title="Print Receipt">
                                                        <Printer :size="14" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td class="py-3.5 px-5 text-[13px] text-foreground">
                                                {{ formatDateTime(txn.created_at) }}
                                            </td>
                                            <td class="py-3.5 px-5 text-center">
                                                <button @click="confirmDeleteTxn(txn)"
                                                    class="flex mx-auto h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                                                    title="Delete Transaction">
                                                    <Trash2 :size="14" stroke-width="2.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Pagination -->
                            <div
                                class="py-5 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#64748b]">
                                <div>
                                    Showing {{ activeTransactions.length ? (currentTxnPage - 1) * txnsPerPage + 1 : 0 }}
                                    to {{ Math.min(currentTxnPage * txnsPerPage, activeTransactions.length) }} of {{
                                        activeTransactions.length }} entries
                                </div>
                                <div class="flex items-center gap-2">
                                    <button @click="prevTxnPage" :disabled="currentTxnPage === 1"
                                        class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50">&lsaquo;</button>
                                    <button
                                        class="w-8 h-8 rounded-full flex items-center justify-center bg-[#ea580c] text-white font-bold shadow-sm text-[12px]">{{
                                            currentTxnPage }}</button>
                                    <button @click="nextTxnPage" :disabled="currentTxnPage === totalTxnPages"
                                        class="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50">&rsaquo;</button>
                                </div>
                            </div>
                        </div>

                        <!-- Other Tabs Placeholder -->
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

                        <div v-show="activeTab === 'loans'" class="p-12 text-center">
                            <div
                                class="w-12 h-12 rounded-full bg-[#eff6ff] flex items-center justify-center mx-auto mb-3">
                                <Wallet :size="20" class="text-[#2563eb]" />
                            </div>
                            <h4 class="text-[15px] font-bold text-[#0f172a]">Loans Management</h4>
                            <p class="text-[13px] text-[#64748b] mt-1 max-w-sm mx-auto">
                                Manage loan applications, disbursements, and repayments for this member.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ==================== NEW ACCOUNT DRAWER ==================== -->
            <Transition name="drawer-fade">
                <div v-if="newAccountDrawerOpen" class="fixed inset-0 z-50 flex justify-end">
                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeNewAccountDrawer"></div>

                    <!-- Drawer Panel -->
                    <Transition name="drawer-slide">
                        <div v-if="newAccountDrawerOpen"
                            class="relative w-full max-w-[440px] h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col">
                            <!-- Header -->
                            <div class="flex items-center justify-between p-5 border-b border-gray-200">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                                        <Plus :size="16" class="text-[#c9a84c]" />
                                    </div>
                                    <h3 class="text-[15px] font-bold text-gray-900">Add Account</h3>
                                </div>
                                <button @click="closeNewAccountDrawer"
                                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all">
                                    <X :size="18" />
                                </button>
                            </div>

                            <form @submit.prevent="submitNewAccount"
                                class="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
                                <!-- Account Type (Savings Product) - Searchable -->
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Account Type
                                    </label>
                                    <SearchableSelect :modelValue="newAccountForm.savings_product_id"
                                        @update:modelValue="newAccountForm.savings_product_id = $event"
                                        :options="productOptions" placeholder="Select account type"
                                        :error="newAccountErrors.savings_product_id" />
                                </div>

                                <!-- Is New Account - Searchable -->
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Is New Account
                                    </label>
                                    <SearchableSelect :modelValue="isNewAccountValue"
                                        @update:modelValue="setIsNewAccount($event)" :options="isNewAccountOptions"
                                        placeholder="Select" />
                                </div>

                                <!-- ===== FIELDS WHEN IS NEW ACCOUNT = YES ===== -->
                                <template v-if="newAccountForm.is_new_account">
                                    <!-- Charges (Multi-select dropdown) -->
                                    <div>
                                        <label
                                            class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Charges (to apply) <span class="text-red-600">*</span>
                                        </label>
                                        <div class="relative">
                                            <div @click="showChargeDropdown = !showChargeDropdown"
                                                class="min-h-[46px] py-2.5 px-3 rounded-xl border bg-gray-50 cursor-pointer flex flex-wrap gap-1.5 items-center transition-all"
                                                :class="showChargeDropdown ? 'border-[#c9a84c]/50 ring-1 ring-[#c9a84c]/30' : 'border-gray-200 hover:border-gray-400'">
                                                <template v-if="newAccountForm.charges.length > 0">
                                                    <span v-for="cid in newAccountForm.charges" :key="cid"
                                                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20">
                                                        {{ getChargeNameById(cid) }}
                                                        <X :size="10" class="ml-0.5 cursor-pointer hover:text-red-600"
                                                            @click.stop="toggleCharge(cid)" />
                                                    </span>
                                                </template>
                                                <span v-else class="text-[12px] text-gray-400">Select charges</span>
                                            </div>

                                            <!-- Charge dropdown -->
                                            <Transition enter-active-class="transition duration-100 ease-out"
                                                enter-from-class="transform scale-95 opacity-0"
                                                enter-to-class="transform scale-100 opacity-100"
                                                leave-active-class="transition duration-75 ease-in"
                                                leave-from-class="transform scale-100 opacity-100"
                                                leave-to-class="transform scale-95 opacity-0">
                                                <div v-if="showChargeDropdown"
                                                    class="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                                                    <ul class="max-h-48 overflow-auto py-1">
                                                        <li v-if="!selectedProductCharges.length"
                                                            class="px-4 py-6 text-center text-[12px] text-gray-400">
                                                            Select an account type first
                                                        </li>
                                                        <li v-for="charge in selectedProductCharges" :key="charge.id"
                                                            @click="toggleCharge(charge.id)"
                                                            class="flex items-center justify-between px-4 py-2.5 text-[13px] cursor-pointer transition-colors hover:bg-gray-50"
                                                            :class="isChargeSelected(charge.id) ? 'text-gray-900 font-semibold bg-gray-100' : 'text-gray-500'">
                                                            <span>{{ charge.type }}</span>
                                                            <Check v-if="isChargeSelected(charge.id)" :size="14"
                                                                class="text-[#c9a84c]" />
                                                        </li>
                                                    </ul>
                                                </div>
                                            </Transition>
                                        </div>
                                    </div>

                                    <!-- Credited Account - Searchable -->
                                    <div>
                                        <label
                                            class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Credited Account <span class="text-red-600">*</span>
                                        </label>
                                        <SearchableSelect :modelValue="newAccountForm.credited_account_id"
                                            @update:modelValue="newAccountForm.credited_account_id = $event"
                                            :options="creditedAccountOptions" placeholder="Select Account"
                                            :error="newAccountErrors.credited_account_id" />
                                    </div>

                                    <!-- Initial Deposit -->
                                    <div>
                                        <label
                                            class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Initial Deposit <span class="text-red-600">*</span>
                                        </label>
                                        <div class="relative">
                                            <span
                                                class="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-500">UGX</span>
                                            <input v-model="formattedInitialDeposit" type="text" placeholder="0"
                                                class="w-full py-3 pl-14 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[14px] font-mono font-bold placeholder-gray-400 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 transition-all" />
                                        </div>
                                        <p v-if="newAccountErrors.initial_deposit"
                                            class="mt-1 text-[11px] text-red-600">{{
                                                newAccountErrors.initial_deposit }}</p>
                                    </div>
                                </template>

                                <!-- ===== FIELDS WHEN IS NEW ACCOUNT = NO ===== -->
                                <template v-else>
                                    <!-- Note -->
                                    <div class="rounded-xl bg-gray-100 border border-gray-200 p-4">
                                        <p class="text-[12px] text-gray-500 leading-relaxed">
                                            <span class="font-bold text-gray-900">Note:</span>
                                            Opening reserves will be debited automatically with the opening
                                            balance as it is assumed this money is already in any of the asset
                                            accounts e.g Cash, Bank, mobile money etc
                                        </p>
                                    </div>

                                    <!-- Opening Balance -->
                                    <div>
                                        <label
                                            class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Opening balance <span class="text-red-600">*</span>
                                        </label>
                                        <div class="relative">
                                            <span
                                                class="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-500">UGX</span>
                                            <input v-model="formattedOpeningBalance" type="text" placeholder="0"
                                                class="w-full py-3 pl-14 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[14px] font-mono font-bold placeholder-gray-400 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/30 transition-all" />
                                        </div>
                                        <p v-if="newAccountErrors.initial_deposit"
                                            class="mt-1 text-[11px] text-red-600">{{ newAccountErrors.initial_deposit
                                            }}</p>
                                    </div>
                                </template>

                                <!-- Consider Minimum Balance - Searchable -->
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Consider account type minimum balance
                                    </label>
                                    <SearchableSelect :modelValue="minBalanceValue"
                                        @update:modelValue="setMinBalance($event)" :options="minBalanceOptions"
                                        placeholder="Please select one" />
                                </div>
                            </form>

                            <!-- Footer Buttons -->
                            <div class="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
                                <button @click="closeNewAccountDrawer" type="button"
                                    class="px-5 py-2.5 rounded-lg text-[12px] font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-all">
                                    Close
                                </button>
                                <button @click="submitNewAccount" :disabled="newAccountProcessing"
                                    class="px-5 py-2.5 rounded-lg text-[12px] font-bold bg-[#c9a84c] text-white hover:bg-[#b8973e] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    <div v-if="newAccountProcessing"
                                        class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white">
                                    </div>
                                    Save changes
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>

            <!-- ==================== CUSTOM FEE DRAWER (OVERRIDES) ==================== -->
            <Transition name="drawer-fade">
                <div v-if="customFeeDrawerOpen" class="fixed inset-0 z-50 flex justify-end">
                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeCustomFeeDrawer"></div>

                    <!-- Drawer Panel -->
                    <Transition name="drawer-slide">
                        <div v-if="customFeeDrawerOpen"
                            class="relative w-full max-w-[440px] h-full bg-card border-l border-border shadow-2xl flex flex-col">
                            <!-- Header -->
                            <div class="flex items-center justify-between p-5 border-b border-border">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Star :size="16" class="text-amber-600 dark:text-amber-500" />
                                    </div>
                                    <h3 class="text-[15px] font-bold text-foreground">Custom Fees</h3>
                                </div>
                                <button @click="closeCustomFeeDrawer"
                                    class="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                                    <X :size="18" />
                                </button>
                            </div>

                            <form @submit.prevent="submitCustomFee"
                                class="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
                                <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
                                    <h4 class="text-sm font-semibold text-amber-900 dark:text-amber-500 mb-1">Fee Overrides</h4>
                                    <p class="text-xs text-amber-700 dark:text-amber-400">
                                        Settings defined here will override the default periodic charges assigned to the savings product for this specific member account.
                                    </p>
                                </div>

                                <!-- Enable Custom Fee -->
                                <div class="flex items-center justify-between">
                                    <div>
                                        <label class="block text-sm font-semibold text-foreground">Enable Custom Fee</label>
                                        <p class="text-xs text-muted-foreground mt-0.5">Override product defaults</p>
                                    </div>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <div class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" :class="customFeeForm.custom_monthly_fee_enabled ? 'bg-[#c9a84c]' : 'bg-secondary'">
                                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out" :class="customFeeForm.custom_monthly_fee_enabled ? 'translate-x-6' : 'translate-x-1'"></span>
                                            <input v-model="customFeeForm.custom_monthly_fee_enabled" type="checkbox" class="sr-only">
                                        </div>
                                    </label>
                                </div>

                                <template v-if="customFeeForm.custom_monthly_fee_enabled">
                                    <div class="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-border pt-4">
                                        <div>
                                            <label class="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Fee Format</label>
                                            <select v-model="customFeeForm.custom_monthly_fee_type" class="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-sm focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/50 transition-all">
                                                <option value="amount">Fixed Amount</option>
                                                <option value="percentage">Percentage (%)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Amount / Rate</label>
                                            <div class="relative">
                                                <span v-if="customFeeForm.custom_monthly_fee_type === 'amount'" class="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">UGX</span>
                                                <span v-else class="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">%</span>
                                                <input v-model="customFeeForm.custom_monthly_fee_amount" type="number" step="0.01" class="w-full py-2.5 border border-border bg-background rounded-xl text-sm focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/50 transition-all" :class="customFeeForm.custom_monthly_fee_type === 'amount' ? 'pl-12 pr-4' : 'pl-4 pr-10'" />
                                            </div>
                                            <p v-if="customFeeErrors.custom_monthly_fee_amount" class="mt-1 text-[11px] text-[#dc2626]">{{ customFeeErrors.custom_monthly_fee_amount[0] || customFeeErrors.custom_monthly_fee_amount }}</p>
                                        </div>
                                    </div>
                                </template>
                            </form>

                            <div class="p-5 border-t border-border flex items-center justify-end gap-3">
                                <button @click="closeCustomFeeDrawer" type="button" class="px-5 py-2.5 rounded-lg text-[12px] font-semibold text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-all">
                                    Cancel
                                </button>
                                <button @click="submitCustomFee" :disabled="customFeeProcessing" class="px-5 py-2.5 rounded-lg text-[12px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    <span v-if="customFeeProcessing" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                                    Apply Changes
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>

            <!-- ==================== DEPOSIT / WITHDRAW DRAWER ==================== -->
            <Transition name="drawer-fade">
                <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end" @click.self="closeDrawer">
                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer"></div>

                    <!-- Drawer Panel -->
                    <Transition name="drawer-slide">
                        <div v-if="drawerOpen"
                            class="relative w-full max-w-[620px] h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col">
                            <!-- Header -->
                            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-500/50">
                                <div class="flex items-center gap-4">
                                    <div :class="[
                                        'w-10 h-10 rounded-xl flex items-center justify-center',
                                        drawerOpen === 'deposit' ? 'bg-[#5cb88a]/20' : 'bg-orange-500/20'
                                    ]">
                                        <ArrowDownLeft v-if="drawerOpen === 'deposit'" :size="18"
                                            class="text-[#4a9f75]" />
                                        <ArrowUpRight v-else :size="18" class="text-orange-700" />
                                    </div>
                                    <div>
                                        <h3 class="text-[16px] font-black text-gray-900 tracking-tight">
                                            {{ drawerOpen === 'deposit' ? 'Deposit Form' : 'Withdraw Form' }}
                                        </h3>
                                        <p class="text-[11px] font-bold text-gray-700 mt-0.5">
                                            {{ member.name }} · {{ member.member_number }}
                                        </p>
                                    </div>
                                </div>
                                <button @click="closeDrawer"
                                    class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-800 hover:bg-black/10 transition-all">
                                    <X :size="18" stroke-width="2.5" />
                                </button>
                            </div>

                            <!-- Form Body -->
                            <form @submit.prevent="submitTransaction"
                                class="flex-1 overflow-y-auto bg-white relative">
                                <div class="p-6 flex flex-col gap-6">

                                    <!-- Row 1: Date + Account -->
                                    <div class="grid grid-cols-2 gap-5">
                                        <div>
                                            <label
                                                class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                                {{ drawerOpen === 'deposit' ? 'Deposit' : 'Withdrawal' }} date
                                            </label>
                                            <div class="relative">
                                                <Calendar :size="15"
                                                    class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                                <input v-model="depositForm.deposit_date" type="date"
                                                    class="w-full py-3.5 pl-11 pr-4 rounded-xl bg-black/5 border border-gray-600/50 text-gray-900 text-[14px] font-bold focus:outline-none focus:bg-white focus:border-[#cda434] transition-all" />
                                            </div>
                                            <p v-if="depositErrors.deposit_date"
                                                class="mt-1 text-[11px] text-red-600 font-bold">
                                                {{ depositErrors.deposit_date }}</p>
                                        </div>
                                        <div>
                                            <label
                                                class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                                Account <span v-if="(member.savings_accounts ?? []).length > 1" class="text-red-600 ml-0.5">*</span>
                                            </label>
                                            <SearchableSelect :modelValue="depositForm.savings_account_id"
                                                @update:modelValue="depositForm.savings_account_id = $event"
                                                :options="accountOptions"
                                                :placeholder="(member.savings_accounts ?? []).length > 1 ? 'Select account' : 'Select Account'"
                                                :error="depositErrors.savings_account_id"
                                                class="[&_.vs__dropdown-toggle]:!bg-white [&_.vs__dropdown-toggle]:!py-2 [&_.vs__dropdown-toggle]:!rounded-xl [&_.vs__dropdown-toggle]:!border-white" />
                                            <p v-if="(member.savings_accounts ?? []).length > 1 && !depositForm.savings_account_id" class="mt-1 text-[10px] text-amber-600 font-semibold">
                                                This member has {{ (member.savings_accounts ?? []).length }} accounts — please select one
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Min balance info badge — withdrawal only, shown when min balance is enforced -->
                                    <div v-if="drawerOpen === 'withdraw' && selectedAccount && (selectedAccount as any).consider_min_balance && Number((selectedAccount as any).minimum_balance) > 0" class="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[12px] font-medium text-amber-800">
                                        <span>Min Balance: <strong>UGX {{ Number((selectedAccount as any).minimum_balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</strong></span>
                                        <span class="text-amber-400">|</span>
                                        <span>Withdrawable: <strong>UGX {{ Number((selectedAccount as any).withdrawable_amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</strong></span>
                                    </div>

                                    <!-- Row 2: Amount + Deposited By -->
                                    <div class="grid grid-cols-2 gap-5">
                                        <div>
                                            <label
                                                class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                                Amount to {{ drawerOpen === 'deposit' ? 'deposit' : 'withdraw' }}
                                            </label>
                                            <div class="relative">
                                                <span
                                                    class="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-gray-900">UGX</span>
                                                <input v-model="formattedAmount" type="text" placeholder="0.00"
                                                    :class="['w-full py-3.5 pl-16 pr-4 rounded-xl bg-black/5 border text-gray-900 text-[16px] font-mono font-bold placeholder-gray-600 focus:outline-none focus:bg-white transition-all', withdrawalAmountError ? 'border-red-500 focus:border-red-500' : 'border-gray-600/50 focus:border-[#cda434]']" />
                                            </div>
                                            <p v-if="withdrawalAmountError" class="mt-1 text-[11px] text-red-600 font-bold">{{ withdrawalAmountError }}</p>
                                            <p v-else-if="depositErrors.amount"
                                                class="mt-1 text-[11px] text-red-600 font-bold">{{
                                                    depositErrors.amount }}</p>
                                        </div>
                                        <div>
                                            <label
                                                class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                                {{ drawerOpen === 'deposit' ? 'Deposited by' : 'Withdrawn by' }}
                                            </label>
                                            <div class="relative">
                                                <UserCircle2 :size="15"
                                                    class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                                <input v-model="depositForm.deposited_by" type="text"
                                                    :placeholder="member.name"
                                                    class="w-full py-3.5 pl-11 pr-4 rounded-xl bg-black/5 border border-gray-600/50 text-gray-900 text-[14px] font-bold placeholder-gray-600 focus:outline-none focus:bg-white focus:border-[#cda434] transition-all" />
                                            </div>
                                            <p v-if="depositErrors.deposited_by"
                                                class="mt-1 text-[11px] text-red-600 font-bold">
                                                {{ depositErrors.deposited_by }}</p>
                                        </div>
                                    </div>

                                    <!-- Row 3: Transaction Reference + Payment Mode -->
                                    <div class="grid grid-cols-2 gap-5">
                                        <div>
                                            <label
                                                class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                                Transaction Reference
                                            </label>
                                            <div class="relative">
                                                <FileText :size="15"
                                                    class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                                <input v-model="depositForm.transaction_reference" type="text" readonly
                                                    class="w-full py-3.5 pl-11 pr-4 rounded-xl bg-black/5 border border-gray-600/50 text-gray-900 text-[14px] font-mono font-bold cursor-default focus:outline-none transition-all" />
                                            </div>
                                            <p v-if="depositErrors.transaction_reference"
                                                class="mt-1 text-[11px] text-red-600 font-bold">{{
                                                    depositErrors.transaction_reference }}</p>
                                        </div>
                                        <div>
                                            <label
                                                class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                                Payment mode
                                            </label>
                                            <SearchableSelect :modelValue="depositForm.payment_mode"
                                                @update:modelValue="depositForm.payment_mode = $event"
                                                :options="paymentModeOptions" placeholder="Select payment mode"
                                                :error="depositErrors.payment_mode"
                                                class="[&_.vs__dropdown-toggle]:!bg-white [&_.vs__dropdown-toggle]:!py-2 [&_.vs__dropdown-toggle]:!rounded-xl [&_.vs__dropdown-toggle]:!border-white" />
                                        </div>
                                    </div>

                                    <!-- Row 4: Narration + Loan Repayment -->
                                    <div class="grid grid-cols-2 gap-5">
                                        <div class="space-y-2">
                                            <label
                                                class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                                <div class="flex items-center gap-1.5">
                                                    <MessageSquare :size="13" />
                                                    {{ drawerOpen === 'deposit' ? 'Deposit' : 'Withdrawal' }} Narration
                                                </div>
                                            </label>
                                            <p v-if="drawerOpen === 'deposit' || drawerOpen === 'withdraw'"
                                                class="rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-[12px] text-gray-700">
                                                {{ systemNarration }}
                                            </p>
                                            <textarea v-model="depositForm.narration"
                                                :placeholder="drawerOpen === 'deposit' ? 'Additional narration (optional)...' : 'Withdrawal reason...'"
                                                rows="2"
                                                class="w-full py-3.5 px-4 rounded-xl bg-black/5 border border-gray-600/50 text-gray-900 text-[14px] font-bold placeholder-gray-600 focus:outline-none focus:bg-white focus:border-[#cda434] transition-all resize-none"></textarea>
                                            <p v-if="depositErrors.narration"
                                                class="mt-1 text-[11px] text-red-600 font-bold">{{
                                                    depositErrors.narration }}</p>
                                        </div>
                                        <div>
                                            <label
                                                class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                                Use for loan repayment
                                            </label>
                                            <SearchableSelect :modelValue="depositForm.use_for_loan_repayment"
                                                @update:modelValue="depositForm.use_for_loan_repayment = $event"
                                                :options="loanRepaymentOptions" placeholder="Select option"
                                                class="[&_.vs__dropdown-toggle]:!bg-white [&_.vs__dropdown-toggle]:!py-2 [&_.vs__dropdown-toggle]:!rounded-xl [&_.vs__dropdown-toggle]:!border-white" />
                                        </div>
                                    </div>

                                    <!-- Balance Preview Card -->
                                    <div :class="[
                                        'rounded-xl p-5 border-none mt-2 shadow-sm',
                                        drawerOpen === 'deposit'
                                            ? 'bg-[#c6e4d6]'
                                            : 'bg-[#ffebd6]'
                                    ]">
                                        <div class="flex items-center justify-between mb-4">
                                            <span
                                                class="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Current
                                                Balance</span>
                                            <span
                                                class="text-[14px] font-black text-gray-900 font-mono tracking-tight">UGX
                                                {{
                                                    formatCurrency(currentBalance) }}</span>
                                        </div>
                                        <div class="flex items-center justify-between pt-4 border-t border-white/40">
                                            <span class="text-[11px] font-bold text-gray-900 uppercase tracking-widest">
                                                After {{ drawerOpen === 'deposit' ? 'Deposit' : 'Withdrawal' }}
                                            </span>
                                            <span :class="[
                                                'text-[16px] font-black font-mono tracking-tight',
                                                drawerOpen === 'deposit' ? 'text-[#00a86b]' : 'text-[#ea580c]'
                                            ]">
                                                UGX {{ formatCurrency(previewBalance) }}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </form>

                            <!-- Footer Buttons -->
                            <div
                                class="px-6 py-4 bg-[#979f9f]/90 border-t border-gray-400 flex items-center justify-end gap-3 z-10 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                                <button @click="closeDrawer" type="button"
                                    class="px-6 py-2.5 rounded-lg text-[13px] font-bold text-gray-800 border border-gray-500 hover:bg-gray-400/50 transition-all">
                                    Close
                                </button>
                                <button @click="submitTransaction"
                                    :disabled="depositProcessing || !depositForm.savings_account_id || !depositForm.amount || Number(depositForm.amount) <= 0 || !!withdrawalAmountError"
                                    :class="[
                                        'px-7 py-2.5 rounded-lg text-[13px] font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2',
                                        drawerOpen === 'deposit'
                                            ? 'bg-[#5cb88a] text-white hover:bg-[#4a9f75] border-none'
                                            : 'bg-orange-600 text-white hover:bg-orange-700 border-none'
                                    ]">
                                    <div v-if="depositProcessing"
                                        class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white">
                                    </div>
                                    Submit
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </div>

        <!-- Transaction Deletion Dialog -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="showTxnDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancelDeleteTxn"></div>
                    <div
                        class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
                        <div class="flex items-start gap-4">
                            <div
                                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle :size="20" class="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Delete Transaction
                                </h3>
                                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                    Are you sure you want to delete transaction <strong
                                        class="text-neutral-700 dark:text-neutral-200">{{ txnToDelete?.reference
                                        }}</strong>?
                                    <br><br>
                                    <span class="text-amber-600 font-semibold italic">Warning: This will reverse the
                                        account
                                        balance!</span>
                                </p>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end gap-3">
                            <button @click="cancelDeleteTxn"
                                class="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                                Cancel
                            </button>
                            <button @click="executeDeleteTxn" :disabled="isDeletingTxn"
                                class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                                <span v-if="isDeletingTxn"
                                    class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                                Reverse & Delete
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Delete Confirmation Dialog -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="showDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancelDelete"></div>
                    <div
                        class="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:border dark:border-neutral-800">
                        <div class="flex items-start gap-4">
                            <div
                                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle :size="20" class="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 class="text-base font-semibold text-neutral-900 dark:text-white">Delete Member</h3>
                                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                    Are you sure you want to delete <strong
                                        class="text-neutral-700 dark:text-neutral-200">{{
                                            member.name }}</strong>? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end gap-3">
                            <button @click="cancelDelete"
                                class="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                                Cancel
                            </button>
                            <button @click="executeDelete" :disabled="deleting"
                                class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                                <span v-if="deleting"
                                    class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </template>

    <!-- Printable Receipt Template -->
    <div v-if="printingTxn"
        class="print-only fixed inset-0 bg-white z-[9999] p-10 font-serif leading-relaxed text-[#1a1a1a]">
        <div class="max-w-[800px] mx-auto border border-gray-200 p-8 shadow-sm">
            <!-- Header -->
            <div class="text-center mb-6">
                <h1 class="text-xl font-bold uppercase tracking-wide mb-1">NUGSOFT MAIN TESTING SACCO</h1>
                <p class="text-[13px] font-medium italic mb-1">Address: KAMPALA</p>
                <p class="text-[13px] font-medium italic mb-1">TEL: +256701270153</p>
                <p class="text-[13px] font-medium italic">Email: nugsoftemail@nugsoft.com</p>

                <div class="mt-6 inline-block border-b-2 border-double border-gray-800 px-8 pb-1">
                    <h2 class="text-sm font-bold uppercase tracking-wider">{{ printingTxn.type }} RECEIPT</h2>
                </div>
            </div>

            <!-- Transaction Details Table-like Layout -->
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
                    <span class="font-bold">{{ formatCurrency(printingTxn.amount) }} UGX</span>
                </div>
                <div class="flex justify-between border-b border-dashed border-gray-300 pb-2">
                    <span class="font-semibold text-gray-600">Trans Charge:</span>
                    <span class="font-bold">{{ formatCurrency(printingTxn.charge || 0) }}.0 UGX</span>
                </div>
            </div>

            <!-- Served By -->
            <div class="text-center mt-10 space-y-4">
                <p class="text-[13px] font-bold tracking-wider">Served By: <span class="uppercase">{{
                    printingTxn.deposited_by || 'SYSTEM ADMIN' }}</span></p>

                <div class="pt-8">
                    <p class="text-[12px] italic text-gray-500 mb-2">Signature & stamp</p>
                    <div class="w-48 mx-auto border-b border-gray-400"></div>
                </div>
            </div>

            <!-- Footer Message -->
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
    body * {
        visibility: hidden !important;
    }

    .print-only,
    .print-only * {
        visibility: visible !important;
    }

    .print-only {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
    }

    .no-print {
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

/* Drawer transitions */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
    transition: opacity 0.25s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
    opacity: 0;
}

.drawer-slide-enter-active {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-slide-leave-active {
    transition: transform 0.2s ease-in;
}

.drawer-slide-enter-from {
    transform: translateX(100%);
}

.drawer-slide-leave-to {
    transform: translateX(100%);
}
</style>
