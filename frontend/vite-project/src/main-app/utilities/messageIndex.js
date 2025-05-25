// Export components
export { default as ChatArea } from '../components/messages/ChatArea.jsx';
export { default as MessageInput } from '../components/messages/MessageInput.jsx';
export { default as MessageStatus } from '../components/messages/MessageStatus.jsx';
export { default as Sidebar } from '../components/messages/Sidebar.jsx';
export { default as Toast } from '../components/toast/Toast.jsx';
export { default as ToastContainer } from '../components/toast/ToastContainer.jsx';

// Export pages
export { default as MessagesPage } from '../pages/Messages.jsx';

// Export context providers
export { MessageProvider, useMessageContext } from '../context/MessageContext.jsx';
export { NotificationProvider, useNotificationContext } from '../context/NotificationsContext.jsx';

// Export services and utils
export * from '../utils/ChatService.jsx';
export * from '../utils/mockData.jsx';