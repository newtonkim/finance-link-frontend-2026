# Loan Collections Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Loan Collections Report — period summary tabs (by officer, branch, payment method), paginated loan table with expandable transaction rows, and a two-sheet Excel export.

**Architecture:** `LoanCollectionsReportService` (3 public methods) wired into `ReportsController` via 4 new routes. Frontend replaces the existing `CollectionsReport.vue` placeholder. Summary uses two separate subqueries (due from schedule, collected from transactions) joined on `loan_id` to avoid row multiplication.

**Tech Stack:** Laravel 12 / PHP, Vue 3 + TypeScript, Tailwind CSS, Maatwebsite Excel 3.1 (`WithMultipleSheets`), `DB::connection('tenant')` for all queries.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `app/Tenant/Modules/Loans/Services/LoanCollectionsReportService.php` | All query logic — getSummary, getReport, getTransactionDetail |
| Create | `app/Exports/LoanCollectionsExport.php` | Two-sheet Excel export |
| Modify | `app/Tenant/Http/Controllers/Api/V1/ReportsController.php` | Inject service, 4 new methods |
| Modify | `routes/tenant_api.php` | 4 new routes |
| Modify | `src/tenant/apis/reports/reportsApi.ts` | Types + 4 API functions |
| Replace | `src/tenant/modules/loans/pages/CollectionsReport.vue` | Full report UI |

---

## Task 1: Backend Service — `getSummary()`

**Files:**
- Create: `app/Tenant/Modules/Loans/Services/LoanCollectionsReportService.php`

- [ ] **Step 1: Create the service file with `getSummary()`**

```php
<?php

namespace App\Tenant\Modules\Loans\Services;

use App\Models\Staff;
use App\Support\BranchContext;
use Illuminate\Support\Facades\DB;

class LoanCollectionsReportService
{
    /**
     * Returns three groupings in one call: by_officer, by_branch, by_method, and overall totals.
     *
     * IMPORTANT: amount_due (from loan_repayment_schedule) and amount_collected
     * (from loan_transactions) are computed as separate subqueries and joined on
     * loan_id — they cannot be aggregated in a single JOIN without row multiplication.
     */
    public function getSummary(array $filters): array
    {
        $dateFrom = $filters['date_from'];
        $dateTo   = $filters['date_to'];

        // ── Subquery: amount due per loan in period ───────────────────────────
        $duePerLoan = DB::connection('tenant')
            ->table('loan_repayment_schedule as rs')
            ->whereBetween('rs.due_date', [$dateFrom, $dateTo])
            ->selectRaw('rs.loan_id')
            ->selectRaw('SUM(rs.total_due) as amount_due')
            ->groupBy('rs.loan_id');

        // ── Subquery: amount collected per loan in period ─────────────────────
        $collectedPerLoan = DB::connection('tenant')
            ->table('loan_transactions as lt')
            ->where('lt.reversal_flag', 0)
            ->whereBetween('lt.payment_date', [$dateFrom, $dateTo])
            ->selectRaw('lt.loan_id')
            ->selectRaw('SUM(lt.amount_paid) as amount_collected')
            ->groupBy('lt.loan_id');

        // ── Subquery: outstanding balance per loan (all time, not period) ─────
        $outstandingPerLoan = DB::connection('tenant')
            ->table('loan_repayment_schedule as rs')
            ->where('rs.status', '!=', 'paid')
            ->selectRaw('rs.loan_id')
            ->selectRaw('SUM(GREATEST(0,
                rs.total_due
                - rs.principal_paid - rs.interest_paid
                - rs.charges_paid  - rs.penalty_paid
            )) as outstanding_balance')
            ->groupBy('rs.loan_id');

        // ── Base join ─────────────────────────────────────────────────────────
        $base = DB::connection('tenant')
            ->table('loans as l')
            ->join('members as m',               'm.id', '=', 'l.member_id')
            ->leftJoin('staff as s',             's.id', '=', 'l.loan_officer_id')
            ->leftJoin('branches as b',          'b.id', '=', 'l.branch_id')
            ->leftJoinSub($duePerLoan,           'due',  fn ($j) => $j->on('due.loan_id',         '=', 'l.id'))
            ->leftJoinSub($collectedPerLoan,     'col',  fn ($j) => $j->on('col.loan_id',         '=', 'l.id'))
            ->leftJoinSub($outstandingPerLoan,   'out',  fn ($j) => $j->on('out.loan_id',         '=', 'l.id'))
            ->whereNull('l.deleted_at')
            ->whereNull('m.deleted_at')
            // Only loans that had activity in period (due OR collected)
            ->where(function ($q) {
                $q->whereNotNull('due.amount_due')
                  ->orWhereNotNull('col.amount_collected');
            });

        if (! empty($filters['branch_id'])) {
            $base->where('l.branch_id', $filters['branch_id']);
        }

        if (! empty($filters['loan_officer_id'])) {
            $base->where('l.loan_officer_id', $filters['loan_officer_id']);
        }

        $this->applyBranchScope($base);

        // ── By officer ────────────────────────────────────────────────────────
        $byOfficer = (clone $base)
            ->selectRaw("COALESCE(s.name, 'Unassigned')         as name")
            ->selectRaw('COUNT(DISTINCT l.id)                   as loan_count')
            ->selectRaw('COALESCE(SUM(due.amount_due), 0)       as amount_due')
            ->selectRaw('COALESCE(SUM(col.amount_collected), 0) as amount_collected')
            ->selectRaw('COALESCE(SUM(out.outstanding_balance), 0) as outstanding_balance')
            ->groupBy('s.name')
            ->orderByDesc('amount_collected')
            ->get()
            ->map(fn ($r) => [
                'name'                => $r->name,
                'loan_count'          => (int)   $r->loan_count,
                'amount_due'          => (float) $r->amount_due,
                'amount_collected'    => (float) $r->amount_collected,
                'collection_rate'     => $this->rate($r->amount_due, $r->amount_collected),
                'outstanding_balance' => (float) $r->outstanding_balance,
            ])
            ->all();

        // ── By branch ─────────────────────────────────────────────────────────
        $byBranch = (clone $base)
            ->selectRaw("COALESCE(b.name, 'Unassigned')         as name")
            ->selectRaw('COUNT(DISTINCT l.id)                   as loan_count')
            ->selectRaw('COALESCE(SUM(due.amount_due), 0)       as amount_due')
            ->selectRaw('COALESCE(SUM(col.amount_collected), 0) as amount_collected')
            ->selectRaw('COALESCE(SUM(out.outstanding_balance), 0) as outstanding_balance')
            ->groupBy('b.name')
            ->orderByDesc('amount_collected')
            ->get()
            ->map(fn ($r) => [
                'name'                => $r->name,
                'loan_count'          => (int)   $r->loan_count,
                'amount_due'          => (float) $r->amount_due,
                'amount_collected'    => (float) $r->amount_collected,
                'collection_rate'     => $this->rate($r->amount_due, $r->amount_collected),
                'outstanding_balance' => (float) $r->outstanding_balance,
            ])
            ->all();

        // ── By payment method ─────────────────────────────────────────────────
        $byMethod = DB::connection('tenant')
            ->table('loan_transactions as lt')
            ->join('loans as l', 'l.id', '=', 'lt.loan_id')
            ->where('lt.reversal_flag', 0)
            ->whereBetween('lt.payment_date', [$dateFrom, $dateTo])
            ->whereNull('l.deleted_at')
            ->when(! empty($filters['branch_id']),       fn ($q) => $q->where('l.branch_id',       $filters['branch_id']))
            ->when(! empty($filters['loan_officer_id']), fn ($q) => $q->where('l.loan_officer_id', $filters['loan_officer_id']))
            ->selectRaw("COALESCE(lt.payment_method, 'Other') as payment_method")
            ->selectRaw('COUNT(lt.id)           as transaction_count')
            ->selectRaw('SUM(lt.amount_paid)    as amount_collected')
            ->groupBy('lt.payment_method')
            ->orderByDesc('amount_collected')
            ->get()
            ->map(fn ($r) => [
                'payment_method'   => $r->payment_method,
                'transaction_count'=> (int)   $r->transaction_count,
                'amount_collected' => (float) $r->amount_collected,
            ])
            ->all();

        // ── Totals ────────────────────────────────────────────────────────────
        $totalDue         = array_sum(array_column($byOfficer, 'amount_due'));
        $totalCollected   = array_sum(array_column($byOfficer, 'amount_collected'));
        $totalOutstanding = array_sum(array_column($byOfficer, 'outstanding_balance'));
        $totalTxCount     = array_sum(array_column($byMethod,  'transaction_count'));

        return [
            'by_officer' => $byOfficer,
            'by_branch'  => $byBranch,
            'by_method'  => $byMethod,
            'totals'     => [
                'amount_due'          => (float) $totalDue,
                'amount_collected'    => (float) $totalCollected,
                'collection_rate'     => $this->rate($totalDue, $totalCollected),
                'outstanding_balance' => (float) $totalOutstanding,
                'transaction_count'   => (int)   $totalTxCount,
            ],
        ];
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    protected function rate(float $due, float $collected): float
    {
        if ($due <= 0) return $collected > 0 ? 100.0 : 0.0;
        return min(100.0, round($collected / $due * 100, 1));
    }

    protected function applyBranchScope($query): void
    {
        $user = auth()->user();
        if (! $user instanceof Staff) return;
        $scope = BranchContext::scopeFor($user);
        if ($scope !== BranchContext::SCOPE_ALL && $user->branch_id) {
            $query->where('l.branch_id', $user->branch_id);
        }
    }
}
```

- [ ] **Step 2: Verify the file parses**

```bash
cd /path/to/mfuko-pro-backend-2026
php artisan tinker --execute="new \App\Tenant\Modules\Loans\Services\LoanCollectionsReportService(); echo 'OK';"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add app/Tenant/Modules/Loans/Services/LoanCollectionsReportService.php
git commit -m "feat: add LoanCollectionsReportService with getSummary()"
```

---

## Task 2: Backend Service — `getReport()` and `getTransactionDetail()`

**Files:**
- Modify: `app/Tenant/Modules/Loans/Services/LoanCollectionsReportService.php`

- [ ] **Step 1: Add `getReport()` and `getTransactionDetail()` before the helpers**

Add these two methods inside the class, before `rate()`:

```php
    /**
     * Paginated loan-level table.
     * One row per loan that had schedule rows due OR payments received in the period.
     * Ordered by collection_rate ASC (worst collectors first).
     */
    public function getReport(array $filters): array
    {
        $dateFrom = $filters['date_from'];
        $dateTo   = $filters['date_to'];
        $perPage  = max(1, (int) ($filters['per_page'] ?? 25));
        $page     = max(1, (int) ($filters['page']     ?? 1));
        $offset   = ($page - 1) * $perPage;

        $duePerLoan = DB::connection('tenant')
            ->table('loan_repayment_schedule as rs')
            ->whereBetween('rs.due_date', [$dateFrom, $dateTo])
            ->selectRaw('rs.loan_id')
            ->selectRaw('SUM(rs.total_due) as amount_due')
            ->groupBy('rs.loan_id');

        $collectedPerLoan = DB::connection('tenant')
            ->table('loan_transactions as lt')
            ->where('lt.reversal_flag', 0)
            ->whereBetween('lt.payment_date', [$dateFrom, $dateTo])
            ->selectRaw('lt.loan_id')
            ->selectRaw('SUM(lt.amount_paid)      as amount_collected')
            ->selectRaw('MAX(lt.payment_date)      as last_payment_date')
            ->groupBy('lt.loan_id');

        $outstandingPerLoan = DB::connection('tenant')
            ->table('loan_repayment_schedule as rs')
            ->where('rs.status', '!=', 'paid')
            ->selectRaw('rs.loan_id')
            ->selectRaw('SUM(GREATEST(0,
                rs.total_due
                - rs.principal_paid - rs.interest_paid
                - rs.charges_paid  - rs.penalty_paid
            )) as outstanding_balance')
            ->selectRaw('MAX(DATEDIFF(CURDATE(), rs.due_date)) as days_in_arrears')
            ->groupBy('rs.loan_id');

        $lastPaymentAll = DB::connection('tenant')
            ->table('loan_transactions as lt')
            ->where('lt.reversal_flag', 0)
            ->selectRaw('lt.loan_id')
            ->selectRaw('MAX(lt.payment_date) as last_payment_date')
            ->groupBy('lt.loan_id');

        $base = DB::connection('tenant')
            ->table('loans as l')
            ->join('members as m',               'm.id', '=', 'l.member_id')
            ->leftJoin('staff as s',             's.id', '=', 'l.loan_officer_id')
            ->leftJoin('branches as b',          'b.id', '=', 'l.branch_id')
            ->leftJoin('loan_products as p',     'p.id', '=', 'l.loan_product_id')
            ->leftJoinSub($duePerLoan,           'due',  fn ($j) => $j->on('due.loan_id',  '=', 'l.id'))
            ->leftJoinSub($collectedPerLoan,     'col',  fn ($j) => $j->on('col.loan_id',  '=', 'l.id'))
            ->leftJoinSub($outstandingPerLoan,   'out',  fn ($j) => $j->on('out.loan_id',  '=', 'l.id'))
            ->leftJoinSub($lastPaymentAll,       'lp',   fn ($j) => $j->on('lp.loan_id',   '=', 'l.id'))
            ->whereNull('l.deleted_at')
            ->whereNull('m.deleted_at')
            ->where(function ($q) {
                $q->whereNotNull('due.amount_due')
                  ->orWhereNotNull('col.amount_collected');
            });

        if (! empty($filters['branch_id'])) {
            $base->where('l.branch_id', $filters['branch_id']);
        }

        if (! empty($filters['loan_officer_id'])) {
            $base->where('l.loan_officer_id', $filters['loan_officer_id']);
        }

        $this->applyBranchScope($base);

        $countQuery = clone $base;
        $total = $countQuery->distinct()->count('l.id');

        $rows = $base
            ->selectRaw('l.id                                                    as loan_id')
            ->selectRaw('l.loan_no')
            ->selectRaw('m.id                                                    as member_id')
            ->selectRaw('m.name                                                  as member_name')
            ->selectRaw('m.member_number')
            ->selectRaw("COALESCE(m.phone, '')                                   as phone")
            ->selectRaw("COALESCE(b.name, 'Unassigned')                          as branch_name")
            ->selectRaw("COALESCE(s.name, '—')                                   as loan_officer_name")
            ->selectRaw("COALESCE(p.name, '')                                    as product_name")
            ->selectRaw('COALESCE(due.amount_due, 0)                             as amount_due')
            ->selectRaw('COALESCE(col.amount_collected, 0)                       as amount_collected')
            ->selectRaw('COALESCE(out.outstanding_balance, 0)                    as outstanding_balance')
            ->selectRaw('COALESCE(out.days_in_arrears, 0)                        as days_in_arrears')
            ->selectRaw('lp.last_payment_date')
            ->orderByRaw('CASE WHEN COALESCE(due.amount_due, 0) = 0 THEN 1 ELSE 0 END')
            ->orderByRaw('COALESCE(col.amount_collected, 0) / NULLIF(COALESCE(due.amount_due, 0), 0) ASC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return [
            'loans' => [
                'data' => $rows->map(fn ($r) => [
                    'loan_id'             => $r->loan_id,
                    'loan_no'             => $r->loan_no,
                    'member_id'           => $r->member_id,
                    'member_name'         => $r->member_name,
                    'member_number'       => $r->member_number,
                    'phone'               => $r->phone,
                    'branch_name'         => $r->branch_name,
                    'loan_officer_name'   => $r->loan_officer_name,
                    'product_name'        => $r->product_name,
                    'amount_due'          => (float) $r->amount_due,
                    'amount_collected'    => (float) $r->amount_collected,
                    'collection_rate'     => $this->rate((float) $r->amount_due, (float) $r->amount_collected),
                    'outstanding_balance' => (float) $r->outstanding_balance,
                    'days_in_arrears'     => (int)   $r->days_in_arrears,
                    'last_payment_date'   => $r->last_payment_date,
                ]),
                'meta' => [
                    'current_page' => $page,
                    'last_page'    => (int) ceil($total / $perPage),
                    'per_page'     => $perPage,
                    'total'        => $total,
                    'from'         => $offset + 1,
                    'to'           => min($offset + $perPage, $total),
                ],
            ],
        ];
    }

    /**
     * All transactions for a single loan within the period.
     * Used for the expandable row detail.
     */
    public function getTransactionDetail(int $loanId, array $filters): array
    {
        $rows = DB::connection('tenant')
            ->table('loan_transactions as lt')
            ->leftJoin('staff as s', 's.id', '=', 'lt.collected_by')
            ->where('lt.loan_id', $loanId)
            ->where('lt.reversal_flag', 0)
            ->whereBetween('lt.payment_date', [$filters['date_from'], $filters['date_to']])
            ->selectRaw('lt.payment_date')
            ->selectRaw('lt.amount_paid')
            ->selectRaw('lt.principal_portion')
            ->selectRaw('lt.interest_portion')
            ->selectRaw('lt.charges_portion')
            ->selectRaw('lt.penalty_portion')
            ->selectRaw("COALESCE(lt.payment_method, 'Other') as payment_method")
            ->selectRaw("COALESCE(lt.receipt_no, '')           as receipt_no")
            ->selectRaw("COALESCE(s.name, '—')                 as collected_by_name")
            ->orderBy('lt.payment_date')
            ->get();

        return $rows->map(fn ($r) => [
            'payment_date'      => $r->payment_date,
            'amount_paid'       => (float) $r->amount_paid,
            'principal_portion' => (float) $r->principal_portion,
            'interest_portion'  => (float) $r->interest_portion,
            'charges_portion'   => (float) $r->charges_portion,
            'penalty_portion'   => (float) $r->penalty_portion,
            'payment_method'    => $r->payment_method,
            'receipt_no'        => $r->receipt_no,
            'collected_by_name' => $r->collected_by_name,
        ])->all();
    }
```

- [ ] **Step 2: Verify the file parses**

```bash
php artisan tinker --execute="new \App\Tenant\Modules\Loans\Services\LoanCollectionsReportService(); echo 'OK';"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add app/Tenant/Modules/Loans/Services/LoanCollectionsReportService.php
git commit -m "feat: add getReport() and getTransactionDetail() to LoanCollectionsReportService"
```

---

## Task 3: Export Class

**Files:**
- Create: `app/Exports/LoanCollectionsExport.php`

- [ ] **Step 1: Create the export class**

```php
<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LoanCollectionsExport implements WithMultipleSheets
{
    public function __construct(
        protected array $loans,
        protected array $transactions,
        protected string $dateFrom,
        protected string $dateTo,
    ) {}

    public function sheets(): array
    {
        return [
            new LoanCollectionsSummarySheet($this->loans),
            new LoanCollectionsTransactionsSheet($this->transactions),
        ];
    }
}

class LoanCollectionsSummarySheet implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    public function __construct(protected array $loans) {}

    public function title(): string { return 'Loan Summary'; }

    public function collection()
    {
        return collect($this->loans)->map(fn ($r) => [
            $r['member_number'],
            $r['member_name'],
            $r['loan_no'],
            $r['product_name'],
            $r['branch_name'],
            $r['loan_officer_name'],
            (float) $r['amount_due'],
            (float) $r['amount_collected'],
            (float) $r['collection_rate'],
            (float) $r['outstanding_balance'],
            (int)   $r['days_in_arrears'],
            $r['last_payment_date'],
        ]);
    }

    public function headings(): array
    {
        return [
            'Member Number', 'Member Name', 'Loan Number', 'Product',
            'Branch', 'Loan Officer', 'Amount Due', 'Amount Collected',
            'Collection Rate (%)', 'Outstanding Balance', 'Days in Arrears', 'Last Payment',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1       => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'D1FAE5']]],
            'A1:L1' => ['alignment' => ['horizontal' => 'center']],
        ];
    }
}

class LoanCollectionsTransactionsSheet implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    public function __construct(protected array $transactions) {}

    public function title(): string { return 'Transactions'; }

    public function collection()
    {
        return collect($this->transactions)->map(fn ($r) => [
            $r['loan_no'],
            $r['member_name'],
            $r['payment_date'],
            (float) $r['amount_paid'],
            (float) $r['principal_portion'],
            (float) $r['interest_portion'],
            (float) $r['charges_portion'],
            (float) $r['penalty_portion'],
            $r['payment_method'],
            $r['receipt_no'],
            $r['collected_by_name'],
        ]);
    }

    public function headings(): array
    {
        return [
            'Loan Number', 'Member Name', 'Payment Date', 'Amount Paid',
            'Principal', 'Interest', 'Charges', 'Penalty',
            'Payment Method', 'Receipt No', 'Collected By',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1       => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'DBEAFE']]],
            'A1:K1' => ['alignment' => ['horizontal' => 'center']],
        ];
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Exports/LoanCollectionsExport.php
git commit -m "feat: add LoanCollectionsExport with two-sheet Excel (Loan Summary + Transactions)"
```

---

## Task 4: Routes and Controller

**Files:**
- Modify: `routes/tenant_api.php`
- Modify: `app/Tenant/Http/Controllers/Api/V1/ReportsController.php`

- [ ] **Step 1: Add 4 routes to `routes/tenant_api.php`**

Find the block ending with `Route::get('reports/loan-arrears/{loan}/installments', ...)` and add immediately after:

```php
// ── Loan Collections Report ──────────────────────────────────────────────────
Route::get('reports/collections/summary',                    [ReportsController::class, 'collectionsSummary']);
Route::get('reports/collections/loans',                      [ReportsController::class, 'collectionsLoans']);
Route::get('reports/collections/export',                     [ReportsController::class, 'collectionsExport']);
Route::get('reports/collections/loans/{loan}/transactions',  [ReportsController::class, 'collectionsLoanTransactions']);
```

> Static routes (`summary`, `loans`, `export`) registered before `{loan}` wildcard.

- [ ] **Step 2: Add imports to `ReportsController.php`**

Add after the existing `use App\Exports\LoanArrearsExport;` line:

```php
use App\Exports\LoanCollectionsExport;
use App\Exports\LoanCollectionsSummarySheet;
use App\Exports\LoanCollectionsTransactionsSheet;
use App\Tenant\Modules\Loans\Services\LoanCollectionsReportService;
```

- [ ] **Step 3: Inject the service in the constructor**

Replace the existing constructor:

```php
    public function __construct(
        protected LoanAgingReportServiceInterface $agingService,
        protected LoanBalancesReportService $balancesService,
        protected LoanArrearsReportService $arrearsService,
        protected LoanCollectionsReportService $collectionsService,
    ) {}
```

- [ ] **Step 4: Add 4 controller methods** (add after `loanArrearsExport()`)

```php
    // ── Loan Collections Report ───────────────────────────────────────────────

    public function collectionsSummary(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from'       => ['required', 'date'],
            'date_to'         => ['required', 'date', 'after_or_equal:date_from'],
            'branch_id'       => ['nullable', 'integer', 'exists:tenant.branches,id'],
            'loan_officer_id' => ['nullable', 'integer', 'exists:tenant.staff,id'],
        ]);

        return response()->json($this->collectionsService->getSummary($filters));
    }

    public function collectionsLoans(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from'       => ['required', 'date'],
            'date_to'         => ['required', 'date', 'after_or_equal:date_from'],
            'branch_id'       => ['nullable', 'integer', 'exists:tenant.branches,id'],
            'loan_officer_id' => ['nullable', 'integer', 'exists:tenant.staff,id'],
            'per_page'        => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'            => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json($this->collectionsService->getReport($filters));
    }

    public function collectionsLoanTransactions(Request $request, int $loan): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to'   => ['required', 'date', 'after_or_equal:date_from'],
        ]);

        return response()->json($this->collectionsService->getTransactionDetail($loan, $filters));
    }

    public function collectionsExport(Request $request)
    {
        $filters = $request->validate([
            'date_from'       => ['required', 'date'],
            'date_to'         => ['required', 'date', 'after_or_equal:date_from'],
            'branch_id'       => ['nullable', 'integer', 'exists:tenant.branches,id'],
            'loan_officer_id' => ['nullable', 'integer', 'exists:tenant.staff,id'],
        ]);

        $loans = $this->collectionsService->getReport(array_merge($filters, ['per_page' => 10000, 'page' => 1]))['loans']['data']->toArray();

        // Flatten all transactions for sheet 2
        $transactions = collect($loans)->flatMap(function ($loan) use ($filters) {
            return collect($this->collectionsService->getTransactionDetail($loan['loan_id'], $filters))
                ->map(fn ($t) => array_merge($t, [
                    'loan_no'     => $loan['loan_no'],
                    'member_name' => $loan['member_name'],
                ]));
        })->all();

        $filename = "collections-report-{$filters['date_from']}-to-{$filters['date_to']}.xlsx";

        return Excel::download(
            new LoanCollectionsExport($loans, $transactions, $filters['date_from'], $filters['date_to']),
            $filename
        );
    }
```

- [ ] **Step 5: Verify routes are registered**

```bash
php artisan route:list --path=reports/collections
```

Expected: 4 rows — `GET reports/collections/summary`, `GET reports/collections/loans`, `GET reports/collections/export`, `GET reports/collections/loans/{loan}/transactions`

- [ ] **Step 6: Commit**

```bash
git add routes/tenant_api.php \
        app/Tenant/Http/Controllers/Api/V1/ReportsController.php
git commit -m "feat: wire LoanCollectionsReportService into controller and routes"
```

---

## Task 5: Frontend — API Types and Functions

**Files:**
- Modify: `src/tenant/apis/reports/reportsApi.ts`

- [ ] **Step 1: Add types before the `reportsApi` object**

Add this block after the existing `ArrearsReportResponse` interface:

```typescript
// ─── Loan Collections Report ──────────────────────────────────────────────────

export type CollectionsPeriodType = 'date_range' | 'month' | 'as_of_date'

export interface CollectionsFilters {
  date_from?: string | null
  date_to?: string | null
  branch_id?: number | null
  loan_officer_id?: number | null
  per_page?: number
  page?: number
}

export interface CollectionsSummaryRow {
  name: string
  loan_count: number
  amount_due: number
  amount_collected: number
  collection_rate: number
  outstanding_balance: number
}

export interface CollectionsMethodRow {
  payment_method: string
  transaction_count: number
  amount_collected: number
}

export interface CollectionsTotals {
  amount_due: number
  amount_collected: number
  collection_rate: number
  outstanding_balance: number
  transaction_count: number
}

export interface CollectionsSummaryResponse {
  by_officer: CollectionsSummaryRow[]
  by_branch: CollectionsSummaryRow[]
  by_method: CollectionsMethodRow[]
  totals: CollectionsTotals
}

export interface CollectionsLoanRow {
  loan_id: number
  loan_no: string
  member_id: number
  member_name: string
  member_number: string
  phone: string
  branch_name: string
  loan_officer_name: string
  product_name: string
  amount_due: number
  amount_collected: number
  collection_rate: number
  outstanding_balance: number
  days_in_arrears: number
  last_payment_date: string | null
}

export interface CollectionsTransactionRow {
  payment_date: string
  amount_paid: number
  principal_portion: number
  interest_portion: number
  charges_portion: number
  penalty_portion: number
  payment_method: string
  receipt_no: string
  collected_by_name: string
}

export interface CollectionsLoansResponse {
  loans: {
    data: CollectionsLoanRow[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
      from: number
      to: number
    }
  }
}
```

- [ ] **Step 2: Add API functions inside the `reportsApi` object** (after `loanArrearsExport`)

```typescript
  // ─── Loan Collections ──────────────────────────────────────────────────────
  collectionsSummary(params?: CollectionsFilters) {
    return tenantClient.get<CollectionsSummaryResponse>('/reports/collections/summary', { params })
  },

  collectionsLoans(params?: CollectionsFilters) {
    return tenantClient.get<CollectionsLoansResponse>('/reports/collections/loans', { params })
  },

  collectionsLoanTransactions(loanId: number, params?: Pick<CollectionsFilters, 'date_from' | 'date_to'>) {
    return tenantClient.get<CollectionsTransactionRow[]>(
      `/reports/collections/loans/${loanId}/transactions`,
      { params },
    )
  },

  collectionsExport(params?: CollectionsFilters) {
    return tenantClient.get('/reports/collections/export', { params, responseType: 'blob' })
  },
```

- [ ] **Step 3: Type-check**

```bash
cd /path/to/mfuko-pro-frontend-2026
yarn type-check
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/tenant/apis/reports/reportsApi.ts
git commit -m "feat: add collections report types and API functions to reportsApi.ts"
```

---

## Task 6: Frontend — `CollectionsReport.vue`

**Files:**
- Replace: `src/tenant/modules/loans/pages/CollectionsReport.vue`

- [ ] **Step 1: Replace the placeholder with the full component**

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Filter, Download, RotateCcw, ChevronDown, ChevronRight, ExternalLink } from 'lucide-vue-next'
import { Spinner, Pagination, formatMoneyValue } from '@/Global'
import { RouterLink } from 'vue-router'
import {
  reportsApi,
  type CollectionsFilters,
  type CollectionsPeriodType,
  type CollectionsSummaryRow,
  type CollectionsMethodRow,
  type CollectionsTotals,
  type CollectionsSummaryResponse,
  type CollectionsLoanRow,
  type CollectionsTransactionRow,
} from '@/tenant/apis/reports/reportsApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

// ─── State ────────────────────────────────────────────────────────────────────

const today     = new Date().toISOString().split('T')[0]
const thisMonth = today.slice(0, 7) // YYYY-MM

const periodType  = ref<CollectionsPeriodType>('month')
const monthValue  = ref(thisMonth)       // for type='month'
const dateFrom    = ref(today)           // for type='date_range'
const dateTo      = ref(today)           // for type='date_range'
const asOfDate    = ref(today)           // for type='as_of_date'

const branchId    = ref<number | null>(null)
const officerId   = ref<number | null>(null)
const page        = ref(1)

const showBranchFilter = ref(false)
const branches         = ref<{ id: number; name: string }[]>([])
const officers         = ref<{ id: number; name: string }[]>([])

const loading             = ref(false)
const loadingTransactions = ref(false)
const exporting           = ref(false)
const error               = ref<string | null>(null)

const summary    = ref<CollectionsSummaryResponse | null>(null)
const loans      = ref<CollectionsLoanRow[]>([])
const meta       = ref<Meta>({ current_page: 1, last_page: 1, per_page: 25, total: 0, from: 1, to: 0 })
const activeTab  = ref<'officer' | 'branch' | 'method'>('officer')

const expandedLoanId      = ref<number | null>(null)
const transactionCache    = ref<Map<number, CollectionsTransactionRow[]>>(new Map())
const expandError         = ref<string | null>(null)

// ─── Derived period dates ─────────────────────────────────────────────────────

const resolvedDates = computed((): { date_from: string; date_to: string } => {
  if (periodType.value === 'month') {
    const [y, m] = monthValue.value.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    return {
      date_from: `${monthValue.value}-01`,
      date_to:   `${monthValue.value}-${String(last).padStart(2, '0')}`,
    }
  }
  if (periodType.value === 'as_of_date') {
    return { date_from: '2000-01-01', date_to: asOfDate.value }
  }
  return { date_from: dateFrom.value, date_to: dateTo.value }
})

// ─── Filter options ───────────────────────────────────────────────────────────

async function loadFilterOptions() {
  try {
    const res = await reportsApi.filterOptions()
    showBranchFilter.value = res.data.filters?.options?.show_branch_filter
      ?? res.data.show_branch_filter ?? false
    branches.value = res.data.filters?.options?.branches ?? res.data.branches ?? []
    officers.value = res.data.filters?.options?.staff    ?? res.data.staff    ?? []
  } catch {
    // non-critical
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

function buildFilters(): CollectionsFilters {
  return {
    ...resolvedDates.value,
    branch_id:       branchId.value,
    loan_officer_id: officerId.value,
    per_page:        25,
    page:            page.value,
  }
}

async function fetchAll() {
  loading.value = true
  error.value   = null
  try {
    const filters = buildFilters()
    const [summaryRes, loansRes] = await Promise.all([
      reportsApi.collectionsSummary(filters),
      reportsApi.collectionsLoans(filters),
    ])
    summary.value = summaryRes.data
    loans.value   = loansRes.data.loans.data
    meta.value    = loansRes.data.loans.meta
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load collections report.'
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  page.value = 1
  transactionCache.value.clear()
  expandedLoanId.value = null
  await fetchAll()
}

function resetFilters() {
  periodType.value = 'month'
  monthValue.value  = thisMonth
  dateFrom.value    = today
  dateTo.value      = today
  asOfDate.value    = today
  branchId.value    = null
  officerId.value   = null
  page.value        = 1
  applyFilters()
}

async function onPageChange(p: number) {
  page.value = p
  await fetchAll()
}

// ─── Row expand ───────────────────────────────────────────────────────────────

async function toggleExpand(loanId: number) {
  if (expandedLoanId.value === loanId) {
    expandedLoanId.value = null
    return
  }
  expandedLoanId.value = loanId
  expandError.value    = null

  if (transactionCache.value.has(loanId)) return

  loadingTransactions.value = true
  try {
    const res = await reportsApi.collectionsLoanTransactions(loanId, resolvedDates.value)
    transactionCache.value.set(loanId, res.data)
  } catch {
    expandError.value = 'Failed to load transactions.'
  } finally {
    loadingTransactions.value = false
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

async function exportExcel() {
  exporting.value = true
  try {
    const res = await reportsApi.collectionsExport({
      ...resolvedDates.value,
      branch_id:       branchId.value,
      loan_officer_id: officerId.value,
    })
    const url  = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href     = url
    link.download = `collections-report-${resolvedDates.value.date_from}-to-${resolvedDates.value.date_to}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('Export failed. Please try again.')
  } finally {
    exporting.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) { return formatMoneyValue(v) }

function rateColor(rate: number): string {
  if (rate >= 80) return 'text-green-600 font-semibold'
  if (rate >= 50) return 'text-orange-500 font-semibold'
  return 'text-red-600 font-bold'
}

function dpd(days: number): string {
  if (days === 0) return 'text-green-600'
  if (days > 90)  return 'text-red-700 font-bold'
  if (days > 30)  return 'text-red-500 font-semibold'
  return 'text-orange-500 font-semibold'
}

// ─── Mount ────────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadFilterOptions()
  await fetchAll()
})
</script>

<template>
  <div class="flex flex-col gap-6 p-4 md:p-6">

    <!-- ── Page Header ──────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Collections Report</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Loan repayment collections —
          <strong>{{ resolvedDates.date_from }}</strong> to <strong>{{ resolvedDates.date_to }}</strong>
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
        :disabled="exporting || loading"
        @click="exportExcel"
      >
        <Spinner v-if="exporting" class="h-4 w-4" />
        <Download v-else class="h-4 w-4" />
        Export Excel
      </button>
    </div>

    <!-- ── Filter Bar ───────────────────────────────────────────────────── -->
    <div class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div class="flex flex-wrap items-end gap-3">

        <!-- Period Type -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Period Type</label>
          <select
            v-model="periodType"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option value="month">Month</option>
            <option value="date_range">Date Range</option>
            <option value="as_of_date">As of Date</option>
          </select>
        </div>

        <!-- Month picker -->
        <div v-if="periodType === 'month'" class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Month</label>
          <input
            v-model="monthValue"
            type="month"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>

        <!-- Date range -->
        <template v-if="periodType === 'date_range'">
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">From</label>
            <input v-model="dateFrom" type="date"
              class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">To</label>
            <input v-model="dateTo" type="date"
              class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" />
          </div>
        </template>

        <!-- As of date -->
        <div v-if="periodType === 'as_of_date'" class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">As of Date</label>
          <input v-model="asOfDate" type="date"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" />
        </div>

        <!-- Branch -->
        <div v-if="showBranchFilter" class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Branch</label>
          <select v-model="branchId"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white">
            <option :value="null">All Branches</option>
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>

        <!-- Loan Officer -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Loan Officer</label>
          <select v-model="officerId"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white">
            <option :value="null">All Officers</option>
            <option v-for="o in officers" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            class="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            @click="applyFilters"
          >
            <Filter class="h-3.5 w-3.5" /> Apply
          </button>
          <button
            class="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
            @click="resetFilters"
          >
            <RotateCcw class="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>

    <!-- ── Error ────────────────────────────────────────────────────────── -->
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- ── Loading ──────────────────────────────────────────────────────── -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-8 w-8 text-blue-500" />
    </div>

    <template v-else>

      <!-- ── ① Summary Tabs ─────────────────────────────────────────────── -->
      <div v-if="summary" class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">

        <!-- Totals bar -->
        <div class="grid grid-cols-2 gap-4 border-b border-neutral-100 px-5 py-4 sm:grid-cols-4 dark:border-neutral-700">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Due</div>
            <div class="mt-0.5 text-base font-bold text-neutral-800 dark:text-white">{{ fmt(summary.totals.amount_due) }}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Collected</div>
            <div class="mt-0.5 text-base font-bold text-nfuko-action">{{ fmt(summary.totals.amount_collected) }}</div>
          </div>
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Collection Rate</div>
            <div class="mt-0.5 text-base font-bold" :class="rateColor(summary.totals.collection_rate)">
              {{ summary.totals.collection_rate }}%
            </div>
          </div>
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Transactions</div>
            <div class="mt-0.5 text-base font-bold text-neutral-800 dark:text-white">{{ summary.totals.transaction_count }}</div>
          </div>
        </div>

        <!-- Tab bar -->
        <div class="flex border-b border-neutral-100 dark:border-neutral-700">
          <button
            v-for="tab in [{ key: 'officer', label: 'By Loan Officer' }, { key: 'branch', label: 'By Branch' }, { key: 'method', label: 'By Payment Method' }]"
            :key="tab.key"
            class="px-5 py-2.5 text-xs font-semibold transition-colors"
            :class="activeTab === tab.key
              ? 'border-b-2 border-nfuko-action text-nfuko-action'
              : 'text-neutral-500 hover:text-neutral-700'"
            @click="activeTab = tab.key as typeof activeTab"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- By Officer / By Branch table -->
        <div v-if="activeTab === 'officer' || activeTab === 'branch'" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 dark:bg-neutral-700/40">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {{ activeTab === 'officer' ? 'Loan Officer' : 'Branch' }}
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Loans</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Due</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Collected</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Rate %</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in (activeTab === 'officer' ? summary.by_officer : summary.by_branch)"
                :key="row.name"
                class="border-b border-neutral-100 dark:border-neutral-700"
              >
                <td class="px-4 py-3 font-medium text-neutral-800 dark:text-white">{{ row.name }}</td>
                <td class="px-4 py-3 text-center text-neutral-500">{{ row.loan_count }}</td>
                <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">{{ fmt(row.amount_due) }}</td>
                <td class="px-4 py-3 text-right font-semibold text-nfuko-action">{{ fmt(row.amount_collected) }}</td>
                <td class="px-4 py-3 text-right" :class="rateColor(row.collection_rate)">{{ row.collection_rate }}%</td>
                <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">{{ fmt(row.outstanding_balance) }}</td>
              </tr>
              <!-- Totals row -->
              <tr class="bg-neutral-50 font-semibold dark:bg-neutral-700/40">
                <td class="px-4 py-3 text-neutral-700 dark:text-white">Total</td>
                <td class="px-4 py-3 text-center text-neutral-700 dark:text-white">—</td>
                <td class="px-4 py-3 text-right text-neutral-700 dark:text-white">{{ fmt(summary.totals.amount_due) }}</td>
                <td class="px-4 py-3 text-right text-nfuko-action">{{ fmt(summary.totals.amount_collected) }}</td>
                <td class="px-4 py-3 text-right" :class="rateColor(summary.totals.collection_rate)">{{ summary.totals.collection_rate }}%</td>
                <td class="px-4 py-3 text-right text-neutral-700 dark:text-white">{{ fmt(summary.totals.outstanding_balance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- By Payment Method table -->
        <div v-if="activeTab === 'method'" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 dark:bg-neutral-700/40">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment Method</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Transactions</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Collected</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in summary.by_method"
                :key="row.payment_method"
                class="border-b border-neutral-100 dark:border-neutral-700"
              >
                <td class="px-4 py-3 font-medium text-neutral-800 dark:text-white">{{ row.payment_method }}</td>
                <td class="px-4 py-3 text-center text-neutral-500">{{ row.transaction_count }}</td>
                <td class="px-4 py-3 text-right font-semibold text-nfuko-action">{{ fmt(row.amount_collected) }}</td>
              </tr>
              <tr class="bg-neutral-50 font-semibold dark:bg-neutral-700/40">
                <td class="px-4 py-3 text-neutral-700 dark:text-white">Total</td>
                <td class="px-4 py-3 text-center text-neutral-700 dark:text-white">{{ summary.totals.transaction_count }}</td>
                <td class="px-4 py-3 text-right text-nfuko-action">{{ fmt(summary.totals.amount_collected) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── ② Empty State ──────────────────────────────────────────────── -->
      <div
        v-if="loans.length === 0"
        class="rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center dark:border-green-800 dark:bg-green-950"
      >
        <p class="text-base font-semibold text-green-700 dark:text-green-300">No collections recorded for this period</p>
        <p class="mt-1 text-sm text-green-500">{{ resolvedDates.date_from }} → {{ resolvedDates.date_to }}</p>
      </div>

      <!-- ── ③ Loans Table ───────────────────────────────────────────────── -->
      <div v-if="loans.length > 0" class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div class="border-b border-neutral-100 px-5 py-3 dark:border-neutral-700">
          <span class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Loan Breakdown — {{ meta.total }} loan{{ meta.total !== 1 ? 's' : '' }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 dark:bg-neutral-700/40">
              <tr>
                <th class="w-8 px-3 py-3"></th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Member</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan Officer</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount Due</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Collected</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Rate %</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Outstanding</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">DPD</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Last Payment</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="loan in loans" :key="loan.loan_id">
                <!-- Main row -->
                <tr
                  class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/30"
                  :class="expandedLoanId === loan.loan_id ? 'bg-blue-50 dark:bg-blue-900/10' : ''"
                  @click="toggleExpand(loan.loan_id)"
                >
                  <td class="px-3 py-3 text-neutral-400">
                    <ChevronDown v-if="expandedLoanId === loan.loan_id" class="h-4 w-4 text-blue-600" />
                    <ChevronRight v-else class="h-4 w-4" />
                  </td>
                  <td class="px-4 py-3">
                    <RouterLink
                      :to="`/tenant/members/${loan.member_id}`"
                      class="font-semibold text-neutral-900 hover:text-blue-600 dark:text-white"
                      @click.stop
                    >{{ loan.member_name }}</RouterLink>
                    <div class="text-xs text-neutral-400">{{ loan.member_number }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <RouterLink
                      :to="`/tenant/loans/${loan.loan_id}`"
                      class="flex items-center gap-1 font-medium text-blue-600 hover:underline"
                      @click.stop
                    >
                      {{ loan.loan_no }}<ExternalLink class="h-3 w-3" />
                    </RouterLink>
                  </td>
                  <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">{{ loan.loan_officer_name }}</td>
                  <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">{{ fmt(loan.amount_due) }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-nfuko-action">{{ fmt(loan.amount_collected) }}</td>
                  <td class="px-4 py-3 text-right" :class="rateColor(loan.collection_rate)">{{ loan.collection_rate }}%</td>
                  <td class="px-4 py-3 text-right text-neutral-600 dark:text-neutral-300">{{ fmt(loan.outstanding_balance) }}</td>
                  <td class="px-4 py-3 text-center" :class="dpd(loan.days_in_arrears)">
                    {{ loan.days_in_arrears > 0 ? loan.days_in_arrears : '—' }}
                  </td>
                  <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">{{ loan.last_payment_date ?? '—' }}</td>
                </tr>

                <!-- Expanded transaction detail -->
                <tr v-if="expandedLoanId === loan.loan_id" class="border-b border-blue-100 bg-blue-50/60 dark:border-blue-900/30 dark:bg-blue-900/5">
                  <td colspan="10" class="px-8 pb-4 pt-2">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-2">Transactions in Period</div>

                    <div v-if="loadingTransactions && !transactionCache.has(loan.loan_id)" class="py-3 text-sm text-neutral-400">
                      <Spinner class="mr-2 inline h-4 w-4" /> Loading…
                    </div>
                    <div v-else-if="expandError" class="text-sm text-red-600">
                      {{ expandError }}
                      <button class="ml-2 underline" @click="toggleExpand(loan.loan_id)">Retry</button>
                    </div>

                    <table v-else class="w-auto text-xs">
                      <thead>
                        <tr class="bg-blue-100/60 dark:bg-blue-900/20">
                          <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Date</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Amount Paid</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Principal</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Interest</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Charges</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-blue-800">Penalty</th>
                          <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Method</th>
                          <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Receipt No</th>
                          <th class="px-3 py-1.5 text-left font-semibold text-blue-800">Collected By</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(tx, i) in transactionCache.get(loan.loan_id) ?? []"
                          :key="i"
                          class="border-b border-blue-100 dark:border-blue-900/20"
                        >
                          <td class="px-3 py-1.5 text-neutral-600">{{ tx.payment_date }}</td>
                          <td class="px-3 py-1.5 text-right font-semibold text-nfuko-action">{{ fmt(tx.amount_paid) }}</td>
                          <td class="px-3 py-1.5 text-right text-neutral-600">{{ fmt(tx.principal_portion) }}</td>
                          <td class="px-3 py-1.5 text-right text-neutral-600">{{ fmt(tx.interest_portion) }}</td>
                          <td class="px-3 py-1.5 text-right text-neutral-600">{{ fmt(tx.charges_portion) }}</td>
                          <td class="px-3 py-1.5 text-right text-neutral-600">{{ fmt(tx.penalty_portion) }}</td>
                          <td class="px-3 py-1.5 text-neutral-600">{{ tx.payment_method }}</td>
                          <td class="px-3 py-1.5 text-neutral-600">{{ tx.receipt_no || '—' }}</td>
                          <td class="px-3 py-1.5 text-neutral-600">{{ tx.collected_by_name }}</td>
                        </tr>
                        <tr v-if="(transactionCache.get(loan.loan_id) ?? []).length === 0">
                          <td colspan="9" class="px-3 py-2 italic text-neutral-400">No transactions found in this period.</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="border-t border-neutral-100 px-5 py-3 dark:border-neutral-700">
          <div class="flex items-center justify-between">
            <span class="text-xs text-neutral-400">
              Showing {{ meta.from }}–{{ meta.to }} of {{ meta.total }} loans
            </span>
            <Pagination
              :current-page="meta.current_page"
              :last-page="meta.last_page"
              @change="onPageChange"
            />
          </div>
        </div>
      </div>

    </template>
  </div>
</template>
```

- [ ] **Step 2: Type-check**

```bash
yarn type-check
```

Expected: no errors

- [ ] **Step 3: Lint**

```bash
yarn lint
```

Fix any issues before committing.

- [ ] **Step 4: Commit**

```bash
git add src/tenant/apis/reports/reportsApi.ts \
        src/tenant/modules/loans/pages/CollectionsReport.vue
git commit -m "feat: implement Collections Report with summary tabs, loan table, and transaction detail"
```

---

## Task 7: Push Both Repos

- [ ] **Step 1: Push backend**

```bash
cd /path/to/mfuko-pro-backend-2026
git push origin main
```

- [ ] **Step 2: Push frontend**

```bash
cd /path/to/mfuko-pro-frontend-2026
git push origin main
```

---

## Manual Verification Checklist

After all tasks complete, verify in the browser at `/tenant/collections-report`:

- [ ] Filter bar renders; Period Type dropdown switches date inputs correctly
- [ ] Month picker defaults to current month; Apply loads data
- [ ] Summary totals bar shows Amount Due, Collected, Rate, Transaction count
- [ ] Three tabs render: By Loan Officer, By Branch, By Payment Method
- [ ] Collection rate colour-coded: ≥80% green, 50–79% orange, <50% red
- [ ] Totals row pinned at bottom of each tab table
- [ ] Loans table shows worst collectors first (lowest rate at top)
- [ ] Clicking a loan row expands it showing transactions in the period
- [ ] Expanding same row twice uses cache (no second network request)
- [ ] Export downloads a valid `.xlsx` with two sheets: Loan Summary + Transactions
- [ ] Reset button restores defaults
- [ ] Empty state shown when no collections exist for the period
- [ ] Branch filter hidden for branch-scoped users
- [ ] Page readable in dark mode
