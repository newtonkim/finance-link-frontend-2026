<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const editableStatuses          = ['draft', 'returned_for_correction']
const cancellableStatuses       = ['draft', 'submitted', 'under_review', 'awaiting_documents', 'officer_recommended', 'bm_recommended', 'committee_voting']
const reopenableStatuses        = ['cancelled', 'declined']
const documentEditableStatuses  = ['draft', 'submitted', 'awaiting_documents', 'returned_for_correction']

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
      @edit="openEdit"
      @reopen="reopen"
      @cancel="openCancelModal"
    />

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">Loading…</div>

    <div v-else-if="application" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

      <!-- ── Left column ── -->
      <div class="flex flex-col gap-6">

        <LoanWorkflowPipeline :application="application" />

        <!-- Status action panels -->
        <LoanCommitteeVotingPanel
          v-if="isCommitteeVoting"
          :application="application"
          :vote-tally="voteTally"
          :committee-votes="committeeVotes"
          :loading-votes="loadingVotes"
          @open-vote="openVoteModal"
        />
        <LoanActionPanel
          v-else
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
        <LoanDocumentUploader
          v-if="application.id && !isApproved"
          ref="documentUploaderRef"
          :application-id="application.id"
          :editable="documentEditableStatuses.includes(application.status ?? '')"
          :current-stage="currentDocStage"
          @updated="loadApplication"
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
    :form="disburseForm"
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
