<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/Global/ui/sheet';
import { Button } from '@/Global/ui/button';
import { Input } from '@/Global/ui/input';
import { Label } from '@/Global/ui/label';
import { Badge } from '@/Global/ui/badge';
import { X, Check } from 'lucide-vue-next';
import SearchableSelect from '@/Global/SearchableSelect.vue';
import { apiClient } from '@/central/api/client';
import { useCurrencyStore } from '@/stores/currency';

type Charge = {
    id: number;
    type: string;
    charge_type: string;
    amount: string | number;
};

const props = defineProps<{
    open: boolean;
    account?: any;
    members: any[];
    products: any[];
}>();

const emit = defineEmits(['update:open', 'success']);
const currencyStore = useCurrencyStore();
const { currencyCode } = storeToRefs(currencyStore);

const initialState = {
    member_id: '',
    savings_product_id: '',
    account_type: 'voluntary',
    is_new_account: true,
    initial_deposit: 0,
    consider_min_balance: true,
    credited_account_id: '',
    charges: [] as Charge[],
};

const form = reactive({ ...initialState });
const processing = ref(false);
const errors = ref<Record<string, any>>({});

const reset = () => {
    Object.assign(form, {
        member_id: '',
        savings_product_id: '',
        account_type: 'voluntary',
        is_new_account: true,
        initial_deposit: 0,
        consider_min_balance: true,
        credited_account_id: '',
        charges: [],
    });
    errors.value = {};
};

const sourceAccounts = [
    { id: 1, name: 'Main Cash Account' },
    { id: 2, name: 'Bank - Equity' },
    { id: 3, name: 'M-Pesa Till' },
];

const availableCharges = computed<Charge[]>(() => {
    if (!form.savings_product_id) return [];
    const product = props.products.find(
        (p) => String(p.id) === String(form.savings_product_id),
    );
    return product?.charges || [];
});

const selectedProduct = computed(() =>
    props.products.find((p) => String(p.id) === String(form.savings_product_id))
);

const productMinBalance = computed(() => Number(selectedProduct.value?.minimum_balance ?? 0));

const initialDepositError = computed(() => {
    if (!form.savings_product_id || !form.consider_min_balance) return '';
    if (productMinBalance.value > 0 && Number(form.initial_deposit) < productMinBalance.value) {
        return `Must be at least ${currencyCode.value} ${productMinBalance.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return '';
});

watch(
    () => props.open,
    (newVal) => {
        if (newVal) {
            if (props.account) {
                form.member_id = props.account.member_id;
                form.savings_product_id = props.account.savings_product_id;
                form.account_type = props.account.account_type;
                form.is_new_account = props.account.is_new_account;
                form.initial_deposit = props.account.initial_deposit;
                form.consider_min_balance = props.account.consider_min_balance;
                form.charges = props.account.selected_charges || [];
            } else {
                reset();
            }
        }
    },
);

watch(
    () => form.savings_product_id,
    (newVal, oldVal) => {
        if (oldVal && newVal !== oldVal) {
            form.charges = [];
        }
    },
);

const submit = async () => {
    processing.value = true;
    errors.value = {};

    try {
        if (props.account) {
            await apiClient.put(`/savings-accounts/${props.account.id}`, form);
        } else {
            await apiClient.post('/savings-accounts', form);
        }
        emit('update:open', false);
        emit('success');
    } catch (error: any) {
        if (error.response?.status === 422) {
            errors.value = error.response.data.errors || {};
        }
    } finally {
        processing.value = false;
    }
};

const toggleCharge = (charge: Charge) => {
    const index = form.charges.findIndex((c: Charge) => c.id === charge.id);
    if (index > -1) {
        form.charges.splice(index, 1);
    } else {
        form.charges.push(charge);
    }
    showChargeDropdown.value = false;
};

const isChargeSelected = (id: number) => {
    return form.charges.some((c: Charge) => c.id === id);
};

const showChargeDropdown = ref(false);
</script>

<template>
    <Sheet :open="props.open" @update:open="emit('update:open', $event)">
        <SheetContent side="right"
            class="w-full sm:max-w-md p-0 flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800">
            <SheetHeader class="p-6 border-b border-neutral-100 dark:border-neutral-800">
                <SheetTitle class="text-xl font-bold text-neutral-900 dark:text-white">
                    {{ account ? 'Edit Account' : 'Add Account' }}
                </SheetTitle>
            </SheetHeader>

            <div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Member <span
                            class="text-red-500">*</span></Label>
                    <SearchableSelect v-model="form.member_id"
                        :options="members.map(m => ({ id: m.id, name: `${m.name} (${m.member_number})` }))"
                        placeholder="Select Member" :error="errors.member_id" />
                </div>

                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Account Type
                        (Product) <span class="text-red-500">*</span></Label>
                    <SearchableSelect v-model="form.savings_product_id"
                        :options="products.map(p => ({ id: p.id, name: p.name }))" placeholder="General Savings Account"
                        :error="errors.savings_product_id" />
                </div>

                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Is New Account</Label>
                    <select v-model="form.is_new_account"
                        class="flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                        <option :value="true">Yes</option>
                        <option :value="false">No</option>
                    </select>
                </div>

                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Charges (to apply) <span
                            class="text-red-500">*</span></Label>
                    <div class="relative">
                        <div @click="showChargeDropdown = !showChargeDropdown"
                            class="flex min-h-[44px] w-full flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-900 cursor-pointer">
                            <template v-if="form.charges.length > 0">
                                <Badge v-for="charge in form.charges" :key="charge.id" variant="secondary"
                                    class="h-6 flex items-center gap-1 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-none px-2 font-medium capitalize">
                                    {{ charge.type }} - {{ charge.charge_type === 'percentage' ? charge.amount + '%' : charge.amount }}
                                    <X @click.stop="toggleCharge(charge)"
                                        class="h-3 w-3 cursor-pointer hover:text-red-500" />
                                </Badge>
                            </template>
                            <span v-else class="text-neutral-400 self-center">Select charges</span>
                        </div>

                        <div v-if="showChargeDropdown"
                            class="absolute z-50 mt-1 max-h-60 overflow-y-auto w-full rounded-xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                            <template v-if="availableCharges.length > 0">
                                <div v-for="charge in availableCharges" :key="charge.id" @click="toggleCharge(charge)"
                                    class="flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer rounded-lg capitalize">
                                    <span class="dark:text-white">{{ charge.type }} ({{ charge.charge_type === 'percentage' ? charge.amount + '%' : charge.amount }})</span>
                                    <Check v-if="isChargeSelected(charge.id)" class="h-4 w-4 text-emerald-600" />
                                </div>
                            </template>
                            <div v-else class="px-3 py-4 text-center text-sm text-neutral-400">
                                No charges available for this product
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Credited Account <span
                            class="text-red-500">*</span></Label>
                    <SearchableSelect v-model="form.credited_account_id" :options="sourceAccounts"
                        placeholder="Select Account" :error="errors.credited_account_id" />
                </div>

                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Initial deposit <span
                            class="text-red-500">*</span></Label>
                    <Input v-model.number="form.initial_deposit" type="number" placeholder="Initial deposit"
                        :class="['h-11 rounded-xl dark:border-neutral-800', initialDepositError ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-neutral-200 focus:ring-emerald-500/10 focus:border-emerald-500']" />
                    <div v-if="productMinBalance > 0 && form.consider_min_balance"
                        class="text-xs text-amber-600 dark:text-amber-400 px-1 flex items-center gap-1">
                        <span>Minimum balance for this product:</span>
                        <strong>{{ currencyCode }} {{ productMinBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</strong>
                    </div>
                    <p v-if="initialDepositError" class="text-xs text-red-500 font-medium">{{ initialDepositError }}</p>
                    <p v-else-if="errors.initial_deposit" class="text-xs text-red-500">{{ errors.initial_deposit }}</p>
                </div>

                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Consider account type
                        minimum
                        balance</Label>
                    <select v-model="form.consider_min_balance"
                        class="flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                        <option :value="true">Yes</option>
                        <option :value="false">No</option>
                    </select>
                </div>
            </div>

            <SheetFooter
                class="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div class="flex w-full gap-3">
                    <Button variant="outline" @click="emit('update:open', false)"
                        class="flex-1 h-11 font-bold rounded-xl border-neutral-200 dark:border-neutral-800">
                        Close
                    </Button>
                    <Button @click="submit" :disabled="processing"
                        class="flex-1 h-11 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all shadow-emerald-500/20">
                        {{ account ? (processing ? 'Updating...' : 'Update changes') : (processing ? 'Saving...' : 'Save changes') }}
                    </Button>
                </div>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
