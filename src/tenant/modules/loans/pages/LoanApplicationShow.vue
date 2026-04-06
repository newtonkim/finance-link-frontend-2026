<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ArrowLeft,
  HandCoins,
  Pencil,
  XCircle,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  ClipboardCheck,
  FileSearch,
  Undo2,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle as XCircleIcon,
  CircleDot,
  RefreshCw,
  Banknote,
  CreditCard,
  Check,
  ClipboardList,
  History,
  BookOpen,
  Activity,
  CalendarDays,
  Table2,
  Info,
} from 'lucide-vue-next'
import { formatMoneyValue } from '@/Global'
import { useRouter } from 'vue-router'
import { useLoanApplicationShow } from '../composables/useLoanApplicationShow'
import { useLoanAppraisalActions } from '../composables/useLoanAppraisalActions'
import { useLoanDisbursement } from '../composables/useLoanDisbursement'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'
import LoanCollateralManager from '../components/LoanCollateralManager.vue'
import LoanDisbursementDrawer from '../components/LoanDisbursementDrawer.vue'
import VoteTallyDisplay from '../components/VoteTallyDisplay.vue'
import VoteCastModal from '../components/VoteCastModal.vue'
import CommitteeVotesList from '../components/CommitteeVotesList.vue'
import BMRecommendModal from '../components/BMRecommendModal.vue'
import BMReturnForCorrectionModal from '../components/BMReturnForCorrectionModal.vue'
import { loanApplicationsApi } from '../../../apis/loans/loanApplicationsApi'

// ─── Proposed Schedule ────────────────────────────────────────────────────────
interface ScheduleInstallment {
  number: number
  due_date: string
  principal: number
  interest: number
  total: number
  balance: number
}
interface ScheduleData {
  amount: number
  term: number
  interest_method: string
  interest_period: string
  monthly_rate: number
  installments: ScheduleInstallment[]
  summary: {
    monthly_installment: number
    total_principal: number
    total_interest: number
    total_repayment: number
  }
}

const scheduleLoading    = ref(false)
const scheduleError      = ref<string | null>(null)
const scheduleData       = ref<ScheduleData | null>(null)
const scheduleStartDate  = ref('')

async function loadProposedSchedule() {
  if (!application.value) return
  scheduleLoading.value = true
  scheduleError.value   = null
  try {
    const res = await loanApplicationsApi.getProposedSchedule(application.value.id!, {
      amount:     (application.value.approved_amount ?? application.value.recommended_amount) ?? undefined,
      term:       (application.value.approved_term  ?? application.value.recommended_term)  ?? undefined,
      start_date: scheduleStartDate.value || undefined,
    })
    scheduleData.value = res.data.data
    if (!scheduleStartDate.value && res.data.data?.installments?.[0]?.due_date) {
      // prefill start date from first installment minus 1 month
      scheduleStartDate.value = new Date().toISOString().split('T')[0] ?? ''
    }
  } catch {
    scheduleError.value = 'Failed to load proposed schedule.'
  } finally {
    scheduleLoading.value = false
  }
}

function formatCurrency(val: number) {
  return formatMoneyValue(val)
}

const router = useRouter()

const {
  loading,
  cancelling,
  reopening,
  application,
  timeline,
  timelineLoading,
  showCancelModal,
  cancelReason,
  cancelReasonError,
  openCancelModal,
  closeCancelModal,
  confirmCancel,
  reopen,
  openEdit,
  loadApplication,
} = useLoanApplicationShow()

const {
  takingForReview,
  takeForReview,
  resumingReview,
  resumeReview,
  showAppraiseModal,
  appraising,
  appraiseForm,
  appraiseErrors,
  openAppraiseModal,
  submitAppraise,
  showRequestDocsModal,
  requestingDocs,
  requestDocsNote,
  requestDocsError,
  openRequestDocsModal,
  submitRequestDocs,
  showReturnModal,
  returning,
  returnReason,
  returnError,
  openReturnModal,
  submitReturn,
  showRejectModal,
  rejecting,
  rejectReason,
  rejectError,
  openRejectModal,
  submitReject,
  showApproveModal,
  approving,
  approveComments,
  openApproveModal,
  submitApprove,
  showDeclineModal,
  declining,
  declineReason,
  declineError,
  openDeclineModal,
  submitDecline,
  // BM Recommend
  showBMRecommendModal,
  bmRecommending,
  openBMRecommendModal,
  submitBMRecommend,
  // BM Return for Correction
  showBMReturnModal,
  bmReturning,
  openBMReturnModal,
  submitBMReturn,
  // Vote Cast
  showVoteModal,
  voting,
  openVoteModal,
  submitVote,
  // Vote Tally
  voteTally,
  loadingVotes,
  loadVotes,
  // Committee Votes & Members
  committeeVotes,
  committeeMembers,
} = useLoanAppraisalActions(application, loadApplication)

const {
  showDisburseModal,
  disbursing,
  disburseForm,
  disburseErrors,
  openDisburseModal,
  submitDisburse,
} = useLoanDisbursement(application, loadApplication)

// ─── Auto-load votes when application is in a voting-related status ───────────
watch(
  () => application.value?.status,
  (status) => {
    if (status === 'committee_voting' || status === 'approved') {
      loadVotes()
    }
  },
  { immediate: true },
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'draft':
      return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
    case 'submitted':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'under_review':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'awaiting_documents':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'

    case 'recommended':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'approved':
      return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'disbursement_pending':
      return 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
    case 'disbursed':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'active':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'rejected':
      return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'cancelled':
      return 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
    case 'officer_recommended':
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    case 'bm_recommended':
      return 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
    case 'committee_voting':
      return 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400'
    case 'returned_for_correction':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'declined':
      return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
}

function statusLabel(status: string | undefined) {
  if (!status) return '—'
  if (status === 'active') return 'Disbursed'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatAmount(v: number | string | null | undefined) {
  if (v == null || v === '') return '—'
  return formatMoneyValue(v)
}

function displayAmount(
  formatted: string | null | undefined,
  raw: number | string | null | undefined,
) {
  return formatted || formatAmount(raw)
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function riskBadgeClass(risk: string | null | undefined) {
  switch (risk) {
    case 'low':
      return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'medium':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'high':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'critical':
      return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
  }
}

function timelineIconClass(type: string) {
  switch (type) {
    case 'created':
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
    case 'status_change':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-900/40'
    case 'document_uploaded':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/40'

    case 'approval_vote':
      return 'bg-green-50 text-green-600 dark:bg-green-900/40'
    default:
      return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
  }
}

const editableStatuses = ['draft', 'returned_for_correction']
const cancellableStatuses = [
  'draft',
  'submitted',
  'under_review',
  'awaiting_documents',
  'officer_recommended',
  'bm_recommended',
  'committee_voting',
]
const reopenableStatuses = ['cancelled', 'declined']
const documentEditableStatuses = ['draft', 'submitted', 'awaiting_documents', 'returned_for_correction']

const documentUploaderRef = ref<InstanceType<typeof LoanDocumentUploader> | null>(null)


const currentDocStage = computed(() => {
  switch (application.value?.status) {
    case 'draft': return 'draft'
    case 'submitted':
    case 'awaiting_documents': return 'submission'
    case 'under_review': return 'review'
    case 'officer_recommended':
    case 'bm_recommended':
    case 'committee_voting': return 'approval'
    case 'approved':
    case 'disbursement_pending': return 'disbursement'
    default: return 'submission'
  }
})

// ─── Load votes when entering committee_voting ────────────────────────────────
watch(
  () => application.value?.status,
  (status) => {
    if (status === 'committee_voting') {
      loadVotes()
    }
  },
  { immediate: true },
)

// ─── Workflow pipeline (Gap 4) ────────────────────────────────────────────────
const workflowSteps = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'recommended', label: 'Recommended' },
  { key: 'approved', label: 'Approved' },
  { key: 'disbursed', label: 'Disbursed' },
]

const statusOrder: Record<string, number> = {
  draft: 0,
  submitted: 1,
  under_review: 2,
  awaiting_documents: 2,
  recommended: 3,
  officer_recommended: 3,
  bm_recommended: 4,
  committee_voting: 4,
  approved: 5,
  disbursement_pending: 5,
  disbursed: 6,
  returned_for_correction: 2,
  declined: 5,
}

const isTerminalNegative = computed(
  () =>
    application.value?.status === 'rejected' ||
    application.value?.status === 'cancelled' ||
    application.value?.status === 'declined',
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
    case 'awaiting_documents':
      return 'Awaiting Docs'
    case 'officer_recommended':
      return 'Officer Recommended'
    case 'bm_recommended':
      return 'BM Recommended'
    case 'committee_voting':
      return 'Committee Voting'
    case 'returned_for_correction':
      return 'Returned'
    case 'disbursement_pending':
      return 'Pending Disbursement'
    default:
      return null
  }
})

// ─── Schedule expansion (Gap 10) ─────────────────────────────────────────────
const showAllSchedule = ref(false)

// ─── Loan Account Tabs ───────────────────────────────────────────────────────
const loanAccountTab = ref<'general' | 'transactions' | 'schedule' | 'documents' | 'activities'>(
  'general',
)

const loanAccountTabs = [
  { key: 'general' as const, label: 'General Information', icon: CreditCard },
  { key: 'transactions' as const, label: 'Transaction History', icon: History },
  { key: 'schedule' as const, label: 'Payment Schedule', icon: ClipboardList },
  { key: 'documents' as const, label: 'Documents', icon: FileText },
  { key: 'activities' as const, label: 'Loan Activities', icon: Activity },
]

// ─── Approved-stage tabs ──────────────────────────────────────────────────────
const approvedTab = ref<'general' | 'schedule' | 'documents' | 'audit'>('general')

const approvedTabs = [
  { key: 'general' as const,   label: 'General Information',     icon: BookOpen },
  { key: 'schedule' as const,  label: 'Proposed Schedule',       icon: Table2 },
  { key: 'documents' as const, label: 'Documents',               icon: FileText },
  { key: 'audit' as const,     label: 'Loan Activity Audit Trail', icon: History },
]

function switchApprovedTab(key: 'general' | 'schedule' | 'documents' | 'audit') {
  approvedTab.value = key
  if (key === 'schedule' && !scheduleData.value) {
    loadProposedSchedule()
  }
}
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          @click="router.back()"
        >
          <ArrowLeft class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
        </button>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"
        >
          <HandCoins class="h-5 w-5 text-nfuko-primary dark:text-bg-nfuko-yellow" />
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {{ application?.application_no ?? 'Loan Application' }}
          </h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Application details and audit trail.
          </p>
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
          v-if="reopenableStatuses.includes(application.status ?? '')"
          :disabled="reopening"
          class="flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          @click="reopen"
        >
          <RotateCcw class="h-4 w-4" />
          {{ reopening ? 'Reopening…' : 'Reopen as Draft' }}
        </button>
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
    <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">
      Loading…
    </div>

    <div v-else-if="application" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <!-- ─── Left column ──────────────────────────────────────────────── -->
      <div class="flex flex-col gap-6">
        <!-- ── Workflow pipeline (Gap 4) ── -->
        <div
          class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <!-- Terminal-state banner (rejected / cancelled) -->
          <div
            v-if="isTerminalNegative"
            class="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
            :class="
              application.status === 'rejected'
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-neutral-100 dark:bg-neutral-800'
            "
          >
            <XCircleIcon
              class="h-5 w-5 shrink-0"
              :class="application.status === 'rejected' ? 'text-red-500' : 'text-neutral-400'"
            />
            <div>
              <p
                class="text-sm font-semibold"
                :class="
                  application.status === 'rejected'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-neutral-700 dark:text-neutral-300'
                "
              >
                {{ statusLabel(application.status) }}
              </p>
              <p
                v-if="application.rejected_at || application.cancelled_at"
                class="text-xs"
                :class="application.status === 'rejected' ? 'text-red-500' : 'text-neutral-400'"
              >
                {{ formatDate(application.rejected_at ?? application.cancelled_at) }}
              </p>
            </div>
          </div>

          <!-- Pipeline steps -->
          <div class="flex items-start overflow-x-auto pb-1">
            <template v-for="(step, idx) in workflowSteps" :key="step.key">
              <div class="flex shrink-0 flex-col items-center gap-1.5" style="min-width: 72px">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  :class="
                    isTerminalNegative && pipelineStepStatus(step.key) === 'current'
                      ? 'bg-neutral-300 dark:bg-neutral-600'
                      : pipelineStepStatus(step.key) === 'completed'
                        ? 'bg-emerald-500'
                        : pipelineStepStatus(step.key) === 'current'
                          ? 'bg-nfuko-primary'
                          : 'bg-neutral-200 dark:bg-neutral-700'
                  "
                >
                  <Check
                    v-if="pipelineStepStatus(step.key) === 'completed'"
                    class="h-4 w-4 text-white"
                  />
                  <div
                    v-else-if="pipelineStepStatus(step.key) === 'current' && !isTerminalNegative"
                    class="h-2.5 w-2.5 rounded-full bg-white"
                  />
                  <div
                    v-else
                    class="h-2 w-2 rounded-full"
                    :class="
                      pipelineStepStatus(step.key) === 'completed'
                        ? 'bg-white'
                        : 'bg-neutral-400 dark:bg-neutral-500'
                    "
                  />
                </div>
                <p
                  class="text-center text-xs leading-tight"
                  :class="
                    pipelineStepStatus(step.key) === 'current' && !isTerminalNegative
                      ? 'font-semibold text-nfuko-primary dark:text-bg-nfuko-yellow'
                      : pipelineStepStatus(step.key) === 'completed'
                        ? 'font-medium text-emerald-600 dark:text-emerald-400'
                        : 'text-neutral-400 dark:text-neutral-500'
                  "
                >
                  {{ step.label }}
                </p>
                <p
                  v-if="
                    pipelineStepStatus(step.key) === 'current' &&
                    pipelineSubLabel &&
                    !isTerminalNegative
                  "
                  class="text-center text-xs italic text-neutral-400 dark:text-neutral-500"
                >
                  {{ pipelineSubLabel }}
                </p>
              </div>
              <div
                v-if="idx < workflowSteps.length - 1"
                class="mx-1 mt-4 h-px min-w-[1rem] flex-1 transition-colors"
                :class="
                  pipelineStepStatus(workflowSteps[idx + 1]?.key ?? '') !== 'pending'
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : 'bg-neutral-200 dark:bg-neutral-700'
                "
              />
            </template>
          </div>

          <div
            v-if="application.submitted_at"
            class="mt-3 border-t border-neutral-50 pt-3 text-right dark:border-neutral-800"
          >
            <p class="text-xs text-neutral-400 dark:text-neutral-500">
              Submitted {{ formatDate(application.submitted_at) }}
            </p>
          </div>
        </div>

        <!-- ── Action panel ── -->
        <!-- Submitted: credit officer picks up the application -->
        <div
          v-if="application.status === 'submitted'"
          class="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-900/10"
        >
          <p class="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-300">
            Ready for Review
          </p>
          <p class="mb-4 text-xs text-blue-600 dark:text-blue-400">
            This application has been submitted and is awaiting an officer to submit it for
            review.
          </p>
          <p
            v-if="documentUploaderRef?.hasMissingForStage('submission')"
            class="mb-3 flex items-center gap-1.5 text-xs font-medium text-red-500 dark:text-red-400"
          >
            <AlertCircle class="h-3.5 w-3.5 shrink-0" />
            Upload all required submission documents before proceeding.
          </p>
          <button
            :disabled="takingForReview || !!documentUploaderRef?.hasMissingForStage('submission')"
            class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="takeForReview"
          >
            <ClipboardCheck class="h-4 w-4" />
            {{ takingForReview ? 'Submitting…' : 'Submit for Review' }}
          </button>
        </div>

        <!-- Under review: full appraisal action panel -->
        <div
          v-else-if="application.status === 'under_review'"
          class="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-900/10"
        >
          <p class="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-300">
            Appraisal Actions
          </p>
          <p class="mb-4 text-xs text-amber-700 dark:text-amber-400">
            Review the application details, then choose an action.
          </p>
          <div class="flex flex-wrap gap-2">
            <!-- Requested order: Request Documents → Return for Correction → Appraise & Recommend -->
            <button
              class="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors dark:border-amber-800 dark:bg-transparent dark:text-amber-400 dark:hover:bg-amber-900/20"
              @click="openRequestDocsModal"
            >
              <FileSearch class="h-4 w-4" />
              Request Documents
            </button>
            <button
              class="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors dark:border-orange-800 dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-900/20"
              @click="openReturnModal"
            >
              <Undo2 class="h-4 w-4" />
              Return for Correction
            </button>
            <button
              class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              @click="openAppraiseModal"
            >
              <ClipboardCheck class="h-4 w-4" />
              Appraise & Recommend
            </button>
            <button
              class="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
              @click="openRejectModal"
            >
              <XCircleIcon class="h-4 w-4" />
              Reject
            </button>
          </div>
        </div>

        <!-- Awaiting documents: resume review once provided -->
        <div
          v-else-if="application.status === 'awaiting_documents'"
          class="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 dark:border-orange-900/40 dark:bg-orange-900/10"
        >
          <p class="mb-1 text-sm font-semibold text-orange-800 dark:text-orange-300">
            Awaiting Documents
          </p>
          <p class="mb-4 text-xs text-orange-700 dark:text-orange-400">
            Once the member has provided the required documents, resume the review.
          </p>
          <button
            :disabled="resumingReview"
            class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
            @click="resumeReview"
          >
            <RefreshCw class="h-4 w-4" />
            {{ resumingReview ? 'Resuming…' : 'Resume Review' }}
          </button>
        </div>

        <!-- Officer Recommended: BM actions -->
        <div
          v-else-if="application.status === 'officer_recommended'"
          class="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-900/40 dark:bg-indigo-900/10"
        >
          <p class="mb-1 text-sm font-semibold text-indigo-800 dark:text-indigo-300">
            Branch Manager Review
          </p>
          <p class="mb-4 text-xs text-indigo-600 dark:text-indigo-400">
            Loan Officer has recommended
            <strong>{{
              displayAmount(
                application.recommended_amount_formatted,
                application.recommended_amount,
              )
            }}</strong>
            for <strong>{{ application.recommended_term }} months</strong>. Please review and take
            action.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              @click="openBMRecommendModal"
            >
              <UserCheck class="h-4 w-4" />
              Recommend to Committee
            </button>
            <button
              class="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors dark:border-orange-800 dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-900/20"
              @click="openBMReturnModal"
            >
              <Undo2 class="h-4 w-4" />
              Return for Correction
            </button>
          </div>
        </div>

        <!-- Returned for Correction: LO can resume -->
        <div
          v-else-if="application.status === 'returned_for_correction'"
          class="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 dark:border-orange-900/40 dark:bg-orange-900/10"
        >
          <p class="mb-1 text-sm font-semibold text-orange-800 dark:text-orange-300">
            Returned for Correction
          </p>
          <p class="mb-4 text-xs text-orange-700 dark:text-orange-400">
            Branch Manager has returned this application for correction.
            <span v-if="application.correction_reason" class="block mt-1 italic"
              >"{{ application.correction_reason }}"</span
            >
          </p>
          <button
            :disabled="resumingReview"
            class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
            @click="resumeReview"
          >
            <RefreshCw class="h-4 w-4" />
            {{ resumingReview ? 'Resuming…' : 'Resume Review' }}
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════════════════════
             COMMITTEE VOTING PANEL
             Status: committee_voting
        ═══════════════════════════════════════════════════════════════════ -->
        <div v-else-if="application.status === 'committee_voting'" class="space-y-4">

          <!-- Header card -->
          <div class="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 dark:border-violet-800 dark:from-violet-950/30 dark:to-neutral-900">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="mb-1 flex items-center gap-2">
                  <div class="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
                    <Users class="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p class="text-sm font-semibold text-violet-800 dark:text-violet-300">Committee Voting Open</p>
                </div>
                <p class="text-xs text-violet-600 dark:text-violet-400">
                  Amount:
                  <strong class="text-violet-800 dark:text-violet-200">{{
                    displayAmount(application.recommended_amount_formatted, application.recommended_amount)
                  }}</strong>
                  · Term: <strong class="text-violet-800 dark:text-violet-200">{{ application.recommended_term }} months</strong>
                </p>
              </div>
              <!-- Quorum badge -->
              <div class="shrink-0 rounded-xl bg-violet-100 px-3 py-1.5 text-center dark:bg-violet-900/40">
                <p class="text-lg font-bold leading-none text-violet-700 dark:text-violet-300">
                  {{ voteTally?.total_cast ?? 0 }}<span class="text-sm font-medium text-violet-400">/{{ application.quorum_required }}</span>
                </p>
                <p class="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-500 dark:text-violet-400">Votes cast</p>
              </div>
            </div>
          </div>

          <!-- Live tally -->
          <VoteTallyDisplay
            v-if="voteTally"
            :tally="voteTally"
            :unanimity-required="application.unanimity_required ?? undefined"
            class="mb-4"
          />

          <!-- Cast vote or already-voted notice -->
          <div
            v-if="voteTally?.has_voted"
            class="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30"
          >
            <CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Vote recorded</p>
              <p class="text-xs text-emerald-600 dark:text-emerald-500">Your vote has been cast. The outcome will be determined once quorum is reached.</p>
            </div>
          </div>

          <div v-else class="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white p-4 dark:border-violet-900/40 dark:bg-neutral-900">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <ThumbsUp class="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-neutral-900 dark:text-white">Your vote is pending</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Cast your vote to contribute to the committee decision.</p>
            </div>
            <button
              class="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="loadingVotes"
              @click="openVoteModal"
            >
              <ThumbsUp class="h-4 w-4" />
              Cast Vote
            </button>
          </div>

          <!-- Individual votes -->
          <CommitteeVotesList
            v-if="committeeVotes?.length"
            :votes="committeeVotes"
            :quorum-required="application.quorum_required ?? undefined"
            :approval-threshold="application.approval_threshold ?? undefined"
            :unanimity-required="application.unanimity_required ?? undefined"
          />
        </div>

        <!-- ══════════════════════════════════════════════════════════════════
             DECLINED by committee — terminal
        ═══════════════════════════════════════════════════════════════════ -->
        <div
          v-else-if="application.status === 'declined'"
          class="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/40 dark:bg-red-950/20"
        >
          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <XCircle class="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p class="text-sm font-semibold text-red-800 dark:text-red-300">Declined by Committee</p>
              <p class="mt-0.5 text-xs text-red-600 dark:text-red-400">This application did not meet the required approval threshold.</p>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════════════
             RECOMMENDED (legacy simple flow) — direct approve / decline
        ═══════════════════════════════════════════════════════════════════ -->
        <div
          v-else-if="application.status === 'recommended'"
          class="space-y-4"
        >
          <!-- Summary card -->
          <div class="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 dark:border-purple-800 dark:from-purple-950/30 dark:to-neutral-900">
            <div class="mb-1 flex items-center gap-2">
              <div class="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40">
                <ShieldCheck class="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <p class="text-sm font-semibold text-purple-800 dark:text-purple-300">Awaiting Approval Decision</p>
            </div>
            <p class="text-xs text-purple-600 dark:text-purple-400">
              Recommended
              <strong class="text-purple-800 dark:text-purple-200">{{
                displayAmount(application.recommended_amount_formatted, application.recommended_amount)
              }}</strong>
              for <strong class="text-purple-800 dark:text-purple-200">{{ application.recommended_term }} months</strong>.
            </p>
          </div>

          <!-- Action row -->
          <div class="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div class="flex-1">
              <p class="text-sm font-semibold text-neutral-900 dark:text-white">Cast your approval decision</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">This will finalise the application outcome.</p>
            </div>
            <div class="flex gap-2">
              <button
                class="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                @click="openApproveModal"
              >
                <ThumbsUp class="h-4 w-4" />
                Approve
              </button>
              <button
                class="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                @click="openDeclineModal"
              >
                <ThumbsDown class="h-4 w-4" />
                Decline
              </button>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════════════
             APPROVED — tabbed layout
        ═══════════════════════════════════════════════════════════════════ -->
        <div v-else-if="application.status === 'approved'" class="space-y-3">

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
              @click="openDisburseModal"
            >
              <Banknote class="h-4 w-4" />
              Process Disbursement
            </button>
          </div>

          <!-- Tab container -->
          <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">

            <!-- Tab bar -->
            <div class="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-800/30">
              <nav class="-mb-px flex overflow-x-auto">
                <button
                  v-for="tab in approvedTabs"
                  :key="tab.key"
                  class="flex shrink-0 items-center gap-1.5 border-b-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200"
                  :class="approvedTab === tab.key
                    ? 'border-green-600 text-green-700 bg-white dark:text-green-400 dark:border-green-400 dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-200'"
                  @click="switchApprovedTab(tab.key)"
                >
                  <component :is="tab.icon" class="h-3.5 w-3.5" />
                  {{ tab.label }}
                </button>
              </nav>
            </div>

            <!-- ── GENERAL INFORMATION TAB ── -->
            <div v-if="approvedTab === 'general'" class="divide-y divide-neutral-100 dark:divide-neutral-800">

              <!-- Approved Amount Hero -->
              <div class="bg-gradient-to-br from-green-50 via-emerald-50/40 to-white px-6 py-5 dark:from-green-950/20 dark:via-emerald-950/10 dark:to-transparent">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-green-600 dark:text-green-500">Approved Loan</p>
                    <p class="text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">
                      {{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}
                    </p>
                    <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      over <span class="font-semibold text-neutral-700 dark:text-neutral-300">{{ application.approved_term }}</span> months
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 dark:bg-green-900/40">
                    <CheckCircle2 class="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span class="text-xs font-bold text-green-700 dark:text-green-400">Approved</span>
                  </div>
                </div>
              </div>

              <!-- Application Details + Appraisal -->
              <div class="grid divide-y divide-neutral-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-neutral-800">

                <!-- Application Details -->
                <div class="px-6 py-5">
                  <p class="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">Application Details</p>
                  <dl class="space-y-4">
                    <div>
                      <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Member</dt>
                      <dd class="text-sm font-semibold text-neutral-900 dark:text-white">{{ application.member?.name ?? '—' }}</dd>
                      <dd v-if="application.member?.member_no" class="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">{{ application.member.member_no }}</dd>
                    </div>
                    <div>
                      <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Loan Product</dt>
                      <dd class="text-sm font-semibold text-neutral-900 dark:text-white">{{ application.loan_product?.name ?? '—' }}</dd>
                      <dd v-if="application.loan_product?.code" class="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">{{ application.loan_product.code }}</dd>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Requested Amount</dt>
                        <dd class="tabular-nums text-sm font-semibold text-neutral-700 dark:text-neutral-300">{{ displayAmount(application.requested_amount_formatted, application.requested_amount) }}</dd>
                      </div>
                      <div>
                        <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Requested Term</dt>
                        <dd class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{{ application.requested_term ?? '—' }} months</dd>
                      </div>
                    </div>
                    <div v-if="application.loan_officer">
                      <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Loan Officer</dt>
                      <dd class="flex items-center gap-2">
                        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                          {{ application.loan_officer.name.charAt(0).toUpperCase() }}
                        </div>
                        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ application.loan_officer.name }}</span>
                      </dd>
                    </div>
                    <div class="grid grid-cols-2 gap-4" v-if="application.loan_product?.interest_rate || application.loan_product?.interest_method">
                      <div v-if="application.loan_product?.interest_rate">
                        <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Interest Rate</dt>
                        <dd class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                          {{ application.loan_product.interest_rate }}%
                          <span class="ml-1 text-[11px] font-normal text-neutral-400">
                            {{ application.loan_product.interest_period === 'per_month' ? 'per month' : 'per annum' }}
                          </span>
                        </dd>
                      </div>
                      <div v-if="application.loan_product?.interest_method">
                        <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Interest Method</dt>
                        <dd>
                          <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                            :class="application.loan_product.interest_method === 'flat'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'">
                            {{ application.loan_product.interest_method === 'flat' ? 'Flat Rate' : 'Reducing Balance' }}
                          </span>
                        </dd>
                      </div>
                    </div>
                    <div v-if="application.purpose">
                      <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Purpose</dt>
                      <dd class="text-sm text-neutral-700 dark:text-neutral-300">{{ application.purpose }}</dd>
                    </div>
                    <div v-if="application.repayment_source">
                      <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Repayment Source</dt>
                      <dd class="text-sm text-neutral-700 dark:text-neutral-300">{{ application.repayment_source }}</dd>
                    </div>
                  </dl>
                </div>

                <!-- Appraisal Summary -->
                <div v-if="application.risk_rating || application.recommended_amount" class="px-6 py-5">
                  <div class="mb-4 flex items-center justify-between">
                    <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">Appraisal Summary</p>
                    <span v-if="application.risk_rating" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize" :class="riskBadgeClass(application.risk_rating)">
                      <ShieldCheck class="h-3 w-3" />{{ application.risk_rating }} risk
                    </span>
                  </div>
                  <dl class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div v-if="application.recommended_amount">
                        <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-purple-400 dark:text-purple-500">Recommended</dt>
                        <dd class="tabular-nums text-sm font-bold text-purple-700 dark:text-purple-400">{{ displayAmount(application.recommended_amount_formatted, application.recommended_amount) }}</dd>
                        <dd v-if="application.recommended_term" class="text-[11px] text-purple-400">{{ application.recommended_term }} months</dd>
                      </div>
                      <div v-if="application.approved_amount">
                        <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-green-500">Approved</dt>
                        <dd class="tabular-nums text-sm font-bold text-green-700 dark:text-green-400">{{ displayAmount(application.approved_amount_formatted, application.approved_amount) }}</dd>
                        <dd v-if="application.approved_term" class="text-[11px] text-green-500">{{ application.approved_term }} months</dd>
                      </div>
                    </div>
                    <div v-if="application.recommended_by">
                      <dt class="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Appraised By</dt>
                      <dd class="flex items-center gap-2">
                        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
                          {{ application.recommended_by.name.charAt(0).toUpperCase() }}
                        </div>
                        <span class="text-sm text-neutral-700 dark:text-neutral-300">{{ application.recommended_by.name }}</span>
                      </dd>
                    </div>
                    <div v-if="application.appraisal_notes">
                      <dt class="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500">Appraisal Notes</dt>
                      <dd class="text-xs italic text-neutral-600 dark:text-neutral-400">{{ application.appraisal_notes }}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <!-- Committee / Approval Decisions -->
              <div v-if="committeeVotes?.length || application.approvals?.length" class="px-6 py-5">
                <div class="mb-4 flex items-center justify-between">
                  <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">Committee Votes</p>
                  <div v-if="application.quorum_required" class="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-500">
                    <span>Quorum: <span class="font-semibold text-neutral-600 dark:text-neutral-300">{{ application.quorum_required }}</span></span>
                    <span>Threshold: <span class="font-semibold text-neutral-600 dark:text-neutral-300">{{ application.approval_threshold }}</span></span>
                  </div>
                </div>

                <!-- Committee votes -->
                <div v-if="committeeVotes?.length" class="space-y-2">
                  <div
                    v-for="vote in committeeVotes"
                    :key="`cv-${vote.id ?? vote.staff_id}`"
                    class="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                    :class="vote.abstained
                      ? 'border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-800/20'
                      : vote.decision === 'approve'
                        ? 'border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
                        : 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'"
                  >
                    <div
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      :class="vote.abstained
                        ? 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                        : vote.decision === 'approve'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'"
                    >
                      {{ (vote.staff_name ?? 'U').charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ vote.staff_name ?? 'Unknown' }}</p>
                      <p v-if="vote.comment" class="truncate text-xs text-neutral-500 dark:text-neutral-400">{{ vote.comment }}</p>
                    </div>
                    <div class="flex shrink-0 flex-col items-end gap-1">
                      <span
                        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        :class="vote.abstained
                          ? 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                          : vote.decision === 'approve'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'"
                      >
                        <CheckCircle2 v-if="!vote.abstained && vote.decision === 'approve'" class="h-3 w-3" />
                        <XCircleIcon v-else-if="!vote.abstained" class="h-3 w-3" />
                        <CircleDot v-else class="h-3 w-3" />
                        {{ vote.abstained ? 'Abstained' : vote.decision === 'approve' ? 'Approved' : 'Declined' }}
                      </span>
                      <span class="text-[10px] text-neutral-400">{{ formatDate(vote.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Legacy approval votes -->
                <div v-else-if="application.approvals?.length" class="space-y-2">
                  <div
                    v-for="vote in application.approvals"
                    :key="`lv-${vote.id}`"
                    class="flex items-center gap-3 rounded-xl border px-4 py-3"
                    :class="vote.decision === 'approved'
                      ? 'border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
                      : 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'"
                  >
                    <div
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      :class="vote.decision === 'approved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'"
                    >
                      {{ (vote.approver?.name ?? 'U').charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ vote.approver?.name ?? 'Unknown' }}</p>
                      <p v-if="vote.comments" class="truncate text-xs text-neutral-500 dark:text-neutral-400">{{ vote.comments }}</p>
                    </div>
                    <div class="flex shrink-0 flex-col items-end gap-1">
                      <span
                        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        :class="vote.decision === 'approved'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'"
                      >
                        <CheckCircle2 v-if="vote.decision === 'approved'" class="h-3 w-3" />
                        <XCircleIcon v-else class="h-3 w-3" />
                        {{ vote.decision === 'approved' ? 'Approved' : 'Declined' }}
                      </span>
                      <span class="text-[10px] text-neutral-400">{{ formatDate(vote.decided_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- ── PROPOSED SCHEDULE TAB ── -->
            <div v-else-if="approvedTab === 'schedule'">

              <!-- Start date + recalculate -->
              <div class="flex flex-wrap items-center gap-3 border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
                <div class="flex items-center gap-2">
                  <CalendarDays class="h-4 w-4 text-neutral-400" />
                  <label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Proposed start date</label>
                </div>
                <input
                  v-model="scheduleStartDate"
                  type="date"
                  class="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-blue-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  @change="loadProposedSchedule"
                />
                <button
                  :disabled="scheduleLoading"
                  class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  @click="loadProposedSchedule"
                >
                  <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': scheduleLoading }" />
                  Recalculate
                </button>
              </div>

              <!-- Loading -->
              <div v-if="scheduleLoading" class="flex items-center justify-center py-16 text-sm text-neutral-400">
                <RefreshCw class="mr-2 h-4 w-4 animate-spin" /> Calculating schedule…
              </div>

              <!-- Error -->
              <div v-else-if="scheduleError" class="px-5 py-8 text-center text-sm text-red-500">{{ scheduleError }}</div>

              <!-- Content -->
              <div v-else-if="scheduleData" class="space-y-5 p-5">

                <!-- Method badge + rate -->
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    :class="scheduleData.interest_method === 'flat' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'">
                    {{ scheduleData.interest_method === 'flat' ? 'Flat Rate' : 'Reducing Balance' }}
                  </span>
                  <span class="text-[11px] text-neutral-400">·</span>
                  <span class="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {{ (scheduleData.monthly_rate * 100).toFixed(2) }}% {{ scheduleData.interest_period === 'per_month' ? 'per month' : 'per annum' }}
                  </span>
                </div>

                <!-- Summary tiles -->
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div class="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Loan Amount</p>
                    <p class="text-sm font-bold text-neutral-900 dark:text-white">{{ formatCurrency(scheduleData.amount) }}</p>
                  </div>
                  <div class="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400">Monthly Installment</p>
                    <p class="text-sm font-bold text-blue-700 dark:text-blue-400">{{ formatCurrency(scheduleData.summary?.monthly_installment) }}</p>
                  </div>
                  <div class="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Total Principal</p>
                    <p class="text-sm font-bold text-neutral-900 dark:text-white">{{ formatCurrency(scheduleData.summary?.total_principal) }}</p>
                  </div>
                  <div class="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 dark:border-orange-900/30 dark:bg-orange-900/10">
                    <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-400">Total Interest</p>
                    <p class="text-sm font-bold text-orange-600 dark:text-orange-400">{{ formatCurrency(scheduleData.summary?.total_interest) }}</p>
                  </div>
                  <div class="rounded-xl border border-green-100 bg-green-50/60 px-4 py-3 dark:border-green-900/30 dark:bg-green-900/10">
                    <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-500">Total Repayment</p>
                    <p class="text-sm font-bold text-green-700 dark:text-green-400">{{ formatCurrency(scheduleData.summary?.total_repayment) }}</p>
                  </div>
                </div>

                <!-- Amortisation table -->
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
                        <td class="px-3 py-2.5 text-right text-neutral-700 dark:text-neutral-300">{{ formatCurrency(inst.principal) }}</td>
                        <td class="px-3 py-2.5 text-right text-orange-600 dark:text-orange-400">{{ formatCurrency(inst.interest) }}</td>
                        <td class="px-3 py-2.5 text-right font-semibold text-neutral-900 dark:text-white">{{ formatCurrency(inst.total) }}</td>
                        <td class="px-3 py-2.5 text-right text-neutral-500 dark:text-neutral-400">{{ formatCurrency(inst.balance) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Empty: not yet loaded -->
              <div v-else class="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400">
                <Table2 class="h-8 w-8" />
                <p class="text-sm">Click Recalculate to generate the schedule.</p>
              </div>
            </div>

            <!-- ── DOCUMENTS TAB ── -->
            <div v-else-if="approvedTab === 'documents'" class="p-5">
              <LoanDocumentUploader
                v-if="application.id"
                ref="documentUploaderRef"
                :application-id="application.id"
                :editable="documentEditableStatuses.includes(application.status ?? '')"
                :current-stage="currentDocStage"
                @updated="loadApplication"
              />
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
              <ol v-else class="relative space-y-0 border-l border-neutral-200 dark:border-neutral-700 ml-3">
                <li v-for="(event, idx) in timeline" :key="idx" class="relative pl-6 pb-6 last:pb-0">
                  <!-- dot -->
                  <div class="absolute -left-[9px] flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white dark:border-neutral-900"
                    :class="timelineIconClass(event.type)">
                    <div class="h-1.5 w-1.5 rounded-full bg-current"></div>
                  </div>
                  <!-- content -->
                  <div class="rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p class="text-sm font-semibold text-neutral-900 dark:text-white">{{ event.title }}</p>
                        <p v-if="event.description" class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{{ event.description }}</p>
                        <p v-if="event.notes" class="mt-1 text-xs italic text-neutral-600 dark:text-neutral-400 border-l-2 border-neutral-300 dark:border-neutral-600 pl-2">"{{ event.notes }}"</p>
                      </div>
                      <div class="flex shrink-0 flex-col items-end gap-1">
                        <span class="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">{{ formatDateTime(event.timestamp) }}</span>
                        <span v-if="event.actor" class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          <UserCheck class="h-3 w-3" />{{ event.actor.name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              </ol>
            </div>

          </div>
        </div>

        <!-- Disbursed: loan account summary with tabs -->
        <div
          v-if="application.status === 'disbursed' && application.disbursed_loan"
          class="rounded-2xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-neutral-900 overflow-hidden"
        >
          <!-- Loan Account Header -->
          <div
            class="flex items-center justify-between gap-2 bg-emerald-50/50 px-6 py-4 dark:bg-emerald-900/10"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40"
              >
                <CreditCard class="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-neutral-900 dark:text-white">
                  Loan Account
                </h2>
                <p class="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {{ application.disbursed_loan.loan_no }}
                </p>
              </div>
            </div>
            <button
              class="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
              @click="
                router.push({
                  name: 'tenant-loan-account',
                  params: { id: application.disbursed_loan_id },
                })
              "
            >
              <CreditCard class="h-3.5 w-3.5" />
              View Loan Account
            </button>
          </div>

          <!-- Tabs navigation -->
          <div
            class="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20"
          >
            <nav class="-mb-px flex overflow-x-auto">
              <button
                v-for="tab in loanAccountTabs"
                :key="tab.key"
                class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 uppercase tracking-wider"
                :class="
                  loanAccountTab === tab.key
                    ? 'border-emerald-600 text-emerald-700 bg-white dark:text-emerald-400 dark:border-emerald-400 dark:bg-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-200'
                "
                @click="loanAccountTab = tab.key"
              >
                <component :is="tab.icon" class="h-3.5 w-3.5" />
                {{ tab.label }}
                <span
                  v-if="tab.key === 'documents' && documentUploaderRef?.hasMissing"
                  class="ml-0.5 inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse"
                />
              </button>
            </nav>
          </div>

          <!-- Tab content -->
          <div class="p-6">
            <!-- ── GENERAL INFORMATION TAB ── -->
            <div v-if="loanAccountTab === 'general'" class="grid gap-6 lg:grid-cols-2 items-start">
              <!-- ── LEFT COLUMN ── -->
              <div class="space-y-6">
                <!-- Loan Details -->
                <div
                  class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                    <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
                      Loan Details
                    </h3>
                  </div>
                  <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">No.</div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.disbursed_loan.loan_no }}
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">Status</div>
                      <div class="font-medium capitalize text-neutral-900 dark:text-white">
                        <span
                          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                          :class="statusBadgeClass(application.disbursed_loan?.status)"
                        >
                          {{ statusLabel(application.disbursed_loan?.status) || 'Disbursed' }}
                        </span>
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Loan Product
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.loan_product?.name ?? '—' }}
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Principal Amount
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{
                          application.disbursed_loan.principal_formatted ??
                          formatAmount(application.disbursed_loan.principal)
                        }}
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Net Disbursed
                      </div>
                      <div class="font-medium text-emerald-700 dark:text-emerald-400">
                        {{
                          application.disbursed_loan.net_disbursed_amount_formatted ??
                          formatAmount(application.disbursed_loan.net_disbursed_amount)
                        }}
                      </div>
                    </div>
                    <div
                      v-if="Number(application.disbursed_loan.processing_fee) > 0"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Processing Fee
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{
                          application.disbursed_loan.processing_fee_formatted ??
                          formatAmount(application.disbursed_loan.processing_fee)
                        }}
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Interest Rate
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.disbursed_loan.interest_rate }}%
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">Term</div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.disbursed_loan.term_months }} months
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Date Disbursed
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.disbursed_at ? formatDate(application.disbursed_at) : '—' }}
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Disbursement Method
                      </div>
                      <div class="font-medium capitalize text-neutral-900 dark:text-white">
                        {{
                          application.disbursed_loan.disbursement_method?.replace(/_/g, ' ') ?? '—'
                        }}
                      </div>
                    </div>
                    <div
                      v-if="application.disbursed_loan.disbursement_reference"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Reference
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.disbursed_loan.disbursement_reference }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Application Details -->
                <div
                  class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                    <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
                      Application Details
                    </h3>
                  </div>
                  <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Requested Amount
                      </div>
                      <div class="font-bold text-neutral-900 dark:text-white">
                        {{
                          displayAmount(
                            application.requested_amount_formatted,
                            application.requested_amount,
                          )
                        }}
                      </div>
                    </div>
                    <div
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Requested Term
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.requested_term ?? '—' }} months
                      </div>
                    </div>
                    <div
                      v-if="application.purpose"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">Purpose</div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.purpose }}
                      </div>
                    </div>
                    <div
                      v-if="application.repayment_source"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Repayment Source
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.repayment_source }}
                      </div>
                    </div>
                    <div
                      v-if="application.rejection_reason"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-red-400">Rejection Reason</div>
                      <div class="font-medium text-red-600 dark:text-red-400">
                        {{ application.rejection_reason }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── RIGHT COLUMN ── -->
              <div class="space-y-6">
                <!-- Member & People Info -->
                <div
                  class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                    <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
                      People Information
                    </h3>
                  </div>
                  <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
                    <div
                      v-if="application.member"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Member Name
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.member.name }}
                      </div>
                    </div>
                    <div
                      v-if="application.member?.member_no"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Member No.
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.member.member_no }}
                      </div>
                    </div>
                    <div
                      v-if="application.disbursed_loan?.disbursed_by_staff"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Disbursing Officer
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.disbursed_loan.disbursed_by_staff.name }}
                      </div>
                    </div>
                    <div
                      v-if="application.created_by"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Created By
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.created_by.name }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Appraisal Summary -->
                <div
                  v-if="application.risk_rating || application.recommended_amount"
                  class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div
                    class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800"
                  >
                    <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
                      Appraisal Summary
                    </h3>
                    <span
                      v-if="application.risk_rating"
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                      :class="riskBadgeClass(application.risk_rating)"
                    >
                      <ShieldCheck class="h-3 w-3" />
                      {{ application.risk_rating }} risk
                    </span>
                  </div>
                  <div class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800">
                    <div
                      v-if="application.recommended_amount"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Recommended Amount
                      </div>
                      <div class="font-bold text-purple-700 dark:text-purple-400">
                        {{
                          displayAmount(
                            application.recommended_amount_formatted,
                            application.recommended_amount,
                          )
                        }}
                      </div>
                    </div>
                    <div
                      v-if="application.recommended_term"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Recommended Term
                      </div>
                      <div class="font-medium text-purple-700 dark:text-purple-400">
                        {{ application.recommended_term }} months
                      </div>
                    </div>
                    <div
                      v-if="application.approved_amount"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Approved Amount
                      </div>
                      <div class="font-bold text-green-700 dark:text-green-400">
                        {{
                          displayAmount(
                            application.approved_amount_formatted,
                            application.approved_amount,
                          )
                        }}
                      </div>
                    </div>
                    <div
                      v-if="application.approved_term"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Approved Term
                      </div>
                      <div class="font-medium text-green-700 dark:text-green-400">
                        {{ application.approved_term }} months
                      </div>
                    </div>
                    <div
                      v-if="application.recommended_by"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Appraised By
                      </div>
                      <div class="font-medium text-neutral-900 dark:text-white">
                        {{ application.recommended_by.name }}
                      </div>
                    </div>
                    <div
                      v-if="application.appraisal_notes"
                      class="grid grid-cols-2 px-4 py-2.5 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div class="font-medium text-neutral-500 dark:text-neutral-400">
                        Appraisal Notes
                      </div>
                      <div class="font-medium text-neutral-700 dark:text-neutral-300">
                        {{ application.appraisal_notes }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Approval Votes / Committee -->
                <div
                  v-if="application.approvals?.length || committeeVotes?.length"
                  class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                    <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-white">
                      Approval Decisions
                    </h3>
                  </div>
                  <div
                    v-if="committeeVotes?.length"
                    class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800"
                  >
                    <div
                      v-for="vote in committeeVotes"
                      :key="`cm-${vote.id}`"
                      class="grid grid-cols-2 px-4 py-3 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div
                        class="font-medium text-neutral-500 dark:text-neutral-400 flex flex-col gap-0.5"
                      >
                        <span class="text-neutral-900 dark:text-white">{{
                          vote.staff_name ?? 'Unknown'
                        }}</span>
                        <span class="text-[11px]">{{ formatDate(vote.created_at) }}</span>
                      </div>
                      <div class="flex flex-col gap-1 items-start justify-center">
                        <div
                          class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          :class="
                            vote.abstained
                              ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                              : vote.decision === 'approve'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          "
                        >
                          <CheckCircle2
                            v-if="!vote.abstained && vote.decision === 'approve'"
                            class="h-3 w-3"
                          />
                          <XCircleIcon
                            v-else-if="!vote.abstained && vote.decision === 'decline'"
                            class="h-3 w-3"
                          />
                          <CircleDot v-else class="h-3 w-3" />
                          {{
                            vote.abstained
                              ? 'Abstained'
                              : vote.decision === 'approve'
                                ? 'Approved'
                                : 'Declined'
                          }}
                        </div>
                        <span
                          v-if="vote.comment"
                          class="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 line-clamp-2"
                          :title="vote.comment"
                          >{{ vote.comment }}</span
                        >
                      </div>
                    </div>
                  </div>
                  <div
                    v-else-if="application.approvals?.length"
                    class="text-[13px] divide-y divide-neutral-100 dark:divide-neutral-800"
                  >
                    <div
                      v-for="vote in application.approvals"
                      :key="`lg-${vote.id}`"
                      class="grid grid-cols-2 px-4 py-3 even:bg-neutral-50/80 dark:even:bg-neutral-800/30 bg-white dark:bg-neutral-900"
                    >
                      <div
                        class="font-medium text-neutral-500 dark:text-neutral-400 flex flex-col gap-0.5"
                      >
                        <span class="text-neutral-900 dark:text-white">{{
                          vote.approver?.name ?? 'Unknown'
                        }}</span>
                        <span class="text-[11px]">{{ formatDate(vote.decided_at) }}</span>
                      </div>
                      <div class="flex flex-col gap-1 items-start justify-center">
                        <div
                          class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          :class="
                            vote.decision === 'approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          "
                        >
                          <CheckCircle2 v-if="vote.decision === 'approved'" class="h-3 w-3" />
                          <XCircleIcon v-else class="h-3 w-3" />
                          {{ vote.decision === 'approved' ? 'Approved' : 'Declined' }}
                        </div>
                        <span
                          v-if="vote.comments"
                          class="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 line-clamp-2"
                          :title="vote.comments"
                          >{{ vote.comments }}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── TRANSACTION HISTORY TAB ── -->
            <div v-else-if="loanAccountTab === 'transactions'">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Transaction History
                </h3>
              </div>
              <div
                class="rounded-xl border border-neutral-100 bg-neutral-50/50 p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-800/30"
              >
                <History class="mx-auto mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  No transactions yet
                </p>
                <p class="mt-1 text-xs text-neutral-400">
                  Transactions will appear here once the loan involves repayments, penalties, or
                  adjustments.
                </p>
              </div>
            </div>

            <!-- ── PAYMENT SCHEDULE TAB ── -->
            <div v-else-if="loanAccountTab === 'schedule'">
              <div v-if="application.disbursed_loan.schedules?.length">
                <div class="mb-3 flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Repayment Schedule
                  </h3>
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    {{ application.disbursed_loan.schedules.length }} installments
                  </span>
                </div>
                <div
                  class="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800"
                >
                  <table class="w-full text-xs">
                    <thead class="bg-neutral-50 dark:bg-neutral-800/60">
                      <tr>
                        <th
                          class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400"
                        >
                          #
                        </th>
                        <th
                          class="px-3 py-2.5 text-left font-medium text-neutral-500 dark:text-neutral-400"
                        >
                          Due Date
                        </th>
                        <th
                          class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                        >
                          Principal
                        </th>
                        <th
                          class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                        >
                          Interest
                        </th>
                        <th
                          class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                        >
                          Total
                        </th>
                        <th
                          class="px-3 py-2.5 text-right font-medium text-neutral-500 dark:text-neutral-400"
                        >
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                      <tr
                        v-for="row in showAllSchedule
                          ? application.disbursed_loan.schedules
                          : application.disbursed_loan.schedules.slice(0, 6)"
                        :key="row.installment_no"
                        class="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <td class="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                          {{ row.installment_no }}
                        </td>
                        <td class="px-3 py-2 text-neutral-700 dark:text-neutral-300">
                          {{ formatDate(row.due_date) }}
                        </td>
                        <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                          {{ formatAmount(row.principal_due) }}
                        </td>
                        <td class="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
                          {{ formatAmount(row.interest_due) }}
                        </td>
                        <td
                          class="px-3 py-2 text-right font-medium text-neutral-900 dark:text-white"
                        >
                          {{ formatAmount(row.total_due) }}
                        </td>
                        <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">
                          {{ formatAmount(row.outstanding_balance) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  v-if="application.disbursed_loan.schedules.length > 6"
                  class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-100 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-50 transition-colors dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50"
                  @click="showAllSchedule = !showAllSchedule"
                >
                  <template v-if="showAllSchedule">
                    <ChevronUp class="h-3.5 w-3.5" /> Show less
                  </template>
                  <template v-else>
                    <ChevronDown class="h-3.5 w-3.5" />
                    Show all {{ application.disbursed_loan.schedules.length }} installments
                  </template>
                </button>
              </div>
              <div
                v-else
                class="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2"
              >
                <ClipboardList class="h-8 w-8" />
                <p class="text-sm">No payment schedule available.</p>
              </div>
            </div>

            <!-- ── DOCUMENTS TAB ── -->
            <div v-else-if="loanAccountTab === 'documents'">
              <LoanDocumentUploader
                v-if="application.disbursed_loan?.id"
                ref="documentUploaderRef"
                :application-id="application.disbursed_loan.id"
                :editable="documentEditableStatuses.includes(application.status ?? '')"
                :current-stage="currentDocStage"
                @updated="loadApplication"
              />
              <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
                <FileText class="h-8 w-8" />
                <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Loan Documents</p>
                <p class="text-xs text-neutral-400 dark:text-neutral-500">Documents attached to this loan account will appear here.</p>
              </div>
            </div>

            <!-- ── LOAN ACTIVITIES TAB ── -->
            <div v-else-if="loanAccountTab === 'activities'">
              <div class="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
                <Activity class="h-8 w-8" />
                <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Loan Activities
                </p>
                <p class="text-xs text-neutral-400 dark:text-neutral-500">
                  Repayments, adjustments, and other loan activity will appear here.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Application details -->
        <div
          v-if="application.status !== 'disbursed' && application.status !== 'approved'"
          class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">
            Application Details
          </h2>
          <dl class="grid gap-4 sm:grid-cols-2">
            <div>
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Member
              </dt>
              <dd class="mt-1 font-medium text-neutral-900 dark:text-white">
                {{ application.member?.name ?? '—' }}
              </dd>
              <dd
                v-if="application.member?.member_no"
                class="text-xs text-neutral-400 dark:text-neutral-500"
              >
                {{ application.member.member_no }}
              </dd>
            </div>
            <div>
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Loan Product
              </dt>
              <dd class="mt-1 font-medium text-neutral-900 dark:text-white">
                {{ application.loan_product?.name ?? '—' }}
              </dd>
              <dd
                v-if="application.loan_product?.code"
                class="text-xs text-neutral-400 dark:text-neutral-500"
              >
                {{ application.loan_product.code }}
              </dd>
            </div>
            <div>
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Requested Amount
              </dt>
              <dd class="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
                {{
                  displayAmount(
                    application.requested_amount_formatted,
                    application.requested_amount,
                  )
                }}
              </dd>
            </div>
            <div>
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Requested Term
              </dt>
              <dd class="mt-1 font-medium text-neutral-900 dark:text-white">
                {{ application.requested_term ?? '—' }} months
              </dd>
            </div>
            <div v-if="application.purpose" class="sm:col-span-2">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Purpose
              </dt>
              <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {{ application.purpose }}
              </dd>
            </div>
            <div v-if="application.repayment_source" class="sm:col-span-2">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Repayment Source
              </dt>
              <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {{ application.repayment_source }}
              </dd>
            </div>
            <div v-if="application.rejection_reason" class="sm:col-span-2">
              <dt class="text-xs font-medium uppercase tracking-wide text-red-400">
                Rejection Reason
              </dt>
              <dd class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ application.rejection_reason }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Appraisal summary (visible once appraised) -->
        <div
          v-if="
            application.status !== 'disbursed' &&
            application.status !== 'approved' &&
            (application.risk_rating || application.recommended_amount)
          "
          class="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm dark:border-purple-900/40 dark:bg-neutral-900"
        >
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-neutral-900 dark:text-white">
              Appraisal Summary
            </h2>
            <span
              v-if="application.risk_rating"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
              :class="riskBadgeClass(application.risk_rating)"
            >
              <ShieldCheck class="h-3 w-3" />
              {{ application.risk_rating }} risk
            </span>
          </div>
          <dl class="grid gap-4 sm:grid-cols-2">
            <div v-if="application.recommended_amount">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Recommended Amount
              </dt>
              <dd class="mt-1 text-lg font-bold text-purple-700 dark:text-purple-400">
                {{
                  displayAmount(
                    application.recommended_amount_formatted,
                    application.recommended_amount,
                  )
                }}
              </dd>
            </div>
            <div v-if="application.recommended_term">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Recommended Term
              </dt>
              <dd class="mt-1 font-medium text-purple-700 dark:text-purple-400">
                {{ application.recommended_term }} months
              </dd>
            </div>
            <div v-if="application.approved_amount">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Approved Amount
              </dt>
              <dd class="mt-1 text-lg font-bold text-green-700 dark:text-green-400">
                {{
                  displayAmount(application.approved_amount_formatted, application.approved_amount)
                }}
              </dd>
            </div>
            <div v-if="application.approved_term">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Approved Term
              </dt>
              <dd class="mt-1 font-medium text-green-700 dark:text-green-400">
                {{ application.approved_term }} months
              </dd>
            </div>
            <div v-if="application.recommended_by" class="sm:col-span-2">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Appraised By
              </dt>
              <dd class="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                {{ application.recommended_by.name }}
              </dd>
            </div>
            <div v-if="application.appraisal_notes" class="sm:col-span-2">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500"
              >
                Appraisal Notes
              </dt>
              <dd class="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {{ application.appraisal_notes }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Return for correction notice (LO level) -->
        <div
          v-if="application.status === 'draft' && application.return_reason"
          class="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20"
        >
          <Undo2 class="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
          <div>
            <p class="text-sm font-semibold text-orange-900 dark:text-orange-200">
              Returned for Correction
            </p>
            <p class="mt-1 text-sm text-orange-700 dark:text-orange-300">
              {{ application.return_reason }}
            </p>
            <p
              v-if="application.returned_at"
              class="mt-1 text-xs text-orange-500 dark:text-orange-400"
            >
              Returned on {{ formatDate(application.returned_at) }}
            </p>
            <p class="mt-2 text-xs text-orange-600 dark:text-orange-400">
              Please address the issues above, then edit and resubmit the application.
            </p>
          </div>
        </div>

        <!-- BM return for correction notice -->
        <div
          v-if="application.status === 'returned_for_correction' && application.correction_reason"
          class="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20"
        >
          <Undo2 class="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
          <div>
            <p class="text-sm font-semibold text-orange-900 dark:text-orange-200">
              BM Correction Reason
            </p>
            <p class="mt-1 text-sm text-orange-700 dark:text-orange-300">
              {{ application.correction_reason }}
            </p>
          </div>
        </div>

        <!-- Cancellation notice -->
        <div
          v-if="application.status === 'cancelled' && application.cancellation_reason"
          class="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-700 dark:bg-neutral-800/60"
        >
          <AlertTriangle class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
          <div>
            <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Application Cancelled
            </p>
            <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {{ application.cancellation_reason }}
            </p>
            <p
              v-if="application.cancelled_at"
              class="mt-1 text-xs text-neutral-400 dark:text-neutral-500"
            >
              Cancelled on {{ formatDate(application.cancelled_at) }}
            </p>
            <p class="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              You can reopen this application as a draft to make corrections and resubmit.
            </p>
          </div>
        </div>

        <!-- Approval votes (legacy simple flow) -->
        <div
          v-if="application.status !== 'disbursed' && application.status !== 'approved' && application.approvals?.length"
          class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">
            Approval Votes
          </h2>
          <div class="space-y-3">
            <div
              v-for="vote in application.approvals"
              :key="vote.id"
              class="flex items-start gap-3 rounded-xl border p-4"
              :class="
                vote.decision === 'approved'
                  ? 'border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
                  : 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'
              "
            >
              <div
                class="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                :class="
                  vote.decision === 'approved'
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : 'bg-red-100 dark:bg-red-900/40'
                "
              >
                <CheckCircle2
                  v-if="vote.decision === 'approved'"
                  class="h-4 w-4 text-green-600 dark:text-green-400"
                />
                <XCircleIcon v-else class="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    {{ vote.approver?.name ?? 'Unknown Approver' }}
                  </p>
                  <span class="text-xs text-neutral-400 dark:text-neutral-500">{{
                    formatDate(vote.decided_at)
                  }}</span>
                </div>
                <p v-if="vote.comments" class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {{ vote.comments }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Committee votes (three-tier flow) -->
        <div
          v-if="application.status !== 'disbursed' && application.status !== 'approved' && committeeVotes?.length"
          class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h2 class="mb-4 text-base font-semibold text-neutral-900 dark:text-white">
            Committee Votes
          </h2>
          <div class="mb-3 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Quorum: {{ application.quorum_required ?? '—' }}</span>
            <span>Threshold: {{ application.approval_threshold ?? '—' }}</span>
            <span
              v-if="application.unanimity_required"
              class="text-amber-600 dark:text-amber-400 font-medium"
              >Unanimity Required</span
            >
          </div>
          <div class="space-y-3">
            <div
              v-for="vote in committeeVotes"
              :key="vote.id"
              class="flex items-start gap-3 rounded-xl border p-4"
              :class="
                vote.abstained
                  ? 'border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-800/10'
                  : vote.decision === 'approve'
                    ? 'border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10'
                    : 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'
              "
            >
              <div
                class="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                :class="
                  vote.abstained
                    ? 'bg-neutral-100 dark:bg-neutral-800'
                    : vote.decision === 'approve'
                      ? 'bg-green-100 dark:bg-green-900/40'
                      : 'bg-red-100 dark:bg-red-900/40'
                "
              >
                <CheckCircle2
                  v-if="!vote.abstained && vote.decision === 'approve'"
                  class="h-4 w-4 text-green-600 dark:text-green-400"
                />
                <XCircleIcon
                  v-else-if="!vote.abstained && vote.decision === 'decline'"
                  class="h-4 w-4 text-red-500 dark:text-red-400"
                />
                <CircleDot v-else class="h-4 w-4 text-neutral-400" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    {{ vote.staff_name ?? 'Unknown' }}
                  </p>
                  <span class="text-xs text-neutral-400 dark:text-neutral-500">{{
                    formatDate(vote.created_at)
                  }}</span>
                </div>
                <p
                  v-if="vote.abstained"
                  class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400"
                >
                  Abstained
                </p>
                <p v-if="vote.comment" class="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {{ vote.comment }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Right column ─────────────────────────────────────────────── -->
      <div class="flex flex-col gap-6">
        <!-- Documents — hidden for approved status (lives in the Documents tab instead) -->
        <LoanDocumentUploader
          v-if="application.id && application.status !== 'approved'"
          ref="documentUploaderRef"
          :application-id="application.id"
          :editable="documentEditableStatuses.includes(application.status ?? '')"
          :current-stage="currentDocStage"
          @updated="loadApplication"
        />

        <!-- Collateral & Securities — hidden on approved status -->
        <LoanCollateralManager
          v-if="application.id && application.status !== 'approved'"
          :application-id="application.id"
          :editable="editableStatuses.includes(application.status ?? '')"
          @updated="loadApplication"
        />

        <!-- Key dates -->
        <div
          class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Key Dates</h3>
          <dl class="grid gap-3 text-sm">
            <div class="flex justify-between gap-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Created</dt>
              <dd class="text-right">
                <span class="block font-medium text-neutral-900 dark:text-white">{{
                  formatDate(application.created_at)
                }}</span>
                <span
                  v-if="application.created_by?.name"
                  class="text-xs text-neutral-400 dark:text-neutral-500"
                  >by {{ application.created_by.name }}</span
                >
              </dd>
            </div>
            <div v-if="application.submitted_at" class="flex justify-between gap-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Submitted</dt>
              <dd class="font-medium text-neutral-900 dark:text-white">
                {{ formatDate(application.submitted_at) }}
              </dd>
            </div>
            <div v-if="application.reviewed_at" class="flex justify-between gap-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Taken for Review</dt>
              <dd class="font-medium text-neutral-900 dark:text-white">
                {{ formatDate(application.reviewed_at) }}
              </dd>
            </div>
            <div v-if="application.recommended_at" class="flex justify-between gap-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Recommended</dt>
              <dd class="font-medium text-purple-700 dark:text-purple-400">
                {{ formatDate(application.recommended_at) }}
              </dd>
            </div>
            <div v-if="application.approved_at" class="flex justify-between gap-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Approved</dt>
              <dd class="font-medium text-green-700 dark:text-green-400">
                {{ formatDate(application.approved_at) }}
              </dd>
            </div>
            <div v-if="application.rejected_at" class="flex justify-between gap-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Rejected</dt>
              <dd class="font-medium text-red-600 dark:text-red-400">
                {{ formatDate(application.rejected_at) }}
              </dd>
            </div>
            <div v-if="application.disbursed_at" class="flex justify-between gap-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Disbursed</dt>
              <dd class="font-medium text-emerald-700 dark:text-emerald-400">
                {{ formatDate(application.disbursed_at) }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Audit timeline — hidden for approved status (lives in the tab instead) -->
        <div
          v-if="application.status !== 'approved'"
          class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Audit Trail</h3>
          <div v-if="timelineLoading" class="py-4 text-center text-xs text-neutral-400">
            Loading…
          </div>
          <div v-else-if="!timeline.length" class="py-4 text-center text-xs text-neutral-400">
            No events yet.
          </div>
          <ol
            v-else
            class="relative space-y-5 border-l border-neutral-200 pl-5 dark:border-neutral-700"
          >
            <li v-for="(event, idx) in timeline" :key="idx" class="relative">
              <!-- dot -->
              <div
                class="absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-neutral-900"
                :class="timelineIconClass(event.type)"
              >
                <CircleDot v-if="event.type === 'created'" class="h-2.5 w-2.5" />
                <Clock v-else-if="event.type === 'status_change'" class="h-2.5 w-2.5" />
                <FileText v-else-if="event.type === 'document_uploaded'" class="h-2.5 w-2.5" />
                <ThumbsUp v-else-if="event.type === 'approval_vote'" class="h-2.5 w-2.5" />
              </div>
              <p class="text-xs text-neutral-400 dark:text-neutral-500">
                {{ formatDateTime(event.timestamp) }}
              </p>
              <p class="mt-0.5 text-sm font-medium text-neutral-900 dark:text-white">
                {{ event.title }}
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ event.description }}</p>
              <p v-if="event.actor?.name" class="text-xs text-neutral-400 dark:text-neutral-500">
                by {{ event.actor.name }}
              </p>
              <p
                v-if="event.notes"
                class="mt-1 text-xs italic text-neutral-400 dark:text-neutral-500"
              >
                {{ event.notes }}
              </p>
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
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCancelModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @mousedown.self="closeCancelModal"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div
            class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div
              class="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <div class="flex items-center gap-2">
                <div
                  class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30"
                >
                  <XCircle class="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
                    Cancel Application
                  </h3>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    This will stop the application process.
                  </p>
                </div>
              </div>
              <button
                class="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors dark:hover:bg-neutral-800"
                @click="closeCancelModal"
              >
                <XCircle class="h-4 w-4" />
              </button>
            </div>
            <div class="px-6 py-5">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Reason <span class="text-red-400">*</span></label
              >
              <textarea
                v-model="cancelReason"
                rows="4"
                placeholder="e.g. Member failed to provide required payslips…"
                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                :class="cancelReasonError ? 'border-red-300 dark:border-red-700' : ''"
                @keydown.esc="closeCancelModal"
              />
              <p v-if="cancelReasonError" class="mt-1 text-xs text-red-500">
                {{ cancelReasonError }}
              </p>
              <p class="mt-1 text-right text-xs text-neutral-400">
                {{ cancelReason.length }} / 500
              </p>
            </div>
            <div
              class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <button
                class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="closeCancelModal"
              >
                Keep
              </button>
              <button
                :disabled="cancelling || !cancelReason.trim()"
                class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                @click="confirmCancel"
              >
                <XCircle class="h-4 w-4" />{{ cancelling ? 'Cancelling…' : 'Confirm Cancellation' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ── Appraise modal ── -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showAppraiseModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @mousedown.self="showAppraiseModal = false"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          appear
        >
          <div
            class="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div
              class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-nfuko-primary/10">
                <ClipboardCheck class="h-5 w-5 text-nfuko-primary" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
                  Appraise & Recommend
                </h3>
                <p class="text-xs text-neutral-500">Set recommended terms and risk rating.</p>
              </div>
            </div>
            <div class="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div>
                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400"
                  >Recommended Amount <span class="text-red-400">*</span></label
                >
                <input
                  v-model="appraiseForm.recommended_amount"
                  type="number"
                  min="1"
                  placeholder="0.00"
                  class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  :class="appraiseErrors.recommended_amount ? 'border-red-300' : ''"
                />
                <p v-if="appraiseErrors.recommended_amount" class="mt-1 text-xs text-red-500">
                  {{ appraiseErrors.recommended_amount }}
                </p>
              </div>
              <div>
                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400"
                  >Recommended Term (months) <span class="text-red-400">*</span></label
                >
                <input
                  v-model="appraiseForm.recommended_term"
                  type="number"
                  min="1"
                  placeholder="12"
                  class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  :class="appraiseErrors.recommended_term ? 'border-red-300' : ''"
                />
                <p v-if="appraiseErrors.recommended_term" class="mt-1 text-xs text-red-500">
                  {{ appraiseErrors.recommended_term }}
                </p>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400"
                  >Risk Rating <span class="text-red-400">*</span></label
                >
                <div class="mt-1.5 grid grid-cols-4 gap-2">
                  <button
                    v-for="r in ['low', 'medium', 'high', 'critical']"
                    :key="r"
                    type="button"
                    class="rounded-xl border px-3 py-2 text-xs font-medium capitalize transition-colors"
                    :class="
                      appraiseForm.risk_rating === r
                        ? riskBadgeClass(r) + ' border-current'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700'
                    "
                    @click="appraiseForm.risk_rating = r"
                  >
                    {{ r }}
                  </button>
                </div>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400"
                  >Appraisal Notes</label
                >
                <textarea
                  v-model="appraiseForm.appraisal_notes"
                  rows="3"
                  placeholder="Optional notes…"
                  class="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>
            </div>
            <div
              class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <button
                class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="showAppraiseModal = false"
              >
                Cancel
              </button>
              <button
                :disabled="appraising"
                class="flex items-center gap-2 rounded-xl bg-nfuko-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                @click="submitAppraise"
              >
                <ClipboardCheck class="h-4 w-4" />{{
                  appraising ? 'Saving…' : 'Appraise & Recommend'
                }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ── Request Documents modal ── -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showRequestDocsModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @mousedown.self="showRequestDocsModal = false"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          appear
        >
          <div
            class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div
              class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <div
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30"
              >
                <FileSearch class="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
                  Request Documents
                </h3>
                <p class="text-xs text-neutral-500">Specify which documents are needed.</p>
              </div>
            </div>
            <div class="px-6 py-5">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Note <span class="text-red-400">*</span></label
              >
              <textarea
                v-model="requestDocsNote"
                rows="4"
                placeholder="e.g. Please provide the last 3 months' payslips and bank statements…"
                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                :class="requestDocsError ? 'border-red-300' : ''"
              />
              <p v-if="requestDocsError" class="mt-1 text-xs text-red-500">
                {{ requestDocsError }}
              </p>
            </div>
            <div
              class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <button
                class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="showRequestDocsModal = false"
              >
                Cancel
              </button>
              <button
                :disabled="requestingDocs"
                class="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                @click="submitRequestDocs"
              >
                <FileSearch class="h-4 w-4" />{{ requestingDocs ? 'Saving…' : 'Request Documents' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ── Return for Correction modal ── -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showReturnModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @mousedown.self="showReturnModal = false"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          appear
        >
          <div
            class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div
              class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <div
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30"
              >
                <Undo2 class="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
                  Return for Correction
                </h3>
                <p class="text-xs text-neutral-500">
                  Application will go back to draft for the member to fix.
                </p>
              </div>
            </div>
            <div class="px-6 py-5">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Reason <span class="text-red-400">*</span></label
              >
              <textarea
                v-model="returnReason"
                rows="4"
                placeholder="e.g. The requested amount exceeds the member's eligible limit. Please revise and resubmit…"
                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                :class="returnError ? 'border-red-300' : ''"
              />
              <p v-if="returnError" class="mt-1 text-xs text-red-500">{{ returnError }}</p>
            </div>
            <div
              class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <button
                class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="showReturnModal = false"
              >
                Cancel
              </button>
              <button
                :disabled="returning"
                class="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                @click="submitReturn"
              >
                <Undo2 class="h-4 w-4" />{{ returning ? 'Returning…' : 'Return for Correction' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ── Reject (appraisal) modal ── -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showRejectModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @mousedown.self="showRejectModal = false"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          appear
        >
          <div
            class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div
              class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <div
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30"
              >
                <XCircleIcon class="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
                  Reject Application
                </h3>
                <p class="text-xs text-neutral-500">This action cannot be undone.</p>
              </div>
            </div>
            <div class="px-6 py-5">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Reason <span class="text-red-400">*</span></label
              >
              <textarea
                v-model="rejectReason"
                rows="4"
                placeholder="e.g. Member does not meet the minimum savings threshold for this product…"
                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                :class="rejectError ? 'border-red-300' : ''"
              />
              <p v-if="rejectError" class="mt-1 text-xs text-red-500">{{ rejectError }}</p>
            </div>
            <div
              class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <button
                class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="showRejectModal = false"
              >
                Cancel
              </button>
              <button
                :disabled="rejecting"
                class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                @click="submitReject"
              >
                <XCircleIcon class="h-4 w-4" />{{ rejecting ? 'Rejecting…' : 'Confirm Rejection' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ── Approve modal ── -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showApproveModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @mousedown.self="showApproveModal = false"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          appear
        >
          <div
            class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div
              class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <div
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30"
              >
                <ThumbsUp class="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
                  Approve Application
                </h3>
                <p class="text-xs text-neutral-500">Record your approval vote.</p>
              </div>
            </div>
            <div class="px-6 py-5">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Comments <span class="text-neutral-400 font-normal">(optional)</span></label
              >
              <textarea
                v-model="approveComments"
                rows="3"
                placeholder="Any comments on your approval…"
                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <div
              class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <button
                class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="showApproveModal = false"
              >
                Cancel
              </button>
              <button
                :disabled="approving"
                class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                @click="submitApprove"
              >
                <ThumbsUp class="h-4 w-4" />{{ approving ? 'Saving…' : 'Confirm Approval' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ── Decline modal ── -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showDeclineModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @mousedown.self="showDeclineModal = false"
      >
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          appear
        >
          <div
            class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div
              class="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <div
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30"
              >
                <ThumbsDown class="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
                  Decline Application
                </h3>
                <p class="text-xs text-neutral-500">This will move the application to rejected.</p>
              </div>
            </div>
            <div class="px-6 py-5">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >Reason <span class="text-red-400">*</span></label
              >
              <textarea
                v-model="declineReason"
                rows="4"
                placeholder="e.g. Application does not meet the credit committee's requirements…"
                class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                :class="declineError ? 'border-red-300' : ''"
              />
              <p v-if="declineError" class="mt-1 text-xs text-red-500">{{ declineError }}</p>
            </div>
            <div
              class="flex justify-end gap-3 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800"
            >
              <button
                class="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="showDeclineModal = false"
              >
                Cancel
              </button>
              <button
                :disabled="declining"
                class="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                @click="submitDecline"
              >
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

  <!-- Vote Cast Modal -->
  <VoteCastModal
    :open="showVoteModal"
    :submitting="voting"
    :committee-members="committeeMembers"
    @close="showVoteModal = false"
    @submit="submitVote"
  />

  <!-- BM Recommend Modal -->
  <BMRecommendModal
    :open="showBMRecommendModal"
    :submitting="bmRecommending"
    @close="showBMRecommendModal = false"
    @submit="submitBMRecommend"
  />

  <!-- BM Return for Correction Modal -->
  <BMReturnForCorrectionModal
    :open="showBMReturnModal"
    :submitting="bmReturning"
    @close="showBMReturnModal = false"
    @submit="submitBMReturn"
  />
</template>
