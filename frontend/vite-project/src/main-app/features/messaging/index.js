// Export components
export { default as ChatArea } from './components/ChatArea';
export { default as MessageInput } from './components/MessageInput';
export { default as MessageStatus } from './components/MessageStatus';
export { default as Sidebar } from './components/Sidebar';
export { default as Toast } from './components/toast/Toast';
export { default as ToastContainer } from './components/toast/ToastContainer';

// Export pages
export { default as MessagesPage } from './pages/Messages';

// Export context providers
export { MessageProvider, useMessageContext } from './context/MessageContext';
export { NotificationProvider, useNotificationContext } from './context/NotificationContext';

// Export services and utils
export * from './utils/ChatService';
export * from './utils/mockData';
