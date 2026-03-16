<template>

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
                                class="w-9 h-9 rounded-xl  bg-nfuko-primary/10 dark:bg-nfuko-yellow/10 flex items-center justify-center">
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
                                                    ? ' bg-nfuko-primary  border-nfuko-primary text-white dark:bg-nfuko-yellow dark:border-bg-nfuko-yellow dark: text-nfuko-primary'
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
                                                    ? ' bg-nfuko-primary  border-nfuko-primary text-white dark:bg-nfuko-yellow dark:border-bg-nfuko-yellow dark: text-nfuko-primary'
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
                                            Min. Dividend (UGX)
                                        </label>
                                        <div class="relative">
                                            <span
                                                class="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-neutral-400">UGX</span>
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
                                            form.auto_distribute ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
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
                                                form.carry_forward_remainder ? ' bg-nfuko-primary dark:bg-nfuko-yellow' : 'bg-neutral-200 dark:bg-neutral-700'
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
                                : ' bg-nfuko-primary hover:bg-[#003030] text-white dark:bg-nfuko-yellow dark:hover:bg-[#b8973e] dark: text-nfuko-primary'
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
<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
    PieChart, X, Users, Calendar, Percent, ChevronDown,
    Settings2, TrendingUp, AlertCircle, ToggleRight, Loader2, Share2, ShieldCheck
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const emit = defineEmits(['update:show','update:form'])
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const drawerOpen = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})
 

 
 
// ── Dividend Drawer ──────────────────────────────────────────────────────────
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

watch(()=>form, (value) => {
    emit('update:form', value)
    
})
const accountTypeOptions = [
    { value: 'shareholders_only', label: 'Share holders only' },
    { value: 'all_accounts', label: 'All sacco accounts' },
]

const frequencyOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semi_annually', label: 'Semi-annually' },
    { value: 'annually', label: 'Annually' },
]

const basisOptions = [
    { value: 'proportional', label: 'Proportional to shares held' },
    { value: 'equal', label: 'Equal distribution' },
]

const roundingOptions = [
    { value: 'nearest', label: 'Round to nearest' },
    { value: 'floor', label: 'Round down (floor)' },
    { value: 'ceil', label: 'Round up (ceiling)' },
]

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

async function handleSave() {
    saving.value = true
    try {
        // await tenantClient.post('/settings/dividend', form)
        await new Promise(resolve => setTimeout(resolve, 700))
        toast.success('Dividend settings saved successfully.')
        drawerOpen.value = false
    } catch {
        toast.error('Failed to save dividend settings.')
    } finally {
        saving.value = false
    }
}

 
 
</script>