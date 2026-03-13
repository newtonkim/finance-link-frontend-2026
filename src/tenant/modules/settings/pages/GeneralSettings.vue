<script setup lang="ts">
import { Settings } from 'lucide-vue-next'
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-background">
        <!-- Header -->
        <div class="flex flex-col gap-1">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <Settings class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">General Settings</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage your SACCO's general configuration
                    </p>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="grid gap-5 lg:grid-cols-2">
            <!-- Organization Info Card -->
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Organization Information</h3>
                <div class="space-y-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Organization
                            Name</label>
                        <input type="text" placeholder="Enter organization name"
                            class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Email
                            Address</label>
                        <input type="email" placeholder="admin@sacco.co.ke"
                            class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Phone
                            Number</label>
                        <input type="tel" placeholder="+254 7XX XXX XXX"
                            class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                </div>
            </div>

            <!-- Address Card -->
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Address & Location</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Physical
                            Address</label>
                        <input type="text" placeholder="Enter physical address"
                            class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">County</label>
                            <input type="text" placeholder="County"
                                class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Postal
                                Code</label>
                            <input type="text" placeholder="00100"
                                class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus: border-nfuko-primary focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Country</label>
                        <input type="text" value="Kenya" disabled
                            class="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
            <button
                class="rounded-xl  bg-nfuko-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#002e35] active:scale-[0.98] dark:bg-bg-nfuko-yellow dark:text-[#0A2318] dark:hover:bg-[#b8973f]">
                Save Changes
            </button>
        </div>
    </div>
</template>
