<script setup lang="ts">
import { ArrowLeft, HandCoins, Pencil, XCircle, RotateCcw } from 'lucide-vue-next'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

defineProps<{
    application: LoanApplication | null
    cancelling: boolean
    reopening: boolean
    editableStatuses: string[]
    cancellableStatuses: string[]
    reopenableStatuses: string[]
}>()

const emit = defineEmits<{
    back: []
    edit: []
    reopen: []
    cancel: []
}>()
</script>

<template>
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
            <button
                class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                @click="emit('back')">
                <ArrowLeft class="h-4 w-4" />
                Back
            </button>
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <HandCoins class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
            </div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    {{ application?.application_no ?? 'Loan Application' }}
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Application details and audit trail.</p>
            </div>
        </div>
        <div v-if="application" class="flex items-center gap-2">
            <button
                v-if="editableStatuses.includes(application.status ?? '')"
                class="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="emit('edit')">
                <Pencil class="h-4 w-4" />
                Edit
            </button>
            <button
                v-if="reopenableStatuses.includes(application.status ?? '')"
                :disabled="reopening"
                class="flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                @click="emit('reopen')">
                <RotateCcw class="h-4 w-4" />
                {{ reopening ? 'Reopening…' : 'Reopen as Draft' }}
            </button>
            <button
                v-if="cancellableStatuses.includes(application.status ?? '')"
                :disabled="cancelling"
                class="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                @click="emit('cancel')">
                <XCircle class="h-4 w-4" />
                Cancel Application
            </button>
        </div>
    </div>
</template>
