<script setup lang="ts">
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

defineProps<{ application: LoanApplication }>()

const { formatDate } = useLoanApplicationHelpers()
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Key Dates</h3>
        <dl class="grid gap-3 text-sm">
            <div class="flex justify-between gap-2">
                <dt class="text-neutral-500 dark:text-neutral-400">Created</dt>
                <dd class="text-right">
                    <span class="block font-medium text-neutral-900 dark:text-white">{{ formatDate(application.created_at) }}</span>
                    <span v-if="application.created_by?.name" class="text-xs text-neutral-400 dark:text-neutral-500">
                        by {{ application.created_by.name }}
                    </span>
                </dd>
            </div>
            <div v-if="application.submitted_at" class="flex justify-between gap-2">
                <dt class="text-neutral-500 dark:text-neutral-400">Submitted</dt>
                <dd class="font-medium text-neutral-900 dark:text-white">{{ formatDate(application.submitted_at) }}</dd>
            </div>
            <div v-if="application.reviewed_at" class="flex justify-between gap-2">
                <dt class="text-neutral-500 dark:text-neutral-400">Taken for Review</dt>
                <dd class="font-medium text-neutral-900 dark:text-white">{{ formatDate(application.reviewed_at) }}</dd>
            </div>
            <div v-if="application.recommended_at" class="flex justify-between gap-2">
                <dt class="text-neutral-500 dark:text-neutral-400">Recommended</dt>
                <dd class="font-medium text-purple-700 dark:text-purple-400">{{ formatDate(application.recommended_at) }}</dd>
            </div>
            <div v-if="application.approved_at" class="flex justify-between gap-2">
                <dt class="text-neutral-500 dark:text-neutral-400">Approved</dt>
                <dd class="font-medium text-green-700 dark:text-green-400">{{ formatDate(application.approved_at) }}</dd>
            </div>
            <div v-if="application.rejected_at" class="flex justify-between gap-2">
                <dt class="text-neutral-500 dark:text-neutral-400">Rejected</dt>
                <dd class="font-medium text-red-600 dark:text-red-400">{{ formatDate(application.rejected_at) }}</dd>
            </div>
            <div v-if="application.disbursed_at" class="flex justify-between gap-2">
                <dt class="text-neutral-500 dark:text-neutral-400">Disbursed</dt>
                <dd class="font-medium text-emerald-700 dark:text-emerald-400">{{ formatDate(application.disbursed_at) }}</dd>
            </div>
        </dl>
    </div>
</template>
