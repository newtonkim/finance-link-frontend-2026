<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps<{
    to?: string;
    href?: string;
    class?: string;
    tabindex?: number;
}>();

const classes = computed(() => {
    return `text-sm font-medium hover:underline ${props.class || ''}`;
});
</script>

<template>
    <RouterLink :to="to ?? href ?? '/'" :class="classes" :tabindex="tabindex">
        <slot />
    </RouterLink>
</template>
