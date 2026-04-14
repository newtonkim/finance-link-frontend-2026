# Loan Balances Report - Backend API Specification

## Overview

This document specifies the backend API endpoints required for the **Loan Balances Report** feature in the Mfuko Pro Sacco management system.

## API Endpoints

### 1. GET /reports/loan-balances

Fetch loan balances report with filtering and pagination.

**Endpoint:** `GET /api/v1/{tenant}/reports/loan-balances`

**Authentication:** Required (Bearer token)

#### Query Parameters

| Parameter         | Type    | Required | Description                                                 |
| ----------------- | ------- | -------- | ----------------------------------------------------------- |
| `as_of_date`      | string  | Yes      | Date in YYYY-MM-DD format (report snapshot date)            |
| `branch_id`       | integer | No       | Filter by branch ID                                         |
| `loan_product_id` | integer | No       | Filter by loan product ID                                   |
| `loan_officer_id` | integer | No       | Filter by loan officer (staff) ID                           |
| `status`          | string  | No       | Filter by loan status: `all`, `active`, `arrears`, `closed` |
| `page`            | integer | No       | Page number (default: 1)                                    |
| `per_page`        | integer | No       | Items per page (default: 25, max: 100)                      |

#### Example Request

```
GET /api/v1/acme/reports/loan-balances?as_of_date=2026-04-14&branch_id=1&status=active&page=1&per_page=25
```

#### Response (200 OK)

```json
{
  "summary": {
    "total_principal": 5000000.0,
    "total_interest": 250000.0,
    "total_charges": 50000.0,
    "total_penalty": 15000.0,
    "grand_total": 5315000.0,
    "loan_count": 150
  },
  "loans": {
    "data": [
      {
        "loan_id": 1001,
        "loan_no": "LN-2026-001",
        "member_id": 501,
        "member_name": "John Doe",
        "member_no": "MBR-001",
        "branch_name": "Head Office",
        "loan_officer_name": "Jane Smith",
        "product_name": "Personal Loan",
        "principal": "50000.00",
        "interest_remaining": "2500.00",
        "charges_remaining": "500.00",
        "penalty_remaining": "0.00",
        "outstanding_balance": "53000.00",
        "status": "active",
        "disbursed_at": "2026-01-15",
        "next_due_date": "2026-05-15",
        "days_in_arrears": null
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 6,
      "per_page": 25,
      "total": 150,
      "from": 1,
      "to": 25
    }
  }
}
```

#### Response Schema

**Summary Object:**

```typescript
{
  total_principal: number // Sum of original principal amounts
  total_interest: number // Sum of remaining interest
  total_charges: number // Sum of remaining charges/fees
  total_penalty: number // Sum of remaining penalties
  grand_total: number // Sum of all outstanding balances
  loan_count: number // Total number of loans in filter
}
```

**Loans Data Array Item:**

```typescript
{
  loan_id: number
  loan_no: string
  member_id: number
  member_name: string
  member_no: string
  branch_name: string
  loan_officer_name: string
  product_name: string
  principal: string // Original principal amount
  interest_remaining: string // Outstanding interest
  charges_remaining: string // Outstanding charges/fees
  penalty_remaining: string // Outstanding penalties
  outstanding_balance: string // Total outstanding (principal + interest + charges + penalty)
  status: string // active, arrears, closed
  disbursed_at: string | null
  next_due_date: string | null
  days_in_arrears: number | null
}
```

#### Error Responses

**400 Bad Request** - Missing required parameter:

```json
{
  "message": "The as_of_date parameter is required."
}
```

**401 Unauthorized** - Invalid/missing token:

```json
{
  "message": "Unauthenticated."
}
```

**403 Forbidden** - Insufficient permissions:

```json
{
  "message": "You do not have permission to view this report."
}
```

---

### 2. GET /reports/loan-balances/export

Export loan balances report to Excel format.

**Endpoint:** `GET /api/v1/{tenant}/reports/loan-balances/export`

**Authentication:** Required (Bearer token)

#### Query Parameters

Same as the main endpoint (minus pagination):

| Parameter         | Type    | Required | Description               |
| ----------------- | ------- | -------- | ------------------------- |
| `as_of_date`      | string  | Yes      | Date in YYYY-MM-DD format |
| `branch_id`       | integer | No       | Filter by branch ID       |
| `loan_product_id` | integer | No       | Filter by loan product ID |
| `loan_officer_id` | integer | No       | Filter by loan officer ID |
| `status`          | string  | No       | Filter by status          |

#### Response (200 OK)

Returns an Excel file (`.xlsx`) with the following columns:

| Column          | Description                |
| --------------- | -------------------------- |
| Member Number   | Member's unique identifier |
| Member Name     | Full name                  |
| Loan Number     | Unique loan identifier     |
| Product         | Loan product name          |
| Branch          | Branch name                |
| Loan Officer    | Assigned officer           |
| Principal       | Original principal amount  |
| Interest        | Outstanding interest       |
| Charges         | Outstanding charges        |
| Penalty         | Outstanding penalties      |
| Total Balance   | Grand total outstanding    |
| Status          | Loan status                |
| Disbursed Date  | Date loan was disbursed    |
| Next Due Date   | Next payment due date      |
| Days in Arrears | Days overdue (if any)      |

#### Response Headers

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="loan-balances-report-2026-04-14.xlsx"
```

---

## Business Logic Requirements

### 1. Balance Calculation

The `outstanding_balance` must be calculated as:

```
outstanding_balance = principal_due + interest_due + charges_due + penalty_due
```

Where:

- **principal_due**: Remaining principal to be paid
- **interest_due**: Accrued interest not yet paid
- **charges_due**: Outstanding fees (processing, insurance, etc.)
- **penalty_due**: Accrued penalties for missed payments

### 2. As of Date Logic

- The report should calculate balances **as of the specified date**
- For each loan, calculate what the balance was on that date
- Include only loans that were **disbursed on or before** the `as_of_date`
- Exclude loans disbursed after the `as_of_date`

### 3. Status Filtering

| Status    | Definition                                                  |
| --------- | ----------------------------------------------------------- |
| `all`     | All loans regardless of status                              |
| `active`  | Loans with `status = 'disbursed'` and no arrears            |
| `arrears` | Loans with overdue payments (days_in_arrears > 0)           |
| `closed`  | Loans with `status = 'closed'` or `status = 'fully_repaid'` |

### 4. Permissions

Required permission: `loan-balances-report-view`

---

## Implementation Notes

### Database Considerations

1. **Performance**: For large datasets, consider:
   - Adding database indexes on `loans.branch_id`, `loans.loan_product_id`, `loans.status`
   - Caching summary calculations
   - Using database views for complex joins

2. **Calculation Approach**:
   - Option A: Calculate from loan_schedule entries (accurate but slower)
   - Option B: Store calculated fields on loan record (faster but must keep in sync)

### Recommended Stack (if building in PHP/Laravel)

- Create a Laravel Controller: `ReportsController@loanBalances`
- Use Laravel API Resources for response formatting
- Implement request validation with Form Requests
- Add caching with tags for repeated queries

---

## Testing Checklist

- [ ] Returns correct data for valid request
- [ ] Validates required `as_of_date` parameter
- [ ] Applies branch filter correctly
- [ ] Applies product filter correctly
- [ ] Applies loan officer filter correctly
- [ ] Applies status filter correctly
- [ ] Pagination works correctly
- [ ] Summary totals are accurate
- [ ] Export generates valid Excel file
- [ ] Handles empty results gracefully
- [ ] Returns appropriate error messages
