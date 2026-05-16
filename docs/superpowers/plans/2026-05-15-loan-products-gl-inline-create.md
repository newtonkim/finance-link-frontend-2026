# Loan Products GL Inline-Create Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small "+ Create new <type> account" trigger next to each of the 8 GL-account fields in the Loan Products edit page's Accounting Mapping section, opening one shared `ChartOfAccountForm` modal that locks `account_type` and defaults a `parent_gl_code` matching the field's expected type.

**Architecture:** Keep the existing `<SearchableSelect>` dropdowns untouched. Define a single typed `GL_FIELD_META` array in `useLoanProductCreate` (also used by the existing `autoFillAccounts` slot table — replacing the local declaration). The page `v-for`s over it to render label + trigger + dropdown, and owns one modal driven by reactive `creatingAccount` state. On save, refresh the shared `accounts` list, auto-select into the field that opened the modal.

**Tech Stack:** Vue 3 / TypeScript / Vite / Vitest / Tailwind. Frontend only — no backend changes.

**Spec:** [`docs/superpowers/specs/2026-05-15-loan-products-gl-inline-create-design.md`](../specs/2026-05-15-loan-products-gl-inline-create-design.md)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/tenant/modules/loan-products/composables/useLoanProductCreate.ts` | Define + export `GL_FIELD_META` (constant array of 8 entries, each with `field`, `type`, `parent_gl_code`, `label`). Refactor `autoFillAccounts` to read from it. Expose `fetchAccounts` in the return so the page can re-fetch after creating an account. |
| Create | `src/tenant/modules/loan-products/components/AccountInlineCreate.vue` | Presentational trigger button. Props: `accountType: 'ASSET'\|'INCOME'`, `parentGlCode: string`, `label?: string`. Emits `click` with `{ accountType, parentGlCode }`. |
| Modify | `src/tenant/modules/loan-products/pages/LoanProductCreate.vue` | Replace the 8 hand-rolled blocks (lines ~802–923) with a single `v-for` over `GL_FIELD_META`. Add the shared `<ChartOfAccountForm>` instance + `creatingAccount` state + `onRequestCreate` and `onAccountSaved` handlers. Read `fetchAccounts` from the composable. |
| Create | `src/tenant/modules/loan-products/__tests__/AccountInlineCreate.spec.ts` | Vitest unit tests for the new component. |
| Create | `src/tenant/modules/loan-products/__tests__/LoanProductCreate.gl-create.spec.ts` | Vitest integration tests for the page-level wiring. |
| Create | `src/tenant/modules/loan-products/__tests__/useLoanProductCreate.gl-meta.spec.ts` | Vitest tests for `GL_FIELD_META` shape and content (regression guard for the canonical table). |

**Working dir:** `/Users/asd/Mfuko_pro/mfuko-pro-frontend-2026` — branch `feat/loan-products-gl-inline-create` (already cut with spec commit `1b5659b`).

---

## Reference: things explicitly NOT touched

- `SearchableSelect` component itself — unchanged.
- `ChartOfAccountForm` — already supports `locked-account-type`, `default-parent-gl-code`, `require-parent`, `prefill-name`. No changes.
- `IncomeAccountSelect.vue` on the General Charges drawer — separate concern.
- The 8 form keys (`loan_portfolio_account_id`, etc.) — names stay identical.
- `fieldError`, `glAccountWarnings`, `loading`, `saving` — same behavior; the v-for must render them conditionally for the fields that show them today.
- Any backend code — purely frontend.

---

## Canonical `GL_FIELD_META` table

This is the single source of truth referenced across every task. Copy it verbatim — don't paraphrase.

```ts
export interface GlFieldMeta {
  field: keyof LoanProduct
  type: 'ASSET' | 'INCOME'
  parent_gl_code: string
  label: string
  placeholder: string
}

export const GL_FIELD_META: readonly GlFieldMeta[] = [
  {
    field: 'loan_portfolio_account_id',
    type: 'ASSET',
    parent_gl_code: '11300',
    label: 'Loan Portfolio Account',
    placeholder: 'Select loan portfolio account',
  },
  {
    field: 'interest_income_account_id',
    type: 'INCOME',
    parent_gl_code: '41100',
    label: 'Interest Income Account',
    placeholder: 'Select interest income account',
  },
  {
    field: 'interest_receivable_account_id',
    type: 'ASSET',
    parent_gl_code: '11500',
    label: 'Interest Receivable Account',
    placeholder: 'Select interest receivable account',
  },
  {
    field: 'disbursement_account_id',
    type: 'ASSET',
    parent_gl_code: '11100',
    label: 'Disbursement Account',
    placeholder: 'Select disbursement account',
  },
  {
    field: 'penalty_income_account_id',
    type: 'INCOME',
    parent_gl_code: '41400',
    label: 'Penalty Income Account',
    placeholder: 'Select penalty income account',
  },
  {
    field: 'penalty_receivable_account_id',
    type: 'ASSET',
    parent_gl_code: '11600',
    label: 'Penalty Receivable Account',
    placeholder: 'Select penalty receivable account',
  },
  {
    field: 'charges_income_account_id',
    type: 'INCOME',
    parent_gl_code: '42000',
    label: 'Charges Income Account',
    placeholder: 'Select charges income account',
  },
  {
    field: 'charges_receivable_account_id',
    type: 'ASSET',
    parent_gl_code: '11700',
    label: 'Charges Receivable Account',
    placeholder: 'Select charges receivable account',
  },
] as const
```

---

## Task 1: Composable — Export `GL_FIELD_META` + expose `fetchAccounts`

**Files:**
- Modify: `src/tenant/modules/loan-products/composables/useLoanProductCreate.ts` (around lines 254–275 + the return statement around lines 547–571)
- Create: `src/tenant/modules/loan-products/__tests__/useLoanProductCreate.gl-meta.spec.ts`

- [ ] **Step 1: Write the failing meta-shape test**

Create `src/tenant/modules/loan-products/__tests__/useLoanProductCreate.gl-meta.spec.ts`:

```ts
/* @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { GL_FIELD_META } from '../composables/useLoanProductCreate'

describe('GL_FIELD_META', () => {
  it('contains exactly 8 entries', () => {
    expect(GL_FIELD_META).toHaveLength(8)
  })

  it('each entry has field, type, parent_gl_code, label, placeholder', () => {
    for (const m of GL_FIELD_META) {
      expect(m).toHaveProperty('field')
      expect(m).toHaveProperty('type')
      expect(m).toHaveProperty('parent_gl_code')
      expect(m).toHaveProperty('label')
      expect(m).toHaveProperty('placeholder')
    }
  })

  it('each entry has type ASSET or INCOME', () => {
    for (const m of GL_FIELD_META) {
      expect(['ASSET', 'INCOME']).toContain(m.type)
    }
  })

  it('parent_gl_code matches the canonical table (regression guard)', () => {
    const byField = Object.fromEntries(GL_FIELD_META.map((m) => [m.field, m.parent_gl_code]))
    expect(byField).toEqual({
      loan_portfolio_account_id: '11300',
      interest_income_account_id: '41100',
      interest_receivable_account_id: '11500',
      disbursement_account_id: '11100',
      penalty_income_account_id: '41400',
      penalty_receivable_account_id: '11600',
      charges_income_account_id: '42000',
      charges_receivable_account_id: '11700',
    })
  })

  it('fields cover every GL account on the form (regression guard)', () => {
    const fields = GL_FIELD_META.map((m) => m.field).sort()
    expect(fields).toEqual([
      'charges_income_account_id',
      'charges_receivable_account_id',
      'disbursement_account_id',
      'interest_income_account_id',
      'interest_receivable_account_id',
      'loan_portfolio_account_id',
      'penalty_income_account_id',
      'penalty_receivable_account_id',
    ])
  })
})
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
cd /Users/asd/Mfuko_pro/mfuko-pro-frontend-2026
yarn test:unit src/tenant/modules/loan-products/__tests__/useLoanProductCreate.gl-meta.spec.ts
```

Expected: FAIL with import error — `GL_FIELD_META` is not yet exported.

- [ ] **Step 3: Add `GL_FIELD_META` export at the top of the composable file**

Open `src/tenant/modules/loan-products/composables/useLoanProductCreate.ts`. After the existing `import` block (above the `useLoanProductForm` declaration), add the interface and the constant. Place it AFTER the existing `LoanProduct` type import/definition so `keyof LoanProduct` resolves. If `LoanProduct` isn't a top-level export already, use `type LoanProductFormKey` instead — string union of the 8 field names — to keep the meta self-contained:

```ts
// Single source of truth for the Accounting Mapping section's GL fields.
// Consumed by autoFillAccounts (replacing the previous inline `slots` array)
// AND by the page template (v-for) so the field list stays DRY.
export interface GlFieldMeta {
  field: keyof LoanProduct
  type: 'ASSET' | 'INCOME'
  parent_gl_code: string
  label: string
  placeholder: string
}

export const GL_FIELD_META: readonly GlFieldMeta[] = [
  {
    field: 'loan_portfolio_account_id',
    type: 'ASSET',
    parent_gl_code: '11300',
    label: 'Loan Portfolio Account',
    placeholder: 'Select loan portfolio account',
  },
  {
    field: 'interest_income_account_id',
    type: 'INCOME',
    parent_gl_code: '41100',
    label: 'Interest Income Account',
    placeholder: 'Select interest income account',
  },
  {
    field: 'interest_receivable_account_id',
    type: 'ASSET',
    parent_gl_code: '11500',
    label: 'Interest Receivable Account',
    placeholder: 'Select interest receivable account',
  },
  {
    field: 'disbursement_account_id',
    type: 'ASSET',
    parent_gl_code: '11100',
    label: 'Disbursement Account',
    placeholder: 'Select disbursement account',
  },
  {
    field: 'penalty_income_account_id',
    type: 'INCOME',
    parent_gl_code: '41400',
    label: 'Penalty Income Account',
    placeholder: 'Select penalty income account',
  },
  {
    field: 'penalty_receivable_account_id',
    type: 'ASSET',
    parent_gl_code: '11600',
    label: 'Penalty Receivable Account',
    placeholder: 'Select penalty receivable account',
  },
  {
    field: 'charges_income_account_id',
    type: 'INCOME',
    parent_gl_code: '42000',
    label: 'Charges Income Account',
    placeholder: 'Select charges income account',
  },
  {
    field: 'charges_receivable_account_id',
    type: 'ASSET',
    parent_gl_code: '11700',
    label: 'Charges Receivable Account',
    placeholder: 'Select charges receivable account',
  },
] as const
```

If `LoanProduct` is imported from a separate types file (search for `interface LoanProduct\|type LoanProduct`), import it explicitly at the top of the composable so the `keyof LoanProduct` type resolves at module level. If it lives only inside the composable's `setup` scope, redefine it OR use a narrower `LoanProductGlField` string union:

```ts
type LoanProductGlField =
  | 'loan_portfolio_account_id'
  | 'interest_income_account_id'
  | 'interest_receivable_account_id'
  | 'disbursement_account_id'
  | 'penalty_income_account_id'
  | 'penalty_receivable_account_id'
  | 'charges_income_account_id'
  | 'charges_receivable_account_id'
```

…and replace `keyof LoanProduct` with `LoanProductGlField` in `GlFieldMeta`. This keeps the meta hoistable.

- [ ] **Step 4: Refactor `autoFillAccounts` to read from `GL_FIELD_META`**

Inside `useLoanProductForm()`, locate the existing `autoFillAccounts` (around line 242). Replace the local `slots` declaration (lines 254–275) so it derives from `GL_FIELD_META`. The keyword-matching behavior must be preserved — keep the existing inline keywords per slot since they're not part of the public meta:

```ts
function autoFillAccounts() {
  if (!rawAccounts.value.length) return

  function match(type: string, ...keywords: string[][]): number | null {
    const found = rawAccounts.value.find((a: any) => {
      if (a.account_type !== type) return false
      const hay = `${a.name} ${a.account_subtype ?? ''}`.toLowerCase()
      return keywords.every((group) => group.some((kw) => hay.includes(kw)))
    })
    return found ? found.id : null
  }

  // Keywords stay local — they're auto-fill heuristics, not part of the
  // canonical GL_FIELD_META contract that the page template reads from.
  const keywordsByField: Record<string, string[][]> = {
    loan_portfolio_account_id: [['loan', 'portfolio']],
    interest_income_account_id: [['interest']],
    interest_receivable_account_id: [['interest'], ['receivable']],
    disbursement_account_id: [['bank', 'cash']],
    penalty_income_account_id: [['penalty', 'fine']],
    penalty_receivable_account_id: [['penalty'], ['receivable']],
    charges_income_account_id: [['charge', 'fee']],
    charges_receivable_account_id: [['charge'], ['receivable']],
  }

  for (const meta of GL_FIELD_META) {
    if (form.value[meta.field] != null) continue
    const id = match(meta.type, ...(keywordsByField[meta.field] ?? []))
    if (id !== null) (form.value as any)[meta.field] = id
  }
}
```

- [ ] **Step 5: Expose `fetchAccounts` from the composable's return**

Inside the same `useLoanProductForm()` function, locate the `return { … }` block (around line 547). Add `fetchAccounts` to it:

```ts
return {
  isEditing,
  loading,
  saving,
  errors,
  form,
  accounts,
  fetchAccounts,    // ← NEW
  documentTypes,
  charges,
  chargeOptions,
  glAccountWarnings,
  estimatedFees,
  preview,
  previewLoading,
  previewAmount,
  previewTerm,
  refreshPreview,
  addPenaltyRule,
  removePenaltyRule,
  addRequiredDocument,
  removeRequiredDocument,
  fieldError,
  save,
}
```

- [ ] **Step 6: Run the meta-shape test — confirm green**

```bash
yarn test:unit src/tenant/modules/loan-products/__tests__/useLoanProductCreate.gl-meta.spec.ts
```

Expected: 5 passed.

- [ ] **Step 7: Type-check confirms no break**

```bash
yarn type-check 2>&1 | grep -i "loan-products" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 8: Commit**

```bash
git add src/tenant/modules/loan-products/composables/useLoanProductCreate.ts \
        src/tenant/modules/loan-products/__tests__/useLoanProductCreate.gl-meta.spec.ts
git commit -m "feat: export typed GL_FIELD_META + expose fetchAccounts from useLoanProductCreate"
```

---

## Task 2: `AccountInlineCreate.vue` component

**Files:**
- Create: `src/tenant/modules/loan-products/components/AccountInlineCreate.vue`
- Create: `src/tenant/modules/loan-products/__tests__/AccountInlineCreate.spec.ts`

- [ ] **Step 1: Write the failing component tests**

Create `src/tenant/modules/loan-products/__tests__/AccountInlineCreate.spec.ts`:

```ts
/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AccountInlineCreate from '../components/AccountInlineCreate.vue'

describe('AccountInlineCreate', () => {
  it('renders default ASSET label', () => {
    const wrapper = mount(AccountInlineCreate, {
      props: { accountType: 'ASSET', parentGlCode: '11300' },
    })
    expect(wrapper.text()).toContain('Create new asset account')
  })

  it('renders default INCOME label', () => {
    const wrapper = mount(AccountInlineCreate, {
      props: { accountType: 'INCOME', parentGlCode: '41100' },
    })
    expect(wrapper.text()).toContain('Create new income account')
  })

  it('honors a custom label prop', () => {
    const wrapper = mount(AccountInlineCreate, {
      props: { accountType: 'ASSET', parentGlCode: '11300', label: 'Add custom asset' },
    })
    expect(wrapper.text()).toContain('Add custom asset')
    expect(wrapper.text()).not.toContain('Create new asset account')
  })

  it('emits click with the props payload', async () => {
    const wrapper = mount(AccountInlineCreate, {
      props: { accountType: 'INCOME', parentGlCode: '42000' },
    })
    await wrapper.find('button').trigger('click')
    const events = wrapper.emitted('click')
    expect(events).toBeTruthy()
    expect(events![0]).toEqual([{ accountType: 'INCOME', parentGlCode: '42000' }])
  })
})
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
yarn test:unit src/tenant/modules/loan-products/__tests__/AccountInlineCreate.spec.ts
```

Expected: FAIL with `Cannot find module ../components/AccountInlineCreate.vue`.

- [ ] **Step 3: Create the component**

Create `src/tenant/modules/loan-products/components/AccountInlineCreate.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from 'lucide-vue-next'

const props = defineProps<{
  accountType: 'ASSET' | 'INCOME'
  parentGlCode: string
  label?: string
}>()

const emit = defineEmits<{
  (e: 'click', payload: { accountType: 'ASSET' | 'INCOME'; parentGlCode: string }): void
}>()

const displayLabel = computed(() => {
  if (props.label) return props.label
  const typeWord = props.accountType.toLowerCase()
  return `Create new ${typeWord} account`
})

function onClick() {
  emit('click', { accountType: props.accountType, parentGlCode: props.parentGlCode })
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 text-xs font-semibold text-nfuko-primary hover:underline"
    @click="onClick"
  >
    <Plus class="size-3.5" />
    <span>{{ displayLabel }}</span>
  </button>
</template>
```

- [ ] **Step 4: Run the tests — confirm green**

```bash
yarn test:unit src/tenant/modules/loan-products/__tests__/AccountInlineCreate.spec.ts
```

Expected: 4 passed.

- [ ] **Step 5: Type-check + commit**

```bash
yarn type-check 2>&1 | grep -i "AccountInlineCreate" || echo "OK"
```

Expected: `OK`.

```bash
git add src/tenant/modules/loan-products/components/AccountInlineCreate.vue \
        src/tenant/modules/loan-products/__tests__/AccountInlineCreate.spec.ts
git commit -m "feat: AccountInlineCreate trigger component for GL inline-create"
```

---

## Task 3: Refactor `LoanProductCreate.vue` Accounting Mapping section

**Files:**
- Modify: `src/tenant/modules/loan-products/pages/LoanProductCreate.vue` (the Accounting Mapping block, lines ~797–924)

This is the largest task — refactors 8 hand-rolled field blocks into a single `v-for` and wires the modal + handlers.

- [ ] **Step 1: Add the new imports**

In the `<script setup>` block, add:

```ts
import AccountInlineCreate from '../components/AccountInlineCreate.vue'
import ChartOfAccountForm from '@/tenant/modules/accounting/components/ChartOfAccountForm.vue'
import { GL_FIELD_META, type GlFieldMeta } from '../composables/useLoanProductCreate'
import { toast } from 'vue-sonner'
```

(Skip `toast` if it's already imported. Skip `GlFieldMeta` if not referenced explicitly — TypeScript infers from `GL_FIELD_META`.)

- [ ] **Step 2: Destructure `fetchAccounts` from the composable**

Find the existing destructure of `useLoanProductForm()` (around line 37). Add `fetchAccounts`:

```ts
const {
  // ...existing keys
  accounts,
  fetchAccounts,   // ← NEW
  // ...rest
} = useLoanProductForm()
```

- [ ] **Step 3: Add page-level modal state**

After the destructure, add:

```ts
// Reactive state for the shared "+ Create new GL account" modal.
// Only one modal is rendered (DRY) — eight triggers feed into the same instance.
const creatingAccount = ref<{
  open: boolean
  lockedAccountType: 'ASSET' | 'INCOME'
  defaultParentGlCode: string
  prefillName: string
  targetField: GlFieldMeta['field']
} | null>(null)

function onRequestCreate(meta: GlFieldMeta) {
  creatingAccount.value = {
    open: true,
    lockedAccountType: meta.type,
    defaultParentGlCode: meta.parent_gl_code,
    prefillName: '',
    targetField: meta.field,
  }
}

async function onAccountSaved(account: {
  id: number
  gl_code: string
  name: string
  account_type: string
  parent_id: number | null
}) {
  const targetField = creatingAccount.value?.targetField
  try {
    await fetchAccounts()
  } catch {
    toast.error('Account created but failed to refresh list — refresh the page to see it.')
    creatingAccount.value = null
    return
  }
  if (targetField) {
    ;(form.value as any)[targetField] = account.id
  }
  creatingAccount.value = null
  toast.success(`Created ${account.gl_code} - ${account.name}`)
}
```

(If `ref` isn't imported in this file, add it to the existing `from 'vue'` import.)

- [ ] **Step 4: Replace the 8 hand-rolled field blocks with a single `v-for`**

Locate the `<div class="grid gap-4 sm:grid-cols-2">` block inside the Accounting Mapping section (around line 802). Replace its entire contents (the 8 `<div>…</div>` blocks down to the closing `</div>` of the grid, around line 923) with:

```vue
<div class="grid gap-4 sm:grid-cols-2">
  <div v-for="meta in GL_FIELD_META" :key="meta.field">
    <div class="mb-1 flex items-center justify-between">
      <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {{ meta.label }}
      </label>
      <AccountInlineCreate
        :account-type="meta.type"
        :parent-gl-code="meta.parent_gl_code"
        @click="onRequestCreate(meta)"
      />
    </div>
    <SearchableSelect
      v-model="form[meta.field]"
      :options="accounts"
      :placeholder="meta.placeholder"
      :error="fieldError(meta.field) ?? undefined"
      :disabled="loading"
    />
    <p
      v-if="glAccountWarnings[meta.field]"
      class="mt-1 text-xs text-amber-600 dark:text-amber-400"
    >
      {{ glAccountWarnings[meta.field] }}
    </p>
  </div>
</div>
```

The conditional `<p v-if="glAccountWarnings[meta.field]">` handles the 4 fields that currently show warnings (`penalty_income_account_id`, `penalty_receivable_account_id`, `charges_income_account_id`, `charges_receivable_account_id`). For the other 4 fields, `glAccountWarnings[meta.field]` is undefined/falsy, so nothing renders — same as today.

- [ ] **Step 5: Render the shared `ChartOfAccountForm` once near the section root**

Inside the Accounting Mapping section, AFTER the closing `</template>` of the `v-if="showAccountingMapping"` block, BEFORE the closing `</div>` of the section card (around line 925), add:

```vue
<ChartOfAccountForm
  v-if="creatingAccount"
  v-model:open="creatingAccount.open"
  :locked-account-type="creatingAccount.lockedAccountType"
  :default-parent-gl-code="creatingAccount.defaultParentGlCode"
  :prefill-name="creatingAccount.prefillName"
  require-parent
  @saved="onAccountSaved"
/>
```

The `v-if="creatingAccount"` guard ensures the form unmounts when state is null (after save or cancel) — preventing stale prefill leakage. The `v-model:open` two-way binding lets the form close itself; when it sets `open=false`, the page handler in Step 3 sets `creatingAccount = null`.

If `ChartOfAccountForm` doesn't emit `update:open` on close (some older versions don't), wrap the `v-model` with a manual handler:

```vue
<ChartOfAccountForm
  v-if="creatingAccount"
  :open="creatingAccount.open"
  @update:open="(val) => { if (!val) creatingAccount = null }"
  :locked-account-type="creatingAccount.lockedAccountType"
  :default-parent-gl-code="creatingAccount.defaultParentGlCode"
  :prefill-name="creatingAccount.prefillName"
  require-parent
  @saved="onAccountSaved"
/>
```

Use whichever shape the existing IncomeAccountSelect uses (look at `src/tenant/modules/settings/general-charges/Create.vue` for the working call site).

- [ ] **Step 6: Type-check**

```bash
yarn type-check 2>&1 | grep -i "loan-products/pages/LoanProductCreate" || echo "OK"
```

Expected: `OK`. If errors surface, they'll be about `form[meta.field]` — `keyof LoanProduct` indexing. The existing destructure of `form` is already typed; if TypeScript complains about the index access, narrow with `as any` only on the v-model line: `v-model="(form as any)[meta.field]"`. Try without `as any` first.

- [ ] **Step 7: Visual smoke (manual)**

Run `yarn dev`, open `tenant/settings/loan-products/{any-id}/edit`. The Accounting Mapping section should:
- Show all 8 fields in the same 2-column grid as before.
- Each field's label row should have a small "+ Create new <type> account" link on the right.
- Each `SearchableSelect` should still work (pick an existing account).
- The amber warning text should still appear under the 4 fields that previously had it (penalty income, penalty receivable, charges income, charges receivable).

If any field is missing its warning or the layout looks broken, do NOT proceed to commit — fix and re-verify.

- [ ] **Step 8: Commit**

```bash
git add src/tenant/modules/loan-products/pages/LoanProductCreate.vue
git commit -m "refactor: v-for over GL_FIELD_META + add inline-create trigger per GL field"
```

---

## Task 4: Integration tests for page-level wiring

**Files:**
- Create: `src/tenant/modules/loan-products/__tests__/LoanProductCreate.gl-create.spec.ts`

- [ ] **Step 1: Write the integration spec**

Create `src/tenant/modules/loan-products/__tests__/LoanProductCreate.gl-create.spec.ts`:

```ts
/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// Module-level mocks — see members/__tests__/Create.charges.spec.ts for the
// established pattern. Heavy children are stubbed to keep the test focused
// on page-level wiring (trigger click → modal opens → @saved → state changes).

const fetchAccountsMock = vi.fn().mockResolvedValue(undefined)

vi.mock('septor-store', () => ({ getBearerToken: () => null, pomPinia: () => ({}) }))
vi.mock('@/tenant/apis/tenantClient', () => ({
  tenantClient: { interceptors: { request: { use: vi.fn() } } },
}))
vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useRoute: () => ({ params: {}, query: {} }),
}))
vi.mock('@/Global/SearchableSelect.vue', () => ({
  default: {
    name: 'SearchableSelectStub',
    props: ['modelValue', 'options', 'placeholder'],
    emits: ['update:modelValue'],
    template:
      '<div :data-test="`select-${$attrs.placeholder ?? \'\'}`">{{ modelValue }}</div>',
  },
}))
vi.mock('@/Global/MultiSearchableSelect.vue', () => ({
  default: { template: '<div data-test="multi-select-stub" />' },
}))
vi.mock('@/tenant/modules/accounting/components/ChartOfAccountForm.vue', () => ({
  default: {
    name: 'ChartOfAccountFormStub',
    props: ['open', 'lockedAccountType', 'defaultParentGlCode', 'prefillName'],
    emits: ['update:open', 'saved'],
    template: '<div data-test="coa-form-stub" />',
  },
}))

// Stub the composable so we control the state the page consumes.
vi.mock('../composables/useLoanProductCreate', async () => {
  const actual = await vi.importActual<any>('../composables/useLoanProductCreate')
  return {
    ...actual,
    useLoanProductForm: () => {
      const form = ref<Record<string, any>>({
        loan_portfolio_account_id: null,
        interest_income_account_id: null,
        interest_receivable_account_id: null,
        disbursement_account_id: null,
        penalty_income_account_id: null,
        penalty_receivable_account_id: null,
        charges_income_account_id: null,
        charges_receivable_account_id: null,
      })
      return {
        isEditing: ref(false),
        loading: ref(false),
        saving: ref(false),
        errors: ref({}),
        form,
        accounts: ref([
          { id: 1, name: '11300 - Loans Receivable' },
          { id: 2, name: '41100 - Interest Income' },
        ]),
        fetchAccounts: fetchAccountsMock,
        documentTypes: ref([]),
        charges: ref([]),
        chargeOptions: ref([]),
        glAccountWarnings: ref({}),
        estimatedFees: ref({}),
        preview: ref(null),
        previewLoading: ref(false),
        previewAmount: ref(0),
        previewTerm: ref(0),
        refreshPreview: vi.fn(),
        addPenaltyRule: vi.fn(),
        removePenaltyRule: vi.fn(),
        addRequiredDocument: vi.fn(),
        removeRequiredDocument: vi.fn(),
        fieldError: () => null,
        save: vi.fn(),
      }
    },
  }
})

import LoanProductCreate from '../pages/LoanProductCreate.vue'

beforeEach(() => {
  fetchAccountsMock.mockClear()
})

function mountPage() {
  return mount(LoanProductCreate, {
    global: {
      stubs: {
        // Stub any icon imports the page uses so jsdom doesn't error.
        ChevronDown: true,
        ChevronUp: true,
        Plus: true,
        Users: true,
        ToggleLeft: true,
        ToggleRight: true,
      },
    },
  })
}

describe('LoanProductCreate — GL inline-create', () => {
  it('renders an AccountInlineCreate trigger for each of the 8 GL fields', () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })
    expect(triggers).toHaveLength(8)
  })

  it('clicking the trigger on loan_portfolio opens the modal with ASSET + 11300', async () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })
    // First trigger maps to GL_FIELD_META[0] = loan_portfolio_account_id
    await triggers[0].trigger('click')
    await flushPromises()
    const form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    expect(form.exists()).toBe(true)
    expect(form.props('lockedAccountType')).toBe('ASSET')
    expect(form.props('defaultParentGlCode')).toBe('11300')
  })

  it('clicking the trigger on interest_income opens the modal with INCOME + 41100', async () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })
    // Second trigger maps to GL_FIELD_META[1] = interest_income_account_id
    await triggers[1].trigger('click')
    await flushPromises()
    const form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    expect(form.props('lockedAccountType')).toBe('INCOME')
    expect(form.props('defaultParentGlCode')).toBe('41100')
  })

  it('emits saved → refetches accounts, sets form field, closes modal', async () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })
    await triggers[0].trigger('click')
    await flushPromises()

    const form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    await form.vm.$emit('saved', {
      id: 99,
      gl_code: '11310',
      name: 'Test Portfolio',
      account_type: 'ASSET',
      parent_id: null,
    })
    await flushPromises()

    expect(fetchAccountsMock).toHaveBeenCalledTimes(1)
    // The page's form state should have the new account id in the target field.
    const vm: any = wrapper.vm
    expect(vm.form.loan_portfolio_account_id).toBe(99)
    // Modal closed (component unmounted because creatingAccount became null).
    expect(wrapper.findComponent({ name: 'ChartOfAccountFormStub' }).exists()).toBe(false)
  })

  it('clicking a different trigger after a save opens a fresh modal with new metadata', async () => {
    const wrapper = mountPage()
    const triggers = wrapper.findAllComponents({ name: 'AccountInlineCreate' })

    // First save round-trip
    await triggers[0].trigger('click')
    await flushPromises()
    let form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    await form.vm.$emit('saved', {
      id: 1,
      gl_code: '11310',
      name: 'A',
      account_type: 'ASSET',
      parent_id: null,
    })
    await flushPromises()

    // Now click the SECOND trigger (interest_income, INCOME + 41100)
    await triggers[1].trigger('click')
    await flushPromises()
    form = wrapper.findComponent({ name: 'ChartOfAccountFormStub' })
    expect(form.props('lockedAccountType')).toBe('INCOME')
    expect(form.props('defaultParentGlCode')).toBe('41100')
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
yarn test:unit src/tenant/modules/loan-products/__tests__/LoanProductCreate.gl-create.spec.ts 2>&1 | tail -20
```

Expected: 5 passed.

If tests fail because the page imports additional dependencies the stubs don't cover (e.g., a chart library or a pinia store), add the necessary `vi.mock(...)` calls. Common candidates: `@/tenant/stores/...`, `@/Global/utils/...`, additional `lucide-vue-next` icons (these can be stubbed via `vi.mock('lucide-vue-next', () => new Proxy({}, { get: () => ({ template: '<span />' }) }))`).

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/loan-products/__tests__/LoanProductCreate.gl-create.spec.ts
git commit -m "test: integration tests for GL inline-create wiring on LoanProductCreate"
```

---

## Task 5: Push + manual smoke

No code changes.

- [ ] **Step 1: Run the full feature test suite one last time**

```bash
yarn test:unit src/tenant/modules/loan-products/__tests__/ 2>&1 | tail -15
```

Expected: all tests in the directory pass (4 + 5 + 5 = 14 tests across the three new specs).

- [ ] **Step 2: Type-check the full project**

```bash
yarn type-check 2>&1 | tail -20
```

Expected: zero new errors for `loan-products/`. Pre-existing errors in unrelated files (`Form.vue`, etc.) are not in scope.

- [ ] **Step 3: Push**

```bash
git push -u origin feat/loan-products-gl-inline-create
```

Expected: GitHub returns the PR-creation URL.

- [ ] **Step 4: Manual smoke test (post-push, pre-merge)**

Run the dev server (`yarn dev`) and walk through:

1. Navigate to **Settings → Loan Products → edit any product**.
2. Scroll to the **Accounting Mapping** section.
3. Confirm each of the 8 GL fields shows a small "+ Create new <type> account" link in its label row:
   - Loan Portfolio: "Create new asset account"
   - Interest Income: "Create new income account"
   - Interest Receivable: "Create new asset account"
   - Disbursement: "Create new asset account"
   - Penalty Income: "Create new income account"
   - Penalty Receivable: "Create new asset account"
   - Charges Income: "Create new income account"
   - Charges Receivable: "Create new asset account"
4. Click "Create new asset account" on **Loan Portfolio**:
   - Modal opens.
   - Account Type is locked to ASSET (greyed out or read-only).
   - Parent dropdown defaults to `11300 - Loans Receivable` (if that GL code exists in your tenant's chart of accounts).
5. Fill GL code `11310`, name `Test Portfolio Account`, click Save.
6. Modal closes; toast shows "Created 11310 - Test Portfolio Account"; the Loan Portfolio dropdown now shows the new account selected.
7. Click "Create new income account" on **Interest Income** → verify account_type locked to INCOME, parent defaults to `41100`.
8. Try saving with a duplicate GL code → modal stays open, inline error appears inside the form.
9. Click `+ Create` then close the modal without saving → previous form selection preserved on the dropdown.
10. Verify the 4 fields that show amber warnings today (penalty income, penalty receivable, charges income, charges receivable) STILL show those warnings when their conditions are met — the refactor must not have lost them.
11. Save the loan product → the new GL accounts should persist on the saved product. Re-open and confirm the dropdowns still show the right selections.

No commit. If any step fails, file a bug and address it on the same branch before merging.

---

## Self-review notes

### 1. Spec coverage

| Spec requirement | Implementing task |
|---|---|
| `GL_FIELD_META` typed exported array of 8 entries | Task 1 |
| Each entry has `field`, `type`, `parent_gl_code`, `label`, `placeholder` | Task 1 (Step 3) |
| `autoFillAccounts` refactored to use `GL_FIELD_META` (keywords stay local) | Task 1 (Step 4) |
| `fetchAccounts` exposed from composable return | Task 1 (Step 5) |
| `AccountInlineCreate.vue` component with `accountType` + `parentGlCode` + optional `label` props | Task 2 |
| Component emits `click` with `{ accountType, parentGlCode }` payload | Task 2 (Step 3) |
| Component default label `Create new <type> account` | Task 2 (Step 3) |
| LoanProductCreate.vue replaces 8 hand-rolled blocks with single `v-for` | Task 3 (Step 4) |
| Shared `ChartOfAccountForm` modal (one instance, not 8) | Task 3 (Step 5) |
| Page-level `creatingAccount` reactive state | Task 3 (Step 3) |
| `onRequestCreate(meta)` sets modal state | Task 3 (Step 3) |
| `onAccountSaved(account)`: refetch → auto-select → close → toast | Task 3 (Step 3) |
| Glaccount warnings preserved for the 4 fields that have them | Task 3 (Step 4) — `<p v-if="glAccountWarnings[meta.field]">` |
| Vitest: AccountInlineCreate emits + labels | Task 2 (Step 1) tests 1–4 |
| Vitest: page renders 8 triggers | Task 4 (test 1) |
| Vitest: trigger 0 → modal with ASSET + 11300 | Task 4 (test 2) |
| Vitest: trigger 1 → modal with INCOME + 41100 | Task 4 (test 3) |
| Vitest: saved → refetch + auto-select + close | Task 4 (test 4) |
| Vitest: second trigger after save → fresh metadata | Task 4 (test 5) |
| Manual smoke: button placement, modal type-lock, parent default, save → toast → auto-select | Task 5 (Step 4) |
| Manual smoke: warnings still render for the 4 fields | Task 5 (Step 4 item 10) |
| Edit page (`/loan-products/{id}/edit`) uses same page component | Implicit — no extra task needed |

No gaps.

### 2. Placeholder scan

- No `TBD` / `TODO` / "implement later" / "add error handling" / "similar to Task N".
- Task 1 Step 3 has a fallback branch ("if `LoanProduct` isn't a top-level export, use `LoanProductGlField`") — both alternatives are fully spelled out, so the implementer can ship the working version without missing detail.
- Task 3 Step 5 has a fallback for ChartOfAccountForm's open prop shape — both `v-model:open` and manual `@update:open` handler are fully spelled out.
- Task 4 has guidance for additional stubs if the page imports things the initial mock set doesn't cover — concrete suggestions (lucide Proxy, common candidates) given.

### 3. Type consistency

- `GL_FIELD_META` shape — same five fields (`field`, `type`, `parent_gl_code`, `label`, `placeholder`) used identically across Task 1 (definition + tests), Task 3 (template consumption), Task 4 (test indexing).
- Event payload `{ accountType, parentGlCode }` — same shape in `AccountInlineCreate.vue` emit signature (Task 2 Step 3), test expectation (Task 2 Step 1 test 4), and page handler `onRequestCreate(meta)` (Task 3 Step 3) which reads `meta.type` and `meta.parent_gl_code` — equivalent values.
- `ChartOfAccountForm` `saved` event payload `{ id, gl_code, name, account_type, parent_id }` — same shape in Task 3 Step 3 handler signature and Task 4 test 4 emission.
- `creatingAccount` field names (`open`, `lockedAccountType`, `defaultParentGlCode`, `prefillName`, `targetField`) — consistent between Task 3 Step 3 state definition and Task 3 Step 5 template prop bindings.
