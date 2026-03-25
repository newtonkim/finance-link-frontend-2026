<template>
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
                                class="w-9 h-9 rounded-xl  bg-nfuko-primary/10 dark:bg-nfuko-yellow/10 flex items-center justify-center">
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
                                            tempSharesCompulsory ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
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
                                                    class="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] font-mono font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:focus:ring-bg-nfuko-yellow transition-all" />
                                            </div>
                                            <!-- Share price -->
                                            <div>
                                                <label
                                                    class="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                                    Share Price (UGX)
                                                </label>
                                                <div class="relative">
                                                    <span
                                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-neutral-400">UGX</span>
                                                    <input v-model.number="tempSharePrice" type="number" min="0"
                                                        step="100" placeholder="0"
                                                        class="w-full pl-11 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[13px] font-mono font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-bg-nfuko-primary dark:focus:ring-bg-nfuko-yellow transition-all" />
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
                                                    UGX {{ minInvestment.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                                                </p>
                                                <p class="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                                                    {{ tempMinShares }} shares × UGX {{ Number(tempSharePrice).toLocaleString() }}
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
                                                tempAppliesToExisting ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
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
                                                (UGX {{ minInvestment.toLocaleString() }}) to complete registration.
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
                                            class="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-bg-nfuko-primary dark:accent-bg-nfuko-yellow cursor-pointer shrink-0" />
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
                                : ' bg-nfuko-primary hover:bg-[#003030] text-white dark:bg-nfuko-yellow dark:hover:bg-[#b8973e] dark: text-nfuko-primary'
                        ]">
                            <Loader2 v-if="sharesDrawerSaving" class="h-3.5 w-3.5 animate-spin" />
                            {{ sharesDrawerSaving ? 'Saving...' : 'Save Settings' }}
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Transition>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {  X, Users, Calendar, Percent, 
     AlertCircle, Loader2, Share2, ShieldCheck
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useSettingsStore } from '@/stores/settingsStore'

const settingsStore = useSettingsStore()

// ── Manage Shares Drawer ─────────────────────────────────────────────────────

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show'])

const sharesDrawerOpen = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

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

 
</script>