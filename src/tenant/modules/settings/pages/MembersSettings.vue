<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Users, Save } from 'lucide-vue-next'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
    Label,
    Button
} from '@/Global'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from 'vue-sonner'

const settingsStore = useSettingsStore()

const isDrawerOpen = ref(false)
const tempHideInitialDeposit = ref<boolean>(Boolean(settingsStore.hideInitialDeposit))
const tempHideOpeningBalance = ref<boolean>(Boolean(settingsStore.hideOpeningBalance))

// Sync local state when drawer opens
watch(isDrawerOpen, (isOpen) => {
    if (isOpen) {
        tempHideInitialDeposit.value = Boolean(settingsStore.hideInitialDeposit)
        tempHideOpeningBalance.value = Boolean(settingsStore.hideOpeningBalance)
    }
})

function handleSave() {
    settingsStore.setHideInitialDeposit(Boolean(tempHideInitialDeposit.value))
    settingsStore.setHideOpeningBalance(Boolean(tempHideOpeningBalance.value))
    isDrawerOpen.value = false
    nextTick(() => toast.success('Member onboarding settings saved.'))
}
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Users class="h-5 w-5 text-[#001d22] dark:text-[#C9A84C]" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Members & Roles</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage users, permissions, and member
                    onboarding</p>
            </div>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Staff Management</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Add and manage system users and staff.
                </p>
                <RouterLink :to="{ name: 'tenant-settings-staff' }" class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Manage Staff
                    →</RouterLink>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Roles & Permissions</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Define access levels and functional
                    permissions.</p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Configure Roles
                    →</button>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">KYC / Member Onboarding</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup onboarding requirements and KYC
                    documents.</p>
                <div class="flex flex-col gap-2 items-start">
                    <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Setup KYC
                        →</button>

                    <Sheet v-model:open="isDrawerOpen">
                        <SheetTrigger as-child>
                            <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">
                                Member Onboarding →
                            </button>
                        </SheetTrigger>
                        <SheetContent side="right"
                            class="w-[400px] sm:w-[540px] bg-white dark:bg-neutral-950 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col h-full p-0">
                            <div class="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                <SheetHeader>
                                    <SheetTitle>Member Onboarding Settings</SheetTitle>
                                    <SheetDescription>
                                        Configure how new members are onboarded and what information is required.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                <div
                                    class="flex items-start space-x-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                    <input
                                        id="hide-deposit"
                                        type="checkbox"
                                        v-model="tempHideInitialDeposit"
                                        class="mt-1 h-4 w-4 rounded border-neutral-300 accent-[#001d22] cursor-pointer" />
                                    <div class="grid gap-1.5 leading-none">
                                        <Label for="hide-deposit"
                                            class="text-sm font-semibold leading-none text-neutral-900 dark:text-white cursor-pointer">
                                            Hide Initial Deposit Field
                                        </Label>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                            Hides the initial deposit field on the member registration form for both new and existing members.
                                        </p>
                                    </div>
                                </div>

                                <div
                                    class="flex items-start space-x-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                    <input
                                        id="hide-opening-balance"
                                        type="checkbox"
                                        v-model="tempHideOpeningBalance"
                                        class="mt-1 h-4 w-4 rounded border-neutral-300 accent-[#001d22] cursor-pointer" />
                                    <div class="grid gap-1.5 leading-none">
                                        <Label for="hide-opening-balance"
                                            class="text-sm font-semibold leading-none text-neutral-900 dark:text-white cursor-pointer">
                                            Hide Opening Balance Field
                                        </Label>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                            Hides the opening balance field when registering an existing member.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <SheetFooter
                                class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/20 flex flex-row justify-between gap-3">
                                <SheetClose as-child>
                                    <Button variant="outline" class="rounded-xl px-6">
                                        Cancel
                                    </Button>
                                </SheetClose>
                                <Button as="button" type="button" @click.stop="handleSave"
                                    class="rounded-xl px-6 bg-[#3ab88a] hover:bg-[#32a87e] text-white shadow-sm gap-2">
                                    <Save class="size-4" />
                                    Save Changes
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">Membership Tiers</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Create and manage different levels of
                    membership.</p>
                <button class="text-sm font-medium text-[#001d22] dark:text-[#C9A84C] hover:underline">Manage Tiers
                    →</button>
            </div>
        </div>
    </div>
</template>
