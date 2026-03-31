<script setup lang="ts">
import { ref, computed } from 'vue'
import {
    ArrowLeft, HandCoins, Pencil, XCircle, RotateCcw, AlertTriangle,
    ClipboardCheck, FileSearch, Users, Undo2, ThumbsUp, ThumbsDown,
    ShieldCheck, Clock, FileText, UserCheck, CheckCircle2, XCircle as XCircleIcon,
    CircleDot, RefreshCw, Banknote, CreditCard, Shield, Check, ChevronDown, ChevronUp,
} from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router'
import { useLoanApplicationShow } from '../composables/useLoanApplicationShow'
import { useLoanAppraisalActions } from '../composables/useLoanAppraisalActions'
import { useLoanDisbursement } from '../composables/useLoanDisbursement'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'
import LoanDisbursementDrawer from '../components/LoanDisbursementDrawer.vue'

const router = useRouter()

const {
    loading, cancelling, reopening,
    application,
    timeline, timelineLoading,
    showCancelModal, cancelReason, cancelReasonError,
    openCancelModal, closeCancelModal, confirmCancel,
    reopen, openEdit, loadApplication,
} = useLoanApplicationShow()

const {
    takingForReview, takeForReview,
    resumingReview, resumeReview,
    showAppraiseModal, appraising, appraiseForm, appraiseErrors,
    openAppraiseModal, submitAppraise,
    showRequestDocsModal, requestingDocs, requestDocsNote, requestDocsError,
    openRequestDocsModal, submitRequestDocs,
    showReturnModal, returning, returnReason, returnError,
    openReturnModal, submitReturn,
    showRejectModal, rejecting, rejectReason, rejectError,
    openRejectModal, submitReject,
    showApproveModal, approving, approveComments,
    openApproveModal, submitApprove,
    showDeclineModal, declining, declineReason, declineError,
    openDeclineModal, submitDecline,
} = useLoanAppraisalActions(application, loadApplication)

const {
    showDisburseModal,
    disbursing,
    disburseForm,
    disburseErrors,
    openDisburseModal,
    submitDisburse,
} = useLoanDisbursement(application, loadApplication)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadgeClass(status: string | undefined) {
    switch (status) {
        case 'draft':               return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
        case 'submitted':           return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        case 'under_review':        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        case 'awaiting_documents':  return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'

        case 'recommended':         return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        case 'approved':            return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        case 'disbursement_pending':return 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
        case 'disbursed':           return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        case 'rejected':            return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        case 'cancelled':           return 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
        default:                    return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
    }
}

function statusLabel(status: string | undefined) {
    if (!status) return '—'
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatAmount(v: number | string | null | undefined) {
    if (v == null || v === '') return '—'
    return formatMoneyValue(v)
}

function displayAmount(formatted: string | null | undefined, raw: number | string | null | undefined) {
    return formatted || formatAmount(raw)
}

function formatDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateTime(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function riskBadgeClass(risk: string | null | undefined) {
    switch (risk) {
        case 'low':      return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        case 'medium':   return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        case 'high':     return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        case 'critical': return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        default:         return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
    }
}

function timelineIconClass(type: string) {
    switch (type) {
        case 'created':           return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
        case 'status_change':     return 'bg-blue-50 text-blue-600 dark:bg-blue-900/40'
        case 'document_uploaded': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/40'

        case 'approval_vote':     return 'bg-green-50 text-green-600 dark:bg-green-900/40'
        default:                  return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
    }
}

const editableStatuses          = ['draft']
const cancellableStatuses       = ['draft', 'submitted', 'under_review', 'awaiting_documents']
const reopenableStatuses        = ['cancelled']
const documentEditableStatuses  = ['draft', 'awaiting_documents']

// ─── Workflow pipeline (Gap 4) ────────────────────────────────────────────────
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
    application.value?.status === 'rejected' || application.value?.status === 'cancelled'
)

function pipelineStepStatus(stepKey: string): 'completed' | 'current' | 'pending' {
    const stepIdx = statusOrder[stepKey] ?? 0
    const currIdx = statusOrder[application.value?.status ?? ''] ?? 0
    if (stepIdx < currIdx) return 'completed'
    if (stepIdx === currIdx) return 'current'
    return 'pending'
}

const pipelineSubLabel = computed(() => {
    switch (application.value?.status) {
        case 'awaiting_documents':   return 'Awaiting Docs'

        case 'disbursement_pending': return 'Pending Disbursement'
        default: return null
    }
})

// ─── Schedule expansion (Gap 10) ─────────────────────────────────────────────
const showAllSchedule = ref(false)
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">

        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button
                    class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    @click="router.back()">
                    <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
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
                    class="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    @click="openEdit">
                    <Pencil class="h-4 w-4" />
                    Edit
                </button>
                <button
                    v-if="reopenableStatuses.includes(application.status ?? '')"
                    :disabled="reopening"
                    class="flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    @click="reopen">
                    <RotateCcw class="h-4 w-4" />
                    {{ reopening ? 'Reopening…' : 'Reopen as Draft' }}
                </button>
                <button
                    v-if="cancellableStatuses.includes(application.status ?? '')"
                    :disabled="cancelling"
                    class="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    @click="openCancelModal">
                    <XCircle class="h-4 w-4" />
                    Cancel Application
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">Loading…</div>

        <div v-else-if="application" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

            <!-- ─── Left column ──────────────────────────────────────────────── -->
            <div class="flex flex-col gap-6">

                <!-- ── Workflow pipeline (Gap 4) ── -->
                <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <!-- Terminal-state banner (rejected / cancelled) -->
                    <div v-if="isTerminalNegative"
                        class="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
                        :class="application.status === 'rejected'
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : 'bg-neutral-100 dark:bg-neutral-800'">
                        <XCircleIcon class="h-5 w-5 shrink-0"
                            :class="application.status === 'rejected' ? 'text-red-500' : 'text-neutral-400'" />
                        <div>
                            <p class="text-sm font-semibold"
                                :class="application.status === 'rejected'
                                    ? 'text-red-700 dark:text-red-300'
                                    : 'text-neutral-700 dark:text-neutral-300'">
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
                                    :class="isTerminalNegative && pipelineStepStatus(step.key) === 'current'
                                        ? 'bg-neutral-300 dark:bg-neutral-600'
                                        : pipelineStepStatus(step.key) === 'completed'
                                            ? 'bg-emerald-500'
                                            : pipelineStepStatus(step.key) === 'current'
                                                ? 'bg-nfuko-primary'
                                                : 'bg-neutral-200 dark:bg-neutral-700'">
                                    <Check v-if="pipelineStepStatus(step.key) === 'completed'" class="h-4 w-4 text-white" />
                                    <div v-else-if="pipelineStepStatus(step.key) === 'current' && !isTerminalNegative"
                                        class="h-2.5 w-2.5 rounded-full bg-white" />
                                    <div v-else class="h-2 w-2 rounded-full"
                                        :class="pipelineStepStatus(step.key) === 'completed' ? 'bg-white' : 'bg-neutral-400 dark:bg-neutral-500'" />
                                </div>
                                <p class="text-center text-xs leading-tight"
                                    :class="pipelineStepStatus(step.key) === 'current' && !isTerminalNegative
                                        ? 'font-semibold text-nfuko-primary dark:text-bg-nfuko-yellow'
                                        : pipelineStepStatus(step.key) === 'completed'
                                            ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                            : 'text-neutral-400 dark:text-neutral-500'">
                                    {{ step.label }}
                                </p>
                                <p v-if="pipelineStepStatus(step.key) === 'current' && pipelineSubLabel && !isTerminalNegative"
                                    class="text-center text-xs italic text-neutral-400 dark:text-neutral-500">
                                    {{ pipelineSubLabel }}
                                </p>
                            </div>
                            <div v-if="idx < workflowSteps.length - 1"
                                class="mx-1 mt-4 h-px min-w-[1rem] flex-1 transition-colors"
                                :class="pipelineStepStatus(workflowSteps[idx + 1].key) !== 'pending'
                                    ? 'bg-emerald-400 dark:bg-emerald-600'
                                    : 'bg-neutral-200 dark:bg-neutral-700'" />
                        </template>
                    </div>

                    <div v-if="application.submitted_at" class="mt-3 border-t border-neutral-50 pt-3 text-right dark:border-neutral-800">
                        <p class="text-xs text-neutral-400 dark:text-neutral-500">Submitted {{ formatDate(application.submitted_at) }}</p>
                    </div>
                </div>

                <!-- ── Action panel ── -->
                <!-- Submitted: credit officer picks up the application -->
                <div v-if="application.status === 'submitted'"
                    class="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-900/10">
                    <p class="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-300">Ready for Review</p>
                    <p class="mb-4 text-xs text-blue-600 dark:text-blue-400">This application has been submitted and is awaiting a credit officer to take it for review.</p>
                    <button
                        :disabled="takingForReview"
                        class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                        @click="takeForReview">
                        <ClipboardCheck class="h-4 w-4" />
                        {{ takingForReview ? 'Taking…' : 'Take for Review' }}
                    </button>
                </div>

                <!-- Under review: full appraisal action panel -->
                <div v-else-if="application.status === 'under_review'"
                    class="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-900/10">
                    <p class="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-300">Appraisal Actions</p>
                    <p class="mb-4 text-xs text-amber-700 dark:text-amber-400">Review the application details, then choose an action.</p>
                    <div class="flex flex-wrap gap-2">
                        <button
                            class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                            @click="openAppraiseModal">
                            <ClipboardCheck class="h-4 w-4" />
                            Appraise & Recommend
                        </button>
                        <button
                            class="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors dark:border-amber-800 dark:bg-transparent dark:text-amber-400 dark:hover:bg-amber-900/20"
                            @click="openRequestDocsModal">
                            <FileSearch class="h-4 w-4" />
                            Request Documents
                        </button>
                        <button
                            class="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors dark:border-orange-800 dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-900/20"
                            @click="openReturnModal">
                            <Undo2 class="h-4 w-4" />
                            Return for Correction
                        </button>
                        <button
                            class="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                            @click="openRejectModal">
                            <XCircleIcon class="h-4 w-4" />
                            Reject
                        </button>
                    </div>
                </div>

                <!-- Awaiting documents: resume review once provided -->
                <div v-else-if="application.status === 'awaiting_documents'"
                    class="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 dark:border-orange-900/40 dark:bg-orange-900/10">
                    <p class="mb-1 text-sm font-semibold text-orange-800 dark:text-orange-300">Awaiting Documents</p>
                    <p class="mb-4 text-xs text-orange-700 dark:text-orange-400">
                        Once the member has provided the required documents, resume the review.
                    </p>
                    <button
                        :disabled="resumingReview"
                        class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                        @click="resumeReview">
                        <RefreshCw class="h-4 w-4" />
                        {{ resumingReview ? 'Resuming…' : 'Resume Review' }}
                    </button>
                </div>

                <!-- Recommended: approval panel -->
                <div v-else-if="application.status === 'recommended'"
                    class="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 dark:border-purple-900/40 dark:bg-purple-900/10">
                    <p class="mb-1 text-sm font-semibold text-purple-800 dark:text-purple-300">Approval Decision</p>
                    <p class="mb-4 text-xs text-purple-600 dark:text-purple-400">
                        Recommended
                        <strong>{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</strong>
                        for <strong>{{ application.recommended_term }} months</strong>.
                        Cast your vote below.
                    </p>
                    <div class="flex gap-2">
                        <button
                            class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                            @click="openApproveModal">
                            <ThumbsUp class="h-4 w-4" />
                            Approve
                        </button>
                        <button
                            class="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                            @click="openDeclineModal">
                            <ThumbsDown class="h-4 w-4" />
                            Decline
                        </button>
                    </div>
                </div>

                <!-- Approved: disbursement action panel -->
                <div v-else-if="application.status === 'approved'"
                    class="rounded-2xl border border-green-100 bg-green-50/50 p-5 dark:border-green-900/40 dark:bg-green-900/10">
                    <p class="mb-1 text-sm font-semibold text-green-800 dark:text-green-300">Ready for Disbursement</p>
                    <p class="mb-4 text-xs text-green-700 dark:text-green-400">
                        Approved <strong>{{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}</strong>
                        for <strong>{{ application.approved_term }} months</strong>.
                        Process disbursement to create the loan account.
                    </p>
                    <button
                        class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        @click="openDisburseModal">
                        <Banknote class="h-4 w-4" />
                        Process Disbursement
                    </button>
                </div>

                <!-- Disbursed: loan account summary -->
                <div v-if="application.status === 'disbursed' && application.disbursed_loan"
                    class="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/10">
                    <div class="mb-4 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                                <CreditCard class="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Loan Account</h2>
                                <p class="text-xs text-emerald-600 dark:text-emerald-400">{{ application.disbursed_loan.loan_no }}</p>
                            </div>
                        </div>
                        <button
                            class="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                            @click="router.push({ name: 'tenant-loan-account', params: { id: application.disbursed_loan_id } })"
                        >
                            <CreditCard class="h-3.5 w-3.5" />
                            View Loan Account
                        </button>
                    </div>
                    <dl class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Principal</dt>
                            <dd class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
                                {{ application.disbursed_loan.principal_formatted ?? formatAmount(application.disbursed_loan.principal) }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Net Disbursed</dt>
                            <dd class="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                                {{ application.disbursed_loan.net_disbursed_amount_formatted ?? formatAmount(application.disbursed_loan.net_disbursed_amount) }}
                            </dd>
                        </div>
                        <div v-if="Number(application.disbursed_loan.processing_fee) > 0">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Processing Fee</dt>
                            <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">
                                {{ application.disbursed_loan.processing_fee_formatted ?? formatAmount(application.disbursed_loan.processing_fee) }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Interest Rate</dt>
                            <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">{{ application.disbursed_loan.interest_rate }}%</dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Term</dt>
                            <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">{{ application.disbursed_loan.term_months }} months</dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Disbursement Method</dt>
                            <dd class="mt-1 font-medium capitalize text-neutral-700 dark:text-neutral-300">
                                {{ application.disbursed_loan.disbursement_method?.replace(/_/g, ' ') ?? '—' }}
                            </dd>
                        </div>
                        <div v-if="application.disbursed_loan.disbursement_reference">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Reference</dt>
                            <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">{{ application.disbursed_loan.disbursement_reference }}</dd>
                        </div>
                        <div v-if="application.disbursed_loan.disbursed_by_staff">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Disbursed By</dt>
                            <dd class="mt-1 font-medium text-neutral-700 dark:text-neutral-300">{{ application.disbursed_loan.disbursed_by_staff.name }}</dd>
                        </div>
                    </dl>

                    <!-- Repayment Schedule (Gap 10 — expandable) -->
                    <div v-if="application.disbursed_loan.schedules?.length" class="mt-5">
                        <div class="mb-3 flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Repayment Schedule</h3>
                            <span class="text-xs text-neutral-400 dark:text-neutral-500">
                                {{ application.disbursed_loan.schedules.length }} installments
                            </span>
                        </div>
                        <div class="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
                            <table class="w-full text-xs">
                                <thead class="bg-neutral-50 dark:bg-neutral-800/60">
                                    <tr>
                                        <th class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400">#</th>
                                        <th class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400">Due Date</th>
                                        <th class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400">Principal</th>
                                        <th class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400">Interest</th>
                                        <th class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400">Total</th>
                                        <th class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400">Balance</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <tr v-for="row in (showAllSchedule ? application.disbursed_loan.schedules : application.disbursed_loan.schedules.slice(0, 6))"
                                        :key="row.installment_no"
                                        class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                        <td class="px-3 py-2 text-neutral-500 dark:text-neutral-400">{{ row.installment_no }}</td>
                                        <td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">{{ formatDate(row.due_date) }}</td>
                                        <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.principal_due) }}</td>
                                        <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">{{ formatAmount(row.interest_due) }}</td>
                                        <td class="px-3 py-2 text-right font-medium text-neutral-900 dark:text-white">{{ formatAmount(row.total_due) }}</td>
                                        <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">{{ formatAmount(row.outstanding_balance) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <button v-if="application.disbursed_loan.schedules.length > 6"
                            class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-100 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
                            @click="showAllSchedule = !showAllSchedule">
                            <template v-if="showAllSchedule">
                                <ChevronUp class="h-3.5 w-3.5" /> Show less
                            </template>
                            <template v-else>
                                <ChevronDown class="h-3.5 w-3.5" />
                                Show all {{ application.disbursed_loan.schedules.length }} installments
                            </template>
                        </button>
                    </div>
                </div>

                <!-- Application details -->
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Application Details</h2>
                    <dl class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Member</dt>
                            <dd class="mt-1 font-medium text-neutral-900 dark:text-white">{{ application.member?.name ?? '—' }}</dd>
                            <dd v-if="application.member?.member_no" class="text-xs text-neutral-400 dark:text-neutral-500">{{ application.member.member_no }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Loan Product</dt>
                            <dd class="mt-1 font-medium text-neutral-900 dark:text-white">{{ application.loan_product?.name ?? '—' }}</dd>
                            <dd v-if="application.loan_product?.code" class="text-xs text-neutral-400 dark:text-neutral-500">{{ application.loan_product.code }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Requested Amount</dt>
                            <dd class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">{{ displayAmount(application.requested_amount_formatted, application.requested_amount) }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Requested Term</dt>
                            <dd class="mt-1 font-medium text-neutral-900 dark:text-white">{{ application.requested_term ?? '—' }} months</dd>
                        </div>
                        <div v-if="application.purpose" class="sm:col-span-2">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Purpose</dt>
                            <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{{ application.purpose }}</dd>
                        </div>
                        <div v-if="application.repayment_source" class="sm:col-span-2">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Repayment Source</dt>
                            <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{{ application.repayment_source }}</dd>
                        </div>
                        <div v-if="application.rejection_reason" class="sm:col-span-2">
                            <dt class="text-xs font-medium uppercase tracking-wide text-red-400">Rejection Reason</dt>
                            <dd class="mt-1 text-sm text-red-600 dark:text-red-400">{{ application.rejection_reason }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Appraisal summary (visible once appraised) -->
                <div v-if="application.risk_rating || application.recommended_amount"
                    class="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-purple-900/40 dark:bg-neutral-900">
                    <div class="mb-4 flex items-center justify-between">
                        <h2 class="text-base font-semibold text-neutral-900 dark:text-white">Appraisal Summary</h2>
                        <span v-if="application.risk_rating"
                            class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                            :class="riskBadgeClass(application.risk_rating)">
                            <ShieldCheck class="h-3 w-3" />
                            {{ application.risk_rating }} risk
                        </span>
                    </div>
                    <dl class="grid gap-4 sm:grid-cols-2">
                        <div v-if="application.recommended_amount">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Recommended Amount</dt>
                            <dd class="mt-1 text-lg font-bold text-purple-700 dark:text-purple-400">{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</dd>
                        </div>
                        <div v-if="application.recommended_term">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Recommended Term</dt>
                            <dd class="mt-1 font-medium text-purple-700 dark:text-purple-400">{{ application.recommended_term }} months</dd>
                        </div>
                        <div v-if="application.approved_amount">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Approved Amount</dt>
                            <dd class="mt-1 text-lg font-bold text-green-700 dark:text-green-400">{{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}</dd>
                        </div>
                        <div v-if="application.approved_term">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Approved Term</dt>
                            <dd class="mt-1 font-medium text-green-700 dark:text-green-400">{{ application.approved_term }} months</dd>
                        </div>
                        <div v-if="application.recommended_by" class="sm:col-span-2">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Appraised By</dt>
                            <dd class="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{{ application.recommended_by.name }}</dd>
                        </div>
                        <div v-if="application.appraisal_notes" class="sm:col-span-2">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Appraisal Notes</dt>
                            <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{{ application.appraisal_notes }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Return for correction notice -->
                <div v-if="application.status === 'draft' && application.return_reason"
                    class="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20">
                    <Undo2 class="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <div>
                        <p class="text-sm font-semibold text-orange-900 dark:text-orange-200">Returned for Correction</p>
                        <p class="mt-1 text-sm text-orange-700 dark:text-orange-300">{{ application.return_reason }}</p>
                        <p v-if="application.returned_at" class="mt-1 text-xs text-orange-500 dark:text-orange-400">
                            Returned on {{ formatDate(application.returned_at) }}
                        </p>
                        <p class="mt-2 text-xs text-orange-600 dark:text-orange-400">
                            Please address the issues above, then edit and resubmit the application.
                        </p>
                    </div>
                </div>

                <!-- Cancellation notice -->
                <div v-if="application.status === 'cancelled' && application.cancellation_reason"
                    class="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-700 dark:bg-neutral-800/60">
                    <AlertTriangle class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                    <div>
                        <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Application Cancelled</p>
                        <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{{ application.cancellation_reason }}</p>
                        <p v-if="application.cancelled_at" class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                            Cancelled on {{ formatDate(application.cancelled_at) }}
                        </p>
                        <p class="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                            You can reopen this application as a draft to make corrections and resubmit.
                        </p>
                    </div>
                </div>

                <!-- Approval votes (when in recommended / approved / rejected stage) -->
                <div v-if="application.approvals?.length"
                    class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">Approval Votes</h2>
                    <div class="space-y-3">
                        <div v-for="vote in application.approvals" :key="vote.id"
                            class="flex items-start gap-3 rounded-xl border p-4"
                            :class="vote.decision === 'approved'
                                ? 'border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
                                : 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'">
                            <div class="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                                :class="vote.decision === 'approved' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'">
                                <CheckCircle2 v-if="vote.decision === 'approved'" class="h-4 w-4 text-green-600 dark:text-green-400" />
                                <XCircleIcon v-else class="h-4 w-4 text-red-500 dark:text-red-400" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2">
                                    <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ vote.approver?.name ?? 'Unknown Approver' }}</p>
                                    <span class="text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(vote.decided_at) }}</span>
                                </div>
                                <p v-if="vote.comments" class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{{ vote.comments }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ─── Right column ─────────────────────────────────────────────── -->
            <div class="flex flex-col gap-6">

                <!-- Documents -->
                <LoanDocumentUploader
                    v-if="application.id"
                    :application-id="application.id"
                    :editable="documentEditableStatuses.includes(application.status ?? '')"
                    @updated="loadApplication"
                />

                <!-- Collateral & Securities (Gap 17) -->
                <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="mb-4 flex items-center gap-2">
                        <Shield class="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Collateral & Securities</h3>
                    </div>
                    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-6 text-center dark:border-neutral-700">
                        <Shield class="mb-2 h-5 w-5 text-neutral-300 dark:text-neutral-600" />
                        <p class="text-sm text-neutral-500 dark:text-neutral-400">No collateral recorded.</p>
                        <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">Collateral items can be added when creating or editing the application.</p>
                    </div>
                </div>

                <!-- Key dates -->
                <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Key Dates</h3>
                    <dl class="grid gap-3 text-sm">
                        <div class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Created</dt>
                            <dd class="text-right">
                                <span class="block font-medium text-neutral-900 dark:text-white">{{ formatDate(application.created_at) }}</span>
                                <span v-if="application.created_by?.name" class="text-xs text-neutral-400 dark:text-neutral-500">by {{ application.created_by.name }}</span>
                            </dd>
                        </div>
                        <div v-if="application.submitted_at" class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Submitted</dt>
                            <dd class="font-medium text-neutral-900 dark:text-white">{{ formatDate(application.submitted_at) }}</dd>
                        </div>
                        <div v-if="application.reviewed_at" class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Taken for Review</dt>
                            <dd class="font-medium text-neutral-900 dark:text-white">{{ formatDate(application.reviewed_at) }}</dd>
                        </div>
                        <div v-if="application.recommended_at" class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Recommended</dt>
                            <dd class="font-medium text-purple-700 dark:text-purple-400">{{ formatDate(application.recommended_at) }}</dd>
                        </div>
                        <div v-if="application.approved_at" class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Approved</dt>
                            <dd class="font-medium text-green-700 dark:text-green-400">{{ formatDate(application.approved_at) }}</dd>
                        </div>
                        <div v-if="application.rejected_at" class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Rejected</dt>
                            <dd class="font-medium text-red-600 dark:text-red-400">{{ formatDate(application.rejected_at) }}</dd>
                        </div>
                        <div v-if="application.disbursed_at" class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Disbursed</dt>
                            <dd class="font-medium text-emerald-700 dark:text-emerald-400">{{ formatDate(application.disbursed_at) }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Audit timeline -->
                <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Audit Trail</h3>
                    <div v-if="timelineLoading" class="py-4 text-center text-xs text-neutral-400">Loading…</div>
                    <div v-else-if="!timeline.length" class="py-4 text-center text-xs text-neutral-400">No events yet.</div>
                    <ol v-else class="relative space-y-5 border-l border-neutral-200 pl-5 dark:border-neutral-700">
                        <li v-for="(event, idx) in timeline" :key="idx" class="relative">
                            <!-- dot -->
                            <div class="absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-neutral-900"
                                :class="timelineIconClass(event.type)">
                                <CircleDot v-if="event.type === 'created'" class="h-2.5 w-2.5" />
                                <Clock       v-else-if="event.type === 'status_change'"     class="h-2.5 w-2.5" />
                                <FileText    v-else-if="event.type === 'document_uploaded'" class="h-2.5 w-2.5" />
                                                <ThumbsUp    v-else-if="event.type === 'approval_vote'"     class="h-2.5 w-2.5" />
                            </div>
                            <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ formatDateTime(event.timestamp) }}</p>
                            <p class="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">{{ event.title }}</p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ event.description }}</p>
                            <p v-if="event.actor?.name" class="text-xs text-neutral-400 dark:text-neutral-500">by {{ event.actor.name }}</p>
                            <p v-if="event.notes" class="mt-1 text-xs italic text-neutral-400 dark:text-neutral-500">{{ event.notes }}</p>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════════
         MODALS — all teleported to body
         ════════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">

        <!-- ── Cancel modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showCancelModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="closeCancelModal">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95" appear>
                    <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div class="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex items-center gap-2">
                                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                                    <XCircle class="h-5 w-5 text-red-500 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Cancel Application</h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">This will stop the application process.</p>
                                </div>
                            </div>
                            <button class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors dark:hover:bg-neutral-800" @click="closeCancelModal">
                                <XCircle class="h-4 w-4" />
                            </button>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-400">*</span></label>
                            <textarea v-model="cancelReason" rows="4" placeholder="e.g. Member failed to provide required payslips…"
                                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="cancelReasonError ? 'border-red-300 dark:border-red-700' : ''"
                                @keydown.esc="closeCancelModal" />
                            <p v-if="cancelReasonError" class="mt-1 text-xs text-red-500">{{ cancelReasonError }}</p>
                            <p class="mt-1 text-right text-xs text-neutral-400">{{ cancelReason.length }} / 500</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" @click="closeCancelModal">Keep</button>
                            <button :disabled="cancelling || !cancelReason.trim()" class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50" @click="confirmCancel">
                                <XCircle class="h-4 w-4" />{{ cancelling ? 'Cancelling…' : 'Confirm Cancellation' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Appraise modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showAppraiseModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="showAppraiseModal = false">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100" appear>
                    <div class="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-nfuko-primary/10">
                                <ClipboardCheck class="h-5 w-5 text-nfuko-primary" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Appraise & Recommend</h3>
                                <p class="text-xs text-neutral-500">Set recommended terms and risk rating.</p>
                            </div>
                        </div>
                        <div class="grid gap-4 px-6 py-5 sm:grid-cols-2">
                            <div>
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Recommended Amount <span class="text-red-400">*</span></label>
                                <input v-model="appraiseForm.recommended_amount" type="number" min="1" placeholder="0.00"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="appraiseErrors.recommended_amount ? 'border-red-300' : ''" />
                                <p v-if="appraiseErrors.recommended_amount" class="mt-1 text-xs text-red-500">{{ appraiseErrors.recommended_amount }}</p>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Recommended Term (months) <span class="text-red-400">*</span></label>
                                <input v-model="appraiseForm.recommended_term" type="number" min="1" placeholder="12"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                    :class="appraiseErrors.recommended_term ? 'border-red-300' : ''" />
                                <p v-if="appraiseErrors.recommended_term" class="mt-1 text-xs text-red-500">{{ appraiseErrors.recommended_term }}</p>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Risk Rating <span class="text-red-400">*</span></label>
                                <div class="mt-1.5 grid grid-cols-4 gap-2">
                                    <button v-for="r in ['low', 'medium', 'high', 'critical']" :key="r"
                                        type="button"
                                        class="rounded-xl border px-3 py-2 text-xs font-medium capitalize transition-colors"
                                        :class="appraiseForm.risk_rating === r
                                            ? riskBadgeClass(r) + ' border-current'
                                            : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700'"
                                        @click="appraiseForm.risk_rating = r">
                                        {{ r }}
                                    </button>
                                </div>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Appraisal Notes</label>
                                <textarea v-model="appraiseForm.appraisal_notes" rows="3" placeholder="Optional notes…"
                                    class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            </div>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" @click="showAppraiseModal = false">Cancel</button>
                            <button :disabled="appraising" class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" @click="submitAppraise">
                                <ClipboardCheck class="h-4 w-4" />{{ appraising ? 'Saving…' : 'Appraise & Recommend' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Request Documents modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showRequestDocsModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="showRequestDocsModal = false">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                                <FileSearch class="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Request Documents</h3>
                                <p class="text-xs text-neutral-500">Specify which documents are needed.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Note <span class="text-red-400">*</span></label>
                            <textarea v-model="requestDocsNote" rows="4" placeholder="e.g. Please provide the last 3 months' payslips and bank statements…"
                                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="requestDocsError ? 'border-red-300' : ''" />
                            <p v-if="requestDocsError" class="mt-1 text-xs text-red-500">{{ requestDocsError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" @click="showRequestDocsModal = false">Cancel</button>
                            <button :disabled="requestingDocs" class="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50" @click="submitRequestDocs">
                                <FileSearch class="h-4 w-4" />{{ requestingDocs ? 'Saving…' : 'Request Documents' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Return for Correction modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showReturnModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="showReturnModal = false">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30">
                                <Undo2 class="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Return for Correction</h3>
                                <p class="text-xs text-neutral-500">Application will go back to draft for the member to fix.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-400">*</span></label>
                            <textarea v-model="returnReason" rows="4" placeholder="e.g. The requested amount exceeds the member's eligible limit. Please revise and resubmit…"
                                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="returnError ? 'border-red-300' : ''" />
                            <p v-if="returnError" class="mt-1 text-xs text-red-500">{{ returnError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" @click="showReturnModal = false">Cancel</button>
                            <button :disabled="returning" class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50" @click="submitReturn">
                                <Undo2 class="h-4 w-4" />{{ returning ? 'Returning…' : 'Return for Correction' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Reject (appraisal) modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showRejectModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="showRejectModal = false">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                                <XCircleIcon class="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Reject Application</h3>
                                <p class="text-xs text-neutral-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-400">*</span></label>
                            <textarea v-model="rejectReason" rows="4" placeholder="e.g. Member does not meet the minimum savings threshold for this product…"
                                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="rejectError ? 'border-red-300' : ''" />
                            <p v-if="rejectError" class="mt-1 text-xs text-red-500">{{ rejectError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" @click="showRejectModal = false">Cancel</button>
                            <button :disabled="rejecting" class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50" @click="submitReject">
                                <XCircleIcon class="h-4 w-4" />{{ rejecting ? 'Rejecting…' : 'Confirm Rejection' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Approve modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showApproveModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="showApproveModal = false">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30">
                                <ThumbsUp class="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Approve Application</h3>
                                <p class="text-xs text-neutral-500">Record your approval vote.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Comments <span class="text-neutral-400 font-normal">(optional)</span></label>
                            <textarea v-model="approveComments" rows="3" placeholder="Any comments on your approval…"
                                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" @click="showApproveModal = false">Cancel</button>
                            <button :disabled="approving" class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50" @click="submitApprove">
                                <ThumbsUp class="h-4 w-4" />{{ approving ? 'Saving…' : 'Confirm Approval' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- ── Decline modal ── -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="showDeclineModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="showDeclineModal = false">
                <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" appear>
                    <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <div class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                                <ThumbsDown class="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Decline Application</h3>
                                <p class="text-xs text-neutral-500">This will move the application to rejected.</p>
                            </div>
                        </div>
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Reason <span class="text-red-400">*</span></label>
                            <textarea v-model="declineReason" rows="4" placeholder="e.g. Application does not meet the credit committee's requirements…"
                                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                                :class="declineError ? 'border-red-300' : ''" />
                            <p v-if="declineError" class="mt-1 text-xs text-red-500">{{ declineError }}</p>
                        </div>
                        <div class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" @click="showDeclineModal = false">Cancel</button>
                            <button :disabled="declining" class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50" @click="submitDecline">
                                <ThumbsDown class="h-4 w-4" />{{ declining ? 'Saving…' : 'Confirm Decline' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>

    </Teleport>

    <!-- Disbursement confirmation drawer -->
    <LoanDisbursementDrawer
        :application="application"
        :open="showDisburseModal"
        :disbursing="disbursing"
        :form="disburseForm"
        :errors="disburseErrors"
        @close="showDisburseModal = false"
        @submit="submitDisburse"
    />
</template>
