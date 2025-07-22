import React, { useState, useRef, useEffect } from 'react';
import { DOJAH_CONFIG } from '../../config/dojah';
import config from '../../config';
import styles from './DojahVerificationButton.module.css';

/**
 * DojahVerificationButton Component
 * 
 * This component renders a button that opens the Dojah verification widget in an iframe
 * to avoid CORS issues when running locally.
 */
const DojahVerificationButton = ({ 
  onSuccess, 
  onError,
  onStart, 
  userId,
  buttonText = "Verify Identity",
  textColor = "#FFFFFF",
  backgroundColor = "#3977de" 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const iframeRef = useRef(null);

  // Check initialization on component mount
  useEffect(() => {
    try {
      // Verify that global variables are properly set
      if (typeof window !== 'undefined') {
        if (!window.ENV || !window.Dojah) {
          throw new Error('Dojah environment not properly initialized. Please check config.js');
        }

        console.log('🎯 Dojah environment verified:', {
          ENV: !!window.ENV,
          Dojah: !!window.Dojah,
          initialized: window.Dojah?.initialized
        });
      }
    } catch (error) {
      console.error('❌ Dojah initialization check failed:', error);
      setInitializationError(error.message);
    }
  }, []);
  
  // Function to handle messages from the iframe
  const handleIframeMessage = (event) => {
    // We should only accept messages from our iframe
    if (event.origin !== 'https://identity.dojah.io') {
      return;
    }
    
    try {
      const data = JSON.parse(event.data);
      console.log('Message received from iframe:', data);
      
      if (data.type === 'verification') {
        if (data.status === 'success') {
          console.log('Verification successful:', data);
          if (onSuccess) onSuccess(data);
          closeModal();
        } else if (data.status === 'error') {
          console.error('Verification error:', data);
          if (onError) onError(new Error(data.message || 'Verification failed'));
          closeModal();
        }
      }
    } catch (error) {
      console.log('Non-JSON message received from iframe:', event.data);
    }
  };
  
  // Add event listener for iframe messages when the modal is shown
  const setupMessageListener = () => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  };
  
  // Function to build the verification URL
  const buildVerificationUrl = () => {
    const appId = config.DOJAH.APP_ID;
    const widgetId = config.DOJAH.WIDGET_ID;
    
    if (!appId || !widgetId) {
      console.error('Missing Dojah appId or widgetId in config');
      if (onError) onError(new Error('Missing Dojah configuration in config.js'));
      return null;
    }
    
    if (!userId) {
      console.error('Missing userId for Dojah verification');
      if (onError) onError(new Error('User ID is required for verification'));
      return null;
    }
    
    // Use redirect URL from config
    const redirectUrl = config.ENV.REDIRECT_URL;
    
    console.log('🔗 Redirect URL for verification:', redirectUrl);
    
    // Build the URL with all necessary parameters
    const baseUrl = config.DOJAH.IDENTITY_URL;
    const timestamp = Date.now();
    const referenceId = `user_${userId}_${timestamp}`;
    
    const params = new URLSearchParams({
      app_id: appId,
      widget_id: widgetId,
      type: 'iframe',
      // Pass user ID in multiple ways to ensure Dojah receives it
      user_id: userId,
      reference_id: referenceId,
      redirect_url: redirectUrl,
      // Add metadata as URL parameter
      metadata: JSON.stringify({
        user_id: userId,
        reference_id: referenceId,
        timestamp: timestamp,
        source: 'care-pro-app'
      })
    });
    
    console.log('🔗 Built Dojah verification URL with params:', {
      userId,
      referenceId,
      appId,
      widgetId,
      redirectUrl,
      baseUrl
    });
    
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Handle click on the verification button
  const handleButtonClick = () => {
    // Check for initialization errors first
    if (initializationError) {
      console.error('Cannot start verification due to initialization error:', initializationError);
      if (onError) onError(new Error(`Initialization failed: ${initializationError}`));
      return;
    }

    console.log('🚀 Opening Dojah verification iframe...');
    setIsLoading(true);
    
    // Show modal with iframe
    const url = buildVerificationUrl();
    if (!url) {
      setIsLoading(false);
      return;
    }

    setShowModal(true);
    setupMessageListener();
    setIsLoading(false);
    
    // Call onStart callback to begin webhook polling
    if (onStart) {
      onStart();
    }
  };
  
  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    window.removeEventListener('message', handleIframeMessage);
  };
  
  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#cccccc' : backgroundColor,
          color: textColor,
          padding: '12px 24px',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease-in-out',
          opacity: isLoading ? 0.7 : 1,
          position: 'relative'
        }}
        onMouseOver={(e) => !isLoading && (e.target.style.opacity = '0.9')}
        onMouseOut={(e) => !isLoading && (e.target.style.opacity = '1')}
      >
        {isLoading ? (
          <>
            <span style={{ 
              display: 'inline-block', 
              width: '16px', 
              height: '16px', 
              border: '2px solid transparent',
              borderTop: '2px solid #ffffff',
              borderRadius: '50%',
              marginRight: '8px'
            }}
            className={styles.spinAnimation}></span>
            Loading...
          </>
        ) : (
          <>
            <i className="fas fa-shield-alt"></i>
            {buttonText}
          </>
        )}
      </button>
      
      {/* Modal with iframe */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '500px',
              height: '80%',
              maxHeight: '600px',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              ✕
            </button>
            <iframe
              ref={iframeRef}
              src={buildVerificationUrl()}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Dojah Identity Verification"
              allow="camera; microphone; fullscreen"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DojahVerificationButton;
