# Gap 2 — Stop the Lying Loan-Charge UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every trace of loan-charge configuration from the General Charges UI so it stops decoratively pretending to handle loan charges; route admins to the existing `tenant/settings/loan-charges` page instead.

**Architecture:** Backend drops the unused `loan_product_ids` column, hard-deletes decorative rows, and tightens validation so `application=on_loan_application` and `where_to_apply=loans` are rejected. Frontend removes the "Loan Products" multiselect, prunes dead option entries from constants, and adds a discoverability banner on the General Charges page pointing at the existing loan-charges admin route.

**Tech Stack:** Laravel 12 / PHP 8.2 / Pest 3 / MySQL on the backend; Vue 3 / TypeScript / Vite / Vitest on the frontend.

**Spec:** [`docs/superpowers/specs/2026-05-14-charge-system-gap2-loan-unification-design.md`](../specs/2026-05-14-charge-system-gap2-loan-unification-design.md)

---

## File Map

| Action | Repo | File |
|---|---|---|
| Create | backend | `database/migrations/tenant/2026_05_14_000001_drop_loan_product_ids_from_general_charges.php` |
| Modify | backend | `app/Tenant/Modules/Savings/Models/GeneralCharge.php` (lines 37, 48) |
| Modify | backend | `app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php` (lines 73, 108, 176, 188–189) |
| Modify | backend | `app/Tenant/Services/GeneralChargeService.php` (lines 25–26, 65–66) |
| Modify | backend | `app/Tenant/Services/GeneralChargeUpdateOrCreateService.php` (line 23) |
| Modify | backend | `database/factories/GeneralChargeFactory.php` |
| Create | backend | `tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php` |
| Modify | frontend | `src/tenant/modules/settings/constants.ts` (lines 38–48 + 50–54) |
| Modify | frontend | `src/tenant/modules/settings/general-charges/Create.vue` (lines ~143–157) |
| Modify | frontend | `src/tenant/modules/settings/general-charges/Index.vue` (lines 69, 81–113) |
| Modify | frontend | `src/tenant/modules/settings/composables/useGeneralCharges.ts` (lines 84–92, 95–96, 133, 215–216) |

**Working dirs**
- Backend: `/Users/asd/Mfuko_pro/mfuko-pro-backend-2026` — branch `feat/charge-system-gap2-loan-unification` (cut from main, no commits yet)
- Frontend: `/Users/asd/Mfuko_pro/mfuko-pro-frontend-2026` — branch `feat/charge-system-gap2-loan-unification` (already has spec commit `90bc53b`)

---

## Reference: Things explicitly NOT touched

To prevent collateral damage, treat the following as off-limits unless a task above directs otherwise:
- `app/Tenant/Modules/Loans/` (everything — including `LoanCharge`, `LoanAppliedCharge`, `LoanDisbursementService`, `LoanRepaymentService`, `LoanRescheduleService`, `LoanWriteOffService`)
- `app/Tenant/Http/Controllers/Api/V1/LoanChargeController.php`
- `routes/tenant_api.php` (lines 163–164: the `loan-charges` resource)
- `loan_charges` (definitions) and `loan_product_charge` (pivot) tables
- `src/tenant/modules/settings/loan-charges/Index.vue` and the `useLoanCharges` composable
- The savings-side machinery: `savings_product_charges`, `ChargeCalculatorService`, `ChargeJournalService`, `MemberCharge`

---

## Task 1: Backend — Drop column migration with hard-delete + Pest test

**Files:**
- Create: `database/migrations/tenant/2026_05_14_000001_drop_loan_product_ids_from_general_charges.php`
- Create: `tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php`

Working dir: `/Users/asd/Mfuko_pro/mfuko-pro-backend-2026`

- [ ] **Step 1: Write the failing Pest test for the migration**

Create `tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php`:

```php
<?php

use App\Tenant\Modules\Accounting\Models\ChartOfAccount;
use App\Tenant\Modules\Savings\Models\GeneralCharge;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

it('migration drops loan_product_ids column and hard-deletes decorative rows', function () {
    if (! Schema::connection('tenant')->hasColumn('general_charges', 'loan_product_ids')) {
        // Migration already ran (idempotent). Recreate the column so the test exercises the path.
        Schema::connection('tenant')->table('general_charges', function ($table) {
            $table->json('loan_product_ids')->nullable()->after('credit_account_id');
        });
        DB::connection('tenant')->table('migrations')
            ->where('migration', '2026_05_14_000001_drop_loan_product_ids_from_general_charges')
            ->delete();
    }

    $income = ChartOfAccount::create([
        'gl_code'         => '42999',
        'name'            => 'Test Charge Income',
        'account_type'    => 'INCOME',
        'account_subtype' => 'Fee Income',
        'normal_balance'  => 'CR',
        'level'           => 3,
        'is_control'      => false,
        'is_postable'     => true,
        'is_active'       => true,
    ]);

    // Decorative row 1: application=on_loan_application
    $loanAppRow = GeneralCharge::create([
        'name'              => 'Loan Decorative',
        'is_revenue'        => true,
        'application'       => 'on_loan_application',
        'where_to_apply'    => 'loans',
        'charge_type'       => 'amount',
        'amount'            => 100,
        'credit_account_id' => $income->id,
        'is_active'         => true,
        'is_reversible'     => true,
    ]);

    // Decorative row 2: non-empty loan_product_ids JSON, application=other
    DB::connection('tenant')->table('general_charges')->insert([
        'name'              => 'Decorative LPIDs',
        'is_revenue'        => true,
        'application'       => 'other',
        'where_to_apply'    => 'loans',
        'charge_type'       => 'amount',
        'amount'            => 200,
        'credit_account_id' => $income->id,
        'loan_product_ids'  => json_encode([1, 2]),
        'is_active'         => true,
        'is_reversible'     => true,
        'created_at'        => now(),
        'updated_at'        => now(),
    ]);

    // Survivor row: a normal savings-event charge
    $survivor = GeneralCharge::create([
        'name'              => 'Survivor Savings',
        'is_revenue'        => true,
        'application'       => 'other',
        'where_to_apply'    => 'savings',
        'charge_type'       => 'amount',
        'amount'            => 50,
        'credit_account_id' => $income->id,
        'is_active'         => true,
        'is_reversible'     => true,
    ]);

    $this->artisan('migrate', [
        '--database' => 'tenant',
        '--path'     => 'database/migrations/tenant/2026_05_14_000001_drop_loan_product_ids_from_general_charges.php',
        '--force'    => true,
    ])->assertExitCode(0);

    expect(Schema::connection('tenant')->hasColumn('general_charges', 'loan_product_ids'))->toBeFalse();
    expect(GeneralCharge::find($loanAppRow->id))->toBeNull();
    expect(GeneralCharge::query()->where('name', 'Decorative LPIDs')->exists())->toBeFalse();
    expect(GeneralCharge::find($survivor->id))->not->toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails (migration file does not exist yet)**

```bash
cd /Users/asd/Mfuko_pro/mfuko-pro-backend-2026
php artisan test --filter='migration drops loan_product_ids column and hard-deletes decorative rows'
```

Expected: FAIL with a "No such file or directory" or "Migration class not found" error referencing the missing migration path.

- [ ] **Step 3: Create the migration**

Create `database/migrations/tenant/2026_05_14_000001_drop_loan_product_ids_from_general_charges.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Stop the lying loan-charge UI in General Charges (Gap 2).
 *
 * The general_charges table grew a loan_product_ids JSON column and an
 * `application='on_loan_application'` enum value as a half-built unification
 * with loan_charges that never landed. No loan service ever reads either
 * field — LoanDisbursementService / LoanRepaymentService / LoanRescheduleService
 * / LoanWriteOffService all consult the loan_charges definitions table directly.
 * So today any row with application=on_loan_application or non-empty
 * loan_product_ids is decorative and triggers nothing.
 *
 * This migration:
 *   1. Hard-deletes any decorative row (application=on_loan_application OR
 *      JSON_LENGTH(loan_product_ids) > 0). Output reports the deleted count.
 *   2. Drops the loan_product_ids column.
 *
 * `down()` recreates the column nullable but does NOT restore deleted rows.
 * That's intentional: the data never affected accounting behaviour, so a
 * rollback gives you a column without data on purpose.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('tenant')->hasColumn('general_charges', 'loan_product_ids')) {
            return;
        }

        $deletedCount = DB::connection('tenant')->table('general_charges')
            ->where(function ($q) {
                $q->where('application', 'on_loan_application')
                  ->orWhereRaw('JSON_LENGTH(loan_product_ids) > 0');
            })
            ->delete();

        if ($deletedCount > 0) {
            // Surfaces in artisan migrate output so we can confirm on rolling deploy.
            echo "  Deleted {$deletedCount} decorative general_charges rows.\n";
        }

        Schema::connection('tenant')->table('general_charges', function (Blueprint $table) {
            $table->dropColumn('loan_product_ids');
        });
    }

    public function down(): void
    {
        if (! Schema::connection('tenant')->hasColumn('general_charges', 'loan_product_ids')) {
            Schema::connection('tenant')->table('general_charges', function (Blueprint $table) {
                $table->json('loan_product_ids')->nullable()->after('credit_account_id');
            });
        }
    }
};
```

- [ ] **Step 4: Run the test, verify it passes**

```bash
php artisan test --filter='migration drops loan_product_ids column and hard-deletes decorative rows'
```

Expected: PASS (1 passed, 5 assertions).

- [ ] **Step 5: Commit**

```bash
git add database/migrations/tenant/2026_05_14_000001_drop_loan_product_ids_from_general_charges.php \
        tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php
git commit -m "feat: migrate away from general_charges loan_product_ids + on_loan_application rows"
```

---

## Task 2: Backend — Strip `loan_product_ids` from the model

**Files:**
- Modify: `app/Tenant/Modules/Savings/Models/GeneralCharge.php` (lines 37, 48)

- [ ] **Step 1: Update the model**

Open `app/Tenant/Modules/Savings/Models/GeneralCharge.php`. In the `$fillable` array (currently has `'loan_product_ids'` at line 37), remove that line. In the `$casts` array (currently has `'loan_product_ids' => 'array'` at line 48), remove that line.

The final `$fillable` should be:

```php
protected $fillable = [
    'name',
    'is_revenue',
    'application',
    'where_to_apply',
    'is_fine',
    'charge_type',
    'amount',
    'interval_type',
    'interval',
    'credit_account_id',
    'is_reversible',
    'is_active',
    'branch_id',
];
```

The final `$casts` should be:

```php
protected $casts = [
    'is_revenue'    => 'boolean',
    'is_fine'       => 'boolean',
    'is_reversible' => 'boolean',
    'amount'        => 'decimal:2',
    'is_active'     => 'boolean',
    'branch_id'     => 'integer',
];
```

- [ ] **Step 2: Type-check by running the existing charge suite**

```bash
php artisan test --filter='Charge'
```

Expected: every charge-related test still passes. No new failures.

- [ ] **Step 3: Commit**

```bash
git add app/Tenant/Modules/Savings/Models/GeneralCharge.php
git commit -m "refactor: drop loan_product_ids from GeneralCharge model"
```

---

## Task 3: Backend — Tighten validation and prune controller payload

**Files:**
- Modify: `app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php` (lines 73, 108, 176, 188–189)
- Modify: `tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php`

- [ ] **Step 1: Write the failing validation test**

Append two new tests to `tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php`:

```php
use App\Models\Staff;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->staff = Staff::create([
        'name'            => 'Tenant Admin',
        'email'           => 'admin@gap2-test.com',
        'password'        => Hash::make('password'),
        'role'            => 'Admin',
        'is_tenant_admin' => true,
    ]);

    $this->income = ChartOfAccount::query()->where('gl_code', '42999')->first() ?? ChartOfAccount::create([
        'gl_code'         => '42999',
        'name'            => 'Test Charge Income',
        'account_type'    => 'INCOME',
        'account_subtype' => 'Fee Income',
        'normal_balance'  => 'CR',
        'level'           => 3,
        'is_control'      => false,
        'is_postable'     => true,
        'is_active'       => true,
    ]);
});

it('rejects application=on_loan_application at validation', function () {
    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/general-charges', [
            'name'              => 'Bad Loan Charge',
            'is_revenue'        => 'yes',
            'application'       => 'on_loan_application',
            'charge_type'       => 'amount',
            'amount'            => 100,
            'credit_account_id' => $this->income->id,
        ]);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('application');
});

it('rejects where_to_apply=loans at validation', function () {
    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/general-charges', [
            'name'              => 'Bad Loan Where',
            'is_revenue'        => 'yes',
            'application'       => 'other',
            'where_to_apply'    => 'loans',
            'charge_type'       => 'amount',
            'amount'            => 100,
            'credit_account_id' => $this->income->id,
        ]);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('where_to_apply');
});
```

- [ ] **Step 2: Run the new tests, verify they fail**

```bash
php artisan test --filter='rejects application=on_loan_application at validation|rejects where_to_apply=loans at validation'
```

Expected: 2 failed (both return 200/201 instead of 422, because the current validation still accepts these values).

- [ ] **Step 3: Tighten the controller**

In `app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php`:

(a) Inside the `store()` method, find the create-payload array and **remove** line 73 (`'loan_product_ids' => $validated['loan_product_ids'] ?? [],`).

(b) Inside the `update()` method, find the update-payload array and **remove** line 108 (`'loan_product_ids' => $validated['loan_product_ids'] ?? [],`).

(c) Inside the `validateChargePayload()` method, change line 176 from:

```php
'application' => ['required', 'in:on_shares,on_registration,on_loan_application,other'],
```

to:

```php
'application' => ['required', 'in:on_shares,on_registration,other'],
```

(d) Change line 177 (the `where_to_apply` rule) from:

```php
'where_to_apply' => ['nullable', 'in:loans,savings,shares'],
```

to:

```php
'where_to_apply' => ['nullable', 'in:savings,shares'],
```

(e) **Remove** the two `loan_product_ids` validation rules (lines 188 and 189):

```php
            'loan_product_ids' => ['nullable', 'array'],
            'loan_product_ids.*' => ['integer'],
```

- [ ] **Step 4: Run the new tests + the wider charge suite**

```bash
php artisan test --filter='Charge'
```

Expected: ALL charge tests pass, including the 2 new validation tests.

- [ ] **Step 5: Commit**

```bash
git add app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php \
        tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php
git commit -m "feat: reject on_loan_application and loans where-to-apply at validation"
```

---

## Task 4: Backend — Prune listing/detail queries (drop loan_products JSON_CONTAINS join)

**Files:**
- Modify: `app/Tenant/Services/GeneralChargeService.php` (lines 25–26, 65–66)

- [ ] **Step 1: Write the failing listing test**

Append to `tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php`:

```php
it('listing endpoint returns no loan_product_ids key and only-savings products string', function () {
    // Survivor row from the migration test scenario
    $charge = GeneralCharge::create([
        'name'              => 'Survivor Two',
        'is_revenue'        => true,
        'application'       => 'other',
        'where_to_apply'    => 'savings',
        'charge_type'       => 'amount',
        'amount'            => 50,
        'credit_account_id' => $this->income->id,
        'is_active'         => true,
        'is_reversible'     => true,
    ]);

    $response = $this->actingAs($this->staff, 'tenant')
        ->getJson('/api/v1/tenant/general-charges');

    $response->assertOk();
    $row = collect($response->json('data'))->firstWhere('id', $charge->id);

    expect($row)->not->toBeNull();
    expect($row)->not->toHaveKey('loan_product_ids');
});
```

- [ ] **Step 2: Run the listing test, verify it passes already**

```bash
php artisan test --filter='listing endpoint returns no loan_product_ids'
```

Expected: PASS — the model already drops the key (Task 2). This test locks the contract.

- [ ] **Step 3: Prune the JSON_CONTAINS join from the listing service**

In `app/Tenant/Services/GeneralChargeService.php`, the `generalChargeList()` method currently has (around lines 22–35):

```php
$query = DB::table('general_charges as gc')
    ->leftJoin('savings_product_charges AS spc', 'spc.general_charge_id', '=', 'gc.id')
    ->leftJoin('savings_products AS sp', 'sp.id', '=', 'spc.savings_product_id')
    ->leftJoin('loan_products AS lp', function ($join) {
        $join->whereRaw('JSON_CONTAINS(gc.loan_product_ids, CAST(lp.id AS JSON))');
    })
    ->select([
        ...$this->savingsAccountDbFields,
        DB::raw("CONCAT_WS(', ', NULLIF(GROUP_CONCAT(DISTINCT sp.name SEPARATOR ', '), ''), NULLIF(GROUP_CONCAT(DISTINCT lp.name SEPARATOR ', '), '')) as products"),
        'gc.charge_type as charge_type',
        'gc.is_reversible as Reversible',
        'gc.interval_type as interval_type',
        'gc.is_active as is_active',
    ]);
```

Replace with:

```php
$query = DB::table('general_charges as gc')
    ->leftJoin('savings_product_charges AS spc', 'spc.general_charge_id', '=', 'gc.id')
    ->leftJoin('savings_products AS sp', 'sp.id', '=', 'spc.savings_product_id')
    ->select([
        ...$this->savingsAccountDbFields,
        DB::raw("GROUP_CONCAT(DISTINCT sp.name SEPARATOR ', ') as products"),
        'gc.charge_type as charge_type',
        'gc.is_reversible as Reversible',
        'gc.interval_type as interval_type',
        'gc.is_active as is_active',
    ]);
```

Also find the dynamic-search field list a few lines below and remove `'lp.name'` from it.

The `generalChargeDetail()` method (around lines 60–75) has the same shape. Apply the identical change there: drop the `lp` leftJoin and simplify the `products` CONCAT to a single `GROUP_CONCAT(DISTINCT sp.name SEPARATOR ', ')`. Remove `'lp.name'` from its search field list too.

- [ ] **Step 4: Re-run charge tests**

```bash
php artisan test --filter='Charge'
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add app/Tenant/Services/GeneralChargeService.php \
        tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php
git commit -m "refactor: drop loan_products JSON_CONTAINS join from charges listing"
```

---

## Task 5: Backend — Prune legacy upsert helper + factory

**Files:**
- Modify: `app/Tenant/Services/GeneralChargeUpdateOrCreateService.php` (line 23)
- Modify: `database/factories/GeneralChargeFactory.php`

- [ ] **Step 1: Remove the loan_product_ids line from the upsert helper**

In `app/Tenant/Services/GeneralChargeUpdateOrCreateService.php`, find the `generalChargesUOrCFields()` array (around line 23) and **remove** the line:

```php
            'loan_product_ids' => normalizeIds($req['loan_product_ids'] ?? null),
```

- [ ] **Step 2: Remove the field from the factory**

In `database/factories/GeneralChargeFactory.php`, find the `'loan_product_ids' => null,` line in the `definition()` array and **remove** it. (The factory currently uses `'application' => 'other'` by default, so no enum change is needed.)

- [ ] **Step 3: Run the wider charge suite**

```bash
php artisan test --filter='Charge'
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add app/Tenant/Services/GeneralChargeUpdateOrCreateService.php \
        database/factories/GeneralChargeFactory.php
git commit -m "chore: remove loan_product_ids from upsert helper + factory"
```

---

## Task 6: Backend — Loan-suite regression sweep + push

No code changes here — just verify the loan-side paths were not collaterally affected, then push the backend branch.

- [ ] **Step 1: Run the loan-charge regression suites**

```bash
php artisan test --filter='LoanDisbursementGlTest|LoanRepaymentReversalTest|LoanRescheduleAccountingTest|LoanWriteOffGlTest'
```

Expected: 0 failures across all four suites.

- [ ] **Step 2: Run the full charge + savings + accounting + member regression sweep**

```bash
php artisan test --filter='Charge|Savings|Accounting|Member'
```

Expected: all green.

- [ ] **Step 3: Push the backend branch**

```bash
git push -u origin feat/charge-system-gap2-loan-unification
```

Expected: branch published, GitHub returns a PR-creation link.

No commit (only a push).

---

## Task 7: Frontend — Prune constants

**Files:**
- Modify: `src/tenant/modules/settings/constants.ts` (lines 38–48 and 50–54)

Working dir: `/Users/asd/Mfuko_pro/mfuko-pro-frontend-2026`

- [ ] **Step 1: Edit the two arrays**

Open `src/tenant/modules/settings/constants.ts`. In `APPLICATION_OPTIONS` (around line 38), **remove** the entry:

```ts
  { id: 'on_loan_application', name: 'On Loan Application' },
```

In `WHERE_TO_APPLY_OPTIONS` (around line 50), **remove** the entry:

```ts
  { id: 'loans', name: 'Loans' },
```

The final arrays should be:

```ts
export const APPLICATION_OPTIONS = [
  { id: 'on_shares', name: 'On Shares' },
  { id: 'on_registration', name: 'On Registration' },
  { id: 'other', name: 'Other' },
]

export const CHARGE_TYPE_OPTIONS = [
  { id: 'percentage', name: 'Percentage' },
  { id: 'amount', name: 'Amount' },
]

export const WHERE_TO_APPLY_OPTIONS = [
  { id: 'savings', name: 'Saving products' },
  { id: 'shares', name: 'Shares' },
]
```

- [ ] **Step 2: Type-check**

```bash
yarn type-check 2>&1 | grep -i "settings/constants" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/settings/constants.ts
git commit -m "refactor: drop on_loan_application and loans options from charge constants"
```

---

## Task 8: Frontend — Remove the "Loan Products" field from the Create form

**Files:**
- Modify: `src/tenant/modules/settings/general-charges/Create.vue` (lines ~143–157)

- [ ] **Step 1: Delete the field declaration**

Open `src/tenant/modules/settings/general-charges/Create.vue`. Find the `Loan Products` field entry inside the `fields` array (it currently starts at line 143 with `label: 'Loan Products'` and ends at line 157 with the closing `}`). **Remove** the entire entry, including the trailing comma:

```ts
  {
    label: 'Loan Products',
    name: 'loan_product_ids',
    type: 'multi-select',
    dependsOn: {
      conditions: [
        { field: 'application', value: 'on_loan_application' },
        { field: 'where_to_apply', value: 'loans' },
      ],
      operator: 'or',
    },
    url: 'global/loan-products',
    dataOnMount: true,
    placeholder: 'Choose loan products',
  },
```

Leave the surrounding entries (`Apply on` above it, `Charge Type` below it) intact.

- [ ] **Step 2: Type-check**

```bash
yarn type-check 2>&1 | grep -i "general-charges/Create" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/settings/general-charges/Create.vue
git commit -m "refactor: drop Loan Products multiselect from General Charges form"
```

---

## Task 9: Frontend — Prune useGeneralCharges composable

**Files:**
- Modify: `src/tenant/modules/settings/composables/useGeneralCharges.ts` (lines 84–92, 95–96, 133, 215–216)

- [ ] **Step 1: Remove the loan-product ref and fetch**

Open `src/tenant/modules/settings/composables/useGeneralCharges.ts`.

(a) Find the `applicationLabel(app: string)` function (around line 84). Inside its map, **remove** the line:

```ts
      on_loan_application: 'On Loan Application',
```

(b) Find the `loanProductOptions` ref declaration (around line 96):

```ts
const loanProductOptions = ref<{ id: string | number; name: string }[]>([])
```

**Remove** that line.

(c) Find the `fetchOptions()` function (around line 99) and remove the entire block that fetches loan products and assigns `loanProductOptions.value` (around line 133). The block typically reads:

```ts
      const lp = res.data?.data ?? res.data ?? []
      loanProductOptions.value = Array.isArray(lp)
        ? lp.map((p: any) => ({ id: p.id, name: p.name ?? `Product ${p.id}` }))
        : []
```

Plus any preceding `fetch` or `await` for the loan-products endpoint. Adjust the surrounding `try` / `await Promise.all([...])` shape so no dangling loose ends remain — if `fetchOptions()` was loading two endpoints in parallel and one is now gone, the function collapses to a single-endpoint fetch.

(d) Find the return statement (around line 215–216):

```ts
    fetch, toggleActive, toggleReversible, remove, applicationLabel,
    savingProductOptions, loanProductOptions, creditAccountOptions, fetchOptions,
```

**Remove** `loanProductOptions` from the second line. The final return becomes:

```ts
    fetch, toggleActive, toggleReversible, remove, applicationLabel,
    savingProductOptions, creditAccountOptions, fetchOptions,
```

- [ ] **Step 2: Type-check (this is the main correctness check)**

```bash
yarn type-check 2>&1 | grep -i "useGeneralCharges\|general-charges/Index" || echo "OK"
```

Expected: `OK`. If the type-check flags `Index.vue` it's because `Index.vue` still destructures `loanProductOptions` — that's fixed in Task 10.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/settings/composables/useGeneralCharges.ts
git commit -m "refactor: drop loanProductOptions from useGeneralCharges composable"
```

---

## Task 10: Frontend — Update Index.vue (destructure, resolveAllProducts, add banner)

**Files:**
- Modify: `src/tenant/modules/settings/general-charges/Index.vue` (lines 69, 81–113)

- [ ] **Step 1: Update the composable destructure**

In `src/tenant/modules/settings/general-charges/Index.vue` at line 69, change:

```ts
const { toggleActive, applicationLabel, savingProductOptions, loanProductOptions, fetchOptions } = useGeneralCharges()
```

to:

```ts
const { toggleActive, applicationLabel, savingProductOptions, fetchOptions } = useGeneralCharges()
```

- [ ] **Step 2: Strip the loan branch from `resolveAllProducts(item)`**

The function (around lines 81–113) currently has two passes. The second pass iterates `idKeys = ['saving_product_ids', 'loan_product_ids', 'saving_product_id', 'loan_product_id']` and looks up names in `savingProductOptions` AND `loanProductOptions`.

Replace the function body with:

```ts
function resolveAllProducts(item: any) {
  const products: string[] = []

  // 1. Try direct names returned by the API.
  const keys = ['products', 'saving_products', 'applicable_products']
  keys.forEach((k) => {
    const val = item[k]
    if (Array.isArray(val)) {
      val.forEach((v) => {
        const name = typeof v === 'object' ? v.name || v.label || v.product_name : v
        if (name) products.push(String(name))
      })
    } else if (val) {
      const name = typeof val === 'object' ? val.name || val.label : val
      if (name) products.push(String(name))
    }
  })

  if (products.length) return [...new Set(products)]

  // 2. Fallback: resolve names from savings product IDs only.
  const idKeys = ['saving_product_ids', 'saving_product_id']
  idKeys.forEach((k) => {
    const val = item[k]
    const ids = Array.isArray(val) ? val : val ? String(val).split(',') : []
    ids.forEach((id) => {
      const cleanId = String(id).trim()
      if (!cleanId) return
      const option = savingProductOptions.value.find((o) => String(o.id) === cleanId)
      products.push(option ? option.name : `ID: ${cleanId}`)
    })
  })

  return [...new Set(products)]
}
```

- [ ] **Step 3: Add the discoverability banner**

Find the header-action template slot in the `<TableDrawer>` (it currently wraps `<PainPageHeader>`). Modify it to render the page header AND a banner row immediately after. Replace the `#header-action` block with:

```vue
        <template #header-action>
            <div class="flex flex-col gap-3">
                <PainPageHeader title="General charges list" dec="Manage SACCO general charges" />
                <router-link
                    :to="{ name: 'tenant-settings-loan-charges' }"
                    class="inline-flex items-center gap-2 self-start rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                >
                    <span>Managing loan charges? Go to the Loan Charges page →</span>
                </router-link>
            </div>
        </template>
```

The `router-link` is imported via the Vue Router auto-resolve (no new import needed — it's a global component in this project). If a lint error complains, add `import { RouterLink } from 'vue-router'` to the script setup block and reference `<RouterLink>` instead.

- [ ] **Step 4: Type-check**

```bash
yarn type-check 2>&1 | grep -i "general-charges/Index" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 5: Commit**

```bash
git add src/tenant/modules/settings/general-charges/Index.vue
git commit -m "feat: prune loan products from list + add discoverability banner"
```

---

## Task 11: Frontend — Vitest assertions for the cleanup

**Files:**
- Create: `src/tenant/modules/settings/general-charges/__tests__/Index.banner.spec.ts`
- Create: `src/tenant/modules/settings/__tests__/constants.spec.ts`

- [ ] **Step 1: Write the constants tests**

Create `src/tenant/modules/settings/__tests__/constants.spec.ts`:

```ts
/* @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { APPLICATION_OPTIONS, WHERE_TO_APPLY_OPTIONS } from '../constants'

describe('charge option constants', () => {
  it('APPLICATION_OPTIONS no longer contains on_loan_application', () => {
    const ids = APPLICATION_OPTIONS.map((o) => o.id)
    expect(ids).not.toContain('on_loan_application')
  })

  it('APPLICATION_OPTIONS keeps on_shares, on_registration, other', () => {
    const ids = APPLICATION_OPTIONS.map((o) => o.id)
    expect(ids).toEqual(expect.arrayContaining(['on_shares', 'on_registration', 'other']))
  })

  it('WHERE_TO_APPLY_OPTIONS no longer contains loans', () => {
    const ids = WHERE_TO_APPLY_OPTIONS.map((o) => o.id)
    expect(ids).not.toContain('loans')
  })

  it('WHERE_TO_APPLY_OPTIONS keeps savings and shares', () => {
    const ids = WHERE_TO_APPLY_OPTIONS.map((o) => o.id)
    expect(ids).toEqual(expect.arrayContaining(['savings', 'shares']))
  })
})
```

- [ ] **Step 2: Write the banner test**

Create `src/tenant/modules/settings/general-charges/__tests__/Index.banner.spec.ts`:

```ts
/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

// Stub the heavy children — we only assert the banner here.
vi.mock('@/Global', () => ({
  TableDrawer: {
    name: 'TableDrawerStub',
    template: '<div><slot name="header-action" /></div>',
  },
  PainPageHeader: { name: 'PainPageHeaderStub', template: '<div />' },
  formatMoneyValue: (v: number) => String(v),
}))
vi.mock('@/Global/ToggleSwitch.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../composables/useGeneralCharges', () => ({
  useGeneralCharges: () => ({
    toggleActive: vi.fn(),
    applicationLabel: (a: string) => a,
    savingProductOptions: { value: [] },
    fetchOptions: vi.fn(),
  }),
}))
vi.mock('.', () => ({ Create: { template: '<div />' }, Details: { template: '<div />' } }))

import Index from '../Index.vue'

describe('General Charges Index — discoverability banner', () => {
  it('renders a router-link to the loan-charges route', () => {
    const wrapper = mount(Index, {
      global: {
        stubs: { RouterLink: RouterLinkStub },
      },
    })

    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toEqual({ name: 'tenant-settings-loan-charges' })
    expect(wrapper.text()).toContain('Loan Charges')
  })
})
```

- [ ] **Step 3: Run the two new specs**

```bash
yarn test:unit src/tenant/modules/settings/__tests__/constants.spec.ts \
               src/tenant/modules/settings/general-charges/__tests__/Index.banner.spec.ts
```

Expected: 5 tests pass (4 constants + 1 banner).

- [ ] **Step 4: Commit**

```bash
git add src/tenant/modules/settings/__tests__/constants.spec.ts \
        src/tenant/modules/settings/general-charges/__tests__/Index.banner.spec.ts
git commit -m "test: lock in constants + banner contract for Gap 2 cleanup"
```

---

## Task 12: Frontend — Push the branch

No code changes.

- [ ] **Step 1: Push**

```bash
git push origin feat/charge-system-gap2-loan-unification
```

(The branch is already tracking origin from the spec commit.) Expected: GitHub returns the PR-update URL.

- [ ] **Step 2: Smoke-test manually (post-push, pre-merge)**

In the running dev environment:

1. Open `tenant/settings/general-charges`. Confirm the banner row "Managing loan charges? Go to the Loan Charges page →" is visible directly under the page header.
2. Click the banner. Confirm it navigates to `tenant/settings/loan-charges` and the existing list of loan-charge definitions renders correctly.
3. Open the "+ Add Charge" drawer on the General Charges page. Confirm:
   - The `Application` dropdown does **not** include "On Loan Application".
   - When `Application = Other`, the `Where to Apply` dropdown does **not** include "Loans".
   - No "Loan Products" field appears for any combination of `Application` and `Where to Apply`.
4. Disburse a real loan that has at least one `loan_charges` row configured (created via the existing loan-charges UI). Confirm the JE posts the processing-fee / disbursement-fee correctly. This is the regression sanity for the loan path.

No commit (manual checks only).

---

## Self-review notes

1. **Spec coverage**

   | Spec requirement | Implementing task |
   |---|---|
   | Drop `loan_product_ids` column + hard-delete decorative rows | Task 1 |
   | Remove `loan_product_ids` from model fillable/casts | Task 2 |
   | Remove `on_loan_application` and `where_to_apply=loans` from validation | Task 3 |
   | Remove `loan_product_ids` from controller create/update payloads | Task 3 |
   | Drop `JSON_CONTAINS(loan_product_ids …)` join from listing/detail | Task 4 |
   | Remove `lp.name` from search field list | Task 4 |
   | Prune legacy upsert helper | Task 5 |
   | Prune factory | Task 5 |
   | Pest test: rejects `application=on_loan_application` | Task 3 |
   | Pest test: rejects `where_to_apply=loans` | Task 3 |
   | Pest test: listing works after column drop, no `loan_product_ids` key | Task 4 |
   | Pest test: migration cleanup hard-deletes decorative rows, keeps survivors | Task 1 |
   | Loan-suite regression sweep | Task 6 |
   | Remove `on_loan_application` from `APPLICATION_OPTIONS` | Task 7 |
   | Remove `loans` from `WHERE_TO_APPLY_OPTIONS` | Task 7 |
   | Remove "Loan Products" field from `Create.vue` | Task 8 |
   | Strip `loanProductOptions` from composable | Task 9 |
   | Strip `on_loan_application` from `applicationLabel` | Task 9 |
   | Strip loan branch from `resolveAllProducts` | Task 10 |
   | Strip `loanProductOptions` destructure from `Index.vue` | Task 10 |
   | Add discoverability banner pointing at `tenant-settings-loan-charges` | Task 10 |
   | Vitest: `APPLICATION_OPTIONS` no longer contains `on_loan_application` | Task 11 |
   | Vitest: `WHERE_TO_APPLY_OPTIONS` no longer contains `loans` | Task 11 |
   | Vitest: Index.vue renders the banner with correct route name | Task 11 |
   | Manual smoke: banner, drawer fields, loan disbursement regression | Task 12 |

   No gaps.

2. **Placeholder scan:** No `TBD`, no `TODO`, no "add error handling" hand-waving, no "similar to Task N". Every step has the exact text it needs.

3. **Type consistency:** Route name is consistently `tenant-settings-loan-charges` across spec, plan, banner code (Task 10), and Vitest assertion (Task 11). Field name is consistently `loan_product_ids`. The composable function name `applicationLabel` is referenced verbatim. The migration filename `2026_05_14_000001_drop_loan_product_ids_from_general_charges.php` is identical in Task 1 step 3 (file creation), Task 1 step 4 (run path), and the spec.
