import { tenantClient } from '../tenantClient'

export interface LoanScheduleEntry {
  id: number
  installment_no: number
  due_date: string
  principal_due: string
  principal_due_formatted: string
  interest_due: string
  interest_due_formatted: string
  charges_due: string
  penalty_due: string
  total_due: string
  total_due_formatted: string
  principal_paid: string
  interest_paid: string
  charges_paid: string
  penalty_paid: string
  outstanding_balance: string
  outstanding_balance_formatted: string
  status: 'pending' | 'paid' | 'partial_pay' | 'arrears' | string
  paid_date: string | null
  is_overdue: boolean
  days_overdue: number
  reschedule_id?: number | null
}

export interface LoanTransaction {
  id: number
  payment_id: string
  reschedule_id: number | null
  receipt_no: string | null
  transaction_ref: string | null
  amount_paid: string
  amount_paid_formatted: string
  principal_portion: string
  principal_portion_formatted?: string
  interest_portion: string
  interest_portion_formatted?: string
  penalty_portion: string
  penalty_portion_formatted?: string
  charges_portion: string
  charges_portion_formatted?: string
  // Alternative field names the API might return
  principal?: string
  principal_amount?: string
  principal_amount_formatted?: string
  interest?: string
  interest_amount?: string
  interest_amount_formatted?: string
  penalty?: string
  penalty_amount?: string
  penalty_amount_formatted?: string
  payment_date: string
  payment_method: string
  reversal_flag: boolean
  reversed_date: string | null
  collected_by: { id: number; name: string } | null
  loan_officer_id?: number | null
  loan_officer?: { id: number; name: string } | null
}

export interface LoanSummary {
  disbursed: number
  approved: number
  pending: number
  arrears: number
  closed?: number
  all: number
  rescheduled?: number
  topup?: number
}

export type LoanTab = 'all' | 'disbursed' | 'arrears' | 'closed' | 'approved' | 'pending' | 'rescheduled' | 'topup'

export interface ActiveLoan {
  id: number
  loan_no: string
  status: string
  status_label?: string | null
  principal: string
  principal_formatted: string
  outstanding_balance: string
  outstanding_balance_formatted: string
  interest_rate?: string
  term_months?: number
  disbursed_at: string | null
  approved_at?: string | null
  disbursement_method?: string
  member: {
    id: number
    name: string
    member_number: string | null
  } | null
  loan_product: {
    id: number
    name: string
    code: string
    interest_method?: string
  } | null
  next_due_date: string | null
  next_installment_amount: string | null
  is_rescheduled?: boolean
  is_topup?: boolean
  parent_loan_id?: number | null
  topup_type?: string | null
  reschedule_date?: string | null
  _source?: 'loan' | 'application'
}

export interface LoanAppliedCharge {
  id: number
  name: string
  charge_type: 'flat' | 'percentage'
  application_timing: 'on_disbursement' | 'on_repayment' | string
  charge_amount: string
  charge_amount_formatted: string
  used_amount: string
  remaining_amount: number
  is_waived: boolean
  is_mandatory: boolean
  waiver_reason: string | null
}

export interface LoanPenaltyRule {
  id: number
  system_type: string
  penalty_type: string | null
  penalty_rate: string | number
  grace_days: number
  amount: string | number
  applies_to: string | null
}
export interface LoanProductCharge {
  id: number
  name: string
  charge_type: 'flat' | 'percentage'
  value: string | number
  frequency: 'one_time' | 'installment' | string
  application_timing: 'on_disbursement' | 'on_repayment' | string
}

export interface LoanActivityEvent {
  id?: number
  type?: string
  title?: string
  description?: string
  actor?: { id: number; name: string } | null
  notes?: string | null
  timestamp: string
}

export interface LoanDetail {
  id: number
  loan_no: string
  loan_application_id: number | null
  member_id: number
  loan_product_id: number
  branch_id: number | null
  loan_officer_id: number | null
  approved_by: number | null
  disbursed_by: number | null
  principal: string
  principal_formatted: string
  processing_fee: string
  processing_fee_formatted: string
  total_charges_deducted?: string
  total_charges_deducted_formatted?: string
  charge_deduction_mode?: string | null
  net_disbursed_amount: string
  net_disbursed_amount_formatted: string
  outstanding_balance: string
  outstanding_balance_formatted: string
  interest_rate: string
  term_months: number
  disbursed_at: string
  disbursement_method: string
  disbursement_reference: string | null
  status: string
  is_rescheduled: boolean
  reschedule_count: number
  original_term_months?: number
  original_interest_rate?: string | number
  approved_at?: string
  schedule_date?: string
  notes: string | null
  currency_code: string
  loan_product: {
    id: number
    name: string
    code: string
    interest_method?: string
    repayment_cycle?: string | null
    grace_period?: number | null
    penalty_type?: string | null
    penalty_rate?: string | number | null
    penalty_grace_days?: number | null
    penalty_rules?: LoanPenaltyRule[]
    charges?: LoanProductCharge[]
  } | null
  member: { id: number; name: string; member_number: string | null } | null
  loan_officer: { id: number; name: string } | null
  disbursed_by_staff: { id: number; name: string } | null
  applied_charges?: LoanAppliedCharge[]
  parent_loan_id?: number | null
  parent_loan?: {
    id: number
    loan_no: string
    principal_formatted: string
    outstanding_balance_formatted: string
    status: string
    status_label: string
    disbursed_at: string
  } | null
}

export interface RepaymentPreview {
  total: number
  penalty: number
  charges: number
  interest: number
  principal: number
  overpayment: number
  schedules: Array<{
    installment_no: number
    due_date: string
    penalty_applied: number
    charges_applied: number
    interest_applied: number
    principal_applied: number
  }>
}

export interface ActiveLoanParams {
  tab?: LoanTab
  status?: string
  member_id?: number
  member_name?: string
  loan_product_id?: number | string
  search?: string
  page?: number
  per_page?: number
  approved_date_from?: string
  approved_date_to?: string
  disbursed_date_from?: string
  disbursed_date_to?: string
}

export interface PostRepaymentData {
  amount: number | string
  payment_method: string
  payment_date: string
  receipt_no?: string | null
  transaction_ref?: string | null
  notes?: string | null
  loan_officer_id?: number | null
}

export interface SavingsRepaymentData {
  savings_account_id: number | null
  amount: number | string
  payment_date: string
  notes?: string | null
}

export interface RescheduleParams {
  reschedule_type: 'tenor_extension' | 'rate_change' | 'capitalization'
  new_tenor_months?: number
  new_interest_rate?: number
  capitalize_arrears?: boolean
  penalties_waived?: number
  interest_waived?: number
  reschedule_date?: string
  reason: string
}

export interface RescheduleHistoryEntry {
  id: number
  reschedule_id: string
  reschedule_date: string
  reschedule_type: string
  old_status?: string | null
  old_outstanding: string | number
  old_interest_rate: string | number
  old_remaining_periods: number
  new_principal: string | number
  new_rate: string | number
  new_duration: number
  reason: string
  performed_by: string
  superseded_schedule: LoanScheduleEntry[]
}

export interface LoanSnapshot {
  outstanding_balance: number
  interest_rate: number
  remaining_periods: number
  maturity_date: string | null
  term_months: number
  arrears_amount: number
  interest_arrears: number
  penalty_arrears: number
  charges_arrears: number
}

export interface NewLoanSnapshot {
  principal_balance: number
  interest_rate: number
  tenor_months: number
  installment_amount: number
  maturity_date: string | null
  total_interest: number
}

export interface ReschedulePreviewResult {
  old_snapshot: LoanSnapshot
  new_snapshot: NewLoanSnapshot
  capitalized_arrears: number
  capitalized_interest: number
  penalties_waived: number
  interest_waived: number
  preview_schedule: Array<{
    period: number
    due_date: string
    principal: number
    interest: number
    installment: number
    balance: number
  }>
}

export const loansApi = {
  // ─── Loan portfolio ───────────────────────────────────────────────────────
  summary() {
    return tenantClient.get<LoanSummary>('/loans/summary')
  },

  list(params?: ActiveLoanParams) {
    return tenantClient.get<{ data: ActiveLoan[]; meta: any }>('/loans', { params })
  },

  export(params?: ActiveLoanParams) {
    return tenantClient.get('/loans/export', { params, responseType: 'blob' })
  },

  get(id: number) {
    return tenantClient.get<{ data: LoanDetail }>(`/loans/${id}`)
  },

  getSchedule(id: number) {
    return tenantClient.get<{ data: LoanScheduleEntry[] }>(`/loans/${id}/schedule`)
  },

  getRepayments(id: number, params?: { page?: number; per_page?: number }) {
    return tenantClient.get<{ data: LoanTransaction[]; meta: object }>(`/loans/${id}/repayments`, {
      params,
    })
  },

  getLedger(id: number, params?: { page?: number; per_page?: number }) {
    return tenantClient.get(`/loans/${id}/ledger`, { params })
  },

  getActivities(id: number) {
    return tenantClient.get<{ data: LoanActivityEvent[] }>(`/loans/${id}/activities`)
  },

  // ─── Repayments ───────────────────────────────────────────────────────────
  previewRepayment(id: number, amount: number) {
    return tenantClient.post<{ data: RepaymentPreview }>(`/loans/${id}/repayments/preview`, {
      amount,
    })
  },

  postRepayment(id: number, data: PostRepaymentData) {
    return tenantClient.post<{ message: string; data: LoanTransaction }>(
      `/loans/${id}/repayments`,
      data,
    )
  },

  repayFromSavings(id: number, data: SavingsRepaymentData) {
    return tenantClient.post<{ message: string; data: LoanTransaction }>(
      `/loans/${id}/repay-from-savings`,
      data,
    )
  },

  // ─── Rescheduling ─────────────────────────────────────────────────────────
  reschedulePreview(id: number, data: RescheduleParams) {
    return tenantClient.post<{ data: ReschedulePreviewResult }>(
      `/loans/${id}/reschedule/preview`,
      data,
    )
  },

  reschedule(id: number, data: RescheduleParams) {
    return tenantClient.post<{ message: string; data: RescheduleHistoryEntry }>(
      `/loans/${id}/reschedule`,
      data,
    )
  },

  getReschedules(id: number) {
    return tenantClient.get<{ data: RescheduleHistoryEntry[] }>(`/loans/${id}/reschedules`)
  },

  updateDates(id: number, data: { disbursed_at: string, schedule_date: string }) {
    return tenantClient.patch<{ message: string; data: LoanDetail }>(`/loans/${id}/update-dates`, data)
  },

  // ─── Top-Up ───────────────────────────────────────────────────────────────
  topupEligibility(id: number, data: { fresh_cash_amount: number; requested_term: number; topup_type: 'consolidated' | 'parallel' }) {
    return tenantClient.post<{ data: any }>(`/loans/${id}/topup/eligibility`, data)
  },

  executeTopup(id: number, data: { fresh_cash_amount: number; requested_term: number; topup_type: 'consolidated' | 'parallel' }) {
    return tenantClient.post<{ data: any }>(`/loans/${id}/topup/execute`, data)
  },
}
