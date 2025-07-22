import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./verification-page-footer.css";
import verificationService from "../../../services/verificationService";
import { saveDojahVerification, processDojahResponse, getWebhookData } from "../../../services/dojahService";
import { Helmet } from "react-helmet-async";
import DojahVerificationButton from "../../../components/verification/DojahVerificationButton";
import { use } from "react";

const VerificationPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [webhookData, setWebhookData] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // Track if verification is in progress
  const [modalInstance, setModalInstance] = useState(null); // Store modal reference

  // Get token and user ID from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");

  const effectRan = useRef(false);

  useEffect(() => {
    // Skip the second run caused by Strict Mode in development
    if (effectRan.current) return;
    effectRan.current = true;

    // Redirect if no token or user ID
    if (!token || !userDetails.id) {
      navigate("/login");
      return;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('Token is expired on page load - redirecting to login');
      setError('Your session has expired. Please log in again.');
      setTimeout(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userDetails");
        navigate("/login");
      }, 2000);
      return;
    }

    // Check initial verification status
    const checkStatus = async () => {
      try {
        setProgress(10);
        setProgressMessage("Checking verification status...");

        const status = await verificationService.getVerificationStatus(
          userDetails.id,
          "caregiver",
          token
        );

        setVerificationStatus(status);

        if (status.verified === true) {
          setProgress(100);
          setProgressMessage("Account already verified!");
          setSuccess("Your account is already verified!");
          setTimeout(() => {
            navigate("/app/caregiver/dashboard");
          }, 3000);
        } else {
          setProgress(0);
          setProgressMessage("");
        }
      } catch (err) {
        console.error("Failed to check verification status", err);
        
        // Handle token expiration
        if (err.message && err.message.includes('401')) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userDetails");
            navigate("/login");
          }, 2000);
          return;
        }
        
        setProgress(0);
        setProgressMessage("");
      }
    };

    checkStatus();
  }, []);

  useEffect(() => {
    // Check for webhook data when component mounts and poll for updates
    let pollInterval;
    let pollCount = 0;
    const MAX_POLL_ATTEMPTS = 60; // Stop after 5 minutes (60 * 5s = 5min)
    
    const fetchWebhookData = async () => {
      // Only poll if verification is in progress
      if (!isVerifying) return;
      
      pollCount++;
      
      // Stop polling after max attempts to prevent infinite loops
      if (pollCount > MAX_POLL_ATTEMPTS) {
        console.log('Polling timeout reached, stopping verification check');
        setIsVerifying(false);
        setError('Verification timeout. Please try again or contact support.');
        setProgress(0);
        setProgressMessage('');
        return;
      }
      
      const userId = userDetails.id;
      const currentToken = localStorage.getItem("authToken");
      
      // Check if token is expired before making request
      if (isTokenExpired(currentToken)) {
        console.log('Token expired during polling - redirecting to login');
        setIsVerifying(false);
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userDetails");
          navigate("/login");
        }, 2000);
        return;
      }
      
      try {
        // Add cache busting and specific headers to prevent caching issues
        const timestamp = Date.now();
        const data = await getWebhookData(userId, currentToken, timestamp);
        console.log('Fetched webhook data====>:', data);
        
        // Check for Dojah's actual webhook format
        if (data.success && data.data) {
          const webhookBody = data.data;
          
          // Check if this is a completed verification
          if (webhookBody.status === true && webhookBody.verification_status === 'Completed') {
            console.log('Verification successful from webhook:', webhookBody);
            setSuccess("Identity verification successful!");
            setProgress(100);
            setProgressMessage("Verification completed!");
            setIsVerifying(false);

            // Auto-close Dojah modal if it exists
            const modalElement = document.querySelector('[style*="position: fixed"][style*="z-index: 9999"]');
            if (modalElement) {
              modalElement.remove();
              console.log('Dojah modal closed automatically');
            }

            // Process the webhook data for Azure backend
            try {
              // Call backend to process and send to Azure
              const response = await fetch(`https://care-pro-node-api.onrender.com/api/dojah/process/${userId}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${currentToken}`,
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'
                }
              });
              
              const result = await response.json();
              
              if (response.ok && result.success) {
                console.log('✅ Verification data processed and sent to Azure:', result);
                
                // Update local verification status
                setVerificationStatus({
                  verified: true,
                  verificationStatus: 'verified',
                  method: 'DOJAH_VERIFICATION',
                  timestamp: new Date().toISOString()
                });
                
                setSuccess("Identity verification completed and saved successfully! Redirecting...");
                
              } else {
                console.warn('⚠️ Verification completed but Azure submission had issues:', result);
                setSuccess("Identity verification completed! Processing in background...");
              }
            } catch (processError) {
              console.error('Error processing verification data:', processError);
              setSuccess("Identity verification completed! Data will be processed shortly...");
            }

            // Clear polling interval
            if (pollInterval) {
              clearInterval(pollInterval);
            }

            // Redirect after success with a longer delay to show success message
            setTimeout(() => {
              navigate("/app/caregiver/dashboard");
            }, 4000); // Increased to 4 seconds
          }
        }
      } catch (error) {
        console.error('Error fetching webhook data:', error);
        
        // Handle 401 errors (token expiration)
        if (error.message && error.message.includes('401')) {
          console.log('Token expired during webhook polling - redirecting to login');
          setIsVerifying(false);
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userDetails");
            navigate("/login");
          }, 2000);
          return;
        }
        
        // If we get repeated errors, stop polling
        if (pollCount > 5) {
          console.log('Multiple polling errors, reducing frequency');
          // Exponentially back off polling frequency after errors
          clearInterval(pollInterval);
          pollInterval = setInterval(fetchWebhookData, 10000); // Slow down to 10s
        }
      }
    };

    // Only start polling if verification is in progress
    if (isVerifying) {
      // Start with immediate check
      fetchWebhookData();
      
      // Set up polling to check for webhook data every 5 seconds (reduced from 3)
      pollInterval = setInterval(fetchWebhookData, 5000);
    }
    
    // Clean up interval on component unmount or when verification stops
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isVerifying, userDetails.id, navigate, token]);

  // Handle when verification starts (when user clicks the button)
  const handleVerificationStart = () => {
    const currentToken = localStorage.getItem("authToken");
    
    // Check if token is expired before starting verification
    if (isTokenExpired(currentToken)) {
      console.log('Token expired before starting verification - redirecting to login');
      setError('Your session has expired. Please log in again to continue verification.');
      setTimeout(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userDetails");
        navigate("/login");
      }, 2000);
      return;
    }

    console.log('Verification started - beginning webhook polling');
    setIsVerifying(true);
    setProgress(20);
    setProgressMessage("Verification in progress...");
    setError(""); // Clear any previous errors
    setSuccess(""); // Clear any previous success messages
  };

  // Handle Dojah verification success
  const handleVerificationSuccess = async (response) => {
    try {
      console.log('Verification successful:', response);
      setSuccess("Identity verification successful!");
      setProgress(100);
      setProgressMessage("Verification completed!");
      setIsVerifying(false); // Stop polling

      // Process and save Dojah verification data
      const verificationData = processDojahResponse(response);
      console.log('Processed verification data:', verificationData);
      
      await saveDojahVerification(verificationData, userDetails.id);
      console.log('Verification data saved successfully');

      // Update local verification status
      setVerificationStatus({
        verified: true,
        verificationStatus: 'verified',
        method: verificationData.verification_method,
        timestamp: new Date().toISOString()
      });

      // Redirect after success
      setTimeout(() => {
        navigate("/app/caregiver/dashboard");
      }, 3000);
    } catch (err) {
      console.error('Error saving verification status:', err);
      setError("Verification completed but failed to save status. Please contact support.");
      setIsVerifying(false); // Stop polling on error
      
      // Log detailed error for debugging
      console.error('Verification save error details:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    }
  };

  // Handle Dojah verification error
  const handleVerificationError = (error) => {
    console.error('Verification error:', error);
    setError(`Verification failed: ${error.message || "Please try again or contact support if the issue persists."}`);
    setProgress(0);
    setProgressMessage("");
    setIsVerifying(false); // Stop polling on error
    
    // Log the detailed error for debugging
    console.error('Verification error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  };
  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  useEffect(() => {
    // Load verification from backend 
    const fetchMyVerification = async () => {
      try {
        // Check if token is expired before making the request
        if (isTokenExpired(token)) {
          console.log('Token is expired - redirecting to login');
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userDetails");
            navigate("/login");
          }, 2000);
          return;
        }

        const response = await fetch(`https://care-pro-node-api.onrender.com/api/dojah/status?userId=${userDetails.id}&userType=caregiver&token=${token}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          // Handle different error types
          if (response.status === 401) {
            console.log('Authentication error - token may be expired');
            setError('Your session has expired. Please log in again.');
            setTimeout(() => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("userDetails");
              navigate("/login");
            }, 2000);
            return;
          } else if (response.status === 404) {
            console.log('User verification status not found - assuming not verified');
            return;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        console.log('Fetched verification data:', data);
        
        // Update verification status if user is already verified
        if (data.success && data.data && data.data.isVerified) {
          setVerificationStatus({
            verified: true,
            verificationStatus: 'verified',
            method: 'EXISTING_VERIFICATION'
          });
          setSuccess("Your account is already verified!");
          setTimeout(() => {
            navigate("/app/caregiver/dashboard");
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching verification data:', error);
        // Don't set error here as it might just mean user isn't verified yet
        console.log('User verification status could not be loaded - assuming not verified');
      }
    };

    // Only fetch if we have required data
    if (userDetails.id && token) {
      fetchMyVerification();
    }
  }, [userDetails.id, token, navigate]);

  // Handle Dojah iframe messages (including IP address errors)
  useEffect(() => {
    const handleDojahMessage = (event) => {
      console.log('Received message from Dojah iframe:', event.data);
      
      if (event.data.type === 'connect.account.error') {
        const errorMessage = event.data.response?.message || 'Unknown error';
        console.error('Dojah Error:', errorMessage);
        
        if (errorMessage.includes('Failed to fetch user ip address')) {
          setError('Network connectivity issue detected. Please try disabling VPN/proxy, using a different browser, or check your internet connection.');
          setIsVerifying(false);
          setProgress(0);
          setProgressMessage('');
        } else {
          setError(`Verification service error: ${errorMessage}`);
          setIsVerifying(false);
          setProgress(0);
          setProgressMessage('');
        }
      } else if (event.data.type === 'connect.account.success') {
        console.log('Dojah verification successful:', event.data);
        handleVerificationSuccess(event.data.response);
      } else if (event.data.type === 'connect.account.close') {
        console.log('Dojah modal closed by user');
        setIsVerifying(false);
        setProgress(0);
        setProgressMessage('');
      }
    };

    window.addEventListener('message', handleDojahMessage);
    return () => window.removeEventListener('message', handleDojahMessage);
  }, []);
  

  return (
    <div className="verification-container">
      <Helmet>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Helmet>
      
      <div className="verification-card">
        <h2>Account Verification</h2>
        <p className="verification-intro">
          To ensure the safety of our clients and maintain high-quality service,
          we require all caregivers to verify their identity.
        </p>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
            {error.includes('Network connectivity issue') && (
              <div className="error-suggestions">
                <p><strong>Try these solutions:</strong></p>
                <ul>
                  <li>Disable VPN or proxy temporarily</li>
                  <li>Try a different browser or incognito mode</li>
                  <li>Check your internet connection</li>
                  <li>Refresh the page and try again</li>
                </ul>
                <button 
                  className="retry-btn" 
                  onClick={() => window.location.reload()}
                  style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  <i className="fas fa-redo"></i> Retry Verification
                </button>
              </div>
            )}
          </div>
        )}
        {success && <div className="success-message"><i className="fas fa-check-circle"></i> {success}</div>}

        {/* Progress indicator */}
        {progress > 0 && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <div className="progress-message">{progressMessage}</div>
          </div>
        )}

        <div className="verification-methods">
          <div className="method-info">
            <h3>Quick and Secure Verification</h3>
            <p>Click the button below to verify your identity using our secure verification partner, Dojah.</p>
            <ul>
              <li><i className="fas fa-check"></i> Fast and secure verification process</li>
              <li><i className="fas fa-check"></i> Multiple verification methods supported</li>
              <li><i className="fas fa-check"></i> Your data is protected and encrypted</li>
            </ul>
          </div>

          <div className="verification-button-container">
            <DojahVerificationButton
              userId={userDetails.id}
              onSuccess={handleVerificationSuccess}
              onError={handleVerificationError}
              onStart={handleVerificationStart}
              buttonText="Start Verification"
              backgroundColor="#00A651"
              user={userDetails}
            />
          </div>
        </div>

        <div className="verification-footer">
          <p>
            Your information is securely processed and will only be used for verification purposes.
            For more details on how we handle your data, please see our <a href="/privacy-policy">Privacy Policy</a>.
          </p>
          <div className="footer-buttons">
            <button
              className="back-btn"
              onClick={() => navigate("/app/caregiver/dashboard")}
            >
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;


