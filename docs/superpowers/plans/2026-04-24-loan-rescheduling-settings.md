# Loan Rescheduling Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four configurable reschedule charges (with per-charge type, basis, and collection method) to the loan settings drawer, and apply them with correct accounting during loan reschedule execution.

**Architecture:** New columns on `loan_settings` store the four charge configs; `LoanRescheduleService` computes and applies fees inside the existing `execute()` transaction; the frontend drawer gets a compact table UI using the existing `useGeneralLoanSettings` composable.

**Tech Stack:** Laravel 12, Pest/PHPUnit, Vue 3, TypeScript, Pinia, Axios

---

## File Map

### Backend — create
- `database/migrations/tenant/2026_04_24_000001_add_reschedule_charges_to_loan_settings.php`
- `database/migrations/tenant/2026_04_24_000002_add_reschedule_audit_columns_to_loan_reschedules.php`
- `tests/Unit/RescheduleFeeComputationTest.php`
- `tests/Unit/UpdateLoanSettingsRescheduleRulesTest.php`

### Backend — modify
- `app/Tenant/Modules/Settings/Models/LoanSetting.php`
- `app/Http/Requests/Tenant/UpdateLoanSettingsRequest.php`
- `app/Tenant/Modules/Loans/Models/LoanReschedule.php`
- `app/Tenant/Modules/Loans/Services/LoanRescheduleService.php`

### Frontend — modify
- `src/tenant/apis/settings/loanSettingsApi.ts`
- `src/tenant/modules/settings/composables/useGeneralLoanSettings.ts`
- `src/tenant/modules/settings/loan-products/ApprovalWorkflowDrawer.vue`

---

## Task 1: Migration — add reschedule charge columns to `loan_settings`

**Files:**
- Create: `database/migrations/tenant/2026_04_24_000001_add_reschedule_charges_to_loan_settings.php`

- [ ] **Step 1: Create the migration file**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'tenant';

    public function up(): void
    {
        Schema::connection('tenant')->table('loan_settings', function (Blueprint $table) {
            // Shared GL income account for all reschedule fees
            $table->unsignedBigInteger('reschedule_fee_income_account_id')->nullable()->after('topup_auto_disbursement');

            // 1. Reschedule Fee (every reschedule)
            $table->boolean('reschedule_fee_enabled')->default(false)->after('reschedule_fee_income_account_id');
            $table->string('reschedule_fee_type', 20)->default('flat')->after('reschedule_fee_enabled');
            $table->decimal('reschedule_fee_amount', 15, 4)->default(0)->after('reschedule_fee_type');
            $table->string('reschedule_fee_basis', 30)->nullable()->after('reschedule_fee_amount');
            $table->string('reschedule_fee_collection', 20)->default('cash')->after('reschedule_fee_basis');

            // 2. Product Change Fee
            $table->boolean('reschedule_product_change_fee_enabled')->default(false)->after('reschedule_fee_collection');
            $table->string('reschedule_product_change_fee_type', 20)->default('flat')->after('reschedule_product_change_fee_enabled');
            $table->decimal('reschedule_product_change_fee_amount', 15, 4)->default(0)->after('reschedule_product_change_fee_type');
            $table->string('reschedule_product_change_fee_basis', 30)->nullable()->after('reschedule_product_change_fee_amount');
            $table->string('reschedule_product_change_fee_collection', 20)->default('cash')->after('reschedule_product_change_fee_basis');

            // 3. Same Product Fee
            $table->boolean('reschedule_same_product_fee_enabled')->default(false)->after('reschedule_product_change_fee_collection');
            $table->string('reschedule_same_product_fee_type', 20)->default('flat')->after('reschedule_same_product_fee_enabled');
            $table->decimal('reschedule_same_product_fee_amount', 15, 4)->default(0)->after('reschedule_same_product_fee_type');
            $table->string('reschedule_same_product_fee_basis', 30)->nullable()->after('reschedule_same_product_fee_amount');
            $table->string('reschedule_same_product_fee_collection', 20)->default('cash')->after('reschedule_same_product_fee_basis');

            // 4. Other Charges (admin-armed)
            $table->boolean('reschedule_other_charges_enabled')->default(false)->after('reschedule_same_product_fee_collection');
            $table->string('reschedule_other_charges_type', 20)->default('flat')->after('reschedule_other_charges_enabled');
            $table->decimal('reschedule_other_charges_amount', 15, 4)->default(0)->after('reschedule_other_charges_type');
            $table->string('reschedule_other_charges_basis', 30)->nullable()->after('reschedule_other_charges_amount');
            $table->string('reschedule_other_charges_collection', 20)->default('cash')->after('reschedule_other_charges_basis');
        });
    }

    public function down(): void
    {
        Schema::connection('tenant')->table('loan_settings', function (Blueprint $table) {
            $table->dropColumn([
                'reschedule_fee_income_account_id',
                'reschedule_fee_enabled', 'reschedule_fee_type', 'reschedule_fee_amount',
                'reschedule_fee_basis', 'reschedule_fee_collection',
                'reschedule_product_change_fee_enabled', 'reschedule_product_change_fee_type',
                'reschedule_product_change_fee_amount', 'reschedule_product_change_fee_basis',
                'reschedule_product_change_fee_collection',
                'reschedule_same_product_fee_enabled', 'reschedule_same_product_fee_type',
                'reschedule_same_product_fee_amount', 'reschedule_same_product_fee_basis',
                'reschedule_same_product_fee_collection',
                'reschedule_other_charges_enabled', 'reschedule_other_charges_type',
                'reschedule_other_charges_amount', 'reschedule_other_charges_basis',
                'reschedule_other_charges_collection',
            ]);
        });
    }
};
```

- [ ] **Step 2: Run the migration**

```bash
php artisan tenants:migrate --path=database/migrations/tenant/2026_04_24_000001_add_reschedule_charges_to_loan_settings.php
```

Expected: `Migrated: 2026_04_24_000001_add_reschedule_charges_to_loan_settings`

- [ ] **Step 3: Commit**

```bash
git add database/migrations/tenant/2026_04_24_000001_add_reschedule_charges_to_loan_settings.php
git commit -m "feat: migration — add reschedule charge columns to loan_settings"
```

---

## Task 2: Migration — add audit columns to `loan_reschedules`

**Files:**
- Create: `database/migrations/tenant/2026_04_24_000002_add_reschedule_audit_columns_to_loan_reschedules.php`

- [ ] **Step 1: Create the migration file**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'tenant';

    public function up(): void
    {
        Schema::connection('tenant')->table('loan_reschedules', function (Blueprint $table) {
            $table->json('fees_applied')->nullable()->after('interest_waived');
            $table->unsignedInteger('old_product_id')->nullable()->after('fees_applied');
            $table->unsignedInteger('new_product_id')->nullable()->after('old_product_id');
        });
    }

    public function down(): void
    {
        Schema::connection('tenant')->table('loan_reschedules', function (Blueprint $table) {
            $table->dropColumn(['fees_applied', 'old_product_id', 'new_product_id']);
        });
    }
};
```

- [ ] **Step 2: Run the migration**

```bash
php artisan tenants:migrate --path=database/migrations/tenant/2026_04_24_000002_add_reschedule_audit_columns_to_loan_reschedules.php
```

Expected: `Migrated: 2026_04_24_000002_add_reschedule_audit_columns_to_loan_reschedules`

- [ ] **Step 3: Commit**

```bash
git add database/migrations/tenant/2026_04_24_000002_add_reschedule_audit_columns_to_loan_reschedules.php
git commit -m "feat: migration — add fees_applied and product audit columns to loan_reschedules"
```

---

## Task 3: Update `LoanSetting` model and `UpdateLoanSettingsRequest`

**Files:**
- Modify: `app/Tenant/Modules/Settings/Models/LoanSetting.php`
- Modify: `app/Http/Requests/Tenant/UpdateLoanSettingsRequest.php`

- [ ] **Step 1: Write the failing validation test**

Create `tests/Unit/UpdateLoanSettingsRescheduleRulesTest.php`:

```php
<?php

namespace Tests\Unit;

use App\Http\Requests\Tenant\UpdateLoanSettingsRequest;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\TestCase;

class UpdateLoanSettingsRescheduleRulesTest extends TestCase
{
    private function validate(array $data): \Illuminate\Validation\Validator
    {
        return Validator::make($data, (new UpdateLoanSettingsRequest)->rules());
    }

    public function test_valid_reschedule_fee_flat_passes(): void
    {
        $v = $this->validate([
            'reschedule_fee_enabled'    => true,
            'reschedule_fee_type'       => 'flat',
            'reschedule_fee_amount'     => 500,
            'reschedule_fee_collection' => 'savings',
        ]);
        $this->assertFalse($v->fails(), implode(', ', $v->errors()->all()));
    }

    public function test_invalid_fee_type_fails(): void
    {
        $v = $this->validate(['reschedule_fee_type' => 'fixed']);
        $this->assertTrue($v->fails());
        $this->assertTrue($v->errors()->has('reschedule_fee_type'));
    }

    public function test_invalid_collection_method_fails(): void
    {
        $v = $this->validate(['reschedule_fee_collection' => 'deduct']);
        $this->assertTrue($v->fails());
        $this->assertTrue($v->errors()->has('reschedule_fee_collection'));
    }

    public function test_invalid_basis_fails(): void
    {
        $v = $this->validate(['reschedule_fee_basis' => 'loan_amount']);
        $this->assertTrue($v->fails());
        $this->assertTrue($v->errors()->has('reschedule_fee_basis'));
    }

    public function test_valid_percentage_fee_with_basis_passes(): void
    {
        $v = $this->validate([
            'reschedule_product_change_fee_type'   => 'percentage',
            'reschedule_product_change_fee_amount' => 2.5,
            'reschedule_product_change_fee_basis'  => 'outstanding_balance',
        ]);
        $this->assertFalse($v->fails(), implode(', ', $v->errors()->all()));
    }

    public function test_negative_fee_amount_fails(): void
    {
        $v = $this->validate(['reschedule_fee_amount' => -10]);
        $this->assertTrue($v->fails());
        $this->assertTrue($v->errors()->has('reschedule_fee_amount'));
    }
}
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
php artisan test --filter=UpdateLoanSettingsRescheduleRulesTest
```

Expected: FAIL — `reschedule_fee_type` and friends are unknown rules

- [ ] **Step 3: Add validation rules to `UpdateLoanSettingsRequest`**

In `app/Http/Requests/Tenant/UpdateLoanSettingsRequest.php`, append to the `rules()` array:

```php
// Reschedule fee settings
'reschedule_fee_income_account_id'              => 'nullable|integer',
'reschedule_fee_enabled'                        => 'nullable|boolean',
'reschedule_fee_type'                           => 'nullable|string|in:flat,percentage',
'reschedule_fee_amount'                         => 'nullable|numeric|min:0',
'reschedule_fee_basis'                          => 'nullable|string|in:outstanding_balance,new_principal,original_disbursed',
'reschedule_fee_collection'                     => 'nullable|string|in:savings,capitalize,cash',

'reschedule_product_change_fee_enabled'         => 'nullable|boolean',
'reschedule_product_change_fee_type'            => 'nullable|string|in:flat,percentage',
'reschedule_product_change_fee_amount'          => 'nullable|numeric|min:0',
'reschedule_product_change_fee_basis'           => 'nullable|string|in:outstanding_balance,new_principal,original_disbursed',
'reschedule_product_change_fee_collection'      => 'nullable|string|in:savings,capitalize,cash',

'reschedule_same_product_fee_enabled'           => 'nullable|boolean',
'reschedule_same_product_fee_type'              => 'nullable|string|in:flat,percentage',
'reschedule_same_product_fee_amount'            => 'nullable|numeric|min:0',
'reschedule_same_product_fee_basis'             => 'nullable|string|in:outstanding_balance,new_principal,original_disbursed',
'reschedule_same_product_fee_collection'        => 'nullable|string|in:savings,capitalize,cash',

'reschedule_other_charges_enabled'              => 'nullable|boolean',
'reschedule_other_charges_type'                 => 'nullable|string|in:flat,percentage',
'reschedule_other_charges_amount'               => 'nullable|numeric|min:0',
'reschedule_other_charges_basis'                => 'nullable|string|in:outstanding_balance,new_principal,original_disbursed',
'reschedule_other_charges_collection'           => 'nullable|string|in:savings,capitalize,cash',
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
php artisan test --filter=UpdateLoanSettingsRescheduleRulesTest
```

Expected: PASS (5 tests)

- [ ] **Step 5: Update `LoanSetting` model**

In `app/Tenant/Modules/Settings/Models/LoanSetting.php`:

Add to `$fillable` (after `'topup_auto_disbursement'`):
```php
'reschedule_fee_income_account_id',
'reschedule_fee_enabled',
'reschedule_fee_type',
'reschedule_fee_amount',
'reschedule_fee_basis',
'reschedule_fee_collection',
'reschedule_product_change_fee_enabled',
'reschedule_product_change_fee_type',
'reschedule_product_change_fee_amount',
'reschedule_product_change_fee_basis',
'reschedule_product_change_fee_collection',
'reschedule_same_product_fee_enabled',
'reschedule_same_product_fee_type',
'reschedule_same_product_fee_amount',
'reschedule_same_product_fee_basis',
'reschedule_same_product_fee_collection',
'reschedule_other_charges_enabled',
'reschedule_other_charges_type',
'reschedule_other_charges_amount',
'reschedule_other_charges_basis',
'reschedule_other_charges_collection',
```

Add to `$casts`:
```php
'reschedule_fee_income_account_id'         => 'integer',
'reschedule_fee_enabled'                   => 'boolean',
'reschedule_fee_amount'                    => 'decimal:4',
'reschedule_product_change_fee_enabled'    => 'boolean',
'reschedule_product_change_fee_amount'     => 'decimal:4',
'reschedule_same_product_fee_enabled'      => 'boolean',
'reschedule_same_product_fee_amount'       => 'decimal:4',
'reschedule_other_charges_enabled'         => 'boolean',
'reschedule_other_charges_amount'          => 'decimal:4',
```

Add to the `$defaults` array inside `currentForBranch()` (after `'topup_auto_disbursement' => false`):
```php
'reschedule_fee_enabled'                   => false,
'reschedule_fee_type'                      => 'flat',
'reschedule_fee_amount'                    => 0,
'reschedule_fee_collection'                => 'cash',
'reschedule_product_change_fee_enabled'    => false,
'reschedule_product_change_fee_type'       => 'flat',
'reschedule_product_change_fee_amount'     => 0,
'reschedule_product_change_fee_collection' => 'cash',
'reschedule_same_product_fee_enabled'      => false,
'reschedule_same_product_fee_type'         => 'flat',
'reschedule_same_product_fee_amount'       => 0,
'reschedule_same_product_fee_collection'   => 'cash',
'reschedule_other_charges_enabled'         => false,
'reschedule_other_charges_type'            => 'flat',
'reschedule_other_charges_amount'          => 0,
'reschedule_other_charges_collection'      => 'cash',
```

- [ ] **Step 6: Run lint**

```bash
composer lint
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add app/Tenant/Modules/Settings/Models/LoanSetting.php \
        app/Http/Requests/Tenant/UpdateLoanSettingsRequest.php \
        tests/Unit/UpdateLoanSettingsRescheduleRulesTest.php
git commit -m "feat: add reschedule charge fields to LoanSetting model and request validation"
```

---

## Task 4: Update `LoanReschedule` model

**Files:**
- Modify: `app/Tenant/Modules/Loans/Models/LoanReschedule.php`

- [ ] **Step 1: Add new columns to `$fillable`**

In `app/Tenant/Modules/Loans/Models/LoanReschedule.php`, add to `$fillable`:
```php
'fees_applied',
'old_product_id',
'new_product_id',
```

- [ ] **Step 2: Add casts**

Add to `$casts`:
```php
'fees_applied'    => 'array',
'old_product_id'  => 'integer',
'new_product_id'  => 'integer',
```

- [ ] **Step 3: Commit**

```bash
git add app/Tenant/Modules/Loans/Models/LoanReschedule.php
git commit -m "feat: add fees_applied and product audit fields to LoanReschedule model"
```

---

## Task 5: Implement `computeRescheduleFees()` in `LoanRescheduleService` (TDD)

**Files:**
- Create: `tests/Unit/RescheduleFeeComputationTest.php`
- Modify: `app/Tenant/Modules/Loans/Services/LoanRescheduleService.php`

- [ ] **Step 1: Write the failing unit tests**

Create `tests/Unit/RescheduleFeeComputationTest.php`:

```php
<?php

namespace Tests\Unit;

use App\Tenant\Modules\Loans\Models\Loan;
use App\Tenant\Modules\Loans\Services\LoanRescheduleService;
use App\Tenant\Modules\Settings\Models\LoanSetting;
use Mockery;
use PHPUnit\Framework\TestCase;

class RescheduleFeeComputationTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
    }

    private function makeService(): LoanRescheduleService
    {
        $scheduleGen  = Mockery::mock(\App\Tenant\Modules\Loans\Contracts\ScheduleGeneratorServiceInterface::class);
        $holidaySvc   = Mockery::mock(\App\Tenant\Modules\Settings\Services\HolidayService::class);
        $loanAcctSvc  = Mockery::mock(\App\Tenant\Modules\Accounting\Services\LoanAccountingService::class);

        return new LoanRescheduleService($scheduleGen, $holidaySvc, $loanAcctSvc);
    }

    private function makeLoan(int $productId = 1, float $disbursed = 100000): Loan
    {
        $loan = Mockery::mock(Loan::class)->makePartial();
        $loan->loan_product_id     = $productId;
        $loan->net_disbursed_amount = $disbursed;
        return $loan;
    }

    private function makeSettings(array $overrides = []): LoanSetting
    {
        $s = new LoanSetting;
        // safe defaults (all disabled)
        $s->reschedule_fee_enabled                   = false;
        $s->reschedule_fee_type                      = 'flat';
        $s->reschedule_fee_amount                    = 0;
        $s->reschedule_fee_basis                     = null;
        $s->reschedule_fee_collection                = 'cash';
        $s->reschedule_product_change_fee_enabled    = false;
        $s->reschedule_product_change_fee_type       = 'flat';
        $s->reschedule_product_change_fee_amount     = 0;
        $s->reschedule_product_change_fee_basis      = null;
        $s->reschedule_product_change_fee_collection = 'cash';
        $s->reschedule_same_product_fee_enabled      = false;
        $s->reschedule_same_product_fee_type         = 'flat';
        $s->reschedule_same_product_fee_amount       = 0;
        $s->reschedule_same_product_fee_basis        = null;
        $s->reschedule_same_product_fee_collection   = 'cash';
        $s->reschedule_other_charges_enabled         = false;
        $s->reschedule_other_charges_type            = 'flat';
        $s->reschedule_other_charges_amount          = 0;
        $s->reschedule_other_charges_basis           = null;
        $s->reschedule_other_charges_collection      = 'cash';
        foreach ($overrides as $k => $v) {
            $s->$k = $v;
        }
        return $s;
    }

    public function test_no_fees_when_all_disabled(): void
    {
        $svc      = $this->makeService();
        $loan     = $this->makeLoan(productId: 1);
        $settings = $this->makeSettings();
        $snapshot = ['outstanding_balance' => 50000.0];
        $params   = [];

        $result = $svc->computeRescheduleFees($loan, $settings, $params, $snapshot, 50000.0);

        $this->assertSame(0.0, $result['capitalize_total']);
        $this->assertEmpty($result['fees_detail']);
    }

    public function test_flat_reschedule_fee_always_applied_when_enabled(): void
    {
        $svc      = $this->makeService();
        $loan     = $this->makeLoan(productId: 1);
        $settings = $this->makeSettings([
            'reschedule_fee_enabled'    => true,
            'reschedule_fee_type'       => 'flat',
            'reschedule_fee_amount'     => 500.0,
            'reschedule_fee_collection' => 'cash',
        ]);
        $snapshot = ['outstanding_balance' => 50000.0];

        $result = $svc->computeRescheduleFees($loan, $settings, [], $snapshot, 50000.0);

        $this->assertCount(1, $result['fees_detail']);
        $this->assertSame(500.0, $result['fees_detail'][0]['amount']);
        $this->assertSame('cash', $result['fees_detail'][0]['collection']);
        $this->assertSame(0.0, $result['capitalize_total']);
    }

    public function test_percentage_fee_against_outstanding_balance(): void
    {
        $svc      = $this->makeService();
        $loan     = $this->makeLoan(productId: 1, disbursed: 100000.0);
        $settings = $this->makeSettings([
            'reschedule_fee_enabled'    => true,
            'reschedule_fee_type'       => 'percentage',
            'reschedule_fee_amount'     => 2.0,    // 2%
            'reschedule_fee_basis'      => 'outstanding_balance',
            'reschedule_fee_collection' => 'savings',
        ]);
        $snapshot = ['outstanding_balance' => 60000.0];

        $result = $svc->computeRescheduleFees($loan, $settings, [], $snapshot, 55000.0);

        // 2% of 60000 = 1200
        $this->assertEqualsWithDelta(1200.0, $result['fees_detail'][0]['amount'], 0.01);
    }

    public function test_percentage_fee_against_new_principal(): void
    {
        $svc      = $this->makeService();
        $loan     = $this->makeLoan(productId: 1);
        $settings = $this->makeSettings([
            'reschedule_fee_enabled'    => true,
            'reschedule_fee_type'       => 'percentage',
            'reschedule_fee_amount'     => 1.0,
            'reschedule_fee_basis'      => 'new_principal',
            'reschedule_fee_collection' => 'cash',
        ]);
        $snapshot = ['outstanding_balance' => 60000.0];

        $result = $svc->computeRescheduleFees($loan, $settings, [], $snapshot, 55000.0);

        // 1% of 55000 = 550
        $this->assertEqualsWithDelta(550.0, $result['fees_detail'][0]['amount'], 0.01);
    }

    public function test_percentage_fee_against_original_disbursed(): void
    {
        $svc      = $this->makeService();
        $loan     = $this->makeLoan(productId: 1, disbursed: 80000.0);
        $settings = $this->makeSettings([
            'reschedule_fee_enabled'    => true,
            'reschedule_fee_type'       => 'percentage',
            'reschedule_fee_amount'     => 0.5,
            'reschedule_fee_basis'      => 'original_disbursed',
            'reschedule_fee_collection' => 'cash',
        ]);
        $snapshot = ['outstanding_balance' => 60000.0];

        $result = $svc->computeRescheduleFees($loan, $settings, [], $snapshot, 55000.0);

        // 0.5% of 80000 = 400
        $this->assertEqualsWithDelta(400.0, $result['fees_detail'][0]['amount'], 0.01);
    }

    public function test_capitalize_collection_adds_to_capitalize_total(): void
    {
        $svc      = $this->makeService();
        $loan     = $this->makeLoan(productId: 1);
        $settings = $this->makeSettings([
            'reschedule_fee_enabled'    => true,
            'reschedule_fee_type'       => 'flat',
            'reschedule_fee_amount'     => 300.0,
            'reschedule_fee_collection' => 'capitalize',
        ]);
        $snapshot = ['outstanding_balance' => 50000.0];

        $result = $svc->computeRescheduleFees($loan, $settings, [], $snapshot, 50000.0);

        $this->assertSame(300.0, $result['capitalize_total']);
    }

    public function test_product_change_fee_fires_only_when_product_changes(): void
    {
        $svc  = $this->makeService();
        $loan = $this->makeLoan(productId: 1);

        $settings = $this->makeSettings([
            'reschedule_product_change_fee_enabled'    => true,
            'reschedule_product_change_fee_type'       => 'flat',
            'reschedule_product_change_fee_amount'     => 1000.0,
            'reschedule_product_change_fee_collection' => 'cash',
        ]);
        $snapshot = ['outstanding_balance' => 50000.0];

        // Same product — fee should NOT fire
        $result = $svc->computeRescheduleFees($loan, $settings, ['new_loan_product_id' => 1], $snapshot, 50000.0);
        $this->assertEmpty($result['fees_detail']);

        // Different product — fee SHOULD fire
        $result = $svc->computeRescheduleFees($loan, $settings, ['new_loan_product_id' => 2], $snapshot, 50000.0);
        $this->assertCount(1, $result['fees_detail']);
        $this->assertSame(1000.0, $result['fees_detail'][0]['amount']);
    }

    public function test_same_product_fee_fires_only_when_product_unchanged(): void
    {
        $svc  = $this->makeService();
        $loan = $this->makeLoan(productId: 1);

        $settings = $this->makeSettings([
            'reschedule_same_product_fee_enabled'    => true,
            'reschedule_same_product_fee_type'       => 'flat',
            'reschedule_same_product_fee_amount'     => 200.0,
            'reschedule_same_product_fee_collection' => 'savings',
        ]);
        $snapshot = ['outstanding_balance' => 50000.0];

        // Same product (or no new product specified) — fee fires
        $result = $svc->computeRescheduleFees($loan, $settings, [], $snapshot, 50000.0);
        $this->assertCount(1, $result['fees_detail']);

        // Different product — fee does NOT fire
        $result = $svc->computeRescheduleFees($loan, $settings, ['new_loan_product_id' => 2], $snapshot, 50000.0);
        $this->assertEmpty($result['fees_detail']);
    }

    public function test_other_charges_fire_only_when_admin_flag_set(): void
    {
        $svc  = $this->makeService();
        $loan = $this->makeLoan();

        $settings = $this->makeSettings([
            'reschedule_other_charges_enabled'    => true,
            'reschedule_other_charges_type'       => 'flat',
            'reschedule_other_charges_amount'     => 150.0,
            'reschedule_other_charges_collection' => 'cash',
        ]);
        $snapshot = ['outstanding_balance' => 50000.0];

        // No admin flag — does NOT fire
        $result = $svc->computeRescheduleFees($loan, $settings, [], $snapshot, 50000.0);
        $this->assertEmpty($result['fees_detail']);

        // Admin flag present — fires
        $result = $svc->computeRescheduleFees($loan, $settings, ['apply_other_charges' => true], $snapshot, 50000.0);
        $this->assertCount(1, $result['fees_detail']);
        $this->assertSame(150.0, $result['fees_detail'][0]['amount']);
    }
}
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
php artisan test --filter=RescheduleFeeComputationTest
```

Expected: FAIL — `computeRescheduleFees` method does not exist

- [ ] **Step 3: Add `computeRescheduleFees()` to `LoanRescheduleService`**

Add this `public` method to `LoanRescheduleService` (before the `private` helpers section):

```php
/**
 * Compute all applicable reschedule fees.
 *
 * @param  float  $newPrincipal  Base new principal (post arrear-cap/waivers, pre fee capitalisation)
 * @return array{capitalize_total: float, fees_detail: list<array{name: string, amount: float, collection: string}>}
 */
public function computeRescheduleFees(
    Loan $loan,
    LoanSetting $settings,
    array $params,
    array $snapshot,
    float $newPrincipal,
): array {
    $capitalizeTotal = 0.0;
    $feesDetail      = [];

    $isProductChange = isset($params['new_loan_product_id'])
        && (int) $params['new_loan_product_id'] !== (int) $loan->loan_product_id;

    $candidates = [
        [
            'name'       => 'Reschedule Fee',
            'enabled'    => (bool) $settings->reschedule_fee_enabled,
            'type'       => (string) ($settings->reschedule_fee_type ?? 'flat'),
            'amount'     => (float) ($settings->reschedule_fee_amount ?? 0),
            'basis'      => (string) ($settings->reschedule_fee_basis ?? ''),
            'collection' => (string) ($settings->reschedule_fee_collection ?? 'cash'),
            'applies'    => true,
        ],
        [
            'name'       => 'Product Change Fee',
            'enabled'    => (bool) $settings->reschedule_product_change_fee_enabled,
            'type'       => (string) ($settings->reschedule_product_change_fee_type ?? 'flat'),
            'amount'     => (float) ($settings->reschedule_product_change_fee_amount ?? 0),
            'basis'      => (string) ($settings->reschedule_product_change_fee_basis ?? ''),
            'collection' => (string) ($settings->reschedule_product_change_fee_collection ?? 'cash'),
            'applies'    => $isProductChange,
        ],
        [
            'name'       => 'Same Product Fee',
            'enabled'    => (bool) $settings->reschedule_same_product_fee_enabled,
            'type'       => (string) ($settings->reschedule_same_product_fee_type ?? 'flat'),
            'amount'     => (float) ($settings->reschedule_same_product_fee_amount ?? 0),
            'basis'      => (string) ($settings->reschedule_same_product_fee_basis ?? ''),
            'collection' => (string) ($settings->reschedule_same_product_fee_collection ?? 'cash'),
            'applies'    => ! $isProductChange,
        ],
        [
            'name'       => 'Other Charges',
            'enabled'    => (bool) $settings->reschedule_other_charges_enabled,
            'type'       => (string) ($settings->reschedule_other_charges_type ?? 'flat'),
            'amount'     => (float) ($settings->reschedule_other_charges_amount ?? 0),
            'basis'      => (string) ($settings->reschedule_other_charges_basis ?? ''),
            'collection' => (string) ($settings->reschedule_other_charges_collection ?? 'cash'),
            'applies'    => (bool) ($params['apply_other_charges'] ?? false),
        ],
    ];

    foreach ($candidates as $candidate) {
        if (! $candidate['enabled'] || ! $candidate['applies']) {
            continue;
        }

        $amount = $candidate['type'] === 'percentage'
            ? $this->resolveBasisAmount($candidate['basis'], $snapshot, $newPrincipal, $loan) * ($candidate['amount'] / 100)
            : (float) $candidate['amount'];

        $amount = round($amount, 2);

        if ($amount <= 0) {
            continue;
        }

        $feesDetail[] = [
            'name'       => $candidate['name'],
            'amount'     => $amount,
            'collection' => $candidate['collection'],
        ];

        if ($candidate['collection'] === 'capitalize') {
            $capitalizeTotal = round($capitalizeTotal + $amount, 2);
        }
    }

    return [
        'capitalize_total' => $capitalizeTotal,
        'fees_detail'      => $feesDetail,
    ];
}

private function resolveBasisAmount(string $basis, array $snapshot, float $newPrincipal, Loan $loan): float
{
    return match ($basis) {
        'outstanding_balance' => (float) $snapshot['outstanding_balance'],
        'new_principal'       => $newPrincipal,
        'original_disbursed'  => (float) ($loan->net_disbursed_amount ?? 0),
        default               => (float) $snapshot['outstanding_balance'],
    };
}
```

Also add the `LoanSetting` import at the top of the file:
```php
use App\Tenant\Modules\Settings\Models\LoanSetting;
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
php artisan test --filter=RescheduleFeeComputationTest
```

Expected: PASS (9 tests)

- [ ] **Step 5: Run full test suite**

```bash
php artisan test
```

Expected: all passing, no regressions

- [ ] **Step 6: Commit**

```bash
git add app/Tenant/Modules/Loans/Services/LoanRescheduleService.php \
        tests/Unit/RescheduleFeeComputationTest.php
git commit -m "feat: add computeRescheduleFees() to LoanRescheduleService (TDD)"
```

---

## Task 6: Add `postRescheduleFeeAccountingEntries()` and wire fees into `execute()`

**Files:**
- Modify: `app/Tenant/Modules/Loans/Services/LoanRescheduleService.php`

- [ ] **Step 1: Add `postRescheduleFeeAccountingEntries()` method**

Add this private method to `LoanRescheduleService`:

```php
private function postRescheduleFeeAccountingEntries(
    Loan $loan,
    LoanProduct $product,
    LoanSetting $settings,
    array $feesDetail,
    Carbon $rescheduleDate,
    int $actorId,
): void {
    $incomeAccountId = (int) ($settings->reschedule_fee_income_account_id ?? 0);

    if (! $incomeAccountId) {
        return; // No income account configured — skip accounting silently
    }

    foreach ($feesDetail as $fee) {
        if ($fee['collection'] === 'capitalize') {
            // Capitalize fees are posted here as a separate JE:
            // DR Loan Portfolio / CR Reschedule Fee Income
            if (! $product->loan_portfolio_account_id) {
                continue;
            }

            $narration = "Reschedule fee capitalised – {$loan->loan_no} ({$fee['name']}): {$fee['amount']}";
            $this->loanAccounting->postJournalEntry(
                loan: $loan,
                typeCode: 'LOAN_RSC_FEE',
                narration: $narration,
                lines: [
                    $this->loanAccounting->line((int) $product->loan_portfolio_account_id, $fee['amount'], 0.0, $narration, $loan->id),
                    $this->loanAccounting->line($incomeAccountId, 0.0, $fee['amount'], $narration, $loan->id),
                ],
                date: $rescheduleDate,
                actorId: $actorId,
            );
        } elseif ($fee['collection'] === 'savings') {
            // DR Member Savings Liability (GL 2111) / CR Reschedule Fee Income
            $savingsGl = \App\Tenant\Modules\Accounting\Models\ChartOfAccount::on('tenant')
                ->where('gl_code', '2111')
                ->first();

            if (! $savingsGl) {
                continue;
            }

            // Deduct from member's savings account balance
            $savings = \App\Tenant\Modules\Savings\Models\SavingsAccount::on('tenant')
                ->where('member_id', $loan->member_id)
                ->where('status', 'active')
                ->orderByDesc('balance')
                ->first();

            if ($savings && (float) $savings->balance >= $fee['amount']) {
                $savings->balance = round((float) $savings->balance - $fee['amount'], 2);
                $savings->save();

                \App\Tenant\Modules\Transactions\Models\Transaction::create([
                    'reference'        => 'RSC-FEE-'.date('Ymd').'-'.mt_rand(10000, 99999),
                    'member_id'        => $loan->member_id,
                    'type'             => 'charge_deduction',
                    'amount'           => $fee['amount'],
                    'payment_mode'     => 'system',
                    'deposited_by'     => 'System (Reschedule Fee)',
                    'transaction_date' => $rescheduleDate->toDateString(),
                    'account_id'       => $savings->id,
                    'account_type'     => \App\Tenant\Modules\Savings\Models\SavingsAccount::class,
                    'narration'        => "Reschedule fee deducted from savings – {$loan->loan_no} ({$fee['name']})",
                    'created_by'       => $actorId,
                ]);
            }

            $narration = "Reschedule fee (savings) – {$loan->loan_no} ({$fee['name']}): {$fee['amount']}";
            $this->loanAccounting->postJournalEntry(
                loan: $loan,
                typeCode: 'LOAN_RSC_FEE',
                narration: $narration,
                lines: [
                    $this->loanAccounting->line((int) $savingsGl->id, $fee['amount'], 0.0, $narration, $loan->id),
                    $this->loanAccounting->line($incomeAccountId, 0.0, $fee['amount'], $narration, $loan->id),
                ],
                date: $rescheduleDate,
                actorId: $actorId,
            );
        } elseif ($fee['collection'] === 'cash') {
            // DR Charges Receivable / CR Reschedule Fee Income
            if (! $product->charges_receivable_account_id) {
                continue;
            }

            $narration = "Reschedule fee (cash) – {$loan->loan_no} ({$fee['name']}): {$fee['amount']}";
            $this->loanAccounting->postJournalEntry(
                loan: $loan,
                typeCode: 'LOAN_RSC_FEE',
                narration: $narration,
                lines: [
                    $this->loanAccounting->line((int) $product->charges_receivable_account_id, $fee['amount'], 0.0, $narration, $loan->id),
                    $this->loanAccounting->line($incomeAccountId, 0.0, $fee['amount'], $narration, $loan->id),
                ],
                date: $rescheduleDate,
                actorId: $actorId,
            );
        }
    }
}
```

- [ ] **Step 2: Wire fees into `execute()`**

In `LoanRescheduleService::execute()`, make the following changes:

**a)** After `$calculation = $this->calculateNewTerms(...)` and before `$scheduleResult = $this->scheduleGenerator->generate(...)`, add:

```php
// Load branch settings and compute reschedule fees
$settings    = LoanSetting::currentForBranch($loan->branch_id ?? 0);
$feesResult  = $this->computeRescheduleFees($loan, $settings, $params, $snapshot, $calculation['new_principal']);
$finalPrincipal = round($calculation['new_principal'] + $feesResult['capitalize_total'], 2);
```

**b)** Change the `$scheduleResult = $this->scheduleGenerator->generate(...)` call to use `$finalPrincipal` instead of `$calculation['new_principal']`:

```php
$scheduleResult = $this->scheduleGenerator->generate(
    $finalPrincipal,                              // ← was $calculation['new_principal']
    $calculation['new_tenor'],
    (string) ($product->interest_method ?? 'flat'),
    (string) ($product->repayment_structure ?? 'equal_installment'),
    $calculation['new_rate'],
    (string) ($product->interest_period ?? 'monthly'),
    (string) ($product->repayment_cycle ?? 'monthly'),
);
```

**c)** In `LoanReschedule::create([...])`, add `fees_applied`, `old_product_id`, and `new_product_id` to the array:

```php
'fees_applied'   => $feesResult['fees_detail'] ?: null,
'old_product_id' => $loan->loan_product_id,
'new_product_id' => isset($params['new_loan_product_id']) && (int) $params['new_loan_product_id'] !== (int) $loan->loan_product_id
    ? (int) $params['new_loan_product_id']
    : null,
```

**d)** In the `$updateData` array for `$loan->update(...)`, add product change handling:

```php
// Apply product change if requested
if (isset($params['new_loan_product_id']) && (int) $params['new_loan_product_id'] !== (int) $loan->loan_product_id) {
    $updateData['loan_product_id'] = (int) $params['new_loan_product_id'];
    // Reload product for new schedule generation
    $product = LoanProduct::on('tenant')->findOrFail((int) $params['new_loan_product_id']);
}
```

> Note: place this block just before `$loan->update($updateData)`.

**e)** After `$this->postRescheduleAccountingEntries(...)`, add:

```php
// Post fee accounting entries (savings, cash, and capitalize)
$this->postRescheduleFeeAccountingEntries(
    loan: $loan,
    product: $product,
    settings: $settings,
    feesDetail: $feesResult['fees_detail'],
    rescheduleDate: $rescheduleDate,
    actorId: $actorId,
);
```

- [ ] **Step 3: Run full test suite**

```bash
php artisan test
```

Expected: all tests pass, no regressions

- [ ] **Step 4: Run lint**

```bash
composer lint
```

- [ ] **Step 5: Commit**

```bash
git add app/Tenant/Modules/Loans/Services/LoanRescheduleService.php
git commit -m "feat: apply reschedule charges in execute() with accounting entries"
```

---

## Task 7: Frontend — update `loanSettingsApi.ts` types

**Files:**
- Modify: `src/tenant/apis/settings/loanSettingsApi.ts`

- [ ] **Step 1: Add new fields to `LoanSetting` interface**

In `src/tenant/apis/settings/loanSettingsApi.ts`, extend the `LoanSetting` interface:

```typescript
export type RescheduleChargeType = 'flat' | 'percentage'
export type RescheduleChargeBasis = 'outstanding_balance' | 'new_principal' | 'original_disbursed'
export type RescheduleChargeCollection = 'savings' | 'capitalize' | 'cash'

export interface LoanSetting {
  id: number
  branch_id: number
  min_approvers: number
  max_approvers: number

  auto_penalty: boolean
  penalty_grace_days: number
  loan_cycle_limit: number
  charge_deduction_mode: string
  repayment_allocation_order:
    | 'principal_interest_penalties_charges'
    | 'interest_principal_penalties_charges'
    | 'penalties_charges_interest_principal'
    | 'penalties_charges_principal_interest'

  allow_top_up: boolean
  allow_reschedule: boolean
  max_reschedule_count: number
  topup_repayment_basis: 'principal' | 'principal_interest' | 'outstanding_balance'
  topup_min_percentage: number
  topup_auto_disbursement: boolean

  // Reschedule charge settings
  reschedule_fee_income_account_id: number | null

  reschedule_fee_enabled: boolean
  reschedule_fee_type: RescheduleChargeType
  reschedule_fee_amount: number
  reschedule_fee_basis: RescheduleChargeBasis | null
  reschedule_fee_collection: RescheduleChargeCollection

  reschedule_product_change_fee_enabled: boolean
  reschedule_product_change_fee_type: RescheduleChargeType
  reschedule_product_change_fee_amount: number
  reschedule_product_change_fee_basis: RescheduleChargeBasis | null
  reschedule_product_change_fee_collection: RescheduleChargeCollection

  reschedule_same_product_fee_enabled: boolean
  reschedule_same_product_fee_type: RescheduleChargeType
  reschedule_same_product_fee_amount: number
  reschedule_same_product_fee_basis: RescheduleChargeBasis | null
  reschedule_same_product_fee_collection: RescheduleChargeCollection

  reschedule_other_charges_enabled: boolean
  reschedule_other_charges_type: RescheduleChargeType
  reschedule_other_charges_amount: number
  reschedule_other_charges_basis: RescheduleChargeBasis | null
  reschedule_other_charges_collection: RescheduleChargeCollection
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /path/to/mfuko-pro-frontend-2026 && pnpm type-check
```

Expected: no type errors

- [ ] **Step 3: Commit**

```bash
git add src/tenant/apis/settings/loanSettingsApi.ts
git commit -m "feat: add reschedule charge fields to LoanSetting TypeScript interface"
```

---

## Task 8: Frontend — update `useGeneralLoanSettings.ts`

**Files:**
- Modify: `src/tenant/modules/settings/composables/useGeneralLoanSettings.ts`

- [ ] **Step 1: Add new fields to the composable**

Replace the `LoanSettingsForm` interface and `form` reactive state. Add after the existing `topup_auto_disbursement` fields:

```typescript
// Add to LoanSettingsForm interface
interface LoanSettingsForm {
  // ... existing fields unchanged ...
  charge_deduction_mode: string
  repayment_allocation_order: RepaymentAllocationOrder
  min_approvers: number
  max_approvers: number
  allow_top_up: boolean
  allow_reschedule: boolean
  auto_penalty: boolean
  penalty_grace_days: number
  loan_cycle_limit: number
  max_reschedule_count: number
  topup_repayment_basis: 'principal' | 'principal_interest' | 'outstanding_balance'
  topup_min_percentage: number
  topup_auto_disbursement: boolean

  // Reschedule charge settings
  reschedule_fee_income_account_id: number | null

  reschedule_fee_enabled: boolean
  reschedule_fee_type: 'flat' | 'percentage'
  reschedule_fee_amount: number
  reschedule_fee_basis: string | null
  reschedule_fee_collection: 'savings' | 'capitalize' | 'cash'

  reschedule_product_change_fee_enabled: boolean
  reschedule_product_change_fee_type: 'flat' | 'percentage'
  reschedule_product_change_fee_amount: number
  reschedule_product_change_fee_basis: string | null
  reschedule_product_change_fee_collection: 'savings' | 'capitalize' | 'cash'

  reschedule_same_product_fee_enabled: boolean
  reschedule_same_product_fee_type: 'flat' | 'percentage'
  reschedule_same_product_fee_amount: number
  reschedule_same_product_fee_basis: string | null
  reschedule_same_product_fee_collection: 'savings' | 'capitalize' | 'cash'

  reschedule_other_charges_enabled: boolean
  reschedule_other_charges_type: 'flat' | 'percentage'
  reschedule_other_charges_amount: number
  reschedule_other_charges_basis: string | null
  reschedule_other_charges_collection: 'savings' | 'capitalize' | 'cash'
}
```

Add new defaults to the `form` reactive (after `topup_auto_disbursement: false`):

```typescript
  max_reschedule_count: 3,

  reschedule_fee_income_account_id: null,

  reschedule_fee_enabled: false,
  reschedule_fee_type: 'flat' as const,
  reschedule_fee_amount: 0,
  reschedule_fee_basis: null,
  reschedule_fee_collection: 'cash' as const,

  reschedule_product_change_fee_enabled: false,
  reschedule_product_change_fee_type: 'flat' as const,
  reschedule_product_change_fee_amount: 0,
  reschedule_product_change_fee_basis: null,
  reschedule_product_change_fee_collection: 'cash' as const,

  reschedule_same_product_fee_enabled: false,
  reschedule_same_product_fee_type: 'flat' as const,
  reschedule_same_product_fee_amount: 0,
  reschedule_same_product_fee_basis: null,
  reschedule_same_product_fee_collection: 'cash' as const,

  reschedule_other_charges_enabled: false,
  reschedule_other_charges_type: 'flat' as const,
  reschedule_other_charges_amount: 0,
  reschedule_other_charges_basis: null,
  reschedule_other_charges_collection: 'cash' as const,
```

Add all new fields to `toPayload()` return object (same names, same cast patterns as existing fields).

Also add to the composable a `chartAccountOptions` ref and a `loadChartAccounts` function:

```typescript
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'

// Add alongside other refs at module level
const chartAccountOptions = ref<Array<{ id: number; name: string }>>([])
let accountsLoaded = false

// Add inside useGeneralLoanSettings() return, and call in fetchSettings()
async function loadChartAccounts() {
  if (accountsLoaded) return
  try {
    const res = await chartOfAccountsApi.list({ list: 1 })
    chartAccountOptions.value = (res.data?.data ?? []).map((a: any) => ({
      id: a.id,
      name: `${a.code ?? a.gl_code ?? ''} — ${a.name}`,
    }))
    accountsLoaded = true
  } catch {
    // non-fatal — account picker will be empty
  }
}
```

Call `void loadChartAccounts()` inside `fetchSettings()` after the existing settings fetch.

Return `chartAccountOptions` and `loadChartAccounts` from the composable.

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/settings/composables/useGeneralLoanSettings.ts
git commit -m "feat: add reschedule charge fields and chart account loader to useGeneralLoanSettings"
```

---

## Task 9: Frontend — add rescheduling settings UI to `ApprovalWorkflowDrawer.vue`

**Files:**
- Modify: `src/tenant/modules/settings/loan-products/ApprovalWorkflowDrawer.vue`

- [ ] **Step 1: Update the script imports**

In `<script setup lang="ts">`, destructure the new values from the composable:

```typescript
const {
  showDrawer, loading, saving, form, chartAccountOptions,
  fetchSettings, openDrawer, closeDrawer, save,
} = useGeneralLoanSettings()
```

- [ ] **Step 2: Replace the "Loan Rescheduling Settings" section in the template**

Find the block that currently reads:
```html
<!-- Section: Loan Rescheduling Settings -->
<div class="flex items-center gap-2 pb-1 border-b border-neutral-200 dark:border-neutral-700">
  <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-100">Loan Rescheduling Settings</h2>
</div>
```

Replace it with the full rescheduling settings section:

```html
<!-- Section: Loan Rescheduling Settings -->
<div class="flex items-center gap-2 pb-1 border-b border-neutral-200 dark:border-neutral-700">
  <h2 class="text-base font-bold text-neutral-800 dark:text-neutral-100">Loan Rescheduling Settings</h2>
</div>

<!-- Allow Reschedule + Max Count -->
<div class="grid grid-cols-2 gap-3">
  <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
    <label class="flex items-center justify-between cursor-pointer">
      <div class="space-y-0.5">
        <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Allow Rescheduling</span>
        <p class="text-xs text-neutral-500">Enable globally for this branch.</p>
      </div>
      <input v-model="form.allow_reschedule" type="checkbox"
        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600 dark:bg-gray-700" />
    </label>
  </div>
  <div class="space-y-2">
    <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Max Reschedule Count</Label>
    <input v-model.number="form.max_reschedule_count" type="number" min="1"
      class="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800" />
    <p class="text-[11px] text-neutral-400">Maximum times a loan can be rescheduled.</p>
  </div>
</div>

<!-- Reschedule Fee Income GL Account -->
<div class="space-y-2">
  <Label class="text-xs font-medium text-neutral-500 uppercase tracking-wider">
    Reschedule Fee Income Account
    <span class="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">GL</span>
  </Label>
  <SearchableSelect
    v-model="(form.reschedule_fee_income_account_id as any)"
    :options="chartAccountOptions"
    placeholder="Select income account…"
  />
  <p class="text-[11px] text-neutral-400">All four reschedule charges post income to this account.</p>
</div>

<!-- Charges Table -->
<div class="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
  <!-- Table header -->
  <div class="grid bg-neutral-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:bg-neutral-800"
       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
    <div>Charge</div>
    <div>Type</div>
    <div>Amount / Rate</div>
    <div>Basis (if %)</div>
    <div>Collection</div>
    <div class="text-center">On</div>
  </div>

  <!-- Row: Reschedule Fee -->
  <div class="grid items-center border-t border-neutral-100 px-3 py-2.5 transition-opacity dark:border-neutral-800"
       :class="{ 'opacity-45': !form.reschedule_fee_enabled }"
       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
    <div>
      <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Reschedule Fee</div>
      <div class="text-[10px] text-neutral-400">Every reschedule</div>
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="form.reschedule_fee_type" :options="[{id:'flat',name:'Flat'},{id:'percentage',name:'%'}]"
        :disabled="!form.reschedule_fee_enabled" />
    </div>
    <div class="pr-2">
      <input v-model.number="form.reschedule_fee_amount" type="number" min="0" :disabled="!form.reschedule_fee_enabled"
        class="block w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-nfuko-primary disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="(form.reschedule_fee_basis as any)"
        :options="[{id:'outstanding_balance',name:'Outstanding Balance'},{id:'new_principal',name:'New Principal'},{id:'original_disbursed',name:'Original Disbursed'}]"
        :disabled="!form.reschedule_fee_enabled || form.reschedule_fee_type !== 'percentage'"
        placeholder="—" />
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="form.reschedule_fee_collection"
        :options="[{id:'savings',name:'Savings'},{id:'capitalize',name:'Capitalize'},{id:'cash',name:'Cash'}]"
        :disabled="!form.reschedule_fee_enabled" />
    </div>
    <div class="flex justify-center">
      <input v-model="form.reschedule_fee_enabled" type="checkbox"
        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600" />
    </div>
  </div>

  <!-- Row: Product Change Fee -->
  <div class="grid items-center border-t border-neutral-100 px-3 py-2.5 transition-opacity dark:border-neutral-800"
       :class="{ 'opacity-45': !form.reschedule_product_change_fee_enabled }"
       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
    <div>
      <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Product Change Fee</div>
      <div class="text-[10px] text-neutral-400">Different product selected</div>
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="form.reschedule_product_change_fee_type" :options="[{id:'flat',name:'Flat'},{id:'percentage',name:'%'}]"
        :disabled="!form.reschedule_product_change_fee_enabled" />
    </div>
    <div class="pr-2">
      <input v-model.number="form.reschedule_product_change_fee_amount" type="number" min="0"
        :disabled="!form.reschedule_product_change_fee_enabled"
        class="block w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-nfuko-primary disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="(form.reschedule_product_change_fee_basis as any)"
        :options="[{id:'outstanding_balance',name:'Outstanding Balance'},{id:'new_principal',name:'New Principal'},{id:'original_disbursed',name:'Original Disbursed'}]"
        :disabled="!form.reschedule_product_change_fee_enabled || form.reschedule_product_change_fee_type !== 'percentage'"
        placeholder="—" />
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="form.reschedule_product_change_fee_collection"
        :options="[{id:'savings',name:'Savings'},{id:'capitalize',name:'Capitalize'},{id:'cash',name:'Cash'}]"
        :disabled="!form.reschedule_product_change_fee_enabled" />
    </div>
    <div class="flex justify-center">
      <input v-model="form.reschedule_product_change_fee_enabled" type="checkbox"
        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600" />
    </div>
  </div>

  <!-- Row: Same Product Fee -->
  <div class="grid items-center border-t border-neutral-100 px-3 py-2.5 transition-opacity dark:border-neutral-800"
       :class="{ 'opacity-45': !form.reschedule_same_product_fee_enabled }"
       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
    <div>
      <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Same Product Fee</div>
      <div class="text-[10px] text-neutral-400">Same product kept</div>
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="form.reschedule_same_product_fee_type" :options="[{id:'flat',name:'Flat'},{id:'percentage',name:'%'}]"
        :disabled="!form.reschedule_same_product_fee_enabled" />
    </div>
    <div class="pr-2">
      <input v-model.number="form.reschedule_same_product_fee_amount" type="number" min="0"
        :disabled="!form.reschedule_same_product_fee_enabled"
        class="block w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-nfuko-primary disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="(form.reschedule_same_product_fee_basis as any)"
        :options="[{id:'outstanding_balance',name:'Outstanding Balance'},{id:'new_principal',name:'New Principal'},{id:'original_disbursed',name:'Original Disbursed'}]"
        :disabled="!form.reschedule_same_product_fee_enabled || form.reschedule_same_product_fee_type !== 'percentage'"
        placeholder="—" />
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="form.reschedule_same_product_fee_collection"
        :options="[{id:'savings',name:'Savings'},{id:'capitalize',name:'Capitalize'},{id:'cash',name:'Cash'}]"
        :disabled="!form.reschedule_same_product_fee_enabled" />
    </div>
    <div class="flex justify-center">
      <input v-model="form.reschedule_same_product_fee_enabled" type="checkbox"
        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600" />
    </div>
  </div>

  <!-- Row: Other Charges (admin-armed, amber tint) -->
  <div class="grid items-center border-t border-amber-200 bg-amber-50 px-3 py-2.5 transition-opacity dark:border-amber-800 dark:bg-amber-950/30"
       :class="{ 'opacity-45': !form.reschedule_other_charges_enabled }"
       style="grid-template-columns: 1fr 80px 90px 150px 100px 44px; gap: 0;">
    <div>
      <div class="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
        Other Charges
        <span class="rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white">Admin</span>
      </div>
      <div class="text-[10px] text-amber-700 dark:text-amber-400">Applied manually per reschedule</div>
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="form.reschedule_other_charges_type" :options="[{id:'flat',name:'Flat'},{id:'percentage',name:'%'}]"
        :disabled="!form.reschedule_other_charges_enabled" />
    </div>
    <div class="pr-2">
      <input v-model.number="form.reschedule_other_charges_amount" type="number" min="0"
        :disabled="!form.reschedule_other_charges_enabled"
        class="block w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-nfuko-primary disabled:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800" />
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="(form.reschedule_other_charges_basis as any)"
        :options="[{id:'outstanding_balance',name:'Outstanding Balance'},{id:'new_principal',name:'New Principal'},{id:'original_disbursed',name:'Original Disbursed'}]"
        :disabled="!form.reschedule_other_charges_enabled || form.reschedule_other_charges_type !== 'percentage'"
        placeholder="—" />
    </div>
    <div class="pr-2">
      <SearchableSelect v-model="form.reschedule_other_charges_collection"
        :options="[{id:'savings',name:'Savings'},{id:'capitalize',name:'Capitalize'},{id:'cash',name:'Cash'}]"
        :disabled="!form.reschedule_other_charges_enabled" />
    </div>
    <div class="flex justify-center">
      <input v-model="form.reschedule_other_charges_enabled" type="checkbox"
        class="h-5 w-5 rounded border-gray-300 text-nfuko-primary focus:ring-nfuko-primary dark:border-gray-600" />
    </div>
  </div>
</div>
```

- [ ] **Step 3: Run TypeScript check**

```bash
pnpm type-check
```

Expected: no errors

- [ ] **Step 4: Open the drawer in the browser and verify**

Navigate to `tenant/settings/loans`, open the **Loan Reschedule & Topup Settings** drawer. Confirm:
- "Loan Rescheduling Settings" section header appears below "Allow Loan Top-Ups"
- Allow Rescheduling toggle + Max Reschedule Count input render
- GL account picker renders (populated with chart accounts)
- 4-row charges table renders; rows are greyed when toggle is off
- Basis dropdown is disabled when type = Flat
- Saving the form completes without error

- [ ] **Step 5: Commit**

```bash
git add src/tenant/modules/settings/loan-products/ApprovalWorkflowDrawer.vue
git commit -m "feat: add loan rescheduling settings UI to ApprovalWorkflowDrawer"
```

---

## Task 10: Final integration check

- [ ] **Step 1: Run the full backend test suite**

```bash
composer test
```

Expected: lint passes + all tests pass

- [ ] **Step 2: Run frontend type-check and lint**

```bash
pnpm type-check && pnpm lint
```

Expected: no errors

- [ ] **Step 3: Manual smoke test — settings save round-trip**

1. Open `tenant/settings/loans` → Loan Reschedule & Topup Settings drawer
2. Enable "Reschedule Fee", set type = Flat, amount = 500, collection = Savings
3. Enable "Product Change Fee", set type = %, rate = 2, basis = Outstanding Balance, collection = Capitalize
4. Select a GL income account
5. Click Save → toast "Loan settings saved successfully." appears
6. Close and re-open drawer → all values persist

- [ ] **Step 4: Manual smoke test — fee applied on reschedule**

1. Find an active loan with at least one paid installment
2. Reschedule it via the reschedule flow
3. After execution, verify in the journal entries that a `LOAN_RSC_FEE` entry exists
4. Verify the `loan_reschedules` row has `fees_applied` populated with the correct fee amounts

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git add -p   # stage only intentional changes
git commit -m "feat: loan rescheduling settings — final cleanup"
```
