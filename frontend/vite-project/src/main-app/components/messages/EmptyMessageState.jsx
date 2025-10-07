import './empty-message-state.scss';

const EmptyMessageState = ({ isConnecting = false }) => {
  // Get user role from local storage
  const getUserRole = () => {
    try {
      const user = JSON.parse(localStorage.getItem("userDetails"));
      return user?.role || '';
    } catch (e) {
      return '';
    }
  };

  const userRole = getUserRole();
  const isClient = userRole.toLowerCase() === 'client';

  return (
    <div className="empty-message-state">
      <div className="empty-message-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h2>No messages yet</h2>
      
      {isConnecting ? (
        <p>Connecting to the messaging service...</p>
      ) : (
        <>
          <p>You currently don't have any active conversations.</p>
          <p className="hint-text">Once you start chatting with {isClient ? 'caregivers' : 'clients'}, your conversations will appear here.</p>
          
          <div className="info-box">
            <h3>How to start a conversation:</h3>
            <ul>
              {isClient ? (
                <li>As a client, you can initiate a chat with a caregiver by visiting their profile and clicking the "Message" button</li>
              ) : (
                <li>As a caregiver, clients will reach out to you when they need your services or have questions about your profile</li>
              )}
              <li>Messages will be saved and visible here once a conversation has been started</li>
              <li>You'll receive notifications when new messages arrive</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default EmptyMessageState;
