import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import './chatarea.css';
import MessageInput from './MessageInput';
import MessageStatus from './MessageStatus';
import ServiceSelectionModal from './ServiceSelectionModal';
import { useMessageContext } from '../../context/MessageContext';
import { createNotification } from '../../services/notificationService';
import ClientGigService from '../../services/clientGigService';

const ChatArea = ({ messages, recipient, userId, onSendMessage, isOfflineMode = false }) => {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { handleDeleteMessage } = useMessageContext();
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading to prevent flash
  const [hasInitialized, setHasInitialized] = useState(false); // Track if component has initialized
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(true); // Control spinner visibility separately
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const chatAreaRef = useRef(null);

  // Check if user is a client and extract serviceId
  const isClientRoute = location.pathname.includes('/client/');
  const serviceId = location.state?.serviceId;

  // State for caregiver gigs and modal
  const [caregiverGigs, setCaregiverGigs] = useState([]);
  const [isLoadingGigs, setIsLoadingGigs] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [gigCache, setGigCache] = useState(new Map()); // Cache gigs by caregiver ID
  
  // Memoized function to get initials from name
  const getInitials = useCallback((name) => {
    if (!name || typeof name !== "string") return "?";
    
    const names = name.trim().split(" ").filter(Boolean);
    if (names.length === 0) return "?";
    
    const initials = names.map((n) => n[0].toUpperCase()).join("");
    
    return initials.slice(0, 2);
  }, []);
  
  // Memoized safe recipient to prevent unnecessary re-renders
  const safeRecipient = useMemo(() => {
    if (!recipient) return null;
    
    return {
      avatar: recipient.avatar || '/avatar.jpg',
      name: recipient.recipientName || recipient.name || recipient.FullName || recipient.fullName || 'Care Provider',
      isOnline: recipient.isOnline || false,
      lastActive: recipient.lastActive || null,
      id: recipient.receiverId || recipient.id || recipient.userId || null
    };
  }, [recipient]);
  
  console.log("🎯 ChatArea: Component rendered with props:", {
    messagesCount: messages?.length || 0,
    recipientId: recipient?.id,
    userId,
    isOfflineMode
  });
  console.log("🎯 ChatArea: Messages array:", messages);
  console.log("🎯 ChatArea: Recipient object:", recipient);

  // Memoized scroll to bottom function
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current) {
      const chatContainer = chatAreaRef.current;
      const shouldAutoScroll = force || 
        !chatContainer || 
        (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 50);
      
      if (shouldAutoScroll) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: force ? 'instant' : 'smooth',
          block: 'end'
        });
      }
    }
  }, []);

  // Memoized message processing to prevent unnecessary re-renders
  const visibleMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) {
      console.log('🎯 ChatArea: No messages or invalid messages array');
      return [];
    }
    
    console.log('🎯 ChatArea: Processing', messages.length, 'messages for display');
    console.log('🎯 ChatArea: Latest message:', messages[messages.length - 1]);
    
    return messages.map((msg, index) => {
      // Ensure each message has an id
      const msgWithId = {
        ...msg,
        id: msg.id || `generated-id-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      let statusText = '';
      
      if (msgWithId.senderId === userId) {
        // Only show status for messages sent by current user
        if (msgWithId.status === 'read') {
          statusText = msgWithId.readAt 
            ? `Read ${new Date(msgWithId.readAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
            : 'Read';
        } else if (msgWithId.status === 'delivered') {
          statusText = 'Delivered';
        } else if (msgWithId.status === 'sent') {
          statusText = 'Sent';
        } else if (msgWithId.status === 'sending') {
          statusText = 'Sending...';
        } else if (msgWithId.status === 'failed') {
          statusText = 'Failed to send';
        } else if (msgWithId.status === 'pending') {
          statusText = 'Waiting to send (offline)';
        }
      }
      
      return {
        ...msgWithId,
        statusText
      };
    });
  }, [messages, userId]);

  // Scroll to bottom when messages change (with detection for new messages)
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      const newMessageCount = messages.length;
      console.log('🎯 ChatArea: useEffect triggered - message count:', newMessageCount, 'previous:', lastMessageCount);
      
      if (newMessageCount > lastMessageCount) {
        // New messages arrived
        console.log(`🎯 ChatArea: New messages detected: ${newMessageCount - lastMessageCount}`);
        console.log('🎯 ChatArea: Latest message:', messages[messages.length - 1]);
        setTimeout(() => scrollToBottom(false), 100); // Small delay to ensure DOM update
      }
      setLastMessageCount(newMessageCount);
    }
  }, [messages, lastMessageCount, scrollToBottom]);

  // Scroll to bottom when recipient changes (new chat selected)
  useEffect(() => {
    if (recipient) {
      setTimeout(() => scrollToBottom(true), 200); // Force scroll for new chat
    }
  }, [recipient?.id, scrollToBottom]);
  
  // Update loading state based on messages with delay to prevent flash
  useEffect(() => {
    if (!hasInitialized) {
      // On first mount, add a small delay to prevent flash
      const initTimer = setTimeout(() => {
        setHasInitialized(true);
        const shouldLoad = messages === undefined;
        setIsLoading(shouldLoad);
        
        // Hide spinner with a slight delay for smooth transition
        if (!shouldLoad) {
          setTimeout(() => setShowLoadingSpinner(false), 150);
        } else {
          setShowLoadingSpinner(true);
        }
      }, 100); // Small delay to prevent flash
      
      return () => clearTimeout(initTimer);
    } else {
      // After initialization, update loading state with smooth transition
      const shouldLoad = messages === undefined;
      setIsLoading(shouldLoad);
      
      if (!shouldLoad) {
        // Fade out loading spinner before hiding
        setTimeout(() => setShowLoadingSpinner(false), 100);
      } else {
        setShowLoadingSpinner(true);
      }
    }
  }, [messages, hasInitialized]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDeleteMenu && !e.target.closest('.message-actions-menu')) {
        setShowDeleteMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDeleteMenu]);

  // Fetch caregiver gigs when recipient changes (for Hire Me button)
  // Only fetch if no serviceId (avoid unnecessary API calls when coming from HomeCareService)
  useEffect(() => {
    if (isClientRoute && recipient?.id && !serviceId) {
      console.log('Fetching gigs for discovery mode - no direct serviceId available');
      fetchCaregiverGigs(recipient.id);
    } else if (isClientRoute && recipient?.id && serviceId) {
      console.log('Direct mode from HomeCareService - skipping gig fetch, using serviceId:', serviceId);
      // Clear any previous gig data since we're in direct mode
      setCaregiverGigs([]);
      setIsLoadingGigs(false);
    }
  }, [recipient?.id, isClientRoute, serviceId]);

  // Handle sending animation - simplified to work with existing message flow
  const handleSendMessageWithAnimation = () => {
    if (message.trim()) {
      // Just send the message through the existing handler
      // The parent component will handle adding it to the messages array
      handleSendMessage();
    }
  };

  // Fetch caregiver gigs for the Hire Me button
  const fetchCaregiverGigs = async (caregiverId) => {
    // Check cache first
    if (gigCache.has(caregiverId)) {
      const cachedData = gigCache.get(caregiverId);
      const cacheAge = Date.now() - cachedData.timestamp;
      
      // Use cached data if less than 5 minutes old
      if (cacheAge < 5 * 60 * 1000) {
        setCaregiverGigs(cachedData.gigs);
        return cachedData.gigs;
      }
    }

    setIsLoadingGigs(true);
    try {
      // Get all gigs and filter for this caregiver
      const allGigs = await ClientGigService.getAllGigs();
      const caregiverPublishedGigs = allGigs.filter(
        gig => gig.caregiverId === caregiverId && gig.status === 'Published'
      );

      // Cache the results
      setGigCache(prev => new Map(prev.set(caregiverId, {
        gigs: caregiverPublishedGigs,
        timestamp: Date.now()
      })));

      setCaregiverGigs(caregiverPublishedGigs);
      console.log(`Found ${caregiverPublishedGigs.length} published gigs for caregiver ${caregiverId}`);
      
      return caregiverPublishedGigs;
    } catch (error) {
      console.error('Error fetching caregiver gigs:', error);
      setCaregiverGigs([]);
      return [];
    } finally {
      setIsLoadingGigs(false);
    }
  };

  // Handle Hire Me button click with priority logic
  const handleHireMeClick = () => {
    // Priority 1: Use serviceId from navigation state (direct from HomeCareService)
    if (serviceId) {
      console.log('Direct navigation: Using serviceId from HomeCareService:', serviceId);
      
      // Navigate to the specific service page
      // Note: If service becomes unavailable, the service page will handle the error
      window.location.href = `/app/client/service/${serviceId}`;
      return;
    }

    // Priority 2: Use fetched gigs (general messaging context)
    if (isLoadingGigs) {
      console.log('Still loading caregiver gigs...');
      return; // Don't do anything if still loading
    }

    if (caregiverGigs.length === 0) {
      console.log('No published gigs available for this caregiver');
      // Could show a toast message here: "This caregiver has no available services"
      return;
    }

    if (caregiverGigs.length === 1) {
      // Direct navigation if only one service
      const service = caregiverGigs[0];
      console.log('Single service navigation:', service.title);
      window.location.href = `/app/client/service/${service.id}`;
    } else {
      // Open modal for multiple services
      console.log(`Multiple services available: ${caregiverGigs.length} options`);
      setShowServiceModal(true);
    }
  };

  // Handle service selection from modal
  const handleSelectService = (service) => {
    window.location.href = `/app/client/service/${service.id}`;
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      // Use the component-level safeRecipient variable
      // Extract recipient ID with fallbacks
      let effectiveRecipientId = safeRecipient?.id;
      
      // If no ID in safeRecipient, check original recipient
      if (!effectiveRecipientId && recipient) {
        console.log('No ID in safeRecipient, checking original recipient object');
        
        // Check all possible ID fields in the original recipient object
        const possibleIdFields = ['id', 'caregiverId', 'userId', '_id', 'recipientId'];
        
        for (const field of possibleIdFields) {
          if (recipient[field]) {
            effectiveRecipientId = recipient[field];
            console.log(`Found ID in original recipient.${field}:`, effectiveRecipientId);
            break;
          }
        }
      }
      
      // Check URL if no ID found yet
      if (!effectiveRecipientId) {
        console.log('No ID found in recipient objects, checking URL');
        const pathSegments = window.location.pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        // Simple validation that it looks like an ID format
        if (lastSegment && lastSegment.length > 8) {
          effectiveRecipientId = lastSegment;
          console.log('Using ID from URL path:', effectiveRecipientId);
        }
      }
      
      // Final decision
      if (!effectiveRecipientId) {
        console.error('Failed to find any valid recipient ID for messaging');
        alert('Unable to send message: Missing recipient information. Please refresh the page or try accessing this conversation again from your messages list.');
        return;
      }
      
      // Log the final decision for debugging
      console.log('Sending message to recipient:', {
        recipientId: effectiveRecipientId,
        recipientName: safeRecipient?.name || 'Unknown',
        originalRecipientId: safeRecipient?.id,
        fromUrlParams: effectiveRecipientId !== safeRecipient?.id,
        senderId: userId
      });

      // Store message text before clearing
      const messageText = message.trim();
      
      // Clear message input immediately for better UX
      setMessage('');
      
      // Send message with our best determined ID - ensure both userId and recipientId are passed correctly
      if (messageText && typeof messageText === 'string' && 
          effectiveRecipientId && typeof effectiveRecipientId === 'string') {
        console.log("Sending message from ChatArea:", { 
          userId, 
          recipientId: effectiveRecipientId, 
          messagePreview: messageText.length > 20 ? messageText.substring(0, 20) + '...' : messageText 
        });
        
        try {
          // Based on the error stack trace, onSendMessage should receive recipientId and message
          // onSendMessage is a prop passed from parent that should handle the userId internally
          const messageId = await onSendMessage(effectiveRecipientId, messageText);
          
          // Create a notification for the sent message only if message was sent successfully
          if (messageId) {
            try {
              const notificationData = {
                recipientId: effectiveRecipientId,
                senderId: userId,
                type: "NewMessage"
              };
              
              // Only add relatedEntityId if messageId is a valid string (not a temp ID)
              if (messageId && typeof messageId === 'string' && !messageId.startsWith('temp-')) {
                notificationData.relatedEntityId = messageId;
              }
              
              await createNotification(notificationData);
              console.log("Notification created successfully");
            } catch (notificationError) {
              console.warn("Failed to create notification, but message was sent successfully:", notificationError);
              // Don't throw here since the message was already sent successfully
            }
          }
        } catch (sendError) {
          console.error("Failed to send message:", sendError);
          // Restore message in input if sending failed
          setMessage(messageText);
          alert('Failed to send message. Please try again.');
        }
        
      } else {
        console.error("Invalid parameters for sending message:", { 
          userId, 
          recipientId: effectiveRecipientId, 
          messageType: typeof messageText,
          message: messageText ? (messageText.length > 20 ? messageText.substring(0, 20) + '...' : messageText) : null
        });
        // Restore message in input if parameters were invalid
        setMessage(messageText);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageWithAnimation();
    }
  };
  
  const handleMessageActions = (e, messageId) => {
    e.stopPropagation();
    setShowDeleteMenu(prev => prev === messageId ? null : messageId);
  };
  
  const deleteMessage = async (messageId) => {
    await handleDeleteMessage(messageId);
    setShowDeleteMenu(null);
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};

    // If messages is undefined or not an array, return empty object
    if (!messages || !Array.isArray(messages)) {
      console.warn("ChatArea: Messages is not an array:", messages);
      return groups;
    }
    
    console.log("GroupMessagesByDate received messages:", messages.length);

    // Debug all message objects
    console.log("Message objects:", JSON.stringify(messages.map(m => ({
      id: m.id, 
      timestamp: m.timestamp,
      senderId: m.senderId
    })), null, 2));

    messages.forEach((msg, index) => {
      // Make sure each message has all required properties
      const safeMsg = { 
        ...msg,
        id: msg.id || `fallback-id-${index}-${Date.now()}`,
        senderId: msg.senderId || 'unknown-sender',
        timestamp: msg.timestamp || new Date().toISOString()
      };
      
      try {
        let dateKey;
        if (!safeMsg.timestamp) {
          const now = new Date();
          dateKey = now.toDateString();
          safeMsg.timestamp = now.toISOString();
        } else {
          const date = new Date(safeMsg.timestamp);
          if (isNaN(date.getTime())) {
            console.warn('Invalid timestamp for message:', safeMsg);
            const now = new Date();
            dateKey = now.toDateString();
            safeMsg.timestamp = now.toISOString();
          } else {
            dateKey = date.toDateString();
          }
        }
        
        // Initialize group array if needed
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        
        groups[dateKey].push(safeMsg);
      } catch (error) {
        console.error('Error processing message in groupMessagesByDate:', error, safeMsg);
        // Add to "Unknown" group as fallback
        const fallbackKey = "Unknown Date";
        if (!groups[fallbackKey]) groups[fallbackKey] = [];
        groups[fallbackKey].push(safeMsg);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(visibleMessages);
  const isNewConversation = !visibleMessages || visibleMessages.length === 0;

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Add safety check for recipient object
  if (!recipient || typeof recipient !== 'object' || !safeRecipient) {
    return (
      <div className="chat-area">
        <div className="error-state">
          <h3>Unable to load conversation</h3>
          <p>Recipient information is missing or invalid. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      </div>
    );
  }

  // Add this function before the return statement
  const detectMessageType = (text) => {
    if (!text) return '';
    
    // Emoji detection - this is a simplified approach
    // Using a common emoji regex pattern
    const emojiRegex = /^([\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]|\p{Emoji}){1,3}$/u;
    
    try {
      // If message is only emojis and 1-3 characters, treat as emoji-only
      if (text.match(emojiRegex)) return 'emoji-only';
    } catch (e) {
      console.warn("Error checking emoji regex:", e);
    }
    
    // Short messages (less than 5 characters) might be emphasis or contain emojis
    if (text.length <= 5) return 'short-message';
    
    return '';
  };

  // Add this function before the return statement
  const formatLastActive = (lastActiveDate) => {
    try {
      if (!lastActiveDate) return 'Last seen unavailable';
      
      const lastActive = new Date(lastActiveDate);
      if (isNaN(lastActive.getTime())) return 'Last seen unavailable';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now - lastActive) / 1000);
      
      // If active within the last minute
      if (diffInSeconds < 60) {
        return 'Active just now';
      }
      
      // If active within the last hour
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Active ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      }
      
      // If active today
      if (lastActive.toDateString() === now.toDateString()) {
        return `Active today at ${lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // If active yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive.toDateString() === yesterday.toDateString()) {
        return `Active yesterday at ${lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // If active within the last week
      if (now - lastActive < 7 * 24 * 60 * 60 * 1000) {
        const options = { weekday: 'long' };
        return `Active on ${lastActive.toLocaleDateString(undefined, options)} at ${lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Otherwise show the date
      return `Active on ${lastActive.toLocaleDateString()} at ${lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (error) {
      console.error('Error formatting last active time:', error);
      return 'Last seen status unavailable';
    }
  };

  return (
    <div className="chat-area">
      <header className="chat-header">
        <div className="recipient-info">
          <div className="avatar-container">
            <div className="avatar avatar-receiver">
              {getInitials(safeRecipient.name)}
            </div>
            {safeRecipient.isOnline && <span className="avatar-online-indicator"></span>}
          </div>
          <div className="recipient-details">
            <h3>{safeRecipient.name}</h3>
            <div className="status-indicator recipient-status">
              {safeRecipient.isOnline ? (
                <span className="status online">Online</span>
              ) : (
                <span 
                  className="status offline"
                  title={safeRecipient.lastActive ? 
                    new Date(safeRecipient.lastActive).toLocaleString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Last seen unavailable'
                  }
                >
                  {formatLastActive(safeRecipient.lastActive)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="chat-actions">
          {/* Show Hire Me button for clients with priority logic */}
          {isClientRoute && (
            // Priority 1: Show if serviceId from navigation (direct from HomeCareService)
            serviceId || 
            // Priority 2: Show if caregiver has gigs or still loading (discovery mode)
            caregiverGigs.length > 0 || 
            isLoadingGigs
          ) && (
            <button 
              className={`action-button hire-me-btn ${isLoadingGigs && !serviceId ? 'loading' : ''}`}
              title={
                serviceId 
                  ? 'Hire Me - Return to Service'
                  : isLoadingGigs 
                    ? 'Loading services...' 
                    : `Hire Me${caregiverGigs.length > 1 ? ` (${caregiverGigs.length} services)` : ''}`
              }
              onClick={handleHireMeClick}
              disabled={isLoadingGigs && !serviceId}
            >
              {isLoadingGigs && !serviceId ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="loading-spinner">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="m22 2-5 10-4-4Z"/>
                </svg>
              )}
              <span className="button-text">
                {isLoadingGigs && !serviceId ? 'Loading...' : 'Hire Me'}
                {!isLoadingGigs && !serviceId && caregiverGigs.length > 1 && (
                  <span className="service-count">({caregiverGigs.length})</span>
                )}
              </span>
            </button>
          )}
          {/* <button className="action-button" title="Accept Offer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button> */}
          <button className="action-button" title="More options">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </header>

      <div 
        className="messages-container" 
        ref={chatAreaRef}
        tabIndex="0"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {isOfflineMode && (
          <div className="offline-mode-banner">
            <i className="offline-icon">⚠️</i>
            <span>You're in offline mode. Messages will sync when connection is restored.</span>
          </div>
        )}
        
        {showLoadingSpinner && isLoading && (
          <div className={`messages-loading-state ${!showLoadingSpinner ? 'fade-out' : ''}`}>
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        )}

        <div className={`messages-area ${!isLoading && hasInitialized ? 'fade-in' : ''}`}>
          {isNewConversation ? (
            <div className="new-conversation-message">
              <div className="welcome-message">
                <div className="welcome-avatar avatar-receiver">
                  {getInitials(safeRecipient.name)}
                </div>
                <h3>Start a conversation with {safeRecipient.name}</h3>
                <p>Send a message to begin chatting</p>
                {isOfflineMode && (
                  <div className="offline-note">
                    <small>Note: You're currently offline. Your messages will be delivered when you're back online.</small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            Object.keys(messageGroups).map((dateKey) => {
              // Ensure the dateKey is a proper string for use as a React key
              const groupKey = typeof dateKey === 'object' ? `group-${JSON.stringify(dateKey)}` : `group-${String(dateKey)}`;
              
              return (
              <div key={groupKey} className="message-group">
                <div className="message-date">
                  <span>{formatMessageDate(dateKey)}</span>
                </div>
                {messageGroups[dateKey].map((msg, index) => {
                  // Debug the msg object to see what's causing issues
                  console.log('Message object for key generation:', msg);
                  
                  // Convert all components to strings safely
                  const idStr = msg.id ? String(msg.id) : 'no-id';
                  const senderIdStr = msg.senderId ? String(msg.senderId) : 'no-sender';
                  const timestampStr = msg.timestamp 
                    ? (typeof msg.timestamp === 'string' ? msg.timestamp.substring(0, 19) : String(msg.timestamp))
                    : 'no-timestamp';
                  
                  // Ensure dateKey is a string
                  const dateKeyStr = typeof dateKey === 'object' ? JSON.stringify(dateKey) : String(dateKey);
                  
                  // Create a guaranteed unique key with string values
                  const messageKey = `msg-${idStr}-${index}-${senderIdStr}`;
                  
                  console.log("Generated message key:", messageKey);
                  
                  return (
                  <div key={messageKey} className={`message ${msg.senderId === userId ? 'sent' : 'received'} ${msg.isDeleted ? 'deleted' : ''} ${msg.isNewlySent ? 'isNewlySent' : ''}`}>
                    <div className="message-bubble">
                      {msg.isDeleted ? (
                        <p className="deleted-message-text">This message was deleted</p>
                      ) : (
                        <p className={`message-text ${detectMessageType(msg.text || msg.content)}`}>
                          {msg.text || msg.content}
                        </p>
                      )}
                      <div className="message-meta">
                        <span className="message-time">
                          {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.senderId === userId && !msg.isDeleted && (
                          <div className="message-status-container">
                            <MessageStatus status={isOfflineMode && msg.status === 'sending' ? 'pending' : (msg.status || 'sent')} />
                            {msg.statusText && <span className="status-text" title={msg.statusText}>{msg.statusText}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Only show actions for your own messages that are not deleted */}
                    {msg.senderId === userId && !msg.isDeleted && (
                      <div className="message-actions">
                        <button className="action-button" onClick={(e) => handleMessageActions(e, msg.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots" viewBox="0 0 16 16">
                            <path d="M3 9.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm4.5 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm4.5 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"/>
                          </svg>
                        </button>
                        {showDeleteMenu === msg.id && (
                          <div className="message-actions-menu">
                            <button className="delete-message-button" onClick={() => deleteMessage(msg.id)}>
                              Delete Message
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator - show when recipient is typing */}
        {isRecipientTyping && (
          <div className="message received typing-indicator">
            <div className="message-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <MessageInput
          message={message}
          setMessage={setMessage}
          onSendMessage={handleSendMessageWithAnimation}
          onKeyPress={handleKeyPress}
          placeholder={isOfflineMode ? 'Compose message (offline mode)' : 'Type your message...'}
        />
      </div>

      {/* Service Selection Modal - only show in discovery mode (no direct serviceId) */}
      {!serviceId && (
        <ServiceSelectionModal
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          services={caregiverGigs}
          caregiverName={recipient?.name || 'Caregiver'}
          onSelectService={handleSelectService}
          isLoading={isLoadingGigs}
        />
      )}
    </div>
  );
};

export default ChatArea;
