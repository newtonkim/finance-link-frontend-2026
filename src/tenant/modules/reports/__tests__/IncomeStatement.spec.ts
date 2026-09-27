import { beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
const { getStatement } = vi.hoisted(() => ({ getStatement: vi.fn() }))
vi.mock('@/tenant/apis/reports/incomeStatementApi', () => ({
  incomeStatementApi: { getStatement },
}))
vi.mock('../components/LedgerDrillDownDrawer.vue', () => ({
  default: {
    name: 'LedgerDrillDownDrawer',
    props: ['open', 'account', 'from', 'to', 'source'],
    template: '<div data-test="ledger" />',
  },
}))
import IncomeStatement from '../pages/IncomeStatement.vue'
import { incomeStatementFixture } from './fixtures/incomeStatement'

beforeEach(() => {
  getStatement.mockReset()
})
it('renders the statement and drills into the selected comparative period', async () => {
  getStatement.mockResolvedValue(incomeStatementFixture())
  const wrapper = mount(IncomeStatement, { global: { stubs: { RouterLink: true } } })
  await flushPromises()
  expect(wrapper.text()).toContain('100.10')
  const button = wrapper.findAll('button').find((b) => b.text() === 'Interest income')!
  await button.trigger('click')
  expect(button.attributes('aria-expanded')).toBe('true')
  await wrapper.find('button[aria-label="Loan interest: comparison ledger"]').trigger('click')
  const drawer = wrapper.findComponent({ name: 'LedgerDrillDownDrawer' })
  expect(drawer.props()).toMatchObject({
    open: true,
    from: '2025-01-01',
    to: '2025-09-30',
    source: 'income-statement',
  })
  wrapper.unmount()
})
it('shows classification issues and a distinct empty-data state', async () => {
  const report = incomeStatementFixture()
  report.diagnostics.has_movements = false
  report.diagnostics.classification_complete = false
  report.diagnostics.issues = [
    { account_id: 1, gl_code: '49999', name: 'Custom income', message: 'No mapping' },
  ]
  getStatement.mockResolvedValue(report)
  const wrapper = mount(IncomeStatement, { global: { stubs: { RouterLink: true } } })
  await flushPromises()
  expect(wrapper.text()).toContain('No posted income or expense movements')
  expect(wrapper.text()).toContain('Intermediate subtotals cover classified accounts only')
  expect(wrapper.text()).toContain('49999')
  wrapper.unmount()
})
