/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/Global', () => ({
  formatMoneyValue: (v: number | string) =>
    Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
}))

import BalanceSheetRow from '../components/BalanceSheetRow.vue'
import type { StatementRow } from '../utils/balanceSheetRows'
import { line } from './fixtures/balanceSheet'

function row(partial: Partial<StatementRow>): StatementRow {
  return {
    key: 'k', kind: 'line', label: 'Row', glCode: null, depth: 1,
    amount: 0, compareAmount: 0, hasChildren: false, expanded: false, line: null, ...partial,
  }
}

function mountRow(r: StatementRow) {
  const table = document.createElement('tbody')
  document.body.appendChild(table)
  return mount(BalanceSheetRow, { props: { row: r }, attachTo: table })
}

describe('BalanceSheetRow', () => {
  it('renders negatives in parentheses and the change column', () => {
    const provision = line({ id: 4, gl_code: '11401', name: 'Loan Loss Provision', is_postable: true, amount: -4000 })
    const w = mountRow(row({ label: provision.name, glCode: '11401', amount: -4000, compareAmount: 0, line: provision }))

    const cells = w.findAll('td').map(td => td.text())
    expect(cells[1]).toContain('(4,000.00)')
    expect(cells[2]).toBe('—')
    expect(cells[3]).toContain('(4,000.00)')
  })

  it('emits drill only for postable, non-computed lines with a balance', async () => {
    const cash = line({ id: 3, gl_code: '11101', name: 'Cash at Bank', is_postable: true, amount: 89000 })
    const w = mountRow(row({ label: cash.name, amount: 89000, compareAmount: 80000, line: cash }))

    await w.get('[data-test="drill"]').trigger('click')
    expect(w.emitted('drill')?.[0]).toEqual([cash])

    const surplus = line({ name: 'Surplus / (Deficit) – Current Year', is_computed: true, amount: 5000 })
    const c = mountRow(row({ label: surplus.name, amount: 5000, line: surplus }))
    expect(c.find('[data-test="drill"]').exists()).toBe(false)
    expect(c.text()).toContain('computed')
  })

  it('emits toggle from the chevron with aria-expanded state', async () => {
    const group = line({ id: 2, gl_code: '11000', name: 'Current Assets', children: [line({ name: 'x' })] })
    const w = mountRow(row({ key: '2', label: group.name, hasChildren: true, expanded: false, line: group, amount: 1 }))

    const btn = w.get('[data-test="toggle"]')
    expect(btn.attributes('aria-expanded')).toBe('false')
    await btn.trigger('click')
    expect(w.emitted('toggle')?.[0]).toEqual(['2'])
  })
})
