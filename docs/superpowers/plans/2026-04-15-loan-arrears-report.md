# Loan Arrears Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Loan Arrears Report — comparison cards, trend chart, paginated filterable table with expandable installment rows, and Excel export.

**Architecture:** New `LoanArrearsReportService` on the backend (5 methods, follows `LoanBalancesReportService` pattern). Five new routes wired into the existing `ReportsController`. Frontend replaces the existing `ArrearsReport.vue` placeholder — nav and route are already registered.

**Tech Stack:** Laravel 12 / PHP, Vue 3 + TypeScript, Tailwind CSS, Maatwebsite Excel, `DB::connection('tenant')` for all queries.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php` | All report query logic |
| Create | `app/Exports/LoanArrearsExport.php` | Excel export class |
| Modify | `app/Tenant/Http/Controllers/Api/V1/ReportsController.php` | Inject service, 5 new methods |
| Modify | `routes/tenant_api.php` | 5 new routes |
| Modify | `src/tenant/apis/reports/reportsApi.ts` | Types + 5 API functions |
| Replace | `src/tenant/modules/loans/pages/ArrearsReport.vue` | Full report UI (was placeholder) |

---

## Task 1: Backend Service — base query + `getReport()`

**Files:**
- Create: `app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php`

- [ ] **Step 1: Create the service file with `getReport()` and its base query**

```php
<?php

namespace App\Tenant\Modules\Loans\Services;

use App\Models\Staff;
use App\Support\BranchContext;
use Illuminate\Support\Facades\DB;

class LoanArrearsReportService
{
    /**
     * Paginated list of loans currently in arrears status.
     * One row per loan with total overdue amounts and collections metadata.
     */
    public function getReport(array $filters): array
    {
        $asOf    = $filters['as_of_date'] ?? now()->toDateString();
        $perPage = max(1, (int) ($filters['per_page'] ?? 25));
        $page    = max(1, (int) ($filters['page']     ?? 1));
        $offset  = ($page - 1) * $perPage;

        $base = $this->baseQuery($asOf, $filters);

        // Clone before adding selects — used for count
        $countQuery = clone $base;

        $rows = $base
            ->selectRaw('l.id                                                           as loan_id')
            ->selectRaw('l.loan_no')
            ->selectRaw('l.disbursed_at')
            ->selectRaw('m.id                                                           as member_id')
            ->selectRaw('m.name                                                         as member_name')
            ->selectRaw('m.member_number')
            ->selectRaw('COALESCE(m.phone, \'\')                                        as phone')
            ->selectRaw("COALESCE(b.name, 'Unassigned')                                as branch_name")
            ->selectRaw("COALESCE(s.name, '—')                                         as loan_officer_name")
            ->selectRaw("COALESCE(p.name, '')                                           as product_name")
            ->selectRaw('
                COALESCE(SUM(GREATEST(0,
                    (rs.principal_due + rs.interest_due + rs.charges_due + rs.penalty_due)
                    - (rs.principal_paid + rs.interest_paid + rs.charges_paid + rs.penalty_paid)
                )), 0) as total_arrears
            ')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.principal_due - rs.principal_paid)), 0) as principal_arrears')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.interest_due  - rs.interest_paid)),  0) as interest_arrears')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.charges_due   - rs.charges_paid)),   0) as charges_arrears')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.penalty_due   - rs.penalty_paid)),   0) as penalty_arrears')
            ->selectRaw('COUNT(DISTINCT rs.id)                                          as missed_installments')
            ->selectRaw('MAX(DATEDIFF(?, rs.due_date))                                  as days_in_arrears', [$asOf])
            ->selectRaw('MAX(lt_last.payment_date)                                      as last_payment_date')
            ->groupBy(
                'l.id', 'l.loan_no', 'l.disbursed_at',
                'm.id', 'm.name', 'm.member_number', 'm.phone',
                'b.name', 's.name', 'p.name',
            )
            ->orderByDesc('days_in_arrears')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        $total = $countQuery->distinct()->count('l.id');

        return [
            'loans' => [
                'data' => $rows->map(fn ($r) => [
                    'loan_id'              => $r->loan_id,
                    'loan_no'              => $r->loan_no,
                    'member_id'            => $r->member_id,
                    'member_name'          => $r->member_name,
                    'member_number'        => $r->member_number,
                    'phone'                => $r->phone,
                    'branch_name'          => $r->branch_name,
                    'loan_officer_name'    => $r->loan_officer_name,
                    'product_name'         => $r->product_name,
                    'total_arrears'        => (float) $r->total_arrears,
                    'principal_arrears'    => (float) $r->principal_arrears,
                    'interest_arrears'     => (float) $r->interest_arrears,
                    'charges_arrears'      => (float) $r->charges_arrears,
                    'penalty_arrears'      => (float) $r->penalty_arrears,
                    'missed_installments'  => (int) $r->missed_installments,
                    'days_in_arrears'      => (int) $r->days_in_arrears,
                    'last_payment_date'    => $r->last_payment_date,
                    'disbursed_at'         => $r->disbursed_at,
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

    // ─── Base query ───────────────────────────────────────────────────────────

    /**
     * Shared FROM + JOIN + WHERE for the main loans table.
     * Only loans with status = 'arrears'.
     * Only schedule rows that are overdue (due_date <= asOf, status != 'paid').
     */
    protected function baseQuery(string $asOf, array $filters)
    {
        // Last repayment date per loan
        $lastPayment = DB::connection('tenant')
            ->table('loan_transactions as lt')
            ->where('lt.reversal_flag', 0)
            ->selectRaw('lt.loan_id')
            ->selectRaw('MAX(lt.payment_date) as payment_date')
            ->groupBy('lt.loan_id');

        $query = DB::connection('tenant')
            ->table('loans as l')
            ->join('loan_repayment_schedule as rs', 'rs.loan_id', '=', 'l.id')
            ->join('members as m',                  'm.id',       '=', 'l.member_id')
            ->leftJoin('loan_products as p',         'p.id',       '=', 'l.loan_product_id')
            ->leftJoin('branches as b',              'b.id',       '=', 'l.branch_id')
            ->leftJoin('staff as s',                 's.id',       '=', 'l.loan_officer_id')
            ->leftJoinSub($lastPayment, 'lt_last',
                fn ($join) => $join->on('lt_last.loan_id', '=', 'l.id')
            )
            ->whereNull('l.deleted_at')
            ->whereNull('m.deleted_at')
            ->where('l.status', 'arrears')
            ->where('rs.status', '!=', 'paid')
            ->where('rs.due_date', '<=', $asOf);

        if (! empty($filters['branch_id'])) {
            $query->where('l.branch_id', $filters['branch_id']);
        }

        if (! empty($filters['loan_officer_id'])) {
            $query->where('l.loan_officer_id', $filters['loan_officer_id']);
        }

        $this->applyBranchScope($query);

        return $query;
    }

    // ─── Branch scope ─────────────────────────────────────────────────────────

    protected function applyBranchScope($query): void
    {
        $user = auth()->user();

        if (! $user instanceof Staff) {
            return;
        }

        $scope = BranchContext::scopeFor($user);

        if ($scope !== BranchContext::SCOPE_ALL && $user->branch_id) {
            $query->where('l.branch_id', $user->branch_id);
        }
    }
}
```

- [ ] **Step 2: Verify the file parses without errors**

```bash
cd /path/to/mfuko-pro-backend-2026
php artisan tinker --execute="new \App\Tenant\Modules\Loans\Services\LoanArrearsReportService(); echo 'OK';"
```
Expected output: `OK`

- [ ] **Step 3: Commit**

```bash
cd /path/to/mfuko-pro-backend-2026
git add app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php
git commit -m "feat: add LoanArrearsReportService with getReport() and base query"
```

---

## Task 2: Backend Service — `getComparison()`

**Files:**
- Modify: `app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php`

- [ ] **Step 1: Add `getComparison()` and `snapshotAt()` helper to the service**

Add these two methods inside the class, after `getReport()` and before `baseQuery()`:

```php
    /**
     * Three-point comparison: today, −30 days, −90 days.
     * Uses schedule-based overdue detection (not current status) for historical accuracy.
     */
    public function getComparison(array $filters): array
    {
        $asOf = $filters['as_of_date'] ?? now()->toDateString();

        $today         = $asOf;
        $oneMonthAgo   = now()->parse($asOf)->subDays(30)->toDateString();
        $threeMonthsAgo = now()->parse($asOf)->subDays(90)->toDateString();

        return [
            'today'          => $this->snapshotAt($today,          $filters),
            'one_month_ago'  => $this->snapshotAt($oneMonthAgo,    $filters),
            'three_months_ago' => $this->snapshotAt($threeMonthsAgo, $filters),
        ];
    }

    /**
     * Aggregate arrears totals at a single point in time.
     * Counts loans that had at least one overdue installment on $date —
     * regardless of current loan status (historical accuracy).
     */
    protected function snapshotAt(string $date, array $filters): array
    {
        // Last payment subquery up to $date
        $lastPayment = DB::connection('tenant')
            ->table('loan_transactions as lt')
            ->where('lt.reversal_flag', 0)
            ->where('lt.payment_date', '<=', $date)
            ->selectRaw('lt.loan_id')
            ->selectRaw('MAX(lt.payment_date) as payment_date')
            ->groupBy('lt.loan_id');

        $query = DB::connection('tenant')
            ->table('loans as l')
            ->join('loan_repayment_schedule as rs', 'rs.loan_id', '=', 'l.id')
            ->leftJoin('branches as b', 'b.id', '=', 'l.branch_id')
            ->leftJoinSub($lastPayment, 'lt_last',
                fn ($join) => $join->on('lt_last.loan_id', '=', 'l.id')
            )
            ->whereNull('l.deleted_at')
            ->whereIn('l.status', ['disbursed', 'active', 'arrears', 'closed', 'fully_repaid', 'written_off', 'defaulted'])
            ->where('rs.status', '!=', 'paid')
            ->where('rs.due_date', '<=', $date)
            ->whereDate('l.disbursed_at', '<=', $date);

        if (! empty($filters['branch_id'])) {
            $query->where('l.branch_id', $filters['branch_id']);
        }

        if (! empty($filters['loan_officer_id'])) {
            $query->where('l.loan_officer_id', $filters['loan_officer_id']);
        }

        $this->applyBranchScope($query);

        $result = $query
            ->selectRaw('COUNT(DISTINCT l.id) as loan_count')
            ->selectRaw('
                COALESCE(SUM(GREATEST(0,
                    (rs.principal_due + rs.interest_due + rs.charges_due + rs.penalty_due)
                    - (rs.principal_paid + rs.interest_paid + rs.charges_paid + rs.penalty_paid)
                )), 0) as total_arrears
            ')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.principal_due - rs.principal_paid)), 0) as principal_arrears')
            ->first();

        return [
            'date'              => $date,
            'loan_count'        => (int)   ($result->loan_count       ?? 0),
            'total_arrears'     => (float) ($result->total_arrears    ?? 0),
            'principal_arrears' => (float) ($result->principal_arrears ?? 0),
        ];
    }
```

- [ ] **Step 2: Verify it parses**

```bash
php artisan tinker --execute="new \App\Tenant\Modules\Loans\Services\LoanArrearsReportService(); echo 'OK';"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php
git commit -m "feat: add getComparison() and snapshotAt() to LoanArrearsReportService"
```

---

## Task 3: Backend Service — `getTrend()`

**Files:**
- Modify: `app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php`

- [ ] **Step 1: Add `getTrend()` to the service**

Add this method inside the class after `getComparison()`:

```php
    /**
     * Monthly arrears totals for the last N months (6 or 12).
     * Returns one data point per month: month-end date, label, loan_count, total_arrears.
     * Uses schedule-based overdue detection for historical accuracy.
     */
    public function getTrend(array $filters): array
    {
        $asOf   = $filters['as_of_date'] ?? now()->toDateString();
        $months = in_array((int) ($filters['months'] ?? 12), [6, 12]) ? (int) $filters['months'] : 12;

        $points = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $monthEnd = now()->parse($asOf)->subMonths($i)->endOfMonth()->toDateString();

            // Don't project into the future — cap at asOf
            if ($monthEnd > $asOf) {
                $monthEnd = $asOf;
            }

            $snapshot = $this->snapshotAt($monthEnd, $filters);

            $points[] = [
                'month'         => now()->parse($monthEnd)->format('Y-m'),
                'label'         => now()->parse($monthEnd)->format('M Y'),
                'month_end'     => $monthEnd,
                'loan_count'    => $snapshot['loan_count'],
                'total_arrears' => $snapshot['total_arrears'],
            ];
        }

        return $points;
    }
```

- [ ] **Step 2: Commit**

```bash
git add app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php
git commit -m "feat: add getTrend() to LoanArrearsReportService"
```

---

## Task 4: Backend Service — `getInstallmentDetail()` + `getExportData()`

**Files:**
- Modify: `app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php`

- [ ] **Step 1: Add both methods inside the class**

Add after `getTrend()`:

```php
    /**
     * All overdue installments for a single loan — used for the expandable row.
     * Returns only installments with a non-zero total shortfall.
     */
    public function getInstallmentDetail(int $loanId, string $asOfDate): array
    {
        $rows = DB::connection('tenant')
            ->table('loan_repayment_schedule as rs')
            ->where('rs.loan_id', $loanId)
            ->where('rs.status', '!=', 'paid')
            ->where('rs.due_date', '<=', $asOfDate)
            ->select([
                'rs.installment_no',
                'rs.due_date',
                DB::raw('GREATEST(0, rs.principal_due - rs.principal_paid) as principal_shortfall'),
                DB::raw('GREATEST(0, rs.interest_due  - rs.interest_paid)  as interest_shortfall'),
                DB::raw('GREATEST(0, rs.charges_due   - rs.charges_paid)   as charges_shortfall'),
                DB::raw('GREATEST(0, rs.penalty_due   - rs.penalty_paid)   as penalty_shortfall'),
                DB::raw('
                    GREATEST(0,
                        (rs.principal_due + rs.interest_due + rs.charges_due + rs.penalty_due)
                        - (rs.principal_paid + rs.interest_paid + rs.charges_paid + rs.penalty_paid)
                    ) as total_shortfall
                '),
            ])
            ->orderBy('rs.due_date')
            ->get();

        // Filter to only rows with actual shortfall
        return $rows
            ->filter(fn ($r) => (float) $r->total_shortfall > 0)
            ->map(fn ($r) => [
                'installment_no'       => $r->installment_no,
                'due_date'             => $r->due_date,
                'principal_shortfall'  => (float) $r->principal_shortfall,
                'interest_shortfall'   => (float) $r->interest_shortfall,
                'charges_shortfall'    => (float) $r->charges_shortfall,
                'penalty_shortfall'    => (float) $r->penalty_shortfall,
                'total_shortfall'      => (float) $r->total_shortfall,
            ])
            ->values()
            ->all();
    }

    /**
     * Full unpaginated loans list for Excel export.
     * Same query as getReport() without pagination.
     */
    public function getExportData(array $filters): array
    {
        $asOf  = $filters['as_of_date'] ?? now()->toDateString();
        $base  = $this->baseQuery($asOf, $filters);

        // Last payment subquery
        $rows = $base
            ->selectRaw('l.id                                                           as loan_id')
            ->selectRaw('l.loan_no')
            ->selectRaw('l.disbursed_at')
            ->selectRaw('m.id                                                           as member_id')
            ->selectRaw('m.name                                                         as member_name')
            ->selectRaw('m.member_number')
            ->selectRaw('COALESCE(m.phone, \'\')                                        as phone')
            ->selectRaw("COALESCE(b.name, 'Unassigned')                                as branch_name")
            ->selectRaw("COALESCE(s.name, '—')                                         as loan_officer_name")
            ->selectRaw("COALESCE(p.name, '')                                           as product_name")
            ->selectRaw('
                COALESCE(SUM(GREATEST(0,
                    (rs.principal_due + rs.interest_due + rs.charges_due + rs.penalty_due)
                    - (rs.principal_paid + rs.interest_paid + rs.charges_paid + rs.penalty_paid)
                )), 0) as total_arrears
            ')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.principal_due - rs.principal_paid)), 0) as principal_arrears')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.interest_due  - rs.interest_paid)),  0) as interest_arrears')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.charges_due   - rs.charges_paid)),   0) as charges_arrears')
            ->selectRaw('COALESCE(SUM(GREATEST(0, rs.penalty_due   - rs.penalty_paid)),   0) as penalty_arrears')
            ->selectRaw('COUNT(DISTINCT rs.id)                                          as missed_installments')
            ->selectRaw('MAX(DATEDIFF(?, rs.due_date))                                  as days_in_arrears', [$asOf])
            ->selectRaw('MAX(lt_last.payment_date)                                      as last_payment_date')
            ->groupBy(
                'l.id', 'l.loan_no', 'l.disbursed_at',
                'm.id', 'm.name', 'm.member_number', 'm.phone',
                'b.name', 's.name', 'p.name',
            )
            ->orderByDesc('days_in_arrears')
            ->get();

        return $rows->map(fn ($r) => [
            'loan_id'              => $r->loan_id,
            'loan_no'              => $r->loan_no,
            'member_name'          => $r->member_name,
            'member_number'        => $r->member_number,
            'phone'                => $r->phone,
            'branch_name'          => $r->branch_name,
            'loan_officer_name'    => $r->loan_officer_name,
            'product_name'         => $r->product_name,
            'total_arrears'        => (float) $r->total_arrears,
            'principal_arrears'    => (float) $r->principal_arrears,
            'interest_arrears'     => (float) $r->interest_arrears,
            'charges_arrears'      => (float) $r->charges_arrears,
            'penalty_arrears'      => (float) $r->penalty_arrears,
            'missed_installments'  => (int) $r->missed_installments,
            'days_in_arrears'      => (int) $r->days_in_arrears,
            'last_payment_date'    => $r->last_payment_date,
            'disbursed_at'         => $r->disbursed_at,
        ])->all();
    }
```

- [ ] **Step 2: Commit**

```bash
git add app/Tenant/Modules/Loans/Services/LoanArrearsReportService.php
git commit -m "feat: add getInstallmentDetail() and getExportData() to LoanArrearsReportService"
```

---

## Task 5: Export class + Routes + Controller

**Files:**
- Create: `app/Exports/LoanArrearsExport.php`
- Modify: `app/Tenant/Http/Controllers/Api/V1/ReportsController.php`
- Modify: `routes/tenant_api.php`

- [ ] **Step 1: Create `LoanArrearsExport.php`**

```php
<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LoanArrearsExport implements FromCollection, WithHeadings, WithStyles
{
    protected array $data;
    protected string $asOfDate;

    public function __construct(array $data, string $asOfDate)
    {
        $this->data      = $data;
        $this->asOfDate  = $asOfDate;
    }

    public function collection()
    {
        return collect($this->data)->map(fn ($r) => [
            $r['member_number'],
            $r['member_name'],
            $r['phone'],
            $r['loan_no'],
            $r['product_name'],
            $r['branch_name'],
            $r['loan_officer_name'],
            (float) $r['total_arrears'],
            (float) $r['principal_arrears'],
            (float) $r['interest_arrears'],
            (float) $r['charges_arrears'],
            (float) $r['penalty_arrears'],
            (int)   $r['missed_installments'],
            (int)   $r['days_in_arrears'],
            $r['last_payment_date'],
            $r['disbursed_at'],
        ]);
    }

    public function headings(): array
    {
        return [
            'Member Number',
            'Member Name',
            'Phone',
            'Loan Number',
            'Product',
            'Branch',
            'Loan Officer',
            'Total Arrears',
            'Principal Arrears',
            'Interest Arrears',
            'Charges Arrears',
            'Penalty Arrears',
            'Missed Installments',
            'Days in Arrears',
            'Last Payment Date',
            'Disbursed Date',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1        => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'FEE2E2']]],
            'A1:P1'  => ['alignment' => ['horizontal' => 'center']],
            'H1:L1'  => ['alignment' => ['horizontal' => 'right']],
        ];
    }
}
```

- [ ] **Step 2: Add the 5 new routes to `routes/tenant_api.php`**

Find the existing loan-balances routes block (around line 78–81) and add immediately after it:

```php
// ── Loan Arrears Report ─────────────────────────────────────────────────────
Route::get('reports/loan-arrears',                          [ReportsController::class, 'loanArrears']);
Route::get('reports/loan-arrears/comparison',               [ReportsController::class, 'loanArrearsComparison']);
Route::get('reports/loan-arrears/trend',                    [ReportsController::class, 'loanArrearsTrend']);
Route::get('reports/loan-arrears/export',                   [ReportsController::class, 'loanArrearsExport']);
Route::get('reports/loan-arrears/{loan}/installments',      [ReportsController::class, 'loanArrearsInstallments']);
```

> Static routes (`comparison`, `trend`, `export`) are registered before `{loan}` to prevent wildcard conflicts.

- [ ] **Step 3: Inject service and add 5 controller methods to `ReportsController.php`**

**3a — Add import at top of file (after existing imports):**
```php
use App\Exports\LoanArrearsExport;
use App\Tenant\Modules\Loans\Services\LoanArrearsReportService;
```

**3b — Add to constructor:**
```php
    public function __construct(
        protected LoanAgingReportServiceInterface $agingService,
        protected LoanBalancesReportService $balancesService,
        protected LoanArrearsReportService $arrearsService,
    ) {}
```

**3c — Add the 5 methods (add after `loanBalancesExport()`):**

```php
    public function loanArrears(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'as_of_date'      => ['required', 'date'],
            'branch_id'       => ['nullable', 'integer', 'exists:tenant.branches,id'],
            'loan_officer_id' => ['nullable', 'integer', 'exists:tenant.staff,id'],
            'per_page'        => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'            => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json($this->arrearsService->getReport($filters));
    }

    public function loanArrearsComparison(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'as_of_date'      => ['nullable', 'date'],
            'branch_id'       => ['nullable', 'integer', 'exists:tenant.branches,id'],
            'loan_officer_id' => ['nullable', 'integer', 'exists:tenant.staff,id'],
        ]);

        return response()->json($this->arrearsService->getComparison($filters));
    }

    public function loanArrearsTrend(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'as_of_date'      => ['nullable', 'date'],
            'branch_id'       => ['nullable', 'integer', 'exists:tenant.branches,id'],
            'loan_officer_id' => ['nullable', 'integer', 'exists:tenant.staff,id'],
            'months'          => ['nullable', 'integer', 'in:6,12'],
        ]);

        return response()->json($this->arrearsService->getTrend($filters));
    }

    public function loanArrearsInstallments(Request $request, int $loan): JsonResponse
    {
        $validated = $request->validate([
            'as_of_date' => ['required', 'date'],
        ]);

        return response()->json(
            $this->arrearsService->getInstallmentDetail($loan, $validated['as_of_date'])
        );
    }

    public function loanArrearsExport(Request $request)
    {
        $filters = $request->validate([
            'as_of_date'      => ['required', 'date'],
            'branch_id'       => ['nullable', 'integer', 'exists:tenant.branches,id'],
            'loan_officer_id' => ['nullable', 'integer', 'exists:tenant.staff,id'],
        ]);

        $data     = $this->arrearsService->getExportData($filters);
        $date     = $filters['as_of_date'];
        $filename = "loan-arrears-report-{$date}.xlsx";

        return Excel::download(new LoanArrearsExport($data, $date), $filename);
    }
```

- [ ] **Step 4: Verify routes are registered**

```bash
php artisan route:list --path=reports/loan-arrears
```

Expected: 5 rows — `GET reports/loan-arrears`, `GET reports/loan-arrears/comparison`, `GET reports/loan-arrears/trend`, `GET reports/loan-arrears/export`, `GET reports/loan-arrears/{loan}/installments`

- [ ] **Step 5: Commit**

```bash
git add app/Exports/LoanArrearsExport.php \
        app/Tenant/Http/Controllers/Api/V1/ReportsController.php \
        routes/tenant_api.php
git commit -m "feat: wire LoanArrearsReportService into controller and routes"
```

---

## Task 6: Frontend — API types and functions

**Files:**
- Modify: `src/tenant/apis/reports/reportsApi.ts`

- [ ] **Step 1: Add the arrears types and API functions to `reportsApi.ts`**

Add a new section at the bottom of the file, after the `reportsApi` object closing brace. First the interfaces, then extend the `reportsApi` object.

**Add interfaces before `reportsApi`:**

```typescript
// ─── Loan Arrears Report ──────────────────────────────────────────────────────

export interface ArrearsFilters {
  as_of_date?: string | null
  branch_id?: number | null
  loan_officer_id?: number | null
  per_page?: number
  page?: number
}

export interface ArrearsTrendFilters {
  as_of_date?: string | null
  branch_id?: number | null
  loan_officer_id?: number | null
  months?: 6 | 12
}

export interface ArrearsLoanRow {
  loan_id: number
  loan_no: string
  member_id: number
  member_name: string
  member_number: string
  phone: string
  branch_name: string
  loan_officer_name: string
  product_name: string
  total_arrears: number
  principal_arrears: number
  interest_arrears: number
  charges_arrears: number
  penalty_arrears: number
  missed_installments: number
  days_in_arrears: number
  last_payment_date: string | null
  disbursed_at: string | null
}

export interface ArrearsSnapshot {
  date: string
  loan_count: number
  total_arrears: number
  principal_arrears: number
}

export interface ArrearsComparisonResponse {
  today: ArrearsSnapshot
  one_month_ago: ArrearsSnapshot
  three_months_ago: ArrearsSnapshot
}

export interface ArrearsTrendPoint {
  month: string
  label: string
  month_end: string
  loan_count: number
  total_arrears: number
}

export interface ArrearsInstallmentRow {
  installment_no: number
  due_date: string
  principal_shortfall: number
  interest_shortfall: number
  charges_shortfall: number
  penalty_shortfall: number
  total_shortfall: number
}

export interface ArrearsReportResponse {
  loans: {
    data: ArrearsLoanRow[]
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

**Add to the `reportsApi` object (inside the object, after `loanBalancesExport`):**

```typescript
  // ─── Loan Arrears ───────────────────────────────────────────────────────────
  loanArrears(params?: ArrearsFilters) {
    return tenantClient.get<ArrearsReportResponse>('/reports/loan-arrears', { params })
  },

  loanArrearsComparison(params?: Omit<ArrearsFilters, 'per_page' | 'page'>) {
    return tenantClient.get<ArrearsComparisonResponse>('/reports/loan-arrears/comparison', { params })
  },

  loanArrearsTrend(params?: ArrearsTrendFilters) {
    return tenantClient.get<ArrearsTrendPoint[]>('/reports/loan-arrears/trend', { params })
  },

  loanArrearsInstallments(loanId: number, asOfDate: string) {
    return tenantClient.get<ArrearsInstallmentRow[]>(
      `/reports/loan-arrears/${loanId}/installments`,
      { params: { as_of_date: asOfDate } },
    )
  },

  loanArrearsExport(params?: Omit<ArrearsFilters, 'per_page' | 'page'>) {
    return tenantClient.get('/reports/loan-arrears/export', { params, responseType: 'blob' })
  },
```

- [ ] **Step 2: Type-check**

```bash
cd /path/to/mfuko-pro-frontend-2026
pnpm type-check
```
Expected: no errors in `reportsApi.ts`

- [ ] **Step 3: Commit**

```bash
git add src/tenant/apis/reports/reportsApi.ts
git commit -m "feat: add arrears report types and API functions to reportsApi.ts"
```

---

## Task 7: Frontend — `ArrearsReport.vue` scaffold, filter bar, comparison cards

**Files:**
- Replace: `src/tenant/modules/loans/pages/ArrearsReport.vue`

- [ ] **Step 1: Replace the placeholder with the full component scaffold, filter bar, and comparison cards**

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Calendar, Filter, Download, RotateCcw, ChevronDown, ChevronRight, ExternalLink } from 'lucide-vue-next'
import { Spinner, Pagination, formatMoneyValue } from '@/Global'
import { RouterLink } from 'vue-router'
import {
  reportsApi,
  type ArrearsFilters,
  type ArrearsTrendFilters,
  type ArrearsLoanRow,
  type ArrearsComparisonResponse,
  type ArrearsTrendPoint,
  type ArrearsInstallmentRow,
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

const today = new Date().toISOString().split('T')[0]

const filters = ref<ArrearsFilters & { months: 6 | 12 }>({
  as_of_date:      today,
  branch_id:       null,
  loan_officer_id: null,
  per_page:        25,
  page:            1,
  months:          12,
})

const showBranchFilter  = ref(false)
const branches          = ref<{ id: number; name: string }[]>([])
const officers          = ref<{ id: number; name: string }[]>([])

const loading             = ref(false)
const loadingInstallments = ref(false)
const exporting           = ref(false)
const error               = ref<string | null>(null)

const loans              = ref<ArrearsLoanRow[]>([])
const meta               = ref<Meta>({ current_page: 1, last_page: 1, per_page: 25, total: 0, from: 1, to: 0 })
const comparisonData     = ref<ArrearsComparisonResponse | null>(null)
const trendData          = ref<ArrearsTrendPoint[]>([])
const expandedLoanId     = ref<number | null>(null)
const installmentCache   = ref<Map<number, ArrearsInstallmentRow[]>>(new Map())
const expandError        = ref<string | null>(null)

// ─── Filter options ───────────────────────────────────────────────────────────

async function loadFilterOptions() {
  try {
    const res = await reportsApi.filterOptions()
    showBranchFilter.value = res.data.filters?.options?.show_branch_filter
      ?? res.data.show_branch_filter
      ?? false
    branches.value  = res.data.filters?.options?.branches ?? res.data.branches ?? []
    officers.value  = res.data.filters?.options?.staff    ?? res.data.staff    ?? []
  } catch {
    // filter options are non-critical — silently ignore
  }
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchAll() {
  loading.value = true
  error.value   = null
  try {
    const trendFilters: ArrearsTrendFilters = {
      as_of_date:      filters.value.as_of_date,
      branch_id:       filters.value.branch_id,
      loan_officer_id: filters.value.loan_officer_id,
      months:          filters.value.months,
    }

    const [loansRes, compRes, trendRes] = await Promise.all([
      reportsApi.loanArrears(filters.value),
      reportsApi.loanArrearsComparison(filters.value),
      reportsApi.loanArrearsTrend(trendFilters),
    ])

    loans.value          = loansRes.data.loans.data
    meta.value           = loansRes.data.loans.meta
    comparisonData.value = compRes.data
    trendData.value      = trendRes.data
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load arrears report.'
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  filters.value.page = 1
  installmentCache.value.clear()
  expandedLoanId.value = null
  await fetchAll()
}

function resetFilters() {
  filters.value = { as_of_date: today, branch_id: null, loan_officer_id: null, per_page: 25, page: 1, months: 12 }
  applyFilters()
}

async function onPageChange(p: number) {
  filters.value.page = p
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

  if (installmentCache.value.has(loanId)) return

  loadingInstallments.value = true
  try {
    const res = await reportsApi.loanArrearsInstallments(loanId, filters.value.as_of_date ?? today)
    installmentCache.value.set(loanId, res.data)
  } catch {
    expandError.value = 'Failed to load installment detail.'
  } finally {
    loadingInstallments.value = false
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

async function exportExcel() {
  exporting.value = true
  try {
    const res = await reportsApi.loanArrearsExport({
      as_of_date:      filters.value.as_of_date,
      branch_id:       filters.value.branch_id,
      loan_officer_id: filters.value.loan_officer_id,
    })
    const url  = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href  = url
    link.download = `loan-arrears-report-${filters.value.as_of_date}.xlsx`
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

function daysColor(days: number): string {
  if (days > 90)  return 'text-red-700 font-bold'
  if (days > 30)  return 'text-red-500 font-semibold'
  return 'text-orange-500 font-semibold'
}

function missedColor(count: number): string {
  return count >= 3
    ? 'bg-red-100 text-red-700'
    : 'bg-orange-100 text-orange-700'
}

function pctChange(historical: number, current: number): string {
  if (historical === 0) return '—'
  const pct = ((current - historical) / historical) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
}

function pctColor(historical: number, current: number): string {
  if (historical === 0) return 'text-neutral-400'
  return current > historical ? 'text-red-600' : 'text-green-600'
}

// ─── Trend chart ─────────────────────────────────────────────────────────────

const trendMax = computed(() =>
  Math.max(...trendData.value.map((p) => p.total_arrears), 1)
)

function barHeight(v: number): string {
  return Math.round((v / trendMax.value) * 80) + 'px'
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
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white">Loan Arrears Report</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Loans formally in arrears — overdue installments, contact info, and trend analysis
          <template v-if="filters.as_of_date"> as of <strong>{{ filters.as_of_date }}</strong></template>
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
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">As of Date</label>
          <input
            v-model="filters.as_of_date"
            type="date"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>

        <div v-if="showBranchFilter" class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Branch</label>
          <select
            v-model="filters.branch_id"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="null">All Branches</option>
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Loan Officer</label>
          <select
            v-model="filters.loan_officer_id"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="null">All Officers</option>
            <option v-for="o in officers" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Trend Period</label>
          <select
            v-model="filters.months"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option :value="12">Last 12 Months</option>
            <option :value="6">Last 6 Months</option>
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

    <!-- ── Error banner ─────────────────────────────────────────────────── -->
    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- ── Loading skeleton ─────────────────────────────────────────────── -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner class="h-8 w-8 text-blue-500" />
    </div>

    <template v-else>

      <!-- ── ① Comparison Cards ──────────────────────────────────────────── -->
      <div v-if="comparisonData" class="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <!-- Today -->
        <div class="rounded-xl border-2 border-red-400 bg-white p-5 dark:bg-neutral-800">
          <div class="mb-3 text-[10px] font-bold uppercase tracking-wider text-red-500">
            Today — {{ comparisonData.today.date }}
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Loans in Arrears</span>
              <span class="text-base font-bold text-neutral-900 dark:text-white">{{ comparisonData.today.loan_count }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Total Arrears</span>
              <span class="text-base font-bold text-red-600">{{ fmt(comparisonData.today.total_arrears) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Principal Arrears</span>
              <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{{ fmt(comparisonData.today.principal_arrears) }}</span>
            </div>
          </div>
        </div>

        <!-- 1 Month Ago -->
        <div class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
          <div class="mb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            1 Month Ago — {{ comparisonData.one_month_ago.date }}
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Loans in Arrears</span>
              <span class="text-base font-bold text-neutral-900 dark:text-white">{{ comparisonData.one_month_ago.loan_count }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Total Arrears</span>
              <span class="text-base font-bold text-orange-500">{{ fmt(comparisonData.one_month_ago.total_arrears) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Principal Arrears</span>
              <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{{ fmt(comparisonData.one_month_ago.principal_arrears) }}</span>
            </div>
          </div>
          <div class="mt-3 border-t border-neutral-100 pt-2 text-xs dark:border-neutral-700"
               :class="pctColor(comparisonData.one_month_ago.total_arrears, comparisonData.today.total_arrears)">
            {{ pctChange(comparisonData.one_month_ago.total_arrears, comparisonData.today.total_arrears) }} vs today
          </div>
        </div>

        <!-- 3 Months Ago -->
        <div class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
          <div class="mb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            3 Months Ago — {{ comparisonData.three_months_ago.date }}
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Loans in Arrears</span>
              <span class="text-base font-bold text-neutral-900 dark:text-white">{{ comparisonData.three_months_ago.loan_count }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Total Arrears</span>
              <span class="text-base font-bold text-orange-400">{{ fmt(comparisonData.three_months_ago.total_arrears) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-neutral-500">Principal Arrears</span>
              <span class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">{{ fmt(comparisonData.three_months_ago.principal_arrears) }}</span>
            </div>
          </div>
          <div class="mt-3 border-t border-neutral-100 pt-2 text-xs dark:border-neutral-700"
               :class="pctColor(comparisonData.three_months_ago.total_arrears, comparisonData.today.total_arrears)">
            {{ pctChange(comparisonData.three_months_ago.total_arrears, comparisonData.today.total_arrears) }} vs today
          </div>
        </div>
      </div>

      <!-- ── ② Trend Chart ───────────────────────────────────────────────── -->
      <div v-if="trendData.length" class="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800">
        <div class="mb-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          Monthly Arrears Trend
        </div>
        <div class="flex items-end gap-1.5 overflow-x-auto pb-2" style="min-height: 100px;">
          <div
            v-for="(point, idx) in trendData"
            :key="point.month"
            class="flex flex-1 min-w-[28px] flex-col items-center gap-1"
          >
            <span class="text-[9px] text-neutral-400">{{ fmt(point.total_arrears).replace(/,\d+$/, '') }}</span>
            <div
              class="w-full rounded-t transition-all"
              :class="idx === trendData.length - 1 ? 'bg-red-600 border-2 border-red-800' : 'bg-red-300 hover:bg-red-400'"
              :style="{ height: barHeight(point.total_arrears) }"
              :title="`${point.label}: ${fmt(point.total_arrears)} · ${point.loan_count} loans`"
            />
            <span class="text-[9px] text-neutral-400">{{ point.label.split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <!-- ── ③ Empty state ───────────────────────────────────────────────── -->
      <div
        v-if="!loading && loans.length === 0"
        class="rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center dark:border-green-800 dark:bg-green-950"
      >
        <p class="text-base font-semibold text-green-700 dark:text-green-300">No loans in arrears</p>
        <p class="mt-1 text-sm text-green-500">as of {{ filters.as_of_date }}</p>
      </div>

      <!-- ── ③ Loans Table ───────────────────────────────────────────────── -->
      <div v-if="loans.length > 0" class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div class="border-b border-neutral-100 px-5 py-3 dark:border-neutral-700">
          <span class="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Arrears Loans — {{ meta.total }} loan{{ meta.total !== 1 ? 's' : '' }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 dark:bg-neutral-700/40">
              <tr>
                <th class="w-8 px-3 py-3"></th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Member</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Phone</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Loan Officer</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Arrears Amt</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Missed</th>
                <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">Days</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Last Payment</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="loan in loans" :key="loan.loan_id">
                <!-- Main row -->
                <tr
                  class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/30"
                  :class="expandedLoanId === loan.loan_id ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''"
                  @click="toggleExpand(loan.loan_id)"
                >
                  <td class="px-3 py-3 text-neutral-400">
                    <ChevronDown v-if="expandedLoanId === loan.loan_id" class="h-4 w-4 text-yellow-600" />
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
                      {{ loan.loan_no }}
                      <ExternalLink class="h-3 w-3" />
                    </RouterLink>
                  </td>
                  <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">{{ loan.phone || '—' }}</td>
                  <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">{{ loan.loan_officer_name }}</td>
                  <td class="px-4 py-3 text-right font-bold text-red-600">{{ fmt(loan.total_arrears) }}</td>
                  <td class="px-4 py-3 text-center">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      :class="missedColor(loan.missed_installments)"
                    >{{ loan.missed_installments }}</span>
                  </td>
                  <td class="px-4 py-3 text-center" :class="daysColor(loan.days_in_arrears)">
                    {{ loan.days_in_arrears }}
                  </td>
                  <td class="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                    {{ loan.last_payment_date ?? '—' }}
                  </td>
                </tr>

                <!-- Expanded installment detail -->
                <tr v-if="expandedLoanId === loan.loan_id" class="border-b border-yellow-100 bg-yellow-50/60 dark:border-yellow-900/30 dark:bg-yellow-900/5">
                  <td colspan="9" class="px-8 pb-4 pt-2">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                      Overdue Installments
                    </div>

                    <div v-if="loadingInstallments && !installmentCache.has(loan.loan_id)" class="py-4 text-sm text-neutral-400">
                      <Spinner class="mr-2 inline h-4 w-4" /> Loading…
                    </div>

                    <div v-else-if="expandError" class="text-sm text-red-600">
                      {{ expandError }}
                      <button class="ml-2 underline" @click="toggleExpand(loan.loan_id)">Retry</button>
                    </div>

                    <table v-else class="w-auto text-xs">
                      <thead>
                        <tr class="bg-amber-100/60 dark:bg-amber-900/20">
                          <th class="px-3 py-1.5 text-left font-semibold text-amber-800">Inst. #</th>
                          <th class="px-3 py-1.5 text-left font-semibold text-amber-800">Due Date</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Principal Short.</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Interest Short.</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Charges Short.</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Penalty Short.</th>
                          <th class="px-3 py-1.5 text-right font-semibold text-amber-800">Total Short.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="inst in installmentCache.get(loan.loan_id) ?? []"
                          :key="inst.installment_no"
                          class="border-b border-amber-100 dark:border-amber-900/20"
                        >
                          <td class="px-3 py-1.5 text-neutral-600">#{{ inst.installment_no }}</td>
                          <td class="px-3 py-1.5 text-neutral-600">{{ inst.due_date }}</td>
                          <td class="px-3 py-1.5 text-right text-red-600">{{ fmt(inst.principal_shortfall) }}</td>
                          <td class="px-3 py-1.5 text-right text-red-600">{{ fmt(inst.interest_shortfall) }}</td>
                          <td class="px-3 py-1.5 text-right text-red-600">{{ fmt(inst.charges_shortfall) }}</td>
                          <td class="px-3 py-1.5 text-right text-red-600">{{ fmt(inst.penalty_shortfall) }}</td>
                          <td class="px-3 py-1.5 text-right font-bold text-red-700">{{ fmt(inst.total_shortfall) }}</td>
                        </tr>
                        <tr v-if="(installmentCache.get(loan.loan_id) ?? []).length === 0">
                          <td colspan="7" class="px-3 py-2 text-neutral-400 italic">No overdue installments found.</td>
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
pnpm type-check
```
Expected: no new errors

- [ ] **Step 3: Lint**

```bash
pnpm lint
```
Fix any lint issues before committing.

- [ ] **Step 4: Start dev server and verify the page loads**

```bash
pnpm dev
```

Navigate to `/tenant/arrears-report`. Expected:
- Page title "Loan Arrears Report" renders
- Filter bar visible
- Comparison cards appear with data (or zeros if no arrears)
- Trend chart bars render
- Loans table shows if arrears exist; green "No loans" message if not
- Clicking a loan row expands it and shows installment detail

- [ ] **Step 5: Commit**

```bash
cd /path/to/mfuko-pro-frontend-2026
git add src/tenant/modules/loans/pages/ArrearsReport.vue \
        src/tenant/apis/reports/reportsApi.ts
git commit -m "feat: implement Loan Arrears Report with comparison cards, trend chart, and expandable installment rows"
```

---

## Task 8: Commit and push both repos

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

After all tasks complete, verify in the browser:

- [ ] `/tenant/arrears-report` loads without console errors
- [ ] Comparison cards show Today / 1 Month Ago / 3 Months Ago with percentage change
- [ ] Trend chart bars render with correct heights; current month bar is darker
- [ ] Loans table shows only `status = 'arrears'` loans
- [ ] Clicking a row expands it; installment detail loads; clicking again collapses
- [ ] Expanding the same row twice uses the cache (no second network request)
- [ ] Export button downloads a valid `.xlsx` file with all columns
- [ ] Changing filters and pressing Apply refreshes all three sections
- [ ] Reset button restores defaults
- [ ] Branch filter hidden for branch-scoped users
- [ ] Empty state (green message) shows when no loans in arrears
- [ ] Page is readable in dark mode
