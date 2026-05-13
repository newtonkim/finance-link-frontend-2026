# Design: Inline Credit Account creation in Create General-Charges drawer

**Date:** 2026-05-13
**Scope:** Frontend (`mfuko-pro-frontend-2026`) — Credit Account selector + nested `ChartOfAccountForm`. Backend (`mfuko-pro-backend-2026`) — one cascade safeguard on `chart_of_accounts.destroy`.
**Status:** Approved

---

## Problem

When configuring a SACCO charge in `src/tenant/modules/settings/general-charges/Create.vue`, the **Credit Account** dropdown only shows existing INCOME accounts. If the income account the operator needs doesn't exist yet (e.g. a new "SMS Notification Fee"), they must abandon the charge form, navigate to `tenant/chart-of-accounts`, create the account there, then come back and re-fill the charge. This is friction-heavy and a frequent workflow.

Letting users create the ledger inline solves the workflow problem but introduces Chart-of-Accounts integrity risks: wrong `account_type`, non-postable header, orphan account (no parent), wrong `normal_balance`, silent duplicates. Without safeguards, an operator could break the chart structure or double-entry posting by, for example, creating an asset account where an income account is required.

---

## Decision

Wire a nested `ChartOfAccountForm` into the Credit Account selector. The form is the existing, already-hardened component (hierarchical GL code generation, auto-derived normal balance, parent dropdown filtered to same-type headers, hidden defaults for `is_postable`/`is_active`/`is_control`/`allow_manual`/`ifrs_category`). We add **no** parallel ledger-creation code path. Defaults are locked to `INCOME` and pre-set to a sensible parent. After save, the dropdown refreshes and auto-selects the new account; the charge drawer stays mounted with all its other state intact.

---

## Architecture overview

```
+--- General Charges drawer (existing) ----------------+
| Charge Type, Amount, Application, ...                |
| Credit Account: [IncomeAccountSelect ▼]              |
|                 ├── 42200 Loan Processing Fees       |
|                 ├── 42300 Account Maintenance Fees   |
|                 ├── ...                              |
|                 ╶───────────────────────────╴        |
|                 └── ➕ Create new income account ────┼──┐
+------------------------------------------------------+  │
                                                          │
       +--- ChartOfAccountForm (nested drawer) --------+  │
       | account_type:    INCOME  (locked, read-only) |◄─┘
       | name:            <prefilled from search>     |
       | subtype:         (free text)                 |
       | normal_balance:  Credit (CR)  (auto/read-only)|
       | parent:          42000 Fee Income (editable, |
       |                  INCOME headers only)        |
       | [Cancel]                          [Save]     |
       +------------------------------------------------+
                  │
                  └── onSaved → refresh dropdown,
                                auto-select new acct,
                                close nested drawer
```

---

## Components

### 1. `IncomeAccountSelect.vue` — new component (frontend)

Path: `src/tenant/modules/settings/general-charges/components/IncomeAccountSelect.vue`

Wraps `SearchableSelect`, fetches its own data, adds the inline-create footer.

**Props:**

| Prop | Type | Required | Purpose |
|---|---|---|---|
| `modelValue` | `number \| null` | yes | Selected `chart_of_accounts.id` |
| `canCreate` | `boolean` | yes (default `false`) | When `false`, the "+ Create new" footer is hidden |
| `placeholder` | `string` | no (default `"Select income account"`) | Passed through |

**Emits:**

| Event | Payload | Purpose |
|---|---|---|
| `update:modelValue` | `number \| null` | Selection change |
| `requestCreate` | `{ prefillName: string }` | User clicked "+ Create new"; parent should open the nested drawer |

**Exposed methods (via `defineExpose`):**

- `refresh(): Promise<void>` — re-fetches the account list. Parent calls this after the nested drawer saves.
- `selectById(id: number): void` — sets `modelValue` to the given id.

**Behavior:**

- On mount: GET `global/chart-of-accounts?account_type=INCOME&is_postable=1&is_active=1`. Sort by `gl_code` ASC.
- Dropdown renders one row per account: `{{ gl_code }} - {{ name }}`.
- Search box (built into `SearchableSelect`) filters client-side.
- **Fuzzy duplicate hint:** when search text length > 2, an account `name` is considered a near-match if it satisfies either rule (case-insensitively, both sides lowercased and trimmed):
  - the search text is a substring of the account name, OR
  - Levenshtein distance between search text and account name is ≤ 2.

  If any near-match exists but no exact-name match exists, render a `Did you mean…?` hint above the regular list, showing up to 2 candidates ordered by Levenshtein distance ascending.
- **Create footer:** if `canCreate=true`, render a separator and one footer row at the bottom of the dropdown:
  - Empty or no-match search → `➕ Create new income account`
  - Non-empty search → `➕ Create "<search-text>" as income account`
  - Clicking the footer emits `requestCreate({ prefillName: searchText })`.

### 2. `Create.vue` — modified (frontend)

Path: `src/tenant/modules/settings/general-charges/Create.vue`

Today this file builds a fields array consumed by the shared `<Form>` component. The Credit Account entry is a generic `type: 'select'` field with a `url` and `data` filter.

**Change:** replace that single entry with a custom-render slot that mounts `IncomeAccountSelect`. The schema-driven `<Form>` already supports custom field types via a `type: 'component'` (verify; if not, add it as a one-line extension to `<Form>`). The field declaration becomes:

```ts
{
  label: 'Credit Account',
  name: 'credit_account_id',
  type: 'component',
  component: IncomeAccountSelect,
  componentProps: { canCreate: profileStore.hasPermission('chart_of_accounts.create') },
  condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val),
}
```

**State managed in `Create.vue` setup:**

```ts
const incomeSelectRef = ref<InstanceType<typeof IncomeAccountSelect> | null>(null)
const creatingAccount = ref<{ open: boolean; prefillName: string }>({ open: false, prefillName: '' })

function onRequestCreate(payload: { prefillName: string }) {
  creatingAccount.value = { open: true, prefillName: payload.prefillName }
}

async function onAccountSaved(newAccount: { id: number; gl_code: string; name: string }) {
  creatingAccount.value.open = false
  await incomeSelectRef.value?.refresh()
  incomeSelectRef.value?.selectById(newAccount.id)
  toast.success(`Created income account ${newAccount.gl_code} — ${newAccount.name}`)
}
```

Template additions inside the drawer body:

```vue
<ChartOfAccountForm
  v-model:open="creatingAccount.open"
  locked-account-type="INCOME"
  default-parent-gl-code="42000"
  require-parent
  :prefill-name="creatingAccount.prefillName"
  @saved="onAccountSaved"
/>
```

### 3. `ChartOfAccountForm.vue` — extended (frontend)

Path: `src/tenant/modules/accounting/components/ChartOfAccountForm.vue`

**Adds four optional props** (no breaking change to existing callers):

| Prop | Type | Default | Behavior |
|---|---|---|---|
| `lockedAccountType` | `'ASSET' \| 'LIABILITY' \| 'EQUITY' \| 'INCOME' \| 'EXPENSE' \| undefined` | `undefined` | When set, `form.account_type` is initialized to it on open. The Account Type `<select>` is replaced with a read-only `<div>` showing the type's friendly label. The reset watcher initializes `account_type` to `lockedAccountType` instead of the current hard-coded `'ASSET'`. |
| `defaultParentGlCode` | `string \| undefined` | `undefined` | When set AND a parent with that `gl_code` exists in the loaded list, pre-select it. Triggers the existing parent watcher → regenerates GL code under that parent. |
| `prefillName` | `string \| undefined` | `undefined` | When set, `form.name` is initialized to it on open. |
| `requireParent` | `boolean` | `false` | When `true`, client-side validation blocks save unless `parent_id` is set. Surfaces an inline error `"Parent account is required"`. |

**Emits change:**

The existing `saved` event currently carries no payload. Extend it to emit the newly-created account record: `{ id, gl_code, name, account_type, parent_id }`. This is purely additive — existing call sites that ignore the payload continue working.

**Backwards compatibility:** all four props are optional. Pages that already use the form (e.g. `ChartOfAccounts.vue`) pass none and get current behavior unchanged.

### 4. `chartOfAccountsApi.store` — unchanged

Existing endpoint `POST /api/v1/tenant/chart-of-accounts`. Payload already covers all required fields. Response shape needs to include the created account row (verify in `ChartOfAccountController::store` — if it currently returns just `{ message }`, extend to return `{ data: $account }`).

### 5. Cascade safeguard — backend addition

Path: `app/Tenant/Http/Controllers/Api/V1/ChartOfAccountController.php` (and/or its service)

Today, `destroy` blocks deletion when an account has children (`cannot_delete_account_with_children`). Add a sibling check:

```php
if (GeneralCharge::on('tenant')->where('credit_account_id', $account->id)->exists()) {
    return response()->json([
        'message' => 'Cannot delete an account referenced by a general charge.',
        'error_code' => 'cannot_delete_account_referenced_by_general_charge',
    ], 422);
}
```

This is one extra check, matches the existing pattern, and is the only backend change needed for this design.

---

## Data flow — golden path

1. Operator opens General Charges drawer → fills Charge Type, Amount → focuses Credit Account.
2. Operator types `SMS Notification Fee` → dropdown shows no matches → footer: `➕ Create "SMS Notification Fee" as income account`.
3. Operator clicks footer. `Create.vue` sets `creatingAccount = { open: true, prefillName: 'SMS Notification Fee' }`.
4. Nested `ChartOfAccountForm` opens with `lockedAccountType='INCOME'`, `defaultParentGlCode='42000'`, `prefillName='SMS Notification Fee'`, `requireParent=true`.
5. Form internals:
   - `account_type` initialized to `'INCOME'`, rendered as read-only `Income` label.
   - Parent dropdown populates with INCOME control accounts (40000, 41000, 41100, 42000, …) — already filtered by the existing per-type filter.
   - `42000 Fee Income` is pre-selected because of `defaultParentGlCode`.
   - GL code auto-generates to the next slot under 42000 (e.g. `42500`).
   - Normal balance auto-derives to `Credit (CR)`, read-only display.
   - Name field pre-populated with `SMS Notification Fee`.
6. Operator (optional) changes parent to `43000 Other Operating Income` — GL code regenerates to next slot under 43000.
7. Operator clicks Save → `chartOfAccountsApi.store(payload)` → 201 `{ data: { id: 137, gl_code: '42500', name: 'SMS Notification Fee', account_type: 'INCOME', parent_id: 87 } }`.
8. `ChartOfAccountForm` emits `saved` with that payload, closes its drawer.
9. `Create.vue` handler:
   - Calls `incomeSelectRef.refresh()` → re-fetches the income-account list.
   - Calls `incomeSelectRef.selectById(137)` → sets `credit_account_id = 137` in the charge form.
   - Shows toast: `Created income account 42500 — SMS Notification Fee`.
10. Operator finishes the charge form → clicks the drawer's Save → `POST /tenant/general-charges` with `credit_account_id: 137` → backend stores the charge.

---

## Error handling

| Failure | Handling |
|---|---|
| ChartOfAccount validation error (e.g. unique gl_code race) | Errors render inline in the nested form via existing `errors.value` pattern. Nested drawer stays open. Charge drawer is untouched. |
| ChartOfAccount network error | Toast error in the nested drawer. User can retry. |
| `IncomeAccountSelect.refresh()` fails after a successful save | Show warning toast: `Account created. Refresh the page to see it in the list.` Still set `credit_account_id` to the returned id (it's valid server-side regardless). |
| User cancels nested drawer | Drawer closes; `creatingAccount.open = false`. Charge drawer continues with prior selection (or empty). No side effects. |
| User without permission opens this drawer | `IncomeAccountSelect` receives `canCreate=false`; the footer doesn't render. API-level permission enforcement is unchanged. |
| `requireParent` save-blocking | Inline error `"Parent account is required"` below the parent dropdown. Save button stays enabled but `handleSubmit` returns early. |

---

## Permissions

- Frontend: `Create.vue` reads `profileStore.hasPermission('chart_of_accounts.create')` (the existing helper used elsewhere in the app). Passes `canCreate` to `IncomeAccountSelect`. If the helper doesn't yet exist for this permission key, add it as a 3-line addition to the profile store — the permission name is the only new identifier.
- Backend: `POST /api/v1/tenant/chart-of-accounts` is already gated by the existing chart-of-accounts permission middleware. The UI gating is a courtesy so non-COA users don't trip a 403 toast.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Operator picks the wrong `account_type` for a charge ledger | `lockedAccountType='INCOME'` — type is rendered as read-only, cannot be changed. |
| Non-postable header created (would silently fail to post) | Hidden default `is_postable=true`, `is_control=false` already in `ChartOfAccountForm`. |
| Orphan account (no parent → appears at root) | `requireParent=true` blocks save without a parent. Default parent pre-selected. |
| Wrong `normal_balance` on an INCOME account | Auto-derived from `account_type` via existing watcher → always `CR` here. |
| Silent duplicates by spelling variation | Fuzzy duplicate hint in `IncomeAccountSelect` (≥ 70% similarity → `Did you mean…?`). Soft hint; no hard block since legitimately-similar names can coexist under different parents. |
| Permission bypass via direct API call | Existing API middleware unchanged. UI gating is layered on top. |
| Account referenced by a charge gets soft-deleted later | New backend cascade safeguard: `422 cannot_delete_account_referenced_by_general_charge`. |
| `<Form>` component doesn't support a custom-component field type | If verification confirms it doesn't, add the `type: 'component'` branch in `<Form>` as a one-line extension. This is a known small extension cost. |

---

## Test plan

**Frontend (Vitest + Vue Test Utils):**

1. `IncomeAccountSelect` fetches with `account_type=INCOME&is_postable=1&is_active=1` and sorts by `gl_code`.
2. With `canCreate=false`, the `+ Create new` footer is not rendered.
3. With `canCreate=true` and empty search, the footer reads `Create new income account`.
4. With `canCreate=true` and search `"SMS Fee"`, the footer reads `Create "SMS Fee" as income account`.
5. When search matches an existing name with ≥ 70% similarity (e.g. typed `"SMS Fee"`, existing `"SMS Notification Fee"`), the `Did you mean…?` hint surfaces with that candidate.
6. Footer click emits `requestCreate` with `{ prefillName: <search text> }`.
7. `refresh()` re-fetches and re-renders; `selectById(id)` updates `modelValue`.
8. `ChartOfAccountForm` with `lockedAccountType='INCOME'`: opens with `account_type='INCOME'`, renders Account Type field as a read-only `<div>` (no `<select>`), and the value cannot be changed.
9. `ChartOfAccountForm` with `defaultParentGlCode='42000'`: opens with `parent_id` set to the row whose `gl_code === '42000'` (if loaded).
10. `ChartOfAccountForm` with `prefillName='X'`: opens with `form.name === 'X'`.
11. `ChartOfAccountForm` with `requireParent=true`: clicking Save with `parent_id=''` shows the inline error and does not call `chartOfAccountsApi.store`.
12. On successful save, `saved` event payload includes `{ id, gl_code, name, account_type, parent_id }`.
13. `Create.vue` end-to-end: `requestCreate` opens nested drawer → on `saved`, `refresh` is called then `selectById` then toast — mock the API, assert the calls and order.

**Backend (Pest):**

1. `ChartOfAccountController::destroy` returns `422` with body `error_code === 'cannot_delete_account_referenced_by_general_charge'` when a `GeneralCharge` row references the account.
2. Soft-deleting an account that no charge references still succeeds (200, soft-deleted in DB).
3. `ChartOfAccountController::store` response body includes the created account record under `data` (regression test if changed).
4. `general_charges.store` accepts a `credit_account_id` that was created moments earlier and stores the charge with that FK.

**Manual smoke (until E2E):**

1. Open `tenant/settings/general-charges` → click `+ Add Charge` → fill required fields → focus Credit Account.
2. Type a new name → click `+ Create "<name>" as income account`.
3. Inside the nested drawer, verify Account Type is locked to `Income`, Normal Balance reads `Credit (CR)`, parent is `42000 Fee Income`, GL Code is hidden but the next slot is generated server-side. Adjust parent if desired.
4. Save the account → confirm toast → confirm dropdown now shows the new account selected.
5. Submit the charge → confirm it persists with the correct `credit_account_id`.
6. Try to delete that income account from `tenant/chart-of-accounts` → confirm `cannot_delete_account_referenced_by_general_charge` error.

---

## Out of scope

- **Non-INCOME credit accounts for `is_revenue=false` charges.** The current selector filters INCOME only regardless of `is_revenue`; we keep that. A pass-through-to-liability case (e.g. a fee collected on behalf of a third party) would need a conditional filter — defer to a follow-up.
- **Editing inline-created accounts from this drawer.** All edits go through `tenant/chart-of-accounts`. Inline create only.
- **Reusing this pattern for other selectors** (debit accounts on disbursement, savings COA picker, share dividend account, etc.). The `ChartOfAccountForm` props this design adds (`lockedAccountType`, `defaultParentGlCode`, `prefillName`, `requireParent`) are written to be reusable, but wiring them into other contexts is out of scope.
- **Bulk import.** Out of scope; existing seeder path handles bulk.

---

## Execution order

1. Backend: extend `ChartOfAccountController::store` response to return the created record under `data`. Add cascade safeguard in `destroy`. Pest tests for both.
2. Frontend: extend `ChartOfAccountForm` with the four new props (`lockedAccountType`, `defaultParentGlCode`, `prefillName`, `requireParent`) and the enriched `saved` payload. Tests.
3. Frontend: build `IncomeAccountSelect` component. Tests.
4. Frontend: extend the shared `<Form>` component to support `type: 'component'` field rendering (only if verification shows it's missing — likely a one-line addition).
5. Frontend: update `general-charges/Create.vue` to use `IncomeAccountSelect` and manage the nested-drawer state.
6. Manual smoke test end-to-end.
