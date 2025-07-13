import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./verification-page-footer.css";
import verificationService from "../../../services/verificationService";
import { saveDojahVerification, processDojahResponse } from "../../../services/dojahService";
import { Helmet } from "react-helmet-async";
import DojahVerificationButton from "../../../components/verification/DojahVerificationButton";
import convertFileToBase64 from "./convertFileToBase64";

const VerificationPage = () => {
  const navigate = useNavigate();
  const [verificationMethod, setVerificationMethod] = useState("bvn");
  const [bvnNumber, setBvnNumber] = useState("");
  const [ninNumber, setNinNumber] = useState("");
  const [idImage, setIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [idType, setIdType] = useState("generic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [showIdSelfieStep, setShowIdSelfieStep] = useState(false);

  // Get token and user ID from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");

  // Reference for polling cancellation
  const pollRef = useRef(null);
  const progressIntervalRef = useRef(null);

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

    // Track if component is mounted to prevent state updates after unmounting
    let isMounted = true;

    // Check initial verification status
    const checkStatus = async () => {
      try {
        if (isMounted) {
          setProgress(10);
          setProgressMessage("Checking verification status...");
        }

        const status = await verificationService.getVerificationStatus(
          userDetails.id,
          "caregiver",
          token
        );

        if (!isMounted) return;

        setVerificationStatus(status);

        if (status.verified === true) {
          setProgress(100);
          setProgressMessage("Account already verified!");
          setSuccess("Your account is already verified!");
          setTimeout(() => {
            if (isMounted) {
              navigate("/app/caregiver/profile");
            }
          }, 3000);
        } else {
          setProgress(0);
          setProgressMessage("");
        }
      } catch (err) {
        console.error("Failed to check verification status", err);
        if (isMounted) {
          setProgress(0);
          setProgressMessage("");
        }
      }
    };

    checkStatus();

    let pollingTimeout = null;

    const setupPolling = () => {
      if (isPolling || verificationStatus?.verified) {
        return;
      }

      if (isMounted) {
        setIsPolling(true);

        let progressCounter = 20;

        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }

        progressIntervalRef.current = setInterval(() => {
          if (!isMounted) {
            clearInterval(progressIntervalRef.current);
            return;
          }

          if (progressCounter < 90) {
            setProgress(progressCounter);
            setProgressMessage("Waiting for verification result...");
            progressCounter += 5;
          }
        }, 10000);

        if (pollRef.current) {
          pollRef.current();
          pollRef.current = null;
        }

        pollRef.current = verificationService.pollVerificationStatus(
          (status) => {
            if (!isMounted) return;

            setVerificationStatus(status);

            if (status.verified === true) {
              clearInterval(progressIntervalRef.current);
              setIsPolling(false);
              setProgress(100);
              setProgressMessage("Verification successful!");
              setSuccess("Your account has been verified successfully!");
              setTimeout(() => {
                if (isMounted) {
                  navigate("/app/caregiver/profile");
                }
              }, 3000);
            } else if (status.verificationStatus === "pending") {
              if (status.progress) {
                setProgress(status.progress);
                setProgressMessage(
                  `Verification in progress (attempt ${status.pollingAttempt || 1}/${status.maxAttempts || 10
                  })...`
                );
              }
            } else if (status.verificationStatus === "failed") {
              clearInterval(progressIntervalRef.current);
              setIsPolling(false);
              setProgress(100);
              setProgressMessage("Verification failed");
              setError("Verification failed. Please try again.");
            }
          },
          15000,
          userDetails.id,
          "caregiver"
        );
      }
    };

    pollingTimeout = setTimeout(setupPolling, 3000);

    return () => {
      isMounted = false;

      if (pollRef.current) {
        pollRef.current();
        pollRef.current = null;
      }

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
      }
    };
  }, []);

  const handleVerificationMethodChange = (e) => {
    setVerificationMethod(e.target.value);
    setError(""); // Clear errors when changing method
  };

  const handleIdTypeChange = (e) => {
    setIdType(e.target.value);
  };

  const handleImageChange = (e, setImageFunc) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("Image size should be less than 5MB");
        return;
      }

      // Log original file size
      console.log(`Original image size: ${Math.round(file.size / 1024)}KB`);

      setImageFunc(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setProgress(10);
    setProgressMessage("Starting verification process...");

    // Log all input values for debugging
    console.log('[VerificationPage] handleSubmit called with:', {
      verificationMethod,
      bvnNumber,
      ninNumber,
      idImage,
      selfieImage,
      idType,
      userDetails,
      token
    });

    // Clear any existing polling first
    if (pollRef.current) {
      pollRef.current();
      pollRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    try {
      // Validate inputs based on verification method
      if (verificationMethod === "bvn") {
        if (!bvnNumber || !selfieImage) {
          throw new Error("Both BVN and selfie are required for verification");
        }
      } else if (verificationMethod === "nin") {
        if (!ninNumber || !selfieImage) {
          throw new Error("Both NIN and selfie are required for verification");
        }
      } else if (verificationMethod === "id") {
        if (!idImage || !selfieImage) {
          throw new Error("Both ID image and selfie are required for verification");
        }
      }

      setProgress(30);

      if (verificationMethod === "bvn") {
        // Validate inputs
        if (!bvnNumber || !selfieImage) {
          throw new Error("Both BVN and selfie are required for verification");
        }

        setProgressMessage("Processing BVN and selfie verification...");
        setProgress(30);

        // Convert selfie to base64
        const selfieImageBase64 = await convertFileToBase64(selfieImage);

        console.log('[VerificationPage] Starting BVN verification with selfie:', {
          bvnNumber,
          hasImage: !!selfieImageBase64,
          userType: 'caregiver',
          id: userDetails.id
        });

        const verificationData = await verificationService.verifyBVNWithSelfie(
          bvnNumber,
          selfieImageBase64,
          'caregiver',
          userDetails.id,
          token
        );

          if (verificationData.verificationResult?.entity) {
            const result = verificationData.verificationResult;
            
            if (result.entity.verified === true && result.entity.selfie_verification?.match === true) {
              setProgress(100);
              setProgressMessage("Verification successful!");
              setSuccess("Your identity has been verified successfully!");
              
              // Save verification status
              verificationService.saveVerificationStatus(
                true,
                'verified',
                'BVN with selfie verification successful',
                userDetails.id,
                'caregiver'
              );

              setVerificationStatus({
                verified: true,
                verificationStatus: 'verified'
              });

              // Redirect after success
              setTimeout(() => {
                navigate("/app/caregiver/profile");
              }, 3000);
            } else {
              // Verification failed
              setProgress(100);
              setProgressMessage("Verification failed");
              setError(result.entity.message || "Verification failed. Please check your selfie and try again.");
            }
          } else {
            // Invalid response
            setProgress(100);
            setProgressMessage("Verification failed");
            setError("Invalid response from verification service");
          }
      } else if (verificationMethod === "nin") {
        // NIN verification
        setProgressMessage("Processing NIN and selfie verification...");

        // Convert selfie to base64
        const selfieImageBase64 = await convertFileToBase64(selfieImage);

        console.log('[VerificationPage] Calling verifyNINWithSelfie with:', {
          ninNumber,
          selfieImageBase64,
          userType: 'caregiver',
          userId: userDetails.id
        });

        // Use our new simplified NIN + selfie endpoint
        const verificationData = await verificationService.verifyNINWithSelfie(
          ninNumber,
          selfieImageBase64,
          'caregiver',
          userDetails.id
        );

        console.log('[VerificationPage] Verification data:', verificationData);

        if (verificationData.verificationResult?.entity) {
          const result = verificationData.verificationResult;
          
          if (result.entity.verified === true && result.entity.selfie_verification?.match === true) {
            setProgress(100);
            setProgressMessage("Verification successful!");
            setSuccess("Your identity has been verified successfully!");
            console.log('[VerificationPage] Verification successful:', result);
            
            // Save verification status
            verificationService.saveVerificationStatus(
              true,
              'verified',
              'NIN with selfie verification successful',
              userDetails.id,
              'caregiver'
            );

            setVerificationStatus({
              verified: true,
              verificationStatus: 'verified'
            });

            // Redirect after success
            setTimeout(() => {
              navigate("/app/caregiver/profile");
            }, 3000);
          } else {
            // Verification failed
            setProgress(100);
            setProgressMessage("Verification failed");
            setError(result.entity.message || "Verification failed. Please check your selfie and try again.");
          }
        } else {
          // Invalid response
          setProgress(100);
          setProgressMessage("Verification failed");
          setError("Invalid response from verification service");
        }

      } else if (verificationMethod === "id") {
        // ID + Selfie verification
        setProgressMessage("Processing ID and selfie verification...");

        const idImageBase64 = await convertFileToBase64(idImage);
        const selfieImageBase64 = await convertFileToBase64(selfieImage);

        console.log('[VerificationPage] Calling verifyIDWithSelfie with:', {
          idImageBase64,
          selfieImageBase64,
          idType,
          userType: 'caregiver',
          userId: userDetails.id
        });

        // Use our new simplified ID + selfie endpoint
        const verificationData = await verificationService.verifyIDWithSelfie(
          idImageBase64,
          selfieImageBase64,
          idType,
          'caregiver',
          userDetails.id
        );

        console.log('[VerificationPage] Verification data:', verificationData);

        if (verificationData.verificationResult?.entity) {
          const result = verificationData.verificationResult;
          
          if (result.entity.verified === true && result.entity.selfie_verification?.match === true) {
            setProgress(100);
            setProgressMessage("Verification successful!");
            setSuccess("Your identity has been verified successfully!");
            console.log('[VerificationPage] Verification successful:', result);
            
            // Save verification status
            verificationService.saveVerificationStatus(
              true,
              'verified',
              'ID with selfie verification successful',
              userDetails.id,
              'caregiver'
            );

            setVerificationStatus({
              verified: true,
              verificationStatus: 'verified'
            });

            // Redirect after success
            setTimeout(() => {
              navigate("/app/caregiver/profile");
            }, 3000);
          } else {
            // Verification failed
            setProgress(100);
            setProgressMessage("Verification failed");
            setError(result.entity.message || "Verification failed. Please check your selfie and try again.");
          }
        } else {
          // Invalid response
          setProgress(100);
          setProgressMessage("Verification failed");
          setError("Invalid response from verification service");
        }
      }
    } catch (err) {
      setProgress(100);
      setProgressMessage("Verification failed");

      // Provide specific error messages based on error type
      if (err.response) {
        // Server responded with error
        switch (err.response.status) {
          case 401:
            setError("Authentication error. Please log in again and retry.");
            break;
          case 400:
            setError(`Invalid data format: ${err.response.data?.message || "Please check your information and try again."}`);
            break;
          case 500:
            setError("Server error: The verification service is currently unavailable. Please try again later.");
            break;
          default:
            setError(err.response.data?.message || "Verification failed. Please check your information and try again.");
        }
      } else if (err.request) {
        // No response received (network issue)
        setError("Network issue: Unable to connect to verification service. Please check your internet connection.");
      } else {
        // Error setting up request
        setError(err.message || "An unexpected error occurred. Please try again later.");
      }

      console.error("[VerificationPage] Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            />
            
            {/* Debug button */}
            {import.meta.env.DEV && (
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
            )}
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


