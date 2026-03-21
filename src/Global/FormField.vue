<script setup lang="ts">
/**
 * FormField — Reusable label + input wrapper with error display.
 *
 * Usage:
 *   <FormField label="Email" :required="true" :error="form.errors.email">
 *       <input v-model="form.email" ... />
 *   </FormField>
 */
defineProps<{
    label: string;
    required?: boolean;
    error?: string;
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
    </div>
</template>
