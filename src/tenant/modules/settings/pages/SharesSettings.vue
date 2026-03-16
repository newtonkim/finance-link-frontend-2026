<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { SettingCard } from '@/tenant/components/globals'
import ManageShareDrive from '@/tenant/modules/settings/shares dividends/manage-share-drive.vue'
import DividedDrawer from '@/tenant/modules/settings/shares dividends/divided-drawer.vue'

import {
    PieChart, X, Users, Calendar, Percent, ChevronDown,
    Settings2, TrendingUp, AlertCircle, ToggleRight, Loader2, Share2, ShieldCheck
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

// ── Manage Shares Drawer ─────────────────────────────────────────────────────
const sharesDrawerOpen = ref(false)
const sharesDrawerSaving = ref(false)
const sharesDrawerLoading = ref(false)

// Local form state — mirrors backend onboarding settings
const tempHideIsShareholderField = ref(settingsStore.hideIsShareholderField)
const tempSharesCompulsory = ref(false)
const tempMinShares = ref(1)
const tempSharePrice = ref<number | string>(0)
const tempAppliesToExisting = ref(false)

const minInvestment = computed(() =>
    Number(tempMinShares.value) * Number(tempSharePrice.value)
)

async function openSharesDrawer() {
    sharesDrawerOpen.value = true
    sharesDrawerLoading.value = true
    try {
        await settingsStore.fetchOnboardingSettings()
        tempHideIsShareholderField.value = settingsStore.hideIsShareholderField
        tempSharesCompulsory.value = settingsStore.sharesCompulsory
        tempMinShares.value = settingsStore.minSharesOnOnboarding
        tempSharePrice.value = settingsStore.sharePrice
        tempAppliesToExisting.value = settingsStore.sharesCompulsoryAppliesToExisting
    } finally {
        sharesDrawerLoading.value = false
    }
}

async function saveSharesSettings() {
    sharesDrawerSaving.value = true
    try {
        settingsStore.setHideIsShareholderField(tempHideIsShareholderField.value)
        await settingsStore.saveOnboardingSettings({
            shares_compulsory: tempSharesCompulsory.value,
            min_shares_on_onboarding: Number(tempMinShares.value),
            share_price: Number(tempSharePrice.value),
            shares_compulsory_applies_to_existing: tempAppliesToExisting.value,
            auto_create_savings_account: settingsStore.autoCreateSavingsAccount,
            require_member_approval: settingsStore.requireMemberApproval,
        })
        toast.success('Share management settings saved.')
        sharesDrawerOpen.value = false
    } catch {
        toast.error('Failed to save settings. Please try again.')
    } finally {
        sharesDrawerSaving.value = false
    }
}

// ── Dividend Drawer ──────────────────────────────────────────────────────────
const drawerOpen = ref(false)
const saving = ref(false)

const form = reactive({
    // Eligibility
    distribution_account_type: 'shareholders_only' as 'shareholders_only' | 'all_accounts',
    distribution_basis: 'proportional' as 'proportional' | 'equal',

    // Schedule
    frequency: 'annually' as 'monthly' | 'quarterly' | 'semi_annually' | 'annually',
    distribution_day: 1,
    distribution_month: 12,

    // Rate & Calculation
    dividend_rate: '' as string | number,
    minimum_shares: '' as string | number,
    minimum_dividend_amount: '' as string | number,

    // Advanced
    rounding: 'nearest' as 'nearest' | 'floor' | 'ceil',
    auto_distribute: false,
    carry_forward_remainder: true,
})


 

function openDrawer() {
    drawerOpen.value = true
}

const settingsCards = [
    {
        id: "share-management",
        title: "Share Management",
        description: "Manage share products and related account settings.",
        type: "button",
        action: openSharesDrawer
    },
    {
        id: "share-capital",
        title: "Share Capital",
        description: "Manage share capital structure and limits.",
        type: "link",
        // route: { name: "tenant-share-capital" },
        action: "Manage Capital →"
    },
    {
        id: "share-pricing",
        title: "Share Pricing",
        description: "Set and update share prices over time.",
        action: "Configure Pricing →"
    },
    {
        id: "dividends",
        title: "Dividend Distribution",
        description: "Setup rules and schedules for dividend payouts.",
        type: "button",
        action: openDrawer
    }
]
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 bg-[#f8faf9] dark:bg-[#0a0a0a]">

        <!-- Page Header -->
        <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <PieChart class="h-5 w-5  text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Shares & Dividends</h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Configure share capital, pricing, and
                    distributions</p>
            </div>
        </div>


        <SettingCard :settingsCards="settingsCards">
            <template #share-management="{ card }">
                   <button @click="openSharesDrawer"
                    class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
                    Manage Shares →
                </button>
           <ManageShareDrive v-model:show="sharesDrawerOpen"/>
            </template>
            <template #kyc-member-onboarding="{ card }">
            </template>

            <template #dividend-distribution="{ card }">
              <div class="flex flex-wrap gap-3 mb-4">
                    <div
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-[12px] text-neutral-500">
                        <Users class="h-3 w-3" />
                        <span>{{ form.distribution_account_type === 'shareholders_only' ? 'Share holders only' : 'All accounts' }}</span>
                    </div>
                    <div
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-[12px] text-neutral-500">
                        <Calendar class="h-3 w-3" />
                        <span class="capitalize">{{ form.frequency.replace('_', ' ') }}</span>
                    </div>
                    <div v-if="form.dividend_rate"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-[12px] text-neutral-500">
                        <Percent class="h-3 w-3" />
                        <span>{{ form.dividend_rate }}% rate</span>
                    </div>
                </div>

                <button @click="openDrawer"
                    class="text-sm font-medium  text-nfuko-primary dark:text-bg-nfuko-yellow hover:underline">
                    Configure Dividends →
                </button>
                <DividedDrawer v-model:show="drawerOpen" v-model:form="form"/>
            </template>

        </SettingCard>
    </div>

</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
    transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
    opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
    transform: translateX(100%);
}
</style>
