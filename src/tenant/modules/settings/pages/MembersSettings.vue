<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Users, Save, Wallet, AlertCircle, Loader2, ShieldCheck, Star } from 'lucide-vue-next'
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
import { SettingCard } from '@/tenant/components/globals'
import { kycMembersModel } from '../components'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from 'vue-sonner'

const settingsStore = useSettingsStore()

const isDrawerOpen = ref(false)
const savingOnboarding = ref(false)

const tempHideInitialDeposit = ref<boolean>(Boolean(settingsStore.hideInitialDeposit))
const tempHideOpeningBalance = ref<boolean>(Boolean(settingsStore.hideOpeningBalance))
const tempAutoCreateSavingsAccount = ref<boolean>(true)
const tempRequireMemberApproval = ref<boolean>(false)
const tempLoyalMemberMinTenureMonths = ref<number>(12)
const settingsCards = [
    {
        title: "Staff Management",
        description: "Add and manage system users and staff.",
        type: "link",
        route: { name: "tenant-settings-staff" },
        action: "Manage Staff →"
    },
    {
        title: "Roles & Permissions",
        description: "Define access levels and functional permissions.",
        type: "link",
        action: "Configure Roles →",
        route: { name: "tenant-settings-members-roles-permission" },
    },
    {
        title: "KYC / Member Onboarding",
        description: "Setup onboarding requirements and KYC documents.",
        type: "onboarding",
    },
    {
        title: "Staff PayRoll",
        description: "Manage staff payroll, compensation, and related settings.",
        type: "button",
        action: "Manage Payroll →"
    }
]

// Sync local state when drawer opens — also fetch backend settings
watch(isDrawerOpen, async (isOpen) => {
    if (isOpen) {
        await settingsStore.fetchOnboardingSettings()
        tempHideInitialDeposit.value = Boolean(settingsStore.hideInitialDeposit)
        tempHideOpeningBalance.value = Boolean(settingsStore.hideOpeningBalance)
        tempAutoCreateSavingsAccount.value = settingsStore.autoCreateSavingsAccount
        tempRequireMemberApproval.value = settingsStore.requireMemberApproval
        tempLoyalMemberMinTenureMonths.value = settingsStore.loyalMemberMinTenureMonths
    }
})

async function handleSave() {
    savingOnboarding.value = true
    try {
        settingsStore.setHideInitialDeposit(Boolean(tempHideInitialDeposit.value))
        settingsStore.setHideOpeningBalance(Boolean(tempHideOpeningBalance.value))
        await settingsStore.saveOnboardingSettings({
            auto_create_savings_account: tempAutoCreateSavingsAccount.value,
            require_member_approval: tempRequireMemberApproval.value,
            loyal_member_min_tenure_months: tempLoyalMemberMinTenureMonths.value,
            hide_initial_deposit_field: Boolean(tempHideInitialDeposit.value),
            hide_opening_balance_field: Boolean(tempHideOpeningBalance.value),
        })
        isDrawerOpen.value = false
        nextTick(() => toast.success('Member onboarding settings saved.'))
    } catch (err: any) {
        const data = err?.response?.data
        const msg = data?.message
            ?? Object.values(data?.errors ?? {}).flat()[0]
            ?? 'Failed to save settings.'
        toast.error(String(msg))
    } finally {
        savingOnboarding.value = false
    }
}
</script>
<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Users class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Members, Staff & Roles</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage users, permissions, and member
                    onboarding</p>
            </div>
        </div>
        <SettingCard :settingsCards="settingsCards">
            <template #staff-payroll>
                <div class="mt-4 flex flex-wrap gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                    <RouterLink :to="{ name: 'tenant-staff-salaries' }" class="inline-flex w-fit items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white">
                        Staff Salaries →
                    </RouterLink>
                    <RouterLink :to="{ name: 'tenant-staff-allowances' }" class="inline-flex w-fit items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white">
                        Staff Allowances →
                    </RouterLink>
                    <RouterLink :to="{ name: 'tenant-staff-advances' }" class="inline-flex w-fit items-center justify-center rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-nfuko-action dark:bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-nfuko-action dark:hover:text-white">
                        Staff Advances →
                    </RouterLink>
                </div>
            </template>
        </SettingCard>
        <div class="grid gap-5 lg:grid-cols-2">
            <div
                class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-4">KYC / Member Onboarding</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Setup onboarding requirements and KYC
                    documents.
                </p>
                <div class="flex flex-col gap-2 items-start">
                    <button
                        class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup
                        KYC →</button>
                    <kycMembersModel />
                </div>
            </div>
        </div>
    </div>
</template>
