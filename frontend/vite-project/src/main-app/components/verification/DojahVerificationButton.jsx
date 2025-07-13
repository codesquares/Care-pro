import React, { useEffect, useRef } from 'react';
import { DOJAH_CONFIG } from '../../config/dojah';

const DojahVerificationButton = ({ 
  onSuccess, 
  onError, 
  userId,
  buttonText = "Verify Identity",
  textColor = "#FFFFFF",
  backgroundColor = "#3977de" 
}) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    // Reference to the script element
    let scriptElement = null;
    
    // Check if Dojah SDK is already loaded
    if (!window.DojahWidget && !document.querySelector('script[src*="widget.dojah.io"]')) {
      // Load Dojah Widget SDK only if not already loaded
      scriptElement = document.createElement('script');
      scriptElement.src = 'https://widget.dojah.io/websdk.js';
      scriptElement.defer = true;
      scriptElement.async = true;
      
      // Set onload handler before appending to document
      scriptElement.onload = () => {
        initializeDojahWidget();
      };
      
      // After all handlers are set, append to document
      document.body.appendChild(scriptElement);
    } else {
      // SDK is already loaded, initialize the widget directly
      initializeDojahWidget();
    }

    // Function to initialize the Dojah widget
    function initializeDojahWidget() {
      if (window.DojahWidget) {
        const config = {
          ...DOJAH_CONFIG,
          metadata: {
            ...DOJAH_CONFIG.metadata,
            user_id: userId
          },
          callback: (response) => {
            console.log('Dojah verification completed:', response);
            if (onSuccess) onSuccess(response);
          },
          onError: (error) => {
            console.error('Dojah verification error:', error);
            if (onError) onError(error);
          }
        };

        // Create widget instance
        const widget = new window.DojahWidget(config);

        // Attach click handler to button
        if (buttonRef.current) {
          buttonRef.current.onclick = () => {
            widget.setup();
            widget.open();
          };
        }
      }
    }

    // Cleanup function
    return () => {
      // Only remove the script if we created it
      if (scriptElement && document.body.contains(scriptElement)) {
        document.body.removeChild(scriptElement);
      }
    };
  }, [userId, onSuccess, onError]);

  return (
    <button
      ref={buttonRef}
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        padding: '12px 24px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'opacity 0.2s ease-in-out'
      }}
      onMouseOver={(e) => e.target.style.opacity = '0.9'}
      onMouseOut={(e) => e.target.style.opacity = '1'}
    >
      <i className="fas fa-shield-alt"></i>
      {buttonText}
    </button>
  );
};

export default DojahVerificationButton;
