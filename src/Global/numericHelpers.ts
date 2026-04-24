/**
 * Robust numeric input formatting and parsing utilities.
 * Handles different locales (en-US, European) for thousands separators and decimal points.
 */

/**
 * Normalizes a numeric input string by handling thousands separators and decimal points.
 * Correctly identifies if a comma is a decimal separator (European) or a thousands separator.
 */
export function normalizeAmountInput(raw: string): string {
  if (!raw) return ''
  const stripped = raw.replace(/[^0-9.,]/g, '')
  const lastComma = stripped.lastIndexOf(',')
  const lastDot = stripped.lastIndexOf('.')

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      // European format (e.g. "1.234.567,89") — comma is the decimal separator
      return stripped.replace(/\./g, '').replace(',', '.')
    } else {
      // en-US format (e.g. "1,234,567.89") or plain integer — strip commas
      return stripped.replace(/,/g, '')
    }
  }

  // If only a comma exists, check if it looks like a thousands separator (3 digits following)
  if (lastComma > -1) {
    const parts = stripped.split(',')
    const lastPart = parts[parts.length - 1]
    if (parts.length > 2 || lastPart.length === 3) {
      // Looks like a thousands separator (e.g. "400,000")
      return stripped.replace(/,/g, '')
    } else {
      // Treat as decimal (e.g. "400,50")
      return stripped.replace(',', '.')
    }
  }

  // en-US format or plain integer — strip commas just in case
  return stripped.replace(/,/g, '')
}

/**
 * Parses a numeric input string into a number.
 */
export function parseAmountInput(raw: string): number | null {
  const normalized = normalizeAmountInput(raw)
  if (!normalized) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/**
 * Formats a number for display in an input field (with commas).
 */
export function formatAmountInput(raw: number | string | null | undefined): string {
  if (raw == null || raw === '') return ''
  const n = Number(raw)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Provides a hint for the formatted amount (e.g. for display below an input).
 */
export function amountHint(raw: number | string | null | undefined, formatMoneyValue: (v: any) => string): string | null {
  if (raw == null || raw === '') return null
  return formatMoneyValue(raw)
}

/**
 * Previews an amount, favoring a formatted string if provided.
 */
export function previewMoney(
  formatted: string | null | undefined,
  raw: number | string | null | undefined,
  formatMoneyValue: (v: any) => string
): string {
  if (formatted) return formatted
  if (raw == null || raw === '') return '—'
  return formatMoneyValue(raw)
}
