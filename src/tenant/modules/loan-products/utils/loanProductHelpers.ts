import {
  formatMoneyValue,
  normalizeAmountInput as globalNormalize,
  parseAmountInput as globalParse,
  formatAmountInput as globalFormat,
  amountHint as globalHint,
  previewMoney as globalPreview,
} from '@/Global'

export function amountHint(raw: number | string | null | undefined) {
  return globalHint(raw, formatMoneyValue)
}

export function normalizeAmountInput(raw: string): string {
  return globalNormalize(raw)
}

export function parseAmountInput(raw: string): number | null {
  return globalParse(raw)
}

export function formatAmountInput(raw: number | string | null | undefined): string {
  return globalFormat(raw)
}

export function previewMoney(
  formatted: string | null | undefined,
  raw: number | string | null | undefined,
) {
  return globalPreview(formatted, raw, formatMoneyValue)
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
