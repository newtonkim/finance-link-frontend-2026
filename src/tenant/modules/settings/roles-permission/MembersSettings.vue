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
        title: "Membership Tiers",
        description: "Create and manage different levels of membership.",
        type: "button",
        action: "Manage Tiers →"
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
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Members & Roles</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Manage users, permissions, and member
                    onboarding</p>
            </div>
        </div>
        <SettingCard :settingsCards="settingsCards">
            <template #kyc-member-onboarding>
                <div class="flex flex-col gap-2 items-start">
                    <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup KYC →</button>
                    <kycMembersModel />
                </div>
            </template>
        </SettingCard>

    </div>
</template>
