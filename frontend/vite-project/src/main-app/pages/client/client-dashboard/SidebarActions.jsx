import React from 'react';
import { useNavigate } from 'react-router-dom';
import './sidebarActions.css';

/**
 * SidebarActions component for the client dashboard
 * Provides quick access to key client functions
 */
const SidebarActions = () => {
  const navigate = useNavigate();
  
  return (
    <div className="sidebar-actions">
      <h3 className="sidebar-title">Quick Actions</h3>
      
      <div className="action-buttons">
        <button 
          className="action-button preferences-btn"
          onClick={() => navigate('/app/client/preferences')}
        >
          <i className="fas fa-sliders-h"></i>
          <span>Preferences</span>
        </button>
        
        <button 
          className="action-button settings-btn"
          onClick={() => navigate('/app/client/settings')}
        >
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </button>
      </div>
      
      <div className="action-buttons">
        <button 
          className="action-button orders-btn"
          onClick={() => navigate('/app/client/my-order')}
        >
          <i className="fas fa-clipboard-list"></i>
          <span>My Orders</span>
        </button>
        
        <button 
          className="action-button messages-btn"
          onClick={() => navigate('/app/client/message')}
        >
          <i className="fas fa-comments"></i>
          <span>Messages</span>
        </button>
      </div>
      
      <div className="action-buttons">
        <button 
          className="action-button verifications-btn"
          onClick={() => navigate('/app/client/verification')}
        >
          <i className="fas fa-check-circle"></i>
          <span>Verifications</span>
        </button>
        
        <button 
          className="action-button care-needs-btn"
          onClick={() => navigate('/app/client/care-needs')}
        >
          <i className="fas fa-heartbeat"></i>
          <span>Care Needs</span>
        </button>
      </div>
      
      <div className="action-buttons">
        <button 
          className="action-button dashboard-btn"
          onClick={() => navigate('/app/client/dashboard')}
        >
          <i className="fas fa-th-large"></i>
          <span>Dashboard</span>
        </button>
      </div>
      
      <div className="help-section">
        <h3 className="sidebar-title">Need Help?</h3>
        <p className="help-text">Our support team is available 24/7 to assist you with any questions or concerns.</p>
        <button 
          className="help-button"
          onClick={() => window.open('mailto:support@carepro.com')}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default SidebarActions;
