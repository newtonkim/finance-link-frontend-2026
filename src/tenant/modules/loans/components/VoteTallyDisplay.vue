<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, XCircle as XCircleIcon, CircleDot, Users, Target } from 'lucide-vue-next'

interface VoteTally {
    total_cast: number
    quorum_required: number
    approval_threshold: number
    outcome_counts: {
        approve: number
        decline: number
        abstained: number
    }
}

const props = defineProps<{
    tally: VoteTally
    unanimityRequired?: boolean
}>()

const quorumProgress = computed(() => {
    if (!props.tally.quorum_required) return 0
    return Math.min(100, (props.tally.total_cast / props.tally.quorum_required) * 100)
})

const approvalProgress = computed(() => {
    if (!props.tally.approval_threshold) return 0
    return Math.min(100, (props.tally.outcome_counts.approve / props.tally.approval_threshold) * 100)
})

const quorumMet = computed(() => props.tally.total_cast >= props.tally.quorum_required)
const approvalMet = computed(() => props.tally.outcome_counts.approve >= props.tally.approval_threshold)
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Vote Tally</h3>
            <div v-if="unanimityRequired" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Unanimity Required
            </div>
        </div>

        <!-- Vote counts -->
        <div class="mb-5 grid grid-cols-3 gap-3">
            <div class="flex flex-col items-center rounded-xl bg-green-50/50 p-3 dark:bg-green-900/10">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                    <CheckCircle2 class="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span class="mt-1.5 text-lg font-bold text-green-700 dark:text-green-400">{{ tally.outcome_counts.approve }}</span>
                <span class="text-[10px] font-medium text-green-600 dark:text-green-500">Approve</span>
            </div>
            <div class="flex flex-col items-center rounded-xl bg-red-50/50 p-3 dark:bg-red-900/10">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                    <XCircleIcon class="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span class="mt-1.5 text-lg font-bold text-red-700 dark:text-red-400">{{ tally.outcome_counts.decline }}</span>
                <span class="text-[10px] font-medium text-red-600 dark:text-red-500">Decline</span>
            </div>
            <div class="flex flex-col items-center rounded-xl bg-neutral-50/50 p-3 dark:bg-neutral-800/30">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <CircleDot class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                </div>
                <span class="mt-1.5 text-lg font-bold text-neutral-700 dark:text-neutral-300">{{ tally.outcome_counts.abstained }}</span>
                <span class="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">Abstained</span>
            </div>
        </div>

        <!-- Quorum progress -->
        <div class="mb-4">
            <div class="mb-1.5 flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                    <Users class="h-3.5 w-3.5 text-neutral-400" />
                    <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Quorum</span>
                </div>
                <span class="text-xs font-medium" :class="quorumMet ? 'text-green-600 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'">
                    {{ tally.total_cast }} / {{ tally.quorum_required }}
                </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div class="h-full rounded-full transition-all duration-300"
                    :class="quorumMet ? 'bg-green-500' : 'bg-blue-500'"
                    :style="{ width: `${quorumProgress}%` }" />
            </div>
        </div>

        <!-- Approval threshold progress -->
        <div>
            <div class="mb-1.5 flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                    <Target class="h-3.5 w-3.5 text-neutral-400" />
                    <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Approval Threshold</span>
                </div>
                <span class="text-xs font-medium" :class="approvalMet ? 'text-green-600 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'">
                    {{ tally.outcome_counts.approve }} / {{ tally.approval_threshold }}
                </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div class="h-full rounded-full transition-all duration-300"
                    :class="approvalMet ? 'bg-green-500' : 'bg-emerald-500'"
                    :style="{ width: `${approvalProgress}%` }" />
            </div>
        </div>
    </div>
</template>
