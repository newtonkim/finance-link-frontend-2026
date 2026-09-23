import { describe, expect, it } from 'vitest'
import { allExpandableKeys, buildStatementRows, defaultExpandedKeys, lineKey } from '../utils/balanceSheetRows'
import { balanceSheetFixture } from './fixtures/balanceSheet'

describe('buildStatementRows', () => {
  it('shows only group lines when nothing is expanded', () => {
    const rows = buildStatementRows(balanceSheetFixture(), new Set())

    expect(rows.map(r => `${r.kind}:${r.label}`)).toEqual([
      'section:Assets',
      'line:Current Assets',
      'grand-total:Total Assets',
      'section:Liabilities',
      'line:Current Liabilities',
      'section-total:Total Liabilities',
      "section:Equity / Members' Funds",
      'line:Share Capital',
      'line:Retained Earnings / Surplus',
      "section-total:Total Equity / Members' Funds",
      'grand-total:Total Liabilities & Equity',
    ])
    expect(rows[1]).toMatchObject({ amount: 165000, compareAmount: 160000, hasChildren: true, expanded: false, depth: 1 })
    expect(rows[rows.length - 1]).toMatchObject({ amount: 165000, compareAmount: 160000 })
  })

  it('expands a group into children followed by a subtotal, blanking the header amount', () => {
    const data = balanceSheetFixture()
    const rows = buildStatementRows(data, new Set([lineKey(data.sections[0]!.lines[0]!)]))

    const labels = rows.slice(1, 6).map(r => `${r.kind}:${r.label}`)
    expect(labels).toEqual([
      'line:Current Assets',
      'line:Cash at Bank',
      'line:Personal Loans',
      'line:Loan Loss Provision',
      'subtotal:Total Current Assets',
    ])
    expect(rows[1]).toMatchObject({ amount: null, compareAmount: null, expanded: true })
    expect(rows[2]).toMatchObject({ depth: 2, glCode: '11101', amount: 89000 })
    expect(rows[5]).toMatchObject({ depth: 1, amount: 165000 })
  })

  it('keys computed lines by name and collects expandable keys', () => {
    const data = balanceSheetFixture()
    const computed = data.sections[2]!.lines[1]!.children[0]!

    expect(lineKey(computed)).toBe('computed:Surplus / (Deficit) – Current Year')
    expect([...defaultExpandedKeys(data)].sort()).toEqual(['10', '12', '2', '7'])
    expect([...allExpandableKeys(data)].sort()).toEqual(['10', '12', '2', '7'])
  })
})
