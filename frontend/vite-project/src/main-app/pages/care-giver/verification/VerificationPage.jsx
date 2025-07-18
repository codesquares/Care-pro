import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./verification-page-footer.css";
import verificationService from "../../../services/verificationService";
import { saveDojahVerification, processDojahResponse } from "../../../services/dojahService";
import { Helmet } from "react-helmet-async";
import DojahVerificationButton from "../../../components/verification/DojahVerificationButton";

const VerificationPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

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
            navigate("/app/caregiver/profile");
          }, 3000);
        } else {
          setProgress(0);
          setProgressMessage("");
        }
      } catch (err) {
        console.error("Failed to check verification status", err);
        setProgress(0);
        setProgressMessage("");
      }
    };

    checkStatus();
  }, []);

  // Handle Dojah verification success
  const handleVerificationSuccess = async (response) => {
    try {
      console.log('Verification successful:', response);
      setSuccess("Identity verification successful!");
      setProgress(100);
      setProgressMessage("Verification completed!");

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
        navigate("/app/caregiver/profile");
      }, 3000);
    } catch (err) {
      console.error('Error saving verification status:', err);
      setError("Verification completed but failed to save status. Please contact support.");
      
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
    
    // Log the detailed error for debugging
    console.error('Verification error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  };
  
  // Debug function to manually trigger verification widget
  const debugOpenWidget = () => {
    console.log('Manually opening widget...');
    // Create global function to access from console
    window.openDojahWidget = () => {
      console.log('Attempting to open widget from debug function');
      const script = document.createElement('script');
      script.innerHTML = `
        try {
          console.log('Creating widget directly');
          const widget = new DojahWidget({
            appId: "${import.meta.env.VITE_DOJAH_APP_ID || "686c915878a2b53b2bdb5631"}",
            widgetId: "${import.meta.env.VITE_DOJAH_WIDGET_ID || "68732f5e97202a07f66bc89a"}",
            type: "custom",
            config: {
              debug: true,
              webhook: true,
              stages: ["government-data", "selfie"]
            },
            metadata: {
              user_id: "${userDetails.id}"
            },
            callback: function(response) {
              console.log("Direct widget verification completed:", response);
            },
            onError: function(error) {
              console.error("Direct widget verification error:", error);
            }
          });
          
          widget.setup();
          widget.open();
        } catch (e) {
          console.error('Error creating widget directly:', e);
        }
      `;
      document.body.appendChild(script);
    };
    
    alert('Debug function added. Open console and type: window.openDojahWidget()');
  };

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

        {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}
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
              buttonText="Start Verification"
              backgroundColor="#00A651"
              user={userDetails}
            />
            
            {/* Debug button */}
            {/* {import.meta.env.DEV && (
              <button 
                onClick={debugOpenWidget}
                style={{
                  marginTop: '10px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Debug Widget
              </button>
            )} */}
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
              onClick={() => navigate("/app/caregiver/profile")}
            >
              <i className="fas fa-arrow-left"></i> Back to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;


