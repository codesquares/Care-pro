# CarePro SignalR ChatHub Implementation Guide

This document outlines all the required backend SignalR (ChatHub) methods needed to support the frontend messaging and notification systems in the CarePro application. This serves as a comprehensive reference for developers working on the backend implementation of the real-time communication features.

## Table of Contents

1. [Overview](#overview)
2. [ChatHub Methods](#chathub-methods)
   - [Connection Management](#connection-management)
   - [Message Operations](#message-operations)
   - [User Status Management](#user-status-management)
   - [Message Status Updates](#message-status-updates)
3. [Data Models](#data-models)
4. [Client-Side Integration](#client-side-integration)
5. [Authentication Requirements](#authentication-requirements)
6. [Error Handling](#error-handling)
7. [Scaling Considerations](#scaling-considerations)

## Overview

The messaging system in CarePro uses SignalR for real-time communication between users. The primary features include:

- Direct messaging between users (clients and caregivers)
- Real-time message delivery and status updates (sent, delivered, read)
- User online/offline status indicators
- Unread message tracking
- Message history persistence

The SignalR hub named `ChatHub` handles all real-time communication between clients and the server. The frontend already includes the necessary SignalR client implementation in `ChatServiceUtils.js`.

## ChatHub Methods

### Connection Management

#### OnConnectedAsync

```csharp
public override async Task OnConnectedAsync()
{
    // Get user ID from authenticated context
    var userId = Context.User.FindFirst("id")?.Value;
    
    if (!string.IsNullOrEmpty(userId))
    {
        // Associate connection ID with user ID
        await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        
        // Set user as online
        await Clients.All.SendAsync("UserStatusChanged", userId, "Online");
        
        // Store user connection info in database/cache
        await _chatService.UpdateUserConnectionStatus(userId, true, Context.ConnectionId);
    }
    
    await base.OnConnectedAsync();
}
```

#### OnDisconnectedAsync

```csharp
public override async Task OnDisconnectedAsync(Exception exception)
{
    // Get user ID from authenticated context
    var userId = Context.User.FindFirst("id")?.Value;
    
    if (!string.IsNullOrEmpty(userId))
    {
        // Remove connection ID from user's group
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
        
        // Set user as offline
        await Clients.All.SendAsync("UserStatusChanged", userId, "Offline");
        
        // Update user connection status in database/cache
        await _chatService.UpdateUserConnectionStatus(userId, false, null);
    }
    
    await base.OnDisconnectedAsync(exception);
}
```

### Message Operations

#### SendMessage

```csharp
public async Task<string> SendMessage(string senderId, string receiverId, string message)
{
    // Validate input
    if (string.IsNullOrEmpty(senderId) || string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(message))
    {
        throw new HubException("Invalid message parameters");
    }
    
    // Create message object
    var messageId = Guid.NewGuid().ToString();
    var timestamp = DateTime.UtcNow;
    
    // Save message to database
    await _chatService.SaveMessage(messageId, senderId, receiverId, message, timestamp);
    
    // Send to recipient if online (their connection ID is in their user group)
    await Clients.Group(receiverId).SendAsync("ReceiveMessage", senderId, message, messageId, "sent");
    
    // Return message ID to sender for tracking
    return messageId;
}
```

#### GetMessageHistory

```csharp
public async Task<List<MessageDto>> GetMessageHistory(string user1Id, string user2Id, int skip = 0, int take = 50)
{
    // Get message history between two users
    var messages = await _chatService.GetMessageHistory(user1Id, user2Id, skip, take);
    return messages;
}
```

### User Status Management

#### GetOnlineStatus

```csharp
public async Task<bool> GetOnlineStatus(string userId)
{
    // Check if user is online
    var isOnline = await _chatService.IsUserOnline(userId);
    return isOnline;
}
```

#### GetOnlineUsers

```csharp
public async Task<List<string>> GetOnlineUsers()
{
    // Get all online users
    var onlineUsers = await _chatService.GetOnlineUsers();
    return onlineUsers;
}
```

### Message Status Updates

#### MessageReceived

```csharp
public async Task MessageReceived(string messageId)
{
    // Update message status to "delivered"
    var message = await _chatService.UpdateMessageStatus(messageId, "delivered");
    
    // Notify sender that message was delivered
    if (message != null)
    {
        await Clients.Group(message.SenderId).SendAsync("MessageStatusChanged", messageId, "delivered");
    }
}
```

#### MessageRead

```csharp
public async Task MessageRead(string messageId)
{
    // Update message status to "read"
    var message = await _chatService.UpdateMessageStatus(messageId, "read");
    
    // Notify sender that message was read
    if (message != null)
    {
        await Clients.Group(message.SenderId).SendAsync("MessageStatusChanged", messageId, "read");
    }
}
```

## Data Models

### MessageDto

```csharp
public class MessageDto
{
    public string Id { get; set; }
    public string SenderId { get; set; }
    public string ReceiverId { get; set; }
    public string Text { get; set; }
    public string Status { get; set; } // sent, delivered, read
    public DateTime Timestamp { get; set; }
}
```

### ConversationDto

```csharp
public class ConversationDto
{
    public string Id { get; set; }  // User ID of the other user in conversation
    public string Name { get; set; }  // Display name
    public string Avatar { get; set; }  // Profile image URL
    public string PreviewMessage { get; set; }  // Latest message text
    public DateTime LastActive { get; set; }  // Last message timestamp
    public bool IsActive { get; set; }  // Whether user is online
    public int UnreadCount { get; set; }  // Number of unread messages
}
```

## Client-Side Integration

The frontend uses the following SignalR client methods to communicate with the server:

### Connection Setup

```javascript
// Connect to SignalR hub with token-based authentication
connection = new signalR.HubConnectionBuilder()
  .withUrl(CHAT_HUB_URL, {
    accessTokenFactory: () => userToken,
    transport: signalR.HttpTransportType.WebSockets,
    skipNegotiation: true
  })
  .withAutomaticReconnect([2000, 5000, 10000])
  .build();
```

### Message Handlers

```javascript
// Handle incoming messages
connection.on("ReceiveMessage", (senderId, message, messageId, status = 'sent') => {
  onMessageReceived(senderId, message, messageId, status);
  
  // Send delivery confirmation
  connection.invoke("MessageReceived", messageId);
});

// Handle user status changes
connection.on("UserStatusChanged", (userId, status) => {
  onUserStatusChanged(userId, status);
});

// Handle message status updates
connection.on("MessageStatusChanged", (messageId, status) => {
  // Update message status in UI
});
```

### Message Sending

```javascript
// Send message to specific user
export const sendMessage = async (senderId, receiverId, message) => {
  const messageId = await connection.invoke("SendMessage", senderId, receiverId, message);
  return messageId;
};
```

## Authentication Requirements

The ChatHub requires authenticated users. JWT token authentication is used to secure the hub:

```csharp
// In Startup.cs or Program.cs
app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<ChatHub>("/chathub").RequireAuthorization();
});
```

Each client must provide a valid JWT token during connection setup. The token should include the user's ID as a claim.

## Error Handling

The backend should implement comprehensive error handling for the following scenarios:

1. **Invalid message parameters** - Ensure senderId, receiverId and message are not empty
2. **User not authorized** - Verify user is authenticated and has permissions to send messages
3. **Connection failures** - Handle reconnection attempts gracefully
4. **Database errors** - Log errors and fail gracefully with appropriate client messages

Example error handling pattern:

```csharp
public async Task<string> SendMessage(string senderId, string receiverId, string message)
{
    try
    {
        // Validation logic
        if (string.IsNullOrEmpty(senderId) || string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(message))
        {
            throw new HubException("Invalid message parameters");
        }
        
        // Implementation logic
        // ...
    }
    catch (HubException)
    {
        // Rethrow HubExceptions as they are client-safe
        throw;
    }
    catch (Exception ex)
    {
        // Log internal error
        _logger.LogError(ex, "Error sending message");
        throw new HubException("An error occurred while sending your message");
    }
}
```

## Scaling Considerations

For production deployment, the SignalR hub should be configured for scale-out:

1. **Redis backplane** - Use Redis to synchronize messages between multiple instances
2. **Azure SignalR Service** - For larger deployments, use Azure SignalR Service for managed scaling
3. **Connection management** - Implement connection tracking to handle user reconnections

Example scale-out configuration:

```csharp
// In Startup.cs or Program.cs
services.AddSignalR()
    .AddStackExchangeRedis("YOUR_REDIS_CONNECTION_STRING", options =>
    {
        options.Configuration.ChannelPrefix = "carepro_";
    });
```

For Azure SignalR Service:

```csharp
services.AddSignalR()
    .AddAzureSignalR();
```

When implementing for production, ensure proper monitoring and telemetry are in place to track message delivery rates, connection counts, and any errors or latency issues.
