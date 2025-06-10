# Notification Context Migration Guide

## Context

The Care Pro application previously had two separate notification systems:

1. **NotificationContext.jsx** - Primary notification system for main application features (messages, payments, etc.)
2. **NotificationsContext.jsx** - Secondary system for browser notifications and UI toasts

This caused issues because some components were importing from `NotificationsContext.jsx` but only `NotificationContext.jsx` was properly set up in the component tree.

## Changes Made

1. **Consolidated Notification Contexts**: Combined the functionality of both contexts into `NotificationContext.jsx`.

2. **Added Backward Compatibility**: Maintained both hooks for accessing the context:
   ```jsx
   export const useNotifications = () => {...};
   export const useNotificationContext = () => {...};
   ```

3. **Added Browser Notification Support**: Integrated browser notification permission request and display from `NotificationsContext.jsx` into `NotificationContext.jsx`.

4. **Updated Context Value**: Added additional properties to the context value for full compatibility:
   ```jsx
   {
     notifications,
     unreadCount,
     loading,
     markAsRead,
     markAllAsRead,
     permissionGranted,
     requestPermission,
     addNotification,
     removeNotification
   }
   ```

5. **Updated Import Statements**: Changed imports in the Messages component to use the consolidated context.

## Using the Notification System

### For System Notifications (messages, payments, etc.)
```jsx
import { useNotifications } from '../context/NotificationContext';

const MyComponent = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  // ...
};
```

### For UI/Browser Notifications
```jsx
import { useNotificationContext } from '../context/NotificationContext';

const MyComponent = () => {
  const { 
    permissionGranted, 
    requestPermission, 
    addNotification, 
    removeNotification 
  } = useNotificationContext();
  // ...
};
```

## Next Steps

1. Verify that all components are now working correctly with the consolidated context.
2. Consider removing `NotificationsContext.jsx` once all components have been migrated.
3. Update documentation to reflect the new consolidated approach.
