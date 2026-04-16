# Loan Collections Report — Design Spec

## Goal

Build a full Loan Collections Report that combines period-level collection summaries (by officer, branch, and payment method) with a paginated loan-level table that expands to individual transaction detail — plus a two-sheet Excel export.

---

## Background

A Collections Report is the heartbeat of credit risk management in a SACCO. It connects operational collections activity to financial health, member accountability, and institutional sustainability. It serves:

- **Collections team** — which borrowers paid, who is behind, who to follow up
- **Loan officers** — their individual collection rate and portfolio performance
- **Branch management** — branch-level collection efficiency
- **Finance / treasury** — cash inflows for the period, provisioning data
- **Board / management** — collection rate trend, PAR exposure, recovery strategy

---

## Data Sources

All data lives in two tenant tables:

| Table | Key columns used |
|---|---|
| `loan_transactions` | `loan_id`, `member_id`, `amount_paid`, `principal_portion`, `interest_portion`, `charges_portion`, `penalty_portion`, `payment_date`, `payment_method`, `receipt_no`, `collected_by`, `reversal_flag` |
| `loan_repayment_schedule` | `loan_id`, `due_date`, `total_due`, `principal_due`, `interest_due`, `charges_due`, `penalty_due`, `principal_paid`, `interest_paid`, `charges_paid`, `penalty_paid`, `status`, `paid_date` |

Supporting tables: `loans`, `members`, `staff`, `branches`, `loan_products`

---

## Period Type

A "Period Type" dropdown controls which date input(s) are shown:

| Period Type | Inputs shown | Derived date_from / date_to |
|---|---|---|
| `Date Range` | date_from + date_to pickers | as entered |
| `Month` | `<input type="month">` | first and last day of selected month |
| `As of Date` | single date picker | `date_from = '2000-01-01'` (all history), `date_to = selected date` |

Default: `Month`, pre-set to current month.

---

## Architecture — Approach A

### Backend

**Service:** `app/Tenant/Modules/Loans/Services/LoanCollectionsReportService.php`

Three public methods:

#### `getSummary(array $filters): array`

Returns all three groupings in a single response:

```
{
  by_officer: [{ loan_officer_name, loan_count, amount_due, amount_collected, collection_rate, outstanding_balance }]
  by_branch:  [{ branch_name,       loan_count, amount_due, amount_collected, collection_rate, outstanding_balance }]
  by_method:  [{ payment_method,    transaction_count, amount_collected }]
  totals:     { amount_due, amount_collected, collection_rate, outstanding_balance, transaction_count }
}
```

**Key calculations:**
- `amount_due` = `SUM(rs.total_due)` where `rs.due_date BETWEEN date_from AND date_to`
- `amount_collected` = `SUM(lt.amount_paid)` where `lt.payment_date BETWEEN date_from AND date_to` AND `lt.reversal_flag = 0`
- `collection_rate` = `ROUND(amount_collected / NULLIF(amount_due, 0) * 100, 1)` — capped at 100%
- `outstanding_balance` = total remaining balance across ALL active loans for that officer/branch (not limited to the period) — computed as `SUM(rs.total_due - rs.principal_paid - rs.interest_paid - rs.charges_paid - rs.penalty_paid)` across all unpaid schedule rows
- `amount_due` and `amount_collected` use two separate subqueries joined on `loan_id` — schedule rows and transaction rows are different grain tables and cannot be aggregated in a single JOIN without row multiplication

#### `getReport(array $filters): array`

Paginated loan-level table. One row per loan that had schedule rows due OR payments received in the period.

Columns per row:
- `loan_id`, `loan_no`, `member_id`, `member_name`, `member_number`, `phone`
- `branch_name`, `loan_officer_name`, `product_name`
- `amount_due` — schedule total_due for due_date in period
- `amount_collected` — payments received in period
- `collection_rate` — percentage
- `outstanding_balance` — total remaining on this loan
- `days_in_arrears` — 0 if current
- `last_payment_date`

Ordered by `collection_rate ASC` (worst collectors first).

#### `getTransactionDetail(int $loanId, array $filters): array`

All transactions for a single loan within the period. One row per payment:
- `payment_date`, `amount_paid`, `principal_portion`, `interest_portion`, `charges_portion`, `penalty_portion`
- `payment_method`, `receipt_no`, `collected_by_name`

Ordered by `payment_date ASC`.

---

### Routes (4 new routes in `routes/tenant_api.php`)

```
GET reports/collections/summary
GET reports/collections/loans
GET reports/collections/loans/{loan}/transactions
GET reports/collections/export
```

Static routes registered before `{loan}` wildcard.

### Controller

New methods added to `ReportsController`:
- `collectionsSummary(Request $request): JsonResponse`
- `collectionsLoans(Request $request): JsonResponse`
- `collectionsLoanTransactions(Request $request, int $loan): JsonResponse`
- `collectionsExport(Request $request)`

### Export

`app/Exports/LoanCollectionsExport.php` — implements `FromCollection`, `WithHeadings`, `WithMultipleSheets`, `WithStyles`

- **Sheet 1 — Loan Summary**: one row per loan (same columns as loan table)
- **Sheet 2 — Transactions**: one row per transaction across all loans in the period

---

## Frontend

### API Types (`src/tenant/apis/reports/reportsApi.ts`)

```typescript
CollectionsFilters         { period_type, date_from, date_to, branch_id, loan_officer_id, per_page, page }
CollectionsSummaryRow      { name, loan_count, amount_due, amount_collected, collection_rate, outstanding_balance }
CollectionsMethodRow       { payment_method, transaction_count, amount_collected }
CollectionsTotals          { amount_due, amount_collected, collection_rate, outstanding_balance, transaction_count }
CollectionsSummaryResponse { by_officer, by_branch, by_method, totals }
CollectionsLoanRow         { loan_id, loan_no, member_id, member_name, member_number, phone, branch_name, loan_officer_name, product_name, amount_due, amount_collected, collection_rate, outstanding_balance, days_in_arrears, last_payment_date }
CollectionsTransactionRow  { payment_date, amount_paid, principal_portion, interest_portion, charges_portion, penalty_portion, payment_method, receipt_no, collected_by_name }
CollectionsLoansResponse   { data: CollectionsLoanRow[], meta: { current_page, last_page, per_page, total, from, to } }
```

Five API functions added to `reportsApi` object:
```typescript
collectionsSummary(params)
collectionsLoans(params)
collectionsLoanTransactions(loanId, params)
collectionsExport(params)
```

### Page Component (`src/tenant/modules/loans/pages/CollectionsReport.vue`)

Replaces the existing placeholder. Four sections:

**① Filter Bar**

Period Type dropdown (`Date Range | Month | As of Date`) controls which date input(s) appear:
- `Date Range` → two `<input type="date">` fields (date_from, date_to)
- `Month` → single `<input type="month">` (derives first/last day on submit)
- `As of Date` → single `<input type="date">`

Branch filter (permission-gated via `filterOptions()`), Loan Officer dropdown, Apply + Reset buttons. Export button top-right.

**② Summary — Three Tabs**

Tab bar: `By Loan Officer | By Branch | By Payment Method`

Each tab shows a compact table. Collection rate cell colour-coded:
- ≥ 80% → `text-green-600`
- 50–79% → `text-orange-500`
- < 50% → `text-red-600`

Totals row pinned at the bottom of each tab table.

**③ Loan-Level Table** (paginated, 25 per page)

Columns: Member, Loan No, Loan Officer, Amount Due, Collected, Rate %, Outstanding, DPD, Last Payment

Row click expands to show transaction sub-table for that loan within the period. Transactions cached in a `Map<loanId, rows>` to avoid re-fetching. Loading spinner shown while fetching. Error state with retry button.

Collection rate column colour-coded same as summary tabs.

**④ Empty State**

Green panel: "No collections recorded for this period" when both summary and loan table return zero rows.

---

## Filters Passed to All Endpoints

| Parameter | Type | Notes |
|---|---|---|
| `date_from` | date string | required, derived from period type |
| `date_to` | date string | required, derived from period type |
| `branch_id` | integer\|null | optional |
| `loan_officer_id` | integer\|null | optional |
| `per_page` | integer | loans endpoint only, default 25 |
| `page` | integer | loans endpoint only, default 1 |

---

## Collection Rate Colour Logic

| Rate | Colour | Meaning |
|---|---|---|
| ≥ 80% | Green | On track |
| 50–79% | Orange | Watch list |
| < 50% | Red | Requires intervention |

---

## File Map

| Action | File |
|---|---|
| Create | `app/Tenant/Modules/Loans/Services/LoanCollectionsReportService.php` |
| Create | `app/Exports/LoanCollectionsExport.php` |
| Modify | `app/Tenant/Http/Controllers/Api/V1/ReportsController.php` |
| Modify | `routes/tenant_api.php` |
| Modify | `src/tenant/apis/reports/reportsApi.ts` |
| Replace | `src/tenant/modules/loans/pages/CollectionsReport.vue` |
