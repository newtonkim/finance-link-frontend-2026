<script setup lang="ts">
/**
 * FormRow — Two-column responsive grid for form field pairs.
 *
 * Usage:
 *   <FormRow>
 *       <FormField ...> ... </FormField>
 *       <FormField ...> ... </FormField>
 *   </FormRow>
 */
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <slot />
    </div>
</template>
