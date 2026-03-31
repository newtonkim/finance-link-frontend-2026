<script setup lang="ts">
import { CheckCircle2, XCircle as XCircleIcon, CircleDot } from 'lucide-vue-next'

interface CommitteeVote {
    staff_id: number
    staff_name: string
    decision: 'approve' | 'decline'
    comment: string | null
    abstained: boolean
    created_at: string
}

const props = defineProps<{
    votes: CommitteeVote[]
    quorumRequired?: number
    approvalThreshold?: number
    unanimityRequired?: boolean
}>()

function formatDate(d: string) {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Committee Votes</h2>
            <div class="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                <span v-if="quorumRequired">Quorum: {{ quorumRequired }}</span>
                <span v-if="approvalThreshold">Threshold: {{ approvalThreshold }}</span>
                <span v-if="unanimityRequired" class="text-amber-600 dark:text-amber-400 font-medium">Unanimity Required</span>
            </div>
        </div>
        <div v-if="!votes.length" class="py-6 text-center text-sm text-neutral-400">No votes cast yet.</div>
        <div v-else class="space-y-3">
            <div v-for="vote in votes" :key="vote.staff_id"
                class="flex items-start gap-3 rounded-xl border p-4"
                :class="vote.abstained
                    ? 'border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-800/10'
                    : vote.decision === 'approve'
                        ? 'border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
                        : 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'">
                <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    :class="vote.abstained
                        ? 'bg-neutral-100 dark:bg-neutral-800'
                        : vote.decision === 'approve'
                            ? 'bg-green-100 dark:bg-green-900/40'
                            : 'bg-red-100 dark:bg-red-900/40'">
                    <CheckCircle2 v-if="!vote.abstained && vote.decision === 'approve'" class="h-4 w-4 text-green-600 dark:text-green-400" />
                    <XCircleIcon v-else-if="!vote.abstained && vote.decision === 'decline'" class="h-4 w-4 text-red-500 dark:text-red-400" />
                    <CircleDot v-else class="h-4 w-4 text-neutral-400" />
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                        <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ vote.staff_name }}</p>
                        <span class="text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(vote.created_at) }}</span>
                    </div>
                    <p v-if="vote.abstained" class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Abstained</p>
                    <p v-if="vote.comment" class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{{ vote.comment }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
