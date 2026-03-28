<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import type { LoanPenaltyRule } from '../../../apis/loanProducts/loanProductsApi'

defineProps<{
    rule: LoanPenaltyRule
}>()

defineEmits<{
    remove: []
}>()
</script>

<template>
    <div class="grid gap-3 sm:grid-cols-4 items-start rounded-xl border border-neutral-100 dark:border-neutral-800 p-4">

        <!-- Penalty Type -->
        <div>
            <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Type</label>
            <input
                v-model="rule.penalty_type"
                type="text"
                placeholder="e.g. flat"
                class="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
        </div>

        <!-- Penalty Rate -->
        <div>
            <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Rate (%)</label>
            <input
                v-model="rule.penalty_rate"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
        </div>

        <!-- Grace Days -->
        <div>
            <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Grace Days</label>
            <input
                v-model="rule.grace_days"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
        </div>

        <!-- Remove -->
        <div class="flex items-end">
            <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                @click="$emit('remove')"
            >
                <Trash2 class="h-4 w-4 text-red-500" />
            </button>
        </div>

    </div>
</template>
