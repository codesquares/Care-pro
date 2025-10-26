# Chat System Optimization

This document provides details about the recent optimizations made to the CarePro messaging system to address excessive API requests and improve performance.

## Key Optimizations

### 1. Connection Management

- **Limited Connection Attempts**: Added maximum retry limits to prevent infinite reconnection loops
- **Improved Error Handling**: Better error logging and graceful fallbacks when connections fail
- **Reduced Polling Frequency**: Changed connection status check polling from 5 seconds to 30 seconds
- **Added Timeouts**: Implemented timeouts for connections that take too long

### 2. API Usage Optimization

- **Endpoint Updates**: Updated API endpoints to match backend implementation
  - Now using `/api/chat/ChatPreview` instead of `/api/messages/conversations`
  - Now using `/api/chat/history` for message history
- **Caching System**: Implemented a sophisticated cache for:
  - Message history (5 minute TTL)
  - User online status (30 second TTL)
  - Automatic cache invalidation when new messages arrive

### 3. Request Throttling

- **Rate Limiting**: Added debounce mechanism to prevent multiple conversation fetches within a short time
- **Abort Controllers**: All API calls now use AbortController to prevent long-running requests
- **Optimized Processing**: Limited conversation processing to avoid excessive parallel API calls

### 4. Performance Metrics

- Added performance monitoring with the new `ChatMetrics` component which tracks:
  - API call durations
  - Connection state
  - Cache hit/miss rates
  - Success/failure rates

## Monitoring Tools

### ChatMetrics Component

The ChatMetrics component is available on the Messages page (collapsed by default).

- **Use in Production**: The metrics component is hidden in production by default. To enable it:
  ```javascript
  // In browser console
  sessionStorage.setItem('showChatMetrics', 'true');
  // Refresh the page
  ```

- **Key Stats**:
  - Connection Status
  - API Response Times
  - Cache Size
  - Recent API Calls

### Logging

Extensive logging has been added to the chat system using the new `chatLogger` utility:

- Connection status changes
- Message send/receive events
- Cache operations
- API call performance

## Backend Considerations

The current implementation successfully connects to the SignalR hub at `/chathub` and uses the following methods:

- `RegisterConnection(userId)`: Register a user's connection
- `SendMessage(senderId, receiverId, message)`: Send a message
- `GetMessageHistory(user1Id, user2Id, skip, take)`: Get message history
- `GetOnlineStatus(userId)`: Check a user's online status
- `GetOnlineUsers()`: Get all online users
- `MessageReceived(messageId)`: Mark a message as received
- `MessageRead(messageId)`: Mark a message as read

## Potential Further Optimizations

1. **Backend Pagination**: Add cursor-based pagination to reduce message history query size
2. **WebSocket Protocol**: Consider WebSocket-only transport for high-traffic environments
3. **Message Compression**: Implement message compression for large payloads
4. **Connection State Management**: Add server-side connection grouping for more efficient broadcasts
5. **Offline Mode**: Expand functionality to work offline with better local storage integration

## Troubleshooting

If chat connection issues persist:

1. Open the ChatMetrics panel to check connection state
2. Verify appropriate API endpoints in the backend configuration
3. Check the network tab in developer tools for failed SignalR connections
4. Ensure the JWT token is being correctly included in the SignalR connection
5. Look for any CORS issues in the server logs
