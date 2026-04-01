<script setup lang="ts">
import { computed } from 'vue'
import { XCircle as XCircleIcon, Check } from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

const props = defineProps<{ application: LoanApplication }>()

const { statusLabel, formatDate } = useLoanApplicationHelpers()

const workflowSteps = [
    { key: 'draft',        label: 'Draft' },
    { key: 'submitted',    label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'recommended',  label: 'Recommended' },
    { key: 'approved',     label: 'Approved' },
    { key: 'disbursed',    label: 'Disbursed' },
]

const statusOrder: Record<string, number> = {
    draft: 0, submitted: 1,
    under_review: 2, awaiting_documents: 2,
    recommended: 3,
    approved: 4, disbursement_pending: 4,
    disbursed: 5,
}

const isTerminalNegative = computed(() =>
    props.application.status === 'rejected' || props.application.status === 'cancelled'
)

const pipelineSubLabel = computed(() => {
    switch (props.application.status) {
        case 'awaiting_documents':   return 'Awaiting Docs'
        case 'disbursement_pending': return 'Pending Disbursement'
        default: return null
    }
})

function stepStatus(key: string): 'completed' | 'current' | 'pending' {
    const stepIdx = statusOrder[key] ?? 0
    const currIdx = statusOrder[props.application.status ?? ''] ?? 0
    if (stepIdx < currIdx) return 'completed'
    if (stepIdx === currIdx) return 'current'
    return 'pending'
}
</script>

<template>
    <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <!-- Terminal-state banner -->
        <div v-if="isTerminalNegative"
            class="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
            :class="application.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-neutral-100 dark:bg-neutral-800'">
            <XCircleIcon class="h-5 w-5 shrink-0"
                :class="application.status === 'rejected' ? 'text-red-500' : 'text-neutral-400'" />
            <div>
                <p class="text-sm font-semibold"
                    :class="application.status === 'rejected' ? 'text-red-700 dark:text-red-300' : 'text-neutral-700 dark:text-neutral-300'">
                    {{ statusLabel(application.status) }}
                </p>
                <p v-if="application.rejected_at || application.cancelled_at"
                    class="text-xs"
                    :class="application.status === 'rejected' ? 'text-red-500' : 'text-neutral-400'">
                    {{ formatDate(application.rejected_at ?? application.cancelled_at) }}
                </p>
            </div>
        </div>

        <!-- Pipeline steps -->
        <div class="flex items-start overflow-x-auto pb-1">
            <template v-for="(step, idx) in workflowSteps" :key="step.key">
                <div class="flex shrink-0 flex-col items-center gap-1.5" style="min-width:72px">
                    <div class="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                        :class="isTerminalNegative && stepStatus(step.key) === 'current'
                            ? 'bg-neutral-300 dark:bg-neutral-600'
                            : stepStatus(step.key) === 'completed'
                                ? 'bg-emerald-500'
                                : stepStatus(step.key) === 'current'
                                    ? 'bg-nfuko-primary'
                                    : 'bg-neutral-200 dark:bg-neutral-700'">
                        <Check v-if="stepStatus(step.key) === 'completed'" class="h-4 w-4 text-white" />
                        <div v-else-if="stepStatus(step.key) === 'current' && !isTerminalNegative"
                            class="h-2.5 w-2.5 rounded-full bg-white" />
                        <div v-else class="h-2 w-2 rounded-full"
                            :class="stepStatus(step.key) === 'completed' ? 'bg-white' : 'bg-neutral-400 dark:bg-neutral-500'" />
                    </div>
                    <p class="text-center text-xs leading-tight"
                        :class="stepStatus(step.key) === 'current' && !isTerminalNegative
                            ? 'font-semibold text-nfuko-primary dark:text-bg-nfuko-yellow'
                            : stepStatus(step.key) === 'completed'
                                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                : 'text-neutral-400 dark:text-neutral-500'">
                        {{ step.label }}
                    </p>
                    <p v-if="stepStatus(step.key) === 'current' && pipelineSubLabel && !isTerminalNegative"
                        class="text-center text-xs italic text-neutral-400 dark:text-neutral-500">
                        {{ pipelineSubLabel }}
                    </p>
                </div>
                <div v-if="idx < workflowSteps.length - 1"
                    class="mx-1 mt-4 h-px min-w-[1rem] flex-1 transition-colors"
                    :class="stepStatus(workflowSteps[idx + 1]?.key ?? '') !== 'pending'
                        ? 'bg-emerald-400 dark:bg-emerald-600'
                        : 'bg-neutral-200 dark:bg-neutral-700'" />
            </template>
        </div>

        <div v-if="application.submitted_at" class="mt-3 border-t border-neutral-50 pt-3 text-right dark:border-neutral-800">
            <p class="text-xs text-neutral-400 dark:text-neutral-500">Submitted {{ formatDate(application.submitted_at) }}</p>
        </div>
    </div>
</template>
