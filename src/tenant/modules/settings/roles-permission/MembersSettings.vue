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
        action: "Manage Staff →",
        actionClass: "bg-[#06265a] hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90"
    },
    {
        title: "Roles & Permissions",
        description: "Define access levels and functional permissions.",
        type: "link",
        action: "Configure Roles →",
        route: { name: "tenant-settings-members-roles-permission" },
        actionClass: "bg-[#06265a] hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90",
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
        tempHideInitialDeposit.value = Boolean(settingsStore.hideInitialDeposit)
        tempHideOpeningBalance.value = Boolean(settingsStore.hideOpeningBalance)
        await settingsStore.fetchOnboardingSettings()
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
            shares_compulsory: settingsStore.sharesCompulsory,
            min_shares_on_onboarding: settingsStore.minSharesOnOnboarding,
            share_price: settingsStore.sharePrice,
            shares_compulsory_applies_to_existing: settingsStore.sharesCompulsoryAppliesToExisting,
            auto_create_savings_account: tempAutoCreateSavingsAccount.value,
            require_member_approval: tempRequireMemberApproval.value,
            loyal_member_min_tenure_months: tempLoyalMemberMinTenureMonths.value,
        })
        isDrawerOpen.value = false
        nextTick(() => toast.success('Member onboarding settings saved.'))
    } catch {
        toast.error('Failed to save settings.')
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
                    <RouterLink :to="{ name: 'tenant-staff-salaries' }" class="inline-flex w-fit items-center justify-center rounded-xl bg-[#06265a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90">
                        Staff Salaries →
                    </RouterLink>
                    <RouterLink :to="{ name: 'tenant-staff-allowances' }" class="inline-flex w-fit items-center justify-center rounded-xl bg-[#06265a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90">
                        Staff Allowances →
                    </RouterLink>
                    <RouterLink :to="{ name: 'tenant-staff-advances' }" class="inline-flex w-fit items-center justify-center rounded-xl bg-[#06265a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90">
                        Staff Advances →
                    </RouterLink>
                </div>
            </template>
            <template #kyc-member-onboarding>
                <div class="flex flex-col gap-2 items-start">
                    <kycMembersModel />
                </div>
            </template>
        </SettingCard>

    </div>
</template>
