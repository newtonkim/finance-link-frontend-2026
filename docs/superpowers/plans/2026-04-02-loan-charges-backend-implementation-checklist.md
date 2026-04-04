# Backend Implementation Checklist + PR Template — Loan Charges

**Date:** 2026-04-02  
**Based On:** `docs/superpowers/plans/2026-04-02-loan-charges-backend-spec.md`  
**Target Stack:** Laravel (tenant-scoped API)

---

## 1. PR Template

### PR Title
`feat(tenant): implement loan charges API + loan product charge integration`

### Summary
- Adds `loan_charges` table and `loan_product_charge` pivot.
- Adds `penalty_grace_days` to `loan_products`.
- Implements tenant-scoped Loan Charges CRUD + toggle endpoint.
- Integrates `charge_ids` sync into Loan Product create/update.
- Exposes `charges` and `charge_ids` in Loan Product list/show responses.
- Adds validation, delete protection, and automated tests.

### Scope
- Migrations
- Models + relationships
- Form Requests (validation)
- Controllers
- Routes
- Resource transformers
- Feature tests

### Out of Scope
- Frontend UI changes
- Non-loan accounting modules unrelated to charge posting

---

## 2. Step-by-Step Implementation Checklist

## Step 1: Migrations
- [ ] Create migration: `create_loan_charges_table`
- [ ] Create migration: `create_loan_product_charge_table`
- [ ] Create migration: `add_penalty_grace_days_to_loan_products_table`
- [ ] Add indexes:
  - [ ] `loan_charges.tenant_id`
  - [ ] `loan_charges.category`
  - [ ] `loan_charges.is_active`
- [ ] Add unique:
  - [ ] `loan_product_charge (loan_product_id, loan_charge_id)`
- [ ] Add FKs:
  - [ ] `loan_charges.income_account_id -> chart_of_accounts.id`
  - [ ] `loan_charges.receivable_account_id -> chart_of_accounts.id`
  - [ ] `loan_product_charge.loan_product_id -> loan_products.id`
  - [ ] `loan_product_charge.loan_charge_id -> loan_charges.id`

## Step 2: Models + Relationships
- [ ] Create `LoanCharge` model
- [ ] Add casts/fillable for all fields
- [ ] Add relation on `LoanCharge`:
  - [ ] `incomeAccount()`
  - [ ] `receivableAccount()`
  - [ ] `loanProducts()`
- [ ] Update `LoanProduct` model:
  - [ ] `charges()` belongsToMany via `loan_product_charge`
- [ ] Ensure tenant scoping pattern is applied (global scope or controller query)

## Step 3: Enums / Constants
- [ ] Define allowed categories:
  - [ ] `processing_fee`, `penalty`, `late_fee`, `appraisal_fee`, `insurance`, `other`
- [ ] Define allowed charge_type:
  - [ ] `flat`, `percentage`
- [ ] Define allowed frequency:
  - [ ] `one_time`, `daily`, `weekly`, `monthly`
- [ ] Define allowed max_value_type:
  - [ ] `none`, `flat_cap`, `percentage_of_outstanding`

## Step 4: Form Request Validation
- [ ] Create `StoreLoanChargeRequest`
- [ ] Create `UpdateLoanChargeRequest`
- [ ] Validate:
  - [ ] `name` required|string|max:255
  - [ ] `category` required|in:...
  - [ ] `charge_type` required|in:flat,percentage
  - [ ] `value` required|numeric|min:0 (+ percentage <= 100)
  - [ ] `frequency` required|in:one_time,daily,weekly,monthly
  - [ ] `grace_days` integer|min:0
  - [ ] `max_value_type` in:none,flat_cap,percentage_of_outstanding
  - [ ] `max_value` nullable|numeric|min:0|required_if:max_value_type,flat_cap,percentage_of_outstanding
  - [ ] `income_account_id` nullable + same-tenant + postable
  - [ ] `receivable_account_id` nullable + same-tenant + postable
  - [ ] `description` nullable|string|max:1000

## Step 5: Controller + Endpoints
- [ ] Create `LoanChargeController` methods:
  - [ ] `index`
  - [ ] `store`
  - [ ] `show`
  - [ ] `update`
  - [ ] `destroy`
  - [ ] `toggle`
- [ ] `index` filters:
  - [ ] `search` by name/code
  - [ ] `category`
  - [ ] `is_active` 1/0
  - [ ] pagination (`per_page`, default 15)
- [ ] Eager-load:
  - [ ] `incomeAccount:id,name,gl_code`
  - [ ] `receivableAccount:id,name,gl_code`

## Step 6: Routes
- [ ] Register tenant routes:
  - [ ] `GET /tenant/loan-charges`
  - [ ] `POST /tenant/loan-charges`
  - [ ] `GET /tenant/loan-charges/{id}`
  - [ ] `PUT /tenant/loan-charges/{id}`
  - [ ] `DELETE /tenant/loan-charges/{id}`
  - [ ] `PATCH /tenant/loan-charges/{id}/toggle`

## Step 7: Delete Protection Rules
- [ ] Before delete, block if assigned in `loan_product_charge`
- [ ] Before delete, block if already applied to loans (domain table/event source)
- [ ] Return `422` with explicit message per spec

## Step 8: Loan Product Integration
- [ ] Update Loan Product store/update request:
  - [ ] `penalty_grace_days` integer|min:0
  - [ ] `charge_ids` array
  - [ ] each `charge_ids.*` exists in `loan_charges` for same tenant and active
- [ ] In store/update service/controller:
  - [ ] persist `penalty_grace_days`
  - [ ] sync pivot `charges()->sync($chargeIds)`
- [ ] In Loan Product list/show resources:
  - [ ] include `penalty_grace_days`
  - [ ] include `charge_ids` (flat ids)
  - [ ] include `charges` relation payload

## Step 9: Accounting/Journals Integration
- [ ] Update charge-application logic to source GL from `loan_charges`:
  - [ ] `income_account_id`
  - [ ] `receivable_account_id`
- [ ] Implement penalty cap checks:
  - [ ] `flat_cap`
  - [ ] `percentage_of_outstanding`
  - [ ] `none`

## Step 10: Seed Data (Optional)
- [ ] Add tenant-safe seeder for default charges
- [ ] Seed only if tenant has none

---

## 3. Test Plan (Feature + Unit)

### Loan Charge CRUD
- [ ] create charge success (201)
- [ ] list filters: search/category/is_active
- [ ] show single charge (200)
- [ ] update charge success (200)
- [ ] toggle active success (200)

### Validation
- [ ] required name
- [ ] value > 0
- [ ] percentage <= 100
- [ ] grace_days >= 0
- [ ] max_value required when cap type != none
- [ ] account ids must be same-tenant + postable

### Delete Protection
- [ ] cannot delete if assigned to product
- [ ] cannot delete if used by loan transactions

### Loan Product Integration
- [ ] charge_ids sync on create
- [ ] charge_ids re-sync on update
- [ ] penalty_grace_days persisted
- [ ] list/show include `charges` + `charge_ids`

### Multi-tenant Security
- [ ] tenant A cannot read/update/delete tenant B charge
- [ ] tenant A cannot assign tenant B charge in `charge_ids`

### Penalty Cap
- [ ] accrual stops at flat cap
- [ ] accrual stops at % outstanding cap
- [ ] no cap when type none

---

## 4. Manual QA Script

- [ ] Create 3 charges (processing fee, penalty, appraisal fee)
- [ ] Verify list filtering + pagination
- [ ] Assign charges to a loan product
- [ ] Fetch loan product show and confirm `charge_ids` + `charges`
- [ ] Toggle one charge inactive and verify assignment validation blocks inactive charge on update
- [ ] Attempt delete assigned charge and verify `422`
- [ ] Run a loan flow that triggers processing fee + penalty journals and confirm GL accounts from charge

---

## 5. Rollback Plan

- [ ] Revert deployment to previous release
- [ ] Roll back migrations in reverse order:
  - [ ] drop `loan_product_charge`
  - [ ] drop `loan_charges`
  - [ ] remove `penalty_grace_days` from `loan_products`
- [ ] Disable new endpoints via route toggle if needed

---

## 6. Definition of Done

- [ ] All endpoints implemented and tenant-scoped
- [ ] All validations implemented as spec
- [ ] Loan product integration live (`charge_ids`, `penalty_grace_days`)
- [ ] Journals source GL accounts from charges
- [ ] Delete protection enforced
- [ ] Tests passing in CI
- [ ] API documentation updated

