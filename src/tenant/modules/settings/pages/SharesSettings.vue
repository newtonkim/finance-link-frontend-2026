<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
    PieChart, X, Users, Calendar, Percent, ChevronDown,
    Settings2, TrendingUp, AlertCircle, ToggleRight, Loader2, Share2, ShieldCheck
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { formatMoneyValue } from '@/Global'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCurrencyStore } from '@/stores/currency'
import { SettingCard } from '@/tenant/components/globals'

const settingsStore = useSettingsStore()
const currencyStore = useCurrencyStore()
const { currencyCode } = storeToRefs(currencyStore)

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
            hide_is_shareholder_field: Boolean(tempHideIsShareholderField.value),
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

    <!-- ═══════════════ MANAGE SHARES DRAWER ═══════════════ -->
    <Transition name="drawer-fade">
        <div v-if="sharesDrawerOpen" class="fixed inset-0 z-50 flex justify-end">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="sharesDrawerOpen = false" />
            <Transition name="drawer-slide">
                <div v-if="sharesDrawerOpen"
                    class="relative w-full max-w-[480px] h-full bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col">

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-9 h-9 rounded-xl  bg-nfuko-primary/10 dark:bg-bg-nfuko-yellow/10 flex items-center justify-center">
                                <Share2 class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                            </div>
                            <div>
                                <h2 class="text-[15px] font-bold text-neutral-900 dark:text-white tracking-tight">
                                    Share Management Settings</h2>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Shares & Dividends</p>
                            </div>
                        </div>
                        <button @click="sharesDrawerOpen = false"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
                            <X class="h-4 w-4" />
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-5">

                        <!-- Loading state -->
                        <div v-if="sharesDrawerLoading" class="flex items-center justify-center py-10">
                            <Loader2 class="h-6 w-6 animate-spin text-neutral-400" />
                        </div>

                        <template v-else>
                            <!-- ── Section 1: Onboarding Rules ── -->
                            <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                                <div
                                    class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                    <ShieldCheck class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    <span
                                        class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                        Share Onboarding Rules
                                    </span>
                                </div>
                                <div class="p-4 space-y-4">

                                    <!-- Shares Compulsory toggle -->
                                    <div
                                        class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                        <div>
                                            <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                                                Shares compulsory on onboarding</p>
                                            <p class="text-[11px] text-neutral-400 mt-0.5">Every new member must purchase
                                                shares to register</p>
                                        </div>
                                        <button @click="tempSharesCompulsory = !tempSharesCompulsory" :class="[
                                            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
                                            tempSharesCompulsory ? ' bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
                                        ]">
                                            <span :class="[
                                                'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                tempSharesCompulsory ? 'translate-x-4' : 'translate-x-0.5'
                                            ]" />
                                        </button>
                                    </div>

                                    <!-- Fields revealed when compulsory is ON -->
                                    <template v-if="tempSharesCompulsory">
                                        <div class="grid grid-cols-2 gap-3">
                                            <!-- Minimum shares -->
                                            <div>
                                                <label
                                                    class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                                    Min. Shares Required
                                                </label>
                                                <input v-model.number="tempMinShares" type="number" min="1"
                                                    placeholder="e.g. 5"
                                                    class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] font-mono font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all" />
                                            </div>
                                            <!-- Share price -->
                                            <div>
                                                <label
                                                    class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                                    Share Price ({{ currencyCode }})
                                                </label>
                                                <div class="relative">
                                                    <span
                                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-neutral-400">{{ currencyCode }}</span>
                                                    <input v-model.number="tempSharePrice" type="number" min="0"
                                                        step="100" placeholder="0"
                                                        class="w-full pl-11 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] font-mono font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Minimum investment computed -->
                                        <div
                                            class="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                                            <Percent class="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <div>
                                                <p class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                                    Minimum Investment to Join</p>
                                                <p class="text-[15px] font-black text-emerald-800 dark:text-emerald-300 font-mono mt-0.5">
                                                    {{ currencyCode }} {{ formatMoneyValue(minInvestment) }}
                                                </p>
                                                <p class="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                                                    {{ tempMinShares }} shares × {{ currencyCode }} {{ formatMoneyValue(Number(tempSharePrice), 0) }}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Apply to existing members toggle -->
                                        <div
                                            class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                            <div>
                                                <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                                                    Apply to existing members too</p>
                                                <p class="text-[11px] text-neutral-400 mt-0.5">Require shares when
                                                    registering pre-existing members</p>
                                            </div>
                                            <button @click="tempAppliesToExisting = !tempAppliesToExisting" :class="[
                                                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
                                                tempAppliesToExisting ? ' bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
                                            ]">
                                                <span :class="[
                                                    'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                    tempAppliesToExisting ? 'translate-x-4' : 'translate-x-0.5'
                                                ]" />
                                            </button>
                                        </div>

                                        <!-- Active policy summary -->
                                        <div
                                            class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                            <AlertCircle class="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                            <span>
                                                New members must purchase at least
                                                <strong>{{ tempMinShares }} share(s)</strong>
                                                ({{ currencyCode }} {{ formatMoneyValue(minInvestment, 0) }}) to complete registration.
                                                <template v-if="tempAppliesToExisting">This also applies to existing members.</template>
                                            </span>
                                        </div>
                                    </template>
                                </div>
                            </div>

                            <!-- ── Section 2: Member Registration Fields ── -->
                            <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                                <div
                                    class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                    <Users class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    <span
                                        class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                        Member Registration Fields
                                    </span>
                                </div>
                                <div class="p-4 space-y-3">
                                    <p class="text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                        Control which share-related fields appear on the Register New Member form.
                                    </p>

                                    <div
                                        class="flex items-start gap-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/50">
                                        <input id="hide-is-shareholder" type="checkbox"
                                            v-model="tempHideIsShareholderField"
                                            class="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-[ bg-nfuko-primary] dark:accent-bg-nfuko-yellow cursor-pointer shrink-0" />
                                        <div class="grid gap-1 leading-none">
                                            <label for="hide-is-shareholder"
                                                class="text-[13px] font-semibold text-neutral-900 dark:text-white cursor-pointer">
                                                Hide "Is a shareholder" field
                                            </label>
                                            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                                When enabled, the <strong
                                                    class="text-neutral-700 dark:text-neutral-300">"Is a
                                                    shareholder"</strong> dropdown will be hidden when
                                                <strong class="text-neutral-700 dark:text-neutral-300">Existing
                                                    Member</strong> type is selected.
                                            </p>
                                        </div>
                                    </div>

                                    <div v-if="tempHideIsShareholderField"
                                        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                                        <AlertCircle class="h-3.5 w-3.5 shrink-0" />
                                        <span>The "Is a shareholder" field will be hidden for existing member
                                            registrations.</span>
                                    </div>
                                </div>
                            </div>
                        </template>

                    </div>

                    <!-- Footer -->
                    <div
                        class="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                        <button @click="sharesDrawerOpen = false"
                            class="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
                            Cancel
                        </button>
                        <button @click="saveSharesSettings" :disabled="sharesDrawerSaving" :class="[
                            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm',
                            sharesDrawerSaving
                                ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
                                : ' bg-nfuko-primary hover:bg-[#003030] text-white dark:bg-bg-nfuko-yellow dark:hover:bg-[#b8973e] dark: text-nfuko-primary'
                        ]">
                            <Loader2 v-if="sharesDrawerSaving" class="h-3.5 w-3.5 animate-spin" />
                            {{ sharesDrawerSaving ? 'Saving...' : 'Save Settings' }}
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>

    <!-- ═══════════════ DIVIDEND DRAWER ═══════════════ -->
    <Transition name="drawer-fade">
        <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="drawerOpen = false" />

            <!-- Panel -->
            <Transition name="drawer-slide">
                <div v-if="drawerOpen"
                    class="relative w-full max-w-[560px] h-full bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col">

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-9 h-9 rounded-xl  bg-nfuko-primary/10 dark:bg-bg-nfuko-yellow/10 flex items-center justify-center">
                                <Settings2 class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                            </div>
                            <div>
                                <h2 class="text-[15px] font-bold text-neutral-900 dark:text-white tracking-tight">
                                    Dividend Configuration</h2>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Shares & Dividends
                                    Settings</p>
                            </div>
                        </div>
                        <button @click="drawerOpen = false"
                            class="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
                            <X class="h-4 w-4" />
                        </button>
                    </div>

                    <!-- Scrollable Body -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-5">

                        <!-- ── Section 1: Eligibility ── -->
                        <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                            <div
                                class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                <Users class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                <span
                                    class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Dividend
                                    Sharing Settings</span>
                            </div>
                            <div class="p-4 space-y-4">
                                <!-- Account Type -->
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                        Eligible Account Type
                                    </label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button v-for="opt in accountTypeOptions" :key="opt.value"
                                            @click="form.distribution_account_type = opt.value as any" :class="[
                                                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all text-left',
                                                form.distribution_account_type === opt.value
                                                    ? ' bg-nfuko-primary  border-nfuko-primary text-white dark:bg-bg-nfuko-yellow dark:border-bg-nfuko-yellow dark: text-nfuko-primary'
                                                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                                            ]">
                                            <span class="flex-1">{{ opt.label }}</span>
                                            <span v-if="form.distribution_account_type === opt.value"
                                                class="text-[10px] font-bold">✓</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Distribution Basis -->
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                        Distribution Basis
                                    </label>
                                    <div class="relative">
                                        <select v-model="form.distribution_basis"
                                            class="w-full appearance-none pl-3 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all">
                                            <option v-for="opt in basisOptions" :key="opt.value" :value="opt.value">
                                                {{ opt.label }}
                                            </option>
                                        </select>
                                        <ChevronDown
                                            class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ── Section 2: Schedule ── -->
                        <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                            <div
                                class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                <Calendar class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                <span
                                    class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Distribution
                                    Schedule</span>
                            </div>
                            <div class="p-4 space-y-4">
                                <!-- Frequency -->
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                        Frequency
                                    </label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button v-for="opt in frequencyOptions" :key="opt.value"
                                            @click="form.frequency = opt.value as any" :class="[
                                                'px-3 py-2 rounded-xl border text-[13px] font-medium transition-all',
                                                form.frequency === opt.value
                                                    ? ' bg-nfuko-primary  border-nfuko-primary text-white dark:bg-bg-nfuko-yellow dark:border-bg-nfuko-yellow dark: text-nfuko-primary'
                                                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                                            ]">
                                            {{ opt.label }}
                                        </button>
                                    </div>
                                </div>

                                <!-- Distribution Date -->
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label
                                            class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                            Day of Month
                                        </label>
                                        <input v-model.number="form.distribution_day" type="number" min="1" max="28"
                                            placeholder="e.g. 1"
                                            class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all" />
                                    </div>
                                    <div>
                                        <label
                                            class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                            Month
                                        </label>
                                        <div class="relative">
                                            <select v-model.number="form.distribution_month"
                                                class="w-full appearance-none pl-3 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all">
                                                <option v-for="(m, i) in months" :key="i" :value="i + 1">{{ m }}
                                                </option>
                                            </select>
                                            <ChevronDown
                                                class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ── Section 3: Rate & Calculation ── -->
                        <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                            <div
                                class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                <Percent class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                <span
                                    class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Rate
                                    & Qualification</span>
                            </div>
                            <div class="p-4 space-y-4">
                                <!-- Dividend Rate -->
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                        Dividend Rate (%)
                                    </label>
                                    <div class="relative">
                                        <input v-model="form.dividend_rate" type="number" min="0" max="100"
                                            step="0.01" placeholder="e.g. 12.5"
                                            class="w-full pl-3 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] font-mono font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all" />
                                        <span
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-neutral-400">%</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <!-- Minimum Shares -->
                                    <div>
                                        <label
                                            class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                            Min. Shares to Qualify
                                        </label>
                                        <input v-model="form.minimum_shares" type="number" min="0" placeholder="e.g. 1"
                                            class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] font-mono text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all" />
                                    </div>

                                    <!-- Minimum Dividend -->
                                    <div>
                                        <label
                                            class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                            Min. Dividend ({{ currencyCode }})
                                        </label>
                                        <div class="relative">
                                            <span
                                                class="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-neutral-400">{{ currencyCode }}</span>
                                            <input v-model="form.minimum_dividend_amount" type="number" min="0"
                                                placeholder="0"
                                                class="w-full pl-12 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] font-mono text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ── Section 4: Advanced ── -->
                        <div class="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                            <div
                                class="flex items-center gap-2.5 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                <TrendingUp class="h-4 w-4  text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                <span
                                    class="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Advanced
                                    Settings</span>
                            </div>
                            <div class="p-4 space-y-4">
                                <!-- Rounding -->
                                <div>
                                    <label
                                        class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                        Rounding Method
                                    </label>
                                    <div class="relative">
                                        <select v-model="form.rounding"
                                            class="w-full appearance-none pl-3 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[ bg-nfuko-primary] dark:focus:ring-bg-nfuko-yellow transition-all">
                                            <option v-for="opt in roundingOptions" :key="opt.value" :value="opt.value">
                                                {{ opt.label }}
                                            </option>
                                        </select>
                                        <ChevronDown
                                            class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                                    </div>
                                </div>

                                <!-- Toggles -->
                                <div class="space-y-3">
                                    <!-- Auto Distribute -->
                                    <div
                                        class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                        <div class="flex items-center gap-3">
                                            <ToggleRight class="h-4 w-4 text-neutral-400 shrink-0" />
                                            <div>
                                                <p class="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
                                                    Auto-distribute</p>
                                                <p class="text-[11px] text-neutral-400">Automatically run distribution on
                                                    scheduled date</p>
                                            </div>
                                        </div>
                                        <button @click="form.auto_distribute = !form.auto_distribute" :class="[
                                            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
                                            form.auto_distribute ? ' bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
                                        ]">
                                            <span :class="[
                                                'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                form.auto_distribute ? 'translate-x-4' : 'translate-x-0.5'
                                            ]" />
                                        </button>
                                    </div>

                                    <!-- Carry Forward -->
                                    <div
                                        class="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                                        <div class="flex items-center gap-3">
                                            <AlertCircle class="h-4 w-4 text-neutral-400 shrink-0" />
                                            <div>
                                                <p class="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
                                                    Carry forward remainder</p>
                                                <p class="text-[11px] text-neutral-400">Roll unallocated dividend to next
                                                    period</p>
                                            </div>
                                        </div>
                                        <button @click="form.carry_forward_remainder = !form.carry_forward_remainder"
                                            :class="[
                                                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
                                                form.carry_forward_remainder ? ' bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
                                            ]">
                                            <span :class="[
                                                'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                form.carry_forward_remainder ? 'translate-x-4' : 'translate-x-0.5'
                                            ]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Footer -->
                    <div
                        class="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                        <button @click="drawerOpen = false"
                            class="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
                            Cancel
                        </button>
                        <button @click="handleSave" :disabled="saving" :class="[
                            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm',
                            saving
                                ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
                                : ' bg-nfuko-primary hover:bg-[#003030] text-white dark:bg-bg-nfuko-yellow dark:hover:bg-[#b8973e] dark: text-nfuko-primary'
                        ]">
                            <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" />
                            {{ saving ? 'Saving...' : 'Update dividend sharing' }}
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
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
