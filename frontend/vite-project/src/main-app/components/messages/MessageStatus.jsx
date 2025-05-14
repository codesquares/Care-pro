import React from 'react';
import './messageStatus.scss';

const MessageStatus = ({ status }) => {
  switch (status) {
    case 'sent':
      return (
        <span className="message-status sent" title="Sent">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      );
    case 'delivered':
      return (
        <span className="message-status delivered" title="Delivered">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      );
    case 'read':
      return (
        <span className="message-status read" title="Read">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L7 17L2 12"></path>
            <path d="M22 10L13 19L11 17"></path>
          </svg>
        </span>
      );
    case 'pending':
      return (
        <span className="message-status pending" title="Pending (Offline Mode)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </span>
      );
    default:
      return null;
  }
};

export default MessageStatus;