# Design: Stop the lying loan-charge UI in General Charges (Gap 2)

**Date:** 2026-05-14
**Scope:** Backend (`mfuko-pro-backend-2026`) — drop `loan_product_ids` column + `on_loan_application` from the validation enum, hard-delete decorative rows. Frontend (`mfuko-pro-frontend-2026`) — remove the "Loan Products" multiselect from the General Charges Create form, drop the dead options from constants, add a discoverability banner to the existing loan-charges page.
**Status:** Approved (sections 1–3 of the brainstorm)

---

## Problem

The General Charges UI today lets admins tick "Loan Products" on a charge whose `application = on_loan_application` and stores those product IDs as a `loan_product_ids` JSON column on `general_charges`. **No loan service ever reads that column.** Loans run a completely separate charge system: `loan_charges` (table, definitions) ↔ `loan_product_charge` (pivot) ↔ `loan_products`. `LoanDisbursementService`, `LoanRepaymentService`, `LoanRescheduleService`, and `LoanWriteOffService` all consult that legacy table directly and post journal entries by GL-code lookup, bypassing `ChargeApplicationService` / `ChargeJournalService` entirely.

Concrete consequence today: any General Charge created with `application=on_loan_application` and one or more loan products selected has **zero effect on disbursement, repayment, or write-off** — it's completely decorative. Admins waste time configuring it, support gets confused tickets, and the UI silently lies.

The loan-charge system, separately, is mature and richer than `general_charges`. It has a `category` enum (`processing_fee` / `disbursement_fee` / `penalty` / `late_fee` / `appraisal_fee` / `insurance` / `other`), a `frequency` enum, `grace_days`, `max_value` + `max_value_type` caps, and **two** GL accounts (`income_account_id` and `receivable_account_id`) where `general_charges` only has one. A dedicated admin UI at `tenant/settings/loan-charges` already exists and works correctly with a backing `LoanChargeController` resource (`routes/tenant_api.php` lines 163–164).

---

## Decision

**Keep the two systems separate. Stop the lying UI.**

The General Charges UI becomes savings-and-registration only. Loan-charge admin lives where it already works correctly — at `tenant/settings/loan-charges`. No unification, no migrations of behaviour, no risk to the loan disbursement/repayment/penalty paths. We add a small breadcrumb / banner on the General Charges page pointing users at the dedicated loan-charges page so anyone who arrived there expecting to configure loans gets redirected without confusion.

This is option C from the audit. Selected because:
1. The loan-charge model is genuinely richer than `general_charges` (category enum, dual GLs, frequency, grace_days). Folding it into `general_charges` would either bloat the shared model with loan-only columns or lose information.
2. The dedicated loan-charges UI is already shipped, used, and tested.
3. Maximum honesty for minimum surgery. Zero changes to loan posting code.

---

## Architecture overview

```
BEFORE                                          AFTER
──────                                          ─────

tenant/settings/general-charges                 tenant/settings/general-charges
  application: ▾                                  application: ▾
    On Shares                                      On Shares
    On Registration                                On Registration
    On Loan Application  ← LIES                    Other
    Other                                        where_to_apply: ▾  (when application=other)
  loan_product_ids: ▢▢▢  ← DEAD                    Savings
                                                   Shares
                                                 Saving Products: ▢▢▢
                                                 Apply on: deposit/withdraw/transfer
                                                 ─────────────────────────────────
                                                 ↳ banner: "Managing loan charges? →
                                                   Loan Charges page"

tenant/settings/loan-charges                    tenant/settings/loan-charges
  (existing, working)                             (unchanged — already canonical)
  ── LoanChargeController                         ── LoanChargeController
  ── loan_charges (definitions)                   ── loan_charges (definitions)
  ── loan_product_charge (pivot)                  ── loan_product_charge (pivot)
  ── LoanDisbursementService reads ───┐           ── LoanDisbursementService reads ───┐
                                      ▼                                               ▼
                                   journal entries (unchanged)                     journal entries (unchanged)
```

---

## Components — File map

### Backend (`mfuko-pro-backend-2026`)

| Action | File | Change |
|---|---|---|
| Create | `database/migrations/tenant/2026_05_14_000001_drop_loan_product_ids_from_general_charges.php` | (1) Hard-delete any row from `general_charges` where `application='on_loan_application'` OR `loan_product_ids` is non-null and non-empty (JSON length > 0). Log the deleted count. (2) Drop the `loan_product_ids` column. `down()` recreates the column nullable but does NOT restore the deleted data — documented in the doc-comment as intentional, because the data was decorative. |
| Modify | `app/Tenant/Modules/Savings/Models/GeneralCharge.php` | Remove `'loan_product_ids'` from `$fillable` and `$casts`. |
| Modify | `app/Tenant/Http/Controllers/Api/V1/GeneralChargeController.php` | In `validateChargePayload`: drop the two `loan_product_ids` validation rules; drop `'on_loan_application'` from the `application` enum's `in:` list. In `store` and `update`: drop `'loan_product_ids' => $validated['loan_product_ids'] ?? []` from the create/update payload arrays. |
| Modify | `app/Tenant/Services/GeneralChargeService.php` | In `generalChargeList` and `generalChargeDetail`: remove the `leftJoin('loan_products AS lp', …JSON_CONTAINS…)` clauses. Change the `products` `CONCAT_WS` to use only the savings-product `GROUP_CONCAT(DISTINCT sp.name …)` (no two-half concatenation). Drop `'lp.name'` from the `dynamic_search_db_query` field list. |
| Modify | `app/Tenant/Services/GeneralChargeUpdateOrCreateService.php` | Drop the `'loan_product_ids' => normalizeIds(...)` line. |
| Modify | `database/factories/GeneralChargeFactory.php` | Remove `'loan_product_ids' => null,`. Verify `'application' => 'other'` (current factory default; no change needed). |
| Create | `tests/Tenant/Charges/RemoveLoanFromGeneralChargesTest.php` | Pest test file with the four scenarios listed in the Testing section below. |

### Frontend (`mfuko-pro-frontend-2026`)

| Action | File | Change |
|---|---|---|
| Modify | `src/tenant/modules/settings/constants.ts` | Remove `{ id: 'on_loan_application', name: 'On Loan Application' }` from `APPLICATION_OPTIONS`. Remove `{ id: 'loans', name: 'Loans' }` from `WHERE_TO_APPLY_OPTIONS`. |
| Modify | `src/tenant/modules/settings/general-charges/Create.vue` | Remove the entire "Loan Products" field declaration (currently `name: 'loan_product_ids'`, ~lines 108–122). No other field changes needed — the dependsOn chain collapses cleanly once the options it points at are gone. |
| Modify | `src/tenant/modules/settings/general-charges/Index.vue` | Inside `resolveAllProducts(item)`: drop the `loan_products` / `loan_product_id(s)` branches; keep only the savings-product lookup. Drop `loan_product_ids` from the `idKeys` array. Drop `loanProductOptions` from the `useGeneralCharges` destructure (verify nothing else still uses it). Add a banner row below the page header: `<router-link :to="{ name: 'tenant-settings-loan-charges' }">Managing loan charges? Go to the Loan Charges page →</router-link>` styled as a subtle info banner (Tailwind `bg-blue-50/dark:bg-blue-900/30`, `text-sm`). The route name `tenant-settings-loan-charges` is the canonical one already used by sibling pages like `LoanProductCreate.vue` and `LoanProductChargesStep.vue`. |
| Modify | `src/tenant/modules/settings/composables/useGeneralCharges.ts` | Remove the `loanProductOptions` ref and its `loan-products` fetch inside `fetchOptions` (verify call sites in Index.vue and Create.vue are gone first). In `applicationLabel(app)`: drop the `'on_loan_application' => 'On Loan Application'` arm. |

### Files explicitly NOT touched (canonical loan path)

- `app/Tenant/Modules/Loans/` (the entire tree, including `LoanCharge`, `LoanAppliedCharge`, `LoanDisbursementService`, `LoanRepaymentService`, `LoanRescheduleService`, `LoanWriteOffService`)
- `app/Tenant/Http/Controllers/Api/V1/LoanChargeController.php`
- The `loan-charges` resource registration in `routes/tenant_api.php`
- The `loan_charges` definitions table and the `loan_product_charge` pivot
- `src/tenant/modules/settings/loan-charges/Index.vue`
- The savings-side machinery just shipped in Gap 4 (`savings_product_charges` pivot, `ChargeCalculatorService`, `ChargeJournalService`, `MemberCharge`, etc.)

---

## Data flow

### After-state UX

```
tenant/settings/general-charges
  ┌─────────────────────────────────────────────────────────┐
  │ General Charges                                         │
  │ Manage SACCO general charges                            │
  │                                                         │
  │ ℹ Managing loan charges? → Loan Charges page  ────────┐ │
  └───────────────────────────────────────────────────────┼─┘
                                                          │
                                                          ▼
                              tenant/settings/loan-charges (existing UI)


"+ Add Charge" drawer:
  Is it a revenue?  ▢ yes / ▢ no
  Charge Name
  Application       ▾ On Shares | On Registration | Other      ← no "On Loan Application"
  Where to Apply    ▾ Savings | Shares          (when Application=Other)   ← no "Loans"
  Saving Products   ▢▢▢                         (when Application=Other AND Where=Savings)
  Apply on          ▢ Deposit ▢ Withdrawal ▢ Transfer   (same condition)
  Charge Type, Amount, Credit Account, etc.
  [Save]
```

### Backend post-submit flow

Unchanged for savings + registration paths (Gap 4 shipped). The only new behavioural difference is that a request body with `application='on_loan_application'` — possibly replayed from an old saved draft or browser tab — is rejected by validation with a 422 carrying an `application` field error. No silent ignore, no half-written rows.

### Migration runtime flow

The migration runs once per tenant during the deploy `composer migrate:tenants` step:

1. Wrap in a single transaction per tenant DB.
2. Count rows where `application='on_loan_application'` OR `JSON_LENGTH(loan_product_ids) > 0`.
3. Delete those rows. (No FK cascade to worry about: `general_charges.id` is not referenced by anything in the loan path; `savings_product_charges.general_charge_id` cascades on delete to satisfy the relational invariant for the savings path, which is what we want — if a row was on the loan path it shouldn't have savings-pivot rows anyway, and even if it does they get cleaned up.)
4. Drop the `loan_product_ids` column.
5. Log `Deleted N decorative rows; dropped loan_product_ids column.` to the migration output so we can confirm on rolling deploy.

---

## Error handling

| Failure | Handling |
|---|---|
| Request submits `application='on_loan_application'` | Laravel 422 with `application` field error from the `in:` rule. Frontend `<Form>` surfaces it inline. |
| Request submits `where_to_apply='loans'` | Laravel 422 with `where_to_apply` field error. |
| Old request still sends `loan_product_ids` in the payload | Validator silently ignores unknown keys (Laravel default). No 422, no insert into the dropped column. |
| Migration cleanup deletes zero rows | Logs `Deleted 0 rows. Dropped column.` No-op is safe. |
| Migration fails to drop the column (e.g. FK reference we missed) | Transaction rolls back; no deletes commit either. Admin investigates and re-runs. Documented in the migration's doc-comment. |
| `down()` is run after `up()` already deleted rows | Recreates the column nullable but does NOT restore deleted data. Intentional and documented. |
| User without loan-charges page access clicks the banner | The destination route's existing auth gate (the loan-charges page already has its own permission middleware) handles it as it does today. The banner is purely a router-link, no new permission concern. |

---

## Testing

### Backend (Pest)

1. **Rejects `application='on_loan_application'`.** `POST /api/v1/tenant/general-charges` with `application='on_loan_application'` + an otherwise valid payload returns 422 with an error key on `application`.
2. **Rejects `where_to_apply='loans'`.** Same shape with `where_to_apply='loans'` returns 422 with an error key on `where_to_apply`.
3. **Listing endpoint works after the column drop.** Seed one savings-event general charge with savings-product pivot rows, `GET /api/v1/tenant/general-charges` returns 200, the row has no `loan_product_ids` key in the response, and the `products` string lists only the savings product name.
4. **Migration cleanup.** Direct migration test: seed three rows — one with `application='on_loan_application'`, one with non-empty `loan_product_ids` JSON, one normal savings-event row. Run the migration. Assert the first two are deleted and the third remains. Assert the `loan_product_ids` column no longer exists on the schema.
5. **Existing loan-charges paths unbroken.** Run the existing `LoanDisbursementGlTest`, `LoanRepaymentReversalTest`, `LoanRescheduleAccountingTest`, `LoanWriteOffGlTest` suites as a regression sweep. No new assertions — just confirm zero failures.

### Frontend (Vitest)

1. **`APPLICATION_OPTIONS` no longer contains `on_loan_application`.** Assertion against the constants export.
2. **`WHERE_TO_APPLY_OPTIONS` no longer contains `loans`.** Assertion against the constants export.
3. **General Charges form does not render a "Loan Products" field for any application value.** Mount Create.vue with every combination of `application` and `where_to_apply`, assert no element matching `[name="loan_product_ids"]` exists in any state.
4. **Banner link points to the loan-charges page.** Mount Index.vue, find the `<router-link>` whose `to` prop equals `{ name: 'tenant-settings-loan-charges' }`. Assert it exists and is visible.

### Manual smoke (post-deploy on staging)

1. Open `tenant/settings/general-charges` → confirm the banner row "Managing loan charges? → Loan Charges page" is visible below the page header.
2. Click the banner → land on `tenant/settings/loan-charges`, existing UI loads correctly with all loan-charge definitions.
3. Open the "+ Add Charge" drawer → confirm no "Loan Products" field exists, no "On Loan Application" in the Application dropdown, no "Loans" in the Where to Apply dropdown.
4. Disburse a loan that has at least one configured `loan_charges` row (created via the existing loan-charges UI). Confirm the JE posts the processing-fee / disbursement-fee correctly. (Sanity: the loan path was not collateral-damaged.)
5. Run `composer migrate:tenants` against the staging tenant set and check the log line counts the rows the migration deleted on each tenant.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Some integration outside the controller still writes `application='on_loan_application'` | Grep finds zero such writers in `app/`. The only remaining caller is `GeneralChargeUpdateOrCreateService`, which goes through the same controller validation. |
| Hard-delete loses admin-intended config | User explicitly chose hard-delete after seeing the alternative; the rows had no functional effect anyway. The migration logs the deletion count so we can see how many tenants had decorative rows. |
| Banner link goes to a route that doesn't exist or 404s | Use the canonical named route `tenant-settings-loan-charges` (defined in `src/tenant/modules/settings/routes.ts:85-86`, already referenced from `LoanProductCreate.vue` and `LoanProductChargesStep.vue`). The Vitest assertion in Testing #4 locks it in. |
| Loan-charges page is permission-gated and the banner pretends it isn't | The banner is just a router-link; route guards still apply downstream. Users without permission see the route's normal denied view. UX nit only — out of scope unless flagged. |
| Frontend caches still serve the old `APPLICATION_OPTIONS` values to long-lived browser tabs | Hard refresh closes any stale state; in any case the backend rejects `on_loan_application`, so worst-case the user sees a 422 inline and re-picks. |

---

## Out of scope (explicit YAGNI)

- Any structural unification of `general_charges` and `loan_charges`. If it ever happens it gets its own design — this work is **not** preparation for it.
- Adding new columns to `general_charges` (no `category`, no `frequency`, no `receivable_account_id`).
- Renaming, restructuring, or improving the `tenant/settings/loan-charges` UI.
- Migrating data between `general_charges` and `loan_charges` in any direction.
- Adjusting how the savings side handles its own pivot (just shipped in Gap 4).
- Any change to journal-entry posting paths on either side.

---

## Execution order

1. Backend: write the migration with the hard-delete + column drop + a Pest test that exercises it directly.
2. Backend: tighten validation (drop `on_loan_application` and `loan_product_ids` rules), prune `GeneralChargeController` payload arrays, prune `GeneralChargeService` JSON_CONTAINS joins, prune `GeneralCharge` model and the factory and the legacy upsert helper. Add the rejection-validation Pest tests.
3. Backend: run the migration locally + the full charge/savings/accounting/member test suites + the four loan-suite regression sweeps. Push.
4. Frontend: prune the constants. Prune Create.vue's loan-product field. Prune Index.vue's `resolveAllProducts` loan branch. Prune `useGeneralCharges` `loanProductOptions`. Add the banner.
5. Frontend: Vitest assertions. Type-check. Push.
6. Smoke test on staging end-to-end with the manual checklist above. Confirm migration deletion count is sensible. Merge.
