<script setup lang="ts">
import { AlertTriangle, ArrowDownLeft, Banknote, CircleDot, FileText, RefreshCw, ThumbsUp } from 'lucide-vue-next'
import type { LoanActivityEvent } from '../../../apis/loans/loansApi'
import type { TimelineEvent } from '../../../apis/loans/loanApplicationsApi'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'

type AuditEvent = TimelineEvent | LoanActivityEvent

defineProps<{
    timeline: AuditEvent[]
    loading: boolean
}>()

const { formatDateTime } = useLoanApplicationHelpers()

function activityDotClass(type: string): string {
    switch (type) {
        case 'disbursed':
            return 'bg-emerald-500 border-emerald-200'
        case 'repayment':
            return 'bg-blue-500 border-blue-200'
        case 'penalty_assessed':
            return 'bg-red-500 border-red-200'
        case 'status_change':
            return 'bg-amber-500 border-amber-200'
        case 'created':
            return 'bg-emerald-500 border-emerald-200'
        case 'document_uploaded':
            return 'bg-blue-500 border-blue-200'
        case 'approval_vote':
            return 'bg-purple-500 border-purple-200'
        default:
            return 'bg-neutral-400 border-neutral-200'
    }
}
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Audit Trail</h3>
        <div v-if="loading" class="py-4 text-center text-xs text-neutral-400">Loading…</div>
        <div v-else-if="!timeline.length" class="py-4 text-center text-xs text-neutral-400">No events yet.</div>
        <ol v-else class="relative space-y-5 border-l border-neutral-200 pl-5 dark:border-neutral-700">
            <li v-for="(event, idx) in timeline" :key="idx" class="relative">
                <div class="absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-neutral-900"
                    :class="activityDotClass(event.type)">
                    <Banknote       v-if="event.type === 'disbursed'"            class="h-2.5 w-2.5" />
                    <ArrowDownLeft  v-else-if="event.type === 'repayment'"       class="h-2.5 w-2.5" />
                    <AlertTriangle  v-else-if="event.type === 'penalty_assessed'" class="h-2.5 w-2.5" />
                    <RefreshCw      v-else-if="event.type === 'status_change'"   class="h-2.5 w-2.5" />
                    <CircleDot      v-else-if="event.type === 'created'"         class="h-2.5 w-2.5" />
                    <FileText       v-else-if="event.type === 'document_uploaded'" class="h-2.5 w-2.5" />
                    <ThumbsUp       v-else-if="event.type === 'approval_vote'"   class="h-2.5 w-2.5" />
                    <CircleDot      v-else                                        class="h-2.5 w-2.5" />
                </div>
                <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ formatDateTime(event.timestamp) }}</p>
                <p class="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">{{ event.title }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ event.description }}</p>
                <p v-if="(event as any).actor?.name" class="text-xs text-neutral-400 dark:text-neutral-500">by {{ (event as any).actor.name }}</p>
                <p v-if="(event as any).notes" class="mt-1 text-xs italic text-neutral-400 dark:text-neutral-500">{{ (event as any).notes }}</p>
                <p v-if="(event as any).amount"
                   class="mt-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5"
                   :class="event.type === 'penalty_assessed'
                     ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                     : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'">
                  {{ (event as any).amount }}
                </p>
            </li>
        </ol>
    </div>
</template>
