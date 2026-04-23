type LoanStatusLike = {
  status?: string | null
  status_label?: string | null
  parent_loan_id?: number | null
  topup_type?: string | null
  is_topup?: boolean
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase()
}

function titleCaseStatus(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function isRestructuredTopupLoan(loan: LoanStatusLike | null | undefined): boolean {
  if (!loan) return false

  const status = normalizeStatus(loan.status)
  const statusLabel = normalizeStatus(loan.status_label)

  // Legacy/transition status used by top-up flows in some datasets.
  if (status === 'restructured' || statusLabel === 'restructured') return true

  if (status.includes('restructured topup') || status === 'restructured_topup') return true
  if (statusLabel.includes('restructured topup') || statusLabel === 'restructured_topup') return true

  if (loan.is_topup) return true
  if ((loan.topup_type ?? '').toString().trim() !== '') return true

  const hasParentLoan = Number(loan.parent_loan_id ?? 0) > 0
  return hasParentLoan && (status === 'active' || status === 'disbursed')
}

export function loanStatusLabel(loan: LoanStatusLike | null | undefined): string {
  const status = normalizeStatus(loan?.status)
  if (!status) return '—'

  if (isRestructuredTopupLoan(loan)) return 'Restructured TopUp'
  if (status === 'active') return 'Disbursed'

  return titleCaseStatus(status)
}
