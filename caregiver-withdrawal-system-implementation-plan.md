e# 🏦 CarePro - Caregiver Withdrawal System Implementation Plan

## 📋 Summary of Current Project Findings

### Current System Structure
1. **Payment Processing**: 
   - Payments are processed through Flutterwave integration
   - Client orders are stored in the MongoDB `ClientOrders` collection
   - Each order includes transaction details with `Amount`, `TransactionId`, etc.

2. **Earnings Tracking**:
   - Earnings are calculated but not stored persistently
   - `CaregiverResponse` DTO includes `TotalEarning` (computed from orders)
   - No concept of "withdrawable" vs "total" earnings currently exists

3. **Notification System**: 
   - Well-established notification system (SignalR-based)
   - Supports email notifications and in-app alerts
   - Can be extended to support withdrawal notifications

4. **Authentication & Authorization**:
   - Role-based system with Admin, Caregiver, and Client roles
   - No current admin dashboard for payment verification

5. **Frontend Implementation**:
   - Static earnings UI exists but lacks withdrawal functionality
   - Transaction history already displayed but not connected to backend

## 🛠️ Files/Modules/Classes to Be Created or Modified

### Backend

#### New Entities
1. **Create `Earnings.cs` in `/backend/Domain/Entities/`**
   ```csharp
   public class Earnings
   {
       public ObjectId Id { get; set; }
       public string CaregiverId { get; set; }
       public decimal TotalEarned { get; set; }
       public decimal WithdrawableAmount { get; set; }
       public decimal WithdrawnAmount { get; set; }
       public DateTime LastUpdated { get; set; }
   }
   ```

2. **Create `WithdrawalRequest.cs` in `/backend/Domain/Entities/`**
   ```csharp
   public class WithdrawalRequest
   {
       public ObjectId Id { get; set; }
       public string CaregiverId { get; set; }
       public decimal AmountRequested { get; set; }
       public decimal ServiceCharge { get; set; }
       public decimal FinalAmount { get; set; }
       public string Token { get; set; }
       public WithdrawalStatus Status { get; set; }
       public DateTime CreatedAt { get; set; }
       public DateTime? VerifiedAt { get; set; }
       public string? AdminNotes { get; set; }
       public string? AccountDetails { get; set; }
   }

   public enum WithdrawalStatus
   {
       Pending,
       Verified,
       Completed,
       Rejected
   }
   ```

3. **Create `TransactionHistory.cs` in `/backend/Domain/Entities/`**
   ```csharp
   public class TransactionHistory
   {
       public ObjectId Id { get; set; }
       public string CaregiverId { get; set; }
       public TransactionType Type { get; set; }
       public decimal Amount { get; set; }
       public string Description { get; set; }
       public string ReferenceId { get; set; }
       public DateTime CreatedAt { get; set; }
   }

   public enum TransactionType
   {
       Earning,
       Withdrawal,
       Fee
   }
   ```

#### Update DbContext
1. **Modify `CareProDbContext.cs` to include new entities**
   ```csharp
   public DbSet<Earnings> Earnings { get; set; }
   public DbSet<WithdrawalRequest> WithdrawalRequests { get; set; }
   public DbSet<TransactionHistory> TransactionHistory { get; set; }
   ```

   In OnModelCreating:
   ```csharp
   modelBuilder.Entity<Earnings>().ToCollection("Earnings");
   modelBuilder.Entity<WithdrawalRequest>().ToCollection("WithdrawalRequests");
   modelBuilder.Entity<TransactionHistory>().ToCollection("TransactionHistory");
   ```

#### New DTOs
1. **Create `EarningsDTO.cs` in `/backend/Application/DTOs/`**
   ```csharp
   public class EarningsDTO
   {
       public string Id { get; set; }
       public string CaregiverId { get; set; }
       public decimal TotalEarned { get; set; }
       public decimal WithdrawableAmount { get; set; }
       public decimal WithdrawnAmount { get; set; }
       public DateTime LastUpdated { get; set; }
   }
   ```

2. **Create `WithdrawalRequestDTO.cs` in `/backend/Application/DTOs/`**
   ```csharp
   public class WithdrawalRequestDTO
   {
       public string Id { get; set; }
       public string CaregiverId { get; set; }
       public decimal AmountRequested { get; set; }
       public decimal ServiceCharge { get; set; }
       public decimal FinalAmount { get; set; }
       public string Status { get; set; }
       public DateTime CreatedAt { get; set; }
       public DateTime? VerifiedAt { get; set; }
   }

   public class CreateWithdrawalRequestDTO
   {
       public decimal AmountRequested { get; set; }
       public string AccountDetails { get; set; }
   }

   public class AdminVerifyWithdrawalDTO
   {
       public string Token { get; set; }
       public string? AdminNotes { get; set; }
   }
   ```

3. **Create `TransactionHistoryDTO.cs` in `/backend/Application/DTOs/`**
   ```csharp
   public class TransactionHistoryDTO
   {
       public string Id { get; set; }
       public string CaregiverId { get; set; }
       public string Type { get; set; }
       public decimal Amount { get; set; }
       public string Description { get; set; }
       public string ReferenceId { get; set; }
       public DateTime CreatedAt { get; set; }
   }
   ```

#### New Interfaces
1. **Create `IEarningsService.cs` in `/backend/Application/Interfaces/Content/`**
   ```csharp
   public interface IEarningsService
   {
       Task<EarningsDTO> GetEarningsAsync(string caregiverId);
       Task<EarningsDTO> InitializeEarningsAsync(string caregiverId);
       Task<EarningsDTO> UpdateEarningsAsync(string caregiverId, decimal earnedAmount);
       Task<bool> HasSufficientWithdrawableBalance(string caregiverId, decimal amount);
   }
   ```

2. **Create `IWithdrawalService.cs` in `/backend/Application/Interfaces/Content/`**
   ```csharp
   public interface IWithdrawalService
   {
       Task<WithdrawalRequestDTO> CreateWithdrawalRequestAsync(string caregiverId, CreateWithdrawalRequestDTO request);
       Task<IEnumerable<WithdrawalRequestDTO>> GetCaregiverWithdrawalRequestsAsync(string caregiverId);
       Task<IEnumerable<WithdrawalRequestDTO>> GetAllPendingWithdrawalRequestsAsync();
       Task<WithdrawalRequestDTO> VerifyWithdrawalRequestAsync(string requestId, AdminVerifyWithdrawalDTO verifyRequest);
       Task<WithdrawalRequestDTO> CompleteWithdrawalAsync(string requestId);
       Task<bool> ValidateWithdrawalTokenAsync(string token);
   }
   ```

3. **Create `ITransactionHistoryService.cs` in `/backend/Application/Interfaces/Content/`**
   ```csharp
   public interface ITransactionHistoryService
   {
       Task<IEnumerable<TransactionHistoryDTO>> GetCaregiverTransactionsAsync(string caregiverId, int page = 1, int pageSize = 10);
       Task<TransactionHistoryDTO> AddTransactionAsync(string caregiverId, TransactionType type, decimal amount, string description, string referenceId);
   }
   ```

#### New Services
1. **Create `EarningsService.cs` in `/backend/Infrastructure/Content/Services/`**
2. **Create `WithdrawalService.cs` in `/backend/Infrastructure/Content/Services/`**
3. **Create `TransactionHistoryService.cs` in `/backend/Infrastructure/Content/Services/`**

#### New Controllers
1. **Create `EarningsController.cs` in `/backend/CarePro-Api/Controllers/Content/`**
   - Endpoint: `GET /api/earnings/{caregiverId}`

2. **Create `WithdrawalsController.cs` in `/backend/CarePro-Api/Controllers/Content/`**
   - Endpoint: `POST /api/withdrawals/request`
   - Endpoint: `GET /api/withdrawals/caregiver/{caregiverId}`
   - Endpoint: `GET /api/withdrawals/pending` (Admin)
   - Endpoint: `POST /api/withdrawals/verify/{requestId}` (Admin)
   - Endpoint: `POST /api/withdrawals/complete/{requestId}` (Admin)

3. **Create `TransactionsController.cs` in `/backend/CarePro-Api/Controllers/Content/`**
   - Endpoint: `GET /api/transactions/{caregiverId}`

#### Modify Existing Services
1. **Update `ClientOrderService.cs`**:
   - Add logic to update earnings when a new order is completed
   - Inject `IEarningsService` and call `UpdateEarningsAsync`

2. **Update `NotificationService.cs`**:
   - Add method to send withdrawal-related notifications
   - Update `NotificationType` enum to include withdrawal types

### Frontend

#### New Components
1. **Create `WithdrawalForm.jsx` in `/frontend/vite-project/src/main-app/components/`**
2. **Create `TransactionHistory.jsx` in `/frontend/vite-project/src/main-app/components/`**
3. **Create `AdminWithdrawals.jsx` in `/frontend/vite-project/src/main-app/pages/admin/`**

#### Update Existing Components
1. **Update `Earnings.jsx` to implement withdrawal functionality**
2. **Update notification components to handle withdrawal notifications**

#### New Services
1. **Create `earningsService.js` in `/frontend/vite-project/src/main-app/services/`**
2. **Create `withdrawalService.js` in `/frontend/vite-project/src/main-app/services/`**
3. **Create `transactionService.js` in `/frontend/vite-project/src/main-app/services/`**

## 🚀 API Route Definitions

### 1. Earnings API
| Endpoint | Method | Description | Authorization |
|----------|--------|-------------|---------------|
| `/api/earnings/{caregiverId}` | GET | Get caregiver earnings details | Caregiver, Admin |
| `/api/earnings/{caregiverId}/initialize` | POST | Initialize earnings for new caregiver | Admin |

### 2. Withdrawal API
| Endpoint | Method | Description | Authorization |
|----------|--------|-------------|---------------|
| `/api/withdrawals/request` | POST | Create withdrawal request | Caregiver |
| `/api/withdrawals/caregiver/{caregiverId}` | GET | Get caregiver's withdrawal history | Caregiver, Admin |
| `/api/withdrawals/pending` | GET | Get all pending withdrawal requests | Admin |
| `/api/withdrawals/verify/{requestId}` | POST | Verify withdrawal request with token | Admin |
| `/api/withdrawals/complete/{requestId}` | POST | Mark withdrawal as completed | Admin |

### 3. Transaction API
| Endpoint | Method | Description | Authorization |
|----------|--------|-------------|---------------|
| `/api/transactions/{caregiverId}` | GET | Get caregiver transaction history | Caregiver, Admin |

## 💾 Database Schema Changes

### 1. New Collections

#### Earnings Collection
- **Document Structure**:
  ```json
  {
    "_id": "ObjectId",
    "caregiverId": "string",
    "totalEarned": "decimal",
    "withdrawableAmount": "decimal",
    "withdrawnAmount": "decimal",
    "lastUpdated": "datetime"
  }
  ```

#### WithdrawalRequests Collection
- **Document Structure**:
  ```json
  {
    "_id": "ObjectId",
    "caregiverId": "string",
    "amountRequested": "decimal",
    "serviceCharge": "decimal",
    "finalAmount": "decimal",
    "token": "string",
    "status": "string (Pending, Verified, Completed, Rejected)",
    "createdAt": "datetime",
    "verifiedAt": "datetime?",
    "adminNotes": "string?",
    "accountDetails": "string"
  }
  ```

#### TransactionHistory Collection
- **Document Structure**:
  ```json
  {
    "_id": "ObjectId",
    "caregiverId": "string",
    "type": "string (Earning, Withdrawal, Fee)",
    "amount": "decimal",
    "description": "string",
    "referenceId": "string",
    "createdAt": "datetime"
  }
  ```

## 📝 Workflow Logic

### 1. Earnings System Flow

```pseudo
// Initialize earnings for a caregiver
FUNCTION InitializeEarnings(caregiverId):
    IF earnings already exist for caregiverId THEN
        RETURN existing earnings
    END IF
    
    earnings = new Earnings {
        CaregiverId = caregiverId,
        TotalEarned = 0,
        WithdrawableAmount = 0,
        WithdrawnAmount = 0,
        LastUpdated = CURRENT_TIME()
    }
    
    SAVE earnings to database
    RETURN earnings

// Update earnings when a gig is completed
FUNCTION UpdateEarnings(caregiverId, amount):
    earnings = GET earnings for caregiverId
    
    IF earnings is NULL THEN
        earnings = InitializeEarnings(caregiverId)
    END IF
    
    earnings.TotalEarned += amount
    earnings.WithdrawableAmount += amount
    earnings.LastUpdated = CURRENT_TIME()
    
    SAVE earnings to database
    
    // Add transaction history
    AddTransaction(
        caregiverId,
        TransactionType.Earning,
        amount,
        "Payment received for completed gig",
        "GigId or OrderId"
    )
    
    RETURN updated earnings
```

### 2. Withdrawal Request Flow

```pseudo
// Create a withdrawal request
FUNCTION RequestWithdrawal(caregiverId, amountRequested, accountDetails):
    // Validate request
    IF amountRequested <= 0 THEN
        THROW "Amount must be greater than zero"
    END IF
    
    earnings = GET earnings for caregiverId
    IF earnings is NULL THEN
        THROW "No earnings record found"
    END IF
    
    IF amountRequested > earnings.WithdrawableAmount THEN
        THROW "Insufficient withdrawable balance"
    END IF
    
    // Check for pending withdrawal requests
    pendingRequests = GET withdrawal requests WHERE caregiverId = caregiverId AND status = "Pending"
    IF pendingRequests is not EMPTY THEN
        THROW "You already have a pending withdrawal request"
    END IF
    
    // Calculate service charge and final amount
    serviceCharge = amountRequested * 0.10
    finalAmount = amountRequested - serviceCharge
    
    // Generate unique token
    token = GENERATE_RANDOM_TOKEN(16)
    
    // Create withdrawal request
    request = new WithdrawalRequest {
        CaregiverId = caregiverId,
        AmountRequested = amountRequested,
        ServiceCharge = serviceCharge,
        FinalAmount = finalAmount,
        Token = token,
        Status = WithdrawalStatus.Pending,
        CreatedAt = CURRENT_TIME(),
        AccountDetails = accountDetails
    }
    
    SAVE request to database
    
    // Update earnings (reserve the withdrawable amount)
    earnings.WithdrawableAmount -= amountRequested
    SAVE earnings to database
    
    // Notify admin
    caregiver = GET caregiver details for caregiverId
    SendAdminNotification(
        "New Withdrawal Request",
        $"Caregiver {caregiver.FirstName} {caregiver.LastName} has requested a withdrawal of {amountRequested}.",
        request.Id,
        token
    )
    
    RETURN request
```

### 3. Admin Verification Flow

```pseudo
FUNCTION VerifyWithdrawalRequest(requestId, token, adminNotes):
    request = GET withdrawal request by requestId
    
    IF request is NULL THEN
        THROW "Withdrawal request not found"
    END IF
    
    IF request.Status != WithdrawalStatus.Pending THEN
        THROW "This request has already been processed"
    END IF
    
    IF request.Token != token THEN
        THROW "Invalid verification token"
    END IF
    
    // Mark as verified
    request.Status = WithdrawalStatus.Verified
    request.VerifiedAt = CURRENT_TIME()
    request.AdminNotes = adminNotes
    
    SAVE request to database
    
    // Notify caregiver
    SendCaregiverNotification(
        request.CaregiverId,
        "Withdrawal Request Verified",
        "Your withdrawal request has been verified and is being processed."
    )
    
    RETURN request
```

### 4. Complete Withdrawal Flow

```pseudo
FUNCTION CompleteWithdrawal(requestId):
    request = GET withdrawal request by requestId
    
    IF request is NULL THEN
        THROW "Withdrawal request not found"
    END IF
    
    IF request.Status != WithdrawalStatus.Verified THEN
        THROW "This request has not been verified yet"
    END IF
    
    // Mark as completed
    request.Status = WithdrawalStatus.Completed
    SAVE request to database
    
    // Update earnings
    earnings = GET earnings for request.CaregiverId
    earnings.WithdrawnAmount += request.AmountRequested
    SAVE earnings to database
    
    // Add transaction records
    AddTransaction(
        request.CaregiverId,
        TransactionType.Withdrawal,
        request.FinalAmount,
        "Withdrawal to bank account",
        request.Id
    )
    
    AddTransaction(
        request.CaregiverId,
        TransactionType.Fee,
        request.ServiceCharge,
        "Withdrawal service charge (10%)",
        request.Id
    )
    
    // Notify caregiver
    SendCaregiverNotification(
        request.CaregiverId,
        "Withdrawal Completed",
        $"Your withdrawal of {request.FinalAmount} has been processed successfully."
    )
    
    RETURN request
```

## 👨‍💼 Admin Interaction Touchpoints

### 1. Admin Withdrawal Dashboard
- View all pending withdrawal requests
- Filter by status (Pending, Verified, Completed)
- Sort by date, amount, caregiver name

### 2. Withdrawal Request Detail View
- Shows caregiver details (name, email, account number)
- Shows withdrawal details (amount, service charge, final amount)
- Provides token input field for verification
- Allows adding admin notes
- Shows transaction timeline/history

### 3. Verification Process
1. Admin receives notification of new withdrawal request
2. Admin navigates to withdrawal dashboard
3. Admin selects pending request and reviews details
4. Admin enters verification token
5. Upon successful verification, admin can mark as completed (simulating payout)

### 4. Admin Notification Flow
- Email notification with withdrawal details and token
- In-app notification in admin dashboard 
- Notification badge showing pending withdrawal count

## 🔒 Security and Edge Cases

### Security Considerations
1. **Token Generation**:
   - Use cryptographically secure random generation
   - Set token expiration (24 hours recommended)
   - Store hashed tokens in the database

2. **Authorization**:
   - Enforce role-based access control for all endpoints
   - Caregiver can only access their own earnings/withdrawals
   - Admin-specific endpoints properly restricted

3. **Input Validation**:
   - Validate withdrawal amounts (minimum/maximum)
   - Validate account details format
   - Sanitize all inputs to prevent injection attacks

4. **Transaction Integrity**:
   - Use database transactions where applicable
   - Implement idempotent operations to prevent duplicate processing

### Edge Cases to Handle

1. **Insufficient Funds**:
   - Clear error message when withdrawal amount exceeds withdrawable balance
   - UI should prevent requesting more than available amount

2. **Concurrent Withdrawals**:
   - Implement locking mechanism to prevent multiple simultaneous withdrawals
   - Only one pending withdrawal request per caregiver at a time

3. **Failed Processes**:
   - Recovery mechanism for system failures during withdrawal processing
   - Admin ability to reject a withdrawal with reason

4. **Caregiver Account Changes**:
   - Handle scenario where caregiver updates bank details after withdrawal request
   - Store account details with withdrawal request for consistency

5. **Dispute Handling**:
   - Process for caregivers to dispute withdrawal issues
   - Admin tools to investigate and resolve disputes

6. **Token Expiration/Loss**:
   - Admin ability to regenerate token if original is lost
   - Auto-expiry of unverified tokens after set period

7. **Withdrawal Limits**:
   - Daily/weekly/monthly withdrawal limits
   - Minimum withdrawal amount (to minimize processing of tiny amounts)

8. **Special Status Orders**:
   - Handle earnings from disputed or refunded orders
   - Only include completed orders in withdrawable earnings
