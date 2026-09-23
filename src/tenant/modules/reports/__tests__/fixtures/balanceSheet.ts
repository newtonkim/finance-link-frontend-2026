import type { BalanceSheetLine, BalanceSheetResponse } from '@/tenant/apis/reports/balanceSheetApi'

export function line(partial: Partial<BalanceSheetLine> & { name: string }): BalanceSheetLine {
  return {
    id: null, gl_code: null, level: null, is_postable: false, is_computed: false,
    amount: 0, compare_amount: 0, children: [], ...partial,
  }
}

const cash = line({ id: 3, gl_code: '11101', name: 'Cash at Bank', level: 4, is_postable: true, amount: 89000, compare_amount: 80000 })
const provision = line({ id: 4, gl_code: '11401', name: 'Loan Loss Provision', level: 4, is_postable: true, amount: -4000, compare_amount: 0 })
const loans = line({ id: 5, gl_code: '11301', name: 'Personal Loans', level: 4, is_postable: true, amount: 80000, compare_amount: 80000 })
const currentAssets = line({ id: 2, gl_code: '11000', name: 'Current Assets', level: 2, amount: 165000, compare_amount: 160000, children: [cash, loans, provision] })
const savings = line({ id: 8, gl_code: '21101', name: 'Member Savings', level: 4, is_postable: true, amount: 100000, compare_amount: 100000 })
const currentLiab = line({ id: 7, gl_code: '21000', name: 'Current Liabilities', level: 2, amount: 100000, compare_amount: 100000, children: [savings] })
const shares = line({ id: 11, gl_code: '31100', name: 'Ordinary Share Capital', level: 3, is_postable: true, amount: 50000, compare_amount: 50000 })
const shareCapital = line({ id: 10, gl_code: '31000', name: 'Share Capital', level: 2, amount: 50000, compare_amount: 50000, children: [shares] })
const surplus = line({ name: 'Surplus / (Deficit) – Current Year', is_computed: true, amount: 5000, compare_amount: 10000 })
const prior = line({ name: 'Retained Surplus – Prior Years (unclosed)', is_computed: true, amount: 10000, compare_amount: 0 })
const retained = line({ id: 12, gl_code: '33000', name: 'Retained Earnings / Surplus', level: 2, amount: 15000, compare_amount: 10000, children: [surplus, prior] })

export function balanceSheetFixture(): BalanceSheetResponse {
  const totals = (assets: number, liabilities: number, equity: number) => ({
    total_assets: assets, total_liabilities: liabilities, total_equity: equity,
    total_liabilities_and_equity: liabilities + equity,
    difference: assets - liabilities - equity, is_balanced: assets === liabilities + equity,
  })

  return structuredClone({
    as_at: '2026-09-30',
    compare_to: '2025-12-31',
    financial_year: { name: 'FY2026', start_date: '2026-01-01', end_date: '2026-12-31' },
    generated_at: '2026-09-30T10:00:00+03:00',
    sections: [
      { key: 'assets', label: 'Assets', total: 165000, compare_total: 160000, lines: [currentAssets] },
      { key: 'liabilities', label: 'Liabilities', total: 100000, compare_total: 100000, lines: [currentLiab] },
      { key: 'equity', label: "Equity / Members' Funds", total: 65000, compare_total: 60000, lines: [shareCapital, retained] },
    ],
    totals: { current: totals(165000, 100000, 65000), compare: totals(160000, 100000, 60000) },
  }) as BalanceSheetResponse
}
