<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { X, ArrowDownLeft, ArrowUpRight, Calendar, UserCircle2, FileText, MessageSquare } from 'lucide-vue-next';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import { tenantClient } from '@/tenant/apis/tenantClient';
import { formatMoneyValue } from '@/Global';

const props = defineProps<{
    member: Record<string, any>;
    currencyCode: string;
    currentBalance: number;
}>();

const emit = defineEmits<{
    success: [];
}>();

const drawerOpen = ref<null | 'deposit' | 'withdraw'>(null);
const processing = ref(false);
const errors = ref<Record<string, any>>({});

const form = reactive({
    deposit_date: new Date().toISOString().split('T')[0],
    savings_account_id: '' as string | number,
    amount: '' as string | number,
    deposited_by: '',
    transaction_reference: '',
    payment_mode: '',
    narration: '',
    use_for_loan_repayment: 'no',
});

const paymentModeOptions = [
    { id: 'cash', name: 'Cash' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'mobile_money', name: 'Mobile Money' },
    { id: 'cheque', name: 'Cheque' },
    { id: 'teller', name: 'Teller' },
    { id: 'ussd', name: 'USSD' },
];

const loanRepaymentOptions = [
    { id: 'no', name: 'No (only deposit)' },
    { id: 'yes', name: 'Yes (apply to loan)' },
];

const generateRef = () => {
    const date = new Date().toISOString().split('T')[0]!.replace(/-/g, '');
    return `TXN-${date}-${Math.floor(10000 + Math.random() * 90000)}`;
};

const accountOptions = computed(() =>
    (props.member.savings_accounts ?? []).map((a: any) => ({ id: a.id, name: `${a.account_no} (${a.account_type})` }))
);

const selectedAccount = computed(() =>
    (props.member.savings_accounts ?? []).find((a: any) => String(a.id) === String(form.savings_account_id))
);

const withdrawableAmount = computed(() => {
    const acc = selectedAccount.value as any;
    if (!acc) return null;
    return acc.consider_min_balance ? (acc.withdrawable_amount as number) : (acc.balance as number);
});

const withdrawalAmountError = computed(() => {
    if (drawerOpen.value !== 'withdraw') return '';
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return '';
    const max = withdrawableAmount.value;
    if (max === null) return '';
    if (amt > max) {
        const acc = selectedAccount.value as any;
        const minBal = acc?.minimum_balance ?? 0;
        return `Exceeds withdrawable amount. Max: ${props.currencyCode} ${formatMoneyValue(max)}${minBal > 0 ? ` (min balance: ${props.currencyCode} ${formatMoneyValue(minBal)})` : ''}`;
    }
    return '';
});

const formattedAmount = computed({
    get: () => {
        if (form.amount === '' || form.amount === null || form.amount === undefined) return '';
        const parts = form.amount.toString().split('.');
        if (parts[0] !== undefined) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    },
    set: (val: string) => {
        const stripped = val.replace(/[^0-9.]/g, '');
        const parts = stripped.split('.');
        form.amount = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    },
});

const previewBalance = computed(() => {
    const amt = Number(form.amount) || 0;
    if (drawerOpen.value === 'deposit') return props.currentBalance + amt;
    if (drawerOpen.value === 'withdraw') return Math.max(0, props.currentBalance - amt);
    return props.currentBalance;
});

const systemNarration = computed(() => {
    if (!drawerOpen.value) return '';
    const amount = new Intl.NumberFormat('en-UG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(form.amount) || 0);
    const dateStr = form.deposit_date || new Date().toISOString().split('T')[0] || '';
    const formattedDate = dateStr
        ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
    const person = form.deposited_by?.trim() || 'Unknown';
    return drawerOpen.value === 'deposit'
        ? `A deposit amount of ${props.currencyCode} ${amount} deposited on ${formattedDate} by ${person}.`
        : `A withdrawal amount of ${props.currencyCode} ${amount} withdrawn on ${formattedDate} by ${person}.`;
});

const formatCurrency = (v?: string | number) =>
    formatMoneyValue(v ?? 0);

function open(type: 'deposit' | 'withdraw') {
    drawerOpen.value = type;
    const accounts = props.member.savings_accounts ?? [];
    Object.assign(form, {
        deposit_date: new Date().toISOString().split('T')[0],
        savings_account_id: accounts.length === 1 ? accounts[0].id : '',
        amount: '',
        deposited_by: props.member.name,
        transaction_reference: generateRef(),
        payment_mode: '',
        narration: '',
        use_for_loan_repayment: 'no',
    });
    errors.value = {};
}

function close() {
    drawerOpen.value = null;
}

async function submit() {
    if (!drawerOpen.value) return;
    if (drawerOpen.value === 'withdraw' && withdrawalAmountError.value) return;
    if (!form.deposited_by?.trim()) {
        errors.value.deposited_by = 'Deposited by is required.';
        return;
    }
    errors.value = {};
    processing.value = true;
    const url = drawerOpen.value === 'deposit'
        ? `/savings-accounts/${form.savings_account_id}/deposit`
        : `/savings-accounts/${form.savings_account_id}/withdraw`;
    try {
        const payload = { ...form } as any;
        const extra = form.narration?.trim();
        payload.narration = extra ? `${systemNarration.value} ${extra}` : systemNarration.value;
        await tenantClient.post(url, payload);
        toast.success(`${drawerOpen.value === 'deposit' ? 'Deposit' : 'Withdrawal'} successful.`);
        close();
        emit('success');
    } catch (error: any) {
        if (error.response?.status === 422) {
            errors.value = error.response.data.errors || {};
        } else {
            toast.error(`Failed to execute ${drawerOpen.value}.`);
        }
    } finally {
        processing.value = false;
    }
}

defineExpose({ open });
</script>

<template>
    <Transition name="drawer-fade">
        <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end" @click.self="close">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>
            <Transition name="drawer-slide">
                <div v-if="drawerOpen"
                    class="relative w-full max-w-[620px] h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-500/50">
                        <div class="flex items-center gap-4">
                            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center',
                                drawerOpen === 'deposit' ? 'bg-[#5cb88a]/20' : 'bg-orange-500/20']">
                                <ArrowDownLeft v-if="drawerOpen === 'deposit'" :size="18" class="text-[#4a9f75]" />
                                <ArrowUpRight v-else :size="18" class="text-orange-700" />
                            </div>
                            <div>
                                <h3 class="text-[16px] font-black text-gray-900 tracking-tight">
                                    {{ drawerOpen === 'deposit' ? 'Deposit Form' : 'Withdraw Form' }}
                                </h3>
                                <p class="text-[11px] font-bold text-gray-700 mt-0.5">{{ member.name }} · {{
                                    member.member_number }}</p>
                            </div>
                        </div>
                        <button @click="close"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-800 hover:bg-black/10 transition-all">
                            <X :size="18" stroke-width="2.5" />
                        </button>
                    </div>

                    <!-- Form Body -->
                    <form @submit.prevent="submit" class="flex-1 overflow-y-auto bg-white relative">
                        <div class="p-6 flex flex-col gap-6">
                            <!-- Date + Account -->
                            <div class="grid grid-cols-2 gap-5">
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                        {{ drawerOpen === 'deposit' ? 'Deposit' : 'Withdrawal' }} date
                                    </label>
                                    <div class="relative">
                                        <Calendar :size="15"
                                            class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                        <input v-model="form.deposit_date" type="date"
                                            class="w-full py-3.5 pl-11 pr-4 rounded-xl bg-black/5 border border-gray-600/50 text-gray-900 text-[14px] font-bold focus:outline-none focus:bg-white focus:border-[#cda434] transition-all" />
                                    </div>
                                    <p v-if="errors.deposit_date" class="mt-1 text-[11px] text-red-600 font-bold">{{
                                        errors.deposit_date }}</p>
                                </div>
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                        Account <span v-if="(member.savings_accounts ?? []).length > 1"
                                            class="text-red-600 ml-0.5">*</span>
                                    </label>
                                    <SearchableSelect :modelValue="form.savings_account_id"
                                        @update:modelValue="form.savings_account_id = $event" :options="accountOptions"
                                        placeholder="Select Account" :error="errors.savings_account_id" />
                                    <p v-if="(member.savings_accounts ?? []).length > 1 && !form.savings_account_id"
                                        class="mt-1 text-[10px] text-amber-600 font-semibold">
                                        This member has {{ (member.savings_accounts ?? []).length }} accounts — please
                                        select one
                                    </p>
                                </div>
                            </div>

                            <!-- Min balance badge (withdrawal) -->
                            <div v-if="drawerOpen === 'withdraw' && selectedAccount && (selectedAccount as any).consider_min_balance && Number((selectedAccount as any).minimum_balance) > 0"
                                class="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[12px] font-medium text-amber-800">
                                <span>Min Balance: <strong>{{ currencyCode }} {{
                                    formatMoneyValue(Number((selectedAccount as any).minimum_balance))
                                        }}</strong></span>
                                <span class="text-amber-400">|</span>
                                <span>Withdrawable: <strong>{{ currencyCode }} {{
                                    formatMoneyValue(Number((selectedAccount as any).withdrawable_amount))
                                        }}</strong></span>
                            </div>

                            <!-- Amount + Person -->
                            <div class="grid grid-cols-2 gap-5">
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                        Amount to {{ drawerOpen === 'deposit' ? 'deposit' : 'withdraw' }}
                                    </label>
                                    <div class="relative">
                                        <span
                                            class="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-gray-900">{{
                                            currencyCode }}</span>
                                        <input v-model="formattedAmount" type="text" placeholder="0.00"
                                            :class="['w-full py-3.5 pl-16 pr-4 rounded-xl bg-black/5 border text-gray-900 text-[16px] font-mono font-bold placeholder-gray-600 focus:outline-none focus:bg-white transition-all',
                                                withdrawalAmountError ? 'border-red-500 focus:border-red-500' : 'border-gray-600/50 focus:border-[#cda434]']" />
                                    </div>
                                    <p v-if="withdrawalAmountError" class="mt-1 text-[11px] text-red-600 font-bold">{{
                                        withdrawalAmountError }}</p>
                                    <p v-else-if="errors.amount" class="mt-1 text-[11px] text-red-600 font-bold">{{
                                        errors.amount }}</p>
                                </div>
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                        {{ drawerOpen === 'deposit' ? 'Deposited by' : 'Withdrawn by' }}
                                    </label>
                                    <div class="relative">
                                        <UserCircle2 :size="15"
                                            class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                        <input v-model="form.deposited_by" type="text" :placeholder="member.name"
                                            class="w-full py-3.5 pl-11 pr-4 rounded-xl bg-black/5 border border-gray-600/50 text-gray-900 text-[14px] font-bold placeholder-gray-600 focus:outline-none focus:bg-white focus:border-[#cda434] transition-all" />
                                    </div>
                                    <p v-if="errors.deposited_by" class="mt-1 text-[11px] text-red-600 font-bold">{{
                                        errors.deposited_by }}</p>
                                </div>
                            </div>

                            <!-- Reference + Payment Mode -->
                            <div class="grid grid-cols-2 gap-5">
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">Transaction
                                        Reference</label>
                                    <div class="relative">
                                        <FileText :size="15"
                                            class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-800 pointer-events-none" />
                                        <input v-model="form.transaction_reference" type="text" readonly
                                            class="w-full py-3.5 pl-11 pr-4 rounded-xl bg-black/5 border border-gray-600/50 text-gray-900 text-[14px] font-mono font-bold cursor-default focus:outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">Payment
                                        mode</label>
                                    <SearchableSelect :modelValue="form.payment_mode"
                                        @update:modelValue="form.payment_mode = $event" :options="paymentModeOptions"
                                        placeholder="Select payment mode" :error="errors.payment_mode" />
                                </div>
                            </div>

                            <!-- Narration + Loan Repayment -->
                            <div class="grid grid-cols-2 gap-5">
                                <div class="space-y-2">
                                    <label
                                        class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">
                                        <div class="flex items-center gap-1.5">
                                            <MessageSquare :size="13" />
                                            {{ drawerOpen === 'deposit' ? 'Deposit' : 'Withdrawal' }} Narration
                                        </div>
                                    </label>
                                    <textarea v-model="form.narration"
                                        :placeholder="drawerOpen === 'withdraw' ? 'Withdrawal reason...' : 'Additional narration (optional)...'"
                                        rows="2"
                                        class="w-full py-3.5 px-4 rounded-xl bg-black/5 border border-gray-600/50 text-gray-900 text-[14px] font-bold placeholder-gray-600 focus:outline-none focus:bg-white focus:border-[#cda434] transition-all resize-none"></textarea>
                                    <p
                                        class="rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-[12px] text-gray-700">
                                        {{ systemNarration }}</p>
                                    <p v-if="errors.narration" class="mt-1 text-[11px] text-red-600 font-bold">{{
                                        errors.narration }}</p>
                                </div>
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-2">Use
                                        for loan repayment</label>
                                    <SearchableSelect :modelValue="form.use_for_loan_repayment"
                                        @update:modelValue="form.use_for_loan_repayment = $event"
                                        :options="loanRepaymentOptions" placeholder="Select option" />
                                </div>
                            </div>

                            <!-- Balance Preview -->
                            <div :class="['rounded-xl p-5 border-none mt-2 shadow-sm',
                                drawerOpen === 'deposit' ? 'bg-[#c6e4d6]' : 'bg-[#ffebd6]']">
                                <div class="flex items-center justify-between mb-4">
                                    <span class="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Current
                                        Balance</span>
                                    <span class="text-[14px] font-black text-gray-900 font-mono tracking-tight">{{
                                        currencyCode }} {{ formatMoneyValue(currentBalance) }}</span>
                                </div>
                                <div class="flex items-center justify-between pt-4 border-t border-white/40">
                                    <span class="text-[11px] font-bold text-gray-900 uppercase tracking-widest">
                                        After {{ drawerOpen === 'deposit' ? 'Deposit' : 'Withdrawal' }}
                                    </span>
                                    <span :class="['text-[16px] font-black font-mono tracking-tight',
                                        drawerOpen === 'deposit' ? 'text-[#00a86b]' : 'text-[#ea580c]']">
                                        {{ currencyCode }} {{ formatMoneyValue(previewBalance) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </form>

                    <!-- Footer -->
                    <div
                        class="px-6 py-4 bg-[#979f9f]/90 border-t border-gray-400 flex items-center justify-end gap-3 z-10 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <button @click="close" type="button"
                            class="px-6 py-2.5 rounded-lg text-[13px] font-bold text-gray-800 border border-gray-500 hover:bg-gray-400/50 transition-all">
                            Close
                        </button>
                        <button @click="submit"
                            :disabled="processing || !form.savings_account_id || !form.amount || Number(form.amount) <= 0 || !!withdrawalAmountError"
                            :class="['px-7 py-2.5 rounded-lg text-[13px] font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2',
                                drawerOpen === 'deposit' ? 'bg-[#5cb88a] text-white hover:bg-[#052659]/90 : 'bg-orange-600 text-white hover:bg-[#052659]/90
                            <div v-if="processing"
                                class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                            Submit
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<style scoped>
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

.drawer-slide-enter-from,
.drawer-slide-leave-to {
    transform: translateX(100%);
}
</style>
