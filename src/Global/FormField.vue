<script setup lang="ts">
/**
 * FormField — Reusable label + input wrapper with error display.
 *
 * Usage:
 *   <FormField label="Email" :required="true" :error="form.errors.email">
 *       <input v-model="form.email" ... />
 *   </FormField>
 */
const props = defineProps<{
    label: string;
    required?: boolean;
    error?: string;
    showError?: boolean;
    htmlFor?: string;
}>();
</script>

<template>
    <div>
        <label
            v-if="label"
            :for="htmlFor"
            class="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-200"
        >
            {{ label }}
            <span v-if="required" class="text-red-500">*</span>
        </label>
        <slot />
        <p v-if="error && showError " class="mt-2 px-1 text-xs text-red-500 font-medium">{{ error }}</p>
    </div>
</template>
