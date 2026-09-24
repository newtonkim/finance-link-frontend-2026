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

  it('loads a standalone snapshot and expands top-level groups', async () => {
    getBalanceSheet.mockResolvedValue(balanceSheetFixture())
    const bs = useBalanceSheet({ autoLoad: false })
    bs.asAt.value = '2026-09-30'

    await bs.generate()

    expect(getBalanceSheet).toHaveBeenCalledWith({ as_at: '2026-09-30', compare_to: '2026-09-30', hide_zero: 1 })
    expect(bs.showComparison.value).toBe(false)
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

 it('uses independent period ends and keeps generated selection stable while editing', async () => {
   getBalanceSheet.mockResolvedValue(balanceSheetFixture())
   const bs = useBalanceSheet({ autoLoad: false })
   bs.mode.value = 'compare'
   bs.asAt.value = '2020-01-01'
   bs.firstFrom.value = '2026-01-01'
   bs.firstTo.value = '2026-03-31'
   bs.secondFrom.value = '2026-04-01'
   bs.secondTo.value = '2026-06-30'
   await bs.generate()
   expect(getBalanceSheet).toHaveBeenLastCalledWith({ as_at: '2026-03-31', compare_to: '2026-06-30', hide_zero: 1 })
   expect(bs.showComparison.value).toBe(true)
   bs.mode.value = 'as-at'
   bs.firstFrom.value = '2025-01-01'
   expect(bs.showComparison.value).toBe(true)
   expect(bs.selection.value?.firstFrom).toBe('2026-01-01')
   expect(bs.asAt.value).toBe('2020-01-01')
 })
 it('rejects reversed ranges without requesting a report', async () => {
   getBalanceSheet.mockClear()
   const bs = useBalanceSheet({ autoLoad: false })
   bs.mode.value = 'compare'
   bs.firstFrom.value = '2026-12-31'
   bs.firstTo.value = '2026-01-01'
   await bs.generate()
   expect(getBalanceSheet).not.toHaveBeenCalled()
   expect(bs.error.value).toContain('period start')
 })
