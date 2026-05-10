<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLoanApplicationShow } from '../composables/useLoanApplicationShow'
import { useLoanAppraisalActions } from '../composables/useLoanAppraisalActions'
import { useLoanDisbursement } from '../composables/useLoanDisbursement'
import LoanApplicationHeader from '../components/LoanApplicationHeader.vue'
import LoanWorkflowPipeline from '../components/LoanWorkflowPipeline.vue'
import LoanActionPanel from '../components/LoanActionPanel.vue'
import LoanCommitteeVotingPanel from '../components/LoanCommitteeVotingPanel.vue'
import LoanApprovedSection from '../components/LoanApprovedSection.vue'
import LoanApplicationDetails from '../components/LoanApplicationDetails.vue'
import LoanAppraisalSummary from '../components/LoanAppraisalSummary.vue'
import LoanStatusNotices from '../components/LoanStatusNotices.vue'
import LoanVoteDisplays from '../components/LoanVoteDisplays.vue'
import LoanAuditTrail from '../components/LoanAuditTrail.vue'
import LoanKeyDates from '../components/LoanKeyDates.vue'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'
import LoanCollateralManager from '../components/LoanCollateralManager.vue'
import LoanDisbursedLoanCard from '../components/LoanDisbursedLoanCard.vue'
import LoanAppraisalModals from '../components/LoanAppraisalModals.vue'
import LoanDisbursementDrawer from '../components/LoanDisbursementDrawer.vue'
import VoteCastModal from '../components/VoteCastModal.vue'
import BMRecommendModal from '../components/BMRecommendModal.vue'
import BMReturnForCorrectionModal from '../components/BMReturnForCorrectionModal.vue'
import LoanGuarantorUploader from '../components/LoanGuarantorUploader.vue'

const {
  loading, cancelling, reopening, application, timeline, timelineLoading,
  showCancelModal, cancelReason, cancelReasonError,
  openCancelModal, closeCancelModal, confirmCancel,
  reopen, openEdit, loadApplication,
} = useLoanApplicationShow()

const {
  takingForReview, takeForReview, resumingReview, resumeReview,
  showAppraiseModal, appraising, appraiseForm, appraiseErrors, openAppraiseModal, submitAppraise,
  showRequestDocsModal, requestingDocs, requestDocsNote, requestDocsError, openRequestDocsModal, submitRequestDocs,
  showReturnModal, returning, returnReason, returnError, openReturnModal, submitReturn,
  showRejectModal, rejecting, rejectReason, rejectError, openRejectModal, submitReject,
  showApproveModal, approving, approveComments, openApproveModal, submitApprove,
  showDeclineModal, declining, declineReason, declineError, openDeclineModal, submitDecline,
  showBMRecommendModal, bmRecommending, openBMRecommendModal, submitBMRecommend,
  showBMReturnModal, bmReturning, openBMReturnModal, submitBMReturn,
  showVoteModal, voting, openVoteModal, submitVote,
  voteTally, loadingVotes, loadVotes,
  committeeVotes, committeeMembers,
} = useLoanAppraisalActions(application, loadApplication)

const {
  showDisburseModal, disbursing, disburseForm, disburseErrors, openDisburseModal, submitDisburse,
} = useLoanDisbursement(application, loadApplication)

watch(
  () => application.value?.status,
  (status) => { if (status === 'committee_voting' || status === 'approved') loadVotes() },
  { immediate: true },
)

const router = useRouter()

// ─── Workflow step navigation ─────────────────────────────────────────────────
const workflowStepKeys = ['draft', 'submitted', 'under_review', 'recommended', 'approved', 'disbursed']

const statusToStepIndex: Record<string, number> = {
  draft: 0,
  submitted: 1,
  under_review: 2, awaiting_documents: 2, returned_for_correction: 1,
  recommended: 3, officer_recommended: 3, bm_recommended: 3, committee_voting: 3,
  approved: 4, disbursement_pending: 4,
  disbursed: 5,
}

const currentStepIndex = computed(() => statusToStepIndex[application.value?.status ?? ''] ?? 0)
const viewedStepIndex = ref(0)

watch(
  currentStepIndex,
  (idx) => { viewedStepIndex.value = idx },
  { immediate: true },
)

const isViewingPreviousStep = computed(() => viewedStepIndex.value < currentStepIndex.value)
const viewedStepKey = computed(() => workflowStepKeys[viewedStepIndex.value] ?? 'draft')

function handleBack() {
  if (viewedStepIndex.value > 0) {
    viewedStepIndex.value--
  } else {
    router.push({ name: 'tenant-loans' })
  }
}

// ─── Step summary data ────────────────────────────────────────────────────────
const stepSummary = computed(() => {
  const app = application.value
  if (!app) return null
  switch (viewedStepKey.value) {
    case 'draft':
      return { title: 'Draft Stage', detail: `Application created on ${app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}.` }
    case 'submitted':
      return { title: 'Submitted Stage', detail: app.submitted_at ? `Submitted on ${new Date(app.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.` : 'Not yet submitted.' }
    case 'under_review':
      return { title: 'Under Review Stage', detail: app.reviewed_at ? `Taken for review on ${new Date(app.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.` : 'Taken for review.' }
    case 'recommended':
      return {
        title: 'Recommended Stage',
        detail: app.recommended_at
          ? `Recommended on ${new Date(app.recommended_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${app.recommended_by ? ` by ${app.recommended_by.name}` : ''}.`
          : 'Awaiting recommendation.',
      }
    case 'approved':
      return { title: 'Approved Stage', detail: app.approved_at ? `Approved on ${new Date(app.approved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.` : 'Awaiting approval.' }
    case 'disbursed':
      return { title: 'Disbursed Stage', detail: app.disbursed_at ? `Disbursed on ${new Date(app.disbursed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.` : 'Not yet disbursed.' }
    default:
      return null
  }
})

const editableStatuses          = ['draft', 'returned_for_correction']
const cancellableStatuses       = ['draft', 'submitted', 'under_review', 'awaiting_documents', 'officer_recommended', 'bm_recommended', 'committee_voting']
const reopenableStatuses        = ['cancelled', 'declined']
const documentEditableStatuses  = ['draft', 'submitted', 'awaiting_documents', 'returned_for_correction']

const hasMissingDocsForStage = ref(false)
function handleDocStatusChange(missing: boolean) {
  hasMissingDocsForStage.value = missing
}

const documentUploaderRef = ref<InstanceType<typeof LoanDocumentUploader> | null>(null)

const currentDocStage = computed(() => {
  switch (application.value?.status) {
    case 'draft':               return 'draft'
    case 'submitted':
    case 'awaiting_documents':  return 'submission'
    case 'under_review':        return 'review'
    case 'officer_recommended':
    case 'bm_recommended':
    case 'committee_voting':    return 'approval'
    case 'approved':
    case 'disbursement_pending': return 'disbursement'
    default:                    return 'submission'
  }
})

const isApproved  = computed(() => application.value?.status === 'approved')
const isDisbursed = computed(() => application.value?.status === 'disbursed')
const isCommitteeVoting = computed(() => application.value?.status === 'committee_voting')
const showDetailsSection = computed(() => !isApproved.value && !isDisbursed.value)
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">

    <!-- Header -->
    <LoanApplicationHeader
      :application="application"
      :cancelling="cancelling"
      :reopening="reopening"
      :editable-statuses="editableStatuses"
      :cancellable-statuses="cancellableStatuses"
      :reopenable-statuses="reopenableStatuses"
      @back="handleBack"
      @edit="openEdit"
      @reopen="reopen"
      @cancel="openCancelModal"
    />

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">Loading…</div>

    <div v-else-if="application" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

      <!-- ── Left column ── -->
      <div class="flex flex-col gap-6">

        <LoanWorkflowPipeline
          :application="application"
          :viewed-step-index="isViewingPreviousStep ? viewedStepIndex : undefined"
        />

        <!-- Previous-step summary banner -->
        <div
          v-if="isViewingPreviousStep && stepSummary"
          class="rounded-2xl border border-nfuko-primary/20 bg-nfuko-primary/5 p-5 dark:border-nfuko-primary/30 dark:bg-nfuko-primary/10"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-nfuko-primary dark:text-bg-nfuko-yellow">
                Viewing: {{ stepSummary.title }}
              </p>
              <p class="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">{{ stepSummary.detail }}</p>
            </div>
            <button
              class="shrink-0 rounded-lg border border-nfuko-primary/30 px-3 py-1.5 text-xs font-medium text-nfuko-primary transition hover:bg-nfuko-primary/10 dark:text-bg-nfuko-yellow"
              @click="viewedStepIndex = currentStepIndex"
            >
              Return to current step
            </button>
          </div>
        </div>

        <!-- Status action panels (only shown when on the current step) -->
        <LoanCommitteeVotingPanel
          v-if="isCommitteeVoting && !isViewingPreviousStep"
          :application="application"
          :vote-tally="voteTally"
          :committee-votes="committeeVotes"
          :loading-votes="loadingVotes"
          @open-vote="openVoteModal"
        />
        <LoanActionPanel
          v-else-if="!isApproved && !isViewingPreviousStep"
          :application="application"
          :taking-for-review="takingForReview"
          :resuming-review="resumingReview"
          @take-for-review="takeForReview"
          @open-appraise="openAppraiseModal"
          @open-request-docs="openRequestDocsModal"
          @open-return="openReturnModal"
          @open-reject="openRejectModal"
          @open-approve="openApproveModal"
          @open-decline="openDeclineModal"
          @open-disburse="openDisburseModal"
          @open-b-m-recommend="openBMRecommendModal"
          @open-b-m-return-for-correction="openBMReturnModal"
          @open-vote="openVoteModal"
          :submit-disabled="hasMissingDocsForStage"
        />

        <!-- Approved: full tabbed section -->
        <LoanApprovedSection
          v-if="isApproved"
          :application="application"
          :committee-votes="committeeVotes"
          :timeline="timeline"
          :timeline-loading="timelineLoading"
          :document-editable-statuses="documentEditableStatuses"
          :current-doc-stage="currentDocStage"
          @open-disburse="openDisburseModal"
          @load-application="loadApplication"
        />

        <!-- Disbursed: loan account card -->
        <LoanDisbursedLoanCard
          v-if="isDisbursed && application.disbursed_loan"
          :loan="application.disbursed_loan"
          :loan-application-id="application.id"
        />

        <!-- Non-approved / non-disbursed details -->
        <template v-if="showDetailsSection">
          <LoanApplicationDetails :application="application" />
          <LoanAppraisalSummary
            v-if="application.risk_rating || application.recommended_amount"
            :application="application"
          />
          <LoanStatusNotices :application="application" />
          <LoanVoteDisplays
            v-if="application.approvals?.length || committeeVotes?.length"
            :application="application"
            :committee-votes="committeeVotes"
          />
        </template>
      </div>

      <!-- ── Right column ── -->
      <div class="flex flex-col gap-6">
        <!-- {{ application }} -->
        <LoanGuarantorUploader
          v-if="application.id && !isApproved" 
          :application-id="application.id"
          :application="application"
          :editable="documentEditableStatuses.includes(application.status ?? '')"
          :current-stage="currentDocStage"
          @updated="loadApplication"
          @status-change="handleDocStatusChange"
        />
        <LoanDocumentUploader
          v-if="application.id && !isApproved"
          ref="documentUploaderRef"
          :application-id="application.id"
          :editable="documentEditableStatuses.includes(application.status ?? '')"
          :current-stage="currentDocStage"
          @updated="loadApplication"
          @status-change="handleDocStatusChange"
        />
        <LoanCollateralManager
          v-if="application.id && !isApproved"
          :application-id="application.id"
          :editable="editableStatuses.includes(application.status ?? '')"
          @updated="loadApplication"
        />
        <LoanKeyDates :application="application" />
        <LoanAuditTrail v-if="!isApproved" :timeline="timeline" :loading="timelineLoading" />
      </div>
    </div>
  </div>

  <!-- ── Modals ── -->
  <LoanAppraisalModals
    v-model:cancel-reason="cancelReason"
    v-model:request-docs-note="requestDocsNote"
    v-model:return-reason="returnReason"
    v-model:reject-reason="rejectReason"
    v-model:approve-comments="approveComments"
    v-model:decline-reason="declineReason"
    :show-cancel-modal="showCancelModal"
    :cancel-reason-error="cancelReasonError"
    :cancelling="cancelling"
    :show-appraise-modal="showAppraiseModal"
    :appraising="appraising"
    :appraise-form="appraiseForm"
    :appraise-errors="appraiseErrors"
    :show-request-docs-modal="showRequestDocsModal"
    :requesting-docs="requestingDocs"
    :request-docs-error="requestDocsError"
    :show-return-modal="showReturnModal"
    :returning="returning"
    :return-error="returnError"
    :show-reject-modal="showRejectModal"
    :rejecting="rejecting"
    :reject-error="rejectError"
    :show-approve-modal="showApproveModal"
    :approving="approving"
    :show-decline-modal="showDeclineModal"
    :declining="declining"
    :decline-error="declineError"
    @cancel-close="closeCancelModal"
    @cancel-confirm="confirmCancel"
    @appraise-close="showAppraiseModal = false"
    @appraise-submit="submitAppraise"
    @request-docs-close="showRequestDocsModal = false"
    @request-docs-submit="submitRequestDocs"
    @return-close="showReturnModal = false"
    @return-submit="submitReturn"
    @reject-close="showRejectModal = false"
    @reject-submit="submitReject"
    @approve-close="showApproveModal = false"
    @approve-submit="submitApprove"
    @decline-close="showDeclineModal = false"
    @decline-submit="submitDecline"
  />

  <LoanDisbursementDrawer
    :application="application"
    :open="showDisburseModal"
    :disbursing="disbursing"
    v-model:form="disburseForm"
    :errors="disburseErrors"
    @close="showDisburseModal = false"
    @submit="submitDisburse"
  />

  <VoteCastModal
    :open="showVoteModal"
    :submitting="voting"
    :committee-members="committeeMembers"
    @close="showVoteModal = false"
    @submit="submitVote"
  />

  <BMRecommendModal
    :open="showBMRecommendModal"
    :submitting="bmRecommending"
    @close="showBMRecommendModal = false"
    @submit="submitBMRecommend"
  />

  <BMReturnForCorrectionModal
    :open="showBMReturnModal"
    :submitting="bmReturning"
    @close="showBMReturnModal = false"
    @submit="submitBMReturn"
  />
</template>
