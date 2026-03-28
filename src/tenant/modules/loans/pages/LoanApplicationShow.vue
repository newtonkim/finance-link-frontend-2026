<script setup lang="ts">
import { ArrowLeft, HandCoins, Pencil, XCircle } from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router'
import { useLoanApplicationShow } from '../composables/useLoanApplicationShow'

const router = useRouter()

const { loading, cancelling, application, openEdit, cancel } = useLoanApplicationShow()

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

const editableStatuses = ['draft']
const cancellableStatuses = ['draft', 'submitted', 'under_review', 'awaiting_documents', 'awaiting_guarantors']
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
                <button
                    v-if="cancellableStatuses.includes(application.status ?? '')"
                    :disabled="cancelling"
                    class="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    @click="cancel"
                >
                    <XCircle class="h-4 w-4" />
                    {{ cancelling ? 'Cancelling…' : 'Cancel Application' }}
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
            </div>

            <!-- ─── Right column ─────────────────────────────────────────────── -->
            <div class="flex flex-col gap-6">

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
</template>
