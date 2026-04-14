<script setup lang="ts">
import { ref } from 'vue'
import {
    Banknote, RefreshCw, BookOpen, Table2, FileText, History,
    CheckCircle2, XCircle as XCircleIcon, CircleDot, CalendarDays,
    ShieldCheck, UserCheck, Printer, Download
} from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useLoanApplicationHelpers } from '../composables/useLoanApplicationHelpers'
import LoanDocumentUploader from './LoanDocumentUploader.vue'
import type { LoanApplication, TimelineEvent } from '../../../apis/loans/loanApplicationsApi'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'

interface ScheduleInstallment {
    number: number; due_date: string
    principal: number; interest: number; total: number; balance: number
}
interface ScheduleData {
    amount: number; term: number; interest_method: string; interest_period: string
    grace_days?: number; repayment_cycle?: string; installments: ScheduleInstallment[]
    summary: { monthly_installment: number; total_principal: number; total_interest: number; total_repayment: number }
}

const props = defineProps<{
    application: LoanApplication
    committeeVotes: any[]
    timeline: TimelineEvent[]
    timelineLoading: boolean
    documentEditableStatuses: string[]
    currentDocStage: string
}>()

const emit = defineEmits<{ openDisburse: []; loadApplication: [] }>()

const { displayAmount, riskBadgeClass, formatDate, formatDateTime, timelineIconClass } = useLoanApplicationHelpers()

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabKey = 'general' | 'schedule' | 'documents' | 'audit' | 'charges'
const approvedTab = ref<TabKey>('general')
const approvedTabs = [
    { key: 'general' as const,   label: 'General Information',       icon: BookOpen },
    { key: 'schedule' as const,  label: 'Proposed Schedule',         icon: Table2 },
    { key: 'documents' as const, label: 'Documents',                 icon: FileText },
    { key: 'charges' as const,   label: 'Charges & Fees',            icon: Banknote },
    { key: 'audit' as const,     label: 'Loan Activity Audit Trail', icon: History },
]

// ─── Proposed Schedule ────────────────────────────────────────────────────────
const scheduleLoading   = ref(false)
const isPrinting        = ref(false)
const isDownloading     = ref(false)
const scheduleError     = ref<string | null>(null)
const scheduleData      = ref<ScheduleData | null>(null)
const scheduleStartDate = ref('')

async function loadProposedSchedule() {
    if (!props.application) return
    scheduleLoading.value = true
    scheduleError.value   = null
    try {
        const res = await loanApplicationsApi.getProposedSchedule(props.application.id!, {
            amount:     (props.application.approved_amount ?? props.application.recommended_amount) ?? undefined,
            term:       (props.application.approved_term  ?? props.application.recommended_term)  ?? undefined,
            start_date: scheduleStartDate.value || undefined,
        })
        scheduleData.value = res.data.data
        if (!scheduleStartDate.value) scheduleStartDate.value = new Date().toISOString().split('T')[0] ?? ''
    } catch {
        scheduleError.value = 'Failed to load proposed schedule.'
    } finally {
        scheduleLoading.value = false
    }
}

async function exportProposedSchedule(mode: 'download' | 'print') {
    if (!props.application?.id) return
    
    const params: any = {}
    if (scheduleStartDate.value) params.start_date = scheduleStartDate.value
    
    const amount = props.application.approved_amount ?? props.application.recommended_amount
    const term = props.application.approved_term ?? props.application.recommended_term
    
    if (amount) params.amount = String(amount)
    if (term) params.term = String(term)

    try {
        if (mode === 'print') isPrinting.value = true
        else isDownloading.value = true

        const res = await loanApplicationsApi.exportProposedSchedule(props.application.id, params)
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)

        if (mode === 'print') {
            // Open the PDF blob in a new tab — the browser's native PDF viewer
            // has a print button and responds to keyboard shortcuts (Ctrl+P / Cmd+P).
            // Programmatic iframe.contentWindow.print() is blocked in Chrome/Edge
            // because the PDF renderer runs in a sandboxed process.
            const tab = window.open(url, '_blank')
            if (!tab) window.URL.revokeObjectURL(url)
            // Revoke after a short delay to give the tab time to load the blob.
            else setTimeout(() => window.URL.revokeObjectURL(url), 10_000)
        } else {
            const link = document.createElement('a')
            link.href = url
            const filename = `proposed_schedule_${props.application.member?.name || 'loan'}.pdf`
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        }
    } catch (error) {
        console.error('Export failed:', error)
    } finally {
        isPrinting.value = false
        isDownloading.value = false
    }
}

function switchTab(key: TabKey) {
    approvedTab.value = key
    if (key === 'schedule' && !scheduleData.value) loadProposedSchedule()
}

function fmt(val: number) { return formatMoneyValue(val) }

function formatRepaymentCycle(val: string | null | undefined) {
    if (!val) return '—'
    if (val.toLowerCase() === 'biweekly') return 'Bi-weekly'
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
}
</script>

<template>
    <div class="space-y-3">
        <!-- Pinned action bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-900/40 dark:bg-green-900/10">
            <div>
                <p class="text-sm font-semibold text-green-800 dark:text-green-300">Ready for Disbursement</p>
                <p class="text-xs text-green-700 dark:text-green-400">
                    Approved <strong>{{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}</strong>
                    for <strong>{{ application.approved_term }} months</strong>.
                </p>
            </div>
            <button
                class="flex shrink-0 items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
                @click="emit('openDisburse')">
                <Banknote class="h-4 w-4" /> Process Disbursement
            </button>
        </div>

        <!-- Tab container -->
        <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <!-- Tab bar -->
            <div class="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-800/30">
                <nav class="-mb-px flex overflow-x-auto">
                    <button v-for="tab in approvedTabs" :key="tab.key"
                        class="flex shrink-0 items-center gap-1.5 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200"
                        :class="approvedTab === tab.key
                            ? 'border-green-600 text-green-700 bg-white dark:text-green-400 dark:border-green-400 dark:bg-neutral-900'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-200'"
                        @click="switchTab(tab.key)">
                        <component :is="tab.icon" class="h-3.5 w-3.5" />
                        {{ tab.label }}
                    </button>
                </nav>
            </div>

            <!-- ── GENERAL INFORMATION TAB ── -->
            <div v-if="approvedTab === 'general'">

                <!-- ── Hero Banner ── -->
                <div class="border-b border-neutral-100 bg-white px-6 py-5 dark:border-neutral-800 dark:bg-neutral-900">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p class="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Approved Loan</p>
                            <p class="text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">
                                {{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}
                            </p>
                            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                over <span class="font-semibold text-neutral-700 dark:text-neutral-300">{{ application.approved_term }}</span> months
                            </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-2 rounded-full bg-green-100 px-4 py-2 dark:bg-green-900/40">
                            <CheckCircle2 class="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span class="text-sm font-bold text-green-700 dark:text-green-400">Approved</span>
                        </div>
                    </div>
                </div>

                <!-- ── Section 1: Application Details + Appraisal Summary ── -->
                <div class="grid gap-0 divide-y divide-neutral-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-neutral-800">

                    <!-- Application Details -->
                    <div class="p-6">
                        <div class="mb-5 flex items-center gap-2">
                            <div class="h-4 w-1 rounded-full bg-green-500"></div>
                            <h3 class="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">Application Details</h3>
                        </div>
                        <dl class="space-y-5">
                            <!-- Member + Loan Officer side by side -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex items-start gap-3">
                                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-sm font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                        {{ (application.member?.name ?? '?').charAt(0).toUpperCase() }}
                                    </div>
                                    <div class="min-w-0">
                                        <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Member</dt>
                                        <dd class="text-sm font-semibold text-neutral-900 dark:text-white">{{ application.member?.name ?? '—' }}</dd>
                                        <dd v-if="application.member?.member_no" class="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">{{ application.member.member_no }}</dd>
                                    </div>
                                </div>
                                <div v-if="application.loan_officer" class="flex items-start gap-3">
                                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                        {{ application.loan_officer.name.charAt(0).toUpperCase() }}
                                    </div>
                                    <div class="min-w-0">
                                        <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Loan Officer</dt>
                                        <dd class="text-sm font-semibold text-neutral-900 dark:text-white">{{ application.loan_officer.name }}</dd>
                                    </div>
                                </div>
                            </div>

                            <!-- Loan Product -->
                            <div class="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                                <dt class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Loan Product</dt>
                                <dd class="text-sm font-bold text-neutral-900 dark:text-white">{{ application.loan_product?.name ?? '—' }}</dd>
                                <dd v-if="application.loan_product?.code" class="mt-0.5 font-mono text-[11px] text-neutral-400 dark:text-neutral-500">{{ application.loan_product.code }}</dd>
                            </div>

                            <!-- Requested Amount + Term -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                                    <dt class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Requested Amount</dt>
                                    <dd class="tabular-nums text-sm font-bold text-neutral-800 dark:text-neutral-200">{{ displayAmount(application.requested_amount_formatted, application.requested_amount) }}</dd>
                                </div>
                                <div class="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                                    <dt class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Requested Term</dt>
                                    <dd class="text-sm font-bold text-neutral-800 dark:text-neutral-200">{{ application.requested_term ?? '—' }} <span class="text-xs font-normal text-neutral-400">months</span></dd>
                                </div>
                            </div>

                            <!-- Interest Rate + Method + Grace Period -->
                            <div v-if="application.loan_product?.interest_rate || application.loan_product?.interest_method || application.loan_product?.grace_period" class="grid grid-cols-2 gap-3">
                                <div v-if="application.loan_product?.interest_rate" class="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                                    <dt class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Interest Rate</dt>
                                    <dd class="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                        {{ application.loan_product.interest_rate }}%
                                        <span class="ml-1 text-[11px] font-normal text-neutral-400">{{ application.loan_product.interest_period === 'per_month' ? 'p/m' : 'p/a' }}</span>
                                    </dd>
                                </div>
                                <div v-if="application.loan_product?.interest_method" class="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                                    <dt class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Interest Method</dt>
                                    <dd>
                                        <span class="inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold"
                                            :class="application.loan_product.interest_method === 'flat'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'">
                                            {{ application.loan_product.interest_method === 'flat' ? 'Flat Rate' : 'Reducing Balance' }}
                                        </span>
                                    </dd>
                                </div>
                                <div v-if="application.loan_product?.grace_period != null" class="rounded-xl border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
                                    <dt class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400">Grace Period</dt>
                                    <dd class="text-sm font-bold text-amber-700 dark:text-amber-300">
                                        {{ application.loan_product.grace_period }}
                                        <span class="ml-1 text-[11px] font-normal text-amber-500">days</span>
                                    </dd>
                                </div>
                                <div v-if="application.loan_product?.repayment_cycle" class="rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
                                    <dt class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">Repayment Cycle</dt>
                                    <dd class="text-sm font-bold text-blue-700 dark:text-blue-300">
                                        {{ formatRepaymentCycle(application.loan_product.repayment_cycle) }}
                                    </dd>
                                </div>
                            </div>

                            <!-- Purpose + Repayment Source -->
                            <div v-if="application.purpose || application.repayment_source" class="grid grid-cols-2 gap-3">
                                <div v-if="application.repayment_source">
                                    <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Repayment Source</dt>
                                    <dd class="text-sm text-neutral-700 dark:text-neutral-300">{{ application.repayment_source }}</dd>
                                </div>
                                <div v-if="application.purpose">
                                    <dt class="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Purpose</dt>
                                    <dd class="text-sm text-neutral-700 dark:text-neutral-300">{{ application.purpose }}</dd>
                                </div>
                            </div>
                        </dl>
                    </div>

                    <!-- Appraisal Summary -->
                    <div v-if="application.risk_rating || application.recommended_amount" class="p-6">
                        <div class="mb-5 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="h-4 w-1 rounded-full bg-blue-500"></div>
                                <h3 class="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">Appraisal Summary</h3>
                            </div>
                            <span v-if="application.risk_rating" class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold capitalize" :class="riskBadgeClass(application.risk_rating)">
                                <ShieldCheck class="h-3 w-3" />{{ application.risk_rating }} risk
                            </span>
                        </div>
                        <dl class="space-y-5">
                            <!-- Recommended vs Approved amounts -->
                            <div class="grid grid-cols-2 gap-3">
                                <div v-if="application.recommended_amount" class="rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
                                    <dt class="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">Recommended</dt>
                                    <dd class="tabular-nums text-sm font-bold text-blue-700 dark:text-blue-300">{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</dd>
                                    <dd v-if="application.recommended_term" class="mt-0.5 text-[11px] text-blue-500 dark:text-blue-400">{{ application.recommended_term }} months</dd>
                                </div>
                                <div v-if="application.approved_amount" class="rounded-xl border border-green-200 bg-green-50/60 p-3 dark:border-green-900/30 dark:bg-green-900/10">
                                    <dt class="mb-1 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Approved</dt>
                                    <dd class="tabular-nums text-sm font-bold text-green-700 dark:text-green-300">{{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}</dd>
                                    <dd v-if="application.approved_term" class="mt-0.5 text-[11px] text-green-600 dark:text-green-400">{{ application.approved_term }} months</dd>
                                </div>
                            </div>

                            <!-- Appraised by -->
                            <div v-if="application.recommended_by">
                                <dt class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Appraised By</dt>
                                <dd class="flex items-center gap-3">
                                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                        {{ application.recommended_by.name.charAt(0).toUpperCase() }}
                                    </div>
                                    <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ application.recommended_by.name }}</span>
                                </dd>
                            </div>

                            <!-- Appraisal notes -->
                            <div v-if="application.appraisal_notes" class="rounded-xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                                <dt class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Appraisal Notes</dt>
                                <dd class="text-xs leading-relaxed text-neutral-600 italic dark:text-neutral-400">{{ application.appraisal_notes }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <!-- ── Section 2: Committee / Approval Votes ── -->
                <div v-if="committeeVotes?.length || application.approvals?.length" class="border-t border-neutral-100 p-6 dark:border-neutral-800">
                    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <div class="h-4 w-1 rounded-full bg-blue-500"></div>
                            <h3 class="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">Committee Votes</h3>
                        </div>
                        <div v-if="application.quorum_required" class="flex items-center gap-4 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[11px] dark:border-neutral-800 dark:bg-neutral-800/50">
                            <span class="text-neutral-500 dark:text-neutral-400">Quorum: <span class="font-bold text-neutral-700 dark:text-neutral-200">{{ application.quorum_required }}</span></span>
                            <span class="h-3 w-px bg-neutral-200 dark:bg-neutral-700"></span>
                            <span class="text-neutral-500 dark:text-neutral-400">Threshold: <span class="font-bold text-neutral-700 dark:text-neutral-200">{{ application.approval_threshold }}</span></span>
                        </div>
                    </div>
                    <div v-if="committeeVotes?.length" class="grid gap-2 sm:grid-cols-2">
                        <div v-for="vote in committeeVotes" :key="`cv-${vote.id ?? vote.staff_id}`"
                            class="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                            :class="vote.abstained
                                ? 'border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/20'
                                : vote.decision === 'approve'
                                    ? 'border-green-100 bg-green-50/60 dark:border-green-900/30 dark:bg-green-900/10'
                                    : 'border-red-100 bg-red-50/60 dark:border-red-900/30 dark:bg-red-900/10'">
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                                :class="vote.abstained
                                    ? 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                                    : vote.decision === 'approve'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                        : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'">
                                {{ (vote.staff_name ?? 'U').charAt(0).toUpperCase() }}
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ vote.staff_name ?? 'Unknown' }}</p>
                                <p v-if="vote.comment" class="truncate text-xs text-neutral-500 dark:text-neutral-400">{{ vote.comment }}</p>
                            </div>
                            <span class="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold"
                                :class="vote.abstained
                                    ? 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                                    : vote.decision === 'approve'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'">
                                <CheckCircle2 v-if="!vote.abstained && vote.decision === 'approve'" class="h-3 w-3" />
                                <XCircleIcon v-else-if="!vote.abstained" class="h-3 w-3" />
                                <CircleDot v-else class="h-3 w-3" />
                                {{ vote.abstained ? 'Abstained' : vote.decision === 'approve' ? 'Approved' : 'Declined' }}
                            </span>
                        </div>
                    </div>
                    <div v-else-if="application.approvals?.length" class="grid gap-2 sm:grid-cols-2">
                        <div v-for="vote in application.approvals" :key="`lv-${vote.id}`"
                            class="flex items-center gap-3 rounded-xl border px-4 py-3"
                            :class="vote.decision === 'approved'
                                ? 'border-green-100 bg-green-50/60 dark:border-green-900/30 dark:bg-green-900/10'
                                : 'border-red-100 bg-red-50/60 dark:border-red-900/30 dark:bg-red-900/10'">
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                                :class="vote.decision === 'approved'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'">
                                {{ (vote.approver?.name ?? 'U').charAt(0).toUpperCase() }}
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ vote.approver?.name ?? 'Unknown' }}</p>
                                <p v-if="vote.comments" class="truncate text-xs text-neutral-500 dark:text-neutral-400">{{ vote.comments }}</p>
                            </div>
                            <span class="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold"
                                :class="vote.decision === 'approved'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'">
                                <CheckCircle2 v-if="vote.decision === 'approved'" class="h-3 w-3" />
                                <XCircleIcon v-else class="h-3 w-3" />
                                {{ vote.decision === 'approved' ? 'Approved' : 'Declined' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── PROPOSED SCHEDULE TAB ── -->
            <div v-else-if="approvedTab === 'schedule'">
                <div class="flex flex-wrap items-center gap-3 border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
                    <CalendarDays class="h-4 w-4 text-neutral-400" />
                    <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Proposed start date</label>
                    <input v-model="scheduleStartDate" type="date"
                        class="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        @change="loadProposedSchedule" />
                    <button :disabled="scheduleLoading"
                        class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        @click="loadProposedSchedule">
                        <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': scheduleLoading }" /> Recalculate
                    </button>

                    <div class="ml-auto flex items-center gap-2">
                        <button v-if="scheduleData" :disabled="isPrinting || isDownloading"
                            class="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                            @click="exportProposedSchedule('print')">
                            <RefreshCw v-if="isPrinting" class="h-3.5 w-3.5 animate-spin" />
                            <Printer v-else class="h-3.5 w-3.5" /> Print
                        </button>
                        <button v-if="scheduleData" :disabled="isDownloading || isPrinting"
                            class="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                            @click="exportProposedSchedule('download')">
                            <RefreshCw v-if="isDownloading" class="h-3.5 w-3.5 animate-spin" />
                            <Download v-else class="h-3.5 w-3.5" /> Download PDF
                        </button>
                    </div>

                </div>
                <div v-if="scheduleLoading" class="flex items-center justify-center py-16 text-sm text-neutral-400">
                    <RefreshCw class="mr-2 h-4 w-4 animate-spin" /> Calculating schedule…
                </div>
                <div v-else-if="scheduleError" class="px-5 py-8 text-center text-sm text-red-500">{{ scheduleError }}</div>
                <div v-else-if="scheduleData" class="space-y-5 p-5">
                    <div class="flex items-center gap-2">
                        <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                            :class="scheduleData.interest_method === 'flat' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'">
                            {{ scheduleData.interest_method === 'flat' ? 'Flat Rate' : 'Reducing Balance' }}
                        </span>
                        <span v-if="application.loan_product?.interest_rate" class="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {{ application.loan_product.interest_rate }}% {{ application.loan_product.interest_period === 'per_month' ? 'per month' : 'per annum' }}
                        </span>
                    </div>
                    <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div class="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Loan Amount</p>
                            <p class="text-sm font-bold text-neutral-900 dark:text-white">{{ fmt(scheduleData.amount) }}</p>
                        </div>
                        <div class="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 dark:border-blue-900/30 dark:bg-blue-900/10">
                            <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400">Monthly</p>
                            <p class="text-sm font-bold text-blue-700 dark:text-blue-400">{{ fmt(scheduleData.summary?.monthly_installment) }}</p>
                        </div>
                        <div class="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Total Principal</p>
                            <p class="text-sm font-bold text-neutral-900 dark:text-white">{{ fmt(scheduleData.summary?.total_principal) }}</p>
                        </div>
                        <div class="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 dark:border-orange-900/30 dark:bg-orange-900/10">
                            <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-400">Total Interest</p>
                            <p class="text-sm font-bold text-orange-600 dark:text-orange-400">{{ fmt(scheduleData.summary?.total_interest) }}</p>
                        </div>
                        <div class="rounded-xl border border-green-100 bg-green-50/60 px-4 py-3 dark:border-green-900/30 dark:bg-green-900/10">
                            <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-500">Total Repayment</p>
                            <p class="text-sm font-bold text-green-700 dark:text-green-400">{{ fmt(scheduleData.summary?.total_repayment) }}</p>
                        </div>
                    </div>
                    <div class="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <table class="w-full text-xs">
                            <thead class="bg-neutral-50 dark:bg-neutral-800/60">
                                <tr class="text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                                    <th class="px-3 py-2.5">#</th>
                                    <th class="px-3 py-2.5">Due Date</th>
                                    <th class="px-3 py-2.5 text-right">Principal</th>
                                    <th class="px-3 py-2.5 text-right">Interest</th>
                                    <th class="px-3 py-2.5 text-right">Total</th>
                                    <th class="px-3 py-2.5 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
                                <tr v-for="inst in scheduleData.installments" :key="inst.number"
                                    class="bg-white transition-colors hover:bg-blue-50/30 dark:bg-neutral-900 dark:hover:bg-neutral-800/40">
                                    <td class="px-3 py-2.5 font-medium text-neutral-400">{{ inst.number }}</td>
                                    <td class="px-3 py-2.5 text-neutral-700 dark:text-neutral-300">{{ inst.due_date }}</td>
                                    <td class="px-3 py-2.5 text-right text-neutral-700 dark:text-neutral-300">{{ fmt(inst.principal) }}</td>
                                    <td class="px-3 py-2.5 text-right text-orange-600 dark:text-orange-400">{{ fmt(inst.interest) }}</td>
                                    <td class="px-3 py-2.5 text-right font-semibold text-neutral-900 dark:text-white">{{ fmt(inst.total) }}</td>
                                    <td class="px-3 py-2.5 text-right text-neutral-500 dark:text-neutral-400">{{ fmt(inst.balance) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div v-else class="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400">
                    <Table2 class="h-8 w-8" />
                    <p class="text-sm">Click Recalculate to generate the schedule.</p>
                </div>
            </div>

            <!-- ── DOCUMENTS TAB ── -->
            <div v-else-if="approvedTab === 'documents'" class="p-5">
                <LoanDocumentUploader v-if="application.id"
                    :application-id="application.id"
                    :editable="documentEditableStatuses.includes(application.status ?? '')"
                    :current-stage="currentDocStage"
                    @updated="emit('loadApplication')" />
            </div>

            <!-- ── AUDIT TRAIL TAB ── -->
            <div v-else-if="approvedTab === 'audit'" class="p-5">
                <div v-if="timelineLoading" class="flex items-center justify-center py-12 text-sm text-neutral-400">
                    <RefreshCw class="mr-2 h-4 w-4 animate-spin" /> Loading audit trail…
                </div>
                <div v-else-if="!timeline.length" class="flex flex-col items-center justify-center gap-3 py-12 text-neutral-400">
                    <History class="h-8 w-8" />
                    <p class="text-sm">No activity recorded yet.</p>
                </div>
                <ol v-else class="relative ml-3 space-y-0 border-l border-neutral-200 dark:border-neutral-700">
                    <li v-for="(event, idx) in timeline" :key="idx" class="relative pb-6 pl-6 last:pb-0">
                        <div class="absolute -left-[9px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white dark:border-neutral-900"
                            :class="timelineIconClass(event.type)">
                            <div class="h-1.5 w-1.5 rounded-full bg-current" />
                        </div>
                        <div class="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                            <div class="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ event.title }}</p>
                                    <p v-if="event.description" class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{{ event.description }}</p>
                                    <p v-if="event.notes" class="mt-1 border-l-2 border-neutral-300 pl-2 text-xs italic text-neutral-600 dark:border-neutral-600 dark:text-neutral-400">"{{ event.notes }}"</p>
                                </div>
                                <div class="flex shrink-0 flex-col items-end gap-1">
                                    <span class="text-[10px] font-medium text-neutral-400">{{ formatDateTime(event.timestamp) }}</span>
                                    <span v-if="event.actor" class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                        <UserCheck class="h-3 w-3" />{{ event.actor.name }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </li>
                </ol>
            </div>

            <!-- ── CHARGES & FEES TAB ── -->
            <div v-else-if="approvedTab === 'charges'" class="p-6">
                <!-- Heading -->
                <p class="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">Charges &amp; Fees breakdown</p>

                <div v-if="application.product_charges?.items?.length" class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <!-- Charge rows -->
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                                <th class="px-4 py-2.5 text-left font-semibold text-neutral-500 dark:text-neutral-400">Charge</th>
                                <th class="px-4 py-2.5 text-left font-semibold text-neutral-500 dark:text-neutral-400">Rate</th>
                                <th class="px-4 py-2.5 text-left font-semibold text-neutral-500 dark:text-neutral-400">When</th>
                                <th class="px-4 py-2.5 text-right font-semibold text-neutral-500 dark:text-neutral-400">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                            <tr v-for="charge in application.product_charges.items" :key="String(charge.id)"
                                class="bg-white dark:bg-neutral-900">
                                <td class="px-4 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">{{ charge.name }}</td>
                                <td class="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">
                                    <span v-if="charge.charge_type === 'percentage'">{{ charge.value }}%</span>
                                    <span v-else>{{ charge.computed_amount_formatted }}</span>
                                </td>
                                <td class="px-4 py-2.5">
                                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                        :class="charge.application_timing === 'on_disbursement'
                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'">
                                        {{ charge.application_timing === 'on_disbursement' ? 'On Disbursement' : 'On Repayment' }}
                                    </span>
                                </td>
                                <td class="px-4 py-2.5 text-right font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                                    −{{ charge.computed_amount_formatted }}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Net disbursement summary -->
                    <div class="divide-y divide-neutral-100 border-t border-neutral-200 dark:divide-neutral-800 dark:border-neutral-700">
                        <div class="flex items-center justify-between px-4 py-2.5">
                            <span class="text-xs text-neutral-500 dark:text-neutral-400">Gross Amount (Approved)</span>
                            <span class="tabular-nums text-xs font-semibold text-neutral-700 dark:text-neutral-300">{{ application.product_charges.summary.gross_amount_formatted }}</span>
                        </div>
                        <div class="flex items-center justify-between px-4 py-2.5">
                            <span class="text-xs text-neutral-500 dark:text-neutral-400">Total Charges on Disbursement</span>
                            <span class="tabular-nums text-xs font-semibold text-amber-600 dark:text-amber-400">−{{ application.product_charges.summary.total_on_disbursement_formatted }}</span>
                        </div>
                        <div class="flex items-center justify-between bg-emerald-50/60 px-4 py-3 dark:bg-emerald-900/10">
                            <span class="text-xs font-bold text-emerald-800 dark:text-emerald-300">Net Cash to Member</span>
                            <span class="tabular-nums text-sm font-bold text-emerald-700 dark:text-emerald-400">{{ application.product_charges.summary.net_disbursed_formatted }}</span>
                        </div>
                    </div>
                </div>
                <div v-else class="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400">
                    <Banknote class="h-8 w-8 opacity-20" />
                    <p class="text-sm italic">No charges or fees defined for this application.</p>
                </div>
            </div>
        </div>
    </div>
</template>
