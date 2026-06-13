<script setup lang="ts">
import { Toaster } from 'vue-sonner';

defineProps<{
    title: string;
    description: string;
    titleClass?: string;
}>();
</script>

<template>
    <Toaster position="top-right" richColors />
    <div class="flex min-h-screen bg-white">
        <!-- Left Panel: Auth Form -->
        <div class="flex md:w-1/2 w-full flex-col justify-center px-8 py-12 lg:px-20 xl:px-28">
            <div class="mx-auto w-full max-w-md">
                <div>
                    <img class="h-16 w-auto object-contain" src="/images/finance_link_logo_updated.png" alt="Mfuko Plus Logo" />
                    <h2 class="mt-6 text-3xl font-extrabold" :class="titleClass || 'text-[#55a9d1]'">{{ title }}</h2>
                    <p class="mt-2 text-sm text-neutral-600">{{ description }}</p>
                </div>

                <div class="mt-8">
                    <slot />
                </div>
            </div>
        </div>

        <!-- Right Panel: Decorative/Features (exact 50/50 split) -->
        <div class="relative hidden w-1/2 lg:block  bg-nfuko-primary">
            <slot name="right-panel" />
        </div>
    </div>
</template>
