<script setup lang="ts">
import { ClipboardList, Clock, FileSearch, FileWarning, Users, ThumbsUp, HandCoins } from 'lucide-vue-next'

defineProps<{
    summary: {
        total_active: number
        submitted: number
        under_review: number
        awaiting_documents: number
        awaiting_guarantors: number
        recommended: number
        approved: number
    }
    activeStatus: string
}>()

const emit = defineEmits<{ filter: [status: string] }>()
</script>

<template>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <button
            class="group flex flex-col gap-1.5 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
            :class="activeStatus === '' ? 'ring-2 ring-nfuko-primary dark:ring-bg-nfuko-yellow' : ''"
            @click="emit('filter', '')"
        >
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">Active</span>
                <ClipboardList class="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
            </div>
            <span class="text-2xl font-bold text-neutral-900 dark:text-white">{{ summary.total_active }}</span>
        </button>

        <button
            class="group flex flex-col gap-1.5 rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm transition-colors hover:border-blue-300 dark:border-blue-900/50 dark:bg-blue-900/20 dark:hover:border-blue-700"
            :class="activeStatus === 'submitted' ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''"
            @click="emit('filter', 'submitted')"
        >
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Submitted</span>
                <Clock class="h-4 w-4 text-blue-400 dark:text-blue-500" />
            </div>
            <span class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ summary.submitted }}</span>
        </button>

        <button
            class="group flex flex-col gap-1.5 rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm transition-colors hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-900/20 dark:hover:border-amber-700"
            :class="activeStatus === 'under_review' ? 'ring-2 ring-amber-500 dark:ring-amber-400' : ''"
            @click="emit('filter', 'under_review')"
        >
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-amber-600 dark:text-amber-400">Under Review</span>
                <FileSearch class="h-4 w-4 text-amber-400 dark:text-amber-500" />
            </div>
            <span class="text-2xl font-bold text-amber-700 dark:text-amber-300">{{ summary.under_review }}</span>
        </button>

        <button
            class="group flex flex-col gap-1.5 rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-sm transition-colors hover:border-orange-300 dark:border-orange-900/50 dark:bg-orange-900/20 dark:hover:border-orange-700"
            :class="activeStatus === 'awaiting_documents' ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''"
            @click="emit('filter', 'awaiting_documents')"
        >
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-orange-600 dark:text-orange-400">Awaiting Docs</span>
                <FileWarning class="h-4 w-4 text-orange-400 dark:text-orange-500" />
            </div>
            <span class="text-2xl font-bold text-orange-700 dark:text-orange-300">{{ summary.awaiting_documents }}</span>
        </button>

        <button
            class="group flex flex-col gap-1.5 rounded-2xl border border-yellow-100 bg-yellow-50 p-4 shadow-sm transition-colors hover:border-yellow-300 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:hover:border-yellow-700"
            :class="activeStatus === 'awaiting_guarantors' ? 'ring-2 ring-yellow-500 dark:ring-yellow-400' : ''"
            @click="emit('filter', 'awaiting_guarantors')"
        >
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-yellow-600 dark:text-yellow-400">Awaiting Guarantors</span>
                <Users class="h-4 w-4 text-yellow-400 dark:text-yellow-500" />
            </div>
            <span class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{{ summary.awaiting_guarantors }}</span>
        </button>

        <button
            class="group flex flex-col gap-1.5 rounded-2xl border border-purple-100 bg-purple-50 p-4 shadow-sm transition-colors hover:border-purple-300 dark:border-purple-900/50 dark:bg-purple-900/20 dark:hover:border-purple-700"
            :class="activeStatus === 'recommended' ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''"
            @click="emit('filter', 'recommended')"
        >
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-purple-600 dark:text-purple-400">Pending Approval</span>
                <ThumbsUp class="h-4 w-4 text-purple-400 dark:text-purple-500" />
            </div>
            <span class="text-2xl font-bold text-purple-700 dark:text-purple-300">{{ summary.recommended }}</span>
        </button>

        <button
            class="group flex flex-col gap-1.5 rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm transition-colors hover:border-green-300 dark:border-green-900/50 dark:bg-green-900/20 dark:hover:border-green-700"
            :class="activeStatus === 'approved' ? 'ring-2 ring-green-500 dark:ring-green-400' : ''"
            @click="emit('filter', 'approved')"
        >
            <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-green-600 dark:text-green-400">Approved</span>
                <HandCoins class="h-4 w-4 text-green-400 dark:text-green-500" />
            </div>
            <span class="text-2xl font-bold text-green-700 dark:text-green-300">{{ summary.approved }}</span>
        </button>
    </div>
</template>
