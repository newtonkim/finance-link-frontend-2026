# Loan Product Accounting Mapping — Searchable Account Selectors

**Date:** 2026-03-26
**Scope:** Frontend only — `useLoanProductForm.ts`, `LoanProductForm.vue`

---

## Problem

The Accounting Mapping section of the loan product form has 6 raw `<input type="number">` fields for account IDs. Staff cannot be expected to know GL account IDs by memory. The fields should be searchable dropdowns showing account names and GL codes, with sensible defaults auto-filled.

---

## Approach

Fetch all postable chart of accounts once on form mount. Pass the list as local options to each `SearchableSelect`. Auto-fill empty slots using account type and name keyword matching. This mirrors the existing pattern in `JournalEntryForm.vue`.

No backend changes required.

---

## Section 1: Data Layer (`useLoanProductForm.ts`)

### Account Fetching

- Import `chartOfAccountsApi` from `@/tenant/apis/chartOfAccounts/chartOfAccountsApi`
- Add `const accounts = ref<{ id: number; name: string }[]>([])` — options list for the selectors
- Add `const rawAccounts = ref<any[]>([])` — full account data used for auto-matching
- Add `fetchAccounts()`:
  - Calls `chartOfAccountsApi.list({ list: 1 } as any)`
  - Filters to `is_postable === true`
  - Populates `rawAccounts` with the full account objects
  - Populates `accounts` mapped to `{ id: a.id, name: \`${a.gl_code} - ${a.name}\` }`
  - On failure: `toast.error('Failed to load chart of accounts.')`, arrays stay empty

### Auto-fill Logic

- Add `autoFillAccounts()` — runs after both `fetchAccounts()` and `loadProduct()` resolve
- Only fills slots where the current `form.*_account_id` value is `null` or `undefined`
- Slots with an existing value (saved by the user previously) are never overwritten
- Applies in both create and edit mode

**Matching rules** (case-insensitive, checks both `name` and `account_subtype`):

| Form field | account_type | Keyword match |
|---|---|---|
| `loan_portfolio_account_id` | ASSET | contains `"loan"` or `"portfolio"` |
| `interest_income_account_id` | INCOME | contains `"interest"` |
| `interest_receivable_account_id` | ASSET | contains `"interest"` AND `"receivable"` |
| `disbursement_account_id` | ASSET | contains `"bank"` or `"cash"` |
| `penalty_income_account_id` | INCOME | contains `"penalty"` or `"fine"` |
| `penalty_receivable_account_id` | ASSET | contains `"penalty"` AND `"receivable"` |

Each rule picks the first account that satisfies both the `account_type` and keyword conditions. If no match is found for a slot, the slot stays empty — no forced selection.

### Mount Orchestration

Replace the existing `onMounted(() => loadProduct())` with:

```ts
onMounted(async () => {
  await Promise.all([loadProduct(), fetchAccounts()])
  autoFillAccounts()
})
```

`loadProduct()` is a no-op when `!isEditing`, so this is safe for both modes.

### Exports

Add `accounts` to the composable's return object so `LoanProductForm.vue` can access it.

---

## Section 2: Template (`LoanProductForm.vue`)

### Import

Add `import SearchableSelect from '@/Global/SearchableSelect.vue'`

### Accounting Mapping Section

Replace all 6 `<input type="number">` fields with `<SearchableSelect>`:

- `v-model` bound to the same `form.*_account_id` field — no change to save logic
- `:options="accounts"` — shared array from the composable
- `:error="fieldError('*_account_id')"` — wired through `SearchableSelect`'s built-in error prop (removes the manual `<p>` tag)
- `:disabled="loading"` — disabled while form data is loading
- Labels updated to remove the "ID" suffix (e.g. `"Loan Portfolio Account"` not `"Loan Portfolio Account ID"`)

**Placeholders:**

| Slot | Placeholder |
|---|---|
| Loan Portfolio | `"Select loan portfolio account"` |
| Interest Income | `"Select interest income account"` |
| Interest Receivable | `"Select interest receivable account"` |
| Disbursement | `"Select disbursement account"` |
| Penalty Income | `"Select penalty income account"` |
| Penalty Receivable | `"Select penalty receivable account"` |

Grid layout (2-column) is unchanged.

---

## Section 3: Edge Cases

| Case | Behaviour |
|---|---|
| Accounts loading | Selectors render with `:disabled="true"` — the existing `v-if="loading"` gate covers this since `Promise.all` runs in `onMounted` before the form renders |
| No postable accounts | Selectors open and show `SearchableSelect`'s built-in "No results found" — no extra handling |
| Edit mode, all slots saved | Auto-fill is skipped for all slots (all have non-null values) |
| Edit mode, some slots null | Only null slots are auto-filled; saved slots untouched |
| No keyword match for a slot | Slot stays empty — user must select manually |
| Account fetch fails | `toast.error` shown, `accounts` stays `[]`, selectors are empty but functional |

---

## Files Changed

| File | Change |
|---|---|
| `src/tenant/modules/loan-products/composables/useLoanProductForm.ts` | Add `fetchAccounts`, `autoFillAccounts`, `accounts` ref, update `onMounted` |
| `src/tenant/modules/loan-products/pages/LoanProductForm.vue` | Replace 6 number inputs with `SearchableSelect`, update labels, import component |

No backend changes. No new files.
