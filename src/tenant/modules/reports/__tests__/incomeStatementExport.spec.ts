import { expect, it, vi } from 'vitest'
import { ref } from 'vue'
const { writeFile } = vi.hoisted(() => ({ writeFile: vi.fn() }))
vi.mock('xlsx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('xlsx')>()),
  writeFile,
}))
import {
  incomeExportRows,
  incomeExportMetadata,
  useIncomeStatementExport,
} from '../composables/useIncomeStatementExport'
import { formatStatementMoney, safeSpreadsheetText } from '../utils/incomeStatementFormat'
import { incomeStatementFixture } from './fixtures/incomeStatement'

it('formats decimals without precision loss and preserves contra signs', () => {
  expect(formatStatementMoney('90071992547409.91')).toBe('90,071,992,547,409.91')
  expect(formatStatementMoney('-100.01')).toBe('(100.01)')
  expect(formatStatementMoney('0.00')).toBe('—')
})
it('exports full account detail and reporting context from the response', () => {
  const r = incomeStatementFixture()
  expect(incomeExportRows(r)).toContainEqual(['41101', '  Loan interest', '100.10', '80.00'])
  const text = incomeExportMetadata(r).join('\n')
  expect(text).toContain('2026-01-01 to 2026-09-30; comparison 2025-01-01 to 2025-09-30')
  expect(text).toContain('UGX · All branches')
  expect(text).toContain('Mapping v1')
})
it('neutralizes spreadsheet text formulas including leading whitespace', () => {
  for (const value of ['=SUM(A1)', '+SUM(A1)', '-cmd', '@test', '  =test', '\t=test'])
    expect(safeSpreadsheetText(value)).toBe(`'${value}`)
  expect(safeSpreadsheetText('Loan interest')).toBe('Loan interest')
})
it('writes exact decimal text cells and safe account labels to Excel', async () => {
  const r = incomeStatementFixture()
  r.rows[0].accounts[0].name = '=DANGEROUS()'
  r.rows[0].accounts[0].amount = '90071992547409.91'
  await useIncomeStatementExport(ref(r)).exportReport('excel')
  const sheet = writeFile.mock.calls.at(-1)![0].Sheets['Income Statement']
  const cells = Object.values(sheet) as { v: unknown; t: string; f?: string }[]
  expect(cells.some((c) => c.v === '90071992547409.91' && c.t === 's')).toBe(true)
  expect(cells.some((c) => c.v === "'  =DANGEROUS()" && !c.f)).toBe(true)
})
