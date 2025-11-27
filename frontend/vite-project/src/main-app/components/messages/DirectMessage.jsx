import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useMessageContext } from '../../context/MessageContext';
import ChatArea from './Chatarea';
import axios from 'axios';
import './messages.scss';
import './direct-message.scss';
import config from '../../config'; // Import centralized config for API URLs

// FIXED: Use centralized config instead of hardcoded Azure staging API URL
const API_BASE_URL = config.BASE_URL.replace(/\/api$/, ''); // Remove /api suffix for consistency (only trailing)

const DirectMessage = () => {
  const { recipientId } = useParams();
  const location = useLocation();
  const [recipientName, setRecipientName] = useState(location.state?.recipientName || "User");
  
  // Extract caregiverId from location state if this is a gig-related message
  // This is crucial for service messaging functionality
  const [caregiverId, setCaregiverId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Extract this on component mount to ensure we have it throughout the component's lifecycle
  useEffect(() => {
    console.log('DirectMessage component mounted/updated with:', {
      recipientId,
      locationState: location.state,
      currentName: recipientName
    });
    
    // Method 1: Check for caregiverId in multiple possible locations in location state
    let extractedCaregiverId = 
      location.state?.caregiverId || 
      location.state?.caregiver?.id || 
      location.state?.gig?.caregiverId;
    
    // Method 2: If there's a recipientId from URL params, use that as fallback
    if (!extractedCaregiverId && recipientId) {
      console.log('No caregiverId in location state, using recipientId as fallback:', recipientId);
      extractedCaregiverId = recipientId;
    }
    
    // Method 3: Last resort - try to check for URL format that might contain a caregiver ID
    if (!extractedCaregiverId) {
      const pathSegments = window.location.pathname.split('/');
      const possibleId = pathSegments[pathSegments.length - 1];
      if (possibleId && possibleId.length > 8) {  // Simple validation that it looks like an ID
        console.log('Extracted possible ID from URL:', possibleId);
        extractedCaregiverId = possibleId;
      }
    }
    
    // If we have a caregiverId from any method, set it and check if we need name details
    if (extractedCaregiverId) {
      console.log('Using caregiverId:', extractedCaregiverId);
      setCaregiverId(extractedCaregiverId);
      
      // If we don't have a recipient name from location.state, fetch the details
      if (!location.state?.recipientName) {
        console.log('No recipient name available, fetching details');
        fetchCaregiverDetails(extractedCaregiverId);
      }
    } else {
      // Absolute last resort - something went wrong if we get here
      console.error('CRITICAL: Failed to determine recipientId or caregiverId from any source');
      setApiError('Unable to establish chat recipient. Please return to the previous page and try again.');
    }
  }, [location.state, recipientId]);
  
  // Function to fetch caregiver details using the API endpoint
  const fetchCaregiverDetails = async (id) => {
    if (!id) {
      console.error('fetchCaregiverDetails called with no ID');
      setApiError('Missing caregiver ID. Cannot load conversation details.');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Fetching caregiver details for ID: ${id}`);
      const response = await axios.get(`${API_BASE_URL}/api/CareGivers/${id}`);
      
      if (response.data) {
        console.log('Caregiver details fetched:', response.data);
        
        // Extract name from response with better error handling
        let name = 'Unknown Provider';
        if (response.data.firstName && response.data.lastName) {
          name = response.data.firstName + ' ' + response.data.lastName;
        } else if (response.data.firstName) {
          name = response.data.firstName;
        } else if (response.data.fullName) {
          name = response.data.fullName;
        } else if (response.data.name) {
          name = response.data.name;
        } else if (response.data.userName || response.data.username) {
          name = response.data.userName || response.data.username;
        }
        
        // Critical: Set the ID first BEFORE changing the loading state
        if (response.data.id || response.data.caregiverId) {
          const confirmedId = response.data.id || response.data.caregiverId;
          console.log(`Setting confirmed caregiverId: ${confirmedId}`);
          setCaregiverId(confirmedId);
        } else {
          // If no ID in response, ensure we're using the original ID
          console.log(`No ID in API response, using original ID: ${id}`);
          setCaregiverId(id);
        }
        
        // Then set the name (order matters for state updates)
        setRecipientName(name);
        
        // Add a small delay before marking as not loading to ensure state updates are processed
        setTimeout(() => {
          setLoading(false);
        }, 100);
      } else {
        console.warn('API returned empty data for caregiver ID:', id);
        setRecipientName('Care Provider');
        setCaregiverId(id); // Use the ID we were given as fallback
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching caregiver details:', error);
      setApiError(`Failed to load caregiver details: ${error.message || 'Unknown error'}`);
      // Set a fallback name so the UI doesn't break completely
      setRecipientName('Care Provider');
      setCaregiverId(id); // Use the ID we were given as fallback
      setLoading(false);
    }
  };
  
  console.log('DirectMessage component rendering with state:', {
    recipientId,
    caregiverId,
    recipientName,
    loading,
    
  })
  const {
    messages,
    selectedChatId,
    recipient,
    isLoading,
    error,
    selectChat,
    handleSendMessage,
    initializeChat,
  } = useMessageContext();

  // Get current user ID from localStorage
  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userId = user?.id;
  const token = localStorage.getItem('authToken') || "mock-token";
  
  // We no longer initialize chat here - that's handled in the parent Messages component only
  
  // Separate effect for selecting chat to avoid connection cycling
  useEffect(() => {
    if (recipientId && recipientId !== selectedChatId && !isLoading) {
      console.log(`[DirectMessage] Selecting chat with recipient: ${recipientId}`);
      // Add a small delay to avoid race conditions with other initializations
      const timer = setTimeout(() => {
        selectChat(recipientId);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [recipientId, selectedChatId, selectChat, isLoading]);

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
    
    // Use caregiverId from state if this is a gig-related message
    // Fall back to receiverId from params if needed
    // This ensures we use the correct receiver in all navigation scenarios
    const effectiveReceiverId = caregiverId || receiverId || recipientId;

    // Log this to help with debugging
    console.log('Sending message in handleSendMessage with:', {
      senderId: userId,
      receiverId: effectiveReceiverId,
      originalReceiverId: receiverId,
      caregiverId: caregiverId, 
      recipientId: recipientId,
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
        caregiverId,
        receiverId,
        recipientId,
        recipientObj: recipientObj?.id ? 'Has ID' : 'Missing ID'
      });
      
      // Try one last fallback - use recipient object ID directly if available
      if (recipientObj && recipientObj.id) {
        console.log('Using recipientObj.id as last resort fallback:', recipientObj.id);
        handleSendMessage(userId, recipientObj.id, messageText);
      } else {
        alert('Error: Unable to determine message recipient. Please try again or go back to the provider profile.');
      }
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

  // Display API error if any occurred during caregiver fetch
  if (apiError) {
    return (
      <div className="error-container">
        <p>{apiError}</p>
        <button onClick={() => fetchCaregiverDetails(recipientId)}>Retry</button>
      </div>
    );
  }
  
  // If we're still loading caregiver details, show loading state instead of error
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading conversation details...</p>
      </div>
    );
  }

  // Create a default recipient object if recipient doesn't exist yet
  // Always use caregiverId as the recipientId for messaging
  const recipientObj = recipient || { 
    id: caregiverId || recipientId, // Use either caregiverId or recipientId from URL
    name: recipientName,
    // Track the original source of the ID
    idSource: 'caregiver',
    // Add default values for properties used in ChatArea
    isOnline: Math.random() > 0.5, 
    lastActive: new Date().toISOString(), 
    avatar: "/avatar.jpg",  
    previewMessage: "Start a conversation..."
  };
  
  // Debug the actual values that we're using
  console.log('Creating recipientObj with:', {
    recipientId,
    caregiverId,
    recipientName,
    finalId: recipientObj.id
  });

  console.log('recipientObj before final checks:', recipientObj);

  
  // Extra validation - use recipientId as ultimate fallback if nothing else works
  // This handles the case where caregiverId might still be null in a race condition
  if (!loading && !recipientObj.id && !recipientId) {
    console.error('Failed to establish recipient ID from any source - last resort fallback check');
    return (
      <div className="error-container">
        <p>Error: Unable to determine recipient information. The chat cannot be loaded.</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }
  
  // Force recipientObj to have an ID even if previous checks failed
  if (!recipientObj.id && recipientId) {
    console.log('Forcing recipientObj to use recipientId as fallback:', recipientId);
    recipientObj.id = recipientId;
    console.log("final userId:", userId);
  }
  
  // Log the recipient object to help with debugging
  console.log('Using recipient:', recipientObj);
  const validMessageObject = {
    senderId: userId,
    receiverId: recipientId || caregiverId || recipientObj.id,
    recipientName: recipientName,
    messageText: '',
    timestamp: new Date().toISOString(),
    avatar: recipientObj.avatar || "/avatar.jpg",
    isOnline: recipientObj.isOnline || false,
    lastActive: recipientObj.lastActive || new Date().toISOString(),
    isRead: false,
  }

  console.log('validMessageObject created:', validMessageObject);
  return (
    <div className="messages">
      <div className="direct-message-container">
        <div className="messages-header">
          <h2>Conversation with {recipientName}</h2>
          {error && (
            <div className="connection-status">
              <span className="status-indicator offline"></span>
              <span className="status-text">Offline Mode</span>
            </div>
          )}
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
