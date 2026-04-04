# Repayment Allocation Order - Execution Plan (Step-by-Step With Approval Gates)

Date: 2026-04-03
Owner: Engineering (Backend + Frontend)

## Objective
Implement configurable repayment allocation order in Loan Settings and apply it in repayment preview/posting and Receive Cash UI.

## Supported Orders
1. Principal -> Interest -> Penalties & Charges
2. Interest -> Principal -> Penalties & Charges
3. Penalties & Charges -> Interest -> Principal
4. Penalties & Charges -> Principal -> Interest

---

## Step 1 (Implement Now)
Backend settings foundation:
- Add `repayment_allocation_order` to tenant loan settings schema.
- Add model fillable/cast support.
- Add request validation + controller persistence/read support.
- Keep default order aligned to current production behavior.

Deliverables:
- Migration file
- Updated settings model/request/controller
- Basic verification (lint/syntax)

Approval Gate:
- Stop after Step 1 and request user approval before Step 2.

---

## Step 2 (After Approval)
Backend repayment engine integration:
- Implement allocation strategy resolution by setting.
- Use setting in repayment preview and actual posting.
- Ensure deterministic allocation and data integrity.

---

## Step 3 (After Approval)
Frontend Loan Settings UI:
- Add radio-card selector for allocation order.
- Save/load setting from API.
- Add role/permission checks in UI behavior where applicable.

---

## Step 4 (After Approval)
Receive Cash Modal integration:
- Display active allocation order text.
- Ensure preview displays in selected sequence.

---

## Step 5 (After Approval)
QA hardening and UAT prep:
- Unit + feature + UI tests.
- Regression checks and sign-off checklist.

---

## Constraints
- No step advances without explicit user approval.
- Prefer backward compatibility and safe defaults.
- Keep auditability for settings changes.

---

## Step 5 Delivery Notes (2026-04-03)
Implemented in this step:
- Backend feature tests for repayment preview allocation across all 4 configured orders.
- Backend fallback test when branch setting is missing (defaults to existing production order).
- Backend unit validation test for `repayment_allocation_order` request rules.
- Frontend UI unit test for Receive Cash modal allocation-order display (configured and fallback text).
- Tenant test bootstrap hardening to require `loan_settings.repayment_allocation_order` schema before skipping migrations.

Regression checklist executed:
- Added tests cover order strategies:
  - Principal -> Interest -> Penalties & Charges
  - Interest -> Principal -> Penalties & Charges
  - Penalties & Charges -> Interest -> Principal
  - Penalties & Charges -> Principal -> Interest
- Added request validation checks for valid/invalid allocation order payload.
- Added UI rendering checks for order messaging in repayment modal.

UAT sign-off checklist (pending business run-through):
- Verify Loan Settings saves selected repayment allocation order.
- Verify Receive Cash modal displays the exact active order label + sequence.
- Verify repayment preview breakdown follows selected order for partial payments.
- Verify posted repayment transaction portions (principal/interest/penalty/charges) match preview.
- Verify fallback behavior on branches with no explicit setting.
