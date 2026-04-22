import { ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import type { AxiosError } from 'axios'
import { loanApplicationsApi, type LoanApplication, type CommitteeVote } from '../../../apis/loans/loanApplicationsApi'

interface ApiErrorResponse {
    message?: string
    errors?: Record<string, string[]>
}

export function useLoanAppraisalActions(
    application: Ref<LoanApplication | null>,
    reload: () => Promise<void>,
) {
    const route = useRoute()
    const id    = () => application.value?.id ?? Number(route.params.id)

    // ─── Take for review ──────────────────────────────────────────────────────
    const takingForReview = ref(false)

    async function takeForReview() {
        takingForReview.value = true
        try {
            await loanApplicationsApi.takeForReview(id())
            toast.success('Application taken for review.')
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            toast.error(error?.response?.data?.message ?? 'Failed to take application for review.')
        } finally {
            takingForReview.value = false
        }
    }

    // ─── Resume review ────────────────────────────────────────────────────────
    const resumingReview = ref(false)

    async function resumeReview() {
        resumingReview.value = true
        try {
            await loanApplicationsApi.resumeReview(id())
            toast.success('Review resumed.')
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            toast.error(error?.response?.data?.message ?? 'Failed to resume review.')
        } finally {
            resumingReview.value = false
        }
    }

    // ─── Appraise modal ───────────────────────────────────────────────────────
    const showAppraiseModal = ref(false)
    const appraising        = ref(false)
    const appraiseForm      = ref({
        recommended_amount: '' as string | number,
        recommended_term:   '' as string | number,
        recommended_interest_rate: '' as string | number,
        risk_rating:        'medium',
        appraisal_notes:    '',
    })
    const appraiseErrors = ref<Record<string, string>>({})

    function openAppraiseModal() {
        appraiseForm.value = {
            recommended_amount: application.value?.requested_amount ?? '',
            recommended_term:   application.value?.requested_term   ?? '',
            recommended_interest_rate: application.value?.loan_product?.interest_rate ?? '',
            risk_rating:        'medium',
            appraisal_notes:    '',
        }
        appraiseErrors.value = {}
        showAppraiseModal.value = true
    }

    async function submitAppraise() {
        appraiseErrors.value = {}
        if (!appraiseForm.value.recommended_amount || Number(appraiseForm.value.recommended_amount) <= 0) {
            appraiseErrors.value.recommended_amount = 'Recommended amount is required.'
            return
        }
        if (!appraiseForm.value.recommended_term || Number(appraiseForm.value.recommended_term) < 1) {
            appraiseErrors.value.recommended_term = 'Recommended term is required.'
            return
        }
        if (appraiseForm.value.recommended_interest_rate === '' || Number(appraiseForm.value.recommended_interest_rate) < 0) {
            appraiseErrors.value.recommended_interest_rate = 'Interest rate is required.'
            return
        }

        appraising.value = true
        try {
            await loanApplicationsApi.appraise(id(), {
                recommended_amount: appraiseForm.value.recommended_amount,
                recommended_term:   appraiseForm.value.recommended_term,
                recommended_interest_rate: appraiseForm.value.recommended_interest_rate,
                risk_rating:        appraiseForm.value.risk_rating,
                appraisal_notes:    appraiseForm.value.appraisal_notes || null,
            })
            toast.success('Application appraised and recommended.')
            showAppraiseModal.value = false
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            const errors = error?.response?.data?.errors ?? {}
            if (errors.recommended_amount) appraiseErrors.value.recommended_amount = errors.recommended_amount[0] ?? ''
            if (errors.recommended_term)   appraiseErrors.value.recommended_term   = errors.recommended_term[0] ?? ''
            if (errors.recommended_interest_rate) appraiseErrors.value.recommended_interest_rate = errors.recommended_interest_rate[0] ?? ''
            if (errors.risk_rating)        appraiseErrors.value.risk_rating        = errors.risk_rating[0] ?? ''
            if (!Object.keys(appraiseErrors.value).length) {
                toast.error(error?.response?.data?.message ?? 'Failed to appraise application.')
            }
        } finally {
            appraising.value = false
        }
    }

    // ─── Request Documents modal ──────────────────────────────────────────────
    const showRequestDocsModal = ref(false)
    const requestingDocs       = ref(false)
    const requestDocsNote      = ref('')
    const requestDocsError     = ref('')

    function openRequestDocsModal() {
        requestDocsNote.value  = ''
        requestDocsError.value = ''
        showRequestDocsModal.value = true
    }

    async function submitRequestDocs() {
        requestDocsError.value = ''
        if (requestDocsNote.value.trim().length < 10) {
            requestDocsError.value = 'Please provide a note of at least 10 characters.'
            return
        }
        requestingDocs.value = true
        try {
            await loanApplicationsApi.requestDocuments(id(), requestDocsNote.value.trim())
            toast.success('Application flagged as awaiting documents.')
            showRequestDocsModal.value = false
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            requestDocsError.value = error?.response?.data?.errors?.note?.[0]
                ?? error?.response?.data?.message
                ?? 'Failed to request documents.'
        } finally {
            requestingDocs.value = false
        }
    }

    // ─── Return for Correction modal ──────────────────────────────────────────
    const showReturnModal = ref(false)
    const returning       = ref(false)
    const returnReason    = ref('')
    const returnError     = ref('')

    function openReturnModal() {
        returnReason.value = ''
        returnError.value  = ''
        showReturnModal.value = true
    }

    async function submitReturn() {
        returnError.value = ''
        if (returnReason.value.trim().length < 10) {
            returnError.value = 'Please provide a reason of at least 10 characters.'
            return
        }
        returning.value = true
        try {
            await loanApplicationsApi.returnForCorrection(id(), returnReason.value.trim())
            toast.success('Application returned for corrections.')
            showReturnModal.value = false
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            returnError.value = error?.response?.data?.errors?.reason?.[0]
                ?? error?.response?.data?.message
                ?? 'Failed to return application.'
        } finally {
            returning.value = false
        }
    }

    // ─── Reject (appraisal) modal ─────────────────────────────────────────────
    const showRejectModal = ref(false)
    const rejecting       = ref(false)
    const rejectReason    = ref('')
    const rejectError     = ref('')

    function openRejectModal() {
        rejectReason.value = ''
        rejectError.value  = ''
        showRejectModal.value = true
    }

    async function submitReject() {
        rejectError.value = ''
        if (rejectReason.value.trim().length < 10) {
            rejectError.value = 'Please provide a reason of at least 10 characters.'
            return
        }
        rejecting.value = true
        try {
            await loanApplicationsApi.rejectAtAppraisal(id(), rejectReason.value.trim())
            toast.success('Application rejected.')
            showRejectModal.value = false
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            rejectError.value = error?.response?.data?.errors?.reason?.[0]
                ?? error?.response?.data?.message
                ?? 'Failed to reject application.'
        } finally {
            rejecting.value = false
        }
    }

    // ─── Approve modal ────────────────────────────────────────────────────────
    const showApproveModal = ref(false)
    const approving        = ref(false)
    const approveComments  = ref('')

    function openApproveModal() {
        approveComments.value  = ''
        showApproveModal.value = true
    }

    async function submitApprove() {
        approving.value = true
        try {
            await loanApplicationsApi.approve(id(), approveComments.value.trim() || null)
            toast.success('Approval vote recorded.')
            showApproveModal.value = false
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            toast.error(error?.response?.data?.message ?? 'Failed to record approval.')
        } finally {
            approving.value = false
        }
    }

    // ─── Decline modal ────────────────────────────────────────────────────────
    const showDeclineModal = ref(false)
    const declining        = ref(false)
    const declineReason    = ref('')
    const declineError     = ref('')

    function openDeclineModal() {
        declineReason.value  = ''
        declineError.value   = ''
        showDeclineModal.value = true
    }

    async function submitDecline() {
        declineError.value = ''
        if (declineReason.value.trim().length < 10) {
            declineError.value = 'Please provide a reason of at least 10 characters.'
            return
        }
        declining.value = true
        try {
            await loanApplicationsApi.decline(id(), declineReason.value.trim())
            toast.success('Application declined.')
            showDeclineModal.value = false
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            declineError.value = error?.response?.data?.errors?.reason?.[0]
                ?? error?.response?.data?.message
                ?? 'Failed to decline application.'
        } finally {
            declining.value = false
        }
    }

    // ─── BM Recommend modal ──────────────────────────────────────────────────
    const showBMRecommendModal = ref(false)
    const bmRecommending       = ref(false)

    function openBMRecommendModal() {
        showBMRecommendModal.value = true
    }

    async function submitBMRecommend(bmNotes: string) {
        bmRecommending.value = true
        try {
            await loanApplicationsApi.bmRecommend(id(), bmNotes || null)
            toast.success('Application recommended to committee.')
            showBMRecommendModal.value = false
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            toast.error(error?.response?.data?.message ?? 'Failed to recommend application.')
        } finally {
            bmRecommending.value = false
        }
    }

    // ─── BM Return for Correction modal ──────────────────────────────────────
    const showBMReturnModal = ref(false)
    const bmReturning       = ref(false)

    function openBMReturnModal() {
        showBMReturnModal.value = true
    }

    async function submitBMReturn(correctionReason: string) {
        bmReturning.value = true
        try {
            await loanApplicationsApi.committeeReturnForCorrection(id(), correctionReason)
            toast.success('Application returned for correction.')
            showBMReturnModal.value = false
            await reload()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            toast.error(error?.response?.data?.message ?? 'Failed to return application.')
        } finally {
            bmReturning.value = false
        }
    }

    // ─── Vote Cast modal ─────────────────────────────────────────────────────
    const showVoteModal = ref(false)
    const voting        = ref(false)

    function openVoteModal() {
        showVoteModal.value = true
    }

    async function submitVote(decision: 'approve' | 'decline', comment: string) {
        voting.value = true
        try {
            await loanApplicationsApi.castVote(id(), { decision, comment: comment || null })
            toast.success('Vote recorded.')
            showVoteModal.value = false
            await reload()
            await loadVotes()
        } catch (err: unknown) {
            const error = err as AxiosError<ApiErrorResponse>
            toast.error(error?.response?.data?.message ?? 'Failed to record vote.')
        } finally {
            voting.value = false
        }
    }

    // ─── Vote tally ──────────────────────────────────────────────────────────
    const voteTally = ref<Record<string, unknown> | null>(null)
    const loadingVotes = ref(false)
    const committeeMembers = ref<{ id: number; name: string; has_voted: boolean; decision: 'approve' | 'decline' | null }[]>([])
    const committeeVotes = ref<CommitteeVote[]>([])

    async function loadVotes() {
        loadingVotes.value = true
        try {
            const res = await loanApplicationsApi.getVotes(id())
            const data = res.data.data
            voteTally.value = data
            committeeVotes.value   = data?.votes ?? []
            committeeMembers.value = data?.committee_members ?? []
        } catch {
            // Silently fail for vote loading
        } finally {
            loadingVotes.value = false
        }
    }


    return {
        // Take for review
        takingForReview, takeForReview,
        // Resume review
        resumingReview, resumeReview,
        // Appraise
        showAppraiseModal, appraising, appraiseForm, appraiseErrors,
        openAppraiseModal, submitAppraise,
        // Request docs
        showRequestDocsModal, requestingDocs, requestDocsNote, requestDocsError,
        openRequestDocsModal, submitRequestDocs,
        // Return for correction
        showReturnModal, returning, returnReason, returnError,
        openReturnModal, submitReturn,
        // Reject
        showRejectModal, rejecting, rejectReason, rejectError,
        openRejectModal, submitReject,
        // Approve
        showApproveModal, approving, approveComments,
        openApproveModal, submitApprove,
        // Decline
        showDeclineModal, declining, declineReason, declineError,
        openDeclineModal, submitDecline,
        // BM Recommend
        showBMRecommendModal, bmRecommending,
        openBMRecommendModal, submitBMRecommend,
        // BM Return for Correction
        showBMReturnModal, bmReturning,
        openBMReturnModal, submitBMReturn,
        // Vote Cast
        showVoteModal, voting,
        openVoteModal, submitVote,
        // Vote Tally
        voteTally, loadingVotes, loadVotes,
        // Committee Votes + Members
        committeeVotes, committeeMembers,
    }
}
