<script setup lang="ts">
import {
    ClipboardCheck, FileSearch, Undo2, XCircle as XCircleIcon,
    ThumbsUp, ThumbsDown, RefreshCw, Banknote,
    UserCheck, Send, Vote,
} from 'lucide-vue-next'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import type { LoanApplication } from '../../../apis/loans/loanApplicationsApi'

defineProps<{
    application: LoanApplication
    takingForReview: boolean
    resumingReview: boolean
    permittedActions?: string[]
    submitDisabled?: boolean
}>()

const emit = defineEmits<{
    takeForReview: []
    openAppraise: []
    openRequestDocs: []
    openReturn: []
    openReject: []
    openApprove: []
    openDecline: []
    openDisburse: []
    openBMRecommend: []
    openBMReturnForCorrection: []
    openVote: []
}>()

const { displayAmount } = useLoanApplicationHelpers()
</script>

<template>
    <!-- Submitted: take for review -->
    <div v-if="application.status === 'submitted'"
        class="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-900/10">
        <p class="mb-1 text-sm font-semibold text-blue-800 dark:text-blue-300">Ready for Review</p>
        <p class="mb-4 text-xs text-blue-600 dark:text-blue-400">This application has been submitted and is awaiting an officer to submit it for review.</p>
        <button :disabled="takingForReview || submitDisabled"
            class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            @click="emit('takeForReview')">
            <ClipboardCheck class="h-4 w-4" />
            {{ takingForReview ? 'Submitting…' : 'Submit for Review' }}
        </button>
    </div>

    <!-- Under review: appraisal actions -->
    <div v-else-if="application.status === 'under_review'"
        class="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-900/10">
        <p class="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-300">Appraisal Actions</p>
        <p class="mb-4 text-xs text-amber-700 dark:text-amber-400">Review the application details, then choose an action.</p>
        <div class="flex flex-wrap gap-2">
            <!-- Requested order: Request Documents → Return for Correction → Appraise & Recommend -->
            <button class="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:bg-transparent dark:text-amber-400 dark:hover:bg-amber-900/20"
                @click="emit('openRequestDocs')">
                <FileSearch class="h-4 w-4" /> Request Documents
            </button>
            <button class="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-50 dark:border-orange-800 dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-900/20"
                @click="emit('openReturn')">
                <Undo2 class="h-4 w-4" /> Return for Correction
            </button>
            <button v-if="permittedActions?.includes('appraise') || permittedActions?.includes('officer_recommend')"
                class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                @click="emit('openAppraise')">
                <ClipboardCheck class="h-4 w-4" /> Appraise & Recommend
            </button>
            <button v-if="permittedActions?.includes('reject_at_appraisal')"
                class="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                @click="emit('openReject')">
                <XCircleIcon class="h-4 w-4" /> Reject
            </button>
        </div>
    </div>

    <!-- Awaiting docs: resume review -->
    <div v-else-if="application.status === 'awaiting_documents'"
        class="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 dark:border-orange-900/40 dark:bg-orange-900/10">
        <p class="mb-1 text-sm font-semibold text-orange-800 dark:text-orange-300">Awaiting Documents</p>
        <p class="mb-4 text-xs text-orange-700 dark:text-orange-400">
            Once the member has provided the required documents, resume the review.
        </p>
        <button :disabled="resumingReview || submitDisabled"
            class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
            @click="emit('takeForReview')">
            <RefreshCw class="h-4 w-4" />
            {{ resumingReview ? 'Resuming…' : 'Resume Review' }}
        </button>
    </div>

    <!-- Officer Recommended: BM actions -->
    <div v-else-if="application.status === 'officer_recommended'"
        class="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-900/40 dark:bg-indigo-900/10">
        <p class="mb-1 text-sm font-semibold text-indigo-800 dark:text-indigo-300">Branch Manager Review</p>
        <p class="mb-4 text-xs text-indigo-600 dark:text-indigo-400">
            Loan Officer has recommended
            <strong>{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</strong>
            for <strong>{{ application.recommended_term }} months</strong>.
            Please review and take action.
        </p>
        <div class="flex flex-wrap gap-2">
            <button class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                @click="emit('openBMRecommend')">
                <UserCheck class="h-4 w-4" /> Recommend to Committee
            </button>
            <button class="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-50 dark:border-orange-800 dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-900/20"
                @click="emit('openBMReturnForCorrection')">
                <Undo2 class="h-4 w-4" /> Return for Correction
            </button>
        </div>
    </div>

    <!-- Returned for Correction: LO can resume -->
    <div v-else-if="application.status === 'returned_for_correction'"
        class="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 dark:border-orange-900/40 dark:bg-orange-900/10">
        <p class="mb-1 text-sm font-semibold text-orange-800 dark:text-orange-300">Returned for Correction</p>
        <p class="mb-4 text-xs text-orange-700 dark:text-orange-400">
            Branch Manager has returned this application for correction.
            <span v-if="application.correction_reason" class="block mt-1 italic">"{{ application.correction_reason }}"</span>
        </p>
        <button :disabled="resumingReview || submitDisabled"
            class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
            @click="emit('takeForReview')">
            <RefreshCw class="h-4 w-4" />
            {{ resumingReview ? 'Resuming…' : 'Resume Review' }}
        </button>
    </div>

    <!-- Committee Voting: vote panel -->
    <div v-else-if="application.status === 'committee_voting'"
        class="rounded-2xl border border-violet-100 bg-violet-50/50 p-5 dark:border-violet-900/40 dark:bg-violet-900/10">
        <p class="mb-1 text-sm font-semibold text-violet-800 dark:text-violet-300">Committee Vote</p>
        <p class="mb-4 text-xs text-violet-600 dark:text-violet-400">
            Recommended <strong>{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</strong>
            for <strong>{{ application.recommended_term }} months</strong>.
            Quorum: {{ application.quorum_required }} votes required, {{ application.approval_threshold }} approvals needed.
        </p>
        <div class="flex gap-2">
            <button class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                @click="emit('openApprove')">
                <ThumbsUp class="h-4 w-4" /> Approve
            </button>
            <button class="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                @click="emit('openDecline')">
                <ThumbsDown class="h-4 w-4" /> Decline
            </button>
        </div>
    </div>

    <!-- Recommended (legacy simple flow): approval panel -->
    <div v-else-if="application.status === 'recommended'"
        class="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 dark:border-purple-900/40 dark:bg-purple-900/10">
        <p class="mb-1 text-sm font-semibold text-purple-800 dark:text-purple-300">Approval Decision</p>
        <p class="mb-4 text-xs text-purple-600 dark:text-purple-400">
            Recommended <strong>{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</strong>
            for <strong>{{ application.recommended_term }} months</strong>. Cast your vote below.
        </p>
        <div class="flex gap-2">
            <button class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                @click="emit('openApprove')">
                <ThumbsUp class="h-4 w-4" /> Approve
            </button>
            <button class="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                @click="emit('openDecline')">
                <ThumbsDown class="h-4 w-4" /> Decline
            </button>
        </div>
    </div>

    <!-- Approved: disbursement -->
    <div v-else-if="application.status === 'approved'"
        class="rounded-2xl border border-green-100 bg-green-50/50 p-5 dark:border-green-900/40 dark:bg-green-900/10">
        <p class="mb-1 text-sm font-semibold text-green-800 dark:text-green-300">Ready for Disbursement</p>
        <p class="mb-4 text-xs text-green-700 dark:text-green-400">
            Approved <strong>{{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}</strong>
            for <strong>{{ application.approved_term }} months</strong>. Process disbursement to create the loan account.
        </p>
        <button class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            @click="emit('openDisburse')">
            <Banknote class="h-4 w-4" /> Process Disbursement
        </button>
    </div>

    <!-- Declined: terminal -->
    <div v-else-if="application.status === 'declined'"
        class="rounded-2xl border border-red-100 bg-red-50/50 p-5 dark:border-red-900/40 dark:bg-red-900/10">
        <p class="mb-1 text-sm font-semibold text-red-800 dark:text-red-300">Declined by Committee</p>
        <p class="mb-4 text-xs text-red-600 dark:text-red-400">
            This application was declined by the credit committee.
        </p>
    </div>
</template>
