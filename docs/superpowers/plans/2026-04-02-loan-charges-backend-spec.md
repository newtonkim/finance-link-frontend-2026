# Backend Spec — Loan Charges API

**Date:** 2026-04-02
**Status:** Ready for Implementation
**Frontend Branch:** (current working branch)
**Depends On:** Existing `loan_products` table and `chart_of_accounts` table

---

## 1. Database Migration

### Table: `loan_charges`

| Column                | Type                  | Nullable | Default    | Notes                                                                          |
| --------------------- | --------------------- | -------- | ---------- | ------------------------------------------------------------------------------ |
| id                    | bigint (PK)           | no       | auto       |                                                                                |
| tenant_id             | bigint (FK)           | no       |            | Multi-tenant scoping                                                           |
| name                  | string                | no       |            | e.g. "Late Payment Penalty"                                                    |
| code                  | string                | yes      | null       | Auto-generated or manual unique code                                           |
| category              | enum                  | no       |            | `processing_fee`, `penalty`, `late_fee`, `appraisal_fee`, `insurance`, `other` |
| charge_type           | enum                  | no       |            | `flat`, `percentage`                                                           |
| value                 | decimal(15,2)         | no       | 0          | Flat amount or percentage value                                                |
| frequency             | enum                  | no       | `one_time` | `one_time`, `daily`, `weekly`, `monthly`                                       |
| grace_days            | unsigned integer      | no       | 0          | Days after due date before charge applies                                      |
| max_value             | decimal(15,2)         | yes      | null       | Maximum charge amount (cap)                                                    |
| max_value_type        | enum                  | no       | `none`     | `none`, `flat_cap`, `percentage_of_outstanding`                                |
| is_active             | boolean               | no       | true       |                                                                                |
| income_account_id     | bigint (FK, nullable) | yes      | null       | → `chart_of_accounts.id`                                                       |
| receivable_account_id | bigint (FK, nullable) | yes      | null       | → `chart_of_accounts.id`                                                       |
| description           | text                  | yes      | null       |                                                                                |
| created_at            | timestamp             | no       | now()      |                                                                                |
| updated_at            | timestamp             | no       | now()      |                                                                                |

**Indexes:**

- `tenant_id` (for multi-tenant queries)
- `category` (for filtering)
- `is_active` (for filtering active charges)

**Enum values (define in migration or model):**

```php
// category
'processing_fee', 'penalty', 'late_fee', 'appraisal_fee', 'insurance', 'other'

// charge_type
'flat', 'percentage'

// frequency
'one_time', 'daily', 'weekly', 'monthly'

// max_value_type
'none', 'flat_cap', 'percentage_of_outstanding'
```

### Table: `loan_product_charge` (pivot)

| Column          | Type        | Nullable | Notes                |
| --------------- | ----------- | -------- | -------------------- |
| id              | bigint (PK) | no       | auto                 |
| loan_product_id | bigint (FK) | no       | → `loan_products.id` |
| loan_charge_id  | bigint (FK) | no       | → `loan_charges.id`  |
| created_at      | timestamp   | no       | now()                |

**Unique constraint:** `(loan_product_id, loan_charge_id)`

### Alter Table: `loan_products`

Add column:

| Column             | Type             | Nullable | Default |
| ------------------ | ---------------- | -------- | ------- |
| penalty_grace_days | unsigned integer | no       | 0       |

---

## 2. API Endpoints

All endpoints are tenant-scoped (use existing tenant middleware).

### 2.1 List Charges

```
GET /tenant/loan-charges
```

**Query Parameters:**

| Param     | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| search    | string | no       | Search by name or code               |
| category  | string | no       | Filter by category                   |
| is_active | string | no       | Filter: `1` = active, `0` = inactive |
| per_page  | int    | no       | Default: 15                          |

**Response: `200 OK`**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Late Payment Penalty",
      "code": "LPP001",
      "category": "penalty",
      "charge_type": "percentage",
      "value": "5.00",
      "frequency": "daily",
      "grace_days": 3,
      "max_value": "50.00",
      "max_value_type": "percentage_of_outstanding",
      "is_active": true,
      "income_account_id": 12,
      "receivable_account_id": 8,
      "income_account": {
        "id": 12,
        "name": "Penalty Income",
        "gl_code": "4003"
      },
      "receivable_account": {
        "id": 8,
        "name": "Penalty Receivable",
        "gl_code": "1005"
      },
      "description": "5% daily penalty after 3 day grace period",
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "total": 1
  }
}
```

### 2.2 Create Charge

```
POST /tenant/loan-charges
```

**Request Body:**

```json
{
  "name": "Processing Fee",
  "category": "processing_fee",
  "charge_type": "percentage",
  "value": 2.0,
  "frequency": "one_time",
  "grace_days": 0,
  "max_value": null,
  "max_value_type": "none",
  "is_active": true,
  "income_account_id": 15,
  "receivable_account_id": 9,
  "description": "2% processing fee deducted at disbursement"
}
```

**Validation Rules:**

- `name`: required, string, max:255
- `category`: required, in:processing_fee,penalty,late_fee,appraisal_fee,insurance,other
- `charge_type`: required, in:flat,percentage
- `value`: required, numeric, min:0, if percentage max:100
- `frequency`: required, in:one_time,daily,weekly,monthly
- `grace_days`: integer, min:0
- `max_value`: nullable, numeric, min:0, required_if:max_value_type,flat_cap,percentage_of_outstanding
- `max_value_type`: in:none,flat_cap,percentage_of_outstanding
- `income_account_id`: nullable, exists:chart_of_accounts,id (must be postable and same tenant)
- `receivable_account_id`: nullable, exists:chart_of_accounts,id (must be postable and same tenant)
- `description`: nullable, string, max:1000

**Response: `201 Created`** — same shape as single item in list response.

**Response: `422 Validation Error`**

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field is required."],
    "value": ["The value must not be greater than 100."]
  }
}
```

### 2.3 Show Single Charge

```
GET /tenant/loan-charges/{id}
```

**Response: `200 OK`** — same shape as single item in list response.

**Response: `404 Not Found`**

### 2.4 Update Charge

```
PUT /tenant/loan-charges/{id}
```

**Request Body:** same as create.

**Validation:** same as create.

**Response: `200 OK`** — updated charge.

**Response: `422 Validation Error`**

### 2.5 Delete Charge

```
DELETE /tenant/loan-charges/{id}
```

**Business Rules:**

- If the charge is assigned to any loan product (exists in `loan_product_charge`), return `422` with message: _"Cannot delete charge that is assigned to one or more loan products. Remove it from products first."_
- If the charge has been applied to any active loan, return `422` with message: _"Cannot delete charge that has been applied to loans."_

**Response: `204 No Content`**

**Response: `422`**

```json
{
  "message": "Cannot delete charge that is assigned to one or more loan products."
}
```

### 2.6 Toggle Active Status

```
PATCH /tenant/loan-charges/{id}/toggle
```

**Response: `200 OK`**

```json
{
  "data": {
    "id": 1,
    "is_active": false,
    ...
  }
}
```

---

## 3. Loan Product Integration

### 3.1 Update `LoanProduct` Store/Update

The existing `POST /tenant/loan-products` and `PUT /tenant/loan-products/{id}` endpoints must accept:

```json
{
  "penalty_grace_days": 3,
  "charge_ids": [1, 3, 5]
}
```

**Validation:**

- `penalty_grace_days`: integer, min:0
- `charge_ids`: array, each exists:loan_charges,id (same tenant, active)

**On save:**

- Sync `loan_product_charge` pivot table with the provided `charge_ids`
- Save `penalty_grace_days` on the `loan_products` table

### 3.2 Update `LoanProduct` Show/Index Response

The `GET /tenant/loan-products` list and `GET /tenant/loan-products/{id}` show responses must include:

```json
{
  "id": 1,
  "name": "Emergency Loan",
  "penalty_grace_days": 3,
  "charge_ids": [1, 3, 5],
  "charges": [
    {
      "id": 1,
      "name": "Processing Fee",
      "category": "processing_fee",
      "charge_type": "percentage",
      "value": "2.00",
      "frequency": "one_time",
      "grace_days": 0
    },
    {
      "id": 3,
      "name": "Late Payment Penalty",
      "category": "penalty",
      "charge_type": "percentage",
      "value": "5.00",
      "frequency": "daily",
      "grace_days": 3
    }
  ]
}
```

The `charges` array is the eager-loaded relationship. The `charge_ids` is the flat array of IDs for the frontend multi-select.

---

## 4. Accounting Integration (Journal Entries)

When a loan charge is applied to a loan, the backend must create journal entries using the charge's `income_account_id` and `receivable_account_id`. This is existing backend logic — the new `loan_charges` table simply provides the GL accounts per charge instead of from the product level.

### 4.1 Processing Fee (at disbursement)

```
DR  Loan Portfolio          (full loan amount)
CR  Disbursement Account    (net amount = loan - fee)
CR  Processing Fee Income   (fee amount, from charge.income_account_id)
```

If fee is not deducted upfront:

```
DR  Charges Receivable      (fee amount, from charge.receivable_account_id)
CR  Processing Fee Income   (fee amount)
```

### 4.2 Penalty Accrual (when overdue)

```
DR  Penalty Receivable      (penalty amount, from charge.receivable_account_id)
CR  Penalty Income          (penalty amount, from charge.income_account_id)
```

Frequency determines how often this entry is created (daily/weekly/monthly).

### 4.3 Penalty Collection (on repayment)

```
DR  Bank/Cash               (penalty amount)
CR  Penalty Receivable      (penalty amount)
```

### 4.4 Penalty Cap Enforcement

Before accruing a penalty, check:

- If `max_value_type` is `flat_cap`: total penalties ≤ `max_value`
- If `max_value_type` is `percentage_of_outstanding`: total penalties ≤ `max_value`% × outstanding_balance
- If `max_value_type` is `none`: no cap

---

## 5. Seed Data (Optional)

Provide default charges for new tenants:

```php
[
  ['name' => 'Processing Fee', 'category' => 'processing_fee', 'charge_type' => 'percentage', 'value' => 2, 'frequency' => 'one_time'],
  ['name' => 'Late Payment Penalty', 'category' => 'penalty', 'charge_type' => 'percentage', 'value' => 5, 'frequency' => 'daily', 'grace_days' => 3],
  ['name' => 'Appraisal Fee', 'category' => 'appraisal_fee', 'charge_type' => 'flat', 'value' => 500, 'frequency' => 'one_time'],
]
```

---

## 6. Tests Required

- [ ] CRUD: create, read, update, delete charge
- [ ] Validation: name required, value > 0, percentage ≤ 100, grace_days ≥ 0
- [ ] GL account validation: income_account_id must exist and be postable
- [ ] Delete protection: cannot delete charge assigned to a product
- [ ] Toggle: active ↔ inactive
- [ ] Loan product sync: charge_ids saved/updated correctly on product
- [ ] Loan product response includes charges array and charge_ids array
- [ ] Multi-tenant: charges scoped to tenant, cannot access other tenant's charges
- [ ] Penalty cap: journal entries stop at cap

---

_End of Spec_
