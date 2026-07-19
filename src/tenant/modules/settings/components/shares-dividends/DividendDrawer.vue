<script setup lang="ts">
import { X, Settings2, Users, ChevronDown, Calendar, Percent, TrendingUp, ToggleRight, AlertCircle, Loader2 } from 'lucide-vue-next'

defineProps<{
    show: boolean
    saving: boolean
    form: {
        distribution_account_type: 'shareholders_only' | 'all_accounts'
        distribution_basis: 'proportional' | 'equal'
        frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually'
        distribution_day: number
        distribution_month: number
        dividend_rate: string | number
        minimum_shares: string | number
        minimum_dividend_amount: string | number
        rounding: 'nearest' | 'floor' | 'ceil'
        auto_distribute: boolean
        carry_forward_remainder: boolean
    }
    currencyCode: string
    accountTypeOptions: { value: string; label: string }[]
    frequencyOptions: { value: string; label: string }[]
    basisOptions: { value: string; label: string }[]
    roundingOptions: { value: string; label: string }[]
    months: string[]
    saveSettings: () => void
}>()

const emit = defineEmits(['update:show'])
</script>

<template>
    <Transition name="drawer-fade">
        <div v-if="show" class="fixed inset-0 z-50 flex justify-end">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('update:show', false)" />

            <!-- Panel -->
            <Transition name="drawer-slide">
                <div v-if="show"
                    class="relative flex h-full w-full max-w-[560px] flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">

                    <!-- Header -->
                    <div
                        class="flex items-center justify-between border-b border-neutral-100 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex h-9 w-9 items-center justify-center rounded-xl bg-nfuko-primary/10 dark:bg-bg-nfuko-yellow/10">
                                <Settings2 class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                            </div>
                            <div>
                                <h2 class="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white">
                                    Dividend Configuration</h2>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Shares & Dividends Settings</p>
                            </div>
                        </div>
                        <button @click="emit('update:show', false)"
                            class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <X class="h-4 w-4" />
                        </button>
                    </div>

                    <!-- Scrollable Body -->
                    <div class="flex-1 space-y-5 overflow-y-auto p-6">

                        <!-- ── Section 1: Eligibility ── -->
                        <div class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                            <div
                                class="flex items-center gap-2.5 border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                                <Users class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                <span
                                    class="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Dividend Sharing Settings</span>
                            </div>
                            <div class="p-4 space-y-4">
                                <!-- Account Type -->
                                <div>
                                    <label
                                        class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Eligible Account Type
                                    </label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button v-for="opt in accountTypeOptions" :key="opt.value"
                                            @click="form.distribution_account_type = opt.value as any" :class="[
                                                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all text-left',
                                                form.distribution_account_type === opt.value
                                                    ? 'bg-[#06265a] border-[#06265a] text-white dark:bg-[#06265a] dark:border-[#06265a] dark:text-white'
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
                                        class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Distribution Basis
                                    </label>
                                    <div class="relative">
                                        <select v-model="form.distribution_basis"
                                            class="focus:ring-nfuko-primary dark:focus:ring-bg-nfuko-yellow w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2.5 pl-3 pr-10 text-[13px] text-neutral-700 transition-all focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                            <option v-for="opt in basisOptions" :key="opt.value" :value="opt.value">
                                                {{ opt.label }}
                                            </option>
                                        </select>
                                        <ChevronDown
                                            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ── Section 2: Schedule ── -->
                        <div class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                            <div
                                class="flex items-center gap-2.5 border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                                <Calendar class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                <span
                                    class="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Distribution Schedule</span>
                            </div>
                            <div class="p-4 space-y-4">
                                <!-- Frequency -->
                                <div>
                                    <label
                                        class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Frequency
                                    </label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button v-for="opt in frequencyOptions" :key="opt.value"
                                            @click="form.frequency = opt.value as any" :class="[
                                                'px-3 py-2 rounded-xl border text-[13px] font-medium transition-all',
                                                form.frequency === opt.value
                                                    ? 'bg-[#06265a] shadow border-[#06265a] text-white dark:bg-[#06265a] dark:border-[#06265a] dark:text-white'
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
                                            class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Day of Month
                                        </label>
                                        <input v-model.number="form.distribution_day" type="number" min="1" max="28"
                                            placeholder="e.g. 1"
                                            class="focus:ring-nfuko-primary dark:focus:ring-bg-nfuko-yellow w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[13px] text-neutral-700 transition-all focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200" />
                                    </div>
                                    <div>
                                        <label
                                            class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Month
                                        </label>
                                        <div class="relative">
                                            <select v-model.number="form.distribution_month"
                                                class="focus:ring-nfuko-primary dark:focus:ring-bg-nfuko-yellow w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2.5 pl-3 pr-10 text-[13px] text-neutral-700 transition-all focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                                <option v-for="(m, i) in months" :key="i" :value="i + 1">{{ m }}</option>
                                            </select>
                                            <ChevronDown
                                                class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ── Section 3: Rate & Calculation ── -->
                        <div class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                            <div
                                class="flex items-center gap-2.5 border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                                <Percent class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                <span
                                    class="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Rate & Qualification</span>
                            </div>
                            <div class="p-4 space-y-4">
                                <!-- Dividend Rate -->
                                <div>
                                    <label
                                        class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Dividend Rate (%)
                                    </label>
                                    <div class="relative">
                                        <input v-model="form.dividend_rate" type="number" min="0" max="100"
                                            step="0.01" placeholder="e.g. 12.5"
                                            class="focus:ring-nfuko-primary dark:focus:ring-bg-nfuko-yellow w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-3 pr-10 text-[13px] font-mono font-bold text-neutral-700 transition-all focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200" />
                                        <span
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-neutral-400">%</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <!-- Minimum Shares -->
                                    <div>
                                        <label
                                            class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Min. Shares to Qualify
                                        </label>
                                        <input v-model="form.minimum_shares" type="number" min="0" placeholder="e.g. 1"
                                            class="focus:ring-nfuko-primary dark:focus:ring-bg-nfuko-yellow w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[13px] font-mono text-neutral-700 transition-all focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200" />
                                    </div>

                                    <!-- Minimum Dividend -->
                                    <div>
                                        <label
                                            class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Min. Dividend ({{ currencyCode }})
                                        </label>
                                        <div class="relative">
                                            <span
                                                class="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-neutral-400">{{ currencyCode }}</span>
                                            <input v-model="form.minimum_dividend_amount" type="number" min="0"
                                                placeholder="0"
                                                class="focus:ring-nfuko-primary dark:focus:ring-bg-nfuko-yellow w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-12 pr-3 text-[13px] font-mono text-neutral-700 transition-all focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ── Section 4: Advanced ── -->
                        <div class="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
                            <div
                                class="flex items-center gap-2.5 border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                                <TrendingUp class="h-4 w-4 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                                <span
                                    class="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Advanced Settings</span>
                            </div>
                            <div class="p-4 space-y-4">
                                <!-- Rounding -->
                                <div>
                                    <label
                                        class="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Rounding Method
                                    </label>
                                    <div class="relative">
                                        <select v-model="form.rounding"
                                            class="focus:ring-nfuko-primary dark:focus:ring-bg-nfuko-yellow w-full appearance-none rounded-xl border border-neutral-200 bg-white py-2.5 pl-3 pr-10 text-[13px] text-neutral-700 transition-all focus:outline-none focus:ring-1 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                            <option v-for="opt in roundingOptions" :key="opt.value" :value="opt.value">
                                                {{ opt.label }}
                                            </option>
                                        </select>
                                        <ChevronDown
                                            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    </div>
                                </div>

                                <!-- Toggles -->
                                <div class="space-y-3">
                                    <!-- Auto Distribute -->
                                    <div
                                        class="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                                        <div class="flex items-center gap-3">
                                            <ToggleRight class="h-4 w-4 shrink-0 text-neutral-400" />
                                            <div>
                                                <p class="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
                                                    Auto-distribute</p>
                                                <p class="text-[11px] text-neutral-400">Automatically run distribution on scheduled date</p>
                                            </div>
                                        </div>
                                        <button @click="form.auto_distribute = !form.auto_distribute" :class="[
                                            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
                                            form.auto_distribute ? 'bg-[#06265a] dark:bg-[#06265a]' : 'bg-neutral-200 dark:bg-neutral-700'
                                        ]">
                                            <span :class="[
                                                'inline-flex h-4 w-4 rounded-full bg-white shadow transition-transform duration-300',
                                                form.auto_distribute ? 'translate-x-4' : 'translate-x-0.5'
                                            ]" />
                                        </button>
                                    </div>

                                    <!-- Carry Forward -->
                                    <div
                                        class="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                                        <div class="flex items-center gap-3">
                                            <AlertCircle class="h-4 w-4 shrink-0 text-neutral-400" />
                                            <div>
                                                <p class="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
                                                    Carry forward remainder</p>
                                                <p class="text-[11px] text-neutral-400">Roll unallocated dividend to next period</p>
                                            </div>
                                        </div>
                                        <button @click="form.carry_forward_remainder = !form.carry_forward_remainder"
                                            :class="[
                                                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-300',
                                                form.carry_forward_remainder ? 'bg-[#06265a] dark:bg-[#06265a]' : 'bg-neutral-200 dark:bg-neutral-700'
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
                        class="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <button @click="emit('update:show', false)"
                            class="rounded-xl border border-neutral-200 px-5 py-2.5 text-[13px] font-semibold text-neutral-600 transition-all hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
                            Cancel
                        </button>
                        <button @click="saveSettings" :disabled="saving" :class="[
                            'flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-bold shadow-sm transition-all',
                            saving
                                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed dark:bg-neutral-700'
                                : 'bg-[#06265a] text-white hover:bg-[#06265a]/90 dark:bg-[#06265a] dark:text-white dark:hover:bg-[#06265a]/90'
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
