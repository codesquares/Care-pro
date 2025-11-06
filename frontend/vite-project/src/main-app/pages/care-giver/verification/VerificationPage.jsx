import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import "./verification-page.css";
import "./verification-page-footer.css";
import "./mobile-verification.css";
import "./dojah-widget-fix.css";
import "../care-giver-profile/profile-header.css";
import verificationService from "../../../services/verificationService";
import { userService } from "../../../services/userService";
import { Helmet } from "react-helmet-async";
import config from "../../../config";
import Modal from "../../../components/modal/Modal";

const CaregiverVerificationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [verificationMethod, setVerificationMethod] = useState("dojah");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  
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
  
  // Profile-related state variables (from ProfileHeader)
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [memberSince, setMemberSince] = useState('');
  const [lastDelivery, setLastDelivery] = useState('');
  const [location, setLocation] = useState('');

  // Get token and user ID from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");

  const effectRan = useRef(false);
  
  // Helper function to render stars
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <i key={`full-${i}`} className="fas fa-star"></i>
        ))}
        {hasHalfStar && <i className="fas fa-star-half-alt"></i>}
        {[...Array(emptyStars)].map((_, i) => (
          <i key={`empty-${i}`} className="far fa-star"></i>
        ))}
      </>
    );
  };

  // Dojah configuration object
  const dojahConfig = {
    WIDGET_ID: config.DOJAH.WIDGET_ID,
    WIDGET_URL: `https://identity.dojah.io?widget_id=${config.DOJAH.WIDGET_ID}`,
    APP_ID: config.DOJAH.APP_ID,
    PUBLIC_KEY: config.DOJAH.PUBLIC_KEY
  };

  console.log('🔧 Dojah configuration loaded:', {
    widgetURL: dojahConfig.WIDGET_URL,
    widgetID: dojahConfig.WIDGET_ID,
    appID: dojahConfig.APP_ID,
    hasPublicKey: !!dojahConfig.PUBLIC_KEY,
    configSource: 'Environment Variables'
  });

  // Fetch profile data function
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile data
      const response = await userService.getProfile();
      
      if (isMountedRef.current) {
        if (response && response.success && response.data) {
          const profileData = response.data;
          setUserData(profileData);
          setUserRating(parseFloat(profileData.averageRating || profileData.rating || 0));
          setReviewCount(parseInt(profileData.reviewCount || profileData.reviewsCount || 0));
          setLocation(profileData.location || 'Location not specified');
          
          // Format member since date
          if (profileData.createdAt) {
            const memberDate = new Date(profileData.createdAt);
            setMemberSince(memberDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            }));
          } else {
            setMemberSince('Member since signup');
          }
          
          console.log('✅ Profile data loaded successfully:', profileData);
        } else {
          console.log('❌ No profile data found, using userDetails from localStorage');
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

  useEffect(() => {
    // Skip the second run caused by Strict Mode in development
    if (effectRan.current) return;
    effectRan.current = true;

    // Request notification permission for completion alerts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    // Redirect if no token or user ID
    if (!token || !userDetails.id) {
      navigate("/login");
      return;
    }

    // Set mounted flag
    isMountedRef.current = true;

    // Fetch profile data
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

    // Run verification check
    checkStatus();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debug effect to monitor user data changes
  useEffect(() => {
    console.log('🔍 User data state changed:', {
      userData: userData,
      userDetails: userDetails,
      localStorage: JSON.parse(localStorage.getItem("userDetails") || "{}"),
      timestamp: new Date().toISOString()
    });
  }, [userData, userDetails]);

  // Safe state update functions that check if component is still mounted
  const safeSetProgress = (value) => {
    if (isMountedRef.current) {
      setProgress(value);
    }
  };

  const safeSetProgressMessage = (message) => {
    if (isMountedRef.current) {
      setProgressMessage(message);
    }
  };

  const safeSetSuccess = (message) => {
    if (isMountedRef.current) {
      setSuccess(message);
    }
  };

  const safeSetIsSubmitting = (value) => {
    if (isMountedRef.current) {
      setIsSubmitting(value);
    }
  };

  const handleStartVerification = () => {
    if (!dojahConfig.WIDGET_ID) {
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
    
    console.log('🚀 Starting Dojah verification redirect flow');

    // Create user-specific reference and redirect URL to dashboard
    const userReferenceId = `caregiver_${userDetails.id}_${Date.now()}`;
    const redirectURL = `${window.location.origin}/app/caregiver/dashboard`;
    
    // Use userData (from profile) if available, otherwise fallback to userDetails (from localStorage)
    const currentUser = userData || userDetails;
    
    console.log('👤 Current user data being used:', {
      currentUser,
      hasUserData: !!userData,
      hasUserDetails: !!userDetails,
      userDetailsKeys: Object.keys(userDetails || {}),
      userDataKeys: userData ? Object.keys(userData) : []
    });
    
    // Prepare user metadata for pre-population
    const userMetadata = {
      // Essential widget parameters
      widget_id: dojahConfig.WIDGET_ID,
      app_id: dojahConfig.APP_ID,
      reference_id: userReferenceId,
      callback_url: encodeURIComponent(redirectURL),
      redirect_url: encodeURIComponent(redirectURL),
      // User data for pre-population
      first_name: encodeURIComponent(currentUser.firstName || ''),
      last_name: encodeURIComponent(currentUser.lastName || ''),
      email: encodeURIComponent(currentUser.email || ''),
      phone: encodeURIComponent(currentUser.phoneNumber || currentUser.phone || ''),
      user_id: encodeURIComponent(currentUser.id || userDetails.id || ''),
      // Additional fields
      date_of_birth: currentUser.dateOfBirth ? encodeURIComponent(currentUser.dateOfBirth) : '',
      address: currentUser.address ? encodeURIComponent(currentUser.address) : '',
      city: currentUser.city ? encodeURIComponent(currentUser.city) : '',
      state: currentUser.state ? encodeURIComponent(currentUser.state) : '',
      country: encodeURIComponent(currentUser.country || 'Nigeria')
    };

    // Build URL parameters from metadata (excluding empty values)
    const urlParams = Object.entries(userMetadata)
      .filter(([key, value]) => value && value !== '')
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    // Build complete widget URL
    const baseURL = 'https://identity.dojah.io';
    const completeWidgetURL = `${baseURL}?${urlParams}`;
    
    console.log('🚀 Final widget URL that will be opened:', completeWidgetURL);
    
    // Show transition message
    safeSetProgress(25);
    safeSetProgressMessage("Redirecting to our verification partner...");
    safeSetIsSubmitting(true);
    
    // Open Dojah widget in new tab
    const verificationTab = window.open(completeWidgetURL, '_blank');
    
    if (!verificationTab) {
      setModalTitle('Popup Blocked');
      setModalDescription('Please allow popups for this site to complete verification. Enable popups in your browser settings and try again.');
      setButtonText('Try Again');
      setButtonBgColor('#FF4B4B');
      setIsError(true);
      setIsModalOpen(true);
      safeSetIsSubmitting(false);
      safeSetProgress(0);
      safeSetProgressMessage("");
      return;
    }
    
    // Show informative messages and redirect user to profile
    setTimeout(() => {
      safeSetProgress(50);
      safeSetProgressMessage("Verification partner opened in new tab. You will be redirected to your dashboard after verification.");
      
      setTimeout(() => {
        safeSetProgress(75);
        safeSetProgressMessage("Redirecting you to your profile page...");
        
        setTimeout(() => {
          safeSetProgress(100);
          // Redirect to profile page
          window.location.href = "/app/caregiver/profile";
        }, 1500);
      }, 2500);
    }, 1000);
  };

  // Modal handlers
  const handleModalProceed = () => {
    setIsModalOpen(false);
    if (modalTitle === 'Account Already Verified!') {
      window.location.href = "/app/caregiver/assessments";
    }
  };

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

      <div className="mobile-verification-container">
        {/* Enhanced Progress Indicator */}
        {(progress > 0 || progressMessage) && (
          <div className="verification-progress-overlay">
            <div className="progress-content">
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
            </div>
          </div>
        )}

        <div className="content-wrapper">
          {/* Profile Header */}
          <div className="profile-header-card">
            <div className="profile-img-container">
              {isLoading ? (
                <div className="skeleton profile-img"></div>
              ) : (
                <img 
                  className="profile-img"
                  src={userData?.profilePicture || userData?.profileImage || userDetails.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent((userData?.firstName || userDetails.firstName) + ' ' + (userData?.lastName || userDetails.lastName))}&background=06b6d4&color=fff&size=120`} 
                  alt="Profile" 
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((userData?.firstName || userDetails.firstName) + ' ' + (userData?.lastName || userDetails.lastName))}&background=06b6d4&color=fff&size=120`;
                  }}
                />
              )}
            </div>
            <div className="profile-basic-info">
              <h2>{isLoading ? <div className="skeleton-text"></div> : `${userData?.firstName || userDetails.firstName || 'Unknown'} ${userData?.lastName || userDetails.lastName || 'User'}`}</h2>
              {(userData?.bio || userData?.aboutMe) && <p className="bio">{userData.bio || userData.aboutMe}</p>}
            </div>
            <div className="profile-rating-section">
              {isLoading ? (
                <>
                  <div className="skeleton-text short"></div>
                  <div className="skeleton-text short"></div>
                </>
              ) : (
                <>
                  <div className="rating">
                    {renderStars(userRating)}
                    <span>({reviewCount} reviews)</span>
                  </div>
                </>
              )}
            </div>
            <div className="profile-details">
              {!isLoading && (
                <>
                  <div className="detail-item">
                    <span>📍 {location}</span>
                  </div>
                  <div className="detail-item">
                    <span>📅 {memberSince}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Account Verification Card */}
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

              {/* Enhanced Verification Status Display */}
              {verificationStatus?.hasSuccess && (
                <div className="verification-status verified">
                  <h3>✅ Account Verified</h3>
                  <p>Your identity has been successfully verified!</p>
                  <button
                    type="button"
                    onClick={() => window.location.href = "/app/caregiver/assessments"}
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
                </div>
              )}

              {/* Start/Retry Verification Button */}
              {!verificationStatus?.hasSuccess && !verificationStatus?.hasPending && (
                <div>
                  {/* User Info Notice */}
                  <div className="user-info-notice">
                    <div className="notice-icon">
                      <i className="fas fa-info-circle"></i>
                    </div>
                    <div className="notice-content">
                      <p>
                        <strong>Verification Process:</strong> You will be taken to our verification partner in a new tab, 
                        where your information 
                        {(() => {
                          const currentUser = userData || userDetails;
                          const name = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();
                          const email = currentUser?.email || '';
                          
                          if (name && email) {
                            return ` (${name}, ${email})`;
                          } else if (name) {
                            return ` (${name})`;
                          } else if (email) {
                            return ` (${email})`;
                          } else {
                            return '';
                          }
                        })()} 
                        will be pre-filled. After verification, you will be redirected back to your dashboard.
                      </p>
                      {(() => {
                        const currentUser = userData || userDetails;
                        if (!currentUser?.firstName && !currentUser?.email) {
                          return (
                            <div>
                              <p style={{color: '#dc2626', fontSize: '13px', marginTop: '8px'}}>
                                <strong>Note:</strong> No profile data found. Please ensure your profile is complete for faster verification.
                              </p>
                              <button
                                type="button"
                                onClick={async () => {
                                  console.log('🔄 Refreshing profile data...');
                                  setIsLoading(true);
                                  try {
                                    const response = await userService.getProfile();
                                    if (response && response.success && response.data) {
                                      setUserData(response.data);
                                      console.log('✅ Profile data refreshed:', response.data);
                                    } else {
                                      console.log('❌ No profile data found');
                                    }
                                  } catch (error) {
                                    console.error('❌ Error refreshing profile:', error);
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                                style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  marginTop: '8px',
                                  cursor: 'pointer'
                                }}
                              >
                                Refresh Profile Data
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleStartVerification}
                    disabled={isSubmitting}
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
        </div>
      </div>

      {/* Standardized Modal Component for Success/Error Feedback */}
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