<script setup lang="ts">
import { X, Share2, ShieldCheck, Percent, AlertCircle, Users, Loader2 } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'

defineProps<{
    show: boolean
    loading: boolean
    saving: boolean
    currencyCode: string
    sharesCompulsory: boolean
    minShares: number
    sharePrice: number | string
    appliesToExisting: boolean
    minInvestment: number
    hideIsShareholderField: boolean
    saveSettings: () => void
}>()

const emit = defineEmits(['update:show', 'update:sharesCompulsory', 'update:minShares', 'update:sharePrice', 'update:appliesToExisting', 'update:hideIsShareholderField'])
</script>

<template>
    <Transition name="drawer-fade">
        <div v-if="show" class="fixed inset-0 z-50 flex justify-end">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('update:show', false)" />
            <Transition name="drawer-slide">
                <div v-if="show"
                    class="relative flex h-full w-full max-w-[200px] flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between border-b border-neutral-100 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex h-9 w-9 items-center justify-center rounded-xl bg-nfuko-primary/10 dark:bg-bg-nfuko-yellow/10">
                                <Share2 class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                            </div>
                            <div>
                                <h2 class="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white">
                                    Share Management Settings</h2>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Shares & Dividends</p>
                            </div>
                        </div>
                        <button @click="emit('update:show', false)"
                            class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <X class="h-4 w-4" />
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="flex-1 space-y-5 overflow-y-auto p-6">

                        <!-- Loading state -->
                        <div v-if="loading" class="flex items-center justify-center py-10">
                            <Loader2 class="h-6 w-6 animate-spin text-neutral-400" />
                        </div>

                        <template v-else>
                            <!-- ── Section 1: Onboarding Rules ── -->
                            <div class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                <div
                                    class="flex items-center gap-2.5 border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                                    <ShieldCheck class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    <span
                                        class="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                        Share Onboarding Rules
                                    </span>
                                </div>
                                <div class="p-4 space-y-4">

                                    <!-- Shares Compulsory toggle -->
                                    <div
                                        class="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                                        <div>
                                            <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                                                Shares compulsory on onboarding</p>
                                            <p class="text-[11px] mt-0.5 text-neutral-400">Every new member must purchase
                                                shares to register</p>
                                        </div>
                                        <button @click="emit('update:sharesCompulsory', !sharesCompulsory)" :class="[
                                            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
                                            sharesCompulsory ? ' bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
                                        ]">
                                            <span :class="[
                                                'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                sharesCompulsory ? 'translate-x-4' : 'translate-x-0.5'
                                            ]" />
                                        </button>
                                    </div>

                                    <!-- Fields revealed when compulsory is ON -->
                                    <template v-if="sharesCompulsory">
                                        <div class="grid grid-cols-2 gap-3">
                                            <!-- Minimum shares -->
                                            <div>
                                                <label
                                                    class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                    Min. Shares Required
                                                </label>
                                                <input :value="minShares" @input="emit('update:minShares', Number(($event.target as HTMLInputElement).value))" type="number" min="1"
                                                    placeholder="e.g. 5"
                                                    class="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[13px] font-mono font-bold text-neutral-700 transition-all focus:outline-none focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:ring-bg-nfuko-yellow" />
                                            </div>
                                            <!-- Share price -->
                                            <div>
                                                <label
                                                    class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                    Share Price ({{ currencyCode }})
                                                </label>
                                                <div class="relative">
                                                    <span
                                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-neutral-400">{{ currencyCode }}</span>
                                                    <input :value="sharePrice" @input="emit('update:sharePrice', Number(($event.target as HTMLInputElement).value))" type="number" min="0"
                                                        step="100" placeholder="0"
                                                        class="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-11 pr-3 text-[13px] font-mono font-bold text-neutral-700 transition-all focus:outline-none focus:ring-1 focus:ring-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:ring-bg-nfuko-yellow" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Minimum investment computed -->
                                        <div
                                            class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                                            <Percent class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                            <div>
                                                <p class="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                                    Minimum Investment to Join</p>
                                                <p class="mt-0.5 font-mono text-[15px] font-black text-emerald-800 dark:text-emerald-300">
                                                    {{ currencyCode }} {{ formatMoneyValue(minInvestment) }}
                                                </p>
                                                <p class="text-[10px] mt-0.5 text-emerald-600/70 dark:text-emerald-400/70">
                                                    {{ minShares }} shares × {{ currencyCode }} {{ formatMoneyValue(Number(sharePrice), 0) }}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Apply to existing members toggle -->
                                        <div
                                            class="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                                            <div>
                                                <p class="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
                                                    Apply to existing members too</p>
                                                <p class="text-[11px] mt-0.5 text-neutral-400">Require shares when
                                                    registering pre-existing members</p>
                                            </div>
                                            <button @click="emit('update:appliesToExisting', !appliesToExisting)" :class="[
                                                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
                                                appliesToExisting ? ' bg-nfuko-primary dark:bg-bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
                                            ]">
                                                <span :class="[
                                                    'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                    appliesToExisting ? 'translate-x-4' : 'translate-x-0.5'
                                                ]" />
                                            </button>
                                        </div>

                                        <!-- Active policy summary -->
                                        <div
                                            class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                                            <AlertCircle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span>
                                                New members must purchase at least
                                                <strong>{{ minShares }} share(s)</strong>
                                                ({{ currencyCode }} {{ formatMoneyValue(minInvestment, 0) }}) to complete registration.
                                                <template v-if="appliesToExisting">This also applies to existing members.</template>
                                            </span>
                                        </div>
                                    </template>
                                </div>
                            </div>

                            <!-- ── Section 2: Member Registration Fields ── -->
                            <div class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                <div
                                    class="flex items-center gap-2.5 border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                                    <Users class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                    <span
                                        class="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                        Member Registration Fields
                                    </span>
                                </div>
                                <div class="p-4 space-y-3">
                                    <p class="text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                                        Control which share-related fields appear on the Register New Member form.
                                    </p>

                                    <div
                                        class="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <input id="hide-is-shareholder" type="checkbox"
                                            :checked="hideIsShareholderField"
                                            @change="emit('update:hideIsShareholderField', ($event.target as HTMLInputElement).checked)"
                                            class="accent-bg-nfuko-primary dark:accent-bg-nfuko-yellow mt-0.5 h-4 w-4 cursor-pointer shrink-0 rounded border-neutral-300" />
                                        <div class="grid gap-1 leading-none">
                                            <label for="hide-is-shareholder"
                                                class="text-[13px] cursor-pointer font-semibold text-neutral-900 dark:text-white">
                                                Hide "Is a shareholder" field
                                            </label>
                                            <p class="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                                                When enabled, the <strong
                                                    class="text-neutral-700 dark:text-neutral-300">"Is a
                                                    shareholder"</strong> dropdown will be hidden when
                                                <strong class="text-neutral-700 dark:text-neutral-300">Existing
                                                    Member</strong> type is selected.
                                            </p>
                                        </div>
                                    </div>

                                    <div v-if="hideIsShareholderField"
                                        class="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
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
                        class="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <button @click="emit('update:show', false)"
                            class="rounded-xl border border-neutral-200 px-5 py-2.5 text-[13px] font-semibold text-neutral-600 transition-all hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
                            Cancel
                        </button>
                        <button @click="saveSettings" :disabled="saving" :class="[
                            'flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-bold shadow-sm transition-all',
                            saving
                                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed dark:bg-neutral-700'
                                : ' bg-nfuko-primary text-white hover:bg-[#003030] dark:bg-bg-nfuko-yellow dark:text-nfuko-primary dark:hover:bg-[#b8973e]'
                        ]">
                            <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" />
                            {{ saving ? 'Saving...' : 'Save Settings' }}
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
