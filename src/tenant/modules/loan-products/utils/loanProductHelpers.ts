import { formatMoneyValue } from '@/Global'

export function amountHint(raw: number | string | null | undefined) {
  if (raw == null || raw === '') return null
  return formatMoneyValue(raw)
}

export function normalizeAmountInput(raw: string): string {
  const stripped = raw.replace(/[^0-9.,]/g, '')
  const lastComma = stripped.lastIndexOf(',')
  const lastDot = stripped.lastIndexOf('.')

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      // European format (e.g. "1.234.567,89") — comma is the decimal separator
      return stripped.replace(/\./g, '').replace(',', '.')
    } else {
      // en-US format (e.g. "1,234.567.89") or plain integer — strip commas
      return stripped.replace(/,/g, '')
    }
  }

  // If only a comma exists, check if it looks like a thousands separator (3 digits following)
  if (lastComma > -1) {
    const parts = stripped.split(',')
    const lastPart = parts[parts.length - 1]
    if (parts.length > 2 || lastPart.length === 3) {
      return stripped.replace(/,/g, '')
    } else {
      // Treat as decimal (e.g. "400,50")
      return stripped.replace(',', '.')
    }
  }

  // en-US format or plain integer — strip commas just in case
  return stripped.replace(/,/g, '')
}

export function parseAmountInput(raw: string): number | null {
  const normalized = normalizeAmountInput(raw)
  if (!normalized) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

export function formatAmountInput(raw: number | string | null | undefined): string {
  if (raw == null || raw === '') return ''
  const n = Number(raw)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function previewMoney(
  formatted: string | null | undefined,
  raw: number | string | null | undefined,
) {
  if (formatted) return formatted
  if (raw == null || raw === '') return '—'
  return formatMoneyValue(raw)
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    processing_fee: 'Processing Fee',
    penalty: 'Penalty',
    late_fee: 'Late Fee',
    appraisal_fee: 'Appraisal Fee',
    disbursement_fee: 'Disbursement Fee',
    other: 'Other',
  }
  return map[cat] ?? cat
}

export function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    processing_fee: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    penalty: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    late_fee: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    appraisal_fee: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    disbursement_fee: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    other: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  }
  return map[cat] ?? map.other
}
