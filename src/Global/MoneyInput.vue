<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCurrencyStore } from '@/stores/currency';

import { normalizeAmountInput } from './numericHelpers';

const props = defineProps<{
    modelValue?: any;
    placeholder?: any;
    disabled?: boolean;
    class?: any;
}>();

const emit = defineEmits(['update:modelValue']);
const currencyStore = useCurrencyStore();
const { currencyCode } = storeToRefs(currencyStore);

// The formatted string shown in the input (e.g. "1,000,000")
const displayValue = ref<any>('');

// Format a number/string to include commas
const formatMoney = (val: string | number | null): string => {
    if (val === null || val === undefined || val === '') return '';
    
    // Use the robust normalization before formatting
    const normalized = normalizeAmountInput(String(val));
    const n = Number(normalized);
    if (!Number.isFinite(n)) return String(val);

    return n.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

// Parse formatted string back to a raw number string
const parseMoney = (val: string): string => {
    return normalizeAmountInput(val);
};

const handleInput = (event: Event) => {
    const input = event.target as HTMLInputElement;

    // Keep only digits and one decimal point
    let rawVal = input.value.replace(/[^\d.]/g, '');
    const parts = rawVal.split('.');
    if (parts.length > 2) {
        rawVal = parts[0] + '.' + parts.slice(1).join('');
    }

    // Cursor position
    const cursorPosition = input.selectionStart || 0;

    // Split integer & decimal
    const [intPart, decPart] = rawVal.split('.');

    // Format integer part safely
    const formattedInt = intPart
        ? Number(intPart).toLocaleString()
        : '';

    const formatted = decPart !== undefined
        ? `${formattedInt}.${decPart}`
        : formattedInt;

    displayValue.value = formatted;

    // Restore cursor (basic adjustment)
    setTimeout(() => {
        const newPos = Math.min(formatted.length, cursorPosition + (formatted.length - rawVal.length));
        input.setSelectionRange(newPos, newPos);
    });

    // Emit clean numeric value (no commas)
    // console.log( formatted.replace(/,/g, ''));
    console.log(formatted);
    
  
    
    emit('update:modelValue', formatted.replace(/,/g, ''));
    // emit('update:modelValue', cleanVal);

};

// Initialize and watch for external changes (like form.reset())
onMounted(() => {
    displayValue.value = formatMoney(props.modelValue);
});

watch(() => props.modelValue, (newVal) => {
    // Only update if it's different to avoid cursor jumping
    if (parseMoney(displayValue.value) !== String(newVal || '')) {
        displayValue.value = formatMoney(newVal);
    }
});
</script>

<template>
    <div class="relative w-full" :class="props.class">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium text-sm">
            {{ currencyCode }}
        </span>
        <input
            :value="displayValue"
            @change="handleInput"
            type="text"
            class="rounded-xl cursor-pointer  hover:border-nfuko-primary-300 hover:bg-nfuko-primary-50 dark:hover:bg-neutral-800 transition group"
            inputmode="decimal"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="[
                'pl-12 w-full rounded-lg border border-gray-50 bg-white py-2.5 pr-3 text-sm outline-none focus: border-gray-300 focus:ring-1 focus:ring-bg-nfuko-primary dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]',
                props.class
            ]"
        />
    </div>
</template>
