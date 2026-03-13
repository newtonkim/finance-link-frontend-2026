<script setup lang="ts">
import { Bell } from 'lucide-vue-next'
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Bell class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Notifications</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage SMS, email, and push notification
                    settings</p>
            </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">SMS Settings</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure SMS gateway and notification
                    templates.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage SMS
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Email Settings</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup SMTP and manage email templates.
                </p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage Email
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Push Notifications</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Configure mobile push notification
                    services.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Manage Push
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Statement Generation</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define rules for automated statement
                    delivery.</p>
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup Statements
                    →</button>
            </div>
        </div>
    </div>
</template>
