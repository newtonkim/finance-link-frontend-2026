<script setup lang="ts">
import { Bell } from 'lucide-vue-next'
import { ref } from 'vue'

const emailNotifications = ref(true)
const smsNotifications = ref(false)
const loanAlerts = ref(true)
const depositAlerts = ref(true)
const memberAlerts = ref(false)
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background">
        <!-- Header -->
        <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Bell class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Notifications</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure how you receive alerts and
                        updates</p>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="space-y-5">
            <!-- Channels Card -->
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Notification Channels</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between py-2">
                        <div>
                            <p class="text-sm font-medium text-neutral-900 dark:text-white">Email Notifications</p>
                            <p class="text-xs text-neutral-400">Receive updates via email</p>
                        </div>
                        <button @click="emailNotifications = !emailNotifications"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                            :class="emailNotifications ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'">
                            <span
                                class="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow-sm"
                                :class="emailNotifications ? 'translate-x-6' : 'translate-x-1'" />
                        </button>
                    </div>
                    <div
                        class="flex items-center justify-between py-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                            <p class="text-sm font-medium text-neutral-900 dark:text-white">SMS Notifications</p>
                            <p class="text-xs text-neutral-400">Receive updates via SMS</p>
                        </div>
                        <button @click="smsNotifications = !smsNotifications"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                            :class="smsNotifications ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'">
                            <span
                                class="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow-sm"
                                :class="smsNotifications ? 'translate-x-6' : 'translate-x-1'" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Alert Types Card -->
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Alert Types</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between py-2">
                        <div>
                            <p class="text-sm font-medium text-neutral-900 dark:text-white">Loan Alerts</p>
                            <p class="text-xs text-neutral-400">New applications, approvals & disbursements</p>
                        </div>
                        <button @click="loanAlerts = !loanAlerts"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                            :class="loanAlerts ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'">
                            <span
                                class="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow-sm"
                                :class="loanAlerts ? 'translate-x-6' : 'translate-x-1'" />
                        </button>
                    </div>
                    <div
                        class="flex items-center justify-between py-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                            <p class="text-sm font-medium text-neutral-900 dark:text-white">Deposit Alerts</p>
                            <p class="text-xs text-neutral-400">Deposits, withdrawals & transfers</p>
                        </div>
                        <button @click="depositAlerts = !depositAlerts"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                            :class="depositAlerts ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'">
                            <span
                                class="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow-sm"
                                :class="depositAlerts ? 'translate-x-6' : 'translate-x-1'" />
                        </button>
                    </div>
                    <div
                        class="flex items-center justify-between py-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                            <p class="text-sm font-medium text-neutral-900 dark:text-white">Member Alerts</p>
                            <p class="text-xs text-neutral-400">New registrations & profile updates</p>
                        </div>
                        <button @click="memberAlerts = !memberAlerts"
                            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                            :class="memberAlerts ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'">
                            <span
                                class="inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 shadow-sm"
                                :class="memberAlerts ? 'translate-x-6' : 'translate-x-1'" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
            <button
                class="rounded-xl bg-[#052659] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#052659]/90 active:scale-[0.98] dark:bg-nfuko-yellow dark:text-[#0050D8] dark:hover:bg-[#052659]/90">
                Save Changes
            </button>
        </div>
    </div>
</template>
