import { pomPinia } from 'septor-store'
import { tenantClient } from '../tenantClient'
import { fetchTableData } from '@/Global/landingLayout/util'
import { formDataFormat, formDataFormatV2, getLocalValues } from '@/Global/Helpers'


export interface LoanApplicationStatusHistory {
  id: number
  from_status: string | null
  to_status: string
  notes: string | null
  changed_at: string
  changed_by?: { id: number; name: string } | null
}

export interface LoanApplicationApproval {
  id: number
  approver?: { id: number; name: string } | null
  level: number
  decision: 'approved' | 'rejected'
  comments: string | null
  decided_at: string | null
  created_at: string
}

export interface CommitteeVote {
  id: number
  staff_id: number
  staff_name: string
  decision: 'approve' | 'decline'
  comment: string | null
  abstained: boolean
  created_at: string
}

export interface TimelineEvent {
  type: 'created' | 'status_change' | 'document_uploaded' | 'approval_vote'
  title: string
  description: string
  actor: { id: number; name: string } | null
  notes: string | null
  timestamp: string
}

export interface LoanScheduleRow {
  installment_no: number
  due_date: string
  principal_due: string
  interest_due: string
  total_due: string
  outstanding_balance: string
  status: string
}

export interface DisbursedLoan {
  id: number
  loan_no: string
  principal: string
  principal_formatted?: string | null
  processing_fee: string
  processing_fee_formatted?: string | null
  net_disbursed_amount: string
  net_disbursed_amount_formatted?: string | null
  interest_rate: string
  term_months: number
  disbursed_at: string
  schedule_date?: string
  disbursement_method: string
  disbursement_reference: string | null
  status: string
  outstanding_balance: string
  outstanding_balance_formatted?: string | null
  loan_officer?: { id: number; name: string } | null
  disbursed_by_staff?: { id: number; name: string } | null
  schedules?: LoanScheduleRow[]
}

export interface LoanApplication {
  id?: number
  application_no?: string
  member_id?: number | null
  loan_product_id?: number | null
  branch_id?: number | null
  loan_officer_id?: number | null
  requested_amount?: number | string | null
  requested_amount_formatted?: string | null
  requested_term?: number | null
  purpose?: string | null
  repayment_source?: string | null
  status?: string
  recommended_amount?: number | string | null
  recommended_amount_formatted?: string | null
  recommended_term?: number | null
  recommended_interest_rate?: number | string | null
  approved_amount?: number | string | null
  approved_amount_formatted?: string | null
  approved_term?: number | null
  approved_interest_rate?: number | string | null
  rejection_reason?: string | null
  cancellation_reason?: string | null
  cancelled_at?: string | null
  appraisal_notes?: string | null
  risk_rating?: string | null
  approval_notes?: string | null
  return_reason?: string | null
  returned_at?: string | null
  reviewed_at?: string | null
  submitted_at?: string | null
  recommended_at?: string | null
  approved_at?: string | null
  rejected_at?: string | null
  disbursed_at?: string | null
  schedule_date?: string
  proposed_start_date?: string
  disbursed_loan_id?: number | null
  disbursed_loan?: DisbursedLoan | null
  created_at?: string
  // Nested
  member?: { id: number; name: string; member_no: string } | null
  loan_product?: {
    id: number
    name: string
    code: string
    max_amount?: number | null
    max_amount_formatted?: string | null
    interest_rate?: number | string | null
    interest_method?: string | null
    interest_period?: string | null
    grace_period?: number | null
    penalty_grace_days?: number | null
    processing_fee_type?: string | null
    processing_fee_value?: number | string | null
    portfolio_account_name?: string | null
    disbursement_account_name?: string | null
    fee_income_account_name?: string | null
    repayment_cycle?: string | null
  } | null
  loan_officer?: { id: number; name: string } | null
  appraised_by?: { id: number; name: string } | null
  recommended_by?: { id: number; name: string } | null
  approved_by?: { id: number; name: string } | null
  rejected_by?: { id: number; name: string } | null
  approvals?: LoanApplicationApproval[]
  status_history?: LoanApplicationStatusHistory[]
  created_by?: { id: number; name: string } | null
  days_pending?: number | null
  currency_code?: string | null
  approvals_count?: number
  // Committee voting fields
  quorum_required?: number | null
  approval_threshold?: number | null
  unanimity_required?: boolean | null
  correction_reason?: string | null
  committeeVotes?: CommitteeVote[]
  // Product charges (resolved at approval/disbursement stage)
  product_charges?: {
    items: ProductCharge[]
    summary: {
      gross_amount: number
      gross_amount_formatted: string
      total_on_disbursement: number
      total_on_disbursement_formatted: string
      net_disbursed: number
      net_disbursed_formatted: string
    }
  } | null
  loan_guarantors?: any[] | Record<string, any>
  my_groups_member?: any[] | Record<string, any>
}

export interface ProductCharge {
  id: number | string
  name: string
  charge_type: 'flat' | 'percentage'
  value: number | string
  computed_amount: number
  computed_amount_formatted: string
  application_timing: string
  category?: string | null
  is_mandatory: boolean
  description?: string | null
}

export interface EligibilityCheckItem {
  key: string
  label: string
  reason?: string
  message?: string
}

export interface EligibilityResult {
  eligible: boolean
  passed: EligibilityCheckItem[]
  failed: EligibilityCheckItem[]
  warnings: EligibilityCheckItem[]
  max_eligible_amount: number
}

export interface LoanApplicationSummary {
  submitted: number
  under_review: number
  awaiting_documents: number
  recommended: number
  approved: number
  total_active: number
}

export interface LoanApplicationListParams {
  status?: string
  branch_id?: number
  member_search?: string
  loan_product_id?: number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface LoanApplicationGuarantor {
  id: number
  code: string | null
  loan_application_id: number
  guarantor_type: 'individual' | 'group'
  guarantor_id: number
  guarantor_account_id: number | null
  name: string | null
  guarantor_code: string | null
  guarantee_amount: number
  guarantee_amount_formatted: string
  status: 'proposed' | 'requested' | 'accepted' | 'declined' | 'expired' | 'withdrawn' | 'locked' | 'released' | 'invoked'
  requested_at: string | null
  consent_expires_at: string | null
  responded_at: string | null
  response_channel: 'member_portal' | 'officer' | null
  decline_reason: string | null
  consent_document_url: string | null
  /** Set once the loan is disbursed and the guarantee is locked to it. */
  loan_id: number | null
  locked_at: string | null
  released_at: string | null
  release_reason: string | null
  arrears_notified_at: string | null
  arrears_notice_count: number
  /** On a replacement: the guarantee it is taking over from. */
  substitutes_id: number | null
  substituted_by_id: number | null
  release_requested_at: string | null
  release_request_reason: string | null
  recovered_amount?: number
  note: string | null
  created_at: string
}

/** A member's or group's standing as a guarantor. */
export interface GuarantorCapacity {
  guarantor_type: 'individual' | 'group'
  guarantor_id: number
  free_capacity: number
  free_capacity_formatted: string
  savings_balance: number
  held_amount: number
  held_amount_formatted: string
  available_to_withdraw: number
  available_to_withdraw_formatted: string
  guarantees: {
    id: number
    status: LoanApplicationGuarantor['status']
    guarantee_amount: number
    guarantee_amount_formatted: string
    loan_application_id: number
    application_no: string | null
    borrower_name: string | null
    loan_id: number | null
    loan_no: string | null
    locked_at: string | null
  }[]
}

/** An overdue loan that guarantees stand behind, as listed on Guarantors at Risk. */
export interface GuarantorArrearsRow {
  loan_id: number
  loan_no: string
  borrower_name: string | null
  member_id: number
  days_past_due: number
  arrears_amount: number
  arrears_amount_formatted: string
  arrears_since: string
  guaranteed_amount: number
  guarantors: {
    id: number
    guarantor_type: 'individual' | 'group'
    guarantor_id: number
    name: string | null
    guarantee_amount: number
    guarantee_amount_formatted: string
    arrears_notified_at: string | null
    arrears_notice_count: number
  }[]
}

export interface GuarantorRecoveryLine {
  id?: number
  source: 'borrower' | 'guarantor'
  member_id: number
  name: string | null
  savings_account_id: number
  account_no: string | null
  amount: number
  repaid_amount?: number
  owed?: number
}

/** Who would pay what to recover a defaulted loan, and whether it can be recovered now. */
export interface GuarantorRecoveryPlan {
  eligible: boolean
  reasons: string[]
  loan_id: number
  loan_no: string
  days_past_due: number
  outstanding_balance: number
  requested_amount: number
  borrower_amount: number
  guarantor_amount: number
  planned_amount: number
  shortfall: number
  recovery_loan_term_months: number
  lines: GuarantorRecoveryLine[]
  unsupported_guarantors: { loan_application_guarantor_id: number; name: string | null; guarantee_amount: number; reason: string }[]
}

export interface GuarantorRecoveryScheduleRow {
  installment_no: number
  due_date: string
  amount: number
  paid: number
  status: 'paid' | 'partial' | 'pending' | 'overdue'
}

export interface GuarantorRecovery {
  id: number
  code: string
  status: 'pending_approval' | 'executed' | 'rejected'
  loan_id: number
  loan_no: string | null
  member_id: number
  borrower_name: string | null
  requested_amount: number
  borrower_amount: number
  guarantor_amount: number
  guarantor_amount_formatted: string
  notes: string | null
  initiated_by: string | null
  initiated_by_id: number | null
  initiated_at: string | null
  approved_by: string | null
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  executed_at: string | null
  recovery_loan: {
    status: 'open' | 'settled'
    term_months: number
    repaid: number
    outstanding: number
    outstanding_formatted: string
    overdue: number
    next_due_date: string | null
    next_due_amount: number | null
  } | null
  lines: GuarantorRecoveryLine[]
  schedule?: GuarantorRecoveryScheduleRow[]
  repayments?: { id: number; amount: number; payment_date: string; payment_mode: string | null; reference: string | null }[]
}

export interface GuarantorExposureRow {
  guarantor_type: 'individual' | 'group'
  guarantor_id: number
  name: string | null
  code: string | null
  guarantees: number
  pledged_amount: number
  held_amount: number
  held_amount_formatted: string
  savings_balance: number
  held_share: number | null
  overdue_loans: number
  recovered_to_date: number
  release_requested: boolean
}

export interface GuarantorPendingConsentRow {
  id: number
  loan_application_id: number
  application_no: string | null
  loan_id: number | null
  loan_no: string | null
  borrower_name: string | null
  guarantor_type: 'individual' | 'group'
  name: string | null
  guarantee_amount: number
  guarantee_amount_formatted: string
  requested_at: string | null
  consent_expires_at: string | null
  is_replacement: boolean
}

export interface GuarantorReleaseRequestRow {
  id: number
  loan_id: number | null
  loan_no: string | null
  loan_application_id: number
  borrower_name: string | null
  guarantor_type: 'individual' | 'group'
  name: string | null
  guarantee_amount: number
  guarantee_amount_formatted: string
  release_requested_at: string
  release_request_reason: string | null
  replacement_pending: string | null
}

/** Guarantor adequacy as the server works it out from the SACCO's guarantor settings. */
export interface GuarantorSummary {
  rules: {
    required: boolean
    minimum: number
    maximum: number
    members_only: boolean
    allow_self_guarantee: boolean
    exposure_percentage: number
    coverage_percentage: number
    consent_required: boolean
    consent_expiry_days: number
    hold_savings: boolean
    arrears_notice_days: number
    arrears_reminder_days: number
  }
  /** With consent required, only accepted guarantees are counted here. */
  guarantor_count: number
  remaining_guarantors: number
  pending_count: number
  pending_amount: number
  declined_count: number
  expired_count: number
  loan_amount: number
  pledged_amount: number
  borrower_free_savings: number
  covered_amount: number
  required_coverage_amount: number
  coverage_shortfall: number
  count_met: boolean
  coverage_met: boolean
  adequate: boolean
  adequate_if_pending_accept: boolean
  problems: string[]
}

export interface PendingDisbursementParams {
  page?: number
  per_page?: number
}

export function loanApplicationsApi2() {
  const Store = pomPinia()

 
  async function saveLoanApplicationNoneMemberGuarantors(data: any = {}) {
    // console.log(data);
    
    const res = await fetchTableData({
      data: formDataFormatV2(data),
      Store,
      saveData: true,
      props: {
        url: 'loan-applications/save-guarantors-none-member',
        method: 'post',
        time: 0,
        state: 'save-loan-guarantors',
      },
    })
  
    return {saveLoanApplicationGuarantors}
  }

  async function saveLoanApplicationGuarantors(data: any = {}) {
    const res = await fetchTableData({
      data: formDataFormat(data),
      Store,
      saveData: true,
      props: {
        url: 'loan-applications/save-guarantors',
        method: 'post',
        time: 0,
        state: 'save-loan-guarantors',
      },
    })
  
  }
  return {saveLoanApplicationGuarantors,saveLoanApplicationNoneMemberGuarantors}
}
 
export const loanApplicationsApi = {
  summary() {
    return tenantClient.get<{ data: LoanApplicationSummary }>('/loan-applications/summary')
  },
  list(params?: LoanApplicationListParams) {
    return tenantClient.get('/loan-applications', { params })
  },
  get(id: number) {
    return tenantClient.get(`/loan-applications/${id}`)
  },
  create(data: Partial<LoanApplication>) {
    return tenantClient.post('/loan-applications', data)
  },
  update(id: number, data: Partial<LoanApplication>) {
    return tenantClient.put(`/loan-applications/${id}`, data)
  },
  submit(id: number) {
    return tenantClient.post(`/loan-applications/${id}/submit`)
  },
  cancel(id: number, reason: string) {
    return tenantClient.post(`/loan-applications/${id}/cancel`, { reason })
  },
  reopen(id: number) {
    return tenantClient.post(`/loan-applications/${id}/reopen`)
  },
  eligibilityCheck(data: {
    member_id: number
    loan_product_id: number
    requested_amount: number
    requested_term: number
  }) {
    return tenantClient.post<{ data: EligibilityResult }>(
      '/loan-applications/eligibility-check',
      data,
    )
  },

  // ─── Appraisal ──────────────────────────────────────────────────────────────
  takeForReview(id: number) {
    return tenantClient.post(`/loan-applications/${id}/take-for-review`)
  },
  appraise(
    id: number,
    data: {
      recommended_amount: number | string
      recommended_term: number | string
      recommended_interest_rate: number | string
      risk_rating: string
      appraisal_notes?: string | null
    },
  ) {
    return tenantClient.post(`/loan-applications/${id}/appraise`, data)
  },
  requestDocuments(id: number, note: string) {
    return tenantClient.post(`/loan-applications/${id}/request-documents`, { note })
  },
  resumeReview(id: number) {
    return tenantClient.post(`/loan-applications/${id}/resume-review`)
  },
  returnForCorrection(id: number, reason: string) {
    return tenantClient.post(`/loan-applications/${id}/return-for-correction`, { reason })
  },
  rejectAtAppraisal(id: number, reason: string) {
    return tenantClient.post(`/loan-applications/${id}/reject`, { reason })
  },

  // ─── Approval ───────────────────────────────────────────────────────────────
  approve(id: number, comments?: string | null) {
    return tenantClient.post(`/loan-applications/${id}/approve`, { comments })
  },
  decline(id: number, reason: string) {
    return tenantClient.post(`/loan-applications/${id}/decline`, { reason })
  },
  listApprovals(id: number) {
    return tenantClient.get(`/loan-applications/${id}/approvals`)
  },

  // ─── Timeline ───────────────────────────────────────────────────────────────
  getTimeline(id: number) {
    return tenantClient.get<{ data: TimelineEvent[] }>(`/loan-applications/${id}/timeline`)
  },

  // ─── Disbursement queue ──────────────────────────────────────────────────────
  getPendingDisbursements(params?: PendingDisbursementParams) {
    return tenantClient.get('/loan-disbursements/pending', { params })
  },

  // ─── Disbursement ────────────────────────────────────────────────────────────
  disburse(
    id: number,
    data: {
      disbursement_method: string
      disbursement_reference?: string | null
      disbursement_date?: string | null
      schedule_date?: string | null
      notes?: string | null
      charge_deduction_mode?: string | null
      savings_account_id?: number | null
      mobile_money_provider?: string | null
      mobile_money_number?: string | null
    },
  ) {
    return tenantClient.post(`/loan-applications/${id}/disburse`, data)
  },

  // ─── Committee Voting ───────────────────────────────────────────────────────
  bmRecommend(id: number, bmNotes?: string | null) {
    return tenantClient.post(`/loan-applications/${id}/bm-recommend`, { bm_notes: bmNotes })
  },
  committeeReturnForCorrection(id: number, correctionReason: string) {
    return tenantClient.post(`/loan-applications/${id}/committee/return-for-correction`, {
      correction_reason: correctionReason,
    })
  },
  castVote(id: number, data: { decision: 'approve' | 'decline'; comment?: string | null }) {
    return tenantClient.post(`/loan-applications/${id}/votes`, data)
  },
  getVotes(id: number) {
    return tenantClient.get(`/loan-applications/${id}/votes`)
  },
  // alias used by loadCommitteeVotes — same endpoint, returns tally + individual votes
  getCommitteeVotes(id: number) {
    return tenantClient.get(`/loan-applications/${id}/votes`)
  },
  markAbstention(id: number, staffId: number, reason: string) {
    return tenantClient.patch(`/loan-applications/${id}/votes/${staffId}/abstain`, { reason })
  },
  confirmTerms(
    id: number,
    data: {
      final_approved_amount: number | string
      final_approved_term: number
      approved_interest_rate: number | string
      proposed_start_date: string
    },
  ) {
    return tenantClient.patch(`/loan-applications/${id}/confirm-terms`, data)
  },
  getProposedSchedule(
    id: number,
    params?: { amount?: number | string; term?: number; start_date?: string; interest_rate?: number | string },
  ) {
    return tenantClient.get(`/loan-applications/${id}/proposed-schedule`, { params })
  },
  exportProposedSchedule(
    id: number,
    params?: { amount?: number | string; term?: number; start_date?: string; interest_rate?: number | string },
  ) {
    return tenantClient.get(`/loan-applications/${id}/proposed-schedule/export`, {
      params,
      responseType: 'blob',
    })
  },

  // ─── Documents ──────────────────────────────────────────────────────────────
  listDocuments(applicationId: number) {
    return tenantClient.get(`/loan-applications/${applicationId}/documents`)
  },
  uploadDocument(applicationId: number, data: FormData) {
    return tenantClient.post(`/loan-applications/${applicationId}/documents`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  updateDocument(applicationId: number, documentId: number, data: { name: string; notes?: string }) {
    return tenantClient.patch(`/loan-applications/${applicationId}/documents/${documentId}`, data)
  },
  deleteDocument(applicationId: number, documentId: number) {
    return tenantClient.delete(`/loan-applications/${applicationId}/documents/${documentId}`)
  },
  downloadDocument(applicationId: number, documentId: number) {
    return tenantClient.get(`/loan-applications/${applicationId}/documents/${documentId}/download`, {
      responseType: 'blob',
    })
  },

  // ─── Collaterals ────────────────────────────────────────────────────────────
  listCollaterals(applicationId: number) {
    return tenantClient.get(`/loan-applications/${applicationId}/collaterals`)
  },
  addCollateral(applicationId: number, data: Record<string, unknown>) {
    const form = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        if (typeof v === 'string' || v instanceof Blob) {
          form.append(k, v)
        } else {
          form.append(k, String(v))
        }
      }
    })
    return tenantClient.post(`/loan-applications/${applicationId}/collaterals`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  removeCollateral(applicationId: number, collateralId: number) {
    return tenantClient.delete(`/loan-applications/${applicationId}/collaterals/${collateralId}`)
  },
  
  // ─── Guarantors ─────────────────────────────────────────────────────────────
  listGuarantors(applicationId: number) {
    return tenantClient.get<{ data: LoanApplicationGuarantor[]; summary: GuarantorSummary }>(
      `/loan-applications/${applicationId}/guarantors`,
    )
  },
  addGuarantor(
    applicationId: number,
    data: {
      guarantor_type: 'individual' | 'group'
      guarantor_id: number
      guarantor_account_id?: number | null
      guarantee_amount: number
      note?: string | null
    },
  ) {
    return tenantClient.post<{ data: LoanApplicationGuarantor; summary: GuarantorSummary }>(
      `/loan-applications/${applicationId}/guarantors`,
      data,
    )
  },
  removeGuarantor(applicationId: number, guarantorId: number) {
    return tenantClient.delete<{ summary: GuarantorSummary }>(
      `/loan-applications/${applicationId}/guarantors/${guarantorId}`,
    )
  },
  /** Send, or send again, the request asking a guarantor to accept or decline. */
  requestGuarantorConsent(applicationId: number, guarantorId: number) {
    return tenantClient.post<{ data: LoanApplicationGuarantor; summary: GuarantorSummary }>(
      `/loan-applications/${applicationId}/guarantors/${guarantorId}/request-consent`,
    )
  },
  /** Record a guarantor's answer on their behalf, optionally attaching the signed form. */
  recordGuarantorConsent(
    applicationId: number,
    guarantorId: number,
    data: { decision: 'accepted' | 'declined'; reason?: string; document?: File | null },
  ) {
    const form = new FormData()
    form.append('decision', data.decision)
    if (data.reason) form.append('reason', data.reason)
    if (data.document) form.append('document', data.document)
    return tenantClient.post<{
      data: LoanApplicationGuarantor
      summary: GuarantorSummary
      application_status: string
    }>(`/loan-applications/${applicationId}/guarantors/${guarantorId}/consent`, form)
  },
  /** Overdue loans with guarantees standing behind them, most overdue first. */
  guarantorArrears() {
    return tenantClient.get<{ data: GuarantorArrearsRow[]; rules: GuarantorSummary['rules'] }>(
      '/loan-guarantors/arrears',
    )
  },
  /** Warn an overdue loan's guarantors now, without waiting for the daily run. */
  notifyGuarantorsOfArrears(loanId: number) {
    return tenantClient.post<{ message: string; data: { notified: number } }>(
      `/loans/${loanId}/guarantors/notify-arrears`,
    )
  },
  // ─── Recovering defaulted loans from guarantors ───────────────────────────
  guarantorRecoveryPlan(loanId: number, amount?: number) {
    return tenantClient.get<{ data: GuarantorRecoveryPlan }>(`/loans/${loanId}/guarantor-recovery/plan`, {
      params: amount ? { amount } : {},
    })
  },
  proposeGuarantorRecovery(loanId: number, data: { amount?: number; notes?: string }) {
    return tenantClient.post<{ message: string; data: GuarantorRecovery }>(`/loans/${loanId}/guarantor-recovery`, data)
  },
  guarantorRecoveries(params: { status?: string; recovery_loan_status?: string; loan_id?: number } = {}) {
    return tenantClient.get<{ data: GuarantorRecovery[]; meta: { current_page: number; last_page: number; total: number } }>(
      '/guarantor-recoveries',
      { params },
    )
  },
  guarantorRecovery(id: number) {
    return tenantClient.get<{ data: GuarantorRecovery }>(`/guarantor-recoveries/${id}`)
  },
  approveGuarantorRecovery(id: number) {
    return tenantClient.post<{ message: string; data: GuarantorRecovery }>(`/guarantor-recoveries/${id}/approve`)
  },
  rejectGuarantorRecovery(id: number, reason: string) {
    return tenantClient.post<{ message: string; data: GuarantorRecovery }>(`/guarantor-recoveries/${id}/reject`, { reason })
  },
  repayGuarantorRecovery(
    id: number,
    data: { amount: number; payment_date?: string; payment_mode?: string; reference?: string },
  ) {
    return tenantClient.post<{ message: string; data: GuarantorRecovery }>(`/guarantor-recoveries/${id}/repayments`, data)
  },
  // ─── Replacing guarantors and reports ──────────────────────────────────────
  substituteGuarantor(
    guarantorId: number,
    data: {
      guarantor_type: 'individual' | 'group'
      guarantor_id: number
      guarantor_account_id?: number | null
      guarantee_amount?: number
      note?: string
    },
  ) {
    return tenantClient.post<{ message: string; data: LoanApplicationGuarantor }>(
      `/loan-guarantors/${guarantorId}/substitute`,
      data,
    )
  },
  guarantorExposure() {
    return tenantClient.get<{ data: GuarantorExposureRow[] }>('/loan-guarantors/report', { params: { view: 'exposure' } })
  },
  guarantorPendingConsents() {
    return tenantClient.get<{ data: GuarantorPendingConsentRow[] }>('/loan-guarantors/report', {
      params: { view: 'pending_consents' },
    })
  },
  guarantorReleaseRequests() {
    return tenantClient.get<{ data: GuarantorReleaseRequestRow[] }>('/loan-guarantors/report', {
      params: { view: 'release_requests' },
    })
  },
  guarantorSummary(applicationId: number) {
    return tenantClient.get<{ data: GuarantorSummary }>(`/loan-applications/${applicationId}/guarantors/summary`)
  },
  guarantorCapacity(guarantorType: 'individual' | 'group', guarantorId: number) {
    return tenantClient.get<{ data: GuarantorCapacity }>('/loan-guarantors/capacity', {
      params: { guarantor_type: guarantorType, guarantor_id: guarantorId },
    })
  },
  /**
   * Saves every guarantor picked on the application screen in one go: either all are
   * saved or, if any breaks a guarantor rule, none are and a 422 names the problem.
   * Rows are sent as the pickers produced them; the server reads each shape.
   */
  saveGuarantors(applicationId: number, guarantors: any[]) {
    return tenantClient.post('/loan-applications/save-guarantors', {
      application_id: applicationId,
      guarantors,
    })
  },
}
