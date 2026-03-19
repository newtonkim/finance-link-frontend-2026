<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { X, Plus, Check } from 'lucide-vue-next';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import { tenantClient } from '@/tenant/apis/tenantClient';
import type { SavingsProduct } from '../composables/useMember';

const props = defineProps<{
    memberId: number;
    savingsAccounts: any[];
    savingsProducts: SavingsProduct[];
    currencyCode: string;
}>();

const emit = defineEmits<{ success: [] }>();

const open = ref(false);
const processing = ref(false);
const errors = ref<Record<string, any>>({});
const showChargeDropdown = ref(false);

const form = reactive({
    member_id: props.memberId,
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

const productOptions = computed(() => (props.savingsProducts ?? []).map(p => ({ id: p.id, name: p.name })));

const selectedProductCharges = computed(() => {
    if (!form.savings_product_id) return [];
    return props.savingsProducts.find(p => p.id === Number(form.savings_product_id))?.charges ?? [];
});

const creditedAccountOptions = computed(() =>
    (props.savingsAccounts ?? []).map((a: any) => ({ id: a.id, name: `${a.account_no} — ${a.account_type}` }))
);

const isNewAccountValue = computed(() => form.is_new_account ? 'yes' : 'no');
const minBalanceValue = computed(() => form.consider_min_balance ? 'yes' : 'no');

const isNewAccountOptions = [{ id: 'yes', name: 'Yes' }, { id: 'no', name: 'No' }];
const minBalanceOptions = [{ id: 'no', name: 'No' }, { id: 'yes', name: 'Yes' }];

const formattedInitialDeposit = computed({
    get: () => {
        if (form.initial_deposit === '' || form.initial_deposit === null || form.initial_deposit === undefined) return '';
        const parts = form.initial_deposit.toString().split('.');
        if (parts[0] !== undefined) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    },
    set: (val: string) => {
        const stripped = val.replace(/[^0-9.]/g, '');
        const parts = stripped.split('.');
        form.initial_deposit = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    },
});

const formattedOpeningBalance = computed({
    get: () => {
        if (form.opening_balance === '' || form.opening_balance === null || form.opening_balance === undefined) return '';
        const parts = form.opening_balance.toString().split('.');
        if (parts[0] !== undefined) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    },
    set: (val: string) => {
        const stripped = val.replace(/[^0-9.]/g, '');
        const parts = stripped.split('.');
        form.opening_balance = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    },
});

watch(() => form.savings_product_id, (newVal) => {
    if (newVal) {
        const product = props.savingsProducts.find(p => p.id === Number(newVal));
        if (product) {
            form.account_type = product.type;
            form.charges = product.charges?.map(c => c.id) ?? [];
        }
    }
});

const toggleCharge = (id: number) => {
    const idx = form.charges.indexOf(id);
    idx > -1 ? form.charges.splice(idx, 1) : form.charges.push(id);
};

const isChargeSelected = (id: number) => form.charges.includes(id);

const getChargeName = (id: number) => selectedProductCharges.value.find(c => c.id === id)?.type ?? `Charge ${id}`;

function openDrawer() {
    Object.assign(form, {
        member_id: props.memberId,
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
    errors.value = {};
    open.value = true;
}

async function submit() {
    processing.value = true;
    errors.value = {};
    try {
        await tenantClient.post('/savings-accounts', form);
        open.value = false;
        toast.success('Savings account created successfully.');
        emit('success');
    } catch (error: any) {
        if (error.response?.status === 422) {
            errors.value = error.response.data.errors || {};
        } else {
            toast.error('Failed to create savings account.');
        }
    } finally {
        processing.value = false;
    }
}

defineExpose({ openDrawer });
</script>

<template>
    <Transition name="drawer-fade">
        <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="open = false"></div>
            <Transition name="drawer-slide">
                <div v-if="open" class="relative w-full max-w-[440px] h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-5 border-b border-gray-200">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-bg-nfuko-yellow/10 flex items-center justify-center">
                                <Plus :size="16" class="text-bg-nfuko-yellow" />
                            </div>
                            <h3 class="text-[15px] font-bold text-gray-900">Add Account</h3>
                        </div>
                        <button @click="open = false"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all">
                            <X :size="18" />
                        </button>
                    </div>

                    <form @submit.prevent="submit" class="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
                        <!-- Account Type -->
                        <div>
                            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Account Type</label>
                            <SearchableSelect :modelValue="form.savings_product_id"
                                @update:modelValue="form.savings_product_id = $event"
                                :options="productOptions" placeholder="Select account type"
                                :error="errors.savings_product_id" />
                        </div>

                        <!-- Is New Account -->
                        <div>
                            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Is New Account</label>
                            <SearchableSelect :modelValue="isNewAccountValue"
                                @update:modelValue="form.is_new_account = $event === 'yes'"
                                :options="isNewAccountOptions" placeholder="Select" />
                        </div>

                        <!-- Fields for new account -->
                        <template v-if="form.is_new_account">
                            <!-- Charges multi-select -->
                            <div>
                                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Charges (to apply) <span class="text-red-600">*</span>
                                </label>
                                <div class="relative">
                                    <div @click="showChargeDropdown = !showChargeDropdown"
                                        class="min-h-[46px] py-2.5 px-3 rounded-xl border bg-gray-50 cursor-pointer flex flex-wrap gap-1.5 items-center transition-all"
                                        :class="showChargeDropdown ? 'border-bg-nfuko-yellow/50 ring-1 ring-bg-nfuko-yellow/30' : 'border-gray-200 hover:border-gray-400'">
                                        <template v-if="form.charges.length > 0">
                                            <span v-for="cid in form.charges" :key="cid"
                                                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-bg-nfuko-yellow/10 text-bg-nfuko-yellow border border-bg-nfuko-yellow/20">
                                                {{ getChargeName(cid) }}
                                                <X :size="10" class="ml-0.5 cursor-pointer hover:text-red-600" @click.stop="toggleCharge(cid)" />
                                            </span>
                                        </template>
                                        <span v-else class="text-[12px] text-gray-400">Select charges</span>
                                    </div>
                                    <Transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0"
                                        enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in"
                                        leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                                        <div v-if="showChargeDropdown"
                                            class="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                                            <ul class="max-h-48 overflow-auto py-1">
                                                <li v-if="!selectedProductCharges.length"
                                                    class="px-4 py-6 text-center text-[12px] text-gray-400">Select an account type first</li>
                                                <li v-for="charge in selectedProductCharges" :key="charge.id"
                                                    @click="toggleCharge(charge.id)"
                                                    class="flex items-center justify-between px-4 py-2.5 text-[13px] cursor-pointer transition-colors hover:bg-gray-50"
                                                    :class="isChargeSelected(charge.id) ? 'text-gray-900 font-semibold bg-gray-100' : 'text-gray-500'">
                                                    <span>{{ charge.type }}</span>
                                                    <Check v-if="isChargeSelected(charge.id)" :size="14" class="text-bg-nfuko-yellow" />
                                                </li>
                                            </ul>
                                        </div>
                                    </Transition>
                                </div>
                            </div>

                            <!-- Debit Account -->
                            <div>
                                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Debit Account <span class="text-red-600">*</span>
                                </label>
                                <SearchableSelect :modelValue="form.credited_account_id"
                                    @update:modelValue="form.credited_account_id = $event"
                                    :options="creditedAccountOptions" placeholder="Select Account"
                                    :error="errors.credited_account_id" />
                            </div>

                            <!-- Initial Deposit -->
                            <div>
                                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Initial Deposit <span class="text-red-600">*</span>
                                </label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-500">{{ currencyCode }}</span>
                                    <input v-model="formattedInitialDeposit" type="text" placeholder="0"
                                        class="w-full py-3 pl-14 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[14px] font-mono font-bold placeholder-gray-400 focus:outline-none focus:border-bg-nfuko-yellow/50 focus:ring-1 focus:ring-bg-nfuko-yellow/30 transition-all" />
                                </div>
                                <p v-if="errors.initial_deposit" class="mt-1 text-[11px] text-red-600">{{ errors.initial_deposit }}</p>
                            </div>
                        </template>

                        <!-- Fields for existing account -->
                        <template v-else>
                            <div class="rounded-xl bg-gray-100 border border-gray-200 p-4">
                                <p class="text-[12px] text-gray-500 leading-relaxed">
                                    <span class="font-bold text-gray-900">Note:</span>
                                    Opening reserves will be debited automatically with the opening balance as it is assumed this money is already in any of the asset accounts e.g Cash, Bank, mobile money etc
                                </p>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Opening balance <span class="text-red-600">*</span>
                                </label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-500">{{ currencyCode }}</span>
                                    <input v-model="formattedOpeningBalance" type="text" placeholder="0"
                                        class="w-full py-3 pl-14 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-[14px] font-mono font-bold placeholder-gray-400 focus:outline-none focus:border-bg-nfuko-yellow/50 focus:ring-1 focus:ring-bg-nfuko-yellow/30 transition-all" />
                                </div>
                                <p v-if="errors.initial_deposit" class="mt-1 text-[11px] text-red-600">{{ errors.initial_deposit }}</p>
                            </div>
                        </template>

                        <!-- Min Balance -->
                        <div>
                            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Consider account type minimum balance</label>
                            <SearchableSelect :modelValue="minBalanceValue"
                                @update:modelValue="form.consider_min_balance = $event === 'yes'"
                                :options="minBalanceOptions" placeholder="Please select one" />
                        </div>
                    </form>

                    <!-- Footer -->
                    <div class="p-5 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button @click="open = false" type="button"
                            class="px-5 py-2.5 rounded-lg text-[12px] font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-all">
                            Close
                        </button>
                        <button @click="submit" :disabled="processing"
                            class="px-5 py-2.5 rounded-lg text-[12px] font-bold bg-bg-nfuko-yellow text-white hover:bg-[#b8973e] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            <div v-if="processing" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                            Save changes
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<style scoped>
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.25s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-slide-leave-active { transition: transform 0.2s ease-in; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }
</style>
