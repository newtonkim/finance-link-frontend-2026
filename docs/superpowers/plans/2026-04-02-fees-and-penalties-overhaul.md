# Fees & Penalties Overhaul — Implementation Plan

**Date:** 2026-04-02
**Status:** Awaiting Review
**Author:** Engineering Team
**Reviewers:** SACCO Management, Operations, Finance

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State — What Exists Today](#2-current-state--what-exists-today)
   - [2.5 Accounting Treatment — Detailed Breakdown](#25-accounting-treatment--detailed-breakdown)
3. [Problems with the Current System](#3-problems-with-the-current-system)
4. [Proposed Changes](#4-proposed-changes)
5. [Implementation Phases](#5-implementation-phases)
6. [Phase 1 — Fix the Foundation (Critical)](#6-phase-1--fix-the-foundation-critical)
7. [Phase 2 — SACCO Operational Controls (High Value)](#7-phase-2--sacco-operational-controls-high-value)
8. [Phase 3 — Advanced Features (Future)](#8-phase-3--advanced-features-future)
9. [Impact on Existing Loans](#9-impact-on-existing-loans)
10. [Approval Checklist](#10-approval-checklist)

---

## 1. Executive Summary

The **Fees and Penalties** section in the Loan Product configuration form controls how a SACCO charges members for loan processing and late repayments. The current implementation has gaps that cause confusion for SACCO managers and create risk for accurate financial reporting.

This plan proposes a **3-phase overhaul** that:

- **Phase 1 (Critical):** Fixes confusing design, adds validation, prevents data errors.
- **Phase 2 (High Value):** Adds the penalty controls SACCO managers actually need — grace periods, penalty caps, frequency rules, and cost previews.
- **Phase 3 (Future):** Adds advanced features like graduated penalties, excise duty, and branch-specific rules.

**No existing loan data will be affected.** All changes are additive — new fields default to safe values, and existing products continue to work as-is.

---

## 2. Current State — What Exists Today

When a SACCO manager creates or edits a Loan Product, the **Fees and Penalties** section currently has:

### 2.1 Processing Fee

| Field                | Description                                 |
| -------------------- | ------------------------------------------- |
| Processing Fee Type  | Dropdown: None / Flat Amount / Percentage   |
| Processing Fee Value | A number (shown only when type is not None) |

**How it works:** If set to "Flat Amount 500", every loan disbursement under this product is charged KES 500. If "Percentage 2%", the fee is 2% of the approved loan amount.

**GL Mapping:** Charges Income Account + Charges Receivable Account (in the Accounting Mapping section below).

### 2.2 Global Penalty

| Field         | Description                                 |
| ------------- | ------------------------------------------- |
| Penalty Type  | Dropdown: None / Flat Amount / Percentage   |
| Penalty Value | A number (shown only when type is not None) |

**How it works:** This is the default penalty applied when a borrower misses a repayment deadline.

**GL Mapping:** Penalty Income Account + Penalty Receivable Account.

### 2.3 Penalty Rules (Optional)

A dynamic list where each row has:

| Field      | Description                                |
| ---------- | ------------------------------------------ |
| Type       | Free-text input (user types anything)      |
| Rate (%)   | A number                                   |
| Grace Days | A number of days before this rule kicks in |

**How it works:** Supposedly allows different penalty tiers, but the relationship to the global penalty above is undefined.

### 2.4 Accounting Mapping (separate section)

| Account                    | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| Penalty Income Account     | GL account for penalty revenue                      |
| Penalty Receivable Account | GL account for penalties owed but not yet collected |

### 2.5 Accounting Treatment — Detailed Breakdown

This section documents the **full double-entry accounting** for every fee and penalty transaction. Each loan charge defines its own `income_account_id` and `receivable_account_id` (GL accounts from the Chart of Accounts). The backend automatically creates journal entries when transactions occur — the frontend only defines the mappings.

#### 2.5.1 Chart of Accounts Affected

| GL Account                           | Type      | Normal Balance | Used For                                                                      |
| ------------------------------------ | --------- | -------------- | ----------------------------------------------------------------------------- |
| **Loan Portfolio**                   | ASSET     | DR             | Tracking the principal owed by the member                                     |
| **Disbursement Account** (Bank/Cash) | ASSET     | DR             | The SACCO's bank or cash account from which loans are disbursed               |
| **Processing Fee Income**            | INCOME    | CR             | Revenue earned from processing fees                                           |
| **Charges Receivable**               | ASSET     | DR             | Processing fees owed but not yet collected (when fee is not deducted upfront) |
| **Penalty Income**                   | INCOME    | CR             | Revenue earned from late payment penalties                                    |
| **Penalty Receivable**               | ASSET     | DR             | Penalties assessed but not yet collected                                      |
| **Interest Receivable**              | ASSET     | DR             | Accrued interest not yet received                                             |
| **Interest Income**                  | INCOME    | CR             | Revenue earned from loan interest                                             |
| **Excise Duty Payable** _(Phase 3)_  | LIABILITY | CR             | Government excise duty collected on fees (e.g., 20% in Kenya)                 |

#### 2.5.2 Journal Entries by Transaction Type

**A. Loan Disbursement with Processing Fee (Flat Amount, Deducted Upfront)**

Scenario: Member approved for KES 100,000 loan. Processing fee is KES 2,000 (flat). Member receives KES 98,000.

| Line | Account                             | Debit (DR) | Credit (CR) | Description                           |
| ---- | ----------------------------------- | ---------- | ----------- | ------------------------------------- |
| 1    | Loan Portfolio (ASSET)              | 100,000    |             | Full loan amount booked as receivable |
| 2    | Disbursement Account - Bank (ASSET) |            | 98,000      | Net amount disbursed to member        |
| 3    | Processing Fee Income (INCOME)      |            | 2,000       | Processing fee earned at disbursement |

_Net effect: SACCO's loan book increases by 100,000, bank decreases by 98,000, income increases by 2,000._

**B. Loan Disbursement with Processing Fee (Percentage, Not Deducted Upfront)**

Scenario: KES 100,000 loan. Processing fee is 2% = KES 2,000, payable separately by member.

| Line | Account                             | Debit (DR) | Credit (CR) | Description           |
| ---- | ----------------------------------- | ---------- | ----------- | --------------------- |
| 1    | Loan Portfolio (ASSET)              | 100,000    |             | Full loan amount      |
| 2    | Disbursement Account - Bank (ASSET) |            | 100,000     | Full amount disbursed |
| 3    | Charges Receivable (ASSET)          | 2,000      |             | Fee owed by member    |
| 4    | Processing Fee Income (INCOME)      |            | 2,000       | Fee income recognized |

_When member pays the fee later:_

| Line | Account                             | Debit (DR) | Credit (CR) | Description        |
| ---- | ----------------------------------- | ---------- | ----------- | ------------------ |
| 1    | Disbursement Account - Bank (ASSET) | 2,000      |             | Fee collected      |
| 2    | Charges Receivable (ASSET)          |            | 2,000       | Receivable cleared |

**C. Penalty Accrual (When Payment Becomes Overdue)**

Scenario: Member misses a KES 5,000 installment. Penalty is 5% of overdue = KES 250.

| Line | Account                    | Debit (DR) | Credit (CR) | Description                     |
| ---- | -------------------------- | ---------- | ----------- | ------------------------------- |
| 1    | Penalty Receivable (ASSET) | 250        |             | Penalty assessed against member |
| 2    | Penalty Income (INCOME)    |            | 250         | Penalty income recognized       |

_This entry is created each time the penalty accrues (daily/weekly/monthly depending on frequency setting)._

**D. Penalty Collection (When Member Pays the Penalty)**

| Line | Account                             | Debit (DR) | Credit (CR) | Description              |
| ---- | ----------------------------------- | ---------- | ----------- | ------------------------ |
| 1    | Disbursement Account - Bank (ASSET) | 250        |             | Penalty amount collected |
| 2    | Penalty Receivable (ASSET)          |            | 250         | Receivable cleared       |

**E. Loan Repayment Allocation**

When a member makes a KES 10,000 payment on a loan with outstanding penalties, charges, and interest, the system allocates in this priority order:

| Priority | Component | Amount     | Journal Entry                                        |
| -------- | --------- | ---------- | ---------------------------------------------------- |
| 1        | Penalties | 250        | DR Bank, CR Penalty Receivable                       |
| 2        | Charges   | 0          | DR Bank, CR Charges Receivable                       |
| 3        | Interest  | 2,750      | DR Bank, CR Interest Receivable → CR Interest Income |
| 4        | Principal | 7,000      | DR Bank, CR Loan Portfolio                           |
|          | **Total** | **10,000** |                                                      |

**F. Penalty Waiver (Manager Forgive a Penalty)**

| Line | Account                                                 | Debit (DR) | Credit (CR) | Description             |
| ---- | ------------------------------------------------------- | ---------- | ----------- | ----------------------- |
| 1    | Penalty Income (INCOME) — or Bad Debt Expense (EXPENSE) | 250        |             | Penalty income reversed |
| 2    | Penalty Receivable (ASSET)                              |            | 250         | Receivable written off  |

#### 2.5.3 Subledger Mapping

Each charge type maps to a **subledger** within the General Ledger:

| Charge Category | Subledger                                 | GL Control Account                    |
| --------------- | ----------------------------------------- | ------------------------------------- |
| Processing Fee  | Member Loan Account → Charges Subledger   | Charges Income Account                |
| Penalty         | Member Loan Account → Penalty Subledger   | Penalty Income Account                |
| Late Fee        | Member Loan Account → Penalty Subledger   | Penalty Income Account                |
| Appraisal Fee   | Member Loan Account → Charges Subledger   | Charges Income Account                |
| Insurance       | Member Loan Account → Insurance Subledger | Insurance Payable Account (LIABILITY) |

The subledger tracks individual member-level balances. The GL control account tracks the aggregate balance. At month-end, the subledger total should reconcile to the GL control account balance.

#### 2.5.4 Required GL Account Validation Rules

Based on the accounting treatment above, the following validation rules must be enforced when saving a loan product or charge:

| Condition                                                    | Required GL Accounts                                      | Reason                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------- |
| Any charge with category `processing_fee` is assigned        | Charges Income Account, Charges Receivable Account        | Processing fee creates income and may create receivable     |
| Any charge with category `penalty` or `late_fee` is assigned | Penalty Income Account, Penalty Receivable Account        | Penalty creates income and receivable on accrual            |
| Any charge with category `insurance` is assigned             | Insurance Payable Account                                 | Insurance is a liability (held for member, paid to insurer) |
| Processing fee type is "percentage" and not deducted upfront | Charges Receivable Account                                | Fee creates a receivable until collected                    |
| Penalty frequency is "daily", "weekly", or "monthly"         | Penalty Receivable Account                                | Recurring penalties accrue as receivable before collection  |
| Charge has `income_account_id` mapped                        | Corresponding `receivable_account_id` must also be mapped | Double-entry requires both sides                            |

**Frontend validation behavior:**

- If a charge is selected in the loan product form but its required GL accounts are not mapped, show a warning: _"This charge requires [Account Name] to be mapped in Accounting Mapping."_
- The "Save" button should be **disabled** until all required accounts are mapped.
- In the charge creation drawer, if a charge category is selected, the income and receivable account fields become **required** (marked with red asterisk).

---

## 3. Problems with the Current System

### Problem 1: Confusing Dual Penalty System

The form has **both** a global penalty (flat/percentage) AND a list of penalty rules. No one knows:

- Does the global penalty apply by default, and rules override it?
- If I add penalty rules, do they replace the global penalty?
- Can I have both active at the same time?

**Impact:** SACCO managers either avoid using penalty rules entirely, or misconfigure them.

### Problem 2: No Validation

- A manager can set processing fee to "Percentage" and enter "500" (meaning 500%). Nothing stops this.
- Penalty rules accept free-text for type — someone types "daily", another types "flat", another types "Flat". The backend receives inconsistent data.
- Penalty can be set to non-"none" without mapping the Penalty Income Account. Accounting entries will fail silently.

### Problem 3: No Grace Period at Product Level

SACCOs universally need a grace period before penalties start (e.g., "3 days after due date"). The current system has grace days only inside individual penalty rules, not at the product level where it belongs.

### Problem 4: No Penalty Frequency Control

There is no way to specify:

- Is this penalty charged **once** or **every day** until paid?
- Does it **compound** (penalty on penalty) or stay simple?
- Is there a **maximum** penalty amount?

Without these controls, the system cannot enforce real SACCO penalty policies.

### Problem 5: No Cost Preview

The live preview shows interest and installments but does not include processing fees or estimated penalties. A manager cannot see the **total cost of credit** to the member before saving the product.

### Problem 6: Missing Common SACCO Fee Types

SACCOs commonly charge fees that the system does not support:

- **Appraisal Fee** (separate from processing fee)
- **Insurance Fee** (loan protection insurance)
- **Ledger/Maintenance Fee**
- **Excise Duty** (government tax on fees, e.g., 20% in Kenya)

---

## 4. Proposed Changes

### What Changes

| Area              | Change                                                       | Phase |
| ----------------- | ------------------------------------------------------------ | ----- |
| Processing Fee    | Add validation (max percentage, require GL account)          | 1     |
| Penalty Config    | Merge global penalty + penalty rules into one unified system | 1     |
| Penalty Rules     | Replace free-text type with dropdown selector                | 1     |
| Grace Period      | Add product-level penalty grace days field                   | 2     |
| Penalty Frequency | Add selector: one-time / daily / weekly                      | 2     |
| Penalty Cap       | Add max penalty as % of outstanding balance                  | 2     |
| Cost Preview      | Include fees + penalties in the live preview panel           | 2     |
| Additional Fees   | Support appraisal fee, insurance fee, ledger fee             | 3     |
| Excise Duty       | Auto-calculate excise duty on fees where applicable          | 3     |
| Branch Rules      | Allow branch-specific penalty configurations                 | 3     |

### What Does NOT Change

- Existing loan products and their data remain untouched.
- The general form layout and navigation stay the same.
- The API endpoint structure (`POST /loan-products`, `PUT /loan-products/:id`) remains.
- The accounting mapping section structure remains (new accounts added).

---

## 5. Implementation Phases

```
Phase 1 (Critical)          Phase 2 (High Value)         Phase 3 (Future)
Weeks 1-2                   Weeks 3-5                    Weeks 6+
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│ Fix penalty system   │     │ Grace periods         │     │ Additional fee types│
│ Add validation       │     │ Penalty frequency     │     │ Excise duty         │
│ Dropdown for type    │     │ Penalty caps          │     │ Branch-specific     │
│ Clarify UI labels    │     │ Cost preview          │     │ Graduated penalties │
│                      │     │ Processing fee UI fix │     │ Fee waiver controls │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
```

---

## 6. Phase 1 — Fix the Foundation (Critical)

**Goal:** Eliminate confusion and prevent data errors. No new business logic — just fix what exists.

### 6.1 Unify the Penalty Configuration

**Current:** Two separate systems (global penalty_type + penalty_rules[]) with no defined relationship.

**Proposed:** Make penalty_rules[] the **single source of truth** for all penalty configuration.

- Remove the global `penalty_type` and `penalty_rate` fields from the form.
- The penalty_rules list becomes the only place to configure penalties.
- The first rule added is the **default penalty** (applies to all late payments).
- Additional rules can define escalation tiers.

**Why:** One system is easier to understand. Rules are more flexible than a single flat/percentage toggle.

**Fallback:** If managers prefer keeping the simple global toggle, the alternative is to keep it and make penalty_rules[] explicitly an **escalation override** (with a label: "Override rules — if none, the default penalty above applies"). Management to decide.

### 6.2 Replace Free-Text Type with Dropdown

**Current:** `PenaltyRuleRow` has a plain text input for penalty type. Users type whatever they want.

**Proposed:** Replace with a dropdown:

| Option                    | Meaning                                           |
| ------------------------- | ------------------------------------------------- |
| Flat Amount               | Fixed amount per occurrence (e.g., KES 500)       |
| Percentage of Outstanding | Percentage of the current outstanding balance     |
| Percentage of Overdue     | Percentage of only the overdue installment amount |
| Percentage Per Day        | Percentage charged for each day of lateness       |

**Why:** Standardized values ensure the backend can process penalties correctly and reports are consistent.

### 6.3 Add Form Validation

| Field                             | Validation Rule                        |
| --------------------------------- | -------------------------------------- |
| Processing Fee Value (Percentage) | Must be between 0 and 100              |
| Processing Fee Value (Flat)       | Must be greater than 0                 |
| Penalty Rate (Percentage)         | Must be between 0 and 100              |
| Penalty Grace Days                | Must be 0 or positive integer          |
| Penalty Income Account            | Required if any penalty rule is active |
| Penalty Receivable Account        | Required if any penalty rule is active |
| Charges Income Account            | Required if processing fee is not None |

**Behavior:** Invalid fields show a red error message below them. The "Save" button is disabled until all errors are resolved.

### 6.4 Clarify UI Labels and Help Text

Add explanatory text below each field:

- **Processing Fee:** _"Charged once at disbursement. Deducted from the loan amount before the member receives funds."_
- **Penalty Grace Days:** _"Number of days after the due date before penalties begin. Set to 0 for immediate penalties."_
- **Penalty Rate:** _"For percentage types, enter a value between 0 and 100."_

### Phase 1 Deliverables

- [ ] Unified penalty configuration (single system, no dual confusion)
- [ ] Dropdown selector for penalty type (no more free-text)
- [ ] Validation on all fee/penalty fields
- [ ] Required GL accounts when fees/penalties are active
- [ ] Clear labels and help text for SACCO managers

---

## 7. Phase 2 — SACCO Operational Controls (High Value)

**Goal:** Give SACCO managers the controls they need to enforce real-world penalty policies.

### 7.1 Product-Level Grace Period

**Add field:** `penalty_grace_days` (integer, default: 0)

- Appears at the top of the Fees & Penalties section, before penalty rules.
- Applies to **all** penalty rules unless a specific rule overrides it.
- Displayed on the Loan Product detail view.

**Example:** Grace days = 3. A payment due on January 10th starts incurring penalties on January 13th.

### 7.2 Penalty Frequency Control

**Add field per penalty rule:** `frequency`

| Option   | Behavior                                                 |
| -------- | -------------------------------------------------------- |
| One-Time | Penalty is charged once when the payment becomes overdue |
| Daily    | Penalty accrues every day the payment remains overdue    |
| Weekly   | Penalty accrues every week the payment remains overdue   |
| Monthly  | Penalty accrues every month the payment remains overdue  |

**Why:** Most SACCOs charge daily or one-time penalties. Without this field, the backend has to guess, which leads to incorrect penalty calculations.

### 7.3 Penalty Cap

**Add field per penalty rule:** `max_penalty_type` and `max_penalty_value`

| Field             | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| Max Penalty Type  | None / Flat Cap / Percentage of Outstanding                                   |
| Max Penalty Value | The maximum amount (if Flat Cap) or percentage (if Percentage of Outstanding) |

**Example:** A penalty of 5% per day, capped at 50% of the outstanding balance. Once penalties reach 50%, they stop accruing.

**Why:** Protects members from unbounded penalty growth. Required by some regulatory frameworks. Prevents reputational risk for the SACCO.

### 7.4 Include Fees/Penalties in Cost Preview

**Current:** The live preview shows interest and installment schedule.

**Proposed:** Add a "Total Cost of Credit" breakdown to the preview panel:

```
┌─────────────────────────────────────────┐
│         Total Cost of Credit            │
├─────────────────────────────────────────┤
│  Principal Amount          KES 100,000  │
│  Total Interest            KES  12,000  │
│  Processing Fee (2%)       KES   2,000  │
│  Estimated Penalties *     KES      0   │
├─────────────────────────────────────────┤
│  Total Cost to Member      KES 114,000  │
│  Effective Cost Rate           14.0%    │
└─────────────────────────────────────────┘
  * Penalties estimated at 0 overdue days.
    Actual penalties depend on repayment behavior.
```

**Why:** Transparency. Both the SACCO manager and the member should understand the full cost before committing.

### 7.5 Processing Fee UI Improvements

- Change "Processing Fee Value" label to "Processing Fee Amount" when type is Flat, and "Processing Fee Rate (%)" when type is Percentage.
- Show the **calculated amount** next to the percentage input (e.g., "2% of KES 100,000 = KES 2,000") using the minimum loan amount from the form.
- Add a note: _"This fee is deducted upfront from the disbursement."_

### Phase 2 Deliverables

- [ ] Product-level penalty grace days
- [ ] Penalty frequency selector (one-time / daily / weekly / monthly)
- [ ] Penalty cap configuration (flat or percentage of outstanding)
- [ ] Total Cost of Credit in the live preview
- [ ] Improved Processing Fee input with contextual labels and calculated amounts

---

## 8. Phase 3 — Advanced Features (Future)

These features are valuable but not blocking. They can be planned after Phases 1-2 are deployed and stable.

### 8.1 Additional Fee Types

Support common SACCO fees beyond processing fees:

| Fee Type      | Description                                    | GL Account                |
| ------------- | ---------------------------------------------- | ------------------------- |
| Appraisal Fee | Charged for loan assessment/credit scoring     | Appraisal Income Account  |
| Insurance Fee | Loan protection insurance premium              | Insurance Payable Account |
| Ledger Fee    | Monthly account maintenance during loan tenure | Ledger Fee Income Account |

Each fee type would have its own type/value configuration in the Fees section.

### 8.2 Excise Duty on Fees

In Kenya, the government charges 20% excise duty on fees earned by financial institutions.

**Proposed:** Add a toggle per fee type: _"Subject to Excise Duty (20%)"_

When enabled:

- The system auto-calculates excise duty on that fee.
- An additional GL posting is made to an "Excise Duty Payable" account.
- The excise duty is shown in the cost preview.

### 8.3 Graduated Penalty Schedules

Support multi-tier penalty structures:

| Tier   | Condition         | Penalty                     |
| ------ | ----------------- | --------------------------- |
| Tier 1 | Days 1–7 overdue  | No penalty (extended grace) |
| Tier 2 | Days 8–30 overdue | 5% flat on overdue amount   |
| Tier 3 | Days 31+ overdue  | 5% flat + 1% per day        |

This requires a more sophisticated penalty rules UI where each rule has a "Start Day" and "End Day" field.

### 8.4 Branch-Specific Penalty Rules

The `LoanPenaltyRule` data model already has a `branch_id` field, but the UI does not expose it.

**Proposed:** Allow managers to configure different penalty rules per branch. Urban branches might have stricter penalties than rural branches.

### 8.5 Fee Waiver Controls at Product Level

**Add fields:**

| Field                    | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| Allow Penalty Waiver     | Yes/No — can branch managers waive penalties on individual loans? |
| Waiver Approval Required | Yes/No — does waiving a penalty require supervisor approval?      |
| Max Waiver Amount        | Maximum penalty amount that can be waived without escalation      |

**Why:** SACCO managers frequently waive penalties for members facing hardship. The product config should define the policy boundaries.

### Phase 3 Deliverables

- [ ] Appraisal, insurance, and ledger fee types
- [ ] Excise duty calculation and GL posting
- [ ] Graduated penalty schedule UI
- [ ] Branch-specific penalty configuration
- [ ] Fee waiver policy controls

---

## 9. Impact on Existing Loans

### Data Migration

**No data migration required.** All changes are additive:

| Change                                  | Impact on Existing Products                                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remove global penalty fields            | Existing values are preserved in the backend. The UI simply stops showing them. If a product had a global penalty, it is migrated to the first penalty rule automatically (handled by backend migration). |
| New fields (grace_days, frequency, cap) | Default to safe values: grace_days=0, frequency=one_time, cap=none. Existing behavior is unchanged.                                                                                                       |
| New validation rules                    | Apply only when editing and saving. Existing saved data is not re-validated.                                                                                                                              |
| Dropdown for penalty type               | Existing free-text values are mapped: "flat"→Flat Amount, "percentage"→Percentage of Outstanding. Unrecognized values are flagged for manual review.                                                      |

### Backward Compatibility

- The API request/response structure remains backward compatible.
- New fields are optional. Old API consumers (if any) continue to work.
- The backend must be updated **before** the frontend Phase 2 changes go live (grace_days, frequency, cap need backend support).

---

## 10. Approval Checklist

This checklist should be reviewed and signed off by SACCO management before development begins.

### Business Approval

- [ ] **SACCO Manager** — Confirms the unified penalty system (Phase 1, Section 6.1) is the preferred approach over keeping the dual system.
- [ ] **SACCO Manager** — Selects the preferred penalty type options for the dropdown (Phase 1, Section 6.2).
- [ ] **Finance Officer** — Confirms the penalty frequency options cover actual SACCO policy (Phase 2, Section 7.2).
- [ ] **Finance Officer** — Confirms penalty cap is required and specifies the default cap type (Phase 2, Section 7.3).
- [ ] **Operations** — Confirms grace period should be at product level, not per-loan.
- [ ] **Compliance** — Confirms excise duty handling requirements (Phase 3, Section 8.2).
- [ ] **Management** — Approves Phase 1 scope for immediate development.
- [ ] **Management** — Approves Phase 2 scope for development after Phase 1.
- [ ] **Management** — Provides feedback on Phase 3 features (which to prioritize, defer, or drop).

### Technical Approval

- [ ] **Backend Team** — Confirms API can support the new fields without breaking changes.
- [ ] **Backend Team** — Confirms data migration strategy for removing global penalty fields.
- [ ] **Frontend Team** — Confirms UI/UX approach is feasible within existing component library.

---

## Appendix A: Current vs. Proposed UI Layout

### Current Layout

```
┌──────────────────────────────────────────────────┐
│  Fees and Penalties                              │
├──────────────────────────────────────────────────┤
│  Processing Fee Type    [None ▼]                 │
│  Processing Fee Value   [________] (if not None) │
│  Penalty Type           [None ▼]                 │
│  Penalty Value          [________] (if not None) │
│                                                    │
│  Penalty Rules                    [+ Add Rule]    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Type [text]  Rate [##]  Grace [##]  [delete] │ │
│  └──────────────────────────────────────────────┘ │
│  No additional penalty rules configured.          │
└──────────────────────────────────────────────────┘
```

### Proposed Layout (After Phase 2)

```
┌──────────────────────────────────────────────────────┐
│  Fees and Penalties                                  │
├──────────────────────────────────────────────────────┤
│  Processing Fee Type    [None ▼]                     │
│  Processing Fee Rate    [____] %  (= KES X,XXX)     │
│    "Charged once at disbursement. Deducted upfront." │
│                                                        │
│  Penalty Grace Period   [3] days                     │
│    "Days after due date before penalties begin."      │
│                                                        │
│  Penalty Rules                        [+ Add Rule]   │
│  ┌──────────────────────────────────────────────────┐│
│  │ Type [Flat▼]  Rate [5]  Freq [Daily▼]            ││
│  │ Grace [0] days  Cap [None ▼]  [delete]           ││
│  └──────────────────────────────────────────────────┘│
│  No additional penalty rules configured.              │
└──────────────────────────────────────────────────────┘
```

## Appendix B: Affected Files

| File                                                                   | Phase | Changes                                  |
| ---------------------------------------------------------------------- | ----- | ---------------------------------------- |
| `src/tenant/modules/loan-products/pages/LoanProductCreate.vue`         | 1,2   | Form fields, validation, layout          |
| `src/tenant/modules/loan-products/components/PenaltyRuleRow.vue`       | 1,2   | Dropdown, frequency, cap fields          |
| `src/tenant/modules/loan-products/composables/useLoanProductCreate.ts` | 1,2   | Form defaults, validation logic, preview |
| `src/tenant/apis/loanProducts/loanProductsApi.ts`                      | 1,2   | TypeScript interfaces for new fields     |
| `src/tenant/modules/loan-products/pages/LoanProductShow.vue`           | 1,2   | Display new fields in detail view        |
| Backend API (`/loan-products`)                                         | 1,2   | Accept new fields, migration script      |
| Backend penalty calculation engine                                     | 2     | Support frequency, cap, grace days       |

---

_End of Plan_
