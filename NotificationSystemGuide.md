# CarePro Notification System Guide

## Overview

The CarePro notification system uses SignalR for real-time notifications and RESTful APIs for retrieving notification history. This guide explains how the system works and how to troubleshoot common issues.

## Architecture

1. **Backend Components**:
   - `NotificationHub.cs`: SignalR hub for real-time notifications
   - `NotificationsController.cs`: REST API endpoints for notification management
   - `NotificationService.cs`: Service layer for notification business logic

2. **Frontend Components**:
   - `NotificationContext.jsx`: React context provider for notification state
   - `notificationService.js`: Service for API calls
   - `ConnectionStatusIndicator.jsx`: UI component to show connection status

## API Endpoints

- `GET /api/notifications`: Get paginated notifications
- `GET /api/notifications/unread/count`: Get count of unread notifications
- `PUT /api/notifications/{id}/read`: Mark notification as read
- `PUT /api/notifications/read-all`: Mark all notifications as read
- `DELETE /api/notifications/{id}`: Delete a notification

## WebSocket Connection

The SignalR hub is accessible at: `/notificationHub`

## Common Issues and Solutions

### 1. CORS Errors

**Symptoms**:
- Console errors about CORS policy
- "Access to XMLHttpRequest has been blocked by CORS policy"

**Solutions**:
- Ensure the frontend origin is allowed in the backend CORS policy in `Program.cs`
- Use the Vite development proxy (already configured)
- If using a custom domain, add it to the CORS allowed origins

### 2. SignalR Connection Issues

**Symptoms**:
- "WebSocket failed to connect" errors
- "Error starting NotificationHub connection" messages

**Solutions**:
- Check if the backend API is running
- Ensure you're authenticated (valid token)
- Check network/firewall settings that might block WebSockets
- Use the connection status indicator for diagnostics

### 3. API Connection Issues

**Symptoms**:
- "Network Error" when fetching notifications
- 500 Internal Server Error responses

**Solutions**:
- Check if the API server is running
- Verify your authentication token is valid
- Check for server-side errors in the logs
- Ensure the backend MongoDB connection is working

## Testing the System

You can use the provided `test-notification-system.sh` script to test connections:

```bash
./test-notification-system.sh
```

## Development Environment Setup

1. **Set Environment Variables**:
   - Create `.env` files in both backend and frontend projects
   - Set `VITE_API_BASE_URL` in frontend to your backend URL

2. **Using the Development Proxy**:
   - When running the frontend in development mode, API requests will be proxied
   - This helps avoid CORS issues during development
   - The proxy is configured in `vite.config.js`

## Debugging Tools

1. **Connection Status Indicator**:
   - Shows the current connection status in the UI
   - Provides troubleshooting steps for connection issues

2. **Development Mode Fallbacks**:
   - In development mode, mock data is used if the API is unavailable
   - This allows you to develop the UI even if the backend is not accessible

## Extending the System

1. **Adding New Notification Types**:
   - Add the type to the `NotificationType` enum in the backend
   - Update the notification display component to handle the new type

2. **Adding Custom Notification Actions**:
   - Extend the `handleMarkAsRead` function in `NotificationContext.jsx`
   - Add action buttons to the notification display component

## Deployment Considerations

1. **Environment Variables**:
   - Ensure all required environment variables are set in production
   - Verify CORS settings for production domains

2. **SSL/TLS Requirements**:
   - WebSockets require secure connections in most browsers
   - Ensure your production environment uses HTTPS
