import './empty-message-state.css';

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
      <div className="empty-message-illustration">
        <div className="illustration-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div className="illustration-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      
      <h2>{isConnecting ? 'Connecting...' : 'No messages yet'}</h2>
      
      {isConnecting ? (
        <p className="connecting-text">Setting up your messaging — this won't take long.</p>
      ) : (
        <>
          <p>Your conversations will appear here once you start chatting.</p>
          
          <div className="empty-state-tips">
            <div className="tip-card">
              <div className="tip-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="tip-text">
                <strong>Start a conversation</strong>
                <span>{isClient 
                  ? 'Visit a caregiver\'s profile and click "Message"' 
                  : 'Clients will reach out when they need your services'}</span>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <div className="tip-text">
                <strong>Get notified</strong>
                <span>You'll receive notifications when new messages arrive</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmptyMessageState;
