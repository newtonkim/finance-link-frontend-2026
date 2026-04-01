import { formatMoneyValue } from '@/Global'

export function useLoanApplicationHelpers() {
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
      case 'active':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'rejected':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'cancelled':
        return 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
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

  return {
    statusBadgeClass,
    statusLabel,
    formatAmount,
    displayAmount,
    formatDate,
    formatDateTime,
    riskBadgeClass,
    timelineIconClass,
  }
}
