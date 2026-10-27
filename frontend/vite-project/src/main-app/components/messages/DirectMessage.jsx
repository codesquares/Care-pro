import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessageContext } from '../../context/MessageContext';
import ChatArea from './Chatarea';
import api from '../../services/api';
import './messages.css';
import './direct-message.css';

// Conversations are reached from an assignment (or from the inbox). The other person's name and
// role come from the server's assignment-based access record — never from the removed CareGivers
// endpoints or from a gig.
const DirectMessage = () => {
  const { recipientId } = useParams();
  const navigate = useNavigate();

  const [access, setAccess] = useState(null); // { state, canSend, assignmentId, reason, counterpart }
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const recipientName = access?.counterpart?.name || 'User';
  const recipientRole = access?.counterpart?.role || null;
  const recipientUserId = access?.counterpart ? recipientId : null;

  const loadAccess = async (id) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get(`/Chat/access/${id}`);
      setAccess(response.data);
    } catch (error) {
      console.error('Error loading conversation access:', error);
      setApiError('Failed to load this conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recipientId) {
      loadAccess(recipientId);
    } else {
      setApiError('Unable to establish chat recipient. Please open the conversation from your assignment or messages.');
      setLoading(false);
    }
  }, [recipientId]);

  const {
    messages,
    selectedChatId,
    recipient,
    isLoading,
    error,
    connectionState,
    currentUserId,
    selectChat,
    handleSendMessage,
    initializeChat,
  } = useMessageContext();

  // Get current user ID from localStorage
  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userId = user?.id;
  const token = localStorage.getItem('authToken') || "mock-token";
  
  // Track whether we've already kicked off initialization to prevent loops.
  // initializeChat's identity changes on every render (its useCallback deps include
  // fetchConversations which changes whenever conversations state updates), so we must
  // NOT include it in the dependency array.
  const initStartedRef = useRef(false);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!userId || !token) return;

    // Only attempt initialization once per mount
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    console.log('[DirectMessage] Initializing chat connection...', { userId });

    const init = async () => {
      try {
        cleanupRef.current = await initializeChat(userId, token);
      } catch (err) {
        console.error('[DirectMessage] Failed to initialize chat:', err);
      }
    };
    init();

    return () => {
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);
  
  // Select the chat once connection is ready
  useEffect(() => {
    // Wait until the SignalR connection is established before selecting a chat
    if (connectionState !== 'Connected') {
      console.log('[DirectMessage] Waiting for connection before selecting chat...', { connectionState });
      return;
    }
    if (!currentUserId) {
      console.log('[DirectMessage] Waiting for currentUserId to be set before selecting chat...');
      return;
    }
    if (recipientId && recipientId !== selectedChatId && !isLoading) {
      console.log(`[DirectMessage] Connection ready, selecting chat with recipient: ${recipientId}`);
      // Add a small delay to allow conversations to start loading
      const timer = setTimeout(() => {
        selectChat(recipientId);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [recipientId, selectedChatId, selectChat, isLoading, connectionState, currentUserId]);

  // Handle sending a new message
  const handleSendNewMessage = (receiverId, messageText) => {
    // Check parameter types to catch parameter order issues
    if (typeof messageText !== 'string') {
      console.error('handleSendNewMessage: messageText is not a string:', {
        messageText,
        typeOfMessageText: typeof messageText,
        receiverId
      });
      
      // If parameters are swapped, fix them
      if (typeof receiverId === 'string' && receiverId.length > 0 && 
          (typeof messageText === 'object' || messageText === undefined)) {
        console.warn('Parameters appear to be swapped, attempting to correct...');
        // Try to recover by treating receiverId as messageText
        messageText = receiverId;
        receiverId = null; // Will be handled by effectiveReceiverId below
      } else {
        // Can't recover
        alert('Invalid message format. Please try again.');
        return;
      }
    }
    
    // Use recipientUserId from state - this is the confirmed ID of the person we're messaging
    // Fall back to receiverId from params if needed
    const effectiveReceiverId = recipientUserId || receiverId || recipientId;

    // Log this to help with debugging
    console.log('Sending message in handleSendMessage with:', {
      senderId: userId,
      receiverId: effectiveReceiverId,
      originalReceiverId: receiverId,
      recipientUserId: recipientUserId, 
      recipientId: recipientId,
      recipientRole: recipientRole,
      messageLength: messageText?.length || 0,
      messagePreview: messageText ? (messageText.length > 20 ? `${messageText.substring(0, 20)}...` : messageText) : null
    });
    
    // Detailed validation to help identify the exact issue
    if (!userId) {
      console.error('Missing userId in handleSendNewMessage. User may not be logged in correctly.');
      
      // Try to retrieve from localStorage as a fallback
      try {
        const user = JSON.parse(localStorage.getItem("userDetails"));
        const retrievedUserId = user?.id;
        
        if (retrievedUserId) {
          console.log('Retrieved userId from localStorage as fallback:', retrievedUserId);
          handleSendMessage(retrievedUserId, effectiveReceiverId, messageText);
        } else {
          console.error('Failed to get userId from localStorage');
          alert('Error: You appear to be logged out. Please refresh the page or log in again.');
        }
      } catch (e) {
        console.error('Error retrieving user details:', e);
        alert('Error: Unable to send message. Please try refreshing the page.');
      }
    } else if (!effectiveReceiverId) {
      console.error('Missing receiverId in handleSendNewMessage. Available sources:', {
        recipientUserId,
        receiverId,
        recipientId,
      });
      
      alert('Error: Unable to determine message recipient. Please reopen this conversation from your assignment or messages.');
    } else if (!messageText || !messageText.trim()) {
      console.error('Empty message text in handleSendNewMessage');
      // No need for alert here as UI typically prevents this
    } else {
      // All required fields present
      handleSendMessage(userId, effectiveReceiverId, messageText)
        .then(messageId => {
          console.log('Message sent successfully, messageId:', messageId);
          
          // Explicitly fetch conversations to update the UI
          setTimeout(() => {
            console.log('DirectMessage: Explicitly refreshing conversations list');
            // Trigger custom event that MessageContext can listen for
            const refreshEvent = new CustomEvent('refresh-conversations', {
              detail: { 
                userId, 
                senderId: effectiveReceiverId
              }
            });
            window.dispatchEvent(refreshEvent);
          }, 1500);
        })
        .catch(err => {
          console.error('Error sending message:', err);
        });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="error-container">
        <p>{apiError}</p>
        <button onClick={() => loadAccess(recipientId)}>Retry</button>
      </div>
    );
  }

  // No assignment and no history: there is no conversation to show, and no identity is disclosed.
  if (!access || access.state === 'None' || !access.counterpart) {
    return (
      <div className="error-container">
        <p>{access?.reason || 'You can only message a client or caregiver you are assigned to.'}</p>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  if (error && !error.includes('sample data') && !error.includes('offline')) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={() => {
          // Use a delayed retry to avoid race conditions
          setTimeout(() => selectChat(recipientId), 500);
        }}>Try Again</button>
      </div>
    );
  }

  // Use the selected conversation if the message context has it, otherwise build one from the access record.
  // The server's access state always wins: it decides whether this conversation is sendable.
  const recipientObj = {
    ...(recipient || {}),
    id: recipientUserId || recipientId,
    name: recipientName,
    role: recipientRole,
    isOnline: recipient?.isOnline || false,
    lastActive: recipient?.lastActive || null,
    avatar: recipient?.avatar || "/avatar.jpg",
    accessState: access.state,
    canSend: access.canSend,
  };

  const validMessageObject = {
    senderId: userId,
    receiverId: recipientObj.id,
    recipientName: recipientName,
    recipientRole: recipientRole,
    messageText: '',
    timestamp: new Date().toISOString(),
    avatar: recipientObj.avatar,
    isOnline: recipientObj.isOnline,
    lastActive: recipientObj.lastActive || new Date().toISOString(),
    isRead: false,
    accessState: access.state,
    canSend: access.canSend,
  };

  return (
    <div className="messages">
      <div className="direct-message-container">
        <div className="messages-header">
          <div className="messages-header__left">
            <h2>Conversation with {recipientName}</h2>
            {recipientRole && (
              <span className={`recipient-role-badge ${recipientRole.toLowerCase()}`}>
                {recipientRole}
              </span>
            )}
            {error && (
              <div className="connection-status">
                <span className="status-indicator offline"></span>
                <span className="status-text">Offline Mode</span>
              </div>
            )}
          </div>

        </div>
        <div className="direct-chat-area">
          <ChatArea
            messages={messages || []}
            recipient={validMessageObject}
            userId={userId}
            onSendMessage={handleSendNewMessage}
            isOfflineMode={!!error}
          />
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
