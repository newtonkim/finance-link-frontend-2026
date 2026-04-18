# Design: Rescheduled Loans & Topped Up Loans Tabs

**Date:** 2026-04-17
**Branch:** feature/loan-rescheduling

## Overview

Add two new tabs to the Active Loans page (`/tenant/loans`):
1. **Rescheduled Loans** — fully functional, filtered from existing loan data
2. **Topped Up Loans** — frontend-only placeholder (topup feature is under development)

---

## Rescheduled Loans Tab

### Backend changes (`mfuko-pro-backend-2026`)

**`LoanController::index()`** — add `rescheduled` tab case:
```php
'rescheduled' => $query->where('is_rescheduled', true),
```

**`LoanController::summary()`** — add `rescheduled` key to response:
```php
'rescheduled' => Loan::where('is_rescheduled', true)->count(),
```
(Respect branch filter if `X-Acting-Branch-Id` header is present.)

### Frontend changes (`mfuko-pro-frontend-2026`)

**`src/tenant/apis/loans/loansApi.ts`**
- Extend `LoanTab` type: add `'rescheduled'`
- Extend `LoanSummary` interface: add `rescheduled?: number`

**`src/tenant/modules/loans/composables/useActiveLoans.ts`**
- Initialize `summary.rescheduled = 0`
- In `fetch()`, add `rescheduled` case: `params.tab = 'all'` + `params.is_rescheduled = true`
  (Pass `is_rescheduled` as a query param since the backend now supports it via the `rescheduled` tab)
- Actually simpler: pass `tab=rescheduled` and let the backend handle the filter

**`src/tenant/modules/loans/pages/ActiveLoansIndex.vue`**
- Add to `tabs` array:
  ```ts
  { key: 'rescheduled', label: 'Rescheduled Loans', countKey: 'rescheduled', color: 'nfuko-action' }
  ```

---

## Topped Up Loans Tab (Placeholder)

### Frontend only

**`src/tenant/apis/loans/loansApi.ts`**
- Extend `LoanTab` type: add `'topup'`

**`src/tenant/modules/loans/pages/ActiveLoansIndex.vue`**
- Add `topup: 0` to the local summary fallback (not fetched from API)
- Add to `tabs` array:
  ```ts
  { key: 'topup', label: 'Topped Up Loans', countKey: 'topup', color: 'nfuko-blue' }
  ```
- In the content area, when `activeTab === 'topup'`, skip the API call and render a "Coming Soon" empty state (icon + message) instead of the table, search bar, and filters

**`useActiveLoans.ts`**
- In `fetch()`, guard: if `activeTab === 'topup'`, return early without calling the API

---

## Tab Order

All → Disbursed → In Arrears → Closed → Approved → Rescheduled → Topped Up

---

## Non-goals

- No backend changes for topped up loans (feature is under development)
- No new page/route — both tabs live within `ActiveLoansIndex.vue`
- No export support for the rescheduled tab beyond what the existing export already handles
