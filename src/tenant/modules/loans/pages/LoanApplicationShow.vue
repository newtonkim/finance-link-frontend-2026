<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Shield } from 'lucide-vue-next'
import { useLoanApplicationShow } from '../composables/useLoanApplicationShow'
import { useLoanAppraisalActions } from '../composables/useLoanAppraisalActions'
import { useLoanDisbursement } from '../composables/useLoanDisbursement'
import LoanApplicationHeader from '../components/LoanApplicationHeader.vue'
import LoanWorkflowPipeline from '../components/LoanWorkflowPipeline.vue'
import LoanActionPanel from '../components/LoanActionPanel.vue'
import LoanStatusNotices from '../components/LoanStatusNotices.vue'
import LoanApplicationDetails from '../components/LoanApplicationDetails.vue'
import LoanAppraisalSummary from '../components/LoanAppraisalSummary.vue'
import LoanVoteDisplays from '../components/LoanVoteDisplays.vue'
import LoanDisbursedLoanCard from '../components/LoanDisbursedLoanCard.vue'
import LoanDocumentUploader from '../components/LoanDocumentUploader.vue'
import LoanKeyDates from '../components/LoanKeyDates.vue'
import LoanAuditTrail from '../components/LoanAuditTrail.vue'
import LoanAppraisalModals from '../components/LoanAppraisalModals.vue'
import VoteTallyDisplay from '../components/VoteTallyDisplay.vue'
import CommitteeVotesList from '../components/CommitteeVotesList.vue'
import VoteCastModal from '../components/VoteCastModal.vue'
import BMRecommendModal from '../components/BMRecommendModal.vue'
import BMReturnForCorrectionModal from '../components/BMReturnForCorrectionModal.vue'
import LoanDisbursementDrawer from '../components/LoanDisbursementDrawer.vue'

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
  showBMRecommendModal,
  bmRecommending,
  openBMRecommendModal,
  submitBMRecommend,
  showBMReturnModal,
  bmReturning,
  openBMReturnModal,
  submitBMReturn,
  showVoteModal,
  voting,
  openVoteModal,
  submitVote,
  voteTally,
  committeeVotes,
} = useLoanAppraisalActions(application, loadApplication)

const {
  showDisburseModal,
  disbursing,
  disburseForm,
  disburseErrors,
  openDisburseModal,
  submitDisburse,
} = useLoanDisbursement(application, loadApplication)

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
const documentEditableStatuses = ['draft', 'awaiting_documents', 'returned_for_correction']
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-6 bg-[#f8faf9] p-4 md:p-6 dark:bg-[#0a0a0a]">
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

    <div v-if="loading" class="flex items-center justify-center py-20 text-sm text-neutral-400">
      Loading…
    </div>

    <div v-else-if="application" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div class="flex flex-col gap-6">
        <LoanWorkflowPipeline :application="application" />

        <LoanActionPanel
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

        <div v-if="application.status === 'committee_voting'" class="-mt-2 flex flex-col gap-4">
          <VoteTallyDisplay
            v-if="voteTally"
            :tally="voteTally"
            :unanimity-required="application.unanimity_required ?? false"
          />
          <CommitteeVotesList v-if="committeeVotes?.length" :votes="committeeVotes" />
        </div>

        <template v-if="application.status === 'disbursed' && application.disbursed_loan">
          <LoanDisbursedLoanCard
            :loan="application.disbursed_loan"
            :loan-application-id="application.disbursed_loan_id"
          />
        </template>

        <template v-else>
          <LoanApplicationDetails :application="application" />
          <LoanAppraisalSummary
            v-if="application.risk_rating || application.recommended_amount"
            :application="application"
          />
        </template>

        <LoanStatusNotices :application="application" />
        <LoanVoteDisplays :application="application" :committee-votes="committeeVotes" />
      </div>

      <div class="flex flex-col gap-6">
        <LoanDocumentUploader
          v-if="application.id"
          :application-id="application.id"
          :editable="documentEditableStatuses.includes(application.status ?? '')"
          @updated="loadApplication"
        />
        <div
          class="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="mb-4 flex items-center gap-2">
            <Shield class="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
              Collateral & Securities
            </h3>
          </div>
          <div
            class="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 py-6 text-center dark:border-neutral-700"
          >
            <Shield class="mb-2 h-5 w-5 text-neutral-300 dark:text-neutral-600" />
            <p class="text-sm text-neutral-500 dark:text-neutral-400">No collateral recorded.</p>
            <p class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              Collateral items can be added when creating or editing the application.
            </p>
          </div>
        </div>
        <LoanKeyDates :application="application" />
        <LoanAuditTrail :timeline="timeline" :loading="timelineLoading" />
      </div>
    </div>
  </div>

  <LoanAppraisalModals
    v-if="application"
    v-model:cancelReason="cancelReason"
    v-model:requestDocsNote="requestDocsNote"
    v-model:returnReason="returnReason"
    v-model:rejectReason="rejectReason"
    v-model:approveComments="approveComments"
    v-model:declineReason="declineReason"
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
