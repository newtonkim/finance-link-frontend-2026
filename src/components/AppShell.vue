<script setup lang="ts">
import { usePage } from '@inertiajs/vue3';
import { watch, onMounted } from 'vue';
import { Toaster, toast } from 'vue-sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppShellVariant } from '@/types';

type Props = {
    variant?: AppShellVariant;
};

defineProps<Props>();

const page = usePage();
const isOpen = page.props.sidebarOpen as boolean;

const triggerFlash = () => {
    const flash = page.props.flash as { success?: string; error?: string };
    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }
};

onMounted(() => {
    setTimeout(triggerFlash, 100);
});

watch(
    () => page.props.flash,
    () => {
        setTimeout(triggerFlash, 50);
    },
    { deep: true }
);
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
