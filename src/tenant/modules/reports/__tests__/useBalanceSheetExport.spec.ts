import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useBalanceSheetExport } from '../composables/useBalanceSheetExport'
import { balanceSheetFixture } from './fixtures/balanceSheet'
import { buildStatementRows } from '../utils/balanceSheetRows'

const { writeFile, savePdf } = vi.hoisted(() => ({ writeFile: vi.fn(), savePdf: vi.fn() }))
vi.mock('xlsx', async importOriginal => ({ ...await importOriginal<typeof import('xlsx')>(), writeFile }))
vi.mock('jspdf', async importOriginal => {
  const actual = await importOriginal<typeof import('jspdf')>()
  return { ...actual, default: class extends actual.jsPDF {
    constructor(...args: ConstructorParameters<typeof actual.jsPDF>) {
      super(...args)
      this.save = ((name: string) => { savePdf(name, this.output()); return this }) as unknown as typeof this.save
    }
  } }
})
vi.mock('@/Global', () => ({ formatMoneyValue: (v: number) => v.toFixed(2) }))
vi.mock('@/tenant/apis/saccobranding/saccoBrandingApi', () => ({ saccoBrandingState: { sacco_name: 'Test SACCO' } }))

function exports() {
  const report = balanceSheetFixture()
  const rows = buildStatementRows(report, new Set())
  return { actions: useBalanceSheetExport(ref(report), ref(rows)), rows }
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('balance sheet exports', () => {
  it('exports CSV with matching visible rows and quoted account labels', async () => {
    let csvBlob!: Blob
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL(blob: Blob) { csvBlob = blob; return 'blob:test' }
      static revokeObjectURL() {}
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { actions } = exports()
    actions.exportCsv()
    const text = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(csvBlob)
    })
    expect(click).toHaveBeenCalledOnce()
    expect(text).toContain('"Current Assets","165000","160000","5000"')
    expect(text).not.toContain('Cash at Bank')
    expect(text).toContain('"Total Liabilities & Equity","165000","160000","5000"')
  })

  it('exports visible rows to a real workbook with numeric amounts', () => {
    const { actions, rows } = exports()
    actions.exportExcel()
    const [workbook, filename] = writeFile.mock.calls[0]!
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const restored = XLSX.read(bytes, { type: 'array' })
    const data = XLSX.utils.sheet_to_json<(string | number)[]>(restored.Sheets['Balance Sheet']!, { header: 1 })
    expect(filename).toBe('balance-sheet-2026-09-30.xlsx')
    expect(data.length).toBe(rows.length + 5)
    expect(data.some(r => r.includes('Cash at Bank'))).toBe(false)
    expect(data.some(r => r[1] === 'Current Assets' && r[2] === 165000)).toBe(true)
    expect(data[data.length - 1]![2]).toBe(165000)
  })

  it('generates a real PDF with statement title, totals and signature block', () => {
    const { actions } = exports()
    actions.exportPdf()
    const [filename, pdf] = savePdf.mock.calls[0]!
    expect(filename).toBe('balance-sheet-2026-09-30.pdf')
    expect(pdf).toMatch(/^%PDF-/)
    expect(pdf).toContain('Statement of Financial Position')
    expect(pdf).toContain('Prepared by')
    expect(pdf).toContain('Approved by')
    expect(pdf).toContain('165000.00')
  })
})

it('exports a standalone report without comparison or difference columns', () => {
  writeFile.mockClear()
  const report = balanceSheetFixture()
  const actions = useBalanceSheetExport(ref(report), ref(buildStatementRows(report, new Set())), ref({
    mode: 'as-at', firstFrom: '', firstTo: '', secondFrom: '', secondTo: '',
  }))
  actions.exportExcel()
  const workbook = writeFile.mock.calls[0]![0]
  const data = XLSX.utils.sheet_to_json<(string | number)[]>(workbook.Sheets['Balance Sheet'], { header: 1 })
  expect(data[4]).toHaveLength(3)
  expect(data[data.length - 1]).toHaveLength(3)
  expect(JSON.stringify(data)).not.toContain('Difference')
})

it('includes both independent date ranges in comparison exports', () => {
  writeFile.mockClear()
  const report = balanceSheetFixture()
  const actions = useBalanceSheetExport(ref(report), ref(buildStatementRows(report, new Set())), ref({
    mode: 'compare', firstFrom: '2026-07-01', firstTo: '2026-09-30', secondFrom: '2025-10-01', secondTo: '2025-12-31',
  }))
  actions.exportExcel()
  const data = XLSX.utils.sheet_to_json<(string | number)[]>(writeFile.mock.calls[0]![0].Sheets['Balance Sheet'], { header: 1 })
  expect(data[4]![2]).toContain('2026-07-01 to 2026-09-30')
  expect(data[4]![3]).toContain('2025-10-01 to 2025-12-31')
  expect(data[4]![4]).toBe('Difference (1 - 2)')
})
