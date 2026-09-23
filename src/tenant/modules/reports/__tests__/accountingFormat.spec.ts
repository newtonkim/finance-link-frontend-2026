import { describe, expect, it, vi } from 'vitest'

vi.mock('@/Global', () => ({
  formatMoneyValue: (v: number | string) =>
    Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
}))

import { formatAccounting, formatLongDate, formatShortDate, percentChange } from '../utils/accountingFormat'

describe('accountingFormat', () => {
  it('formats positives plainly and negatives in parentheses', () => {
    expect(formatAccounting(165000)).toBe('165,000.00')
    expect(formatAccounting(-4000)).toBe('(4,000.00)')
  })

  it('renders zero (including rounding noise) as a dash and null as empty', () => {
    expect(formatAccounting(0)).toBe('—')
    expect(formatAccounting(-0.001)).toBe('—')
    expect(formatAccounting(null)).toBe('')
  })

  it('returns null percent change for a zero base', () => {
    expect(percentChange(100, 0)).toBeNull()
    expect(percentChange(110, 100)).toBeCloseTo(10)
    expect(percentChange(-50, -100)).toBeCloseTo(50)
  })

  it('formats dates without locale ambiguity', () => {
    expect(formatLongDate('2026-09-23')).toBe('23 September 2026')
    expect(formatShortDate('2026-09-23')).toBe('23 Sep 2026')
  })
})
