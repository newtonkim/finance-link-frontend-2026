<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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
import { Search, Check, ChevronDown } from 'lucide-vue-next';

interface Charge {
    type: 'deposit' | 'withdraw' | 'transfer';
    minimum_amount: number;
    maximum_amount: number | null;
    charge_type: 'percentage' | 'amount';
    amount: number;
}

const props = defineProps<{
    open: boolean;
    type: 'deposit' | 'withdraw' | 'transfer';
    initialData?: Charge;
}>();

const emit = defineEmits(['update:open', 'save', 'cancel']);

const form = ref<Charge>({
    type: props.type,
    minimum_amount: 0,
    maximum_amount: null,
    charge_type: 'percentage',
    amount: 0,
});

const errorMessage = ref('');

watch(() => props.open, (newVal) => {
    errorMessage.value = '';
    if (newVal) {
        if (props.initialData) {
            form.value = { ...props.initialData };
        } else {
            form.value = {
                type: props.type,
                minimum_amount: 0,
                maximum_amount: null,
                charge_type: 'percentage',
                amount: 0,
            };
        }
    }
});

const handleSave = () => {
    errorMessage.value = '';

    if (form.value.charge_type === 'amount' &&
        form.value.maximum_amount !== null &&
        form.value.amount > form.value.maximum_amount) {
        errorMessage.value = 'Charge amount cannot exceed the maximum amount.';
        return;
    }

    emit('save', { ...form.value });
};

const handleCancel = () => {
    emit('cancel');
    emit('update:open', false);
};

const titleMap = {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    transfer: 'Transfer',
};

// Searchable Select State
const isSelectOpen = ref(false);
const searchQuery = ref('');
const options = [
    { label: 'Use percentage', value: 'percentage' },
    { label: 'Use amount', value: 'amount' },
];

const filteredOptions = computed(() => {
    if (!searchQuery.value) return options;
    return options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const selectOption = (val: 'percentage' | 'amount') => {
    form.value.charge_type = val;
    isSelectOpen.value = false;
    searchQuery.value = '';
};

const selectedLabel = computed(() => {
    return options.find(opt => opt.value === form.value.charge_type)?.label || 'select';
});

// Formatting functions for money
const formatMoney = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === '') return '';
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

const parseMoney = (val: string) => {
    const stripped = val.replace(/[^0-9.]/g, '');
    const parts = stripped.split('.');
    return parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
};

const formattedMinAmount = computed({
    get: () => formatMoney(form.value.minimum_amount),
    set: (val: string) => { form.value.minimum_amount = Number(parseMoney(val)); }
});

const formattedMaxAmount = computed({
    get: () => formatMoney(form.value.maximum_amount),
    set: (val: string) => { form.value.maximum_amount = val ? Number(parseMoney(val)) : null; }
});

const formattedChargeAmount = computed({
    get: () => {
        if (form.value.charge_type === 'percentage') return form.value.amount.toString();
        return formatMoney(form.value.amount);
    },
    set: (val: string) => {
        if (form.value.charge_type === 'percentage') {
            form.value.amount = Number(val.replace(/[^0-9.]/g, ''));
        } else {
            form.value.amount = Number(parseMoney(val));
        }
    }
});
</script>

<template>
    <Sheet :open="open" @update:open="emit('update:open', $event)">
        <SheetContent side="right" class="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader class="p-6 border-b border-neutral-100 dark:border-neutral-800">
                <SheetTitle class="text-xl font-bold text-neutral-900 dark:text-white">
                    Add new {{ titleMap[type] }} charge
                </SheetTitle>
            </SheetHeader>

            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Minimum amount</Label>
                    <Input v-model="formattedMinAmount" type="text"
                        placeholder="Mount should not be less than zero"
                        class="h-11 border-neutral-200 dark:border-neutral-800 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono font-bold" />
                </div>

                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Maximum amount</Label>
                    <Input v-model="formattedMaxAmount" type="text"
                        placeholder="Enter maximum not less than Minimum amount"
                        class="h-11 border-neutral-200 dark:border-neutral-800 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono font-bold" />
                </div>

                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">Is charge an amount or a
                        percentage</Label>

                    <div class="relative">
                        <button type="button" @click="isSelectOpen = !isSelectOpen"
                            class="flex h-11 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:ring-offset-neutral-950 dark:focus:ring-emerald-500">
                            <span :class="!form.charge_type ? 'text-neutral-400' : ''">
                                {{ selectedLabel }}
                            </span>
                            <ChevronDown class="h-4 w-4 text-neutral-500" />
                        </button>

                        <div v-if="isSelectOpen"
                            class="absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                            <div
                                class="relative flex items-center px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                                <Search class="h-4 w-4 text-neutral-400 mr-2" />
                                <input v-model="searchQuery" type="text" placeholder="Search type..."
                                    class="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400 dark:text-white"
                                    @click.stop />
                            </div>
                            <div class="mt-1 max-h-40 overflow-y-auto">
                                <div v-if="filteredOptions.length === 0"
                                    class="px-2 py-4 text-center text-sm text-neutral-500">
                                    No results found.
                                </div>
                                <button v-for="opt in filteredOptions" :key="opt.value" type="button"
                                    @click="selectOption(opt.value as any)"
                                    class="flex w-full items-center px-2 py-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-sm"
                                    :class="form.charge_type === opt.value ? 'bg-neutral-50 dark:bg-neutral-800' : ''">
                                    <Check class="mr-2 h-4 w-4 text-emerald-600"
                                        :class="form.charge_type === opt.value ? 'opacity-100' : 'opacity-0'" />
                                    <span class="dark:text-white">{{ opt.label }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="space-y-2">
                    <Label class="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                        Charge {{ form.charge_type === 'percentage' ? 'Percentage' : 'Amount' }}
                    </Label>
                    <Input v-model="formattedChargeAmount" type="text" placeholder="0"
                        class="h-11 border-neutral-200 dark:border-neutral-800 focus:ring-emerald-500/10 focus:border-emerald-500 font-mono font-bold"
                        :class="errorMessage ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : ''" />
                    <p v-if="errorMessage" class="text-xs text-red-500 mt-1">{{ errorMessage }}</p>
                </div>
            </div>

            <SheetFooter
                class="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div class="flex w-full gap-3">
                    <Button variant="outline" class="flex-1 h-11 font-bold border-neutral-200 dark:border-neutral-800"
                        @click="handleCancel">
                        Close
                    </Button>
                    <Button
                        class="flex-1 h-11 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                        @click="handleSave">
                        Add {{ titleMap[type] }} charge
                    </Button>
                </div>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>
