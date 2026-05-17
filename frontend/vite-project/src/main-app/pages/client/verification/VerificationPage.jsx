import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../care-giver/verification/verification-page.css";
import "../../care-giver/verification/verification-page-footer.css";
import "../../care-giver/verification/mobile-verification.css";
import "../../care-giver/verification/dojah-widget-fix.css";
import verificationService from "../../../services/verificationService";
import { userService } from "../../../services/userService";
import { Helmet } from "react-helmet-async";
import config from "../../../config";
import Modal from "../../../components/modal/Modal";
import signalRNotificationService from "../../../services/signalRNotificationService";
import useVerificationGate from "../../../hooks/useVerificationGate";
import { initiateSession as initiateDojahSession } from "../../../services/dojahGateService";
import VerificationGateState from "../../../components/verification/VerificationGateState";

/**
 * ClientVerificationPage
 *
 * Mirrors the caregiver Dojah widget flow for the Client role. The backend
 * gate (GET /Dojah/eligibility, POST /Dojah/initiate-session) is the single
 * source of truth for whether the widget may be opened, and which
 * referenceId/userType to pass to it.
 */

const DOJAH_WIDGET_SCRIPT = 'https://widget.dojah.io/widget.js';

const ClientVerificationPage = () => {
  const navigate = useNavigate();
  const { gate, loading: gateLoading, refresh: refreshGate, applyGate } = useVerificationGate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const [widgetCompleted, setWidgetCompleted] = useState(false);
  const widgetCompletedRef = useRef(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonBgColor, setButtonBgColor] = useState('');
  const [isError, setIsError] = useState(false);

  // Refs for stable lifecycle
  const isMountedRef = useRef(true);
  const pollingRef = useRef(null);
  const pollCountRef = useRef(0);
  const dojahScriptRef = useRef(null);
  const signalRFallbackTimerRef = useRef(null);
  const signalRListenerActiveRef = useRef(false);

  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");
  const effectRan = useRef(false);

  const dojahAppId = config.DOJAH.APP_ID;
  const dojahPublicKey = config.DOJAH.PUBLIC_KEY;
  const dojahWidgetId = config.DOJAH.WIDGET_ID;

  // Pre-fill widget user data from the client profile when available.
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getProfile();
      if (!isMountedRef.current) return;
      if (response && response.success && response.data) {
        setUserData(response.data);
      } else {
        setUserData(userDetails);
      }
    } catch (err) {
      console.error('ClientVerification: profile load failed', err);
      if (isMountedRef.current) setUserData(userDetails);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const stopVerificationListeners = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (signalRFallbackTimerRef.current) {
      clearTimeout(signalRFallbackTimerRef.current);
      signalRFallbackTimerRef.current = null;
    }
    if (signalRListenerActiveRef.current) {
      signalRNotificationService.onVerificationStatusChanged(null);
      signalRListenerActiveRef.current = false;
    }
  }, []);

  const handleVerificationResult = useCallback((result) => {
    if (!isMountedRef.current) return;
    stopVerificationListeners();

    if (result.isVerified) {
      setProgress(100);
      setProgressMessage("Verification confirmed!");
      setWidgetCompleted(false);
      setIsSubmitting(false);

      setModalTitle('Verification Successful!');
      setModalDescription('Your identity has been verified.');
      setButtonText('Continue');
      setButtonBgColor('#00B4A6');
      setIsError(false);
      setIsModalOpen(true);

      setTimeout(() => {
        if (isMountedRef.current) { setProgress(0); setProgressMessage(""); }
      }, 2000);
    } else {
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

    // Pull fresh gate state (already_verified / cooldown_active / etc.).
    refreshGate();
  }, [stopVerificationListeners, refreshGate]);

  // Fallback polling — starts after 10s if SignalR hasn't delivered a final result.
  const startFallbackPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollCountRef.current = 0;
    const maxPolls = 6;
    const pollInterval = 5000;

    const poll = async () => {
      pollCountRef.current += 1;
      try {
        const status = await verificationService.getVerificationStatus(
          userDetails.id,
          "client"
        );
        if (!isMountedRef.current) return;
        if (status.hasSuccess) { handleVerificationResult({ isVerified: true }); return; }
        if (status.hasFailed) { handleVerificationResult({ isVerified: false }); return; }
        if (status.hasPending) {
          const pct = Math.min(60 + Math.floor((pollCountRef.current / maxPolls) * 30), 90);
          setProgress(pct);
          setProgressMessage("Verification is being processed...");
        }
      } catch (err) {
        console.error('ClientVerification polling error:', err);
      }

      if (pollCountRef.current >= maxPolls) {
        stopVerificationListeners();
        if (isMountedRef.current) {
          setProgress(0);
          setProgressMessage("");
          setWidgetCompleted(false);
          setIsSubmitting(false);
          setModalTitle('Verification Processing');
          setModalDescription('Your verification has been submitted and is being processed. We will notify you once it completes.');
          setButtonText('OK');
          setButtonBgColor('#00B4A6');
          setIsError(false);
          setIsModalOpen(true);
          refreshGate();
        }
      }
    };

    poll();
    pollingRef.current = setInterval(poll, pollInterval);
  }, [userDetails.id, handleVerificationResult, stopVerificationListeners, refreshGate]);

  // SignalR (primary) + fallback polling after 10s.
  const startVerificationListener = useCallback(() => {
    setProgress(60);
    setProgressMessage("Confirming verification with our servers...");

    signalRListenerActiveRef.current = true;
    signalRNotificationService.onVerificationStatusChanged((data) => {
      if (!isMountedRef.current) return;
      if (data.userId && data.userId !== userDetails.id) return;
      const status = (data.verificationStatus || '').toString().toLowerCase();
      if (data.isVerified === true || status === 'success') {
        handleVerificationResult({ isVerified: true, verificationMethod: data.verificationMethod });
      } else if (status === 'failed') {
        handleVerificationResult({ isVerified: false });
      } else if (status === 'pending') {
        setProgressMessage("Verification is being processed...");
      }
    });

    if (!signalRNotificationService.isConnected()) {
      signalRNotificationService.connect(token, userDetails.id).catch((err) => {
        console.error('SignalR connect failed during verification:', err);
      });
    }

    signalRFallbackTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && signalRListenerActiveRef.current) {
        startFallbackPolling();
      }
    }, 10000);
  }, [userDetails.id, token, handleVerificationResult, startFallbackPolling]);

  // Open the Dojah widget using the server-issued session.
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
        // Top-level reference_id (Dojah promotes this) — server-issued.
        reference_id: session.referenceId,
        config: {
          debug: config.ENV.DEBUG,
          widget_id: dojahWidgetId,
          pages: [
            {
              page: 'government-data',
              config: { bvn: true, nin: true, dl: false, mobile: false, otp: true, selfie: false },
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
          // user_type comes from the server ("Client") so the webhook routes
          // the result to Client.IsIdentityVerified.
          user_type: session.userType,
          // Redundant copy — backend uses metadata.reference_id as fallback.
          reference_id: session.referenceId,
          platform: 'web',
          timestamp: new Date().toISOString(),
        },
        onSuccess: () => {
          if (!isMountedRef.current) return;
          widgetCompletedRef.current = true;
          setWidgetCompleted(true);
          startVerificationListener();
        },
        onError: (err) => {
          if (!isMountedRef.current) return;
          setIsSubmitting(false);
          setProgress(0);
          setProgressMessage("");
          setModalTitle('Verification Error');
          setModalDescription((err?.message || 'An error occurred during verification.') + ' Please try again.');
          setButtonText('Try Again');
          setButtonBgColor('#FF4B4B');
          setIsError(true);
          setIsModalOpen(true);
        },
        onClose: () => {
          if (!isMountedRef.current) return;
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

    if (window.Connect) {
      launchWidget();
      return;
    }

    setProgress(15);
    setProgressMessage("Loading verification widget...");

    const script = document.createElement('script');
    script.src = DOJAH_WIDGET_SCRIPT;
    script.async = true;
    script.onload = () => { if (isMountedRef.current) launchWidget(); };
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
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    dojahScriptRef.current = script;
    document.head.appendChild(script);
  }, [userData, userDetails, dojahAppId, dojahPublicKey, dojahWidgetId, startVerificationListener]);

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
    if (effectRan.current) return;
    effectRan.current = true;

    if (!token || !userDetails.id) {
      navigate("/login");
      return;
    }
    isMountedRef.current = true;
    fetchProfileData();

    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (signalRFallbackTimerRef.current) clearTimeout(signalRFallbackTimerRef.current);
      if (signalRListenerActiveRef.current) {
        signalRNotificationService.onVerificationStatusChanged(null);
        signalRListenerActiveRef.current = false;
      }
      if (dojahScriptRef.current && dojahScriptRef.current.parentNode) {
        dojahScriptRef.current.parentNode.removeChild(dojahScriptRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartVerification = async () => {
    if (!dojahAppId || !dojahPublicKey) {
      setModalTitle('Configuration Error');
      setModalDescription('Verification service is not properly configured. Please contact support for assistance.');
      setButtonText('OK');
      setButtonBgColor('#FF4B4B');
      setIsError(true);
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setWidgetCompleted(false);
    widgetCompletedRef.current = false;
    setProgress(10);
    setProgressMessage("Requesting verification session...");

    let session;
    try {
      const result = await initiateDojahSession();
      session = result?.session;
      if (!session?.referenceId) {
        throw new Error('Malformed initiate-session response (missing referenceId)');
      }
      if (result?.gate) applyGate(result.gate);
    } catch (err) {
      setIsSubmitting(false);
      setProgress(0);
      setProgressMessage("");
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

  const handleModalProceed = () => {
    setIsModalOpen(false);
    if (modalTitle === 'Verification Successful!' || modalTitle === 'Already Verified') {
      navigate('/app/client/profile');
    }
  };

  const currentUser = userData || userDetails;

  return (
    <div className="mobile-verification-page">
      <Helmet>
        <title>Account Verification - Client | CarePro</title>
        <meta
          name="description"
          content="Verify your identity to unlock the full CarePro experience and connect with trusted caregivers."
        />
      </Helmet>

      <div className="mobile-verification-container fade-in">
        <div className="content-wrapper">
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
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">{progress}%</span>
                  </div>
                  {progressMessage && <p className="progress-message">{progressMessage}</p>}
                  {widgetCompleted && (
                    <p className="progress-sub-message">
                      Confirming your verification — this should only take a moment.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="verification-card">
              <div className="verification-content">
                <h2>Account Verification</h2>
                <p className="verification-subtitle">
                  We verify the identity of all clients to protect the care professionals on our platform.
                  Every caregiver who works through CarePro is a real person — and they deserve to know the
                  clients they serve are too. This step keeps our community safe and trustworthy for everyone.
                </p>

                <div className="verification-instructions">
                  <div className="instruction-item">
                    <div className="instruction-icon"><i className="fas fa-id-card"></i></div>
                    <div className="instruction-content">
                      <h4>Government ID verification</h4>
                      <p>Get verified with your Bank Verification Number</p>
                    </div>
                  </div>
                  <div className="instruction-item">
                    <div className="instruction-icon"><i className="fas fa-mobile-alt"></i></div>
                    <div className="instruction-content">
                      <h4>NIN Verification</h4>
                      <p>Get verified with your National Identification Number</p>
                    </div>
                  </div>
                  <div className="instruction-item">
                    <div className="instruction-icon"><i className="fas fa-camera"></i></div>
                    <div className="instruction-content">
                      <h4>Selfie Verification</h4>
                      <p>Take a selfie to confirm your identity</p>
                    </div>
                  </div>
                </div>

                {/* Server-driven gate states */}
                {gate && gate.reason !== 'eligible' && (
                  <VerificationGateState
                    gate={gate}
                    onProceed={
                      gate.reason === 'already_verified'
                        ? () => navigate('/app/client/profile')
                        : undefined
                    }
                    proceedLabel="Go to Profile"
                    onCooldownExpire={refreshGate}
                  />
                )}

                {gate?.isEligible && !isSubmitting && (
                  <div>
                    <div className="user-info-notice">
                      <div className="notice-icon"><i className="fas fa-info-circle"></i></div>
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

export default ClientVerificationPage;
