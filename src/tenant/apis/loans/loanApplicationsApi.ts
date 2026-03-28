import { tenantClient } from '../tenantClient'

export interface LoanApplicationStatusHistory {
  id: number
  from_status: string | null
  to_status: string
  notes: string | null
  changed_at: string
  changed_by?: { id: number; name: string } | null
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
  approved_amount?: number | string | null
  approved_amount_formatted?: string | null
  approved_term?: number | null
  rejection_reason?: string | null
  cancellation_reason?: string | null
  cancelled_at?: string | null
  appraisal_notes?: string | null
  approval_notes?: string | null
  submitted_at?: string | null
  recommended_at?: string | null
  approved_at?: string | null
  rejected_at?: string | null
  disbursed_at?: string | null
  created_at?: string
  // Nested
  member?: { id: number; name: string; member_no: string } | null
  loan_product?: { id: number; name: string; code: string } | null
  loan_officer?: { id: number; name: string } | null
  appraised_by?: { id: number; name: string } | null
  approved_by?: { id: number; name: string } | null
  rejected_by?: { id: number; name: string } | null
  status_history?: LoanApplicationStatusHistory[]
  created_by?: { id: number; name: string } | null
  days_pending?: number | null
  currency_code?: string | null
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

export const loanApplicationsApi = {
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
    return tenantClient.post<{ data: EligibilityResult }>('/loan-applications/eligibility-check', data)
  },
  // Guarantors
  listGuarantors(applicationId: number) {
    return tenantClient.get(`/loan-applications/${applicationId}/guarantors`)
  },
  addGuarantor(applicationId: number, data: { member_id: number; guarantee_amount: number; notes?: string }) {
    return tenantClient.post(`/loan-applications/${applicationId}/guarantors`, data)
  },
  removeGuarantor(applicationId: number, guarantorId: number) {
    return tenantClient.delete(`/loan-applications/${applicationId}/guarantors/${guarantorId}`)
  },
  validateGuarantors(applicationId: number) {
    return tenantClient.post(`/loan-applications/${applicationId}/guarantors/validate`)
  },
  // Documents
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
}
