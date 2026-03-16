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
            <template #kyc-member-onboarding="{ card }">
                <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">Setup
                    KYC →</button>

                <Sheet v-model:open="isDrawerOpen">
                    <SheetTrigger as-child>
                        <button class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
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

                            <!-- ── Approval Policy ── -->
                            <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                                <div class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                    <ShieldCheck class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    <span class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                        Approval Policy
                                    </span>
                                </div>
                                <div class="p-4 space-y-3">
                                    <div class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                        <div>
                                            <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                                                Require approval before member becomes active
                                            </p>
                                            <p class="text-[11px] text-neutral-400 mt-0.5">
                                                Newly registered members are placed in <strong class="text-neutral-600 dark:text-neutral-300">Pending</strong> status until approved by staff
                                            </p>
                                        </div>
                                        <button
                                            @click="tempRequireMemberApproval = !tempRequireMemberApproval"
                                            :class="[
                                                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300 ml-4',
                                                tempRequireMemberApproval ? ' bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
                                            ]">
                                            <span :class="[
                                                'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                tempRequireMemberApproval ? 'translate-x-4' : 'translate-x-0.5'
                                            ]" />
                                        </button>
                                    </div>

                                    <div v-if="tempRequireMemberApproval"
                                        class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                        <AlertCircle class="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>
                                            Members will be registered as <strong>Pending</strong>. They cannot deposit, withdraw, or apply for loans until a staff member approves them from their profile page.
                                        </span>
                                    </div>

                                    <div v-else
                                        class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
                                        <ShieldCheck class="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>
                                            Members are automatically set to <strong>Active</strong> on registration and can transact immediately.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- ── Savings Account Generation ── -->
                            <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                                <div class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                    <Wallet class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    <span class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                        Savings Account
                                    </span>
                                </div>
                                <div class="p-4 space-y-3">
                                    <div class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                        <div>
                                            <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                                                Auto-generate savings account on onboarding
                                            </p>
                                            <p class="text-[11px] text-neutral-400 mt-0.5">
                                                Automatically create a savings account when a new member is registered
                                            </p>
                                        </div>
                                        <button
                                            @click="tempAutoCreateSavingsAccount = !tempAutoCreateSavingsAccount"
                                            :class="[
                                                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300 ml-4',
                                                tempAutoCreateSavingsAccount ? ' bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
                                            ]">
                                            <span :class="[
                                                'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                tempAutoCreateSavingsAccount ? 'translate-x-4' : 'translate-x-0.5'
                                            ]" />
                                        </button>
                                    </div>

                                    <div v-if="!tempAutoCreateSavingsAccount"
                                        class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                        <AlertCircle class="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>
                                            Savings accounts will <strong>not</strong> be auto-created. Staff must manually add a savings account
                                            after registering the member via the member's profile page.
                                        </span>
                                    </div>

                                    <div v-else
                                        class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
                                        <Wallet class="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>
                                            A savings account using the <strong>General Savings Account</strong> product will be
                                            automatically created for every new member on registration.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- ── Loyal Member Criteria ── -->
                            <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                                <div class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                    <Star class="h-4 w-4 text-amber-500" />
                                    <span class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                        Loyal Member Criteria
                                    </span>
                                </div>
                                <div class="p-4 space-y-3">
                                    <p class="text-[12px] text-neutral-500 dark:text-neutral-400">
                                        A member is considered <strong class="text-amber-600 dark:text-amber-400">loyal</strong> when their membership tenure reaches the threshold below. Loyal members can receive reduced or custom monthly fees on savings products.
                                    </p>
                                    <div class="flex items-center justify-between gap-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                        <div>
                                            <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">Minimum tenure (months)</p>
                                            <p class="text-[11px] text-neutral-400 mt-0.5">Members with at least this many months of membership qualify as loyal</p>
                                        </div>
                                        <input
                                            v-model.number="tempLoyalMemberMinTenureMonths"
                                            type="number" min="1" max="120"
                                            class="w-20 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-center font-semibold text-neutral-900 focus:border-nfuko-primary focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                                        />
                                    </div>
                                    <div class="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                        <Star class="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>Currently set to <strong>{{ tempLoyalMemberMinTenureMonths }} month{{ tempLoyalMemberMinTenureMonths === 1 ? '' : 's' }}</strong>. Members who joined more than {{ tempLoyalMemberMinTenureMonths }} months ago will receive loyalty fee adjustments.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- ── Form Field Visibility ── -->
                            <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                                <div class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                    <Users class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    <span class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                        Form Field Visibility
                                    </span>
                                </div>
                                <div class="p-4 space-y-3">
                                    <div
                                        class="flex items-start space-x-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                                        <input
                                            id="hide-deposit"
                                            type="checkbox"
                                            v-model="tempHideInitialDeposit"
                                            class="mt-1 h-4 w-4 rounded border-neutral-300 accent-[ bg-nfuko-primary] cursor-pointer" />
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
                                            class="mt-1 h-4 w-4 rounded border-neutral-300 accent-[ bg-nfuko-primary] cursor-pointer" />
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
                            </div>
                        </div>

                        <SheetFooter
                            class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/20 flex flex-row justify-between gap-3">
                            <SheetClose as-child>
                                <Button variant="outline" class="rounded-xl px-6">
                                    Cancel
                                </Button>
                            </SheetClose>
                            <Button as="button" type="button" @click.stop="handleSave" :disabled="savingOnboarding"
                                class="rounded-xl px-6 bg-[#3ab88a] hover:bg-[#32a87e] text-white shadow-sm gap-2 disabled:opacity-60">
                                <Loader2 v-if="savingOnboarding" class="size-4 animate-spin" />
                                <Save v-else class="size-4" />
                                {{ savingOnboarding ? 'Saving...' : 'Save Changes' }}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
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
