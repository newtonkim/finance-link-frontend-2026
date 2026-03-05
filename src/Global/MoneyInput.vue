<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{
    modelValue: string | number | null;
    placeholder?: string;
    disabled?: boolean;
    class?: string;
}>();

const emit = defineEmits(['update:modelValue']);

// The formatted string shown in the input (e.g. "1,000,000")
const displayValue = ref('');

// Format a number/string to include commas
const formatMoney = (val: string | number | null): string => {
    if (val === null || val === undefined || val === '') return '';
    
    // Remove all non-numeric characters except decimal point
    const numericString = String(val).replace(/[^\d.]/g, '');
    
    // Handle multiple decimal points (keep only the first one)
    const parts = numericString.split('.');
    const wholePart = parts[0] ?? '';
    const decimalPart = parts.length > 1 ? '.' + (parts[1] ?? '').substring(0, 2) : '';
    
    // Add commas to the whole part
    const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return formattedWhole + decimalPart;
};

// Parse formatted string back to a raw number string
const parseMoney = (val: string): string => {
    return val.replace(/,/g, '');
};

const handleInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const rawVal = input.value;
    
    // Calculate cursor position adjustment
    const cursorPosition = input.selectionStart || 0;
    const rawLengthBefore = rawVal.length;

    // Format the value
    const formatted = formatMoney(rawVal);
    displayValue.value = formatted;
    
    // Restore cursor position roughly
    setTimeout(() => {
        const lengthDiff = formatted.length - rawLengthBefore;
        const newCursorPos = Math.max(0, cursorPosition + lengthDiff);
        input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);

    // Emit the clean numeric string to the parent form (or empty string if cleared)
    const cleanVal = parseMoney(formatted);
    emit('update:modelValue', cleanVal);
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
    <div class="relative w-full">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium text-sm">
            UGX
        </span>
        <input
            :value="displayValue"
            @input="handleInput"
            type="text"
            inputmode="decimal"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="[
                'pl-12 w-full rounded-lg border border-neutral-200 bg-white py-2.5 pr-3 text-sm outline-none focus:border-[#001d22] focus:ring-1 focus:ring-[#001d22] dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-[#8ba8a2]',
                props.class
            ]"
        />
    </div>
</template>
