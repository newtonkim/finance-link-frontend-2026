# Loan Arrears Report — Design Spec
**Date:** 2026-04-15
**Status:** Approved

---

## 1. Purpose

A dedicated operational report for managing loans formally in arrears (`status = 'arrears'`). Serves three audiences simultaneously:

- **Loan officers** — who to call, what they owe, which installments are missed
- **Branch managers** — branch-level arrears overview and officer accountability
- **Management / SASRA** — portfolio trend, month-over-month comparison

This is distinct from the existing **Aging Report** (portfolio-at-risk by bucket, for provision analysis) and the **Loan Balances Report** (all outstanding balances). The Arrears Report is the collections and monitoring tool.

---

## 2. Scope

### In scope
- Loans with `status = 'arrears'` only (not all loans with overdue installments)
- Summary comparison cards: today vs 1 month ago vs 3 months ago
- 12-month monthly trend bar chart
- Filterable paginated loans table with expandable installment detail
- Member phone number shown for collections follow-up
- Excel export of the loans table
- Branch-scope filtering consistent with existing reports

### Out of scope
- Promise-to-pay / visit logging (collections CRM features)
- SMS / notification sending from within the report
- Loans with status other than `arrears` (disbursed, closed, written_off)

---

## 3. UI Layout

Page route: `/tenant/arrears-report`

### 3.1 Filter Bar (top of page)
| Filter | Type | Notes |
|---|---|---|
| As of Date | Date picker | Defaults to today. All table and card data reflects this date. |
| Branch | Dropdown | Hidden for branch-scoped users (SCOPE_BRANCH / SCOPE_SELF) |
| Loan Officer | Dropdown | Filtered to branch scope |
| Trend Period | Dropdown | Last 6 months / Last 12 months (default: 12) |

Apply and Reset buttons. Export Excel button (top-right).

### 3.2 Comparison Summary Cards
Three side-by-side cards showing the arrears portfolio at three points in time:
- **Today** (as-of date) — highlighted with red border
- **1 Month Ago** — as-of date minus 30 days
- **3 Months Ago** — as-of date minus 90 days

Each card shows:
- Number of loans in arrears
- Total arrears amount (principal + interest + charges + penalty overdue)
- Principal arrears amount
- Percentage change vs today (shown on the past cards)

### 3.3 Monthly Trend Chart
Bar chart — one bar per month for the selected trend period (6 or 12 months).
- Y-axis: total arrears amount (UGX)
- X-axis: month labels
- Current month bar highlighted/darker
- Uses a lightweight chart library consistent with the rest of the app (or a custom SVG bar implementation matching the existing AgingReport pattern)

### 3.4 Loans Table
One row per loan in arrears. Columns:

| Column | Notes |
|---|---|
| ▶ / ▼ (expand toggle) | Chevron to expand installment detail |
| Member Name + Member No | Stacked, member name links to member profile |
| Loan No | Links to loan detail page |
| Branch | Branch name |
| Loan Officer | Officer name |
| Phone | Member phone number for collections |
| Amount in Arrears | Total overdue (all components), red text |
| Missed Installments | Count badge, red if ≥ 3, orange if 1–2 |
| Days in Arrears | Days since oldest overdue installment, colour-coded |
| Last Payment Date | Date of most recent repayment |

Default sort: Days in Arrears descending (worst first).
Pagination: 25 per page (configurable up to 100).

### 3.5 Expandable Row — Installment Detail
Clicking a loan row expands an inline sub-table showing each overdue installment:

| Installment # | Due Date | Principal Shortfall | Interest Shortfall | Charges Shortfall | Penalty Shortfall | Total Shortfall |
|---|---|---|---|---|---|---|

Shortfall = amount due − amount paid for each component (floored at 0).
Only installments with a non-zero total shortfall are shown.

---

## 4. Backend Architecture

### 4.1 New Service
`app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php`

**Methods:**
- `getReport(array $filters): array` — paginated loan-level summary. Returns `loans` (paginated data + meta) and `summary` (totals for current page context).
- `getComparison(array $filters): array` — runs a lightweight aggregate query at three dates: `as_of_date`, `as_of_date − 30 days`, `as_of_date − 90 days`. Returns three comparison snapshots.
- `getTrend(array $filters): array` — returns monthly arrears totals for the last N months (6 or 12). One data point per month: `{ month, label, total_arrears, loan_count }`.
- `getInstallmentDetail(int $loanId, string $asOfDate): array` — returns all overdue installments for a single loan. Called on row expand (lazy-loaded, not part of the main table fetch).
- `getExportData(array $filters): array` — full unpaginated loans list for Excel download.

**Base query filters** (consistent with existing reports):
- `status = 'arrears'` — hard-coded, not user-configurable
- `as_of_date` — schedule rows with `due_date <= as_of_date` and `status != 'paid'`
- `branch_id`, `loan_officer_id` — optional filters
- `applyBranchScope()` — same branch-scoping logic as `LoanBalancesReportService` and `LoanAgingReportService`

**Member phone number:** joined from `members.phone` (confirmed column name from migrations).

### 4.2 New Routes
Added to `routes/tenant_api.php`:

```
GET  /reports/loan-arrears                          → loanArrears()
GET  /reports/loan-arrears/comparison               → loanArrearsComparison()
GET  /reports/loan-arrears/trend                    → loanArrearsTrend()
GET  /reports/loan-arrears/export                   → loanArrearsExport()
GET  /reports/loan-arrears/{loan}/installments      → loanArrearsInstallments()
```

> **Route ordering:** The static segments (`comparison`, `trend`, `export`) must be registered **before** the `{loan}` wildcard route to prevent Laravel matching them as loan IDs.

### 4.3 Controller
New methods added to existing `ReportsController` (`app/Tenant/Http/Controllers/Api/V1/ReportsController.php`). The service is injected via the constructor alongside existing services. No new controller file.

**Validation rules for `loanArrears`:**
```
as_of_date      required | date
branch_id       nullable | integer | exists:tenant.branches,id
loan_officer_id nullable | integer | exists:tenant.staff,id
per_page        nullable | integer | min:1 | max:100
page            nullable | integer | min:1
```

**Validation rules for `loanArrearsTrend`:**
```
as_of_date      nullable | date
branch_id       nullable | integer | exists:tenant.branches,id
loan_officer_id nullable | integer | exists:tenant.staff,id
months          nullable | integer | in:6,12
```

**Validation rules for `loanArrearsComparison`:**
```
as_of_date      nullable | date
branch_id       nullable | integer | exists:tenant.branches,id
loan_officer_id nullable | integer | exists:tenant.staff,id
```

**Validation rules for `loanArrearsInstallments`:**
```
as_of_date      required | date
```

### 4.4 Export Class
`app/Exports/LoanArrearsExport.php` — mirrors `LoanBalancesExport.php`. Accepts the flat loans array and an `as_of_date` string. Renders an Excel sheet with the same columns as the UI table plus all arrears component breakdowns.

---

## 5. Frontend Architecture

### 5.1 New Page Component
`src/tenant/modules/reports/pages/ArrearsReport.vue`

**Internal structure:**
- `filters` ref — `{ as_of_date, branch_id, loan_officer_id, months }`
- `comparisonData` ref — 3-snapshot object
- `trendData` ref — array of monthly points
- `loans` ref — paginated loans array
- `meta` ref — pagination meta
- `expandedLoanId` ref — which loan row is currently expanded (`null` = none)
- `installmentCache` ref — `Map<loanId, installments[]>` so repeated expands don't re-fetch
- `loading`, `loadingInstallments`, `exporting` boolean refs

**Data fetching:**
- On mount and on filter apply: fetch comparison, trend, and loans table in parallel (three separate API calls)
- On row expand: if `installmentCache` has the loanId, render from cache. Otherwise fetch and cache.

### 5.2 API Functions
Added to `src/tenant/apis/reports/reportsApi.ts`:

```ts
fetchLoanArrears(filters)           → paginated loans + summary
fetchLoanArrearsComparison(filters) → 3 snapshots
fetchLoanArrearsTrend(filters)      → monthly trend array
fetchLoanArrearsInstallments(loanId, asOfDate) → installment detail
exportLoanArrears(filters)          → triggers file download
```

### 5.3 Route Registration
New entry in the reports module routes file (wherever `AgingReport` and `LoanBalancesReport` are registered):

```ts
{
  path: 'arrears-report',
  component: () => import('./pages/ArrearsReport.vue'),
  meta: { title: 'Loan Arrears Report' }
}
```

### 5.4 Navigation
Add "Loan Arrears Report" link to the reports section of the sidebar/navigation, alongside Aging Report and Loan Balances Report.

---

## 6. Data Relationships

```
loans (status = 'arrears')
  └── members (phone, name, member_number)
  └── branches (name)
  └── staff (loan_officer name)
  └── loan_repayment_schedule
        → overdue rows: due_date <= as_of_date AND status != 'paid'
        → shortfall per component: GREATEST(0, due - paid)
```

Trend and comparison queries use **schedule-based overdue detection**, not current `status = 'arrears'`. For each historical date (month-end for trend, −30/−90 days for comparison), the query counts loans that had at least one installment with `due_date <= historical_date` and `status != 'paid'` — regardless of the loan's current status. This gives an accurate picture of what was actually in arrears at each point in time. The main loans table (Section 3.4) alone filters to `status = 'arrears'`.

---

## 7. Colour Coding

| Days in Arrears | Colour |
|---|---|
| 1–30 | Orange (`#f97316`) |
| 31–90 | Red (`#ef4444`) |
| 91+ | Dark Red (`#dc2626`) |

Missed installments badge:
- 1–2 missed → orange
- 3+ missed → red

---

## 8. Branch Scoping

Identical to `LoanBalancesReportService`:
- `SCOPE_ALL` — sees all branches; branch filter is active
- `SCOPE_BRANCH` — restricted to own branch; branch filter hidden
- `SCOPE_SELF` — restricted to own branch; branch filter hidden

The `loan_officer_id` filter is available to all scopes (branch managers may filter by officer within their branch).

---

## 9. Error Handling

- Empty state: if no loans are in arrears, show a green "No loans in arrears" message with the as-of date.
- API errors: toast notification with error message, table shows previous data or empty state.
- Installment fetch failure: show inline error within the expanded row with a retry button.
- Export failure: toast notification.

---

## 10. Files to Create / Modify

### Create
| File | Purpose |
|---|---|
| `app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php` | All backend report logic |
| `app/Exports/LoanArrearsExport.php` | Excel export class |
| `src/tenant/modules/reports/pages/ArrearsReport.vue` | Report UI |

### Modify
| File | Change |
|---|---|
| `app/Tenant/Http/Controllers/Api/V1/ReportsController.php` | Inject service, add 5 new route methods |
| `routes/tenant_api.php` | Register 5 new routes |
| `src/tenant/apis/reports/reportsApi.ts` | Add 5 new API functions |
| Reports module routes file | Register `arrears-report` route |
| Sidebar/navigation component | Add Arrears Report nav link |
