<script setup lang="ts">
import { CircleDot, Clock, FileText, ThumbsUp } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { TimelineEvent } from '../../../apis/loans/loanApplicationsApi'

defineProps<{
    timeline: TimelineEvent[]
    loading: boolean
}>()

const { formatDateTime, timelineIconClass } = useLoanApplicationHelpers()
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Audit Trail</h3>
        <div v-if="loading" class="py-4 text-center text-xs text-neutral-400">Loading…</div>
        <div v-else-if="!timeline.length" class="py-4 text-center text-xs text-neutral-400">No events yet.</div>
        <ol v-else class="relative space-y-5 border-l border-neutral-200 pl-5 dark:border-neutral-700">
            <li v-for="(event, idx) in timeline" :key="idx" class="relative">
                <div class="absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-neutral-900"
                    :class="timelineIconClass(event.type)">
                    <CircleDot v-if="event.type === 'created'"           class="h-2.5 w-2.5" />
                    <Clock      v-else-if="event.type === 'status_change'"     class="h-2.5 w-2.5" />
                    <FileText   v-else-if="event.type === 'document_uploaded'" class="h-2.5 w-2.5" />
                    <ThumbsUp   v-else-if="event.type === 'approval_vote'"     class="h-2.5 w-2.5" />
                </div>
                <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ formatDateTime(event.timestamp) }}</p>
                <p class="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">{{ event.title }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ event.description }}</p>
                <p v-if="event.actor?.name" class="text-xs text-neutral-400 dark:text-neutral-500">by {{ event.actor.name }}</p>
                <p v-if="event.notes" class="mt-1 text-xs italic text-neutral-400 dark:text-neutral-500">{{ event.notes }}</p>
            </li>
        </ol>
    </div>
</template>
