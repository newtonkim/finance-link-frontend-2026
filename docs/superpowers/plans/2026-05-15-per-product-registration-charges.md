# Per-product Registration Charges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins attach `on_registration` charges to specific savings products; deduct those charges from the member's initial deposit at registration (rejecting if insufficient); surface the upcoming deductions in the Create A Sacco Member drawer.

**Architecture:** Reuse the canonical `savings_product_charges` pivot from Gap 4 with a new `'registration'` value in its `type` enum — same cross-product upsert pattern (`syncSavingsPivot`) writes the rows, just with trigger_types forced to `['registration']` when the application is on_registration. A new `ChargeCalculatorService::resolveForRegistration` returns the list of matching charges for a product. `MemberController::register()` resolves the list, validates sufficiency, posts a withdrawal-style transaction per matched charge inside the existing `DB::transaction`. Universal `on_registration` charges (no pivot rows) keep their current `MemberCharge`-receivable behavior; `applyRegistrationCharges` filters them so a charge is never both universal and product-scoped.

**Tech Stack:** Laravel 12 / PHP 8.2 / Pest 3 / MySQL on the backend; Vue 3 / TypeScript / Vite / Vitest on the frontend.

**Spec:** [`docs/superpowers/specs/2026-05-15-per-product-registration-charges-design.md`](../specs/2026-05-15-per-product-registration-charges-design.md)

---

## File Map

| Action | Repo | File |
|---|---|---|
| Create | backend | `database/migrations/tenant/2026_05_15_000001_add_registration_to_savings_product_charges_type.php` |
| Create | backend | `tests/Tenant/Charges/PerProductRegistrationChargesTest.php` |
| Modify | backend | `app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php` (validation + store/update + syncSavingsPivot caller) |
| Modify | backend | `app/Tenant/Modules/Charges/Contracts/ChargeCalculatorServiceInterface.php` (new method) |
| Modify | backend | `app/Tenant/Modules/Charges/Services/ChargeCalculatorService.php` (new method impl) |
| Modify | backend | `app/Tenant/Http/Controllers/Api/V1/MemberController.php` (validation, deduction, universal filter) |
| Modify | backend | `app/Tenant/Services/MemberService.php` (rewrite `GeneralProductChargesDropDownList`) |
| Modify | frontend | `src/tenant/modules/settings/general-charges/Create.vue` (Saving Products dependsOn) |
| Modify | frontend | `src/tenant/modules/members/Create.vue` (split watcher + new field + sufficiency hint) |
| Create | frontend | `src/tenant/modules/members/__tests__/Create.charges.spec.ts` |

**Working dirs**
- Backend: `/Users/asd/Mfuko_pro/mfuko-pro-backend-2026` — branch `feat/per-product-registration-charges` (cut from main as Task 1 Step 0).
- Frontend: `/Users/asd/Mfuko_pro/mfuko-pro-frontend-2026` — branch `feat/per-product-registration-charges` (already has spec commits `8ca5e16` + `aeb35e5`).

---

## Reference: things explicitly NOT touched

- `MemberCharge` model — its query filter changes, not its shape or any of its consumer code.
- `resolveForSavings` and the deposit/withdraw/transfer charge resolution path.
- `ChargeJournalService` / `MemberChargeService::collectPendingCharges` — the deduction reuses the existing journal posting machinery without modification.
- Loan-charge tables, on_shares charges, refund/reversal flow.

---

## Task 1: Backend — Cut branch + extend `savings_product_charges.type` ENUM

**Files:**
- Create: `database/migrations/tenant/2026_05_15_000001_add_registration_to_savings_product_charges_type.php`
- Create: `tests/Tenant/Charges/PerProductRegistrationChargesTest.php`

Working dir: `/Users/asd/Mfuko_pro/mfuko-pro-backend-2026`

- [ ] **Step 0: Cut the backend branch**

```bash
cd /Users/asd/Mfuko_pro/mfuko-pro-backend-2026
git fetch origin main
git switch main
git pull --ff-only
git switch -c feat/per-product-registration-charges
```

Confirm: `git rev-parse --abbrev-ref HEAD` prints `feat/per-product-registration-charges`.

- [ ] **Step 1: Write the failing Pest test**

Create `tests/Tenant/Charges/PerProductRegistrationChargesTest.php`:

```php
<?php

use App\Tenant\Modules\Savings\Models\SavingsProductCharge;
use App\Tenant\Modules\Savings\Models\SavingsProduct;
use App\Tenant\Modules\Savings\Models\GeneralCharge;
use App\Tenant\Modules\Accounting\Models\ChartOfAccount;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->income = ChartOfAccount::query()->where('gl_code', '42997')->first() ?? ChartOfAccount::create([
        'gl_code'         => '42997',
        'name'            => 'Test Charge Income',
        'account_type'    => 'INCOME',
        'account_subtype' => 'Fee Income',
        'normal_balance'  => 'CR',
        'level'           => 3,
        'is_control'      => false,
        'is_postable'     => true,
        'is_active'       => true,
    ]);

    $this->product = SavingsProduct::factory()->create();
});

it('migration extends savings_product_charges.type enum to include registration', function () {
    // Run the new migration explicitly so the test exercises ALTER on existing tenants.
    $this->artisan('migrate', [
        '--database' => 'tenant',
        '--path'     => 'database/migrations/tenant/2026_05_15_000001_add_registration_to_savings_product_charges_type.php',
        '--force'    => true,
    ])->assertExitCode(0);

    // Build a charge + pivot row with the new type. If the ENUM was not extended
    // this insert raises "Data truncated for column 'type'".
    $charge = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'credit_account_id' => $this->income->id,
    ]);

    SavingsProductCharge::on('tenant')->insert([
        'savings_product_id' => $this->product->id,
        'general_charge_id'  => $charge->id,
        'type'               => 'registration',
        'name'               => $charge->name,
        'charge_type'        => 'amount',
        'amount'             => 5000,
        'minimum_amount'     => 0,
        'is_reversible'      => true,
        'created_at'         => now(),
        'updated_at'         => now(),
    ]);

    $row = DB::connection('tenant')->table('savings_product_charges')
        ->where('general_charge_id', $charge->id)
        ->first();

    expect($row->type)->toBe('registration');
});
```

- [ ] **Step 2: Run the test, verify it fails**

```bash
php artisan test --filter='migration extends savings_product_charges.type enum to include registration'
```

Expected: FAIL with "No such file or directory" referencing the missing migration path, OR with "Data truncated for column 'type'" if the test runs before the migration applies.

- [ ] **Step 3: Create the migration**

Create `database/migrations/tenant/2026_05_15_000001_add_registration_to_savings_product_charges_type.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Extend savings_product_charges.type ENUM to include 'registration'.
 *
 * Used by the per-product registration-charge feature. A charge with
 * application='on_registration' AND non-empty saving_product_ids writes one
 * pivot row per product with type='registration'. ChargeCalculatorService::
 * resolveForRegistration queries on that type to surface charges at member
 * registration time.
 *
 * down() restores the original three-value ENUM. Any 'registration' rows
 * present at rollback time would fail the column conversion, so callers must
 * delete those rows first.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::connection('tenant')->statement(
            "ALTER TABLE savings_product_charges MODIFY COLUMN type ENUM('deposit','withdraw','transfer','registration') NOT NULL"
        );
    }

    public function down(): void
    {
        DB::connection('tenant')->statement(
            "ALTER TABLE savings_product_charges MODIFY COLUMN type ENUM('deposit','withdraw','transfer') NOT NULL"
        );
    }
};
```

- [ ] **Step 4: Run the test, verify it passes**

```bash
php artisan test --filter='migration extends savings_product_charges.type enum to include registration'
```

Expected: PASS (1 passed, 1 assertion).

- [ ] **Step 5: Commit**

```bash
git add database/migrations/tenant/2026_05_15_000001_add_registration_to_savings_product_charges_type.php \
        tests/Tenant/Charges/PerProductRegistrationChargesTest.php
git commit -m "feat: extend savings_product_charges.type enum with 'registration'"
```

---

## Task 2: Backend — Accept `saving_product_ids` when `application=on_registration`

**Files:**
- Modify: `app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php` (lines around 60–115, 160–185)
- Modify: `tests/Tenant/Charges/PerProductRegistrationChargesTest.php` (append tests)

The existing `syncSavingsPivot(GeneralCharge $charge, array $productIds, array $triggerTypes)` writes the cross-product of products × triggers as pivot rows. For registration we want one pivot row per product with `type='registration'`. The cleanest reuse: compute `$triggerTypes = ['registration']` in the controller when `application='on_registration'` AND `saving_product_ids` is non-empty, and pass that array straight into the existing helper.

- [ ] **Step 1: Write the failing tests**

Append to `tests/Tenant/Charges/PerProductRegistrationChargesTest.php`:

```php
use App\Models\Staff;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->staff = Staff::firstOrCreate(
        ['email' => 'admin@gap-reg-test.com'],
        [
            'name'            => 'Tenant Admin',
            'password'        => Hash::make('password'),
            'role'            => 'Admin',
            'is_tenant_admin' => true,
        ]
    );
});

it('creates pivot rows with type=registration when application=on_registration + saving_product_ids', function () {
    $productB = SavingsProduct::factory()->create();

    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/general-charges', [
            'name'              => 'Account Opening Fee',
            'is_revenue'        => 'yes',
            'application'       => 'on_registration',
            'charge_type'       => 'amount',
            'amount'            => 5000,
            'credit_account_id' => $this->income->id,
            'saving_product_ids' => [$this->product->id, $productB->id],
        ]);

    $response->assertCreated();

    $chargeId = $response->json('data.id');
    $rows = SavingsProductCharge::on('tenant')
        ->where('general_charge_id', $chargeId)
        ->get();

    expect($rows)->toHaveCount(2);
    expect($rows->pluck('type')->unique()->values()->all())->toEqual(['registration']);
    expect($rows->pluck('savings_product_id')->sort()->values()->all())
        ->toEqual(collect([$this->product->id, $productB->id])->sort()->values()->all());
});

it('keeps universal-receivable mode when application=on_registration with no saving_product_ids', function () {
    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/general-charges', [
            'name'              => 'Universal Membership Fee',
            'is_revenue'        => 'yes',
            'application'       => 'on_registration',
            'charge_type'       => 'amount',
            'amount'            => 2000,
            'credit_account_id' => $this->income->id,
        ]);

    $response->assertCreated();

    $chargeId = $response->json('data.id');
    expect(SavingsProductCharge::on('tenant')->where('general_charge_id', $chargeId)->count())
        ->toBe(0);
});

it('rejects on_registration charge update when saving_product_ids includes a non-existent product', function () {
    $charge = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'credit_account_id' => $this->income->id,
    ]);

    $response = $this->actingAs($this->staff, 'tenant')
        ->putJson("/api/v1/tenant/general-charges/{$charge->id}", [
            'name'              => $charge->name,
            'is_revenue'        => 'yes',
            'application'       => 'on_registration',
            'charge_type'       => 'amount',
            'amount'            => $charge->amount,
            'credit_account_id' => $this->income->id,
            'saving_product_ids' => [999999],
        ]);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('saving_product_ids.0');
});
```

- [ ] **Step 2: Run the tests, verify they fail**

```bash
php artisan test --filter='PerProductRegistrationChargesTest'
```

Expected: 3 failing (the first 2 because store() doesn't yet emit pivot rows for on_registration; the third because validation doesn't yet check `exists:`).

- [ ] **Step 3: Adjust validation in `validateChargePayload`**

Open `app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php`. Locate the validation block around line 160. Find:

```php
$isSavingsEvent = $request->input('application') === 'other'
    && $request->input('where_to_apply') === 'savings';

$savingsListRule = Rule::requiredIf(fn () => $isSavingsEvent);
```

Add directly below it:

```php
// Per-product registration charges: saving_product_ids is OPTIONAL for
// on_registration, but if any IDs are supplied each must reference an
// existing savings_products row. trigger_types is NEVER user-supplied for
// on_registration — the controller forces it to ['registration'] before
// calling syncSavingsPivot.
$isRegistrationProductScoped = $request->input('application') === 'on_registration'
    && is_array($request->input('saving_product_ids'))
    && count($request->input('saving_product_ids')) > 0;
```

Then in the rules array, change the `saving_product_ids` line to allow on_registration to opt in without requiring trigger_types:

Find:
```php
'saving_product_ids' => [$savingsListRule, 'array', 'min:'.($isSavingsEvent ? 1 : 0)],
'saving_product_ids.*' => ['integer', 'exists:tenant.savings_products,id'],
'trigger_types' => [$savingsListRule, 'array', 'min:'.($isSavingsEvent ? 1 : 0)],
'trigger_types.*' => ['string', 'in:'.implode(',', self::TRIGGER_TYPES)],
```

Replace with:
```php
'saving_product_ids' => [$savingsListRule, 'array', 'min:'.($isSavingsEvent ? 1 : 0)],
'saving_product_ids.*' => ['integer', 'exists:tenant.savings_products,id'],
// trigger_types stays required ONLY for the savings-event lane; on_registration
// product-scoped charges set their trigger to 'registration' implicitly.
'trigger_types' => [$savingsListRule, 'array', 'min:'.($isSavingsEvent ? 1 : 0)],
'trigger_types.*' => ['string', 'in:'.implode(',', self::TRIGGER_TYPES)],
```

(The `$isRegistrationProductScoped` flag is unused by the rules themselves — it stays in scope because the next change reads it. If linters complain, prefix with `// phpcs:ignore` or remove and inline the boolean in Step 4.)

- [ ] **Step 4: Force trigger_types=['registration'] in store() and update()**

In `store()` (the call to `syncSavingsPivot` around line 79), change:

```php
$this->syncSavingsPivot(
    $charge,
    $validated['saving_product_ids'] ?? [],
    $validated['trigger_types'] ?? [],
);
```

to:

```php
$triggerTypes = $validated['trigger_types'] ?? [];
if ($validated['application'] === 'on_registration' && ! empty($validated['saving_product_ids'] ?? [])) {
    $triggerTypes = ['registration'];
}

$this->syncSavingsPivot(
    $charge,
    $validated['saving_product_ids'] ?? [],
    $triggerTypes,
);
```

Apply the identical change in `update()` (the matching `syncSavingsPivot` call around line 113).

- [ ] **Step 5: Run the tests, verify they pass**

```bash
php artisan test --filter='PerProductRegistrationChargesTest'
```

Expected: 4 passed (1 from Task 1 + 3 new ones).

- [ ] **Step 6: Commit**

```bash
git add app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php \
        tests/Tenant/Charges/PerProductRegistrationChargesTest.php
git commit -m "feat: accept saving_product_ids for on_registration charges + write pivot rows"
```

---

## Task 3: Backend — `ChargeCalculatorService::resolveForRegistration`

**Files:**
- Modify: `app/Tenant/Modules/Charges/Contracts/ChargeCalculatorServiceInterface.php`
- Modify: `app/Tenant/Modules/Charges/Services/ChargeCalculatorService.php`
- Modify: `tests/Tenant/Charges/PerProductRegistrationChargesTest.php` (append)

- [ ] **Step 1: Write the failing tests**

Append to `tests/Tenant/Charges/PerProductRegistrationChargesTest.php`:

```php
use App\Tenant\Modules\Charges\Contracts\ChargeCalculatorServiceInterface;

it('resolveForRegistration returns matching active charges for a product', function () {
    $charge1 = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'amount'            => 5000,
        'credit_account_id' => $this->income->id,
        'is_active'         => true,
    ]);
    $charge2 = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'amount'            => 2000,
        'credit_account_id' => $this->income->id,
        'is_active'         => true,
    ]);

    foreach ([$charge1, $charge2] as $c) {
        SavingsProductCharge::on('tenant')->insert([
            'savings_product_id' => $this->product->id,
            'general_charge_id'  => $c->id,
            'type'               => 'registration',
            'name'               => $c->name,
            'charge_type'        => 'amount',
            'amount'             => $c->amount,
            'minimum_amount'     => 0,
            'is_reversible'      => true,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);
    }

    $calculator = app(ChargeCalculatorServiceInterface::class);
    $result = $calculator->resolveForRegistration($this->product->id);

    expect($result)->toHaveCount(2);
    expect(collect($result)->pluck('general_charge_id')->sort()->values()->all())
        ->toEqual(collect([$charge1->id, $charge2->id])->sort()->values()->all());
    expect(collect($result)->pluck('amount')->sort()->values()->all())
        ->toEqual([2000.0, 5000.0]);
});

it('resolveForRegistration excludes inactive charges', function () {
    $charge = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'credit_account_id' => $this->income->id,
        'is_active'         => false,
    ]);
    SavingsProductCharge::on('tenant')->insert([
        'savings_product_id' => $this->product->id,
        'general_charge_id'  => $charge->id,
        'type'               => 'registration',
        'name'               => $charge->name,
        'charge_type'        => 'amount',
        'amount'             => 100,
        'minimum_amount'     => 0,
        'is_reversible'      => true,
        'created_at'         => now(),
        'updated_at'         => now(),
    ]);

    $calculator = app(ChargeCalculatorServiceInterface::class);
    expect($calculator->resolveForRegistration($this->product->id))->toBe([]);
});

it('resolveForRegistration returns empty for a product with no registration charges', function () {
    $calculator = app(ChargeCalculatorServiceInterface::class);
    expect($calculator->resolveForRegistration($this->product->id))->toBe([]);
});
```

- [ ] **Step 2: Run the tests, verify they fail**

```bash
php artisan test --filter='resolveForRegistration'
```

Expected: 3 failed with "Call to undefined method resolveForRegistration" or "Method not found".

- [ ] **Step 3: Add the interface method**

In `app/Tenant/Modules/Charges/Contracts/ChargeCalculatorServiceInterface.php`, append:

```php
    /**
     * Resolve all active product-scoped registration charges for a savings product.
     *
     * Unlike resolveForSavings which returns a single match per event, registration
     * can stack multiple charges per product (e.g. Membership Card + Account Opening Fee).
     *
     * @return array<int, array{general_charge_id: int, name: string, amount: float, credit_account_id: ?int, is_reversible: bool}>
     */
    public function resolveForRegistration(int $savingsProductId): array;
```

- [ ] **Step 4: Implement in the service**

In `app/Tenant/Modules/Charges/Services/ChargeCalculatorService.php`, append the new method inside the class:

```php
    public function resolveForRegistration(int $savingsProductId): array
    {
        return SavingsProductCharge::on('tenant')
            ->with('generalCharge')
            ->where('savings_product_id', $savingsProductId)
            ->where('type', 'registration')
            ->whereNotNull('general_charge_id')
            ->whereHas('generalCharge', fn ($q) => $q->where('is_active', true))
            ->get()
            ->map(function (SavingsProductCharge $pc) {
                $charge = $pc->generalCharge;

                return [
                    'general_charge_id' => (int) $charge->id,
                    'name'              => (string) $charge->name,
                    'amount'            => (float) $charge->amount,
                    'credit_account_id' => $charge->credit_account_id !== null ? (int) $charge->credit_account_id : null,
                    'is_reversible'     => (bool) $charge->is_reversible,
                ];
            })
            ->values()
            ->all();
    }
```

- [ ] **Step 5: Run the tests, verify they pass**

```bash
php artisan test --filter='resolveForRegistration'
```

Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add app/Tenant/Modules/Charges/Contracts/ChargeCalculatorServiceInterface.php \
        app/Tenant/Modules/Charges/Services/ChargeCalculatorService.php \
        tests/Tenant/Charges/PerProductRegistrationChargesTest.php
git commit -m "feat: ChargeCalculatorService::resolveForRegistration"
```

---

## Task 4: Backend — Deduct product-scoped charges at member registration

**Files:**
- Modify: `app/Tenant/Http/Controllers/Api/V1/MemberController.php` (`register()` around lines 280–365 + `applyRegistrationCharges()` around lines 816–858)
- Modify: `tests/Tenant/Charges/PerProductRegistrationChargesTest.php` (append)

- [ ] **Step 1: Write the failing tests**

Append to `tests/Tenant/Charges/PerProductRegistrationChargesTest.php`:

```php
use App\Tenant\Modules\Members\Models\Member;
use App\Tenant\Modules\Members\Models\MemberCharge;
use App\Tenant\Modules\Savings\Models\SavingsAccount;
use App\Tenant\Modules\Savings\Models\SavingsTransaction;

it('member registration deducts product-scoped registration charges from initial deposit', function () {
    $charge = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'amount'            => 5000,
        'credit_account_id' => $this->income->id,
        'is_active'         => true,
    ]);
    SavingsProductCharge::on('tenant')->insert([
        'savings_product_id' => $this->product->id,
        'general_charge_id'  => $charge->id,
        'type'               => 'registration',
        'name'               => $charge->name,
        'charge_type'        => 'amount',
        'amount'             => 5000,
        'minimum_amount'     => 0,
        'is_reversible'      => true,
        'created_at'         => now(),
        'updated_at'         => now(),
    ]);

    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/members', [
            'full_name'         => 'Test Member',
            'email'             => 'test@member.com',
            'primary_contact'   => '+256700000001',
            'gender'            => 'male',
            'date_of_birth'     => '1990-01-01',
            'address'           => 'Kampala',
            'nationality'       => 'Uganda',
            'initial_deposit'   => 20000,
            'savings_product_id' => $this->product->id,
            'is_existing'       => false,
        ]);

    $response->assertStatus(200);
    $memberId = $response->json('data.id');
    $account = SavingsAccount::on('tenant')->where('member_id', $memberId)->latest()->first();

    expect((float) $account->balance)->toBe(15000.0);
    // The product-scoped charge should NOT have created a MemberCharge receivable.
    expect(MemberCharge::on('tenant')->where('member_id', $memberId)->where('general_charge_id', $charge->id)->count())
        ->toBe(0);
});

it('member registration rejects when initial deposit is less than product-scoped charges total', function () {
    $charge = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'amount'            => 5000,
        'credit_account_id' => $this->income->id,
        'is_active'         => true,
    ]);
    SavingsProductCharge::on('tenant')->insert([
        'savings_product_id' => $this->product->id,
        'general_charge_id'  => $charge->id,
        'type'               => 'registration',
        'name'               => $charge->name,
        'charge_type'        => 'amount',
        'amount'             => 5000,
        'minimum_amount'     => 0,
        'is_reversible'      => true,
        'created_at'         => now(),
        'updated_at'         => now(),
    ]);

    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/members', [
            'full_name'         => 'Underfunded Member',
            'email'             => 'under@member.com',
            'primary_contact'   => '+256700000002',
            'gender'            => 'male',
            'date_of_birth'     => '1990-01-01',
            'address'           => 'Kampala',
            'nationality'       => 'Uganda',
            'initial_deposit'   => 3000,
            'savings_product_id' => $this->product->id,
            'is_existing'       => false,
        ]);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('initial_deposit');
    expect(Member::on('tenant')->where('email', 'under@member.com')->exists())->toBeFalse();
});

it('universal applyRegistrationCharges excludes charges with type=registration pivot rows', function () {
    // Universal charge — no pivot rows
    $universal = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'amount'            => 2000,
        'credit_account_id' => $this->income->id,
        'is_active'         => true,
    ]);
    // Product-scoped charge — has pivot row
    $scoped = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'amount'            => 5000,
        'credit_account_id' => $this->income->id,
        'is_active'         => true,
    ]);
    SavingsProductCharge::on('tenant')->insert([
        'savings_product_id' => $this->product->id,
        'general_charge_id'  => $scoped->id,
        'type'               => 'registration',
        'name'               => $scoped->name,
        'charge_type'        => 'amount',
        'amount'             => 5000,
        'minimum_amount'     => 0,
        'is_reversible'      => true,
        'created_at'         => now(),
        'updated_at'         => now(),
    ]);

    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/members', [
            'full_name'         => 'Mixed Member',
            'email'             => 'mixed@member.com',
            'primary_contact'   => '+256700000003',
            'gender'            => 'male',
            'date_of_birth'     => '1990-01-01',
            'address'           => 'Kampala',
            'nationality'       => 'Uganda',
            'initial_deposit'   => 20000,
            'savings_product_id' => $this->product->id,
            'is_existing'       => false,
        ]);

    $response->assertStatus(200);
    $memberId = $response->json('data.id');

    // Universal charge → MemberCharge receivable created.
    expect(MemberCharge::on('tenant')->where('member_id', $memberId)->where('general_charge_id', $universal->id)->count())
        ->toBe(1);
    // Product-scoped charge → NO MemberCharge receivable (was deducted directly).
    expect(MemberCharge::on('tenant')->where('member_id', $memberId)->where('general_charge_id', $scoped->id)->count())
        ->toBe(0);
});
```

- [ ] **Step 2: Run the tests, verify they fail**

```bash
php artisan test --filter='deducts product-scoped registration charges|rejects when initial deposit is less|universal applyRegistrationCharges excludes'
```

Expected: 3 failed (deduction never happens; insufficient case still succeeds; universal path applies the scoped charge too).

- [ ] **Step 3: Add the sufficiency check inside `register()` (BEFORE the DB::transaction)**

In `app/Tenant/Http/Controllers/Api/V1/MemberController.php`, find the `register()` method. Just before the `DB::transaction(...)` call (around line 297), add:

```php
// Resolve product-scoped registration charges for the chosen product and
// reject early if the initial deposit doesn't cover them. Done OUTSIDE the
// transaction so a 422 doesn't open and roll back a transaction.
$productIdForCharges = $isExisting && $savingsProductId
    ? $savingsProductId
    : optional(SavingsProduct::where('name', 'General Savings Account')->first())->id;

$registrationCharges = $productIdForCharges
    ? app(\App\Tenant\Modules\Charges\Contracts\ChargeCalculatorServiceInterface::class)
        ->resolveForRegistration($productIdForCharges)
    : [];

$registrationTotal = array_sum(array_column($registrationCharges, 'amount'));

if ($registrationTotal > 0
    && (float) $request->input('initial_deposit', 0) < $registrationTotal) {
    return response()->json([
        'success' => 422,
        'message' => "Initial deposit must be at least UGX {$registrationTotal} to cover registration charges.",
        'errors'  => ['initial_deposit' => ["Initial deposit must be at least UGX {$registrationTotal} to cover registration charges."]],
    ], 422);
}
```

Use `\App\Tenant\Modules\Charges\Contracts\ChargeCalculatorServiceInterface` fully-qualified or add `use App\Tenant\Modules\Charges\Contracts\ChargeCalculatorServiceInterface;` to the imports at the top of the file (prefer the import for readability).

- [ ] **Step 4: Inject the deduction inside `register()`'s transaction**

In the same `register()` method, the transaction closure currently calls `$this->applyRegistrationCharges($member);` around line 346. Directly before that line, add:

```php
// Post the product-scoped registration charges resolved earlier as
// withdrawal transactions against the savings account. Universal
// on_registration charges are handled below by applyRegistrationCharges.
foreach ($registrationCharges as $rc) {
    $this->memberChargeService->postRegistrationCharge(
        $member,
        $account ?? SavingsAccount::on('tenant')->where('member_id', $member->id)->latest()->first(),
        (int) $rc['general_charge_id'],
        (float) $rc['amount'],
        $this->savingsJournal,
    );
}
```

`$account` may not be in scope — substitute `SavingsAccount::on('tenant')->where('member_id', $member->id)->latest()->first()` if needed.

Note: `MemberChargeService::postRegistrationCharge` does not exist yet. Add it in Step 5.

- [ ] **Step 5: Add `postRegistrationCharge` to MemberChargeService**

Open `app/Tenant/Modules/Members/Services/MemberChargeService.php`. Find the existing `collectPendingCharges` method and use it as a reference for the journal-posting pattern. Append a new method:

```php
    /**
     * Post a product-scoped registration charge as a withdrawal transaction
     * against the member's savings account. Mirrors collectPendingCharges' GL
     * shape (debit savings, credit charge.credit_account_id) but does NOT
     * create a MemberCharge receivable — the charge is consumed immediately.
     */
    public function postRegistrationCharge(
        \App\Tenant\Modules\Members\Models\Member $member,
        \App\Tenant\Modules\Savings\Models\SavingsAccount $account,
        int $generalChargeId,
        float $amount,
        $savingsJournal
    ): void {
        $charge = \App\Tenant\Modules\Savings\Models\GeneralCharge::find($generalChargeId);
        if (! $charge) {
            return;
        }

        // Reuse the same journal posting path collectPendingCharges already uses.
        // Look at collectPendingCharges() in this file for the exact call shape —
        // the parameters here must match: account, amount, charge meta, narration.
        $savingsJournal->postCharge(
            $account,
            (float) $amount,
            $charge->credit_account_id,
            "Registration charge: {$charge->name}",
            $charge->id
        );
    }
```

If `collectPendingCharges()` uses a different posting method name (e.g. `$this->journalService->postWithdrawal(...)` or `postChargeEntry`), match its signature here exactly. Read the existing method first and mirror it.

- [ ] **Step 6: Update `applyRegistrationCharges` to filter out product-scoped charges**

In the same file, find `applyRegistrationCharges($member)` (around line 816). Change:

```php
$charges = GeneralCharge::where('application', 'on_registration')
    ->where('is_active', true)
    ->get();
```

to:

```php
$charges = GeneralCharge::where('application', 'on_registration')
    ->where('is_active', true)
    ->whereDoesntHave('productCharges', fn ($q) => $q->where('type', 'registration'))
    ->get();
```

The relation name is `productCharges` (already defined on `GeneralCharge::productCharges(): HasMany`).

- [ ] **Step 7: Run the new tests, verify they pass**

```bash
php artisan test --filter='deducts product-scoped registration charges|rejects when initial deposit is less|universal applyRegistrationCharges excludes'
```

Expected: 3 passed.

- [ ] **Step 8: Run the full per-product test file**

```bash
php artisan test tests/Tenant/Charges/PerProductRegistrationChargesTest.php
```

Expected: all tests in the file green.

- [ ] **Step 9: Commit**

```bash
git add app/Tenant/Http/Controllers/Api/V1/MemberController.php \
        app/Tenant/Modules/Members/Services/MemberChargeService.php \
        tests/Tenant/Charges/PerProductRegistrationChargesTest.php
git commit -m "feat: deduct product-scoped registration charges from initial deposit + filter universal"
```

---

## Task 5: Backend — Rewrite `GeneralProductChargesDropDownList` against the pivot

**Files:**
- Modify: `app/Tenant/Services/MemberService.php` (around lines 205–240)
- Modify: `tests/Tenant/Charges/PerProductRegistrationChargesTest.php` (append)

The current implementation references `gchrg.saving_product_ids`, a JSON column Gap 4 dropped — so the helper text it powers on the Create A Sacco Member drawer has been silently broken. Rewrite to query the pivot.

- [ ] **Step 1: Write the failing test**

Append to `tests/Tenant/Charges/PerProductRegistrationChargesTest.php`:

```php
it('general-product-charges endpoint returns pivot-backed list for a product', function () {
    $charge = GeneralCharge::factory()->create([
        'application'       => 'on_registration',
        'amount'            => 5000,
        'credit_account_id' => $this->income->id,
        'is_active'         => true,
    ]);
    SavingsProductCharge::on('tenant')->insert([
        'savings_product_id' => $this->product->id,
        'general_charge_id'  => $charge->id,
        'type'               => 'registration',
        'name'               => $charge->name,
        'charge_type'        => 'amount',
        'amount'             => 5000,
        'minimum_amount'     => 0,
        'is_reversible'      => true,
        'created_at'         => now(),
        'updated_at'         => now(),
    ]);

    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/global/general-product-charges', [
            'id'   => $this->product->id,
            'type' => 'onboarding',
        ]);

    $response->assertOk();
    $items = collect($response->json('payload.data') ?? $response->json('data.data') ?? []);
    $row = $items->firstWhere('id', $charge->id);

    expect($row)->not->toBeNull()
        ->and((float) $row['charge_amount'])->toBe(5000.0);
});

it('general-product-charges endpoint returns empty for a product with no registration charges', function () {
    $response = $this->actingAs($this->staff, 'tenant')
        ->postJson('/api/v1/tenant/global/general-product-charges', [
            'id'   => $this->product->id,
            'type' => 'onboarding',
        ]);

    $response->assertOk();
    $items = collect($response->json('payload.data') ?? $response->json('data.data') ?? []);
    expect($items->count())->toBe(0);
});
```

If the exact route path differs (e.g. it's actually `general-product-charges-list` due to `routeListV2` naming), adjust the URL by reading `routes/tenant_api.php` around the MemberController group. The handler method is `general_product_charges_drop_down_list`.

- [ ] **Step 2: Run the tests, verify they fail**

```bash
php artisan test --filter='general-product-charges endpoint'
```

Expected: 2 failed — either with "Unknown column 'gchrg.saving_product_ids'" (if the column drop migration already ran on the test DB) or returning an empty list.

- [ ] **Step 3: Rewrite the query**

In `app/Tenant/Services/MemberService.php`, find `GeneralProductChargesDropDownList()` (around line 205). Replace its body:

```php
public function GeneralProductChargesDropDownList()
{
    $req = request();
    request()->validate([
        'search_keyword' => ['nullable', 'string', 'max:20'],
        'type'           => ['required', 'string'],
        'id'             => ['required', 'integer', 'exists:tenant.savings_products,id'],
    ]);

    return $this->TryCatch(function () use ($req) {
        // 'onboarding' is the only consumer today (members Create.vue);
        // it maps to general_charges.application='on_registration' linked via
        // the savings_product_charges pivot with type='registration'.
        $pivotType = 'registration';
        $application = 'on_registration';

        $query = DB::table('savings_product_charges AS spc')
            ->join('general_charges AS gchrg', 'gchrg.id', '=', 'spc.general_charge_id')
            ->where('spc.savings_product_id', $req->id)
            ->where('spc.type', $pivotType)
            ->where('gchrg.application', $application)
            ->where('gchrg.is_active', 1)
            ->whereNull('gchrg.deleted_at')
            ->select([
                'gchrg.id',
                'gchrg.name as name',
                DB::raw('SUM(gchrg.amount) as charge_amount'),
            ])
            ->groupBy('gchrg.id', 'gchrg.name');

        if ($req->has('search_keyword')) {
            $query = $this->dynamic_search_db_query($query, $req['search_keyword'], [
                'gchrg.id AS id', 'gchrg.name', 'gchrg.code',
            ]);
        }

        return $query->orderBy('gchrg.id', 'DESC')->paginate($this->perpage());
    });
}
```

- [ ] **Step 4: Run the tests, verify they pass**

```bash
php artisan test --filter='general-product-charges endpoint'
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add app/Tenant/Services/MemberService.php \
        tests/Tenant/Charges/PerProductRegistrationChargesTest.php
git commit -m "fix: rewrite GeneralProductChargesDropDownList to query the savings_product_charges pivot"
```

---

## Task 6: Backend — Regression sweep + push

No code changes here. Verify the change set doesn't break adjacent suites, then push.

- [ ] **Step 1: Run the new feature suite**

```bash
php artisan test tests/Tenant/Charges/PerProductRegistrationChargesTest.php
```

Expected: all tests green.

- [ ] **Step 2: Run the related regression filters**

```bash
php artisan test --filter='Charge|Savings|Member' 2>&1 | tail -30
```

Expected: no NEW failures vs. the baseline. (Pre-existing baseline failures in `GeneralChargeSavingsPivotSyncTest`, `ChargeJournalServiceTest`, etc. due to `gl_code='42999'` collisions are unrelated — confirm via `git stash` baseline if numbers look off.)

- [ ] **Step 3: Push the backend branch**

```bash
git push -u origin feat/per-product-registration-charges
```

Expected: branch published, GitHub returns a PR-creation link.

No commit (only a push).

---

## Task 7: Frontend — Settings `Create.vue`: extend Saving Products `dependsOn`

**Files:**
- Modify: `src/tenant/modules/settings/general-charges/Create.vue` (around lines 115–142)

Working dir: `/Users/asd/Mfuko_pro/mfuko-pro-frontend-2026`

The existing `Saving Products` field currently renders when `application = other AND where_to_apply = savings`. Add an OR branch for `application = on_registration`.

- [ ] **Step 1: Locate the field**

Open `src/tenant/modules/settings/general-charges/Create.vue`. Find the `Saving Products` field declaration in the `fields` ref. Its current `dependsOn`:

```ts
dependsOn: {
  conditions: [
    { field: 'application', value: 'other' },
    { field: 'where_to_apply', value: 'savings' },
  ],
  operator: 'and',
},
```

- [ ] **Step 2: Replace with a nested OR-of-AND**

Check whether the project's DynamicForm supports nested `dependsOn` groups (look at other fields in the codebase using nested groups, or read the DynamicForm component source). If it does, use the nested form. If it does NOT, fall back to a custom `dependsOnCustom` predicate that the DynamicForm can call — search the codebase for `dependsOnCustom`, `condition:` (the function form already used for `credit_account_id` in this file), or similar.

The credit_account_id field already uses a `condition: (val: string) => [...].includes(val)` predicate. Saving Products can do the same — replace the `dependsOn` block with:

```ts
dependsOn: undefined,
condition: (_val: string, allValues: Record<string, any>) => {
  const app = allValues?.application
  const where = allValues?.where_to_apply
  return (app === 'other' && where === 'savings') || app === 'on_registration'
},
```

If the project's DynamicForm passes `allValues` to `condition`, this works. If not, inspect Create.vue's existing `condition` usage on `credit_account_id` (`condition: (val: string) => [...].includes(val)`) — it receives the field's OWN tied value. For Saving Products, the relevant `val` is `application` itself; the second branch (`val === 'on_registration'`) is checked directly, the first branch (savings event) still needs `where_to_apply` access. If `allValues` is unavailable, the simplest fix is to switch the `Saving Products` field's `name` association to `application` (so `val` is the application value) AND read `where_to_apply` via a Vue ref looked up inside the predicate. Concretely:

```ts
condition: (val: string) => {
  if (val === 'on_registration') return true
  if (val === 'other') {
    const wherePicked = fields.value.find((f: any) => f.name === 'where_to_apply')?.value
    return wherePicked === 'savings'
  }
  return false
},
```

Choose whichever pattern works with the current DynamicForm (favor `condition` over `dependsOn` since the savings-event lane needs two-key logic). Run `pnpm dev`, open Settings → General Charges → Add, pick application=on_registration and confirm the Saving Products multi-select appears.

- [ ] **Step 3: Type-check + commit**

```bash
pnpm type-check 2>&1 | grep -i "general-charges/Create" || echo "OK"
```

Expected: `OK`.

```bash
git add src/tenant/modules/settings/general-charges/Create.vue
git commit -m "feat: show Saving Products multiselect for application=on_registration"
```

---

## Task 8: Frontend — Members `Create.vue`: split watcher + add General Charge field + sufficiency hint

**Files:**
- Modify: `src/tenant/modules/members/Create.vue` (the `fields` array around lines 110–135, and `watchChangeInProductOrCharges` around lines 365–410)

The existing `Transactional charges` field lumps registration charges and the deposit-event fee into a single total. Split into two fields: `Transactional charges` shows only the deposit-event fee; new `General Charge` field below it shows the registration charges. The watcher updates both.

- [ ] **Step 1: Add the new field declaration below `Transactional charges`**

Open `src/tenant/modules/members/Create.vue`. Find the `Transactional charges` field declaration (label `'Transactional charges'`, name `'charges'`). Add a sibling immediately below it:

```ts
{
  label: 'General Charge',
  name: 'general_registration_charges',
  type: 'text',  // same input shape as 'charges' — match its exact type literal
  placeholder: 'Auto-populated when a product is selected',
  hidden: true,  // shown by the watcher when registration charges exist
  helper: '',
},
```

Match the `type` literal to whatever `Transactional charges` uses (e.g. `'text'` or `'number'`). Read the existing entry to confirm.

- [ ] **Step 2: Split the watcher**

In the same file, find `watchChangeInProductOrCharges` (around line 369). The current shape:

```ts
const watchChangeInProductOrCharges = debounce(async (fields: any,) => {
  const finedProduct = fields.value.find((f: any) => f.name === 'product_id')
  const res = await onBoardingProductGeneralCharges({ id: finedProduct.value });
  const chargeField = fields.value.find((f: any) => f.name === 'charges')
  let generalChargesSum = res?.reduce((acc: number, c: any) => acc + c?.charge_amount, 0)
  // ... combines registration helper text into product field, then adds deposit-event fee
  // ... ends with: chargeField.value = `${totalCharges ?? 0} (charges)`
}, 900)
```

Replace with:

```ts
const watchChangeInProductOrCharges = debounce(async (fields: any) => {
  const finedProduct = fields.value.find((f: any) => f.name === 'product_id')
  const chargeField = fields.value.find((f: any) => f.name === 'charges')
  const generalChargeField = fields.value.find((f: any) => f.name === 'general_registration_charges')
  const amountField = fields.value.find((f: any) => f.name === 'inital_deposit')

  if (!finedProduct || !finedProduct.value) return

  // 1) Registration (on_registration) charges → populate the new General Charge field.
  const regRes = await onBoardingProductGeneralCharges({ id: finedProduct.value })
  const regCharges: any[] = Array.isArray(regRes) ? regRes : (regRes?.data ?? [])
  const regSum = regCharges.reduce((acc: number, c: any) => acc + Number(c?.charge_amount ?? 0), 0)

  if (generalChargeField) {
    if (regCharges.length > 0) {
      const breakdown = regCharges.map((c: any) => `${c?.name}: ${c?.charge_amount}`).join(', ')
      generalChargeField.value = `${regSum} (charges)`
      generalChargeField.hidden = false
      generalChargeField.helper = `<span class="font-bold text-red-500 text-xs">Registration charges for this product: <span class='text-neutral-900'>${breakdown}</span></span>`
    } else {
      generalChargeField.value = ''
      generalChargeField.hidden = true
      generalChargeField.helper = ''
    }
  }

  // 2) Deposit-event (transactional) fee → populate the existing Transactional charges field.
  //    NO LONGER summed with registration charges.
  if (chargeField && amountField?.value) {
    tryCatch(async () => {
      const depositRes: any = await getProductCharges({
        product_id: finedProduct.value,
        amount: amountField.value,
        type: 'deposit',
      })
      const depositFee = Number(depositRes?.cost ?? 0)
      chargeField.value = depositFee > 0 ? `${depositFee} (charges)` : ''
      chargeField.hidden = depositFee <= 0
      chargeField.helper = depositFee > 0
        ? `<span class="font-bold text-red-500 text-xs">Transaction charge: <span class='text-neutral-900'>${depositFee}</span></span>`
        : ''
    })
  }

  // 3) Initial-deposit sufficiency hint — surface a red helper under the
  //    Initial Deposit field when deposit < regSum. Backend rejects too;
  //    this is a UX assist.
  if (amountField) {
    const deposit = Number(amountField.value ?? 0)
    if (regSum > 0 && deposit > 0 && deposit < regSum) {
      amountField.helper = `<span class="font-bold text-red-500 text-xs">Initial deposit must be at least UGX ${regSum} to cover registration charges.</span>`
    } else {
      amountField.helper = ''
    }
  }
}, 900)
```

- [ ] **Step 3: Verify the watcher fires on product AND initial_deposit changes**

Search the file for where `watchChangeInProductOrCharges` is called. It's invoked in two `change:` handlers (around lines 64 and 115) — one on the product field, one on the initial-deposit field. Both still call this function, so no changes needed.

- [ ] **Step 4: Type-check + commit**

```bash
pnpm type-check 2>&1 | grep -i "members/Create" || echo "OK"
```

Expected: `OK`.

```bash
git add src/tenant/modules/members/Create.vue
git commit -m "feat: split General Charge from Transactional charges + initial-deposit sufficiency hint"
```

---

## Task 9: Frontend — Vitest assertions for the new field shape

**Files:**
- Create: `src/tenant/modules/members/__tests__/Create.charges.spec.ts`

The tests assert the watcher's behavior by directly testing the helper logic. Mount `Create.vue` with a stubbed API mock and verify field state mutations.

- [ ] **Step 1: Write the spec**

Create `src/tenant/modules/members/__tests__/Create.charges.spec.ts`:

```ts
/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const onBoardingMock = vi.fn()
const getProductChargesMock = vi.fn()

vi.mock('septor-store', () => ({ getBearerToken: () => null, pomPinia: {} }))
vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { interceptors: { request: { use: vi.fn() } } },
}))
vi.mock('@/tenant/apis/members/settings', () => ({
  memmberSettingApi: () => ({
    onBoardingProductGeneralCharges: (...a: any[]) => onBoardingMock(...a),
  }),
}))
vi.mock('@/tenant/apis/members/account', () => ({
  memberAccountApi: () => ({
    getProductCharges: (...a: any[]) => getProductChargesMock(...a),
  }),
}))
// Heavy children: stub everything the form imports so jsdom doesn't choke.
vi.mock('@/Global', () => ({
  Form: { template: '<div data-test="form-root" />' },
  formatMoneyValue: (v: number) => String(v),
}))

beforeEach(() => {
  onBoardingMock.mockReset()
  getProductChargesMock.mockReset()
})

import Create from '../Create.vue'

describe('Members Create — General Charge field', () => {
  it('populates the new general_registration_charges field with registration total + breakdown when product is selected', async () => {
    onBoardingMock.mockResolvedValue([
      { id: 1, name: 'Account Opening Fee', charge_amount: 5000 },
    ])
    getProductChargesMock.mockResolvedValue({ cost: 0 })

    const wrapper = mount(Create, { props: { data: {} } })

    // Reach into the component instance to drive the watcher directly. The
    // schema-driven Form is stubbed, so we can't interact via the DOM.
    // Equivalent: simulate a product pick by mutating fields[] then calling
    // the exposed watcher.
    const vm: any = wrapper.vm
    const productField = vm.fields.find((f: any) => f.name === 'product_id')
    const depositField = vm.fields.find((f: any) => f.name === 'inital_deposit')
    productField.value = 3
    depositField.value = 20000

    await vm.watchChangeInProductOrCharges(vm.fields)
    await flushPromises()
    // Wait past the 900ms debounce.
    await new Promise((r) => setTimeout(r, 950))

    const general = vm.fields.find((f: any) => f.name === 'general_registration_charges')
    expect(general.hidden).toBe(false)
    expect(general.value).toBe('5000 (charges)')
    expect(general.helper).toContain('Account Opening Fee: 5000')
  })

  it('hides the general_registration_charges field when the product has no registration charges', async () => {
    onBoardingMock.mockResolvedValue([])
    getProductChargesMock.mockResolvedValue({ cost: 0 })

    const wrapper = mount(Create, { props: { data: {} } })
    const vm: any = wrapper.vm
    vm.fields.find((f: any) => f.name === 'product_id').value = 3
    vm.fields.find((f: any) => f.name === 'inital_deposit').value = 1000

    await vm.watchChangeInProductOrCharges(vm.fields)
    await flushPromises()
    await new Promise((r) => setTimeout(r, 950))

    const general = vm.fields.find((f: any) => f.name === 'general_registration_charges')
    expect(general.hidden).toBe(true)
    expect(general.value).toBe('')
  })

  it('shows the insufficient-deposit hint under Initial Deposit when deposit < registration total', async () => {
    onBoardingMock.mockResolvedValue([
      { id: 1, name: 'Account Opening Fee', charge_amount: 5000 },
    ])
    getProductChargesMock.mockResolvedValue({ cost: 0 })

    const wrapper = mount(Create, { props: { data: {} } })
    const vm: any = wrapper.vm
    vm.fields.find((f: any) => f.name === 'product_id').value = 3
    vm.fields.find((f: any) => f.name === 'inital_deposit').value = 3000

    await vm.watchChangeInProductOrCharges(vm.fields)
    await flushPromises()
    await new Promise((r) => setTimeout(r, 950))

    const deposit = vm.fields.find((f: any) => f.name === 'inital_deposit')
    expect(deposit.helper).toContain('Initial deposit must be at least UGX 5000')
  })

  it('keeps Transactional charges field showing only the deposit-event fee', async () => {
    onBoardingMock.mockResolvedValue([
      { id: 1, name: 'Account Opening Fee', charge_amount: 5000 },
    ])
    getProductChargesMock.mockResolvedValue({ cost: 200 })

    const wrapper = mount(Create, { props: { data: {} } })
    const vm: any = wrapper.vm
    vm.fields.find((f: any) => f.name === 'product_id').value = 3
    vm.fields.find((f: any) => f.name === 'inital_deposit').value = 20000

    await vm.watchChangeInProductOrCharges(vm.fields)
    await flushPromises()
    await new Promise((r) => setTimeout(r, 950))

    const transactional = vm.fields.find((f: any) => f.name === 'charges')
    // Only the deposit-event fee — not 5200.
    expect(transactional.value).toBe('200 (charges)')
    expect(transactional.helper).toContain('200')
    expect(transactional.helper).not.toContain('5000')
  })
})
```

The tests assume `Create.vue` exposes `fields` and `watchChangeInProductOrCharges` via `defineExpose` (or that they are reachable through `vm`). If they aren't exposed, add `defineExpose({ fields, watchChangeInProductOrCharges })` near the bottom of the component's `<script setup>` block. This is test-only plumbing — `defineExpose` is a Vue 3 stable API.

- [ ] **Step 2: Run the spec**

```bash
yarn test:unit src/tenant/modules/members/__tests__/Create.charges.spec.ts 2>&1 | tail -15
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/members/__tests__/Create.charges.spec.ts \
        src/tenant/modules/members/Create.vue
git commit -m "test: lock General Charge + Transactional charges split on members Create"
```

(Stage `Create.vue` again only if you had to add `defineExpose` to it; otherwise omit.)

---

## Task 10: Frontend — Push + manual smoke test

No code changes.

- [ ] **Step 1: Push**

```bash
git push -u origin feat/per-product-registration-charges
```

Expected: GitHub returns the PR-creation URL.

- [ ] **Step 2: Manual smoke (post-push, pre-merge)**

Run both the backend and frontend dev servers. With the backend branch merged or rebased onto the frontend branch's expected backend, perform these checks:

1. **Settings → General Charges → Add**
   - Pick `Application = On Registration` → confirm `Saving Products` multi-select renders (it didn't before this feature).
   - Pick two products, set amount 5000, save → confirm 201 and that `savings_product_charges` has two rows with `type='registration'` (check via `php artisan tinker` or a SQL client).

2. **Settings → General Charges (list)**
   - Open the new charge in Edit drawer → confirm the Saving Products multi-select pre-populates with the products from Step 1.

3. **Create A Sacco Member**
   - Pick `Saving Products = <one of the products from Step 1>`, enter `Initial Deposit = 20000`.
   - Confirm a `General Charge` text input appears directly below `Transactional charges`, with value `5000 (charges)` and helper text listing the charge by name + amount.
   - Confirm `Transactional charges` shows only the deposit-event fee (not 5000).
   - Change initial_deposit to `3000` → confirm a red helper appears under Initial Deposit: "Initial deposit must be at least UGX 5000 to cover registration charges."
   - Click Save → confirm 422 with `errors.initial_deposit`.
   - Set initial_deposit back to `20000`, Save → confirm member created, savings account balance is 15000 (not 20000), and the configured income GL has a 5000 credit posted.

4. **Universal-mode regression**
   - Create another `on_registration` charge with NO product association.
   - Register another member → confirm a `MemberCharge` receivable row exists for that member tied to the universal charge. Confirm the product-scoped charge from Step 1 did NOT create an additional `MemberCharge` for the same member (no double-charging).

5. **Edit flip-to-universal**
   - Edit the Step-1 charge → remove all product associations → save.
   - Register a new member with any savings product → confirm the now-universal charge creates a `MemberCharge` receivable (no deduction from initial deposit).

No commit. If any check fails, file a bug and address it on the same branch before merging.

---

## Self-review notes

### 1. Spec coverage

| Spec requirement | Implementing task |
|---|---|
| Extend `savings_product_charges.type` ENUM with `'registration'` | Task 1 |
| Backend accepts `saving_product_ids` for application=on_registration | Task 2 |
| Pivot rows written with `type='registration'` via existing `syncSavingsPivot` | Task 2 |
| Universal-receivable mode preserved when no `saving_product_ids` | Task 2 (test) + Task 4 (filter) |
| `saving_product_ids` validated against existing products | Task 2 |
| `ChargeCalculatorService::resolveForRegistration(savingsProductId): array` | Task 3 |
| `MemberController` rejects insufficient initial deposit with 422 | Task 4 |
| `MemberController` deducts product-scoped charges inside `DB::transaction` | Task 4 |
| `applyRegistrationCharges` excludes charges with type=registration pivot rows | Task 4 |
| `MemberChargeService::postRegistrationCharge` (deduction posting) | Task 4 (Step 5) |
| `GeneralProductChargesDropDownList` queries the pivot | Task 5 |
| Loan-side and savings-event paths unaffected | Task 6 (regression sweep) |
| Settings Create.vue shows Saving Products for on_registration | Task 7 |
| Members Create.vue adds new General Charge field below Transactional charges | Task 8 |
| Members Create.vue Transactional charges shows ONLY deposit-event fee | Task 8 (split watcher) |
| Members Create.vue shows insufficient-deposit hint | Task 8 (Step 2, branch 3) |
| Edit drawer pre-populates Saving Products for on_registration | Task 2 (the listing controller already derives saving_product_ids from `productCharges->pluck('savings_product_id')`, so no new code needed — confirmed in manual smoke Step 2) |
| Vitest: General Charge field renders when registration charges exist | Task 9 (test 1) |
| Vitest: General Charge field hides when none | Task 9 (test 2) |
| Vitest: Insufficient-deposit hint surfaces | Task 9 (test 3) |
| Vitest: Transactional charges shows only deposit-event fee | Task 9 (test 4) |
| Manual smoke: full register-deduct-reject cycle | Task 10 (Step 2) |

No gaps.

### 2. Placeholder scan

- No `TBD` / `TODO` / "implement later" / "add error handling" / "similar to Task N".
- Task 7 Step 2 contains a branch decision ("if DynamicForm supports nested groups, use that; else use the predicate"). The fallback predicate is fully spelled out, so an engineer can ship the working version even without checking — the decision is between two complete implementations, not a missing implementation.
- Task 4 Step 5 says "If `collectPendingCharges()` uses a different posting method name, match its signature here exactly. Read the existing method first and mirror it." This is necessary because `MemberChargeService::collectPendingCharges` wasn't fully read during plan-writing. The implementer must read it (one Read call) and align — but the rest of the method body is concrete.

### 3. Type consistency

- `resolveForRegistration(int $savingsProductId): array` — used consistently in Tasks 3 and 4.
- Pivot type value `'registration'` (string, lowercase) — used consistently in migration, store/update, calculator, filter, dropdown rewrite.
- Field name `general_registration_charges` — used in `Create.vue` field declaration (Task 8), watcher (Task 8), Vitest assertions (Task 9), manual smoke (Task 10).
- Helper text shape `<total> (charges)` — consistent between Task 8 and Task 9 assertions.
- Route path `/api/v1/tenant/global/general-product-charges` — used in Task 5 test; verify with `routes/tenant_api.php` at implementation time since `routeListV2()` may prefix the path. If the actual path differs, adjust both the test and the manual smoke.
