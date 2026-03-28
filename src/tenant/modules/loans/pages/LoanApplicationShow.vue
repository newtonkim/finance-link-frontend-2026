<script setup lang="ts">
import { ArrowLeft, HandCoins, Pencil, XCircle, RotateCcw, AlertTriangle } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router'
import { useLoanApplicationShow } from '../composables/useLoanApplicationShow'
import LoanGuarantorManager from '../components/LoanGuarantorManager.vue'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'

const router = useRouter()

const {
    loading, cancelling, reopening,
    application,
    showCancelModal, cancelReason, cancelReasonError,
    openCancelModal, closeCancelModal, confirmCancel,
    reopen, openEdit,
} = useLoanApplicationShow()

function statusBadgeClass(status: string | undefined) {
    switch (status) {
        case 'draft':               return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
        case 'submitted':           return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        case 'under_review':        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        case 'awaiting_documents':  return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        case 'awaiting_guarantors': return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
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

const editableStatuses     = ['draft']
const cancellableStatuses  = ['draft', 'submitted', 'under_review', 'awaiting_documents', 'awaiting_guarantors']
const reopenableStatuses   = ['cancelled']
</script>

<template>
    <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">

        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="router.back()">
                    <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </button>
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <HandCoins class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        {{ application?.application_no ?? 'Loan Application' }}
                    </h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">Application details and status history.</p>
                </div>
            </div>
            <div v-if="application" class="flex items-center gap-2">
                <button
                    v-if="editableStatuses.includes(application.status ?? '')"
                    class="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    @click="openEdit"
                >
                    <Pencil class="h-4 w-4" />
                    Edit
                </button>
                <!-- Reopen cancelled application -->
                <button
                    v-if="reopenableStatuses.includes(application.status ?? '')"
                    :disabled="reopening"
                    class="flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    @click="reopen"
                >
                    <RotateCcw class="h-4 w-4" />
                    {{ reopening ? 'Reopening…' : 'Reopen as Draft' }}
                </button>
                <!-- Cancel application -->
                <button
                    v-if="cancellableStatuses.includes(application.status ?? '')"
                    :disabled="cancelling"
                    class="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    @click="openCancelModal"
                >
                    <XCircle class="h-4 w-4" />
                    Cancel Application
                </button>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">Loading…</div>

        <div v-else-if="application" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

            <!-- ─── Left column ──────────────────────────────────────────────── -->
            <div class="flex flex-col gap-6">

                <!-- Status banner -->
                <div class="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div>
                        <p class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Status</p>
                        <span
                            class="mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                            :class="statusBadgeClass(application.status)"
                        >
                            {{ statusLabel(application.status) }}
                        </span>
                    </div>
                    <div v-if="application.submitted_at" class="text-right">
                        <p class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Submitted</p>
                        <p class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{{ formatDate(application.submitted_at) }}</p>
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
                        <div v-if="application.recommended_amount" >
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Recommended Amount</dt>
                            <dd class="mt-1 font-medium text-purple-700 dark:text-purple-400">{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</dd>
                        </div>
                        <div v-if="application.approved_amount">
                            <dt class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Approved Amount</dt>
                            <dd class="mt-1 font-medium text-green-700 dark:text-green-400">{{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}</dd>
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
            </div>

            <!-- ─── Right column ─────────────────────────────────────────────── -->
            <div class="flex flex-col gap-6">

                <!-- Guarantors (read-only) -->
                <LoanGuarantorManager
                    v-if="application.id"
                    :application-id="application.id"
                    :min-guarantors="(application.loan_product as any)?.min_guarantors ?? 0"
                    :applicant-member-id="application.member_id"
                    :editable="false"
                />

                <!-- Documents (read-only) -->
                <LoanDocumentUploader
                    v-if="application.id"
                    :application-id="application.id"
                    :editable="false"
                />

                <!-- Key dates -->
                <div class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Timeline</h3>
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
                        <div v-if="application.recommended_at" class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Recommended</dt>
                            <dd class="font-medium text-neutral-900 dark:text-white">{{ formatDate(application.recommended_at) }}</dd>
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
                        <div v-if="application.days_pending != null" class="flex justify-between gap-2">
                            <dt class="text-neutral-500 dark:text-neutral-400">Days Pending</dt>
                            <dd class="font-medium text-neutral-900 dark:text-white">{{ application.days_pending }}</dd>
                        </div>
                    </dl>
                </div>

                <!-- Status history -->
                <div v-if="application.status_history?.length" class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Status History</h3>
                    <ol class="relative border-l border-neutral-200 dark:border-neutral-700 pl-5 space-y-4">
                        <li v-for="entry in application.status_history" :key="entry.id" class="relative">
                            <div class="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-nfuko-primary dark:border-neutral-900 dark:bg-bg-nfuko-yellow" />
                            <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(entry.changed_at) }}</p>
                            <p class="mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">
                                <span v-if="entry.from_status" class="capitalize">{{ entry.from_status.replace(/_/g, ' ') }}</span>
                                <span v-if="entry.from_status"> → </span>
                                <span class="font-medium text-neutral-900 capitalize dark:text-white">{{ entry.to_status.replace(/_/g, ' ') }}</span>
                            </p>
                            <p v-if="entry.changed_by?.name" class="text-xs text-neutral-400 dark:text-neutral-500">by {{ entry.changed_by.name }}</p>
                            <p v-if="entry.notes" class="mt-1 text-xs italic text-neutral-500 dark:text-neutral-400">{{ entry.notes }}</p>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    </div>

    <!-- ─── Cancel Application Modal ──────────────────────────────────────── -->
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="showCancelModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                @mousedown.self="closeCancelModal">

                <Transition
                    enter-active-class="transition duration-150 ease-out"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95"
                    appear
                >
                    <div class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                        <!-- Header -->
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
                            <button
                                class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors dark:hover:bg-neutral-800"
                                @click="closeCancelModal">
                                <XCircle class="h-4 w-4" />
                            </button>
                        </div>

                        <!-- Body -->
                        <div class="px-6 py-5">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Reason for cancellation <span class="text-red-400">*</span>
                            </label>
                            <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                                Provide a clear reason so the applicant understands what needs to be corrected.
                            </p>
                            <textarea
                                v-model="cancelReason"
                                rows="4"
                                placeholder="e.g. Member failed to provide the required payslips within the deadline…"
                                class="mt-3 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                                :class="cancelReasonError ? 'border-red-300 dark:border-red-700' : ''"
                                @keydown.esc="closeCancelModal"
                            />
                            <p v-if="cancelReasonError" class="mt-1.5 text-xs text-red-500 dark:text-red-400">
                                {{ cancelReasonError }}
                            </p>
                            <p class="mt-1 text-right text-xs text-neutral-400 dark:text-neutral-500">
                                {{ cancelReason.length }} / 500
                            </p>
                        </div>

                        <!-- Footer -->
                        <div class="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
                            <button
                                class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                @click="closeCancelModal">
                                Keep Application
                            </button>
                            <button
                                :disabled="cancelling || !cancelReason.trim()"
                                class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
                                @click="confirmCancel">
                                <XCircle class="h-4 w-4" />
                                {{ cancelling ? 'Cancelling…' : 'Confirm Cancellation' }}
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
