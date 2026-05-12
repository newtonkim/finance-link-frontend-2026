# Trial Balance — Exports + Auto-Load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CSV, Excel, and PDF exports to the Trial Balance report page and auto-load the current month on page open instead of showing an empty page.

**Architecture:** Extract all `TrialBalance.vue` script logic into a new `useTrialBalance.ts` composable (following the `useCollectionsReport.ts` pattern). The composable owns state, generate, drill-down, auto-load via `onMounted`, and all three export functions. The `.vue` file becomes a thin wrapper — script imports the composable, template is unchanged except for three new export buttons in the header.

**Tech Stack:** Vue 3 Composition API, `xlsx` (XLSX.utils.aoa_to_sheet + XLSX.writeFile), `jspdf` + `jspdf-autotable`, native Blob/URL for CSV. All three already installed — no new dependencies.

---

## File Map

| Action | File |
|--------|------|
| Create | `src/tenant/modules/reports/composables/useTrialBalance.ts` |
| Modify | `src/tenant/modules/reports/pages/TrialBalance.vue` |

---

## Task 1: Create `useTrialBalance` composable with auto-load

This task moves all existing `TrialBalance.vue` script logic into a composable, changes the default mode to `period` (current month), and fires `generate()` automatically on mount.

**Files:**
- Create: `src/tenant/modules/reports/composables/useTrialBalance.ts`

- [ ] **Step 1: Create the composable file**

Create `src/tenant/modules/reports/composables/useTrialBalance.ts` with the full content below. Every existing function from `TrialBalance.vue` is reproduced here — do not cut corners.

```typescript
import { ref, computed, onMounted } from 'vue'
import { formatMoneyValue } from '@/Global'
import { trialBalanceApi } from '@/tenant/apis/reports/trialBalanceApi'

function currentMonthRange(): { from: string; to: string } {
  const now   = new Date()
  const y     = now.getFullYear()
  const m     = String(now.getMonth() + 1).padStart(2, '0')
  const last  = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    from: `${y}-${m}-01`,
    to:   `${y}-${m}-${String(last).padStart(2, '0')}`,
  }
}

export function useTrialBalance() {
  const today                        = new Date().toISOString().split('T')[0]
  const { from: monthFrom, to: monthTo } = currentMonthRange()

  const mode        = ref<'as_of_date' | 'period'>('period')
  const asOfDate    = ref(today)
  const periodFrom  = ref(monthFrom)
  const periodTo    = ref(monthTo)
  const loading     = ref(false)
  const result      = ref<any>(null)
  const hideZero    = ref(true)
  const exporting   = ref(false)

  // Drill-down drawer
  const drawerOpen     = ref(false)
  const drawerAccount  = ref<any>(null)
  const drawerLines    = ref<any[]>([])
  const drawerPage     = ref(1)
  const drawerTotal    = ref(0)
  const drawerLastPage = ref(1)
  const drawerLoading  = ref(false)

  // ── Computed ────────────────────────────────────────────────────────────────
  const allAccounts = computed(() => result.value?.accounts ?? [])
  const totals      = computed(() => result.value?.totals   ?? null)
  const isBalanced  = computed(() => totals.value?.is_balanced === true)
  const drFrom      = computed(() => result.value?.from ?? result.value?.date ?? asOfDate.value)
  const drTo        = computed(() => result.value?.to   ?? result.value?.date ?? asOfDate.value)

  const accounts = computed(() => {
    if (!hideZero.value) return allAccounts.value

    const activeIds = new Set(
      allAccounts.value
        .filter((a: any) => a.is_postable && (
          a.closing_debit || a.closing_credit ||
          a.opening_debit || a.opening_credit ||
          a.period_debit  || a.period_credit
        ))
        .map((a: any) => a.id),
    )

    const filtered: any[] = []
    let pendingHeader: any = null

    for (const account of allAccounts.value) {
      if (!account.is_postable) {
        pendingHeader = account
      } else if (activeIds.has(account.id)) {
        if (pendingHeader) { filtered.push(pendingHeader); pendingHeader = null }
        filtered.push(account)
      }
    }
    return filtered
  })

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function generate() {
    loading.value = true
    result.value  = null
    try {
      result.value = mode.value === 'period'
        ? await trialBalanceApi.getTrialBalance({ from: periodFrom.value, to: periodTo.value })
        : await trialBalanceApi.getTrialBalance({ date: asOfDate.value })
    } finally {
      loading.value = false
    }
  }

  async function openDrillDown(account: any, side: 'debit' | 'credit') {
    if (!account.is_postable) return
    const amount = side === 'debit'
      ? (mode.value === 'period' ? account.period_debit  : account.closing_debit)
      : (mode.value === 'period' ? account.period_credit : account.closing_credit)
    if (!amount) return
    drawerAccount.value = account
    drawerPage.value    = 1
    drawerLines.value   = []
    drawerOpen.value    = true
    await fetchDrillDown()
  }

  async function fetchDrillDown() {
    if (!drawerAccount.value) return
    drawerLoading.value = true
    try {
      const res = await trialBalanceApi.getLedgerLines({
        account_id: drawerAccount.value.id,
        from: drFrom.value,
        to:   drTo.value,
        page: drawerPage.value,
      })
      drawerLines.value    = drawerPage.value === 1 ? res.data : [...drawerLines.value, ...res.data]
      drawerTotal.value    = res.total
      drawerLastPage.value = res.last_page
    } finally {
      drawerLoading.value = false
    }
  }

  async function loadMore() {
    drawerPage.value++
    await fetchDrillDown()
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function fmt(v: number)     { return formatMoneyValue(v ?? 0) }
  function fmtCell(v: number) { return v ? formatMoneyValue(v) : '—' }
  function fmtNum(v: number)  {
    return v
      ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—'
  }

  function typeColor(type: string) {
    const map: Record<string, string> = {
      ASSET:     'text-blue-600',
      LIABILITY: 'text-orange-600',
      EQUITY:    'text-purple-600',
      INCOME:    'text-green-600',
      EXPENSE:   'text-red-600',
    }
    return map[type] ?? 'text-neutral-500'
  }

  function dateLabel() {
    return mode.value === 'period'
      ? `${periodFrom.value}-to-${periodTo.value}`
      : asOfDate.value
  }

  // ── Auto-load ────────────────────────────────────────────────────────────────
  onMounted(() => generate())

  return {
    mode, asOfDate, periodFrom, periodTo, hideZero, loading, result, exporting,
    accounts, totals, isBalanced, drFrom, drTo,
    drawerOpen, drawerAccount, drawerLines, drawerPage, drawerTotal, drawerLastPage, drawerLoading,
    generate, openDrillDown, loadMore,
    fmt, fmtCell, fmtNum, typeColor, dateLabel,
  }
}
```

- [ ] **Step 2: Verify TypeScript has no errors in the new file**

```bash
cd /Users/asd/Mfuko_pro/mfuko-pro-frontend-2026
pnpm type-check 2>&1 | grep useTrialBalance
```

Expected: no output (no errors for this file). If errors appear, fix them before continuing.

- [ ] **Step 3: Commit the composable (without the exports — they come in Task 2)**

```bash
git add src/tenant/modules/reports/composables/useTrialBalance.ts
git commit -m "feat: extract useTrialBalance composable with auto-load on mount"
```

---

## Task 2: Refactor TrialBalance.vue to use the composable

Replace the inline script block in `TrialBalance.vue` with a thin import. Template does not change in this task.

**Files:**
- Modify: `src/tenant/modules/reports/pages/TrialBalance.vue` (script section only)

- [ ] **Step 1: Replace the entire `<script setup>` block**

Open `src/tenant/modules/reports/pages/TrialBalance.vue`. Replace everything between the `<script setup lang="ts">` and `</script>` tags (the full existing script) with:

```typescript
import { Scale, X, AlertTriangle, CheckCircle } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { useTrialBalance } from '../composables/useTrialBalance'

const {
  mode, asOfDate, periodFrom, periodTo, hideZero, loading, result, exporting,
  accounts, totals, isBalanced, drFrom, drTo,
  drawerOpen, drawerAccount, drawerLines, drawerPage, drawerTotal, drawerLastPage, drawerLoading,
  generate, openDrillDown, loadMore,
  fmt, fmtCell, typeColor,
} = useTrialBalance()
```

- [ ] **Step 2: Run type-check and confirm no errors**

```bash
pnpm type-check 2>&1 | grep -E "TrialBalance|useTrialBalance"
```

Expected: no output.

- [ ] **Step 3: Start dev server and verify the page auto-loads current month data on open**

```bash
pnpm dev
```

Open `http://localhost:5173` (or the Vite port), navigate to the tenant trial balance route. The page should show a loading spinner immediately on open, then render the current month's trial balance without the user clicking anything. Mode should default to "Period".

- [ ] **Step 4: Commit**

```bash
git add src/tenant/modules/reports/pages/TrialBalance.vue
git commit -m "refactor: wire TrialBalance.vue to useTrialBalance composable"
```

---

## Task 3: Add CSV, Excel, and PDF exports to the composable

Add `exportCsv`, `exportExcel`, and `exportPdf` functions inside `useTrialBalance.ts`, using the existing `xlsx` and `jspdf` libraries.

**Files:**
- Modify: `src/tenant/modules/reports/composables/useTrialBalance.ts`

- [ ] **Step 1: Add the three import lines at the top of `useTrialBalance.ts`**

Add these imports directly below the existing import lines (before the `currentMonthRange` function):

```typescript
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saccoBrandingState } from '@/tenant/apis/saccobranding/saccoBrandingApi'
```

- [ ] **Step 2: Add `buildExportRows()` private helper inside `useTrialBalance()` (before the `return` statement)**

This function extracts the shared row-building logic used by all three export formats:

```typescript
function buildExportRows(): { isPeriod: boolean; dataRows: (string | number)[][]; totalsRow: (string | number)[] | null } {
  const isPeriod = mode.value === 'period'
  const t        = totals.value

  const dataRows: (string | number)[][] = accounts.value
    .filter((a: any) => a.is_postable)
    .map((a: any) => isPeriod
      ? [a.gl_code, a.name, a.account_type, a.account_subtype ?? '',
         a.opening_debit, a.opening_credit, a.period_debit, a.period_credit,
         a.closing_debit, a.closing_credit]
      : [a.gl_code, a.name, a.account_type, a.account_subtype ?? '',
         a.closing_debit, a.closing_credit],
    )

  const totalsRow: (string | number)[] | null = t
    ? isPeriod
      ? ['', 'TOTAL', '', '', t.total_opening_debit, t.total_opening_credit,
         t.total_period_debit, t.total_period_credit,
         t.total_closing_debit, t.total_closing_credit]
      : ['', 'TOTAL', '', '', t.total_closing_debit, t.total_closing_credit]
    : null

  return { isPeriod, dataRows, totalsRow }
}
```

- [ ] **Step 3: Add `exportCsv()` function inside `useTrialBalance()` (after `buildExportRows`, before the `return` statement)**

```typescript
function exportCsv() {
  if (!result.value) return
  exporting.value = true
  try {
    const { isPeriod, dataRows, totalsRow } = buildExportRows()

    const header = isPeriod
      ? ['GL Code', 'Account Name', 'Type', 'Subtype', 'Opening DR', 'Opening CR',
         'Period DR', 'Period CR', 'Closing DR', 'Closing CR']
      : ['GL Code', 'Account Name', 'Type', 'Subtype', 'Closing DR', 'Closing CR']

    const allRows = [header, ...dataRows, ...(totalsRow ? [totalsRow] : [])]
    const csv = allRows
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href  = url
    link.download = `trial-balance-${dateLabel()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}
```

- [ ] **Step 4: Add `exportExcel()` function (after `exportCsv`, before the `return` statement)**

```typescript
function exportExcel() {
  if (!result.value) return
  exporting.value = true
  try {
    const { isPeriod, dataRows, totalsRow } = buildExportRows()

    const header = isPeriod
      ? ['GL Code', 'Account Name', 'Type', 'Subtype', 'Opening DR', 'Opening CR',
         'Period DR', 'Period CR', 'Closing DR', 'Closing CR']
      : ['GL Code', 'Account Name', 'Type', 'Subtype', 'Closing DR', 'Closing CR']

    const allRows = [header, ...dataRows, ...(totalsRow ? [totalsRow] : [])]
    const ws = XLSX.utils.aoa_to_sheet(allRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance')
    XLSX.writeFile(wb, `trial-balance-${dateLabel()}.xlsx`)
  } finally {
    exporting.value = false
  }
}
```

- [ ] **Step 5: Add `exportPdf()` function (after `exportExcel`, before the `return` statement)**

```typescript
function exportPdf() {
  if (!result.value) return
  exporting.value = true
  try {
    const isPeriod  = mode.value === 'period'
    const saccoName = saccoBrandingState.sacco_name || 'SACCO'
    const colSpan   = isPeriod ? 9 : 5

    const doc = new jsPDF({
      orientation: isPeriod ? 'landscape' : 'portrait',
      unit:        'mm',
      format:      'a4',
    })

    const pageW = (doc.internal.pageSize as any).width ?? (isPeriod ? 297 : 210)

    let y = 15
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(saccoName, 14, y)

    y += 7
    doc.setFontSize(11)
    doc.text('Trial Balance', 14, y)

    y += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    const periodLabel = isPeriod
      ? `Period: ${periodFrom.value} to ${periodTo.value}`
      : `As at: ${asOfDate.value}`
    doc.text(periodLabel, 14, y)
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 14, y, { align: 'right' })
    doc.setTextColor(0)
    y += 4

    const head = isPeriod
      ? [['GL Code', 'Account Name', 'Type', 'Opening DR', 'Opening CR',
          'Period DR', 'Period CR', 'Closing DR', 'Closing CR']]
      : [['GL Code', 'Account Name', 'Type', 'Closing DR', 'Closing CR']]

    const body: any[][] = []
    for (const a of accounts.value) {
      if (!a.is_postable) {
        body.push([{
          content:   `${a.gl_code}  ${a.name}`,
          colSpan,
          styles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [60, 60, 60] },
        }])
        continue
      }
      if (isPeriod) {
        body.push([
          a.gl_code, a.name, a.account_type,
          fmtNum(a.opening_debit),  fmtNum(a.opening_credit),
          fmtNum(a.period_debit),   fmtNum(a.period_credit),
          fmtNum(a.closing_debit),  fmtNum(a.closing_credit),
        ])
      } else {
        body.push([
          a.gl_code, a.name, a.account_type,
          fmtNum(a.closing_debit), fmtNum(a.closing_credit),
        ])
      }
    }

    const t = totals.value
    if (t) {
      const totalsStyle = { content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [245, 247, 250] } }
      body.push(
        isPeriod
          ? [totalsStyle, fmtNum(t.total_opening_debit), fmtNum(t.total_opening_credit),
             fmtNum(t.total_period_debit), fmtNum(t.total_period_credit),
             fmtNum(t.total_closing_debit), fmtNum(t.total_closing_credit)]
          : [totalsStyle, fmtNum(t.total_closing_debit), fmtNum(t.total_closing_credit)],
      )
    }

    autoTable(doc, {
      startY:             y,
      head,
      body,
      headStyles:         { fillColor: [30, 100, 60], textColor: 255, fontSize: 7, fontStyle: 'bold' },
      bodyStyles:         { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      styles:             { cellPadding: 2 },
      columnStyles: isPeriod
        ? { 0: { cellWidth: 18 }, 1: { cellWidth: 55 }, 2: { cellWidth: 18 } }
        : { 0: { cellWidth: 18 }, 1: { cellWidth: 80 }, 2: { cellWidth: 22 } },
    })

    doc.save(`trial-balance-${dateLabel()}.pdf`)
  } finally {
    exporting.value = false
  }
}
```

- [ ] **Step 6: Add the three export functions to the `return` statement**

Find the `return {` block at the bottom of `useTrialBalance()`. Add `exportCsv, exportExcel, exportPdf` to it:

```typescript
  return {
    mode, asOfDate, periodFrom, periodTo, hideZero, loading, result, exporting,
    accounts, totals, isBalanced, drFrom, drTo,
    drawerOpen, drawerAccount, drawerLines, drawerPage, drawerTotal, drawerLastPage, drawerLoading,
    generate, openDrillDown, loadMore,
    exportCsv, exportExcel, exportPdf,
    fmt, fmtCell, fmtNum, typeColor, dateLabel,
  }
```

- [ ] **Step 7: Run type-check**

```bash
pnpm type-check 2>&1 | grep -E "useTrialBalance|TrialBalance"
```

Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add src/tenant/modules/reports/composables/useTrialBalance.ts
git commit -m "feat: add CSV, Excel, PDF export functions to useTrialBalance composable"
```

---

## Task 4: Add export buttons to TrialBalance.vue template

Wire the three export functions to buttons in the page header. Buttons appear only when data is loaded.

**Files:**
- Modify: `src/tenant/modules/reports/pages/TrialBalance.vue` (script + template)

- [ ] **Step 1: Update the destructure in `<script setup>` to include export functions and `Download` icon**

Replace the current `<script setup>` block with:

```typescript
import { Scale, X, AlertTriangle, CheckCircle, Download } from 'lucide-vue-next'
import { Spinner } from '@/Global'
import { useTrialBalance } from '../composables/useTrialBalance'

const {
  mode, asOfDate, periodFrom, periodTo, hideZero, loading, result, exporting,
  accounts, totals, isBalanced, drFrom, drTo,
  drawerOpen, drawerAccount, drawerLines, drawerPage, drawerTotal, drawerLastPage, drawerLoading,
  generate, openDrillDown, loadMore,
  exportCsv, exportExcel, exportPdf,
  fmt, fmtCell, typeColor,
} = useTrialBalance()
```

- [ ] **Step 2: Add export buttons to the page header in the template**

Find this block in the template (the header `<div class="flex items-center justify-between">`):

```html
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-nfuko-primary/10 flex items-center justify-center">
          <Scale class="w-5 h-5 text-nfuko-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Trial Balance</h1>
          <p class="text-sm text-neutral-500">Verify that total debits equal total credits across all accounts.</p>
        </div>
      </div>
    </div>
```

Replace it with:

```html
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-nfuko-primary/10 flex items-center justify-center">
          <Scale class="w-5 h-5 text-nfuko-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Trial Balance</h1>
          <p class="text-sm text-neutral-500">Verify that total debits equal total credits across all accounts.</p>
        </div>
      </div>

      <!-- Export buttons — shown only when data is loaded -->
      <div v-if="result" class="flex items-center gap-2">
        <button
          @click="exportCsv"
          :disabled="exporting"
          class="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <Download class="w-3.5 h-3.5" />
          CSV
        </button>
        <button
          @click="exportExcel"
          :disabled="exporting"
          class="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <Download class="w-3.5 h-3.5" />
          Excel
        </button>
        <button
          @click="exportPdf"
          :disabled="exporting"
          class="flex items-center gap-1.5 rounded-lg bg-nfuko-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-nfuko-primary/90 disabled:opacity-50 shadow-sm"
        >
          <Download class="w-3.5 h-3.5" />
          PDF
        </button>
      </div>
    </div>
```

- [ ] **Step 3: Run type-check**

```bash
pnpm type-check 2>&1 | grep -E "TrialBalance|useTrialBalance"
```

Expected: no output.

- [ ] **Step 4: Verify in the browser**

With dev server running (`pnpm dev`), open the trial balance page. Confirm:

1. Page auto-loads current month data on open (spinner shows, then table appears — no button press needed)
2. Three export buttons appear in the top-right after data loads: `CSV`, `Excel`, `PDF`
3. CSV download produces a `.csv` file that opens correctly in a spreadsheet app
4. Excel download produces a `.xlsx` file that opens correctly
5. PDF download produces a landscape `.pdf` with SACCO name header, period label, and properly formatted table
6. Buttons are disabled while export is in progress (`exporting` flag)
7. Zero-balance toggle still works — "Hide zero balances" ON by default

- [ ] **Step 5: Commit**

```bash
git add src/tenant/modules/reports/pages/TrialBalance.vue
git commit -m "feat: add CSV/Excel/PDF export buttons to Trial Balance page header"
```

- [ ] **Step 6: Push**

```bash
git push origin feat/phase1-fd-maturity-trial-balance
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ CSV export — Task 3 Step 3
- ✅ Excel export — Task 3 Step 4
- ✅ PDF export — Task 3 Step 5
- ✅ Auto-load on mount — Task 1 Step 1 (`onMounted(() => generate())`)
- ✅ Default to current month period — Task 1 Step 1 (`mode = 'period'`, `currentMonthRange()`)
- ✅ Export buttons top-right, only shown when data loaded — Task 4 Step 2
- ✅ Composable extraction under 200-line limit — Task 1 + 2

**Placeholder scan:** None found.

**Type consistency:**
- `fmtNum` defined in Task 1 composable, used in Task 3 Step 5 PDF export ✅
- `dateLabel` defined in Task 1 composable, used in Task 3 Steps 3/4/5 ✅
- `buildExportRows` defined in Task 3 Step 2, used in Steps 3 and 4 ✅
- `exporting` defined in Task 1 composable, returned in Task 3 Step 6 ✅
