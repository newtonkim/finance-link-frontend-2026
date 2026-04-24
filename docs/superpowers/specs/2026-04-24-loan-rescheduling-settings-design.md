# Loan Rescheduling Settings — Design Spec
**Date:** 2026-04-24  
**Status:** Approved

---

## Overview

Add a Loan Rescheduling Settings section to the `ApprovalWorkflowDrawer` in `tenant/settings/loans`. This section lets SACCO admins configure four charge types that are automatically calculated and posted during loan reschedule execution. Each charge has independent enable/disable, type (flat or percentage), percentage basis, and collection method settings.

---

## UI Design

### Placement
Inside `ApprovalWorkflowDrawer.vue`, in the **Loan Rescheduling Settings** section (below the existing Loan Topups section).

### Layout — Compact Table (Option B)

**Row 1 — Controls row (2-column grid):**
- Left: `Allow Rescheduling` toggle card (existing `allow_reschedule` field, now surfaced in the UI)
- Right: `Max Reschedule Count` number input (existing `max_reschedule_count` field, now surfaced)

**Row 2 — GL Account picker:**
- Single `SearchableSelect` for `reschedule_fee_income_account_id` — the shared income account for all 4 reschedule charges
- Pulls from Chart of Accounts (same pattern as loan product account pickers)
- Label: "Reschedule Fee Income Account"
- Help text: "All reschedule charges post income to this account."

**Row 3 — Charges table:**

| Column | Width | Notes |
|---|---|---|
| Charge name + subtitle | flex | Fixed labels, not editable |
| Type | 80px | `SearchableSelect`: Flat / Percentage |
| Amount / Rate | 90px | Number input |
| Basis (if %) | 140px | `SearchableSelect`: Outstanding Balance / New Principal / Original Disbursed — disabled and greyed out when type = Flat |
| Collection | 90px | `SearchableSelect`: Savings / Capitalize / Cash |
| On/Off toggle | 44px | Checkbox; when off, all inputs in the row are disabled and the row is 45% opacity |

**The 4 charge rows (in order):**

| Row | Name | Subtitle | Notes |
|---|---|---|---|
| 1 | Reschedule Fee | Every reschedule | Applied on all reschedules regardless of product |
| 2 | Product Change Fee | Different product | Applied only when member selects a different loan product |
| 3 | Same Product Fee | Same product | Applied only when member reschedules with the existing product |
| 4 | Other Charges | Applied manually by admin | Amber-tinted row; settings toggle *arms* it, admin chooses per-reschedule |

Note: rows 2 and 3 are mutually exclusive at execution time — only one fires per reschedule event.

---

## Data Model

### New columns on `loan_settings` table (tenant migration)

```sql
-- Shared income GL account for all reschedule fees
reschedule_fee_income_account_id   BIGINT UNSIGNED NULL

-- 1. Reschedule Fee (every reschedule)
reschedule_fee_enabled             BOOLEAN NOT NULL DEFAULT FALSE
reschedule_fee_type                VARCHAR(20) NOT NULL DEFAULT 'flat'     -- flat | percentage
reschedule_fee_amount              DECIMAL(15,4) NOT NULL DEFAULT 0
reschedule_fee_basis               VARCHAR(30) NULL                        -- outstanding_balance | new_principal | original_disbursed
reschedule_fee_collection          VARCHAR(20) NOT NULL DEFAULT 'cash'     -- savings | capitalize | cash

-- 2. Product Change Fee
reschedule_product_change_fee_enabled    BOOLEAN NOT NULL DEFAULT FALSE
reschedule_product_change_fee_type       VARCHAR(20) NOT NULL DEFAULT 'flat'
reschedule_product_change_fee_amount     DECIMAL(15,4) NOT NULL DEFAULT 0
reschedule_product_change_fee_basis      VARCHAR(30) NULL
reschedule_product_change_fee_collection VARCHAR(20) NOT NULL DEFAULT 'cash'

-- 3. Same Product Fee
reschedule_same_product_fee_enabled      BOOLEAN NOT NULL DEFAULT FALSE
reschedule_same_product_fee_type         VARCHAR(20) NOT NULL DEFAULT 'flat'
reschedule_same_product_fee_amount       DECIMAL(15,4) NOT NULL DEFAULT 0
reschedule_same_product_fee_basis        VARCHAR(30) NULL
reschedule_same_product_fee_collection   VARCHAR(20) NOT NULL DEFAULT 'cash'

-- 4. Other Charges (admin-armed, applied per-reschedule)
reschedule_other_charges_enabled         BOOLEAN NOT NULL DEFAULT FALSE
reschedule_other_charges_type            VARCHAR(20) NOT NULL DEFAULT 'flat'
reschedule_other_charges_amount          DECIMAL(15,4) NOT NULL DEFAULT 0
reschedule_other_charges_basis           VARCHAR(30) NULL
reschedule_other_charges_collection      VARCHAR(20) NOT NULL DEFAULT 'cash'
```

---

## Backend Changes

### 1. Migration
`database/migrations/tenant/xxxx_add_reschedule_charges_to_loan_settings.php`

Adds the 21 columns above to `loan_settings`. Nullable columns have no default; boolean and varchar columns have safe defaults so existing rows remain valid.

### 2. `LoanSetting` model
- Add all 21 new columns to `$fillable`
- Add casts: booleans → `boolean`, amounts → `decimal:4`, IDs → `integer`
- Add them to the `$defaults` array inside `currentForBranch()` with safe defaults (all fees disabled, amounts 0, collection = cash)

### 3. `UpdateLoanSettingsRequest`
New validation rules:
```php
'reschedule_fee_income_account_id'         => 'nullable|integer|exists:tenant.chart_of_accounts,id',
'reschedule_fee_enabled'                   => 'nullable|boolean',
'reschedule_fee_type'                      => 'nullable|string|in:flat,percentage',
'reschedule_fee_amount'                    => 'nullable|numeric|min:0',
'reschedule_fee_basis'                     => 'nullable|string|in:outstanding_balance,new_principal,original_disbursed',
'reschedule_fee_collection'                => 'nullable|string|in:savings,capitalize,cash',
// ...same pattern for product_change, same_product, other_charges
```

### 4. `LoanRescheduleService` — fee computation

A new private method `computeRescheduleFees(Loan $loan, LoanSetting $settings, array $params, array $snapshot): array` returns:

```php
[
    'capitalize_total'  => float,   // sum of all fees with collection = capitalize
    'fees_detail'       => [        // one entry per applicable enabled fee
        [
            'name'       => string,
            'amount'     => float,
            'collection' => 'savings'|'capitalize'|'cash',
        ]
    ]
]
```

**Fee applicability rules:**
- `reschedule_fee`: always, if enabled
- `product_change_fee`: if enabled AND `params['new_loan_product_id']` differs from `$loan->loan_product_id`
- `same_product_fee`: if enabled AND `params['new_loan_product_id']` is null or equals `$loan->loan_product_id`
- `other_charges`: if enabled AND `params['apply_other_charges'] === true` (admin-driven flag in the execute request)

**Fee amount resolution (per charge):**
- `flat` → use `fee_amount` directly
- `percentage` → apply `fee_amount / 100` against the chosen basis:
  - `outstanding_balance` → `$snapshot['outstanding_balance']`
  - `new_principal` → calculated `new_principal` (after capitalize_arrears / waivers, before fee capitalization)
  - `original_disbursed` → `$loan->net_disbursed_amount`

**Integration into `execute()`:**
1. Call `calculateNewTerms()` to get the base `new_principal` (arrears cap / waivers only)
2. Call `computeRescheduleFees()` with the base `new_principal` as the `new_principal` basis reference
3. Add `capitalize_total` from fees directly to `new_principal` to produce `final_principal`
4. Pass `final_principal` (not the base) into `scheduleGenerator->generate()` — no need to re-run `calculateNewTerms()`
5. Store fee details on `LoanReschedule` record (new JSON column `fees_applied`)
4. After schedule persistence, call `postRescheduleFeeAccountingEntries()` for non-capitalize fees

**Product change handling:**
- If `params['new_loan_product_id']` is provided and differs from current, update `$loan->loan_product_id` within the transaction before schedule generation — the new product's interest method, repayment structure, and rates are used
- Record `old_product_id` and `new_product_id` on the `LoanReschedule` record

### 5. `LoanReschedule` model — new columns
A second tenant migration adds these columns to `loan_reschedules`:
```sql
fees_applied        JSON NULL     -- array of {name, amount, collection} for audit
old_product_id      INT NULL      -- loan_product_id before reschedule
new_product_id      INT NULL      -- loan_product_id after reschedule (null = unchanged)
```
Add all three to `$fillable`; cast `fees_applied` as `array`, IDs as `integer`.

### 6. Accounting entries — `postRescheduleFeeAccountingEntries()`

For each non-capitalize fee in `fees_detail`:

**Collection = `savings`**
```
DR  Member Savings Liability (GL code 2111, looked up via ChartOfAccount::where('gl_code','2111'))
CR  Reschedule Fee Income Account ($settings->reschedule_fee_income_account_id)
```
Also deduct from `SavingsAccount` balance for the loan's member.

**Collection = `cash`**
```
DR  Charges Receivable Account ($loan->loanProduct->charges_receivable_account_id)
CR  Reschedule Fee Income Account ($settings->reschedule_fee_income_account_id)
```

**Collection = `capitalize`** (posted at schedule-generation time, not here)
```
DR  Loan Portfolio Account ($loan->loanProduct->loan_portfolio_account_id)
CR  Reschedule Fee Income Account ($settings->reschedule_fee_income_account_id)
```

Journal entry type code: `LOAN_RSC_FEE`. Narration: `"Reschedule fee – {$loan->loan_no} ({$fee['name']}): {$fee['amount']}"`.

---

## Frontend Changes

### `loanSettingsApi.ts`
Add all 21 new fields to the `LoanSetting` interface (matching DB column names and types).

### `useGeneralLoanSettings.ts`
- Add all 21 fields to `LoanSettingsForm` interface
- Initialize in `form` reactive with safe defaults (all disabled, amounts 0, collection `cash`)
- Include in `toPayload()` return

### `ApprovalWorkflowDrawer.vue`
Add the rescheduling settings section below the "Allow Loan Top-Ups" card and the section divider, inside the existing scroll area. The section contains:
1. Allow Reschedule toggle card + Max Reschedule Count input (2-col grid)
2. GL account `SearchableSelect` for `reschedule_fee_income_account_id`
3. Compact charges table (4 rows × 6 columns as designed above)

The basis `SearchableSelect` is conditionally disabled (`v-bind:disabled`) when the row's `fee_type !== 'percentage'`.

Row inputs are disabled and row opacity is `0.45` when the row's `enabled` is `false`.

---

## API Contract

The existing `PUT /api/v1/tenant/loan-settings` endpoint handles all new fields — no new endpoint needed. The `LoanRescheduleService::execute()` reads settings from `LoanSetting::currentForBranch()` internally.

The reschedule execute endpoint (`POST /api/v1/tenant/loans/{loan}/reschedule`) gains two optional params:
- `new_loan_product_id` (integer|null) — triggers product change
- `apply_other_charges` (boolean, default false) — admin opt-in for Other Charges

---

## Validation Rules Summary

- Fee type: `in:flat,percentage`
- Fee amount: `numeric|min:0`
- Fee basis: required when type = percentage (enforced in request via `required_if:type,percentage`)
- Collection: `in:savings,capitalize,cash`
- Income account: must exist in `chart_of_accounts` if provided

---

## Out of Scope

- Per-loan-product override of reschedule charges (global settings only)
- Partial fee waivers at execution time
- Fee refunds on reschedule reversal
