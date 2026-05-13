# Inline Credit Account Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an operator create a new INCOME chart-of-account on the spot from the General Charges drawer's Credit Account selector, without breaking COA hierarchy or double-entry integrity.

**Architecture:** Reuse the already-hardened `ChartOfAccountForm` as a nested drawer launched from a new `IncomeAccountSelect` component. Wire reactive `refreshTrigger` + `autoSelectId` props from `Create.vue` so the parent drives refresh and auto-selection without imperative refs. Add one backend cascade safeguard so an account referenced by a charge can't be silently soft-deleted.

**Tech Stack:** Vue 3 + TypeScript + Vite + Vitest + @vue/test-utils + Tailwind on the frontend; Laravel 12 + PHP 8.2 + Pest on the backend.

**Spec:** [`docs/superpowers/specs/2026-05-13-charge-credit-account-inline-create-design.md`](../specs/2026-05-13-charge-credit-account-inline-create-design.md)

---

## File Map

| Action | Repo | File |
|---|---|---|
| Modify | backend | `app/Tenant/Modules/Accounting/Services/ChartOfAccountService.php` |
| Create | backend | `tests/Feature/Tenant/CannotDeleteAccountReferencedByChargeTest.php` |
| Create | frontend | `src/Global/utils/levenshtein.ts` |
| Create | frontend | `src/Global/utils/__tests__/levenshtein.spec.ts` |
| Modify | frontend | `src/stores/profileStore.ts` |
| Modify | frontend | `src/Global/Forminputs/DynamicForm.vue` |
| Modify | frontend | `src/tenant/modules/accounting/components/ChartOfAccountForm.vue` |
| Create | frontend | `src/tenant/modules/settings/general-charges/components/IncomeAccountSelect.vue` |
| Create | frontend | `src/tenant/modules/settings/general-charges/components/__tests__/IncomeAccountSelect.spec.ts` |
| Modify | frontend | `src/tenant/modules/settings/general-charges/Create.vue` |

**Backend working directory:** `/Users/asd/Mfuko_pro/mfuko-pro-backend-2026`
**Frontend working directory:** `/Users/asd/Mfuko_pro/mfuko-pro-frontend-2026`

---

## Reference: Key code locations

- Backend service: [`app/Tenant/Modules/Accounting/Services/ChartOfAccountService.php`](../../../../mfuko-pro-backend-2026/app/Tenant/Modules/Accounting/Services/ChartOfAccountService.php) — `deleteAccount` starts at line 78
- Backend `GeneralCharge` model: `app/Tenant/Modules/Savings/Models/GeneralCharge.php` — already has `credit_account_id` field
- Frontend `DynamicForm`: `src/Global/Forminputs/DynamicForm.vue` — field type branches starting around line 302
- Frontend `ChartOfAccountForm`: `src/tenant/modules/accounting/components/ChartOfAccountForm.vue`
- Frontend `Create.vue`: `src/tenant/modules/settings/general-charges/Create.vue`
- Frontend `profileStore`: `src/stores/profileStore.ts` — `permissions` ref at line 15
- Frontend `chartOfAccountsApi`: `src/tenant/apis/chartOfAccounts/chartOfAccountsApi.ts` — already supports `account_type`, `is_postable` params on `list`
- Existing component test pattern: `src/tenant/modules/loans/components/__tests__/ReceiveCashModal.spec.ts`

Backend's `ChartOfAccountController::store` **already returns** `{ message, data: ChartOfAccountsResource($account) }` — no store-response extension needed.

---

## Task 1: Backend cascade safeguard — block delete when a GeneralCharge references the account

**Files:**
- Modify: `app/Tenant/Modules/Accounting/Services/ChartOfAccountService.php` (deleteAccount at line 78)
- Create: `tests/Feature/Tenant/CannotDeleteAccountReferencedByChargeTest.php`

Working dir: `/Users/asd/Mfuko_pro/mfuko-pro-backend-2026`

- [ ] **Step 1: Write the failing Pest test**

Create `tests/Feature/Tenant/CannotDeleteAccountReferencedByChargeTest.php`:

```php
<?php

use App\Tenant\Modules\Accounting\Models\ChartOfAccount;
use App\Tenant\Modules\Savings\Models\GeneralCharge;
use App\Tenant\Modules\Accounting\Services\ChartOfAccountService;

uses(\Tests\TenantTestCase::class);

it('blocks deletion when a general charge references the account', function () {
    $account = ChartOfAccount::create([
        'gl_code' => '42999',
        'name' => 'Test Inline Income',
        'account_type' => 'INCOME',
        'normal_balance' => 'CR',
        'is_postable' => true,
        'is_active' => true,
        'is_control' => false,
        'level' => 3,
    ]);

    GeneralCharge::create([
        'name' => 'Test Charge',
        'is_revenue' => true,
        'application' => 'on_loan_application',
        'amount' => 1000,
        'credit_account_id' => $account->id,
        'is_reversible' => true,
    ]);

    $service = app(ChartOfAccountService::class);

    expect(fn () => $service->deleteAccount($account->id))
        ->toThrow(\Exception::class, 'Cannot delete account referenced by a general charge.');
});

it('still allows deletion when no general charge references the account', function () {
    $account = ChartOfAccount::create([
        'gl_code' => '42998',
        'name' => 'Test Orphan Income',
        'account_type' => 'INCOME',
        'normal_balance' => 'CR',
        'is_postable' => true,
        'is_active' => true,
        'is_control' => false,
        'level' => 3,
    ]);

    $service = app(ChartOfAccountService::class);

    expect($service->deleteAccount($account->id))->toBeTrue();
});
```

- [ ] **Step 2: Run the test, verify it fails**

```bash
php artisan test --filter=CannotDeleteAccountReferencedByChargeTest
```

Expected: first test fails (no exception thrown — the safeguard doesn't exist yet). Second test passes (existing path).

- [ ] **Step 3: Add the cascade check to `ChartOfAccountService::deleteAccount`**

Open `app/Tenant/Modules/Accounting/Services/ChartOfAccountService.php`. Add the `GeneralCharge` import at the top of the use block:

```php
use App\Tenant\Modules\Savings\Models\GeneralCharge;
```

Modify `deleteAccount` to add the new check between the children check and the journal-entry check. The full method should read:

```php
public function deleteAccount(int $id): bool
{
    $account = $this->repository->findById($id);
    if (! $account) {
        return false;
    }

    if ($account->children()->count() > 0) {
        throw new \Exception('Cannot delete account with sub-accounts.');
    }

    if (GeneralCharge::on('tenant')->where('credit_account_id', $id)->exists()) {
        throw new \Exception('Cannot delete account referenced by a general charge.');
    }

    if ($account->journalEntryLines()->count() > 0) {
        throw new \Exception('Cannot delete account with transactions.');
    }

    return $this->repository->delete($id);
}
```

- [ ] **Step 4: Run the test, verify both pass**

```bash
php artisan test --filter=CannotDeleteAccountReferencedByChargeTest
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add app/Tenant/Modules/Accounting/Services/ChartOfAccountService.php \
        tests/Feature/Tenant/CannotDeleteAccountReferencedByChargeTest.php
git commit -m "feat: block COA delete when referenced by a general charge"
```

---

## Task 2: Frontend Levenshtein utility (for fuzzy duplicate match)

**Files:**
- Create: `src/Global/utils/levenshtein.ts`
- Create: `src/Global/utils/__tests__/levenshtein.spec.ts`

Working dir: `/Users/asd/Mfuko_pro/mfuko-pro-frontend-2026`

- [ ] **Step 1: Write the failing tests**

Create `src/Global/utils/__tests__/levenshtein.spec.ts`:

```ts
/* @vitest-environment node */

import { describe, expect, it } from 'vitest'
import { levenshtein, isNearMatch } from '../levenshtein'

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('cash', 'cash')).toBe(0)
  })

  it('returns the number of single-character edits', () => {
    expect(levenshtein('cash', 'casm')).toBe(1)
    expect(levenshtein('cash', 'cashm')).toBe(1)
    expect(levenshtein('cash', 'csh')).toBe(1)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })

  it('is case-insensitive after lowercasing inputs', () => {
    expect(levenshtein('CASH', 'cash')).toBe(0)
  })

  it('trims whitespace before comparing', () => {
    expect(levenshtein('  cash ', 'cash')).toBe(0)
  })
})

describe('isNearMatch', () => {
  it('returns true when needle is a case-insensitive substring of haystack', () => {
    expect(isNearMatch('sms', 'SMS Notification Fee')).toBe(true)
  })

  it('returns true when Levenshtein distance is <= 2', () => {
    expect(isNearMatch('SMS Notification Fee', 'SMS Notifcation Fee')).toBe(true)
  })

  it('returns false when neither rule matches', () => {
    expect(isNearMatch('Bank Charge', 'SMS Notification Fee')).toBe(false)
  })

  it('returns false for an exact-name match (caller wants near, not exact)', () => {
    expect(isNearMatch('SMS Notification Fee', 'SMS Notification Fee')).toBe(false)
  })

  it('ignores leading/trailing whitespace and case', () => {
    expect(isNearMatch('  sms  ', 'SMS Notification Fee')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests, verify they fail**

```bash
yarn test:unit src/Global/utils/__tests__/levenshtein.spec.ts
```

Expected: import error (file doesn't exist yet).

- [ ] **Step 3: Implement the utility**

Create `src/Global/utils/levenshtein.ts`:

```ts
function normalize(s: string): string {
  return s.trim().toLowerCase()
}

export function levenshtein(a: string, b: string): number {
  const s = normalize(a)
  const t = normalize(b)
  if (s === t) return 0
  if (s.length === 0) return t.length
  if (t.length === 0) return s.length

  const prev = new Array<number>(t.length + 1)
  const curr = new Array<number>(t.length + 1)

  for (let j = 0; j <= t.length; j++) prev[j] = j

  for (let i = 1; i <= s.length; i++) {
    curr[0] = i
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= t.length; j++) prev[j] = curr[j]
  }

  return prev[t.length]
}

/**
 * "Near match" for duplicate-detection hints in a typeahead.
 * Returns true if `needle` is a case-insensitive substring of `haystack`,
 * OR the Levenshtein distance between them is <= 2.
 * Returns false for exact-name matches because the caller wants near, not exact.
 */
export function isNearMatch(needle: string, haystack: string): boolean {
  const n = normalize(needle)
  const h = normalize(haystack)
  if (!n || !h) return false
  if (n === h) return false
  if (h.includes(n)) return true
  return levenshtein(n, h) <= 2
}
```

- [ ] **Step 4: Run the tests, verify they pass**

```bash
yarn test:unit src/Global/utils/__tests__/levenshtein.spec.ts
```

Expected: 10 passed (4 in `levenshtein`, 6 in `isNearMatch`).

- [ ] **Step 5: Commit**

```bash
git add src/Global/utils/levenshtein.ts src/Global/utils/__tests__/levenshtein.spec.ts
git commit -m "feat: add levenshtein + isNearMatch helpers for fuzzy duplicate detection"
```

---

## Task 3: Frontend `profileStore.hasPermission` helper

**Files:**
- Modify: `src/stores/profileStore.ts`

- [ ] **Step 1: Read the current store layout**

Open `src/stores/profileStore.ts`. Verify the existing structure — there's a `permissions = ref<string[]>([])` at line 15 and the store returns `{ permissions, ... }` (around line 148).

- [ ] **Step 2: Add the `hasPermission` getter**

Inside the store's `defineStore` setup function, right after the `permissions` ref declaration, add:

```ts
function hasPermission(name: string): boolean {
  return permissions.value.includes(name)
}
```

Then in the return statement at the bottom of the store, add `hasPermission` to the exported keys:

```ts
return {
  // ...existing keys
  permissions,
  hasPermission,
  // ...rest
}
```

- [ ] **Step 3: Verify the helper is callable**

```bash
yarn type-check 2>&1 | grep -i "profileStore" || echo "OK — no profileStore type errors"
```

Expected: `OK — no profileStore type errors`.

- [ ] **Step 4: Commit**

```bash
git add src/stores/profileStore.ts
git commit -m "feat: add hasPermission helper to profileStore"
```

---

## Task 4: Frontend `DynamicForm` — add `type: 'component'` field branch

**Files:**
- Modify: `src/Global/Forminputs/DynamicForm.vue`

This adds a new field kind so the schema can mount any Vue component for one field. The component receives the field's `componentProps`, its current value via `v-model`, and any `on<EventName>` props in `componentProps` propagate as emit listeners (standard Vue behavior).

- [ ] **Step 1: Inspect existing type branches**

```bash
grep -n "field\.type ===" src/Global/Forminputs/DynamicForm.vue
```

Note the line of the last `<template v-else-if="field.type === '...'">` block — the new branch goes just before whatever closes the `v-if/v-else-if` chain.

- [ ] **Step 2: Add the `component` branch**

In `src/Global/Forminputs/DynamicForm.vue`, after the last `<template v-else-if="field.type === '...'">` block and before the chain closes, add:

```vue
<template v-else-if="field.type === 'component' && field.component">
  <component
    :is="field.component"
    :modelValue="form[field.name]"
    @update:modelValue="(val: any) => { form[field.name] = val }"
    v-bind="field.componentProps ?? {}"
  />
  <div v-if="field.error" class="mt-2 px-1 text-xs text-red-500 font-medium">{{ field.error }}</div>
</template>
```

(Indent to match surrounding code — usually 32 spaces in this file.)

- [ ] **Step 3: Verify the file still parses**

```bash
yarn type-check 2>&1 | grep -i "DynamicForm" || echo "OK — no DynamicForm type errors"
```

Expected: `OK — no DynamicForm type errors`.

- [ ] **Step 4: Commit**

```bash
git add src/Global/Forminputs/DynamicForm.vue
git commit -m "feat: support type:'component' field rendering in DynamicForm"
```

---

## Task 5: Frontend `ChartOfAccountForm` — `lockedAccountType` prop

**Files:**
- Modify: `src/tenant/modules/accounting/components/ChartOfAccountForm.vue`

- [ ] **Step 1: Add the prop**

In `<script setup>`, replace the existing `defineProps` block:

```ts
const props = defineProps<{
  open: boolean
}>()
```

with:

```ts
const props = defineProps<{
  open: boolean
  lockedAccountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
}>()
```

- [ ] **Step 2: Honor the locked type in the reset block**

In the watch on `() => props.open` reset block, replace the line:

```ts
account_type: 'ASSET',
```

with:

```ts
account_type: props.lockedAccountType ?? 'ASSET',
```

In the same block, replace:

```ts
normal_balance: 'DR',
```

with:

```ts
normal_balance: NORMAL_BALANCE_BY_TYPE[props.lockedAccountType ?? 'ASSET'] || 'DR',
```

so the initial display matches the locked type's normal balance (e.g. `CR` when locked to `INCOME`).

- [ ] **Step 3: Render the type as read-only when locked**

In the template, find the existing Account Type field:

```vue
<div class="flex flex-col gap-1.5">
  <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
    >Account Type <span class="text-red-500">*</span></label
  >
  <select
    v-model="form.account_type"
    class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
  >
    <option value="ASSET">Asset</option>
    <option value="LIABILITY">Liability</option>
    <option value="EQUITY">Equity</option>
    <option value="INCOME">Income</option>
    <option value="EXPENSE">Expense</option>
  </select>
  <span v-if="errors.account_type" class="text-xs text-red-500">{{
    errors.account_type[0]
  }}</span>
</div>
```

Replace the `<select>` block with conditional rendering — a read-only `<div>` when locked, the `<select>` otherwise. The replacement is:

```vue
<div class="flex flex-col gap-1.5">
  <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
    >Account Type <span class="text-red-500">*</span></label
  >
  <div
    v-if="lockedAccountType"
    class="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300"
  >
    {{ accountTypeLabel }}
  </div>
  <select
    v-else
    v-model="form.account_type"
    class="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
  >
    <option value="ASSET">Asset</option>
    <option value="LIABILITY">Liability</option>
    <option value="EQUITY">Equity</option>
    <option value="INCOME">Income</option>
    <option value="EXPENSE">Expense</option>
  </select>
  <span v-if="errors.account_type" class="text-xs text-red-500">{{
    errors.account_type[0]
  }}</span>
</div>
```

- [ ] **Step 4: Add the `accountTypeLabel` computed**

In `<script setup>`, after the existing `normalBalanceLabel` computed, add:

```ts
const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expense',
}
const accountTypeLabel = computed(() => ACCOUNT_TYPE_LABEL[form.value.account_type] || form.value.account_type)
```

- [ ] **Step 5: Sanity-check with the dev server**

```bash
yarn type-check 2>&1 | grep -i "ChartOfAccountForm" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add src/tenant/modules/accounting/components/ChartOfAccountForm.vue
git commit -m "feat: support lockedAccountType prop in ChartOfAccountForm"
```

---

## Task 6: Frontend `ChartOfAccountForm` — `defaultParentGlCode` prop

**Files:**
- Modify: `src/tenant/modules/accounting/components/ChartOfAccountForm.vue`

- [ ] **Step 1: Add the prop**

In the `defineProps` block, extend to:

```ts
const props = defineProps<{
  open: boolean
  lockedAccountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  defaultParentGlCode?: string
}>()
```

- [ ] **Step 2: Apply the default after parents load**

In the `watch(() => props.open, ...)` block, the `try { ... }` clause currently ends with:

```ts
parentAccounts.value = Array.isArray(res.data?.data)
  ? res.data.data
  : Array.isArray(res.data)
    ? res.data
    : []
if (!form.value.gl_code) {
  form.value.gl_code = generateGlCode(form.value.account_type)
}
```

Replace that block with:

```ts
parentAccounts.value = Array.isArray(res.data?.data)
  ? res.data.data
  : Array.isArray(res.data)
    ? res.data
    : []

if (props.defaultParentGlCode) {
  const match = parentAccounts.value.find(
    (acc) => acc.gl_code === props.defaultParentGlCode && acc.is_control,
  )
  if (match) {
    form.value.parent_id = match.id
  }
}

if (!form.value.gl_code) {
  form.value.gl_code = generateGlCode(form.value.account_type, findParent(form.value.parent_id))
}
```

The existing `parent_id` watcher (added in a prior change) will fire automatically when `form.value.parent_id` is set and recompute the GL code under that parent. The extra `generateGlCode` call after handles the no-match fallback.

- [ ] **Step 3: Sanity-check**

```bash
yarn type-check 2>&1 | grep -i "ChartOfAccountForm" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/tenant/modules/accounting/components/ChartOfAccountForm.vue
git commit -m "feat: support defaultParentGlCode prop in ChartOfAccountForm"
```

---

## Task 7: Frontend `ChartOfAccountForm` — `prefillName` prop

**Files:**
- Modify: `src/tenant/modules/accounting/components/ChartOfAccountForm.vue`

- [ ] **Step 1: Add the prop**

Extend `defineProps` to:

```ts
const props = defineProps<{
  open: boolean
  lockedAccountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  defaultParentGlCode?: string
  prefillName?: string
}>()
```

- [ ] **Step 2: Apply during reset**

In the `watch(() => props.open, ...)` reset block, replace the line:

```ts
name: '',
```

with:

```ts
name: props.prefillName ?? '',
```

- [ ] **Step 3: Sanity-check**

```bash
yarn type-check 2>&1 | grep -i "ChartOfAccountForm" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/tenant/modules/accounting/components/ChartOfAccountForm.vue
git commit -m "feat: support prefillName prop in ChartOfAccountForm"
```

---

## Task 8: Frontend `ChartOfAccountForm` — `requireParent` prop + enriched `saved` emit

**Files:**
- Modify: `src/tenant/modules/accounting/components/ChartOfAccountForm.vue`

- [ ] **Step 1: Add the prop and extend the emits typing**

Extend `defineProps`:

```ts
const props = defineProps<{
  open: boolean
  lockedAccountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  defaultParentGlCode?: string
  prefillName?: string
  requireParent?: boolean
}>()
```

Replace `const emit = defineEmits(['update:open', 'saved'])` with:

```ts
interface SavedAccount {
  id: number
  gl_code: string
  name: string
  account_type: string
  parent_id: number | null
}
const emit = defineEmits<{
  (e: 'update:open', open: boolean): void
  (e: 'saved', account: SavedAccount): void
}>()
```

- [ ] **Step 2: Enforce `requireParent` and emit the saved record**

Replace the current `handleSubmit` with:

```ts
async function handleSubmit() {
  loading.value = true
  errors.value = {}

  if (props.requireParent && !form.value.parent_id) {
    errors.value.parent_id = ['Parent account is required.']
    loading.value = false
    return
  }

  try {
    const payload = { ...form.value }
    if (payload.parent_id === '') payload.parent_id = null
    const res = await chartOfAccountsApi.store(payload)
    const created = res.data?.data ?? res.data
    toast.success('Chart of Account created successfully')
    emit('saved', {
      id: created.id,
      gl_code: created.gl_code,
      name: created.name,
      account_type: created.account_type,
      parent_id: created.parent_id ?? null,
    })
    emit('update:open', false)
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else {
      toast.error(error.response?.data?.message || 'Failed to create chart of account')
    }
  } finally {
    loading.value = false
  }
}
```

- [ ] **Step 3: Sanity-check**

```bash
yarn type-check 2>&1 | grep -i "ChartOfAccountForm" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 4: Write a combined Vitest test for the four new props**

Create `src/tenant/modules/accounting/components/__tests__/ChartOfAccountForm.spec.ts`:

```ts
/* @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const listMock = vi.fn()
const storeMock = vi.fn()

vi.mock('@/tenant/apis/chartOfAccounts/chartOfAccountsApi', () => ({
  chartOfAccountsApi: {
    list: (...args: any[]) => listMock(...args),
    store: (...args: any[]) => storeMock(...args),
  },
}))

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/Global', () => ({
  Drawer: {
    name: 'DrawerStub',
    props: ['open', 'title', 'width', 'showFooter'],
    emits: ['update:open', 'submit'],
    template: '<div data-test="drawer"><slot name="body" /><button data-test="submit" @click="$emit(\'submit\')">submit</button></div>',
  },
}))

import ChartOfAccountForm from '../ChartOfAccountForm.vue'

const PARENTS = [
  { id: 10, gl_code: '40000', name: 'INCOME', account_type: 'INCOME', is_control: true },
  { id: 11, gl_code: '42000', name: 'Fee Income', account_type: 'INCOME', is_control: true },
  { id: 12, gl_code: '43000', name: 'Other Operating Income', account_type: 'INCOME', is_control: true },
  { id: 20, gl_code: '10000', name: 'ASSETS', account_type: 'ASSET', is_control: true },
]

beforeEach(() => {
  listMock.mockReset()
  storeMock.mockReset()
  listMock.mockResolvedValue({ data: { data: PARENTS } })
})

describe('ChartOfAccountForm — lockedAccountType', () => {
  it('renders Account Type as read-only when locked', async () => {
    const wrapper = mount(ChartOfAccountForm, {
      props: { open: true, lockedAccountType: 'INCOME' },
    })
    await flushPromises()
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.text()).toContain('Income')
  })
})

describe('ChartOfAccountForm — defaultParentGlCode', () => {
  it('pre-selects the parent whose gl_code matches', async () => {
    const wrapper = mount(ChartOfAccountForm, {
      props: { open: true, lockedAccountType: 'INCOME', defaultParentGlCode: '42000' },
    })
    await flushPromises()
    const vm = wrapper.vm as any
    expect(vm.form.parent_id).toBe(11)
  })
})

describe('ChartOfAccountForm — prefillName', () => {
  it('pre-fills the Account Name field', async () => {
    const wrapper = mount(ChartOfAccountForm, {
      props: { open: true, lockedAccountType: 'INCOME', prefillName: 'SMS Fee' },
    })
    await flushPromises()
    const vm = wrapper.vm as any
    expect(vm.form.name).toBe('SMS Fee')
  })
})

describe('ChartOfAccountForm — requireParent', () => {
  it('blocks save with an inline error when parent_id is empty', async () => {
    const wrapper = mount(ChartOfAccountForm, {
      props: { open: true, lockedAccountType: 'INCOME', requireParent: true },
    })
    await flushPromises()
    const vm = wrapper.vm as any
    vm.form.parent_id = ''
    await wrapper.find('[data-test="submit"]').trigger('click')
    await flushPromises()
    expect(storeMock).not.toHaveBeenCalled()
    expect(vm.errors.parent_id?.[0]).toMatch(/parent account is required/i)
  })
})

describe('ChartOfAccountForm — saved emit payload', () => {
  it('emits saved with the created account fields on successful save', async () => {
    storeMock.mockResolvedValue({
      data: {
        data: { id: 99, gl_code: '42500', name: 'SMS Fee', account_type: 'INCOME', parent_id: 11 },
      },
    })
    const wrapper = mount(ChartOfAccountForm, {
      props: { open: true, lockedAccountType: 'INCOME', defaultParentGlCode: '42000' },
    })
    await flushPromises()
    const vm = wrapper.vm as any
    vm.form.name = 'SMS Fee'
    await wrapper.find('[data-test="submit"]').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('saved')).toBeTruthy()
    const payload = wrapper.emitted('saved')![0][0]
    expect(payload).toEqual({
      id: 99,
      gl_code: '42500',
      name: 'SMS Fee',
      account_type: 'INCOME',
      parent_id: 11,
    })
  })
})
```

- [ ] **Step 5: Run the tests, verify they pass**

```bash
yarn test:unit src/tenant/modules/accounting/components/__tests__/ChartOfAccountForm.spec.ts
```

Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add src/tenant/modules/accounting/components/ChartOfAccountForm.vue \
        src/tenant/modules/accounting/components/__tests__/ChartOfAccountForm.spec.ts
git commit -m "feat: add requireParent prop and enriched saved emit in ChartOfAccountForm"
```

---

## Task 9: Frontend `IncomeAccountSelect` component (data + footer + fuzzy hint)

**Files:**
- Create: `src/tenant/modules/settings/general-charges/components/IncomeAccountSelect.vue`
- Create: `src/tenant/modules/settings/general-charges/components/__tests__/IncomeAccountSelect.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/tenant/modules/settings/general-charges/components/__tests__/IncomeAccountSelect.spec.ts`:

```ts
/* @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

const listMock = vi.fn()

vi.mock('@/tenant/apis/chartOfAccounts/chartOfAccountsApi', () => ({
  chartOfAccountsApi: {
    list: (...args: any[]) => listMock(...args),
  },
}))

import IncomeAccountSelect from '../IncomeAccountSelect.vue'

const ACCOUNTS = [
  { id: 1, gl_code: '42200', name: 'Loan Processing Fees' },
  { id: 2, gl_code: '42300', name: 'Account Maintenance Fees' },
  { id: 3, gl_code: '42400', name: 'Late Payment Penalties' },
]

function mountSelect(extraProps: Record<string, unknown> = {}) {
  return mount(IncomeAccountSelect, {
    props: {
      modelValue: null,
      canCreate: false,
      ...extraProps,
    },
  })
}

beforeEach(() => {
  listMock.mockReset()
  listMock.mockResolvedValue({ data: { data: ACCOUNTS } })
})

describe('IncomeAccountSelect data fetch', () => {
  it('fetches with INCOME + postable + active filters on mount', async () => {
    mountSelect()
    await flushPromises()
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenCalledWith({
      account_type: 'INCOME',
      is_postable: 1,
      list: 1,
    })
  })

  it('renders each fetched account by gl_code + name', async () => {
    const wrapper = mountSelect()
    await flushPromises()
    expect(wrapper.text()).toContain('42200 - Loan Processing Fees')
    expect(wrapper.text()).toContain('42300 - Account Maintenance Fees')
  })
})

describe('IncomeAccountSelect create-new footer', () => {
  it('hides the "+ Create new" footer when canCreate is false', async () => {
    const wrapper = mountSelect({ canCreate: false })
    await flushPromises()
    await (wrapper.find('[data-test="trigger"]').exists()
      ? wrapper.find('[data-test="trigger"]').trigger('click')
      : Promise.resolve())
    expect(wrapper.text()).not.toContain('Create new income account')
  })

  it('shows the generic "+ Create new" label when search is empty', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    expect(wrapper.text()).toContain('Create new income account')
  })

  it('shows the search-context "+ Create X" label when search is non-empty', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    await wrapper.find('[data-test="search"]').setValue('SMS Fee')
    expect(wrapper.text()).toContain('Create "SMS Fee" as income account')
  })

  it('emits requestCreate with the typed text when the footer is clicked', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    await wrapper.find('[data-test="search"]').setValue('SMS Fee')
    await wrapper.find('[data-test="create-footer"]').trigger('click')
    expect(wrapper.emitted('requestCreate')).toBeTruthy()
    expect(wrapper.emitted('requestCreate')![0]).toEqual([{ prefillName: 'SMS Fee' }])
  })
})

describe('IncomeAccountSelect fuzzy duplicate hint', () => {
  it('surfaces a "Did you mean" hint when search is near an existing name', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    await wrapper.find('[data-test="search"]').setValue('Loan Processin Fees')
    expect(wrapper.text()).toContain('Did you mean')
    expect(wrapper.text()).toContain('Loan Processing Fees')
  })

  it('does not show the hint for an exact-name match', async () => {
    const wrapper = mountSelect({ canCreate: true })
    await flushPromises()
    await wrapper.find('[data-test="trigger"]').trigger('click')
    await wrapper.find('[data-test="search"]').setValue('Loan Processing Fees')
    expect(wrapper.text()).not.toContain('Did you mean')
  })
})

describe('IncomeAccountSelect reactive refresh + auto-select', () => {
  it('refetches when refreshTrigger changes', async () => {
    const wrapper = mountSelect({ canCreate: true, refreshTrigger: 0 })
    await flushPromises()
    expect(listMock).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ refreshTrigger: 1 })
    await flushPromises()
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('emits update:modelValue when autoSelectId changes', async () => {
    const wrapper = mountSelect({ canCreate: true, autoSelectId: null })
    await flushPromises()
    await wrapper.setProps({ autoSelectId: 1 })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const last = wrapper.emitted('update:modelValue')!.at(-1)
    expect(last).toEqual([1])
  })
})
```

- [ ] **Step 2: Run the tests, verify they fail**

```bash
yarn test:unit src/tenant/modules/settings/general-charges/components/__tests__/IncomeAccountSelect.spec.ts
```

Expected: import error (component file doesn't exist).

- [ ] **Step 3: Implement the component**

Create `src/tenant/modules/settings/general-charges/components/IncomeAccountSelect.vue`:

```vue
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ChevronDown, Search, Plus } from 'lucide-vue-next'
import { chartOfAccountsApi } from '@/tenant/apis/chartOfAccounts/chartOfAccountsApi'
import { isNearMatch, levenshtein } from '@/Global/utils/levenshtein'

interface Account {
  id: number
  gl_code: string
  name: string
}

const props = defineProps<{
  modelValue: number | null
  canCreate: boolean
  placeholder?: string
  refreshTrigger?: number
  autoSelectId?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
  (e: 'requestCreate', payload: { prefillName: string }): void
}>()

const open = ref(false)
const search = ref('')
const accounts = ref<Account[]>([])
const loading = ref(false)

async function fetchAccounts() {
  loading.value = true
  try {
    const res = await chartOfAccountsApi.list({
      account_type: 'INCOME',
      is_postable: 1,
      list: 1,
    })
    const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
    accounts.value = data.slice().sort((a: Account, b: Account) => a.gl_code.localeCompare(b.gl_code))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAccounts()
})

watch(
  () => props.refreshTrigger,
  (val, prev) => {
    if (val !== prev && val !== undefined) {
      fetchAccounts()
    }
  },
)

watch(
  () => props.autoSelectId,
  (val) => {
    if (val !== null && val !== undefined) {
      emit('update:modelValue', val)
    }
  },
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return accounts.value
  return accounts.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.gl_code.toLowerCase().includes(q),
  )
})

const hasExactMatch = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return false
  return accounts.value.some((a) => a.name.trim().toLowerCase() === q)
})

const nearMatches = computed(() => {
  const q = search.value.trim()
  if (q.length <= 2 || hasExactMatch.value) return []
  return accounts.value
    .filter((a) => isNearMatch(q, a.name))
    .sort((a, b) => levenshtein(q, a.name) - levenshtein(q, b.name))
    .slice(0, 2)
})

const selectedLabel = computed(() => {
  const id = props.modelValue
  if (id === null) return ''
  const match = accounts.value.find((a) => a.id === id)
  return match ? `${match.gl_code} - ${match.name}` : ''
})

const createFooterLabel = computed(() => {
  const q = search.value.trim()
  return q ? `Create "${q}" as income account` : 'Create new income account'
})

function select(account: Account) {
  emit('update:modelValue', account.id)
  open.value = false
  search.value = ''
}

function onCreateClick() {
  emit('requestCreate', { prefillName: search.value.trim() })
  open.value = false
}
</script>

<template>
  <div class="relative w-full">
    <button
      data-test="trigger"
      type="button"
      class="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-left dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
      @click="open = !open"
    >
      <span :class="selectedLabel ? '' : 'text-neutral-400'">
        {{ selectedLabel || placeholder || 'Select income account' }}
      </span>
      <ChevronDown class="size-4 text-neutral-400" />
    </button>

    <div
      v-if="open"
      class="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div class="border-b border-neutral-100 p-2 dark:border-neutral-800">
        <div class="relative">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            data-test="search"
            v-model="search"
            class="w-full rounded-md border border-neutral-200 bg-neutral-50 pl-8 pr-2 py-1.5 text-sm outline-none focus:border-nfuko-primary dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            placeholder="Search income accounts"
          />
        </div>
      </div>

      <div v-if="nearMatches.length > 0" class="p-2 border-b border-neutral-100 dark:border-neutral-800">
        <div class="text-[11px] font-semibold text-amber-700 dark:text-amber-300 px-1 mb-1">
          Did you mean…?
        </div>
        <button
          v-for="m in nearMatches"
          :key="m.id"
          type="button"
          class="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-amber-50 dark:hover:bg-amber-500/10"
          @click="select(m)"
        >
          {{ m.gl_code }} - {{ m.name }}
        </button>
      </div>

      <div class="max-h-60 overflow-y-auto py-1">
        <div v-if="loading" class="px-3 py-2 text-sm text-neutral-500">Loading…</div>
        <div v-else-if="filtered.length === 0" class="px-3 py-2 text-sm text-neutral-500">
          No income accounts found
        </div>
        <button
          v-for="account in filtered"
          :key="account.id"
          type="button"
          class="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-white/5"
          @click="select(account)"
        >
          {{ account.gl_code }} - {{ account.name }}
        </button>
      </div>

      <div v-if="canCreate" class="border-t border-neutral-100 p-1 dark:border-neutral-800">
        <button
          data-test="create-footer"
          type="button"
          class="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-nfuko-primary hover:bg-neutral-50 dark:hover:bg-white/5"
          @click="onCreateClick"
        >
          <Plus class="size-4" />
          <span>{{ createFooterLabel }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Run the tests, verify they pass**

```bash
yarn test:unit src/tenant/modules/settings/general-charges/components/__tests__/IncomeAccountSelect.spec.ts
```

Expected: all 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/tenant/modules/settings/general-charges/components/IncomeAccountSelect.vue \
        src/tenant/modules/settings/general-charges/components/__tests__/IncomeAccountSelect.spec.ts
git commit -m "feat: add IncomeAccountSelect with fuzzy duplicate hint and create footer"
```

---

## Task 10: Frontend — wire `Create.vue` to use `IncomeAccountSelect` + nested `ChartOfAccountForm`

**Files:**
- Modify: `src/tenant/modules/settings/general-charges/Create.vue`

- [ ] **Step 1: Replace the file contents**

Replace `src/tenant/modules/settings/general-charges/Create.vue` entirely with:

```vue
<template>
  <div class="card shadow-md px-4 py-3 bg-white dark:bg-neutral-800 rounded-md" style="overflow: auto;height: 88%;">
    <Form :action="data?.action" parentStyle="grid  grid-cols-1 gap-3" v-model:form="fields" />
    <ChartOfAccountForm
      v-model:open="creatingAccount.open"
      locked-account-type="INCOME"
      default-parent-gl-code="42000"
      :prefill-name="creatingAccount.prefillName"
      require-parent
      @saved="onAccountSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, ref } from 'vue'
import { Form } from '@/Global'
import { savingsProductsApi } from '@/tenant/apis/savingsProducts/api'
import {
  APPLICATION_OPTIONS,
  CHARGE_TYPE_OPTIONS,
  WHERE_TO_APPLY_OPTIONS,
  INTERVAL_TYPE_OPTIONS,
  IS_FINE_OPTIONS,
  IS_REVENUE_OPTIONS,
} from '../constants'
import IncomeAccountSelect from './components/IncomeAccountSelect.vue'
import ChartOfAccountForm from '@/tenant/modules/accounting/components/ChartOfAccountForm.vue'
import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'vue-sonner'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})

const profileStore = useProfileStore()

const refreshIncomeAccounts = ref(0)
const autoSelectId = ref<number | null>(null)
const creatingAccount = ref<{ open: boolean; prefillName: string }>({
  open: false,
  prefillName: '',
})

const canCreateCoa = computed(() => profileStore.hasPermission('chart_of_accounts.create'))

const incomeAccountComponentProps = computed(() => ({
  canCreate: canCreateCoa.value,
  refreshTrigger: refreshIncomeAccounts.value,
  autoSelectId: autoSelectId.value,
  onRequestCreate: (payload: { prefillName: string }) => {
    creatingAccount.value = { open: true, prefillName: payload.prefillName }
  },
}))

const fields = ref<any[]>([
  {
    label: 'Is it a revenue',
    name: 'is_revenue',
    type: 'select',
    required: true,
    options: IS_REVENUE_OPTIONS,
    placeholder: 'Select option',
  },
  {
    label: 'Charge Name',
    name: 'name',
    type: 'text',
    required: true,
    placeholder: 'Enter charge name',
  },
  {
    label: 'Application',
    name: 'application',
    type: 'select',
    required: true,
    options: APPLICATION_OPTIONS,
    placeholder: 'Select application',
  },
  {
    label: 'Saving Products',
    name: 'saving_product_ids',
    type: 'multi-select',
    dependsOn: {
      field: 'application',
      value: 'on_registration',
    },
    options: [],
    placeholder: 'Choose saving products',
  },
  {
    label: 'Loan Products',
    name: 'loan_product_ids',
    type: 'multi-select',
    dependsOn: {
      conditions: [
        { field: 'application', value: 'on_loan_application' },
        { field: 'where_to_apply', value: 'loans' },
      ],
      operator: 'or',
    },
    url: 'global/loan-products',
    dataOnMount: true,
    placeholder: 'Choose loan products',
  },
  {
    label: 'Charge Type',
    name: 'charge_type',
    type: 'select',
    options: CHARGE_TYPE_OPTIONS,
    placeholder: 'Select type',
    change: (val: string) => {
      const amountField = fields.value.find((f: any) => f.name === 'amount')
      if (!amountField) return
      if (val === 'percentage') {
        amountField.label = 'Percentage (%)'
        amountField.placeholder = 'Enter percentage (0 - 100)'
      } else {
        amountField.label = 'Amount'
        amountField.placeholder = 'Enter amount'
      }
    },
  },
  {
    label: 'Amount',
    name: 'amount',
    type: 'number',
    required: true,
    placeholder: 'Enter amount',
  },
  {
    label: 'Interval Type',
    name: 'interval_type',
    type: 'select',
    options: INTERVAL_TYPE_OPTIONS,
    dependsOn: {
      field: 'application',
      value: 'other',
    },
  },
  {
    label: 'Interval',
    name: 'interval',
    type: 'number',
    dependsOn: {
      field: 'application',
      value: 'other',
    },
    placeholder: 'Enter interval',
  },
  {
    label: 'Is Fine?',
    name: 'is_fine',
    type: 'select',
    options: IS_FINE_OPTIONS,
    dependsOn: {
      field: 'where_to_apply',
      value: 'loans',
    },
  },
  {
    label: 'Credit Account',
    name: 'credit_account_id',
    type: 'component',
    component: markRaw(IncomeAccountSelect),
    componentProps: incomeAccountComponentProps,
    condition: (val: string) => ['on_registration', 'on_loan_application'].includes(val),
  },
])

function promtValueOnUpdate() {
  if (!props.data) return
  Object.entries(props.data).forEach(([key, value]) => {
    const field = fields.value.find((f: any) => f.name === key)
    if (field) (field as any).value = value
  })
}

async function fetchSavingProducts() {
  try {
    const res = await savingsProductsApi.list()
    const data = res.data?.data ?? res.data ?? []
    const field = fields.value.find((f: any) => f.name === 'saving_product_ids')
    if (field)
      field.options = Array.isArray(data)
        ? data.map((p: any) => ({ id: p.id, name: p.name ?? `Product ${p.id}` }))
        : []
  } catch {
    // surface left empty intentionally
  }
}

function onAccountSaved(account: {
  id: number
  gl_code: string
  name: string
  account_type: string
  parent_id: number | null
}) {
  creatingAccount.value.open = false
  refreshIncomeAccounts.value += 1
  autoSelectId.value = account.id
  toast.success(`Created income account ${account.gl_code} - ${account.name}`)
}

onMounted(() => {
  promtValueOnUpdate()
  fetchSavingProducts()
})
</script>
```

- [ ] **Step 2: Type-check**

```bash
yarn type-check 2>&1 | grep -i "general-charges/Create\|IncomeAccountSelect" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/tenant/modules/settings/general-charges/Create.vue
git commit -m "feat: inline COA creation via IncomeAccountSelect in general-charges drawer"
```

---

## Task 11: Manual smoke test (end-to-end)

No code changes — verify the integration end-to-end in a running app.

- [ ] **Step 1: Start backend + frontend dev servers**

Backend (in `/Users/asd/Mfuko_pro/mfuko-pro-backend-2026`):

```bash
composer dev
```

Frontend (in `/Users/asd/Mfuko_pro/mfuko-pro-frontend-2026`):

```bash
yarn dev
```

- [ ] **Step 2: Smoke flow**

1. Log in as a tenant admin (has `chart_of_accounts.create` permission).
2. Navigate to `tenant/settings/general-charges`.
3. Click **+ Add Charge**.
4. Fill `Is it a revenue` = Yes, `Charge Name` = "Test SMS Charge", `Application` = "On loan application", select any loan product, set `Amount` = 1000.
5. Click the **Credit Account** dropdown.

   **Verify:** the list shows INCOME accounts only, sorted by gl_code (42100, 42200, 42250, 42300, …). No control headers (42000 Fee Income) appear in the list.

6. Type "SMS Notifcation Fe" (intentional typo).

   **Verify:** a `Did you mean…?` hint surfaces if any near-name exists in your data (you may need to seed an "SMS Notification Fee" first to trigger this; otherwise skip this check).

7. Click the **➕ Create "SMS Notifcation Fe" as income account** footer.

   **Verify:** the `ChartOfAccountForm` nested drawer opens with:
   - Account Type field showing **Income** as a read-only display (no dropdown).
   - Account Name pre-filled with "SMS Notifcation Fe".
   - Normal Balance showing **Credit (CR)**.
   - Parent Account pre-selected to **42000 - Fee Income**.

8. Correct the Account Name to "SMS Notification Fee". Click **Save**.

   **Verify:**
   - Nested drawer closes.
   - Toast appears: `Created income account 42500 - SMS Notification Fee` (or next available GL code under 42000).
   - The Credit Account dropdown in the charge drawer now shows the new account selected.

9. Click **Save** on the charge drawer.

   **Verify:** the new General Charge appears in the list with the correct credit account.

10. Navigate to `tenant/chart-of-accounts`. Find the newly created account. Attempt to delete it.

    **Verify:** the delete is blocked with the message `Cannot delete account referenced by a general charge.`

- [ ] **Step 3: Permission gating sanity-check**

1. Log out and log in as a user without `chart_of_accounts.create` permission (e.g. a teller role).
2. Navigate to `tenant/settings/general-charges` → click **+ Add Charge**.
3. Open the Credit Account dropdown.

   **Verify:** the **+ Create new** footer is **NOT rendered**.

- [ ] **Step 4: Record the result**

If anything in the smoke flow misbehaves, file a bug pointing at the specific task above and fix. If everything works, this is done.

No commit needed for smoke test.

---

## Self-review notes

- Spec coverage:
  - Selector behavior (Task 9 — fetch with INCOME+postable+active, sort, footer).
  - Nested drawer pre-fill + locking (Tasks 5–8 cover all four new props on `ChartOfAccountForm`, plus Task 10 wires them in `Create.vue`).
  - After-save glue (Task 10's `onAccountSaved` — refreshTrigger++, autoSelectId, toast).
  - Duplicate guard (Task 2 utility, Task 9 wires it as `nearMatches` computed).
  - Permission gating (Task 3 helper, Task 10 reads `profileStore.hasPermission('chart_of_accounts.create')`).
  - Cascade safeguard (Task 1).
  - Test plan (every Vitest/Pest item in the spec maps to a task — frontend tests in Tasks 2 + 9, backend test in Task 1, manual smoke in Task 11).
- Out-of-scope items (non-INCOME for `is_revenue=false`, editing inline-created accounts from the drawer, generalizing to other selectors) are explicitly **not** in this plan.
- Type consistency check passed: `SavedAccount` shape used in Task 8 matches the `onAccountSaved` handler signature in Task 10.
