import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const VerificationCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing verification results...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get verification result from URL parameters
        const verificationStatus = searchParams.get('status') || searchParams.get('verification_status');
        const referenceId = searchParams.get('reference_id') || searchParams.get('ref_id');
        const message = searchParams.get('message') || searchParams.get('msg');
        const isSuccess = searchParams.get('success') === 'true' || verificationStatus === 'success';
        const isCompleted = searchParams.get('completed') === 'true' || verificationStatus === 'completed';

        console.log('Verification callback received:', {
          status: verificationStatus,
          referenceId,
          message,
          isSuccess,
          isCompleted,
          allParams: Object.fromEntries(searchParams)
        });

        // Check if this looks like a successful completion
        if (isSuccess || isCompleted || verificationStatus === 'success' || verificationStatus === 'completed') {
          setStatus('success');
          setMessage('Verification completed successfully! You can close this window.');
          
          // Send message to parent window if opened in popup
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'verification.completed',
              data: {
                status: 'success',
                reference_id: referenceId,
                message: message || 'Verification completed',
                timestamp: new Date().toISOString()
              }
            }, window.location.origin);
            
            // Auto-close popup after showing success message
            setTimeout(() => {
              try {
                window.close();
              } catch (e) {
                console.log('Could not auto-close window');
              }
            }, 3000);
          } else {
            // Not in popup, navigate directly after delay
            setTimeout(() => {
              navigate('/app/caregiver/profile');
            }, 3000);
          }
          
        } else if (verificationStatus === 'failed' || verificationStatus === 'error' || searchParams.get('error')) {
          setStatus('error');
          setMessage('Verification failed. You can close this window and try again.');
          
          // Send message to parent window if opened in popup
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'verification.failed',
              data: {
                status: 'failed',
                reference_id: referenceId,
                message: message || 'Verification failed',
                timestamp: new Date().toISOString()
              }
            }, window.location.origin);
            
            setTimeout(() => {
              try {
                window.close();
              } catch (e) {
                console.log('Could not auto-close window');
              }
            }, 3000);
          } else {
            setTimeout(() => {
              navigate('/app/caregiver/verification');
            }, 3000);
          }
          
        } else {
          // No clear status or just a general callback - assume completion and let polling handle it
          setStatus('success');
          setMessage('Verification submitted! You can close this window. Please check your main app for updates.');
          
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'verification.submitted',
              data: {
                status: 'submitted',
                reference_id: referenceId,
                message: 'Verification submitted for processing',
                timestamp: new Date().toISOString()
              }
            }, window.location.origin);
            
            setTimeout(() => {
              try {
                window.close();
              } catch (e) {
                console.log('Could not auto-close window');
              }
            }, 3000);
          } else {
            setTimeout(() => {
              navigate('/app/caregiver/verification');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error processing verification callback:', error);
        setStatus('error');
        setMessage('Error processing verification results. You can close this window.');
        
        setTimeout(() => {
          if (window.opener && !window.opener.closed) {
            try {
              window.close();
            } catch (e) {
              console.log('Could not auto-close window');
            }
          } else {
            navigate('/app/caregiver/verification');
          }
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <>
      <Helmet>
        <title>Verification Results | Care Pro</title>
      </Helmet>
      
      <div className="verification-callback-page">
        <div className="callback-container">
          <div className="callback-content">
            {status === 'processing' && (
              <>
                <div className="spinner"></div>
                <h2>Processing Results</h2>
                <p>{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="success-icon">✅</div>
                <h2>Verification Successful</h2>
                <p>{message}</p>
                {window.opener && (
                  <button 
                    onClick={() => window.close()} 
                    className="close-button"
                  >
                    Close Window
                  </button>
                )}
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="error-icon">❌</div>
                <h2>Verification Failed</h2>
                <p>{message}</p>
                {window.opener && (
                  <button 
                    onClick={() => window.close()} 
                    className="close-button"
                  >
                    Close Window
                  </button>
                )}
              </>
            )}
            
            {status === 'cancelled' && (
              <>
                <div className="info-icon">ℹ️</div>
                <h2>Verification Cancelled</h2>
                <p>{message}</p>
                {window.opener && (
                  <button 
                    onClick={() => window.close()} 
                    className="close-button"
                  >
                    Close Window
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VerificationCallback;