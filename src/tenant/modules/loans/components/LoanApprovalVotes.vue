<script setup lang="ts">
import { CheckCircle2, XCircle as XCircleIcon } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { LoanApplicationApproval } from '../../../apis/loans/loanApplicationsApi'

defineProps<{ votes: LoanApplicationApproval[] }>()

const { formatDate } = useLoanApplicationHelpers()
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">Approval Votes</h2>
        <div class="space-y-3">
            <div v-for="vote in votes" :key="vote.id"
                class="flex items-start gap-3 rounded-xl border p-4"
                :class="vote.decision === 'approved'
                    ? 'border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
                    : 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'">
                <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    :class="vote.decision === 'approved' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'">
                    <CheckCircle2 v-if="vote.decision === 'approved'" class="h-4 w-4 text-green-600 dark:text-green-400" />
                    <XCircleIcon v-else class="h-4 w-4 text-red-500 dark:text-red-400" />
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                        <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ vote.approver?.name ?? 'Unknown Approver' }}</p>
                        <span class="text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(vote.decided_at) }}</span>
                    </div>
                    <p v-if="vote.comments" class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{{ vote.comments }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
