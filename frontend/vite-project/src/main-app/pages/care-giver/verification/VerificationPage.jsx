import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import "./verification-page.css";
import "./verification-page-footer.css";
import "./mobile-verification.css";
import "./dojah-widget-fix.css";
import verificationService from "../../../services/verificationService";
import { userService } from "../../../services/userService";
import { Helmet } from "react-helmet-async";
import config from "../../../config";
import Modal from "../../../components/modal/Modal";
import { useCaregiverStatus } from "../../../contexts/CaregiverStatusContext";
import signalRNotificationService from "../../../services/signalRNotificationService";

const DOJAH_WIDGET_SCRIPT = 'https://widget.dojah.io/widget.js';

const CaregiverVerificationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { updateVerificationStatus, setVerificationPending } = useCaregiverStatus();
  const [verificationMethod, setVerificationMethod] = useState("dojah");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  
  // Tracks whether the widget process completed (success or error) so we can poll backend
  const [widgetCompleted, setWidgetCompleted] = useState(false);
  const widgetCompletedRef = useRef(false);
  
  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonBgColor, setButtonBgColor] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Refs for stable DOM and lifecycle management
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);
  const pollingRef = useRef(null);
  const pollCountRef = useRef(0);
  const dojahScriptRef = useRef(null);
  const signalRFallbackTimerRef = useRef(null);
  const signalRListenerActiveRef = useRef(false);
  
  // Essential user data for verification (keep minimal for verification functionality)
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get token and user ID from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");

  const effectRan = useRef(false);

  // Dojah configuration
  const dojahAppId = config.DOJAH.APP_ID;
  const dojahPublicKey = config.DOJAH.PUBLIC_KEY;
  const dojahWidgetId = config.DOJAH.WIDGET_ID;

  // Fetch essential user data for verification pre-filling
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      const response = await userService.getProfile();
      
      if (isMountedRef.current) {
        if (response && response.success && response.data) {
          setUserData(response.data);
        } else {
          setUserData(userDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      if (isMountedRef.current) {
        setUserData(userDetails);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Stop all verification listeners/polling
  const stopVerificationListeners = useCallback(() => {
    // Stop fallback polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    // Clear the SignalR fallback timer
    if (signalRFallbackTimerRef.current) {
      clearTimeout(signalRFallbackTimerRef.current);
      signalRFallbackTimerRef.current = null;
    }
    // Remove SignalR verification listener
    if (signalRListenerActiveRef.current) {
      signalRNotificationService.onVerificationStatusChanged(null);
      signalRListenerActiveRef.current = false;
    }
  }, []);

  // Handle a final verification result (success or failure) from any source
  const handleVerificationResult = useCallback((result) => {
    if (!isMountedRef.current) return;

    stopVerificationListeners();

    if (result.isVerified) {
      setVerificationStatus(prev => ({ ...prev, hasSuccess: true, hasPending: false, hasFailed: false }));
      setProgress(100);
      setProgressMessage("Verification confirmed!");
      setWidgetCompleted(false);
      setIsSubmitting(false);

      // Update global context with confirmed data
      updateVerificationStatus();

      setModalTitle('Verification Successful!');
      setModalDescription('Your identity has been verified. You can now proceed to your assessment.');
      setButtonText('Start Assessment');
      setButtonBgColor('#00B4A6');
      setIsError(false);
      setIsModalOpen(true);

      setTimeout(() => { if (isMountedRef.current) { setProgress(0); setProgressMessage(""); } }, 2000);
    } else {
      // Failed
      setVerificationStatus(prev => ({ ...prev, hasSuccess: false, hasPending: false, hasFailed: true }));
      setProgress(0);
      setProgressMessage("");
      setWidgetCompleted(false);
      setIsSubmitting(false);

      setModalTitle('Verification Failed');
      setModalDescription('Your verification could not be completed. Please try again or contact support.');
      setButtonText('Try Again');
      setButtonBgColor('#FF4B4B');
      setIsError(true);
      setIsModalOpen(true);
    }
  }, [stopVerificationListeners, updateVerificationStatus]);

  // Fallback polling — starts after 15s if SignalR hasn't delivered a final result
  const startFallbackPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling
    pollCountRef.current = 0;

    const maxPolls = 18; // 18 × 10s = ~3 minutes
    const pollInterval = 10000;

    const poll = async () => {
      pollCountRef.current += 1;

      try {
        const status = await verificationService.getVerificationStatus(
          userDetails.id,
          "caregiver"
        );

        if (!isMountedRef.current) return;

        if (status.hasSuccess) {
          handleVerificationResult({ isVerified: true });
          return;
        }

        if (status.hasFailed) {
          handleVerificationResult({ isVerified: false, verificationStatus: 'failed' });
          return;
        }

        if (status.hasPending) {
          setVerificationStatus(status);
          const progressPct = Math.min(60 + Math.floor((pollCountRef.current / maxPolls) * 30), 90);
          setProgress(progressPct);
          setProgressMessage("Verification is being processed...");
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      if (pollCountRef.current >= maxPolls) {
        stopVerificationListeners();
        if (isMountedRef.current) {
          setProgress(0);
          setProgressMessage("");
          setWidgetCompleted(false);
          setIsSubmitting(false);
          setVerificationStatus(prev => prev ? { ...prev, hasPending: true } : { hasPending: true });
          setVerificationPending();

          setModalTitle('Verification Processing');
          setModalDescription('Your verification has been submitted and is being processed. This may take a few minutes. You can check back shortly.');
          setButtonText('Go to Dashboard');
          setButtonBgColor('#00B4A6');
          setIsError(false);
          setIsModalOpen(true);
        }
      }
    };

    poll(); // First check immediately
    pollingRef.current = setInterval(poll, pollInterval);
  }, [userDetails.id, handleVerificationResult, stopVerificationListeners, setVerificationPending]);

  // Start listening for verification status via SignalR (primary) + fallback polling after 15s
  const startVerificationListener = useCallback(() => {
    setProgress(60);
    setProgressMessage("Confirming verification with our servers...");

    // 1. Register SignalR listener for real-time updates
    signalRListenerActiveRef.current = true;
    signalRNotificationService.onVerificationStatusChanged((data) => {
      if (!isMountedRef.current) return;
      // Only handle events for the current user
      if (data.userId && data.userId !== userDetails.id) return;

      if (data.isVerified) {
        handleVerificationResult({ isVerified: true, verificationMethod: data.verificationMethod });
      } else if (data.verificationStatus === 'failed') {
        handleVerificationResult({ isVerified: false, verificationStatus: 'failed' });
      }
      // "pending" events — just update progress message
      if (data.verificationStatus === 'pending') {
        setProgressMessage("Verification is being processed...");
      }
    });

    // 2. Ensure SignalR is connected (it may already be from app init)
    if (!signalRNotificationService.isConnected()) {
      signalRNotificationService.connect(token, userDetails.id).catch((err) => {
        console.error('SignalR connect failed during verification:', err);
      });
    }

    // 3. After 15 seconds without a final SignalR event, start fallback polling
    signalRFallbackTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && signalRListenerActiveRef.current) {
        startFallbackPolling();
      }
    }, 15000);
  }, [userDetails.id, token, handleVerificationResult, startFallbackPolling]);

  // Load Dojah Connect script and open the overlay widget
  const openDojahWidget = useCallback(() => {
    const currentUser = userData || userDetails;

    const launchWidget = () => {
      if (!window.Connect) {
        setIsSubmitting(false);
        setProgress(0);
        setProgressMessage("");
        setModalTitle('Verification Error');
        setModalDescription('Failed to load the verification widget. Please refresh and try again.');
        setButtonText('OK');
        setButtonBgColor('#FF4B4B');
        setIsError(true);
        setIsModalOpen(true);
        return;
      }

      const options = {
        app_id: dojahAppId,
        p_key: dojahPublicKey,
        type: 'custom',
        config: {
          debug: config.ENV.DEBUG,
          widget_id: dojahWidgetId,
          pages: [
            {
              page: 'government-data',
              config: {
                bvn: true,
                nin: true,
                dl: false,
                mobile: false,
                otp: true,
                selfie: false,
              },
            },
            { page: 'selfie' },
          ],
        },
        user_data: {
          first_name: currentUser?.firstName || '',
          last_name: currentUser?.lastName || '',
          dob: currentUser?.dateOfBirth || '',
          email: currentUser?.email || '',
          residence_country: currentUser?.country || 'NG',
        },
        metadata: {
          user_id: currentUser?.id || userDetails.id || '',
          user_type: 'caregiver',
          reference_id: `caregiver_${currentUser?.id || userDetails.id}_${Date.now()}`,
        },
        onSuccess: (data) => {
          if (!isMountedRef.current) return;
          widgetCompletedRef.current = true;
          setWidgetCompleted(true);
          // Immediately mark as pending in global context so ProfileHeader reflects it
          setVerificationPending();
          startVerificationListener();
        },
        onError: (err) => {
          if (!isMountedRef.current) return;
          setIsSubmitting(false);
          setProgress(0);
          setProgressMessage("");
          setModalTitle('Verification Error');
          setModalDescription(
            (err?.message || 'An error occurred during verification.') +
            ' Please try again.'
          );
          setButtonText('Try Again');
          setButtonBgColor('#FF4B4B');
          setIsError(true);
          setIsModalOpen(true);
        },
        onClose: () => {
          if (!isMountedRef.current) return;
          // Only reset if widget didn't complete successfully
          if (!widgetCompletedRef.current) {
            setIsSubmitting(false);
            setProgress(0);
            setProgressMessage("");
          }
        },
      };

      const connect = new window.Connect(options);
      connect.setup();
      connect.open();

      if (isMountedRef.current) {
        setProgress(30);
        setProgressMessage("Verification in progress...");
      }
    };

    // If Connect is already loaded, launch immediately
    if (window.Connect) {
      launchWidget();
      return;
    }

    // Load the Dojah widget script
    setProgress(15);
    setProgressMessage("Loading verification widget...");

    const script = document.createElement('script');
    script.src = DOJAH_WIDGET_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (isMountedRef.current) launchWidget();
    };
    script.onerror = () => {
      if (isMountedRef.current) {
        setIsSubmitting(false);
        setProgress(0);
        setProgressMessage("");
        setModalTitle('Verification Error');
        setModalDescription('Failed to load the verification widget. Please check your internet connection and try again.');
        setButtonText('Try Again');
        setButtonBgColor('#FF4B4B');
        setIsError(true);
        setIsModalOpen(true);
      }
      // Clean up script tag
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    dojahScriptRef.current = script;
    document.head.appendChild(script);
  }, [userData, userDetails, dojahAppId, dojahPublicKey, dojahWidgetId, startVerificationListener]);

  useEffect(() => {
    // Skip the second run caused by Strict Mode in development
    if (effectRan.current) return;
    effectRan.current = true;

    // Redirect if no token or user ID
    if (!token || !userDetails.id) {
      navigate("/login");
      return;
    }

    isMountedRef.current = true;

    fetchProfileData();

    // Check initial verification status
    const checkStatus = async () => {
      try {
        if (isMountedRef.current) {
          setProgress(10);
          setProgressMessage("Checking verification status...");
        }

        const status = await verificationService.getVerificationStatus(
          userDetails.id,
          "caregiver"
        );

        if (isMountedRef.current) {
          setVerificationStatus(status);
          setProgress(0);
          setProgressMessage("");
          
          if (status.hasSuccess) {
            setModalTitle('Account Already Verified!');
            setModalDescription('Your identity has been successfully verified. You can now proceed to start your assessment.');
            setButtonText('Start Assessment');
            setButtonBgColor('#00B4A6');
            setIsError(false);
            setIsModalOpen(true);
          } else if (status.hasPending) {
            setModalTitle('Verification In Progress');
            setModalDescription('Your verification is being processed. You will be notified when complete. Estimated processing time: 24-48 hours.');
            setButtonText('OK');
            setButtonBgColor('#00B4A6');
            setIsError(false);
            setIsModalOpen(true);
          }
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
        if (isMountedRef.current) {
          setProgress(0);
          setProgressMessage("");
        }
      }
    };

    checkStatus();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (signalRFallbackTimerRef.current) clearTimeout(signalRFallbackTimerRef.current);
      if (signalRListenerActiveRef.current) {
        signalRNotificationService.onVerificationStatusChanged(null);
        signalRListenerActiveRef.current = false;
      }
      // Clean up Dojah script if still in DOM
      if (dojahScriptRef.current && dojahScriptRef.current.parentNode) {
        dojahScriptRef.current.parentNode.removeChild(dojahScriptRef.current);
      }
    };
  }, []);

  const handleStartVerification = () => {
    // Guard: prevent duplicate verification if already pending or completed
    if (verificationStatus?.hasSuccess || verificationStatus?.hasPending) {
      return;
    }

    if (!dojahAppId || !dojahPublicKey) {
      setModalTitle('Configuration Error');
      setModalDescription('Verification service is not properly configured. Please contact support for assistance.');
      setButtonText('OK');
      setButtonBgColor('#FF4B4B');
      setIsError(true);
      setIsModalOpen(true);
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setWidgetCompleted(false);
    widgetCompletedRef.current = false;
    setProgress(10);
    setProgressMessage("Initializing verification...");
    openDojahWidget();
  };

  // Modal handlers
  const handleModalProceed = () => {
    setIsModalOpen(false);
    if (modalTitle === 'Account Already Verified!' || modalTitle === 'Verification Successful!') {
      navigate("/app/caregiver/assessments");
    } else if (modalTitle === 'Verification Processing' || modalTitle === 'Verification In Progress') {
      navigate("/app/caregiver/dashboard");
    } else if (modalTitle === 'Verification Error' || modalTitle === 'Verification Failed') {
      setWidgetCompleted(false);
    }
  };

  // Build user data for display
  const currentUser = userData || userDetails;

  return (
    <div className="mobile-verification-page">
      <Helmet>
        <title>Account Verification - CareGiver | CarePro</title>
        <meta 
          name="description" 
          content="Verify your identity to access all caregiver features and start connecting with families who need care services." 
        />
        <meta name="keywords" content="caregiver verification, identity verification, KYC, caregiver profile" />
      </Helmet>

      <div className="mobile-verification-container fade-in">
        <div className="content-wrapper">
          {/* Polling / Loading State — takes over the entire content area during verification */}
          {(progress > 0 || progressMessage) ? (
            <div className="verification-card">
              <div className="verification-content">
                <div className="verification-polling-state">
                  <div className="progress-spinner-icon">
                    <i className="fas fa-circle-notch fa-spin"></i>
                  </div>
                  <h2>{widgetCompleted ? "Confirming Verification" : "Verification In Progress"}</h2>
                  <div className="progress-circle">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{progress}%</span>
                  </div>
                  {progressMessage && (
                    <p className="progress-message">{progressMessage}</p>
                  )}
                  {widgetCompleted && (
                    <p className="progress-sub-message">Please wait while we confirm your verification. Do not leave this page.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
          /* Account Verification Card — shown when not loading/polling */
            <div className="verification-card">
              <div className="verification-content">
                <h2>Account Verification</h2>
                <p className="verification-subtitle">
                  To ensure the safety of our clients and maintain high-quality services, we require all 
                  caregivers to verify their identity. Please choose a verification method below.
                </p>

                {/* Verification Instructions */}
                <div className="verification-instructions">
                  <div className="instruction-item">
                    <div className="instruction-icon">
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div className="instruction-content">
                      <h4>Government ID verification</h4>
                      <p>Get verified with your Bank verification Number</p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <div className="instruction-icon">
                      <i className="fas fa-mobile-alt"></i>
                    </div>
                    <div className="instruction-content">
                      <h4>NIN Verification</h4>
                      <p>Get verified with your National Identification Number</p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <div className="instruction-icon">
                      <i className="fas fa-camera"></i>
                    </div>
                    <div className="instruction-content">
                      <h4>Selfie Verification</h4>
                      <p>Take a selfie to confirm your identity</p>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}

                {/* Verification Status Display */}
                {verificationStatus?.hasSuccess && (
                  <div className="verification-status verified">
                    <h3>✅ Account Verified</h3>
                    <p>Your identity has been successfully verified!</p>
                    <button
                      type="button"
                      onClick={() => navigate("/app/caregiver/assessments")}
                      className="proceed-btn start-assessment"
                    >
                      Start Assessment
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                )}

                {verificationStatus?.hasPending && !verificationStatus?.hasSuccess && (
                  <div className="verification-status pending">
                    <h3>⏳ Verification Pending</h3>
                    <p>Your verification is being processed. You will be notified when complete.</p>
                    <div className="pending-info">
                      <p>Estimated processing time: 24-48 hours</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/app/caregiver/dashboard")}
                      className="proceed-btn"
                    >
                      Go to Dashboard
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                )}

                {/* Start / Retry Verification Button — hidden while polling */}
                {!verificationStatus?.hasSuccess && !verificationStatus?.hasPending && !isSubmitting && (
                  <div>
                    <div className="user-info-notice">
                      <div className="notice-icon">
                        <i className="fas fa-info-circle"></i>
                      </div>
                      <div className="notice-content">
                        <p>
                          <strong>Verification Process:</strong> Complete your identity verification 
                          right here — no need to leave this page. Your information
                          {(() => {
                            const name = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();
                            const email = currentUser?.email || '';
                            if (name && email) return ` (${name}, ${email})`;
                            if (name) return ` (${name})`;
                            if (email) return ` (${email})`;
                            return '';
                          })()}
                          {' '}will be pre-filled.
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleStartVerification}
                      disabled={isSubmitting || isLoading}
                      className="proceed-btn start-verification"
                    >
                      {isSubmitting ? "Processing..." : (verificationStatus?.hasFailed ? "Retry Verification" : "Start Verification")}
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                )}

                {/* Additional Info */}
                <div className="verification-info">
                  <p className="privacy-note">
                    🔒 Your data is protected with bank-level security and encryption.
                  </p>
                  <p className="time-note">
                    ⏱️ Verification typically takes 2-5 minutes to complete.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Success/Error Feedback */}
      <Modal
        isOpen={isModalOpen}
        title={modalTitle}
        description={modalDescription}
        buttonText={buttonText}
        buttonBgColor={buttonBgColor}
        isError={isError}
        onProceed={handleModalProceed}
      />
    </div>
  );
};

export default CaregiverVerificationPage;