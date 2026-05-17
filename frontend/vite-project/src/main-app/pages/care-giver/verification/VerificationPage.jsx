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
import useVerificationGate from "../../../hooks/useVerificationGate";
import { initiateSession as initiateDojahSession } from "../../../services/dojahGateService";
import VerificationGateState from "../../../components/verification/VerificationGateState";

const DOJAH_WIDGET_SCRIPT = 'https://widget.dojah.io/widget.js';

const CaregiverVerificationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { updateVerificationStatus, setVerificationPending } = useCaregiverStatus();
  const { gate, loading: gateLoading, refresh: refreshGate, applyGate } = useVerificationGate();
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

    // Refresh gate so the UI lands on already_verified / cooldown_active /
    // max_attempts_reached / pending_review based on the latest server state.
    refreshGate();
  }, [stopVerificationListeners, updateVerificationStatus, refreshGate]);

  // Fallback polling — starts after 15s if SignalR hasn't delivered a final result
  const startFallbackPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling
    pollCountRef.current = 0;

    const maxPolls = 6; // 6 × 5s = ~30 seconds
    const pollInterval = 5000;

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
          setModalDescription('Your verification has been submitted and is being processed. You can start creating draft gigs while you wait!');
          setButtonText('Go to Profile');
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

    // 1. Register SignalR listener for real-time updates.
    // Backend payload: { userId, verificationStatus, isVerified, verificationMethod, timestamp }
    // verificationStatus is one of (lowercase): 'success' | 'pending' | 'failed'.
    // 'failed' covers both verification failure AND widget abandonment — backend
    // does not differentiate, so we show a single "Try again" CTA for both.
    // We trust `isVerified` directly (backend now sets it correctly for success).
    signalRListenerActiveRef.current = true;
    signalRNotificationService.onVerificationStatusChanged((data) => {
      if (!isMountedRef.current) return;
      // Only handle events for the current user
      if (data.userId && data.userId !== userDetails.id) return;

      const status = (data.verificationStatus || '').toString().toLowerCase();

      if (data.isVerified === true || status === 'success') {
        handleVerificationResult({ isVerified: true, verificationMethod: data.verificationMethod });
      } else if (status === 'failed') {
        handleVerificationResult({ isVerified: false, verificationStatus: 'failed' });
      } else if (status === 'pending') {
        // Pending events — just update progress message; keep listening for final result
        setProgressMessage("Verification is being processed...");
      }
    });

    // 2. Ensure SignalR is connected (it may already be from app init)
    if (!signalRNotificationService.isConnected()) {
      signalRNotificationService.connect(token, userDetails.id).catch((err) => {
        console.error('SignalR connect failed during verification:', err);
      });
    }

    // 3. After 10 seconds without a final SignalR event, start fallback polling
    signalRFallbackTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && signalRListenerActiveRef.current) {
        startFallbackPolling();
      }
    }, 10000);
  }, [userDetails.id, token, handleVerificationResult, startFallbackPolling]);

  // Load Dojah Connect script and open the overlay widget.
  // The session object is the response from POST /Dojah/initiate-session and
  // carries the server-signed referenceId + userType that MUST be passed to
  // the widget so the webhook can be matched back to this user.
  const openDojahWidget = useCallback((session) => {
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
        // Top-level reference_id (Dojah promotes this) — must be the
        // server-issued ID from /Dojah/initiate-session.
        reference_id: session.referenceId,
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
          user_id: session.userId || currentUser?.id || userDetails.id || '',
          // userType comes from the server ("Caregiver" or "Client") and is
          // critical for the webhook to route results to the correct profile.
          user_type: session.userType,
          // Redundant copy — backend uses metadata.reference_id as fallback
          // when Dojah's nested envelope omits the top-level reference_id.
          reference_id: session.referenceId,
          platform: 'web',
          timestamp: new Date().toISOString(),
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

  // Map a blocked-gate response (from initiate-session 403 OR eligibility) to a modal.
  const showGateBlockedModal = useCallback((blockedGate) => {
    const reason = blockedGate?.reason;
    let title = 'Verification Unavailable';
    let description = 'Verification is not available right now. Please try again later.';

    if (reason === 'already_verified') {
      title = 'Already Verified';
      description = 'Your identity has already been verified.';
    } else if (reason === 'pending_review') {
      title = 'Verification Under Review';
      description = 'Your verification is under review. We will notify you of the result.';
    } else if (reason === 'cooldown_active') {
      title = 'Please Wait Before Retrying';
      description = 'You recently attempted verification. Please wait until the cooldown ends before trying again.';
    } else if (reason === 'max_attempts_reached') {
      title = 'Maximum Attempts Reached';
      description = 'You have reached the maximum number of verification attempts. Please contact support.';
    }

    setModalTitle(title);
    setModalDescription(description);
    setButtonText('OK');
    setButtonBgColor('#FF4B4B');
    setIsError(true);
    setIsModalOpen(true);
  }, []);

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
            setModalDescription('Your verification is being processed. You can start creating draft gigs while you wait!');
            setButtonText('Go to Profile');
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

  const handleStartVerification = async () => {
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
    setProgressMessage("Requesting verification session...");

    // Server-side gate: must succeed before opening the (paid) widget.
    let session;
    try {
      const result = await initiateDojahSession();
      session = result?.session;
      if (!session?.referenceId) {
        throw new Error('Malformed initiate-session response (missing referenceId)');
      }
      // Sync the gate state with the new attempt count returned by the server.
      if (result?.gate) applyGate(result.gate);
    } catch (err) {
      setIsSubmitting(false);
      setProgress(0);
      setProgressMessage("");
      // 403 -> body is the gate object; render the matching blocked state.
      const blockedGate = err?.response?.status === 403 ? err.response.data : null;
      if (blockedGate) {
        applyGate(blockedGate);
        showGateBlockedModal(blockedGate);
      } else {
        setModalTitle('Verification Unavailable');
        setModalDescription('We could not start verification right now. Please try again in a moment.');
        setButtonText('OK');
        setButtonBgColor('#FF4B4B');
        setIsError(true);
        setIsModalOpen(true);
      }
      return;
    }

    setProgress(20);
    setProgressMessage("Initializing verification...");
    openDojahWidget(session);
  };

  // Modal handlers
  const handleModalProceed = () => {
    setIsModalOpen(false);
    if (modalTitle === 'Account Already Verified!' || modalTitle === 'Verification Successful!') {
      navigate("/app/caregiver/assessments");
    } else if (modalTitle === 'Verification Processing' || modalTitle === 'Verification In Progress') {
      navigate("/app/caregiver/profile", { state: { verificationStatus: 'pending' } });
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
                    <p className="progress-sub-message">Confirming your verification — this should only take a moment.</p>
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

                {/* Server-driven gate states (already_verified, pending_review,
                    cooldown_active, max_attempts_reached). Renders nothing
                    when the user is eligible. */}
                {gate && gate.reason !== 'eligible' && (
                  <VerificationGateState
                    gate={gate}
                    onProceed={
                      gate.reason === 'already_verified'
                        ? () => navigate("/app/caregiver/assessments")
                        : undefined
                    }
                    proceedLabel="Start Assessment"
                    onCooldownExpire={refreshGate}
                  />
                )}

                {/* Start / Retry Verification Button — only when eligible */}
                {gate?.isEligible && !isSubmitting && (
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
                      disabled={isSubmitting || isLoading || gateLoading}
                      className="proceed-btn start-verification"
                    >
                      {isSubmitting
                        ? "Processing..."
                        : ((gate?.attemptCount ?? 0) > 0 ? "Retry Verification" : "Start Verification")}
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
                    ⏱️ The widget steps take a few minutes. Results are confirmed in real time — if manual review is required, you will be notified when complete.
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