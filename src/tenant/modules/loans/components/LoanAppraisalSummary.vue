<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

defineProps<{ application: LoanApplication }>()

const { displayAmount, riskBadgeClass } = useLoanApplicationHelpers()
</script>

<template>
    <div class="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-purple-900/40 dark:bg-neutral-900">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Appraisal Summary</h2>
            <span v-if="application.risk_rating"
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                :class="riskBadgeClass(application.risk_rating)">
                <ShieldCheck class="h-3 w-3" />
                {{ application.risk_rating }} risk
            </span>
        </div>
        <dl class="grid gap-4 sm:grid-cols-2">
            <div v-if="application.recommended_amount">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Recommended Amount</dt>
                <dd class="mt-1 text-lg font-bold text-purple-700 dark:text-purple-400">{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</dd>
            </div>
            <div v-if="application.recommended_term">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Recommended Term</dt>
                <dd class="mt-1 font-medium text-purple-700 dark:text-purple-400">{{ application.recommended_term }} months</dd>
            </div>
            <div v-if="application.approved_amount">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Approved Amount</dt>
                <dd class="mt-1 text-lg font-bold text-green-700 dark:text-green-400">{{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}</dd>
            </div>
            <div v-if="application.approved_term">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Approved Term</dt>
                <dd class="mt-1 font-medium text-green-700 dark:text-green-400">{{ application.approved_term }} months</dd>
            </div>
            <div v-if="application.recommended_by" class="sm:col-span-2">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Appraised By</dt>
                <dd class="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{{ application.recommended_by.name }}</dd>
            </div>
            <div v-if="application.appraisal_notes" class="sm:col-span-2">
                <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Appraisal Notes</dt>
                <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{{ application.appraisal_notes }}</dd>
            </div>
        </dl>
    </div>
</template>
