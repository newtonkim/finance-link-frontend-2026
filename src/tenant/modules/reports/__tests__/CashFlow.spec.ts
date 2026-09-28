import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { getStatement } = vi.hoisted(() => ({ getStatement: vi.fn() }))
vi.mock('@/tenant/apis/reports/cashFlowApi', () => ({ cashFlowApi: { getStatement } }))
// Only its date check is used; keep the real HTTP client out of the test.
vi.mock('@/tenant/apis/reports/incomeStatementApi', () => ({ incomeStatementApi: {} }))
vi.mock('../components/CashFlowLedgerDrawer.vue', () => ({
  default: {
    name: 'CashFlowLedgerDrawer',
    props: ['open', 'account', 'from', 'to', 'branchId'],
    template: '<div data-test="drawer" />',
  },
}))

import CashFlow from '../pages/CashFlow.vue'
import { cashFlowFixture } from './fixtures/cashFlow'
import { cashFlowSummary } from '../utils/cashFlowSummary'
import { cashFlowExportRows } from '../composables/useCashFlowExport'
import { compactMoney } from '../utils/cashFlowFormat'

beforeEach(() => {
  getStatement.mockReset()
})

function mountPage() {
  return mount(CashFlow, { global: { stubs: { RouterLink: true } } })
}

it('opens on the year to date and shows the statement from opening to closing cash', async () => {
  getStatement.mockResolvedValue(cashFlowFixture())
  const wrapper = mountPage()
  await flushPromises()

  expect(getStatement).toHaveBeenCalledWith({ hide_zero: 1 })
  const text = wrapper.text()
  expect(text).toContain('Cash flows from operating activities')
  expect(text).toContain('(400.00)')
  expect(text).toContain('Net cash from financing activities')
  expect(text).toContain('2,280.00')
  expect(text).toContain('Reconciles to the cash accounts')
  wrapper.unmount()
})

it('expands a line and drills into an account for the chosen period', async () => {
  getStatement.mockResolvedValue(cashFlowFixture())
  const wrapper = mountPage()
  await flushPromises()

  const line = wrapper.findAll('button').find((b) => b.text() === 'Loans disbursed to members')!
  await line.trigger('click')
  expect(line.attributes('aria-expanded')).toBe('true')
  expect(wrapper.text()).toContain('Personal Loans')

  await wrapper
    .find('button[aria-label="Personal Loans: cash entries in the comparison period"]')
    .trigger('click')
  expect(wrapper.findComponent({ name: 'CashFlowLedgerDrawer' }).props()).toMatchObject({
    open: true,
    from: '2025-01-01',
    to: '2025-03-31',
  })
  wrapper.unmount()
})

it('warns when the statement does not reconcile or accounts are unclassified', async () => {
  const report = cashFlowFixture()
  report.diagnostics.difference = '10.00'
  report.diagnostics.classification_complete = false
  report.diagnostics.issues = [
    { account_id: 9, gl_code: '29999', name: 'Suspense', message: 'Not classified' },
  ]
  getStatement.mockResolvedValue(report)
  const wrapper = mountPage()
  await flushPromises()

  expect(wrapper.text()).toContain('The statement is out by 10.00')
  expect(wrapper.text()).toContain('Does not reconcile')
  expect(wrapper.text()).toContain('29999')
  wrapper.unmount()
})

it('refuses dates that run backwards without calling the server', async () => {
  getStatement.mockResolvedValue(cashFlowFixture())
  const wrapper = mountPage()
  await flushPromises()
  getStatement.mockClear()

  const inputs = wrapper.findAll('input[type="date"]')
  await inputs[0].setValue('2026-04-01')
  await inputs[1].setValue('2026-03-01')
  await wrapper.find('form').trigger('submit')
  await flushPromises()

  expect(getStatement).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('Enter valid dates')
  wrapper.unmount()
})

it('shows the server message when the statement cannot load', async () => {
  getStatement.mockRejectedValue({
    response: { data: { message: 'This report requires UGX ledger amounts.' } },
  })
  const wrapper = mountPage()
  await flushPromises()

  expect(wrapper.find('[role="alert"]').text()).toContain('requires UGX')
  wrapper.unmount()
})

it('sums the statement up in plain words', () => {
  expect(cashFlowSummary(cashFlowFixture())).toBe(
    'Cash rose by UGX 1,280.00 between 1 Jan 2026 and 31 Mar 2026, from 1,000.00 to 2,280.00. ' +
      'Operating activities brought in 300.00, investing used 150.00, financing brought in 1,060.00 and balances brought onto the system brought in 70.00. ' +
      'The largest single flow was external borrowings received (1,000.00 in).',
  )
})

it('exports every line with its accounts and the opening and closing cash', () => {
  const rows = cashFlowExportRows(cashFlowFixture())
  expect(rows[0]).toEqual([
    '',
    'Cash and cash equivalents at the start of the period',
    '1000.00',
    '0.00',
  ])
  expect(rows).toContainEqual(['11301', '      Personal Loans', '-400.00', '-100.00'])
  expect(rows[rows.length - 1]).toEqual([
    '',
    'Cash and cash equivalents at the end of the period',
    '2280.00',
    '120.00',
  ])
})

it('shortens chart labels', () => {
  expect(compactMoney(1_280_000)).toBe('1.3M')
  expect(compactMoney(-150_000)).toBe('−150K')
  expect(compactMoney(950)).toBe('950')
})
