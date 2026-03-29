<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, XCircle, AlertTriangle, Loader2, Info, RefreshCw } from 'lucide-vue-next'
import type { EligibilityResult } from '../../../apis/loans/loanApplicationsApi'

const props = defineProps<{
    result: EligibilityResult | null
    loading: boolean
    /** True when member + product + amount + term are all filled */
    ready: boolean
    error?: string | null
}>()

const emit = defineEmits<{ (e: 'retry'): void }>()

const formattedMax = computed(() => {
    if (props.result?.max_eligible_amount == null) return null
    return Number(props.result.max_eligible_amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
})
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mb-4 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Eligibility Check</h3>
            <!-- Retry button when result exists -->
            <button v-if="result && !loading" @click="emit('retry')"
                class="flex items-center gap-1 text-xs text-neutral-400 hover:text-nfuko-primary transition-colors dark:text-neutral-500 dark:hover:text-bg-nfuko-yellow">
                <RefreshCw class="h-3 w-3" />
                Re-check
            </button>
        </div>

        <!-- Not enough data yet -->
        <div v-if="!ready && !loading && !result"
            class="flex items-center gap-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
            <Info class="h-4 w-4 flex-shrink-0" />
            Fill in member, product, amount and term to run eligibility check.
        </div>

        <!-- Loading -->
        <div v-else-if="loading"
            class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Loader2 class="h-4 w-4 animate-spin" />
            Checking eligibility…
        </div>

        <!-- Ready but no result yet — manual trigger -->
        <div v-else-if="ready && !result"
            class="flex flex-col items-center gap-3 py-2 text-center">
            <p v-if="error" class="text-xs text-red-500 dark:text-red-400">{{ error }}</p>
            <p v-else class="text-xs text-neutral-400 dark:text-neutral-500">
                Click below to check eligibility for this application.
            </p>
            <button
                class="flex items-center gap-1.5 rounded-xl bg-nfuko-primary px-4 py-2 text-xs font-medium text-white transition hover:bg-nfuko-primary/90 dark:bg-bg-nfuko-yellow dark:text-black"
                @click="emit('retry')">
                <RefreshCw class="h-3.5 w-3.5" />
                Run Eligibility Check
            </button>
        </div>

        <!-- Result -->
        <template v-else-if="result">
            <!-- Summary badge -->
            <div class="mb-4 flex items-center justify-between gap-3">
                <span :class="[
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                    result.eligible
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                ]">
                    <CheckCircle v-if="result.eligible" class="h-3.5 w-3.5" />
                    <XCircle v-else class="h-3.5 w-3.5" />
                    {{ result.eligible ? 'Eligible' : 'Not Eligible' }}
                </span>
                <span v-if="formattedMax" class="text-xs text-neutral-500 dark:text-neutral-400">
                    Max eligible: <span class="font-semibold text-neutral-800 dark:text-white">{{ formattedMax }}</span>
                </span>
            </div>

            <!-- Failed checks -->
            <ul v-if="result.failed.length" class="mb-3 space-y-2">
                <li v-for="item in result.failed" :key="item.key"
                    class="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-900/20">
                    <XCircle class="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
                    <div>
                        <p class="text-xs font-medium text-red-700 dark:text-red-400">{{ item.label }}</p>
                        <p v-if="item.reason" class="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">{{ item.reason }}</p>
                    </div>
                </li>
            </ul>

            <!-- Warnings -->
            <ul v-if="result.warnings.length" class="mb-3 space-y-2">
                <li v-for="item in result.warnings" :key="item.key"
                    class="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
                    <AlertTriangle class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                    <div>
                        <p class="text-xs font-medium text-amber-700 dark:text-amber-400">{{ item.label }}</p>
                        <p v-if="item.message" class="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">{{ item.message }}</p>
                    </div>
                </li>
            </ul>

            <!-- Passed checks -->
            <ul v-if="result.passed.length" class="space-y-1.5">
                <li v-for="item in result.passed" :key="item.key"
                    class="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                    <CheckCircle class="h-3.5 w-3.5 flex-shrink-0" />
                    {{ item.label }}
                </li>
            </ul>
        </template>
    </div>
</template>
