<template>
    <div
        class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
        <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">System Behaviour</h3>
        <div class="space-y-5">
            <!-- Maintenance Mode -->
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-semibold text-neutral-900 dark:text-white">Maintenance Mode</p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Temporarily restrict member access</p>
                </div>
                <button type="button" @click="maintenance = !maintenance"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
                    :class="maintenance ? 'bg-[#001d22] dark:bg-[#C9A84C]' : 'bg-neutral-200 dark:bg-neutral-700'">
                    <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
                        :class="maintenance ? 'translate-x-6' : 'translate-x-1'" />
                </button>
            </div>
            <div class="border-t border-neutral-100 dark:border-neutral-800" />
            <!-- Debug Logging -->
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-semibold text-neutral-900 dark:text-white">Debug Logging</p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">Log detailed system events</p>
                </div>
                <button type="button" @click="debugLog = !debugLog"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
                    :class="debugLog ? 'bg-[#001d22] dark:bg-[#C9A84C]' : 'bg-neutral-200 dark:bg-neutral-700'">
                    <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300"
                        :class="debugLog ? 'translate-x-6' : 'translate-x-1'" />
                </button>
            </div>
        </div>
    </div>

</template>
<script setup>
import { ref } from 'vue'

const debugLog = ref(false)
</script>