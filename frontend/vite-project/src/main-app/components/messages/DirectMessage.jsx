import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useMessageContext } from '../../context/MessageContext';
import { useAuth } from '../../context/AuthContext';
import ChatArea from './Chatarea';
import axios from 'axios';
import './messages.css';
import './direct-message.css';
import config from '../../config'; // Import centralized config for API URLs

// FIXED: Use centralized config instead of hardcoded Azure staging API URL
const API_BASE_URL = config.BASE_URL.replace(/\/api$/, ''); // Remove /api suffix for consistency (only trailing)

const DirectMessage = () => {
  const { recipientId } = useParams();
  const location = useLocation();
  const { userRole } = useAuth(); // Get current user's role
  const [recipientName, setRecipientName] = useState(location.state?.recipientName || "User");
  
  // Recipient ID - can be either caregiver or client depending on current user's role
  const [recipientUserId, setRecipientUserId] = useState(null);
  const [recipientRole, setRecipientRole] = useState(null); // Track whether recipient is 'Caregiver' or 'Client'
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Determine if current user is a caregiver (viewing a client) or client (viewing a caregiver)
  const isCurrentUserCaregiver = userRole === 'Caregiver';
  const isCurrentUserClient = userRole === 'Client';
  
  // Extract recipient ID on component mount
  useEffect(() => {
    console.log('DirectMessage component mounted/updated with:', {
      recipientId,
      locationState: location.state,
      currentName: recipientName,
      userRole
    });
    
    // Extract recipient ID from multiple possible sources
    let extractedRecipientId = 
      location.state?.recipientId ||
      location.state?.caregiverId || 
      location.state?.clientId ||
      location.state?.caregiver?.id || 
      location.state?.client?.id ||
      location.state?.gig?.caregiverId;
    
    // If there's a recipientId from URL params, use that as fallback
    if (!extractedRecipientId && recipientId) {
      console.log('No ID in location state, using recipientId from URL:', recipientId);
      extractedRecipientId = recipientId;
    }
    
    // Last resort - extract from URL path
    if (!extractedRecipientId) {
      const pathSegments = window.location.pathname.split('/');
      const possibleId = pathSegments[pathSegments.length - 1];
      if (possibleId && possibleId.length > 8) {
        console.log('Extracted possible ID from URL:', possibleId);
        extractedRecipientId = possibleId;
      }
    }
    
    // If we have a recipient ID, set it and fetch details based on current user's role
    if (extractedRecipientId) {
      console.log('Using recipientId:', extractedRecipientId);
      setRecipientUserId(extractedRecipientId);
      
      // If we don't have a recipient name, fetch the details based on user role
      if (!location.state?.recipientName) {
        console.log('No recipient name available, fetching details based on role:', userRole);
        fetchRecipientDetails(extractedRecipientId);
      }
    } else {
      console.error('CRITICAL: Failed to determine recipientId from any source');
      setApiError('Unable to establish chat recipient. Please return to the previous page and try again.');
    }
  }, [location.state, recipientId, userRole]);
  
  // Function to fetch recipient details - calls appropriate API based on current user's role
  const fetchRecipientDetails = async (id) => {
    if (!id) {
      console.error('fetchRecipientDetails called with no ID');
      setApiError('Missing recipient ID. Cannot load conversation details.');
      return;
    }
    
    setLoading(true);
    setApiError(null);
    
    try {
      let response;
      let expectedRole;
      
      // If current user is a caregiver, the recipient should be a client
      // If current user is a client, the recipient should be a caregiver
      if (isCurrentUserCaregiver) {
        console.log(`Caregiver viewing chat - fetching Client details for ID: ${id}`);
        try {
          response = await axios.get(`${API_BASE_URL}/api/Clients/${id}`);
          expectedRole = 'Client';
        } catch (clientErr) {
          // Fallback: try generic users endpoint
          console.log('Client endpoint failed, trying generic users endpoint');
          response = await axios.get(`${API_BASE_URL}/api/users/${id}`);
          expectedRole = response.data?.role || 'Client';
        }
      } else {
        // Client viewing caregiver (default behavior)
        console.log(`Client viewing chat - fetching Caregiver details for ID: ${id}`);
        try {
          response = await axios.get(`${API_BASE_URL}/api/CareGivers/${id}`);
          expectedRole = 'Caregiver';
        } catch (caregiverErr) {
          // Fallback: try generic users endpoint
          console.log('Caregiver endpoint failed, trying generic users endpoint');
          response = await axios.get(`${API_BASE_URL}/api/users/${id}`);
          expectedRole = response.data?.role || 'Caregiver';
        }
      }
      
      if (response.data) {
        console.log('Recipient details fetched:', response.data);
        
        // Set the recipient's role
        setRecipientRole(expectedRole);
        
        // Extract name from response with better error handling
        let name = isCurrentUserCaregiver ? 'Client' : 'Care Provider';
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
        
        // Set the confirmed ID
        const confirmedId = response.data.id || response.data.caregiverId || response.data.clientId || id;
        console.log(`Setting confirmed recipientUserId: ${confirmedId}, role: ${expectedRole}`);
        setRecipientUserId(confirmedId);
        
        // Set the name
        setRecipientName(name);
        
        // Add a small delay before marking as not loading to ensure state updates are processed
        setTimeout(() => {
          setLoading(false);
        }, 100);
      } else {
        console.warn('API returned empty data for ID:', id);
        setRecipientName(isCurrentUserCaregiver ? 'Client' : 'Care Provider');
        setRecipientUserId(id);
        setRecipientRole(expectedRole);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching recipient details:', error);
      setApiError(`Failed to load conversation details: ${error.message || 'Unknown error'}`);
      // Set fallback values so the UI doesn't break completely
      setRecipientName(isCurrentUserCaregiver ? 'Client' : 'Care Provider');
      setRecipientUserId(id);
      setRecipientRole(isCurrentUserCaregiver ? 'Client' : 'Caregiver');
      setLoading(false);
    }
  };
  
  console.log('DirectMessage component rendering with state:', {
    recipientId,
    recipientUserId,
    recipientName,
    recipientRole,
    userRole,
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

  // Display API error if any occurred during recipient fetch
  if (apiError) {
    return (
      <div className="error-container">
        <p>{apiError}</p>
        <button onClick={() => fetchRecipientDetails(recipientId)}>Retry</button>
      </div>
    );
  }
  
  // If we're still loading recipient details, show loading state instead of error
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading conversation details...</p>
      </div>
    );
  }

  // Create a default recipient object if recipient doesn't exist yet
  // Use recipientUserId which works for both caregivers and clients
  const recipientObj = recipient || { 
    id: recipientUserId || recipientId,
    name: recipientName,
    role: recipientRole, // Include role for display purposes
    // Add default values for properties used in ChatArea
    isOnline: Math.random() > 0.5, 
    lastActive: new Date().toISOString(), 
    avatar: "/avatar.jpg",  
    previewMessage: "Start a conversation..."
  };
  
  // Debug the actual values that we're using
  console.log('Creating recipientObj with:', {
    recipientId,
    recipientUserId,
    recipientName,
    recipientRole,
    finalId: recipientObj.id
  });

  console.log('recipientObj before final checks:', recipientObj);

  
  // Extra validation - use recipientId as ultimate fallback if nothing else works
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
    receiverId: recipientUserId || recipientId || recipientObj.id,
    recipientName: recipientName,
    recipientRole: recipientRole, // Include role for display
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
