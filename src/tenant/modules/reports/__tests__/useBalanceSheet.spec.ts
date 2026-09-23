import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/Global', () => ({ formatMoneyValue: (v: number | string) => String(v) }))

const getBalanceSheet = vi.fn()
vi.mock('@/tenant/apis/reports/balanceSheetApi', () => ({
  balanceSheetApi: { getBalanceSheet: (...args: unknown[]) => getBalanceSheet(...args) },
}))

import { useBalanceSheet } from '../composables/useBalanceSheet'
import { balanceSheetFixture } from './fixtures/balanceSheet'

describe('useBalanceSheet', () => {
  beforeEach(() => {
    getBalanceSheet.mockReset()
  })

  it('loads, adopts the server comparison date and expands top-level groups', async () => {
    getBalanceSheet.mockResolvedValue(balanceSheetFixture())
    const bs = useBalanceSheet({ autoLoad: false })
    bs.asAt.value = '2026-09-30'

    await bs.generate()

    expect(getBalanceSheet).toHaveBeenCalledWith({ as_at: '2026-09-30', compare_to: undefined, hide_zero: 1 })
    expect(bs.compareTo.value).toBe('2025-12-31')
    expect(bs.rows.value.some(r => r.label === 'Cash at Bank')).toBe(true)
    expect(bs.isBalanced.value).toBe(true)
    expect(bs.kpis.value.map(k => k.key)).toEqual(['assets', 'liabilities', 'equity'])
    expect(bs.kpis.value[0]!.change).toBeCloseTo(3.125)
    expect(bs.drillRange.value).toEqual({ from: '2026-01-01', to: '2026-09-30' })
  })

  it('toggles, expands and collapses groups', async () => {
    getBalanceSheet.mockResolvedValue(balanceSheetFixture())
    const bs = useBalanceSheet({ autoLoad: false })
    await bs.generate()

    bs.collapseAll()
    expect(bs.rows.value.some(r => r.label === 'Cash at Bank')).toBe(false)

    bs.toggle('2')
    expect(bs.rows.value.some(r => r.label === 'Cash at Bank')).toBe(true)
    bs.toggle('2')
    expect(bs.rows.value.some(r => r.label === 'Cash at Bank')).toBe(false)

    bs.expandAll()
    expect(bs.rows.value.some(r => r.label === 'Surplus / (Deficit) – Current Year')).toBe(true)
  })

  it('surfaces the API error message and clears the result', async () => {
    getBalanceSheet.mockRejectedValue({ response: { data: { message: 'The compare to field must be a date before or equal to as at.' } } })
    const bs = useBalanceSheet({ autoLoad: false })

    await bs.generate()

    expect(bs.error.value).toBe('The compare to field must be a date before or equal to as at.')
    expect(bs.result.value).toBeNull()
    expect(bs.loading.value).toBe(false)
  })
})

it('keeps the latest report when responses arrive out of order', async () => {
  let resolveOld!: (value: ReturnType<typeof balanceSheetFixture>) => void
  getBalanceSheet.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
  const newer = { ...balanceSheetFixture(), as_at: '2026-10-31' }
  getBalanceSheet.mockResolvedValueOnce(newer)
  const bs = useBalanceSheet({ autoLoad: false })
  const first = bs.generate()
  bs.asAt.value = '2026-10-31'
  await bs.generate()
  resolveOld(balanceSheetFixture())
  await first
  expect(bs.result.value?.as_at).toBe('2026-10-31')
  expect(bs.loading.value).toBe(false)
})
