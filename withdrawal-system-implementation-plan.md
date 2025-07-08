# 🏦 Withdrawal System Implementation Plan

## 📌 Objective

Create a robust **withdrawal system** for caregivers that includes an **earnings layout** with total and withdrawable earnings. The system must support **withdrawal requests**, calculate a **10% service charge**, and initiate an **admin-verification process** using a token-based workflow.

---

## ✅ Features to Implement

### 1. Earnings Layout

- Display:
  - `Total Earnings`: All earnings accumulated.
  - `Withdrawable Earnings`: Earnings where gig conditions have been fulfilled.
- Only allow withdrawals from **Withdrawable Earnings**.
- Automatically update balances and ensure accurate calculations.

### 2. Withdrawal Request Flow

- Allow caregivers to request withdrawals **only from withdrawable balance**.
- Deduct a **10% service charge** automatically from the requested amount.
- Generate a **unique withdrawal token** upon request.
- Notify **admin** (via email, dashboard update, or logging) with:
  - Withdrawal details.
  - Generated token.
  - Caregiver’s account number (from file).

### 3. Admin Token Verification

- Admin must input/verify the token to confirm the withdrawal.
- Once verified:
  - Simulate a **manual payout** (do not integrate payment gateway yet).
  - Mark withdrawal as `Processed` in the system.

### 4. Audit and Security

- Store withdrawal history with:
  - `Pending`, `Verified`, `Completed` statuses.
- Prevent:
  - Duplicate requests.
  - Withdrawals exceeding the withdrawable amount.

---

## 📁 Implementation Instructions

### 1. Analyze Current Project Structure

- Inspect current models:
  - `Caregiver`, `Gig`, `Earnings`, etc.
- Identify:
  - How earnings and gig completions are tracked.
  - Existing authentication and role-based access (especially admin).
  - Notification utilities (email, in-app alerts, etc.).

### 2. Define/Update Required Models

#### Earnings (Update)
- `total_earned: number`
- `withdrawable_amount: number`
- `withdrawn_amount: number`

#### WithdrawalRequest (New)
- `id`
- `caregiver_id`
- `amount_requested`
- `service_charge`
- `final_amount`
- `token` (unique, one-time-use)
- `status` (`Pending`, `Verified`, `Completed`)
- `created_at`, `verified_at`
- `admin_notes` (optional)

### 3. Workflow Steps

1. Caregiver clicks “Request Withdrawal”.
2. Backend:
   - Validates withdrawable amount.
   - Calculates:
     - Service charge (10%)
     - Final amount
   - Generates token and saves request.
3. System:
   - Notifies admin with token and caregiver details.
4. Admin:
   - Inputs/validates token in dashboard.
   - Marks withdrawal as processed (simulated payout).
5. System:
   - Updates caregiver balances.
   - Changes withdrawal request status to `Completed`.

### 4. Calculations

- **Service Charge**: `amount_requested * 0.10`
- **Final Amount**: `amount_requested - service_charge`
- **Balance Updates**:
  - Subtract requested amount from `withdrawable_amount`
  - Add to `withdrawn_amount`

### 5. Notifications

- Implement placeholder system:
  - Email, or admin dashboard badge
- Ensure token is clearly shown to the admin

### 6. Error Handling

- Insufficient funds → error message
- Duplicate or concurrent withdrawal requests → block
- Token mismatch → denial message

---

## 📄 Output Requirement

Generate a Markdown file titled:

```bash
withdrawal-system-implementation-plan.md
It should contain:

✅ Summary of current project findings

✅ Files/modules/classes to be created or modified

✅ API route definitions (if applicable)

✅ Database schema changes 

✅ Workflow logic (use pseudocode if helpful)

✅ Admin interaction touchpoints

✅ Notes on security and edge cases