<script setup lang="ts">
import { CheckCircle2, ThumbsUp } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import VoteTallyDisplay from './VoteTallyDisplay.vue'
import CommitteeVotesList from './CommitteeVotesList.vue'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

const props = defineProps<{
    application: LoanApplication
    voteTally: any
    committeeVotes: any[]
    loadingVotes: boolean
}>()

const emit = defineEmits<{ openVote: [] }>()

const { displayAmount } = useLoanApplicationHelpers()
</script>

<template>
    <div class="space-y-4">
        <!-- Header card -->
        <div class="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 dark:border-violet-800 dark:from-violet-950/30 dark:to-neutral-900">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="mb-1 text-sm font-semibold text-violet-800 dark:text-violet-300">Committee Voting Open</p>
                    <p class="text-xs text-violet-600 dark:text-violet-400">
                        Amount: <strong class="text-violet-800 dark:text-violet-200">{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</strong>
                        · Term: <strong class="text-violet-800 dark:text-violet-200">{{ application.recommended_term }} months</strong>
                    </p>
                </div>
                <div class="shrink-0 rounded-xl bg-violet-100 px-3 py-1.5 text-center dark:bg-violet-900/40">
                    <p class="text-lg font-bold leading-none text-violet-700 dark:text-violet-300">
                        {{ voteTally?.total_cast ?? 0 }}<span class="text-sm font-medium text-violet-400">/{{ application.quorum_required }}</span>
                    </p>
                    <p class="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-500">Votes cast</p>
                </div>
            </div>
        </div>

        <!-- Live tally -->
        <VoteTallyDisplay v-if="voteTally" :tally="voteTally" :unanimity-required="application.unanimity_required ?? undefined" />

        <!-- Vote recorded / cast vote -->
        <div v-if="voteTally?.has_voted"
            class="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
            <CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-500" />
            <div>
                <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Vote recorded</p>
                <p class="text-xs text-emerald-600 dark:text-emerald-500">Your vote has been cast. The outcome will be determined once quorum is reached.</p>
            </div>
        </div>
        <div v-else class="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white p-4 dark:border-violet-900/40 dark:bg-neutral-900">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                <ThumbsUp class="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div class="flex-1">
                <p class="text-sm font-semibold text-neutral-900 dark:text-white">Your vote is pending</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">Cast your vote to contribute to the committee decision.</p>
            </div>
            <button
                class="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                :disabled="loadingVotes"
                @click="emit('openVote')">
                <ThumbsUp class="h-4 w-4" /> Cast Vote
            </button>
        </div>

        <!-- Individual votes -->
        <CommitteeVotesList
            v-if="committeeVotes?.length"
            :votes="committeeVotes"
            :quorum-required="application.quorum_required ?? undefined"
            :approval-threshold="application.approval_threshold ?? undefined"
            :unanimity-required="application.unanimity_required ?? undefined"
        />
    </div>
</template>
