<script setup lang="ts">
import { ref } from 'vue';
import { Toaster } from 'vue-sonner';
import { SidebarProvider } from '@/Global/ui/sidebar';
import type { AppShellVariant } from '@/types';

type Props = {
    variant?: AppShellVariant;
};

defineProps<Props>();

const isOpen = ref(true);
</script>

<template>
    <div v-if="variant === 'header'" class="flex min-h-screen w-full flex-col">
        <Toaster position="top-right" richColors />
        <slot />
    </div>
    <SidebarProvider v-else :default-open="isOpen">
        <Toaster position="top-right" richColors />
        <slot />
    </SidebarProvider>
</template>
