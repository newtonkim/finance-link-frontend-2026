# Loan Products GL Inline-Create — Design Spec

**Date:** 2026-05-15
**Status:** Approved, awaiting plan

## Problem

The Loan Products edit page (`tenant/settings/loan-products/{id}/edit`) has an **Accounting Mapping** section with 8 GL-account dropdowns. Admins currently have to leave the page, navigate to Chart of Accounts, create the account they need, then come back and pick it from the dropdown. This is the same friction the General Charges Create drawer solved for its single Credit Account field with the `IncomeAccountSelect` widget — admins can search + create + auto-select inline.

We're applying the same UX to all 8 fields here, with the create form locked to the account type that matches each field (so the Loan Portfolio button only creates ASSET accounts, the Interest Income button only creates INCOME accounts, etc.).

## Goal

For each of the 8 GL dropdowns in the Accounting Mapping section, add a small "+ Create new <type> account" trigger right next to the field label. Clicking it opens a single shared `ChartOfAccountForm` modal with:
- `locked-account-type` set to the field's expected type (ASSET or INCOME)
- `default-parent-gl-code` pre-filled for that field's natural parent

On save, refresh the shared accounts list, auto-select the new account into the field that opened the modal, close the modal, toast success.

The existing `SearchableSelect` dropdowns and the form's overall behavior are unchanged.

## Architecture

### Decision: keep SearchableSelect, add a separate trigger

The user explicitly chose **not** to replace `SearchableSelect` with a generalized `ChartAccountSelect`. The dropdown UX stays exactly as it is today. We add a small inline action — `<AccountInlineCreate>` — alongside each field's label.

### One shared modal, eight triggers

Page-level reactive state owns the modal:

```ts
const creatingAccount = ref<{
  open: boolean
  lockedAccountType: 'ASSET' | 'INCOME'
  defaultParentGlCode: string
  prefillName: string
  targetField: keyof Form  // which form key to assign the new account.id to
} | null>(null)
```

Each `AccountInlineCreate` button knows its field's metadata. Click emits `{ accountType, parentGlCode }`. The page handler reads its associated form-field name and sets the modal state.

### Metadata lives in one table

`useLoanProductCreate.ts` already declares field → account_type mappings around lines 255-269. We extend that to a single exported `GL_FIELD_META` array (one source of truth — SOLID/SRP), and the template `v-for`s over it instead of repeating 8 nearly-identical blocks:

| field (form key) | account_type | parent_gl_code | label |
|---|---|---|---|
| loan_portfolio_account_id | ASSET | 11300 | Loan Portfolio Account |
| interest_income_account_id | INCOME | 41100 | Interest Income Account |
| interest_receivable_account_id | ASSET | 11500 | Interest Receivable Account |
| disbursement_account_id | ASSET | 11100 | Disbursement Account |
| penalty_income_account_id | INCOME | 41400 | Penalty Income Account |
| penalty_receivable_account_id | ASSET | 11600 | Penalty Receivable Account |
| charges_income_account_id | INCOME | 42000 | Charges Income Account |
| charges_receivable_account_id | ASSET | 11700 | Charges Receivable Account |

## Components

| Action | File | Responsibility |
|---|---|---|
| Create | `src/tenant/modules/loan-products/components/AccountInlineCreate.vue` | Tiny presentational button. Props: `accountType: 'ASSET'\|'INCOME'`, `parentGlCode?: string`, `label?: string`. Emits `click` with `{ accountType, parentGlCode }`. Renders as a right-aligned text link next to a field label, with `Plus` icon + primary-colored text matching the existing IncomeAccountSelect footer styling. |
| Modify | `src/tenant/modules/loan-products/composables/useLoanProductCreate.ts` | Extend the existing GL-field metadata (lines ~255-269) into a typed `GL_FIELD_META` export, adding `parent_gl_code` per field. |
| Modify | `src/tenant/modules/loan-products/pages/LoanProductCreate.vue` | (1) Import `AccountInlineCreate`, `ChartOfAccountForm`, `GL_FIELD_META`. (2) Add page-level `creatingAccount` ref. (3) Render `<ChartOfAccountForm>` once near the top of the Accounting Mapping section. (4) Replace the 8 hand-rolled field blocks with a `v-for` over `GL_FIELD_META`, each rendering label + `AccountInlineCreate` + the existing `SearchableSelect`. (5) Implement `onRequestCreate(field)` and `onAccountSaved(account)`. |
| Create | `src/tenant/modules/loan-products/__tests__/AccountInlineCreate.spec.ts` | Unit tests for the new component. |
| Create | `src/tenant/modules/loan-products/__tests__/LoanProductCreate.gl-create.spec.ts` | Integration tests for the page-level wiring. |

**Out of scope (deliberately untouched):**
- `SearchableSelect` component itself — keeps working unchanged.
- `ChartOfAccountForm` — already supports `locked-account-type` + `default-parent-gl-code`; no changes.
- `IncomeAccountSelect.vue` on the General Charges drawer — could be DRY'd later but that's scope creep here.
- The 8 form key names — stay the same; we're adding alongside, not renaming.
- Existing per-field error display (`fieldError(...)`) and `glAccountWarnings` — keep working.

## Data Flow

### Page load (unchanged from today)

```
LoanProductCreate.vue mounts
  ↓
useLoanProductCreate.ts:fetchAccounts()
  → GET chart-of-accounts/list?is_postable=1
  → accounts ref populated (single shared list, all types)
  ↓
For each field in GL_FIELD_META:
  → render label + AccountInlineCreate trigger + SearchableSelect (unchanged)
```

### Click "+ Create new asset account" on Loan Portfolio

```
AccountInlineCreate.click
  ↓ emits { accountType: 'ASSET', parentGlCode: '11300' }
onRequestCreate(field)  // page handler reads field.formKey from metadata closure
  ↓
creatingAccount.value = {
  open: true,
  lockedAccountType: 'ASSET',
  defaultParentGlCode: '11300',
  prefillName: '',
  targetField: 'loan_portfolio_account_id',
}
  ↓
<ChartOfAccountForm
  v-model:open="creatingAccount.open"
  :locked-account-type="creatingAccount.lockedAccountType"
  :default-parent-gl-code="creatingAccount.defaultParentGlCode"
  :prefill-name="creatingAccount.prefillName"
  require-parent
  @saved="onAccountSaved"
/>
```

Admin fills GL code, name, parent already defaulted, account_type locked to ASSET. Clicks Save.

### On save

```
ChartOfAccountForm emits 'saved' with the new account
  ↓
onAccountSaved(account)
  ↓
1. await fetchAccounts()                                        // refresh the shared list
2. form.value[creatingAccount.value.targetField] = account.id   // auto-select
3. creatingAccount.value = null                                 // close modal
4. toast.success(`Created ${account.gl_code} - ${account.name}`)
```

The `SearchableSelect` is already bound to `form[targetField]` via v-model, so it updates automatically. The shared `accounts` refresh means any other field can also pick the new account if relevant.

### Edit page

The route `/loan-products/{id}/edit` uses the SAME `LoanProductCreate.vue` component, hydrated with existing values via the page's existing edit-mode logic. No special handling needed.

## Error Handling

| Scenario | Behavior |
|---|---|
| `accounts` fetch fails on mount | Existing behavior preserved — SearchableSelect shows empty list; page-level error display fires. The `+ Create` button stays clickable so admins can recover by creating an account directly. |
| `ChartOfAccountForm` validation error (e.g., duplicate GL code) | Modal stays open; form's own inline error display surfaces the backend message. `onAccountSaved` doesn't fire. Page state intact for retry. |
| `ChartOfAccountForm` save throws (network/500) | Same as above — modal stays open, error surfaces inside the form. Toast not triggered. |
| `fetchAccounts()` after save fails | New account exists on the server but the local list didn't refresh. Show `toast.error('Account created but failed to refresh list — refresh the page to see it.')`. Auto-select is skipped because the new id isn't in `accounts` yet. |
| Admin closes modal mid-edit | `creatingAccount.value = null` — no save fires, no form-field change. Dropdown still shows previous selection. |
| Admin clicks `+ Create` on a different field after one save | Fresh modal opens with the new field's metadata, not the previous one. Verified via test #10. |
| `require-parent` denied by tenant permission/config | Out of our control — `ChartOfAccountForm` honors its existing constraints. |

**No new backend code paths.** Every error path either reuses existing UX (SearchableSelect, ChartOfAccountForm, toast) or is a defensive guard.

## Testing

### Vitest — `AccountInlineCreate.spec.ts`

1. Renders a button with the `Plus` icon and label `Create new asset account` when `accountType='ASSET'`.
2. Renders label `Create new income account` when `accountType='INCOME'`.
3. Custom `label` prop overrides the default.
4. Click emits `click` with `{ accountType, parentGlCode }` matching the props.

### Vitest — `LoanProductCreate.gl-create.spec.ts`

5. Page renders an `AccountInlineCreate` trigger alongside each of the 8 GL fields.
6. Clicking the button on `loan_portfolio_account_id` opens `ChartOfAccountForm` with `lockedAccountType='ASSET'` and `defaultParentGlCode='11300'`.
7. Clicking the button on `interest_income_account_id` opens the modal with `lockedAccountType='INCOME'` and `defaultParentGlCode='41100'`.
8. Simulating `@saved` with a new account: `fetchAccounts` is re-called, `form[targetField]` becomes the new id, modal closes, toast fires.
9. Modal stays open if `@saved` is never emitted (cancel case) — page state preserved.
10. After a successful save, clicking `+ Create` on a different field opens a fresh modal with THAT field's metadata, not the previous one's.

### Composable test — extend existing or add new file

11. `GL_FIELD_META` export contains exactly 8 entries.
12. Each entry has `field`, `type`, `parent_gl_code`, and `label`.
13. Each entry's `type` is either `'ASSET'` or `'INCOME'`.
14. The `parent_gl_code` values match the canonical table (regression guard).

### Manual smoke (Task 8 of the plan)

1. Open `tenant/settings/loan-products/{id}/edit`.
2. Confirm a small "+ Create new <type> account" link appears next to each of the 8 GL field labels.
3. Click on Loan Portfolio's link → modal opens with Account Type locked to ASSET, parent default `11300 - Loans Receivable`.
4. Fill GL code `11310`, name `Test Loan Portfolio`, Save.
5. Modal closes; toast `Created 11310 - Test Loan Portfolio`; Loan Portfolio dropdown reflects the new selection.
6. Click on Interest Income's link → account_type locked to INCOME, parent defaults to `41100`.
7. Try saving with a duplicate GL code → inline error in modal, stays open.
8. Click `+ Create` then close without saving → previous form selection preserved.

## SOLID / DRY rationale

- **SRP**: `AccountInlineCreate` does one thing — render a trigger and emit a click. Page-level state wires modal. `GL_FIELD_META` holds field config.
- **DRY**: Single component reused 8 times via `v-for` over the metadata table. Adding a 9th GL field later means adding one entry to `GL_FIELD_META`, not editing the template.
- **OCP**: Open for extension (new fields = new metadata entries); closed for modification (component doesn't change as fields are added).
- **No duplication with General Charges**: This intentionally does NOT generalize `IncomeAccountSelect` — that's flagged as a future cleanup if multiple call sites grow. For now, the General Charges flow stays as is.

## Risks

- **`v-for` over metadata loses the existing per-field error-display variations** — `penalty_income_account_id`, `penalty_receivable_account_id`, `charges_income_account_id`, and `charges_receivable_account_id` currently display `glAccountWarnings.<field>` BELOW the dropdown. The other 4 don't. The plan must preserve this — either by reading the warning conditionally in the loop, or by keeping the warnings table keyed off the same field name.
- **Test isolation for `LoanProductCreate.gl-create.spec.ts`** — the page imports many heavy children. Mock everything except the bits under test (`ChartOfAccountForm`, `AccountInlineCreate`, the form state). Pattern is identical to `members/__tests__/Create.charges.spec.ts` (committed earlier today) — use it as a template.
- **`ChartOfAccountForm`'s `default-parent-gl-code` assumes the GL code exists** in the parent dropdown. If a tenant has a non-standard chart of accounts (e.g., they renamed `11300` to `11305`), the default won't resolve. The form should still let them pick manually — verify this when running the manual smoke.

## Branches

- Frontend: `feat/loan-products-gl-inline-create` (off main, already cut with this spec).
- Backend: none — purely a frontend change.

## Execution order

Bottom-up so the test for each layer can sit on top of working layers:

1. Extend `useLoanProductCreate.ts` with the typed `GL_FIELD_META` export + composable-level tests for the metadata shape.
2. Create `AccountInlineCreate.vue` + unit tests.
3. Refactor `LoanProductCreate.vue` to v-for over `GL_FIELD_META`, integrate `AccountInlineCreate` + shared `ChartOfAccountForm` modal + handlers.
4. Add integration tests for the page wiring.
5. Push + manual smoke.
