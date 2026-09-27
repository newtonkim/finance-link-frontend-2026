import type { IncomeStatementResponse } from '@/tenant/apis/reports/incomeStatementApi'
export function incomeStatementFixture(): IncomeStatementResponse {
  return {
    entity: 'Test SACCO',
    currency: 'UGX',
    basis: 'Posted ledger management report',
    from: '2026-01-01',
    to: '2026-09-30',
    compare_from: '2025-01-01',
    compare_to: '2025-09-30',
    generated_at: '2026-09-30T12:00:00Z',
    mapping_version: 'v1',
    scope: { all_branches: true, branch_ids: [], selected_branch_id: null },
    financial_year: null,
    period_default: 'calendar_year',
    rows: [
      {
        key: 'interest_income',
        label: 'Interest income',
        kind: 'section',
        amount: '100.10',
        compare_amount: '80.00',
        accounts: [
          {
            id: 1,
            gl_code: '41101',
            name: 'Loan interest',
            amount: '100.10',
            compare_amount: '80.00',
          },
        ],
      },
      {
        key: 'surplus',
        label: 'Surplus / (Deficit) for the period',
        kind: 'subtotal',
        amount: '100.10',
        compare_amount: '80.00',
        accounts: [],
      },
    ],
    totals: { surplus: '100.10', compare_surplus: '80.00' },
    diagnostics: {
      issues: [],
      classification_complete: true,
      has_movements: true,
      ledger_surplus: '100.10',
      compare_ledger_surplus: '80.00',
      difference: '0.00',
      compare_difference: '0.00',
      closing_transfers_excluded: '0.00',
      compare_closing_transfers_excluded: '0.00',
    },
  }
}
