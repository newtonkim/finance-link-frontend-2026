# Loan Product Accounting Selectors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 6 raw number inputs in the Loan Product form's Accounting Mapping section with searchable account selectors that auto-fill with the correct chart of accounts by default.

**Architecture:** Fetch all postable chart of accounts once on form mount inside `useLoanProductForm.ts`, auto-fill empty account slots using `account_type` + keyword matching, and expose an `accounts` options array to `LoanProductForm.vue` which swaps the inputs for `SearchableSelect` components.

**Tech Stack:** Vue 3, TypeScript, `SearchableSelect` (`src/Global/SearchableSelect.vue`), `chartOfAccountsApi` (`src/tenant/apis/chartOfAccounts/chartOfAccountsApi.ts`), `vue-sonner` for toasts.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/tenant/modules/loan-products/composables/useLoanProductForm.ts` | Modify | Add `fetchAccounts`, `autoFillAccounts`, `accounts`/`rawAccounts` refs, update `onMounted` and return |
| `src/tenant/modules/loan-products/pages/LoanProductForm.vue` | Modify | Import `SearchableSelect`, add `accounts` to destructure, replace 6 number inputs |

---

## Task 1: Add account fetching to the composable

**Files:**
- Modify: `src/tenant/modules/loan-products/composables/useLoanProductForm.ts`

- [ ] **Step 1: Add the import and new refs**

Open `src/tenant/modules/loan-products/composables/useLoanProductForm.ts`.

Change line 4 from:
```ts
import { loanProductsApi, type LoanProduct, type LoanProductPreview } from '../../../apis/loanProducts/loanProductsApi'
```
To:
```ts
import { loanProductsApi, type LoanProduct, type LoanProductPreview } from '../../../apis/loanProducts/loanProductsApi'
import { chartOfAccountsApi } from '../../../apis/chartOfAccounts/chartOfAccountsApi'
```

Then inside `useLoanProductForm()`, directly after the `const form = ref<LoanProduct>(createDefaultForm())` line (line 55), add:

```ts
    // ─── Accounts (for accounting mapping selectors) ───────────────────────────
    const accounts    = ref<{ id: number; name: string }[]>([])
    const rawAccounts = ref<any[]>([])
```

- [ ] **Step 2: Add `fetchAccounts()`**

Add this function directly after the two new refs, before the `loadProduct` function:

```ts
    async function fetchAccounts() {
        try {
            const res = await chartOfAccountsApi.list({ list: 1 } as any)
            const all: any[] = Array.isArray(res.data?.data) ? res.data.data
                             : Array.isArray(res.data)       ? res.data
                             : []
            rawAccounts.value = all.filter((a: any) => a.is_postable)
            accounts.value    = rawAccounts.value.map((a: any) => ({
                id:   a.id,
                name: `${a.gl_code} - ${a.name}`,
            }))
        } catch {
            toast.error('Failed to load chart of accounts.')
        }
    }
```

- [ ] **Step 3: Add `autoFillAccounts()`**

Add this function directly after `fetchAccounts()`:

```ts
    function autoFillAccounts() {
        if (!rawAccounts.value.length) return

        function match(type: string, ...keywords: string[][]): number | null {
            const found = rawAccounts.value.find((a: any) => {
                if (a.account_type !== type) return false
                const hay = `${a.name} ${a.account_subtype ?? ''}`.toLowerCase()
                return keywords.every(group => group.some(kw => hay.includes(kw)))
            })
            return found ? found.id : null
        }

        const slots: Array<{ field: keyof LoanProduct; type: string; keywords: string[][] }> = [
            { field: 'loan_portfolio_account_id',    type: 'ASSET',  keywords: [['loan', 'portfolio']] },
            { field: 'interest_income_account_id',   type: 'INCOME', keywords: [['interest']] },
            { field: 'interest_receivable_account_id', type: 'ASSET', keywords: [['interest'], ['receivable']] },
            { field: 'disbursement_account_id',      type: 'ASSET',  keywords: [['bank', 'cash']] },
            { field: 'penalty_income_account_id',    type: 'INCOME', keywords: [['penalty', 'fine']] },
            { field: 'penalty_receivable_account_id', type: 'ASSET', keywords: [['penalty'], ['receivable']] },
        ]

        for (const slot of slots) {
            if (form.value[slot.field] != null) continue   // already set — never overwrite
            const id = match(slot.type, ...slot.keywords)
            if (id !== null) (form.value as any)[slot.field] = id
        }
    }
```

- [ ] **Step 4: Replace `onMounted` and export `accounts`**

Replace the existing `onMounted(loadProduct)` line (line 76) with:

```ts
    onMounted(async () => {
        await Promise.all([loadProduct(), fetchAccounts()])
        autoFillAccounts()
    })
```

Then update the return statement at the bottom of the composable from:

```ts
    return {
        isEditing, loading, saving, errors, form,
        preview, previewLoading, previewAmount, previewTerm, refreshPreview,
        addPenaltyRule, removePenaltyRule,
        fieldError, save,
    }
```

To:

```ts
    return {
        isEditing, loading, saving, errors, form,
        accounts,
        preview, previewLoading, previewAmount, previewTerm, refreshPreview,
        addPenaltyRule, removePenaltyRule,
        fieldError, save,
    }
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/asd/Mfuko_pro/mfuko-pro-frontend-2026
pnpm type-check
```

Expected: no errors related to `useLoanProductForm.ts`. Fix any type errors before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/tenant/modules/loan-products/composables/useLoanProductForm.ts
git commit -m "feat: add account fetching and auto-fill to useLoanProductForm"
```

---

## Task 2: Replace number inputs with SearchableSelect in the form

**Files:**
- Modify: `src/tenant/modules/loan-products/pages/LoanProductForm.vue`

- [ ] **Step 1: Add the import and destructure `accounts`**

In `LoanProductForm.vue`, the `<script setup>` block currently imports:

```ts
import PenaltyRuleRow from '../components/PenaltyRuleRow.vue'
```

Add `SearchableSelect` import directly after it:

```ts
import PenaltyRuleRow from '../components/PenaltyRuleRow.vue'
import SearchableSelect from '@/Global/SearchableSelect.vue'
```

Then update the destructure of `useLoanProductForm()` from:

```ts
const {
    isEditing, loading, saving, errors, form,
    preview, previewLoading, previewAmount, previewTerm,
    addPenaltyRule, removePenaltyRule,
    fieldError, save,
} = useLoanProductForm()
```

To:

```ts
const {
    isEditing, loading, saving, errors, form,
    accounts,
    preview, previewLoading, previewAmount, previewTerm,
    addPenaltyRule, removePenaltyRule,
    fieldError, save,
} = useLoanProductForm()
```

- [ ] **Step 2: Replace the Accounting Mapping section**

Find and replace the entire Accounting Mapping `<div>` block (lines 291–329). Replace:

```html
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Accounting Mapping</h2>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan Portfolio Account ID</label>
                            <input v-model="form.loan_portfolio_account_id" type="number" min="1"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p v-if="fieldError('loan_portfolio_account_id')" class="mt-1 text-xs text-red-500">{{ fieldError('loan_portfolio_account_id') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Income Account ID</label>
                            <input v-model="form.interest_income_account_id" type="number" min="1"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p v-if="fieldError('interest_income_account_id')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_income_account_id') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Receivable Account ID</label>
                            <input v-model="form.interest_receivable_account_id" type="number" min="1"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p v-if="fieldError('interest_receivable_account_id')" class="mt-1 text-xs text-red-500">{{ fieldError('interest_receivable_account_id') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Disbursement Account ID</label>
                            <input v-model="form.disbursement_account_id" type="number" min="1"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                            <p v-if="fieldError('disbursement_account_id')" class="mt-1 text-xs text-red-500">{{ fieldError('disbursement_account_id') }}</p>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Income Account ID</label>
                            <input v-model="form.penalty_income_account_id" type="number" min="1"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Receivable Account ID</label>
                            <input v-model="form.penalty_receivable_account_id" type="number" min="1"
                                class="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nfuko-primary/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
                        </div>
                    </div>
                </div>
```

With:

```html
                <div class="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <h2 class="mb-5 text-base font-semibold text-neutral-900 dark:text-white">Accounting Mapping</h2>
                    <p class="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
                        These accounts define where journal entries are posted for loan transactions. Defaults are pre-filled from your chart of accounts — change them if needed.
                    </p>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Loan Portfolio Account</label>
                            <SearchableSelect
                                v-model="form.loan_portfolio_account_id"
                                :options="accounts"
                                placeholder="Select loan portfolio account"
                                :error="fieldError('loan_portfolio_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Income Account</label>
                            <SearchableSelect
                                v-model="form.interest_income_account_id"
                                :options="accounts"
                                placeholder="Select interest income account"
                                :error="fieldError('interest_income_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Interest Receivable Account</label>
                            <SearchableSelect
                                v-model="form.interest_receivable_account_id"
                                :options="accounts"
                                placeholder="Select interest receivable account"
                                :error="fieldError('interest_receivable_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Disbursement Account</label>
                            <SearchableSelect
                                v-model="form.disbursement_account_id"
                                :options="accounts"
                                placeholder="Select disbursement account"
                                :error="fieldError('disbursement_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Income Account</label>
                            <SearchableSelect
                                v-model="form.penalty_income_account_id"
                                :options="accounts"
                                placeholder="Select penalty income account"
                                :error="fieldError('penalty_income_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Penalty Receivable Account</label>
                            <SearchableSelect
                                v-model="form.penalty_receivable_account_id"
                                :options="accounts"
                                placeholder="Select penalty receivable account"
                                :error="fieldError('penalty_receivable_account_id') ?? undefined"
                                :disabled="loading"
                            />
                        </div>
                    </div>
                </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/asd/Mfuko_pro/mfuko-pro-frontend-2026
pnpm type-check
```

Expected: no errors. The `SearchableSelect` `modelValue` prop expects `string | number` — the account ID fields are `number | null`. The `?? undefined` on `:error` avoids passing `null` to the `error` prop which expects `string | undefined`. Fix any type errors before continuing.

- [ ] **Step 4: Run the dev server and manually verify**

```bash
pnpm dev
```

Open the loan product create form. Verify:
- The Accounting Mapping section shows 6 searchable dropdowns (not text inputs)
- Each dropdown is pre-filled with an account name (if matching accounts exist in the CoA)
- Typing in a selector filters the list
- Selecting an account updates the form value
- Saving creates the product with the correct account IDs

Open an existing loan product in edit mode. Verify:
- Slots with saved account IDs show the correct account name
- Empty slots are auto-filled with matched accounts
- Saving preserves selections correctly

- [ ] **Step 5: Commit**

```bash
git add src/tenant/modules/loan-products/pages/LoanProductForm.vue
git commit -m "feat: replace accounting mapping number inputs with searchable account selectors"
```
