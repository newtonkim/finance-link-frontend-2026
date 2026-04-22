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

export interface PendingDisbursementParams {
  page?: number
  per_page?: number
}

export function loanApplicationsApi2() {
  const Store = pomPinia()

 
  async function saveLoanApplicationNoneMemberGuarantors(data: any = {}) {
    console.log(data);
    
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
    return tenantClient.get(`/loan-applications/${applicationId}/guarantors`)
  },
  addGuarantor(applicationId: number, data: any) {
    return tenantClient.post(`/loan-applications/${applicationId}/guarantors`, data)
  },
  removeGuarantor(applicationId: number, guarantorId: number) {
    return tenantClient.delete(`/loan-applications/${applicationId}/guarantors/${guarantorId}`)
  },
}
