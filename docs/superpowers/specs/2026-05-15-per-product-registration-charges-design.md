# Per-product Registration Charges — Design Spec

**Date:** 2026-05-15
**Status:** Approved, awaiting plan

## Problem

`on_registration` general charges currently apply universally — every active charge fires for every new member as a `MemberCharge` receivable, regardless of the savings product the member opens. There's no way for a SACCO to say "the Account Opening Fee only applies to members opening Standard Savings, not to those opening Children Savings."

Admins also can't see ahead of time which charges will hit a new member: the Create A Sacco Member drawer has a "Transactional charges" field whose helper text was meant to show this, but the underlying endpoint queries a JSON column that was dropped in Gap 4 (`general_charges.saving_product_ids`), so the helper has been silently broken.

## Goal

Add per-product registration charges that:
1. Tie an `on_registration` charge to one or more savings products via the existing `savings_product_charges` pivot (extended with `type='registration'`).
2. On member registration, deduct the matching product's registration charges from the initial deposit (rejecting registration if the deposit is insufficient).
3. Surface the upcoming charges in the Create A Sacco Member drawer so admins can see what will be deducted before they save.

The change must coexist with the existing universal-receivable behavior: charges with no pivot rows keep working exactly as they do today.

## Architecture

### Data model

`savings_product_charges` (the canonical pivot established by Gap 4) gains a new value in its `type` column: `registration`. Rows for product-scoped registration charges share the same shape as deposit/withdraw/transfer rows — `(savings_product_id, general_charge_id, type, name, charge_type, amount, minimum_amount, is_reversible)` — and snapshot the parent `GeneralCharge`'s `name`/`charge_type`/`amount` at write time.

### Two coexisting modes

| Mode | Identifier | Behavior at registration |
|---|---|---|
| Universal | `on_registration` charge with **no** pivot rows of `type='registration'` | Existing behavior: `MemberCharge` receivable for every new member, collected from savings on next deposit |
| Product-scoped | `on_registration` charge with **one or more** pivot rows of `type='registration'` | Fires only when the member's savings account uses one of those products. Deducted upfront from initial deposit. Registration rejected if `initial_deposit < Σ(charges)`. |

A single charge is either universal or product-scoped — never both. `applyRegistrationCharges` (the universal-receivable path) excludes charges that have product-scoped pivot rows so the two modes don't double-charge.

### Resolution

`ChargeCalculatorServiceInterface` gains:

```php
public function resolveForRegistration(int $savingsProductId): array;
```

It returns 0..N matching active charges as plain arrays containing at minimum `general_charge_id`, `name`, `amount`, `credit_account_id`, and `is_reversible`. Unlike `resolveForSavings` (single resolution per event), registration can match multiple charges for the same product, so the return is a list.

## Components

| Layer | File | Change |
|---|---|---|
| Migration | `database/migrations/tenant/2026_05_15_000001_extend_savings_product_charges_type_registration.php` | Extend the `type` column to accept `'registration'`. If column is an ENUM or CHECK constraint, alter it; if a free string column, add a comment and a guarded test. |
| Pivot model | `app/Tenant/Modules/Savings/Models/SavingsProductCharge.php` | Add `'registration'` to any allowed-types constant or cast (if one exists). |
| Calculator interface | `app/Tenant/Modules/Charges/Contracts/ChargeCalculatorServiceInterface.php` | New `resolveForRegistration(int $savingsProductId): array`. |
| Calculator impl | `app/Tenant/Modules/Charges/Services/ChargeCalculatorService.php` | Implement `resolveForRegistration` — join `savings_product_charges` with `general_charges`, filter `savings_product_id=?`, `type='registration'`, `gc.is_active=1`, `gc.deleted_at IS NULL`. |
| Charge controller | `app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php` | Accept `saving_product_ids` in `store()`/`update()` when `application='on_registration'`. Validation: optional list of existing product IDs. Reuse the same upsert path that already writes pivot rows for the `other+savings` lane, but with `trigger_types=['registration']`. |
| Member controller | `app/Tenant/Http/Controllers/Api/V1/MemberController.php` | Two changes: (1) before creating the savings account, resolve product-scoped charges and reject the request with 422 if `initial_deposit < Σ(charges)`. (2) after creating the savings account, post a withdrawal-style transaction for each matched charge (debit savings, credit `credit_account_id`). Wrap inside the existing `DB::transaction`. |
| `applyRegistrationCharges` | Same file | Filter the universal query to `whereDoesntHave('savingsProductCharges', fn($q) => $q->where('type', 'registration'))` so a charge is never both universal and product-scoped. |
| Member dropdown endpoint | `app/Tenant/Services/MemberService.php::GeneralProductChargesDropDownList` | Rewrite to query the canonical pivot (`savings_product_charges` joined to `general_charges` on `type='registration'`). Replaces the dead `whereJsonContains('saving_product_ids', $req->id)` query that broke when Gap 4 dropped the JSON column. |
| Settings Create form | `src/tenant/modules/settings/general-charges/Create.vue` | Extend the "Saving Products" multi-select's `dependsOn` — currently fires for `application=other AND where_to_apply=savings`; add a second condition group for `application=on_registration` (OR semantics). |
| Member Create form | `src/tenant/modules/members/Create.vue` | (1) Split the current `Transactional charges` helper so that field shows ONLY the deposit-event fee. (2) Add a new `general_registration_charges` field **immediately below `Transactional charges`**, **using the same field shape** (the existing schema-driven text input — label, programmatically-set value, red helper text). Label: `General Charge`. Value: the summed registration-charge total formatted as `"<total> (charges)"`. Helper text: itemized breakdown of each contributing charge (`"<name>: <amount>"`, comma-separated), styled identically to the existing Transactional charges helper. Hidden when the watcher returns no registration charges. (3) Add an inline sufficiency hint under `initial_deposit` when deposit < total. Watcher logic extends the existing `watchChangeInProductOrCharges` — same debounce, same API call, populates this second field alongside the first instead of overloading one field with both totals. |

### Out of scope (deliberately untouched)

- `MemberCharge` model and the universal-receivable code path itself (only its query filter changes).
- The deposit/withdraw/transfer pivot rows and `resolveForSavings`.
- `ChargeJournalService` — the posting machinery the deduction reuses.
- Loan-side and on_shares paths.
- Refund/reversal behavior for the new transactions (use existing reversal machinery if needed — no new code).

## Data Flow

### Creating a product-scoped registration charge

1. Admin opens Settings → General Charges → Add.
2. Picks `application = on_registration`, `charge_type = amount`, `amount = 5000`, `credit_account_id = 42500`.
3. Newly-conditional "Saving Products" multi-select renders. Admin selects `[Standard Savings, Children Savings]`.
4. `POST /api/v1/tenant/general-charges` includes `saving_product_ids: [3, 7]`.
5. Backend creates the `general_charges` row, then writes pivot rows `(3, charge_id, 'registration')` and `(7, charge_id, 'registration')`.

### Member registration

```
POST /api/v1/tenant/members  (initial_deposit=20000, savings_product_id=3)
  │
  ├─ Resolve product-scoped registration charges via
  │     ChargeCalculator->resolveForRegistration(3) → [{amount: 5000, credit_account_id: 42500, …}]
  │
  ├─ Sum = 5000.  20000 >= 5000 → PASS
  │     If 20000 < 5000 → 422 { errors: { initial_deposit: ["Initial deposit must be at least UGX 5,000 to cover registration charges."] } }
  │
  ├─ DB::transaction:
  │     ├─ Member::create(...)
  │     ├─ SavingsAccountService::create(..., initial_deposit=20000)
  │     ├─ For each product-scoped charge:
  │     │      Post withdrawal: debit savings account, credit credit_account_id, amount=charge.amount,
  │     │      narration="Registration charge: <name>"
  │     ├─ applyRegistrationCharges(member)  ← unchanged signature; new query filter excludes product-scoped charges
  │     │      (handles universal-receivable charges only)
  │     └─ Share purchase (unchanged)
  │
  └─ Return MemberResource (savings balance = 20000 − 5000 = 15000)
```

### Member Create drawer preview

1. Admin opens Create A Sacco Member drawer.
2. Picks Saving Products = Standard Savings, enters Initial Deposit = 20000.
3. Debounced watcher (`watchChangeInProductOrCharges`, 900ms) fires:
   - Calls `general-product-charges?type=onboarding&id=3` → returns `[{name: "Account Opening Fee", charge_amount: 5000}]`.
   - Populates the new **`General Charge`** field (text input, same shape as `Transactional charges`): `value = "5,000 (charges)"`, helper text `"Registration charges for this product: Account Opening Fee: 5000"`. Field stays hidden when the response is empty.
   - Calls existing `getProductCharges({product_id, amount, type: 'deposit'})` for the deposit-event fee → populates the **`Transactional charges`** field with only that value (no longer summed with registration charges).
4. If `initial_deposit < total general charges`, a red helper appears under the Initial Deposit field: "Initial deposit must be at least UGX X."

## Error Handling

### Backend (member registration)

| Scenario | Response |
|---|---|
| `initial_deposit < Σ(product-scoped charges)` | 422 with `errors.initial_deposit` carrying a message that names the required total |
| Charge resolution fails mid-transaction (DB error) | `DB::transaction` rolls back; member, savings account, and any partial charge transactions reverted; 500 with logged context |
| Charge has `is_active=false` between page-load and submit | Excluded by the resolver (`where is_active=1`); no error, simply not applied |
| Existing member opening an additional account | Same rules apply — product-scoped charges fire on the new product. Reuses same code path. |
| `autoCreateSavingsAccount=false` onboarding setting | No savings account created → no product to scope against → product-scoped charges don't fire. Universal `applyRegistrationCharges` still runs. |

### Backend (charge create/update via Settings)

| Scenario | Response |
|---|---|
| `application='on_registration'` with `saving_product_ids` containing an ID that doesn't exist | 422 with `errors.saving_product_ids.0` or similar |
| `application='on_registration'` with empty/missing `saving_product_ids` | Valid — universal-receivable mode, no pivot rows written |
| Update flips a charge from universal to product-scoped or vice versa | Pivot rewrite: delete old `type='registration'` rows, insert new — same upsert pattern Gap 4 established. Existing `MemberCharge` rows and posted charge transactions from prior registrations are **not** touched: only future registrations are affected. |
| Edit drawer opens an existing product-scoped charge | The drawer must populate the Saving Products multi-select with the products currently associated via `type='registration'` pivot rows. The charge response payload from the listing/detail endpoint must include `saving_product_ids` derived from the pivot (mirror what Gap 4 did for the savings-event lane). |

### Frontend

| Scenario | UX |
|---|---|
| Charge fetch API errors | Helper text cleared, no list shown; admin can still submit (backend revalidates) |
| Admin types `initial_deposit` lower than total registration charges | Red helper under Initial Deposit; Save button remains clickable; backend rejects with the same message on submit |
| Admin changes the savings product after entering initial deposit | Watcher refetches, re-renders the list, re-checks the sufficiency hint |

### Atomicity

The entire member registration — member creation, savings account creation, each charge transaction, share purchase, universal-charge receivables — wraps in the existing `DB::transaction` in `MemberController::register()`. A single failure rolls back everything. No half-created members with partial charge postings.

## Testing

### Backend Pest tests — new file `tests/Tenant/Charges/RegistrationChargesPerProductTest.php`

1. Creates pivot rows with `type='registration'` when `application='on_registration'` + `saving_product_ids` provided.
2. Rejects on_registration charge update when `saving_product_ids` references a non-existent product.
3. Existing on_registration charge with no products keeps universal-receivable behavior (MemberCharge row created).
4. `resolveForRegistration` returns matching active charges for a product.
5. `resolveForRegistration` excludes inactive charges (`is_active=0`).
6. Member registration deducts product-scoped registration charges from initial deposit (asserts savings balance and GL credit).
7. Member registration rejects with 422 when initial deposit is less than product-scoped registration charges total.
8. Member registration applies BOTH product-scoped (deducted) AND universal (receivable) charges in the same registration — no double-charging.
9. Universal-charge filter excludes charges that have `type='registration'` pivot rows (asserts `applyRegistrationCharges` query behavior).
10. Transaction rolls back on charge posting failure (mock the journal service to throw on the second charge; assert member, savings account, and first charge transaction all reverted).

### Backend Pest tests — extending `MemberServiceTest` or new file

11. `general-product-charges?type=onboarding` returns pivot-backed list for a product (confirms the rewritten endpoint uses the pivot, not the dropped JSON column).
12. Endpoint returns empty array for a product with no registration charges.

### Frontend Vitest tests

13. `members/Create.vue` renders the General Charge text input (populated value + helper) when a product with registration charges is selected (mock the API).
14. `members/Create.vue` keeps the General Charge field hidden when the product has no registration charges (empty response).
15. `members/Create.vue` shows the insufficient-deposit hint under Initial Deposit when `initial_deposit < total registration charges`.
16. Transactional charges field shows only the deposit-event fee, no registration charges mixed in — regression test for the split.
17. General Charge field's helper text lists each charge as `"<name>: <amount>"` and reflects the API response order.

### Manual smoke test (Task 12 of the plan)

1. Settings → General Charges → Add charge: `application=on_registration`, amount 5000, linked to "Standard Savings" product. Save.
2. Open Create A Sacco Member, pick Standard Savings + initial_deposit 20000 → confirm a new `General Charge` text input appears directly below `Transactional charges`, populated with the total and a helper line listing the charge by name + amount; confirm `Transactional charges` shows only the deposit-event fee.
3. Try initial_deposit 3000 → confirm red helper; Save → confirm 422 response.
4. Set initial_deposit 20000 → Save → confirm member created, savings balance 15000, configured income GL credited 5000.
5. Create another on_registration charge with NO product (universal mode) → register another member → confirm `MemberCharge` receivable row exists (current behavior preserved).
6. Edit a product-scoped charge to remove all product associations → verify it switches to universal mode for the next registration (pivot rows deleted, future registrations create receivables instead).

## Risks

- **Pivot type-enum extension.** If `savings_product_charges.type` is a strict ENUM, the migration is one ALTER; if it's a CHECK constraint or a free string, the migration shape differs. Investigate the column definition before writing the migration.
- **`watchChangeInProductOrCharges` is debounced and tangled.** The existing function lumps two distinct concerns into one helper. The split risks accidentally regressing the deposit-event helper — the Vitest regression test (#16) guards against this.
- **Atomicity already exists.** The wrap in `DB::transaction` is in place; the only failure mode is forgetting to call the new resolver inside the transaction. The plan must call it INSIDE the transaction so a rejected `initial_deposit` validation rolls back nothing (because no rows have been written yet).

## Out-of-scope follow-ups

These are real but separate concerns flagged during this brainstorm:

- `GeneralChargesCard.vue` line 18 still destructures `loanProductOptions` which the composable no longer returns (Gap 2 cleanup miss).
- The "Reject" policy may want a SACCO-configurable setting later (some tenants might prefer "apply what's available, leave the rest pending"). Not in this scope.
- Reversal/refund machinery for the new registration-charge transactions reuses existing transaction-reversal flow; no new code, but worth a manual sanity check.

## Execution order

Backend first, then frontend, since the frontend depends on the rewritten endpoint and the new pivot type:

1. Migration + pivot model update + tests (backend)
2. Calculator interface + impl (backend)
3. GeneralChargeController validation + pivot upsert (backend)
4. MemberController registration deduction + universal filter (backend)
5. `GeneralProductChargesDropDownList` rewrite (backend)
6. Backend regression sweep + push
7. Settings `Create.vue` — extend dependsOn for `application=on_registration` (frontend)
8. Members `Create.vue` — split helper + new field + sufficiency hint (frontend)
9. Vitest assertions (frontend)
10. Push + manual smoke

## Branches

- Frontend: `feat/per-product-registration-charges` (off main).
- Backend: a sibling branch `feat/per-product-registration-charges` to be cut off backend `main`.
