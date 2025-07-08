# 🏦 Caregiver Withdrawal System Flow

## 🔄 Complete System Flow

```mermaid
graph TD
    %% Earnings Process
    A[Gig Completion] -->|Order marked as completed| B(Update Earnings)
    B -->|Create| C[Earning Transaction]
    B -->|Increase| D[Withdrawable Balance]

    %% Withdrawal Request Flow
    D -->|Caregiver initiates| E[Withdrawal Request]
    E -->|System validates| F{Sufficient Funds?}
    F -->|No| G[Error: Insufficient Funds]
    F -->|Yes| H[Generate Token]
    H -->|Create| I[Pending Withdrawal Request]
    I -->|Reserve| J[Withdrawable Amount]
    I -->|Send| K[Admin Notification]

    %% Admin Verification Flow
    K -->|Admin reviews| L[Admin Verification Screen]
    L -->|Admin enters token| M{Valid Token?}
    M -->|No| N[Error: Invalid Token]
    M -->|Yes| O[Update Status to Verified]
    O -->|Send| P[Caregiver Notification]

    %% Withdrawal Completion Flow
    P -->|Admin processes| Q[Complete Withdrawal]
    Q -->|Update| R[Status to Completed]
    Q -->|Update| S[Earnings Record]
    Q -->|Create| T[Withdrawal Transaction]
    Q -->|Create| U[Fee Transaction]
    Q -->|Send| V[Completion Notification]

    %% Transaction History
    C --> W[Transaction History]
    T --> W
    U --> W
    W -->|Caregiver views| X[Transaction History Page]

    %% Visual styling
    classDef process fill:#f9f,stroke:#333,stroke-width:2px;
    classDef decision fill:#bbf,stroke:#333,stroke-width:2px;
    classDef document fill:#bfb,stroke:#333,stroke-width:2px;
    classDef notification fill:#fbb,stroke:#333,stroke-width:2px;
    
    class B,H,O,Q,R,S process;
    class F,M decision;
    class C,I,T,U,W document;
    class K,P,V notification;
```

## 💰 1. Earnings Accumulation

### Frontend:
📊 **Dashboard View**

```
┌────────────────────────────────────────────┐
│                                            │
│  EARNINGS DASHBOARD                        │
│                                            │
│  ┌──────────────┐  ┌──────────────┐        │
│  │              │  │              │        │
│  │  ₦50,000     │  │  ₦45,000     │        │
│  │  Total       │  │  Available   │        │
│  │  Earned      │  │  Balance     │        │
│  │              │  │              │        │
│  └──────────────┘  └──────────────┘        │
│                                            │
│  ┌──────────────┐  ┌──────────────┐        │
│  │              │  │              │        │
│  │  ₦5,000      │  │  WITHDRAW    │        │
│  │  Withdrawn   │  │  FUNDS       │        │
│  │              │  │              │        │
│  └──────────────┘  └──────────────┘        │
│                                            │
└────────────────────────────────────────────┘
```

### Backend Flow:

```mermaid
sequenceDiagram
    participant Client as Client App
    participant OrderCtrl as OrderController
    participant OrderSvc as ClientOrderService
    participant EarnSvc as EarningsService
    participant TransSvc as TransactionService
    participant DB as Database
    
    Client->>OrderCtrl: Update order status to "Completed"
    OrderCtrl->>OrderSvc: Update order status
    OrderSvc->>EarnSvc: Update caregiver earnings
    EarnSvc->>DB: Add amount to TotalEarned & WithdrawableAmount
    OrderSvc->>TransSvc: Create earning transaction
    TransSvc->>DB: Save transaction record
    OrderSvc-->>Client: Return success response
```

## 💸 2. Withdrawal Request Initiation

### Frontend:
📝 **Withdrawal Modal**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  REQUEST WITHDRAWAL                   [X]       │
│  ────────────────────────────────────────       │
│                                                 │
│  Amount to Withdraw (₦)                         │
│  ┌─────────────────────────────────────┐        │
│  │ 10000                               │        │
│  └─────────────────────────────────────┘        │
│  Available: ₦45,000                             │
│                                                 │
│  ┌─────────────────────────────────────┐        │
│  │ Amount Requested:     ₦10,000       │        │
│  │ Service Charge (10%): ₦1,000        │        │
│  │ Final Amount:         ₦9,000        │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  Bank Name                                      │
│  ┌─────────────────────────────────────┐        │
│  │ First Bank                          │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  Account Number                                 │
│  ┌─────────────────────────────────────┐        │
│  │ 1234567890                          │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  Account Name                                   │
│  ┌─────────────────────────────────────┐        │
│  │ John Doe                            │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  ┌───────────┐            ┌───────────────┐     │
│  │ CANCEL    │            │ SUBMIT        │     │
│  └───────────┘            └───────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Backend Flow:

```mermaid
sequenceDiagram
    participant Client as Caregiver App
    participant WithCtrl as WithdrawalController
    participant WithSvc as WithdrawalService
    participant EarnSvc as EarningsService
    participant NotifSvc as NotificationService
    participant DB as Database
    
    Client->>WithCtrl: Submit withdrawal request
    WithCtrl->>WithSvc: Create withdrawal request
    WithSvc->>EarnSvc: Check sufficient funds
    EarnSvc-->>WithSvc: Confirm funds available
    WithSvc->>WithSvc: Generate verification token
    WithSvc->>DB: Create withdrawal request
    WithSvc->>EarnSvc: Reserve withdrawable amount
    EarnSvc->>DB: Update earnings record
    WithSvc->>NotifSvc: Send admin notification
    NotifSvc->>DB: Save notification
    WithSvc-->>Client: Return success with request details
```

## 🔐 3. Admin Verification Process

### Frontend:
🔍 **Admin Withdrawal Management Dashboard**

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    │
│  WITHDRAWAL MANAGEMENT                                                             │
│                                                                                    │
│  Filter by status: [All Requests ▼]                                                │
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                              │  │
│  │  Date        Caregiver     Amount    Fee      Final     Status    Action     │  │
│  │  ────────────────────────────────────────────────────────────────────────    │  │
│  │                                                                              │  │
│  │  2025-06-17  John Doe      ₦10,000   ₦1,000   ₦9,000   PENDING   [VERIFY]   │  │
│  │                                                                              │  │
│  │  2025-06-16  Jane Smith    ₦25,000   ₦2,500   ₦22,500  VERIFIED  [COMPLETE] │  │
│  │                                                                              │  │
│  │  2025-06-15  Mike Johnson  ₦5,000    ₦500     ₦4,500   COMPLETED  Processed │  │
│  │                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

📋 **Token Verification Modal**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  VERIFY WITHDRAWAL REQUEST            [X]       │
│  ────────────────────────────────────────       │
│                                                 │
│  Caregiver: John Doe                            │
│  Amount: ₦10,000                                │
│  Fee: ₦1,000                                    │
│  Final Amount: ₦9,000                           │
│                                                 │
│  Enter Verification Token                       │
│  ┌─────────────────────────────────────┐        │
│  │ XYZ12345                            │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  Admin Notes (Optional)                         │
│  ┌─────────────────────────────────────┐        │
│  │ Payment processed via bank transfer  │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  ┌───────────┐            ┌───────────────┐     │
│  │ CANCEL    │            │ VERIFY        │     │
│  └───────────┘            └───────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Backend Flow:

```mermaid
sequenceDiagram
    participant Admin as Admin App
    participant WithCtrl as WithdrawalController
    participant WithSvc as WithdrawalService
    participant NotifSvc as NotificationService
    participant DB as Database
    
    Admin->>WithCtrl: Submit verification request with token
    WithCtrl->>WithSvc: Verify withdrawal request
    WithSvc->>DB: Check token validity
    DB-->>WithSvc: Return withdrawal request
    WithSvc->>DB: Update status to "Verified"
    WithSvc->>NotifSvc: Send caregiver notification
    NotifSvc->>DB: Save notification
    WithSvc-->>Admin: Return updated withdrawal details
```

## 🔄 4. Withdrawal Completion

### Backend Flow:

```mermaid
sequenceDiagram
    participant Admin as Admin App
    participant WithCtrl as WithdrawalController
    participant WithSvc as WithdrawalService
    participant EarnSvc as EarningsService
    participant TransSvc as TransactionService
    participant NotifSvc as NotificationService
    participant DB as Database
    
    Admin->>WithCtrl: Complete withdrawal request
    WithCtrl->>WithSvc: Complete withdrawal
    WithSvc->>DB: Update status to "Completed"
    WithSvc->>EarnSvc: Update withdrawn amounts
    EarnSvc->>DB: Update earnings record
    WithSvc->>TransSvc: Create withdrawal transaction
    TransSvc->>DB: Save withdrawal transaction
    WithSvc->>TransSvc: Create fee transaction
    TransSvc->>DB: Save fee transaction
    WithSvc->>NotifSvc: Send completion notification
    NotifSvc->>DB: Save notification
    WithSvc-->>Admin: Return success response
```

## 📊 5. Transaction History View

### Frontend:
📜 **Transaction History View**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  TRANSACTION HISTORY                                                       │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                                                                    │    │
│  │  Date        Type        Description               Amount   Ref    │    │
│  │  ────────────────────────────────────────────────────────────────  │    │
│  │                                                                    │    │
│  │  2025-06-18  EARNING     Payment for completed     +₦15,000  #1245 │    │
│  │                          gig: Home Care                            │    │
│  │                                                                    │    │
│  │  2025-06-17  WITHDRAWAL  Withdrawal to bank        -₦9,000   #W387 │    │
│  │                          account                                   │    │
│  │                                                                    │    │
│  │  2025-06-17  FEE         Service fee for          -₦1,000   #W387 │    │
│  │                          withdrawal (10%)                          │    │
│  │                                                                    │    │
│  │  2025-06-15  EARNING     Payment for completed     +₦20,000  #1242 │    │
│  │                          gig: Elder Care                           │    │
│  │                                                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  ◄ Previous   Page 1 of 2   Next ►                                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Backend Flow:

```mermaid
sequenceDiagram
    participant Client as Caregiver App
    participant TransCtrl as TransactionController
    participant TransSvc as TransactionService
    participant UserSvc as UserProfileService
    participant DB as Database
    
    Client->>TransCtrl: Request transaction history
    TransCtrl->>TransCtrl: Validate user permission
    TransCtrl->>TransSvc: Get transactions for caregiver
    TransSvc->>DB: Query transactions with pagination
    DB-->>TransSvc: Return transaction records
    TransSvc->>UserSvc: Get caregiver details for each transaction
    UserSvc-->>TransSvc: Return caregiver details
    TransSvc-->>TransCtrl: Return formatted transaction records
    TransCtrl-->>Client: Return paginated transaction history
```

## 📱 Data Model Diagrams

### Entities Relationship Diagram

```mermaid
erDiagram
    Caregiver ||--o{ Earnings : has
    Caregiver ||--o{ WithdrawalRequest : makes
    Caregiver ||--o{ TransactionHistory : has
    Gig ||--o{ ClientOrder : fulfills
    ClientOrder ||--o{ TransactionHistory : generates
    WithdrawalRequest ||--o{ TransactionHistory : generates
    
    Caregiver {
        string Id
        string FirstName
        string LastName
        string Email
    }
    
    Earnings {
        string Id
        string CaregiverId
        decimal TotalEarned
        decimal WithdrawableAmount
        decimal WithdrawnAmount
        datetime CreatedAt
        datetime UpdatedAt
    }
    
    WithdrawalRequest {
        string Id
        string CaregiverId
        decimal AmountRequested
        decimal ServiceCharge
        decimal FinalAmount
        string Token
        string Status
        datetime CreatedAt
        datetime VerifiedAt
        datetime CompletedAt
        string AdminNotes
        string AccountNumber
        string BankName
    }
    
    TransactionHistory {
        string Id
        string CaregiverId
        string TransactionType
        decimal Amount
        string Description
        string ReferenceId
        datetime CreatedAt
    }
