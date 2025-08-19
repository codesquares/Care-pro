# Step 3: Real-time Notifications and SignalR Integration Guide

## 🎯 **Architecture Overview**

The CarePro verification system now includes real-time notifications through a proper separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │
│   Dojah API     │───▶│   Node.js API   │───▶│  Backend API    │───▶│   Frontend      │
│   (Webhooks)    │    │   (Webhook      │    │  (SignalR Hub)  │    │   (Notifications)│
│                 │    │    Receiver)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 **Data Flow**

### 1. **Webhook Reception** (Node.js API)
- ✅ Receives webhook from Dojah
- ✅ Validates signature and input data
- ✅ Stores verification data temporarily
- ✅ Processes data in background

### 2. **Backend Integration** (Node.js → .NET Core)
- ✅ Formats data to match `AddVerificationRequest` DTO
- ✅ Sends POST request to `/api/Verifications`
- ✅ Includes notification flag: `requestRealTimeNotification: true`
- ✅ Handles retry logic and error cases

### 3. **Real-time Notifications** (.NET Core Backend)
- 🔄 **Backend receives verification data**
- 🔄 **Backend processes and stores in database**  
- 🔄 **Backend sends SignalR notification to frontend**
- 🔄 **Frontend receives real-time update**

## 📋 **Implementation Status**

### ✅ **Completed (Steps 1-2)**
- **Security**: Signature verification, rate limiting, PII protection
- **Persistence**: Temporary storage with 12-hour TTL
- **Integration**: Backend API connectivity with retry logic
- **Monitoring**: Health checks and error categorization

### 🔄 **Step 3: Backend SignalR Implementation Required**

The Node.js API now sends enhanced verification data to the backend including:

```json
{
  "userId": "user123",
  "verifiedFirstName": "John",
  "verifiedLastName": "Doe", 
  "verificationMethod": "BVN",
  "verificationNo": "12345678901",
  "verificationStatus": "verified",
  "requestRealTimeNotification": true,
  "notificationData": {
    "type": "VerificationUpdate",
    "source": "dojah_webhook", 
    "timestamp": "2025-08-19T03:30:00.000Z",
    "verificationCompleted": true
  }
}
```

## 🛠️ **Backend Implementation Needed**

### 1. **Update VerificationService.cs**

```csharp
public async Task<string> CreateVerificationAsync(AddVerificationRequest request)
{
    // ... existing verification logic ...
    
    // NEW: Check if real-time notification is requested
    if (request.RequestRealTimeNotification && !string.IsNullOrEmpty(request.UserId))
    {
        await SendVerificationNotification(request.UserId, request.NotificationData);
    }
    
    return verificationId;
}

private async Task SendVerificationNotification(string userId, NotificationData data)
{
    try
    {
        // Create notification
        var notification = new CreateNotificationRequest
        {
            RecipientId = userId,
            Type = data.Type,
            Title = "Identity Verification Complete",
            Content = "Your identity verification has been processed successfully.",
            RelatedEntityId = userId
        };
        
        await notificationService.CreateNotificationAsync(notification);
        
        // Send real-time SignalR notification
        await notificationHub.Clients.User(userId)
            .SendAsync("VerificationStatusUpdated", new
            {
                UserId = userId,
                Status = "verified",
                Timestamp = DateTime.UtcNow,
                Message = "Your identity verification is complete!"
            });
            
        logger.LogInformation($"Sent real-time verification notification to user {userId}");
    }
    catch (Exception ex)
    {
        logger.LogWarning($"Failed to send verification notification to user {userId}: {ex.Message}");
    }
}
```

### 2. **Update AddVerificationRequest DTO**

```csharp
public class AddVerificationRequest
{       
    public string UserId { get; set; }
    public string VerifiedFirstName { get; set; }
    public string VerifiedLastName { get; set; }
    public string VerificationMethod { get; set; }
    public string VerificationNo { get; set; }
    public string VerificationStatus { get; set; }
    
    // NEW: Real-time notification support
    public bool RequestRealTimeNotification { get; set; } = false;
    public NotificationData NotificationData { get; set; }
}

public class NotificationData
{
    public string Type { get; set; }
    public string Source { get; set; }
    public DateTime Timestamp { get; set; }
    public bool VerificationCompleted { get; set; }
}
```

### 3. **Frontend SignalR Connection**

The frontend already has SignalR infrastructure. Ensure the connection listens for verification events:

```javascript
// In notificationService.js or signalRChatService.js
connection.on("VerificationStatusUpdated", (data) => {
    console.log("🔔 Verification status updated:", data);
    
    // Update UI, show toast notification, etc.
    showNotification({
        title: "Verification Complete!",
        message: data.Message,
        type: "success"
    });
    
    // Trigger any verification status updates in the UI
    window.dispatchEvent(new CustomEvent('verificationUpdate', { 
        detail: data 
    }));
});
```

## 🔍 **Testing & Verification**

### 1. **Test Real-time Flow**
```bash
# 1. Send webhook to Node.js API
curl -X POST http://localhost:3000/api/dojah/webhook \
  -H "Content-Type: application/json" \
  -H "x-dojah-signature: sha256=<valid_signature>" \
  -d '{
    "status": true,
    "verification_status": "Completed", 
    "user_id": "<real_user_id>",
    "data": {"type": "identity"}
  }'

# 2. Check backend receives data with notification flag
# 3. Verify SignalR notification sent to frontend
# 4. Confirm frontend receives real-time update
```

### 2. **Monitor System Health**
```bash
# Check webhook processing status
curl http://localhost:3000/api/dojah/admin/health

# Verify backend notification service
curl https://carepro-api20241118153443.azurewebsites.net/api/notifications
```

## 📊 **Production Deployment**

### Environment Variables (.NET Backend)
```
SIGNALR_ENABLED=true
NOTIFICATION_SERVICE_ENABLED=true
WEBHOOK_PROCESSING_NOTIFICATIONS=true
```

### Monitoring & Alerts
- Monitor webhook processing success rate
- Track SignalR connection health
- Alert on notification delivery failures
- Monitor real-time message latency

## 🎯 **Benefits of This Architecture**

1. **✅ Separation of Concerns**: Node.js handles webhooks, .NET handles business logic
2. **✅ Scalability**: Each service can scale independently
3. **✅ Reliability**: Retry logic and graceful degradation
4. **✅ Real-time**: Instant user feedback on verification completion
5. **✅ Maintainability**: Clear boundaries between webhook processing and notifications

## 🚀 **Next Steps**

1. **Backend Team**: Implement SignalR notification logic in VerificationService
2. **Frontend Team**: Ensure SignalR connection handles verification events
3. **Testing**: Validate end-to-end real-time notification flow
4. **Deployment**: Deploy with proper environment configuration

---

**Summary**: The Node.js webhook system is production-ready with security, monitoring, and backend integration. Real-time notifications require backend SignalR implementation to complete the full user experience.
