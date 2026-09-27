import { beforeEach, expect, it, vi } from 'vitest'
const { getStatement } = vi.hoisted(() => ({ getStatement: vi.fn() }))
vi.mock('@/tenant/apis/reports/incomeStatementApi', () => ({
  incomeStatementApi: { getStatement },
}))
import { useIncomeStatement, validReportDate } from '../composables/useIncomeStatement'
import { incomeStatementFixture } from './fixtures/incomeStatement'

beforeEach(() => {
  getStatement.mockReset()
})
it('uses the server financial year defaults then sends explicit paired periods', async () => {
  getStatement.mockResolvedValue(incomeStatementFixture())
  const report = useIncomeStatement({ autoLoad: false })
  await report.generate(true)
  expect(getStatement).toHaveBeenLastCalledWith({ hide_zero: 1 })
  expect(report.from.value).toBe('2026-01-01')
  await report.generate()
  expect(getStatement).toHaveBeenLastCalledWith({
    from: '2026-01-01',
    to: '2026-09-30',
    compare_from: '2025-01-01',
    compare_to: '2025-09-30',
    hide_zero: 1,
  })
})
it('rejects impossible dates and clears stale data', async () => {
  getStatement.mockResolvedValue(incomeStatementFixture())
  const report = useIncomeStatement({ autoLoad: false })
  await report.generate(true)
  report.from.value = '2026-02-30'
  await report.generate()
  expect(getStatement).toHaveBeenCalledTimes(1)
  expect(report.result.value).toBeNull()
  expect(report.error.value).toContain('valid dates')
  expect(validReportDate('2024-02-29')).toBe(true)
})
it('ignores out-of-order responses and retains dates on the displayed snapshot', async () => {
  let resolveFirst!: (value: ReturnType<typeof incomeStatementFixture>) => void
  getStatement.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveFirst = resolve
      }),
  )
  const newer = { ...incomeStatementFixture(), to: '2026-10-31' }
  getStatement.mockResolvedValueOnce(newer)
  const report = useIncomeStatement({ autoLoad: false })
  const first = report.generate(true)
  await report.generate(true)
  resolveFirst(incomeStatementFixture())
  await first
  report.to.value = '2026-12-31'
  expect(report.result.value?.to).toBe('2026-10-31')
  expect(report.loading.value).toBe(false)
})
it('shows failed requests separately from an empty report', async () => {
  getStatement.mockRejectedValue({ response: { data: { message: 'Unsupported currency' } } })
  const report = useIncomeStatement({ autoLoad: false })
  await report.generate(true)
  expect(report.error.value).toBe('Unsupported currency')
  expect(report.result.value).toBeNull()
})
