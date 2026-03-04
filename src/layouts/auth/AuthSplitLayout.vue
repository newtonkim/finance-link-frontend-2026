<script setup lang="ts">
defineProps<{
    title: string;
    description: string;
}>();
</script>

<template>
    <div class="flex min-h-screen bg-neutral-50">
        <!-- Left Panel: Auth Form -->
        <div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div class="mx-auto w-full max-w-sm lg:w-96">
                <div>
                    <img class="h-10 w-auto" src="/vite.svg" alt="Company Logo" />
                    <h2 class="mt-6 text-3xl font-extrabold text-neutral-900">{{ title }}</h2>
                    <p class="mt-2 text-sm text-neutral-600">{{ description }}</p>
                </div>

                <div class="mt-8">
                    <slot />
                </div>
            </div>
        </div>

        <!-- Right Panel: Decorative/Features -->
        <div class="relative hidden w-0 flex-1 lg:block bg-[#001d22]">
            <slot name="right-panel" />
        </div>
    </div>
</template>
