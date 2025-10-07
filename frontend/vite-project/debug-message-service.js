// Debug utility to check message service status
// This can be run in the browser console to diagnose issues

window.debugMessageService = {
  // Check SignalR connection status
  checkConnection: () => {
    console.log('=== MESSAGE SERVICE DEBUG ===');
    
    // Get the chat service instance
    const chatService = window.chatService || 
      (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current?.memoizedProps?.chatService);
    
    if (!chatService) {
      console.error('❌ Chat service not found');
      return;
    }
    
    console.log('✅ Chat service found');
    console.log('Connection state:', chatService.getConnectionState?.() || 'Unknown');
    console.log('Connection ID:', chatService.connectionId || 'None');
    console.log('User ID:', chatService._userId || 'None');
    
    // Check if connection is ready
    if (chatService.isConnectionReady) {
      console.log('Connection ready:', chatService.isConnectionReady());
    }
    
    // Check localStorage for auth token
    const token = localStorage.getItem('authToken');
    console.log('Auth token present:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }
    
    // Check user details
    const userDetails = localStorage.getItem('userDetails');
    if (userDetails) {
      try {
        const user = JSON.parse(userDetails);
        console.log('Current user ID:', user.id);
        console.log('Current user name:', user.fullName || user.firstName + ' ' + user.lastName);
      } catch (e) {
        console.error('Error parsing user details:', e);
      }
    }
  },
  
  // Test sending a message
  testMessage: async (receiverId, message = 'Test message from debug') => {
    console.log('=== TESTING MESSAGE SEND ===');
    
    const userDetails = localStorage.getItem('userDetails');
    if (!userDetails) {
      console.error('❌ No user details found');
      return;
    }
    
    try {
      const user = JSON.parse(userDetails);
      const senderId = user.id;
      
      console.log('Attempting to send test message:', {
        senderId,
        receiverId,
        message
      });
      
      // Try to get the chat service from window or import
      let chatService;
      try {
        chatService = (await import('./src/main-app/services/signalRChatService.js')).default;
      } catch (e) {
        console.error('Could not import chat service:', e);
        return;
      }
      
      const result = await chatService.sendMessage(senderId, receiverId, message);
      console.log('✅ Test message sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Test message failed:', error);
      return null;
    }
  },
  
  // Check current messages in context
  checkMessages: () => {
    console.log('=== CHECKING CURRENT MESSAGES ===');
    
    // Try to access React context via DOM
    const messageElements = document.querySelectorAll('[class*="message"]');
    console.log('Message elements found:', messageElements.length);
    
    // Log current URL and selected chat
    console.log('Current URL:', window.location.pathname);
    console.log('URL search params:', window.location.search);
  }
};

console.log('🔧 Debug utilities loaded. Available commands:');
console.log('  window.debugMessageService.checkConnection() - Check SignalR connection status');
console.log('  window.debugMessageService.testMessage(receiverId, message) - Test sending a message');
console.log('  window.debugMessageService.checkMessages() - Check current message state');