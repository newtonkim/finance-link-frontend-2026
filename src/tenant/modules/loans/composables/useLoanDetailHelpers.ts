import { formatMoneyValue } from '@/Global'

export function useLoanDetailHelpers() {
  function fmt(v: number | string | null | undefined) {
    if (v == null || v === '') return '—'
    return formatMoneyValue(v)
  }

  function toNumber(v: number | string | null | undefined): number | null {
    if (v == null || v === '') return null
    if (typeof v === 'number') return Number.isFinite(v) ? v : null
    const cleaned = String(v)
      .trim()
      .replace(/[^0-9.-]/g, '')
    if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }

  function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function statusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'arrears':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'closed':
        return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
      case 'rescheduled':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      default:
        return 'bg-neutral-100 text-neutral-500'
    }
  }

  function generalStatusColor(status: string) {
    if (status === 'closed') {
      return 'bg-nfuko-primary text-white'
    }
    if (status === 'rescheduled') {
      return 'bg-amber-500 text-white'
    }
    return statusColor(status)
  }

  function scheduleStatusColor(s: string) {
    switch (s) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'arrears':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'partial':
      case 'partial_pay':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'pending':
        return 'bg-red-900 text-white dark:bg-red-950 dark:text-red-100'
      case 'superseded':
        return 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 opacity-60'
      default:
        return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
    }
  }

  return {
    fmt,
    toNumber,
    fmtDate,
    statusColor,
    generalStatusColor,
    scheduleStatusColor,
  }
}
