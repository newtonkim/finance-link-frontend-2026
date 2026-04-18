# Rescheduled & Topped Up Loan Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Rescheduled Loans" (fully functional) and "Topped Up Loans" (coming-soon placeholder) tabs to the Active Loans page at `/tenant/loans`.

**Architecture:** The Rescheduled tab filters by the existing `is_rescheduled` boolean on the `loans` table via a new `rescheduled` tab case in `LoanController`. The Topped Up tab is frontend-only — it renders a coming-soon empty state and skips all API calls. Both tabs slot into the existing tab bar in `ActiveLoansIndex.vue`.

**Tech Stack:** Laravel 12 (PHP 8.2), Vue 3 + TypeScript, Pint (PHP linting), Pest (PHP tests)

---

## File Map

| File | Change |
|------|--------|
| `app/Tenant/Http/Controllers/Api/V1/LoanController.php` | Add `rescheduled` case to `index()` and `summary()` |
| `mfuko-pro-frontend-2026/src/tenant/apis/loans/loansApi.ts` | Extend `LoanTab` and `LoanSummary` types |
| `mfuko-pro-frontend-2026/src/tenant/modules/loans/composables/useActiveLoans.ts` | Handle `rescheduled` + `topup` tabs in `fetch()` and summary init |
| `mfuko-pro-frontend-2026/src/tenant/modules/loans/pages/ActiveLoansIndex.vue` | Add two tab entries; render coming-soon state for topup tab |

---

### Task 1: Backend — support `rescheduled` tab in `summary()` and `index()`

**Files:**
- Modify: `app/Tenant/Http/Controllers/Api/V1/LoanController.php`

- [ ] **Step 1: Add `rescheduled` count to `summary()`**

Open `app/Tenant/Http/Controllers/Api/V1/LoanController.php`.

Find the `summary()` method. It currently returns a JSON object. Add a `rescheduled` key that counts loans where `is_rescheduled = true`, respecting the branch filter:

```php
public function summary(Request $request): JsonResponse
{
    $branchId = $request->header('X-Acting-Branch-Id');

    $pendingStatuses = LoanApplication::getPendingStatuses();

    $disbursedStatuses = [
        LoanStatus::Disbursed->value,
        LoanStatus::Active->value,
        LoanStatus::Closed->value,
        LoanStatus::Arrears->value,
    ];

    $loanCount = function ($statusArr = null) use ($branchId) {
        $q = Loan::query();
        if ($branchId) {
            $q->where('branch_id', (int) $branchId);
        }
        if ($statusArr) {
            $q->whereIn('status', $statusArr);
        }

        return $q->count();
    };

    $appCount = function ($statusArr, $excludeDisbursed = false) use ($branchId) {
        $q = LoanApplication::query();
        if ($branchId) {
            $q->where('branch_id', (int) $branchId);
        }
        $q->whereIn('status', $statusArr);
        if ($excludeDisbursed) {
            $q->whereNull('disbursed_loan_id')
                ->where('status', '!=', LoanApplication::STATUS_DISBURSED);
        }

        return $q->count();
    };

    $rescheduledCount = Loan::query()
        ->when($branchId, fn ($q) => $q->where('branch_id', (int) $branchId))
        ->where('is_rescheduled', true)
        ->count();

    return response()->json([
        'disbursed'    => $loanCount($disbursedStatuses),
        'approved'     => $appCount(['approved']),
        'pending'      => $appCount($pendingStatuses, true),
        'arrears'      => $loanCount(['arrears']),
        'closed'       => $loanCount([LoanStatus::Closed->value]),
        'all'          => $loanCount(),
        'rescheduled'  => $rescheduledCount,
    ]);
}
```

- [ ] **Step 2: Add `rescheduled` tab case to `index()`**

In the same file, find the `index()` method. It has a `match ($tab)` block. Add `rescheduled` case:

```php
match ($tab) {
    'disbursed'    => $query->whereIn('status', [LoanStatus::Disbursed, LoanStatus::Active, LoanStatus::Closed]),
    'arrears'      => $query->where('status', LoanStatus::Arrears),
    'rescheduled'  => $query->where('is_rescheduled', true),
    default        => null,
};
```

- [ ] **Step 3: Run PHP linter to confirm no style issues**

From `mfuko-pro-backend-2026/`:
```bash
composer lint
```
Expected: no errors, files reformatted if needed.

- [ ] **Step 4: Verify the endpoint manually (optional smoke test)**

If a tenant database is running locally, call:
```
GET /api/v1/tenant/loans?tab=rescheduled
GET /api/v1/tenant/loans/summary
```
Expected: `rescheduled` key present in summary response; loans list filtered to `is_rescheduled = true`.

- [ ] **Step 5: Commit**

```bash
cd mfuko-pro-backend-2026
git add app/Tenant/Http/Controllers/Api/V1/LoanController.php
git commit -m "feat(loans): add rescheduled tab support to summary and index endpoints"
```

---

### Task 2: Frontend — extend API types

**Files:**
- Modify: `src/tenant/apis/loans/loansApi.ts`

- [ ] **Step 1: Extend `LoanTab` and `LoanSummary`**

Open `src/tenant/apis/loans/loansApi.ts`.

Find line 70:
```ts
export type LoanTab = 'all' | 'disbursed' | 'arrears' | 'closed' | 'approved' | 'pending'
```
Replace with:
```ts
export type LoanTab = 'all' | 'disbursed' | 'arrears' | 'closed' | 'approved' | 'pending' | 'rescheduled' | 'topup'
```

Find the `LoanSummary` interface (lines 61–68):
```ts
export interface LoanSummary {
  disbursed: number
  approved: number
  pending: number
  arrears: number
  closed?: number
  all: number
}
```
Replace with:
```ts
export interface LoanSummary {
  disbursed: number
  approved: number
  pending: number
  arrears: number
  closed?: number
  all: number
  rescheduled?: number
  topup?: number
}
```

- [ ] **Step 2: Run TypeScript check**

From `mfuko-pro-frontend-2026/`:
```bash
pnpm type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd mfuko-pro-frontend-2026
git add src/tenant/apis/loans/loansApi.ts
git commit -m "feat(loans): extend LoanTab and LoanSummary types for rescheduled and topup tabs"
```

---

### Task 3: Frontend — update `useActiveLoans` composable

**Files:**
- Modify: `src/tenant/modules/loans/composables/useActiveLoans.ts`

- [ ] **Step 1: Initialize `rescheduled` and `topup` in summary**

Open `src/tenant/modules/loans/composables/useActiveLoans.ts`.

Find the `summary` ref initializer (around line 20):
```ts
const summary = ref<LoanSummary>({
    disbursed: 0,
    approved: 0,
    pending: 0,
    arrears: 0,
    closed: 0,
    all: 0,
})
```
Replace with:
```ts
const summary = ref<LoanSummary>({
    disbursed: 0,
    approved: 0,
    pending: 0,
    arrears: 0,
    closed: 0,
    all: 0,
    rescheduled: 0,
    topup: 0,
})
```

- [ ] **Step 2: Guard `fetch()` for the topup tab**

Find the `fetch()` function. At the top of the function body (before `loading.value = true`), add an early return for the topup tab:

```ts
async function fetch(page = 1) {
    if (activeTab.value === 'topup') {
        loans.value = []
        Object.assign(meta, { current_page: 1, last_page: 1, per_page: 10, total: 0 })
        return
    }
    loading.value = true
    // ... rest of function unchanged
```

- [ ] **Step 3: Handle `rescheduled` tab in fetch params**

Inside `fetch()`, find the `match`-like if/else block that builds params:
```ts
if (activeTab.value === 'closed') {
    params.tab = 'all'
    params.status = 'closed'
} else if (activeTab.value === 'disbursed') {
    params.tab = 'disbursed'
    delete params.status
} else {
    params.tab = activeTab.value
    delete params.status
}
```
Replace with:
```ts
if (activeTab.value === 'closed') {
    params.tab = 'all'
    params.status = 'closed'
} else if (activeTab.value === 'disbursed') {
    params.tab = 'disbursed'
    delete params.status
} else if (activeTab.value === 'rescheduled') {
    params.tab = 'rescheduled'
    delete params.status
} else {
    params.tab = activeTab.value
    delete params.status
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
pnpm type-check
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/tenant/modules/loans/composables/useActiveLoans.ts
git commit -m "feat(loans): handle rescheduled and topup tabs in useActiveLoans composable"
```

---

### Task 4: Frontend — add tabs and coming-soon state to `ActiveLoansIndex.vue`

**Files:**
- Modify: `src/tenant/modules/loans/pages/ActiveLoansIndex.vue`

- [ ] **Step 1: Add the two new tab entries**

Open `src/tenant/modules/loans/pages/ActiveLoansIndex.vue`.

Find the `tabs` array (around line 125):
```ts
const tabs: { key: LoanTab; label: string; countKey: keyof typeof summary.value; color: string }[] = [
  { key: 'all',      label: 'All Loans',      countKey: 'all',      color: 'nfuko-primary' },
  { key: 'disbursed',label: 'Disbursed Loans', countKey: 'disbursed',color: 'nfuko-action' },
  { key: 'arrears',  label: 'In Arrears',      countKey: 'arrears',  color: 'nfuko-danger' },
  { key: 'closed',   label: 'Closed Loans',    countKey: 'closed',   color: 'nfuko-primary' },
  { key: 'approved', label: 'Approved Loans',  countKey: 'approved', color: 'nfuko-blue' },
]
```
Replace with:
```ts
const tabs: { key: LoanTab; label: string; countKey: keyof typeof summary.value; color: string }[] = [
  { key: 'all',          label: 'All Loans',          countKey: 'all',         color: 'nfuko-primary' },
  { key: 'disbursed',    label: 'Disbursed Loans',     countKey: 'disbursed',   color: 'nfuko-action' },
  { key: 'arrears',      label: 'In Arrears',          countKey: 'arrears',     color: 'nfuko-danger' },
  { key: 'closed',       label: 'Closed Loans',        countKey: 'closed',      color: 'nfuko-primary' },
  { key: 'approved',     label: 'Approved Loans',      countKey: 'approved',    color: 'nfuko-blue' },
  { key: 'rescheduled',  label: 'Rescheduled Loans',   countKey: 'rescheduled', color: 'nfuko-action' },
  { key: 'topup',        label: 'Topped Up Loans',     countKey: 'topup',       color: 'nfuko-blue' },
]
```

- [ ] **Step 2: Add the coming-soon empty state for the topup tab**

In the `<template>`, find the content area. It currently has a single root `<div class="flex-1 overflow-auto ...">` containing the search bar, filters, table card, and pagination. Wrap those existing sections in a `v-if="activeTab !== 'topup'"` and add a `v-else` block for the coming-soon state.

Find:
```html
    <!-- Content -->
    <div class="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
      <!-- Search bar & Export -->
```

Replace the entire Content div open tag and its contents with:
```html
    <!-- Content -->
    <div class="flex-1 overflow-auto p-4 sm:p-6 space-y-4">

      <!-- Coming Soon: Topped Up Loans -->
      <div
        v-if="activeTab === 'topup'"
        class="flex flex-col items-center justify-center py-24 gap-4 text-neutral-400"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p class="text-base font-semibold text-neutral-600 dark:text-neutral-300">Topped Up Loans</p>
        <p class="text-sm text-neutral-400 dark:text-neutral-500 text-center max-w-xs">
          This feature is currently under development. Topped-up loan tracking will be available in a future release.
        </p>
      </div>

      <template v-else>
      <!-- Search bar & Export -->
```

Then close the `<template v-else>` just before the closing `</div>` of the content area:

Find the closing `</div>` that closes the content `flex-1 overflow-auto` div (after the pagination block), and insert `</template>` before it:
```html
      </div>
      <!-- end pagination -->
      </template>

    </div>
    <!-- end content -->
```

- [ ] **Step 3: Run TypeScript check**

```bash
pnpm type-check
```
Expected: no errors.

- [ ] **Step 4: Run linter**

```bash
pnpm lint
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/tenant/modules/loans/pages/ActiveLoansIndex.vue
git commit -m "feat(loans): add Rescheduled and Topped Up tabs to Active Loans page"
```

---

## Self-Review Checklist

- [x] Backend `summary()` returns `rescheduled` count with branch filter ✓
- [x] Backend `index()` handles `tab=rescheduled` by filtering `is_rescheduled = true` ✓
- [x] `LoanTab` type includes `'rescheduled'` and `'topup'` ✓
- [x] `LoanSummary` interface includes optional `rescheduled` and `topup` ✓
- [x] `useActiveLoans` initializes both new summary keys to `0` ✓
- [x] `fetch()` returns early (no API call) when `activeTab === 'topup'` ✓
- [x] `fetch()` passes `tab=rescheduled` for the rescheduled tab ✓
- [x] Tab bar in `ActiveLoansIndex.vue` shows both new tabs ✓
- [x] Coming-soon state renders for topup tab, not for any other tab ✓
- [x] No placeholders, TBDs, or "similar to Task N" references ✓
