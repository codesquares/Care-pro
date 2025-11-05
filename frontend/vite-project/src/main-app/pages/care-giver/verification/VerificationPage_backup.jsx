import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import "./verification-page.css";
import "./verification-page-footer.css";
import "./mobile-verification.css";
import "./dojah-widget-fix.css";
import "../care-giver-profile/profile-header.css";
import verificationService from "../../../services/verificationService";
import { userService } from "../../../services/userService"; // Ensure this is the correct import path
import { createNotification } from "../../../services/notificationService";
import { fetchNotifications } from "../../../Redux/slices/notificationSlice";
import { Helmet } from "react-helmet-async";
import config from "../../../config";

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
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  // Dojah Configuration - Using direct widget URL (more reliable)
  const dojahConfig = {
    // Direct widget URL that we know works
    WIDGET_URL: `https://identity.dojah.io?widget_id=${config.DOJAH.WIDGET_ID}`,
    WIDGET_ID: config.DOJAH.WIDGET_ID || "69048546a4b1ea078950d7b9",
    APP_ID: config.DOJAH.APP_ID || "690484faa4b1ea078950c1cb", 
    PUBLIC_KEY: config.DOJAH.PUBLIC_KEY || ""
  };

  // DEBUG: Log configuration details
  console.log('🔧 DOJAH DIRECT WIDGET CONFIG:', {
    widgetURL: dojahConfig.WIDGET_URL,
    widgetID: dojahConfig.WIDGET_ID,
    appID: dojahConfig.APP_ID,
    hasPublicKey: !!dojahConfig.PUBLIC_KEY,
    configFromEnv: {
      VITE_DOJAH_APP_ID: import.meta.env.VITE_DOJAH_APP_ID,
      VITE_DOJAH_PUBLIC_KEY: import.meta.env.VITE_DOJAH_PUBLIC_KEY ? 
        import.meta.env.VITE_DOJAH_PUBLIC_KEY.substring(0, 15) + '...' : 'NOT_FOUND',
      VITE_DOJAH_WIDGET_ID: import.meta.env.VITE_DOJAH_WIDGET_ID,
      MODE: import.meta.env.MODE
    },
    configObject: config.DOJAH
  });

  // Additional debugging for connection issues
  console.log('🌐 NETWORK DEBUG:', {
    userAgent: navigator.userAgent,
    origin: window.location.origin,
    isLocalhost: window.location.hostname === 'localhost',
    protocol: window.location.protocol
  });

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

    let isMounted = true;

    // Fetch profile data
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user profile data
        const response = await userService.getProfile();
        
        if (isMounted) {
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
            
            // Format last delivery (you may need to adjust this based on your data structure)
            if (profileData.lastDelivery) {
              const lastDeliveryDate = new Date(profileData.lastDelivery);
              const now = new Date();
              const diffTime = Math.abs(now - lastDeliveryDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                setLastDelivery('1 day ago');
              } else if (diffDays < 30) {
                setLastDelivery(`${diffDays} days ago`);
              } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                setLastDelivery(`${months} month${months > 1 ? 's' : ''} ago`);
              } else {
                const years = Math.floor(diffDays / 365);
                setLastDelivery(`${years} year${years > 1 ? 's' : ''} ago`);
              }
            } else {
              setLastDelivery('No recent activity');
            }
          } else {
            // Handle API error - use fallback data from localStorage
            console.warn('API response was not successful:', response);
            setUserData(userDetails);
            setLocation('Location not specified');
            setMemberSince('Member since signup');
            setLastDelivery('No recent activity');
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        if (isMounted) {
          // Set fallback data from localStorage
          setUserData(userDetails);
          setLocation('Location not specified');
          setMemberSince('Member since signup');
          setLastDelivery('No recent activity');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Check initial verification status
    const checkStatus = async () => {
      try {
        if (isMounted) {
          setProgress(10);
          setProgressMessage("Checking verification status...");
        }

        const status = await verificationService.getVerificationStatus(
          userDetails.id,
          "caregiver"
        );

        console.log("Verification Status Response while checking=====>>>:", status);

        if (!isMounted) return;
        console.log("Verification Status in the check function:", status);
        setVerificationStatus(status);

        // Check if user has successful verification using enhanced status
        if (status.hasSuccess || status.currentStatus === "success" || status.verified === true) {
          setProgress(100);
          setProgressMessage("Account already verified!");
          setSuccess("Your account is already verified! Redirecting to assessments...");
          setTimeout(() => {
            if (isMounted) {
              window.location.href = "/app/caregiver/assessments";
            }
          }, 2000);
        } else if (status.hasPending && !status.hasSuccess) {
          setProgress(50);
          setProgressMessage("Verification is pending review...");
          setSuccess("Your verification is being processed. You will be notified when complete.");
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

    // Run both profile fetch and verification check
    fetchProfileData();
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

  // Listen for messages from the popup window
  useEffect(() => {
    const handleMessage = (event) => {
      // Only listen to messages from Dojah domain
      if (event.origin !== 'https://identity.dojah.io') {
        return;
      }

      console.log('📨 Received message from Dojah popup:', event.data);

      if (event.data && typeof event.data === 'object') {
        const { type, status, data } = event.data;

        if (type === 'verification_complete' || status === 'success') {
          console.log('✅ Verification completed via message');
          safeSetProgress(100);
          safeSetProgressMessage("✅ Verification completed successfully!");
          safeSetSuccess("Your identity has been verified! Redirecting...");
          
          setTimeout(() => {
            if (isMountedRef.current) {
              window.location.href = "/app/caregiver/profile";
            }
          }, 2000);

        } else if (type === 'verification_failed' || status === 'failed') {
          console.log('❌ Verification failed via message');
          safeSetProgress(100);
          safeSetProgressMessage("❌ Verification failed");
          setError("Verification failed. Please try again or contact support.");
          safeSetIsSubmitting(false);

        } else if (type === 'verification_pending' || status === 'pending') {
          console.log('⏳ Verification pending via message');
          safeSetProgress(85);
          safeSetProgressMessage("⏳ Verification under review");
          safeSetSuccess("Your verification is being processed. You'll be notified when complete.");
          
          setTimeout(() => {
            if (isMountedRef.current) {
              window.location.href = "/app/caregiver/profile";
            }
          }, 3000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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

  const safeSetShowDojahWidget = (value) => {
    if (isMountedRef.current) {
      setShowDojahWidget(value);
    }
  };

  // Monitor popup window function
  const monitorPopupWindow = (popup, referenceId) => {
    let checkCount = 0;
    const maxChecks = 300; // Check for 15 minutes (300 * 3 seconds)
    let popupClosed = false;
    
    const checkPopup = () => {
      if (!isMountedRef.current) {
        if (popup && !popup.closed) {
          popup.close();
        }
        return;
      }
      
      checkCount++;
      
      if (popup.closed) {
        if (!popupClosed) {
          popupClosed = true;
          console.log('🔔 Popup window was closed by user or verification completed');
          
          // Update UI
          safeSetProgress(75);
          safeSetProgressMessage("Window closed. Checking verification status...");
          
          // Start polling for completion
          startPollingForCompletion(referenceId);
        }
        return;
      }

      // Check for verification completion by polling status
      if (checkCount % 10 === 0) { // Check every 30 seconds (10 * 3 seconds)
        checkVerificationStatus(referenceId, popup);
      }
      
      if (checkCount < maxChecks) {
        // Update progress message every 30 checks (90 seconds)
        if (checkCount % 30 === 0) {
          const minutes = Math.floor(checkCount * 3 / 60);
          const seconds = Math.floor((checkCount * 3) % 60 / 10) * 10;
          safeSetProgressMessage(`Verification in progress... Please complete all steps in the popup window. (${minutes}m ${seconds}s elapsed)`);
        }
        
        // Continue monitoring
        setTimeout(checkPopup, 3000); // Check every 3 seconds
      } else {
        // Max time reached, close popup
        console.log('⚠️ Maximum monitoring time reached, closing popup');
        if (!popup.closed) {
          popup.close();
        }
        
        // Start polling anyway in case verification completed
        startPollingForCompletion(referenceId);
      }
    };
    
    // Start checking after 1 second
    setTimeout(checkPopup, 1000);
  };

  // Check verification status and close popup if completed
  const checkVerificationStatus = async (referenceId, popup) => {
    try {
      console.log('🔍 Checking verification status during popup monitoring...');
      const status = await verificationService.getVerificationStatus(userDetails.id, 'caregiver');
      
      if (status.hasSuccess || status.currentStatus === 'Completed') {
        console.log('✅ Verification completed successfully, closing popup');
        if (popup && !popup.closed) {
          popup.close();
        }
        
        safeSetProgress(100);
        safeSetProgressMessage("✅ Verification completed successfully!");
        safeSetSuccess("Your identity has been verified! Redirecting to your profile...");
        
        // Send success notification
        await sendVerificationNotification('verified', {
          verificationId: status.verificationId || referenceId,
          verificationMethod: 'Dojah KYC',
          verificationNo: status.verificationNo || referenceId,
          verifiedFirstName: userDetails.firstName || 'Unknown',
          verifiedLastName: userDetails.lastName || 'User'
        });
        
        setTimeout(() => {
          if (isMountedRef.current) {
            window.location.href = "/app/caregiver/profile";
          }
        }, 3000);
        
      } else if (status.currentStatus === 'Failed') {
        console.log('❌ Verification failed, closing popup');
        if (popup && !popup.closed) {
          popup.close();
        }
        
        safeSetProgress(100);
        safeSetProgressMessage("❌ Verification failed");
        setError("Verification failed. Please try again or contact support.");
        safeSetIsSubmitting(false);
        
      } else if (status.hasPending && !status.hasSuccess) {
        console.log('⏳ Verification pending, closing popup');
        if (popup && !popup.closed) {
          popup.close();
        }
        
        safeSetProgress(85);
        safeSetProgressMessage("⏳ Verification under review");
        safeSetSuccess("Your verification is being processed. You'll be notified when complete.");
        
        setTimeout(() => {
          if (isMountedRef.current) {
            window.location.href = "/app/caregiver/profile";
          }
        }, 5000);
      }
      
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
      // Don't close popup on status check errors, continue monitoring
    }
  };

  // Polling function for verification completion
  const startPollingForCompletion = (referenceId) => {
    let pollCount = 0;
    const maxPolls = 50; // About 25 minutes of polling
    
    const pollForStatus = async () => {
      if (!isMountedRef.current) return;
      
      pollCount++;
      console.log(`� Polling for verification completion... attempt ${pollCount}/${maxPolls}`);
      
      try {
        const status = await verificationService.getVerificationStatus(userDetails.id, 'caregiver');
        console.log('📊 Verification status:', status);
        
        // Check for successful completion
        if (status.hasSuccess || status.currentStatus === 'Completed') {
          safeSetProgress(100);
          safeSetProgressMessage("✅ Verification completed successfully!");
          safeSetSuccess("Your identity has been verified! Redirecting to your profile...");
          
          // Send success notification
          await sendVerificationNotification('verified', {
            verificationId: status.verificationId || referenceId,
            verificationMethod: 'Dojah KYC',
            verificationNo: status.verificationNo || referenceId,
            verifiedFirstName: userDetails.firstName || 'Unknown',
            verifiedLastName: userDetails.lastName || 'User'
          });
          
          setTimeout(() => {
            if (isMountedRef.current) {
              window.location.href = "/app/caregiver/profile";
            }
          }, 3000);
          
          return; // Stop polling
          
        } else if (status.currentStatus === 'Failed') {
          safeSetProgress(100);
          safeSetProgressMessage("❌ Verification failed");
          setError("Verification failed. Please try again or contact support.");
          safeSetIsSubmitting(false);
          return; // Stop polling
          
        } else if (status.hasPending && !status.hasSuccess) {
          safeSetProgress(85);
          safeSetProgressMessage("⏳ Verification under review");
          safeSetSuccess("Your verification is being processed. You'll be notified when complete.");
          
          setTimeout(() => {
            if (isMountedRef.current) {
              window.location.href = "/app/caregiver/profile";
            }
          }, 5000);
          
          return; // Stop polling
        }
        
        // Update progress based on time elapsed
        const timeProgress = Math.min(25 + (pollCount * 1.2), 80);
        safeSetProgress(timeProgress);
        
        // Continue polling if no definitive status
        if (pollCount < maxPolls && isMountedRef.current) {
          pollingTimeoutRef.current = setTimeout(pollForStatus, 30000); // Poll every 30 seconds
        } else if (pollCount >= maxPolls) {
          // Max polling reached
          safeSetProgressMessage("⚠️ Verification is taking longer than expected");
          setError("Verification timeout. Please check your notifications or contact support.");
          safeSetIsSubmitting(false);
        }
        
      } catch (error) {
        console.error(`❌ Polling attempt ${pollCount} failed:`, error);
        
        if (pollCount < maxPolls && isMountedRef.current) {
          // Continue polling even if individual requests fail
          pollingTimeoutRef.current = setTimeout(pollForStatus, 30000);
        } else {
          setError("Unable to check verification status. Please contact support.");
          safeSetIsSubmitting(false);
        }
      }
    };
    
    // Start first poll after 30 seconds to give Dojah time to process
    pollingTimeoutRef.current = setTimeout(pollForStatus, 30000);
  };

  // Determine overall verification status based on Dojah response
  // Updated to return .NET backend compatible status values
  const determineVerificationStatus = (dojahData) => {
    // Map to .NET backend status values
    if (dojahData.status === true) {
      return 'Completed'; // .NET backend expects "Completed" for successful verification
    }
    
    // If overall status is false, check individual components
    const components = dojahData.data || {};
    
    // Count successful verifications
    const successfulChecks = [
      components.user_data?.status,
      components.government_data?.status, // BVN/NIN
      components.selfie?.status,
      components.id?.status
    ].filter(Boolean).length;
    
    // If some critical checks passed but not all, it might be pending review
    if (successfulChecks >= 2 && (dojahData.verification_status === 'Pending' || dojahData.message?.includes('review'))) {
      return 'Pending'; // .NET backend expects "Pending"
    }
    
    // If some checks passed but not critical ones
    if (successfulChecks >= 1) {
      return 'Ongoing'; // .NET backend expects "Ongoing"
    }
    
    // All failed
    return 'Failed'; // .NET backend expects "Failed"
  };

  // Send appropriate notification based on verification status
  const sendVerificationNotification = async (status, verificationResult = {}) => {
    try {
      // Generate detailed notification content based on verification status
      const notificationContent = generateVerificationNotificationContent(status, verificationResult);
      
      const notificationData = {
        recipientId: userDetails.id,
        senderId: 'system',
        type: 'VerificationUpdate', // More specific type than 'SystemNotice'
        relatedEntityId: 'verification',
        title: notificationContent.title,
        content: notificationContent.content,
        metadata: {
          verificationStatus: status,
          verificationMethod: 'Dojah KYC',
          attemptTime: new Date().toISOString(),
          verificationNumber: verificationResult.verificationNo || '',
          userName: `${verificationResult.verifiedFirstName || userDetails.firstName || ''} ${verificationResult.verifiedLastName || userDetails.lastName || ''}`.trim(),
          processingVersion: '2.0',
          userType: 'caregiver'
        }
      };
      
      // Create a detailed notification for the verification attempt
      await createNotification(notificationData);

      // Refresh notifications to show the new one
      dispatch(fetchNotifications());
      
    } catch (notificationError) {
      console.error('Failed to send verification notification:', notificationError);
      // Don't let notification failures block the main flow
    }
  };

  // Generate detailed notification content based on verification status
  const generateVerificationNotificationContent = (status, verificationResult = {}) => {
    const timestamp = new Date().toLocaleString();
    const userName = `${verificationResult.verifiedFirstName || userDetails.firstName || ''} ${verificationResult.verifiedLastName || userDetails.lastName || ''}`.trim() || 'User';
    
    const titles = {
      verified: '✅ Identity Verification Successful',
      pending: '⏳ Identity Verification Under Review',
      partial: '⚠️ Identity Verification Partially Complete',
      failed: '❌ Identity Verification Failed',
      error: '🔧 Identity Verification Error',
      default: '📋 Identity Verification Update'
    };

    const baseContents = {
      verified: `Hello ${userName}, your identity has been successfully verified through Dojah KYC on ${timestamp}. You can now access all caregiver features and start browsing available opportunities.`,
      pending: `Hello ${userName}, your identity verification has been submitted for manual review on ${timestamp}. We'll notify you once the review is complete (usually within 24-48 hours). No action is required from you at this time.`,
      partial: `Hello ${userName}, your identity verification was partially successful on ${timestamp}. Some verification components may need attention. Please check your verification status for specific details.`,
      failed: `Hello ${userName}, your identity verification could not be completed on ${timestamp}. This may be due to document quality, lighting issues, or information mismatch. You can retry with clearer documents.`,
      error: `Hello ${userName}, there was a technical issue with your identity verification on ${timestamp}. Our technical team has been notified and will resolve this shortly. You may try again later.`,
      default: `Hello ${userName}, your identity verification status has been updated on ${timestamp}. Please check your verification dashboard for details.`
    };

    const title = titles[status] || titles.default;
    let content = baseContents[status] || baseContents.default;

    // Add verification details if available
    if (verificationResult.dojahData) {
      const checkedComponents = getVerificationComponents(verificationResult.dojahData);
      if (checkedComponents.length > 0) {
        content += `\n\nVerification components processed: ${checkedComponents.join(', ')}`;
      }
    }

    // Add next steps based on status
    const nextSteps = {
      verified: '\n\n🎉 Next steps: You can now browse and apply for caregiver opportunities! Visit your dashboard to get started.',
      pending: '\n\n⏳ Next steps: No action required. You will receive an automatic notification once our review team completes the verification process.',
      partial: '\n\n📋 Next steps: Please review the verification details and resubmit any failed components with clearer documentation.',
      failed: '\n\n🔄 Next steps: Ensure good lighting, clear document photos, and accurate personal information before retrying verification.',
      error: '\n\n🛠️ Next steps: Our technical team is working on this issue. You may try again in a few minutes, or contact support if the problem persists.'
    };

    if (nextSteps[status]) {
      content += nextSteps[status];
    }

    // Add verification number if available
    if (verificationResult.verificationNo && verificationResult.verificationNo.trim() !== '') {
      content += `\n\nReference: ${verificationResult.verificationNo}`;
    }

    return { title, content };
  };

  // Extract verification components that were checked
  const getVerificationComponents = (dojahData) => {
    const components = [];
    
    if (dojahData?.data?.government_data?.status) {
      const govType = dojahData.id_type || 'Government ID';
      components.push(`${govType} verification`);
    }
    
    if (dojahData?.data?.selfie?.status) {
      components.push('Facial recognition');
    }
    
    if (dojahData?.data?.id?.status) {
      components.push('Document verification');
    }
    
    if (dojahData?.data?.user_data?.status) {
      components.push('Personal information');
    }

    if (dojahData?.data?.email?.status) {
      components.push('Email verification');
    }

    return components;
  };

  // Process Dojah verification data and save to your backend
  const processDojahVerification = async (dojahData) => {
    try {
      // Debug logging to understand what we're receiving
      console.log("Processing Dojah Data:", dojahData);
      console.log("User Details:", userDetails);
      
      // Always determine status first
      const overallStatus = determineVerificationStatus(dojahData);
      
      // Extract verified identity data (prefer government data over user input)
      const governmentData = dojahData.data?.government_data?.data?.bvn?.entity;
      const userData = dojahData.data?.user_data?.data;
      
      console.log("Government Data:", governmentData);
      console.log("User Data:", userData);
      
      // Use government verified data if available, fallback to user data, then to userDetails
      const verifiedFirstName = governmentData?.first_name || 
                               userData?.first_name || 
                               userDetails.firstName || 
                               "Unknown";
      const verifiedLastName = governmentData?.last_name || 
                              userData?.last_name || 
                              userDetails.lastName || 
                              "Unknown";
      
      console.log("Extracted Names:", { verifiedFirstName, verifiedLastName });
      
      // Validate required fields for Azure API
      if (!userDetails.id) {
        throw new Error("User ID is missing from userDetails");
      }
      
      if (!verifiedFirstName || verifiedFirstName.trim() === "" || verifiedFirstName === "Unknown") {
        console.warn("No verified first name found, using fallback");
      }
      
      if (!verifiedLastName || verifiedLastName.trim() === "" || verifiedLastName === "Unknown") {
        console.warn("No verified last name found, using fallback");
      }
      
      // Determine verification number (BVN, NIN, or reference)
      // Try multiple possible locations for the verification number in Dojah response
      const verificationNo = dojahData.value || // Primary location for BVN/NIN number
                            dojahData.bvn || // Direct BVN field
                            dojahData.nin || // Direct NIN field
                            dojahData.id_number || // ID number field
                            governmentData?.bvn || // From government data
                            governmentData?.nin || // NIN from government data
                            userData?.bvn || // From user data
                            userData?.nin || // NIN from user data
                            dojahData.reference_id || // Fallback to reference
                            dojahData.verification_id || // Alternative reference
                            ""; // Final fallback
      
      console.log("Verification number extraction:", {
        dojahDataValue: dojahData.value,
        dojahBvn: dojahData.bvn,
        dojahNin: dojahData.nin,
        dojahIdNumber: dojahData.id_number,
        governmentBvn: governmentData?.bvn,
        governmentNin: governmentData?.nin,
        userDataBvn: userData?.bvn,
        userDataNin: userData?.nin,
        referenceId: dojahData.reference_id,
        verificationId: dojahData.verification_id,
        finalVerificationNo: verificationNo
      });

      // Required Azure backend format with guaranteed non-empty values
      const azurePayload = {
        userId: userDetails.id,
        verifiedFirstName: verifiedFirstName.trim() || "Unknown",
        verifiedLastName: verifiedLastName.trim() || "Unknown",
        verificationMethod: "dojah",
        verificationNo: verificationNo,
        verificationStatus: overallStatus
      };

      // Additional data for comprehensive storage (your backend can ignore what it doesn't need)
      const extendedPayload = {
        ...azurePayload,
        // Additional context data
        referenceId: dojahData.reference_id,
        dojahWidgetId: dojahData.widget_id,
        verificationType: dojahData.verification_type,
        verificationMode: dojahData.verification_mode,
        
        // Individual component statuses
        components: {
          userData: {
            status: dojahData.data?.user_data?.status || false,
            firstName: userData?.first_name,
            lastName: userData?.last_name,
            email: userData?.email,
            dateOfBirth: userData?.dob
          },
          government: {
            status: dojahData.data?.government_data?.status || false,
            type: dojahData.id_type,
            number: dojahData.value,
            verifiedName: governmentData ? `${governmentData.first_name} ${governmentData.last_name}` : "",
            phone: governmentData?.phone_number1,
            dateOfBirth: governmentData?.date_of_birth
          },
          documents: {
            idStatus: dojahData.data?.id?.status || false,
            idMessage: dojahData.data?.id?.message || "",
            selfieStatus: dojahData.data?.selfie?.status || false,
            selfieMessage: dojahData.data?.selfie?.message || "",
            emailStatus: dojahData.data?.email?.status || false
          }
        },
        
        // Document URLs for storage
        documents: {
          idUrl: dojahData.id_url,
          selfieUrl: dojahData.selfie_url,
          bvnPhotoUrl: governmentData?.image_url
        },
        
        // Metadata - Always include attempt metadata
        metadata: {
          submissionTime: new Date().toISOString(),
          attemptStatus: overallStatus,
          processingVersion: '2.0',
          userAgent: navigator.userAgent,
          requiresReview: overallStatus === 'pending',
          dojahMessage: dojahData.message,
          ipInfo: dojahData.metadata?.ipinfo,
          // Always mark that data was sent to Azure
          sentToAzure: true
        }
      };

      // Final validation before sending to Azure
      console.log("Final Azure Payload:", azurePayload);
      
      // Validate required fields one more time
      if (!azurePayload.userId || !azurePayload.verifiedFirstName || !azurePayload.verifiedLastName) {
        throw new Error(`Missing required fields for Azure API: ${JSON.stringify({
          userId: !!azurePayload.userId,
          verifiedFirstName: !!azurePayload.verifiedFirstName,
          verifiedLastName: !!azurePayload.verifiedLastName
        })}`);
      }

      // ALWAYS send to Azure - don't condition this
      const response = await verificationService.processDojahVerification(extendedPayload);
      
      // Return result with status for notification handling
      return {
        success: true, // Azure call succeeded
        message: response.message || 'Verification data processed',
        data: response.data,
        status: overallStatus,
        azureResponse: response,
        verificationNo: verificationNo,
        verifiedFirstName: verifiedFirstName.trim() || "Unknown",
        verifiedLastName: verifiedLastName.trim() || "Unknown",
        dojahData: dojahData // Include original Dojah data for detailed notifications
      };
    } catch (error) {
      console.error("Error processing Dojah verification:", error);
      
      // Even on Azure error, return a result for notification handling
      return {
        success: false,
        message: 'Verification data could not be processed completely',
        status: 'error',
        error: error.message,
        verificationNo: verificationNo || '',
        verifiedFirstName: verifiedFirstName.trim() || userDetails.firstName || "Unknown",
        verifiedLastName: verifiedLastName.trim() || userDetails.lastName || "Unknown",
        dojahData: dojahData // Include original Dojah data for detailed notifications
      };
    }
  };

  // Get user-friendly status message
  const getStatusMessage = (status) => {
    switch (status) {
      case 'verified':
        return "Verification completed successfully";
      case 'pending':
        return "Verification submitted for review - you'll be notified once complete";
      case 'partial':
        return "Some verifications passed, others need attention";
      case 'failed':
        return "Verification failed - please try again";
      default:
        return "Verification status unknown";
    }
  };

  const handleStartVerification = () => {
    if (!dojahConfig.WIDGET_ID) {
      setError("Verification service is not properly configured. Please contact support.");
      return;
    }

    setError("");
    setSuccess("");
    
    // Debug user data before proceeding
    console.log('� Debug user data before verification:', {
      userDetails: userDetails,
      userData: userData,
      localStorage_userDetails: JSON.parse(localStorage.getItem("userDetails") || "{}"),
      currentUser_will_be: userData || userDetails
    });
    
    console.log('�🚀 Starting Dojah Direct Widget verification:', {
      widgetURL: dojahConfig.WIDGET_URL,
      widgetID: dojahConfig.WIDGET_ID
    });

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
    
    console.log(' Final widget URL that will be opened:', completeWidgetURL);
    
    // Show transition message
    safeSetProgress(25);
    safeSetProgressMessage("Redirecting to our verification partner...");
    safeSetIsSubmitting(true);
    
    // Open Dojah widget in new tab
    const verificationTab = window.open(completeWidgetURL, '_blank');
    
    if (!verificationTab) {
      setError("Please allow popups for this site to complete verification.");
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

  return (
    <>
      <Helmet>
        <title>Caregiver Verification | Care Pro</title>
        <meta name="description" content="Verify your identity to become a trusted caregiver on Care Pro" />
      </Helmet>

      <div className="mobile-verification-page">
        {!showDojahWidget ? (
          <div className="mobile-verification-container fade-in">
            {/* User Profile Card */}
            <div className="profile-header-card">
              {isLoading ? (
                <div className="loading-profile">
                  <div className="profile-img skeleton"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text short"></div>
                </div>
              ) : (
                <>
                  {/* Profile Image */}
                  <img 
                    src={userData?.profilePicture || userData?.profileImage || userDetails.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent((userData?.firstName || userDetails.firstName) + ' ' + (userData?.lastName || userDetails.lastName))}&background=06b6d4&color=fff&size=120`} 
                    alt="Profile" 
                    className="profile-img"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((userData?.firstName || userDetails.firstName) + ' ' + (userData?.lastName || userDetails.lastName))}&background=06b6d4&color=fff&size=120`;
                    }}
                  />
                  
                  {/* Basic Info */}
                  <div className="profile-basic-info">
                    <h2>
                      {userData?.firstName || userDetails.firstName} {userData?.lastName || userDetails.lastName}
                    </h2>
                    <p className="username">{userData?.username || userData?.email || userDetails.username || userDetails.email || 'caregiver'}</p>
                    {(userData?.bio || userData?.aboutMe) && <p className="bio">{userData.bio || userData.aboutMe}</p>}
                  </div>

                  {/* Rating Section */}
                  <div className="profile-rating-section">
                    <div className="rating">
                      <span className="stars">
                        {renderStars(userRating)}
                      </span>
                      <span className="rating-text">
                        {userRating.toFixed(1)} ({reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="profile-details">
                    <div className="detail-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{location}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-calendar"></i>
                      <span>Member since {memberSince}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-truck"></i>
                      <span>Last delivery: {lastDelivery}</span>
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className={`availability-status ${userData?.isAvailable ? 'available' : 'unavailable'}`}>
                    {userData?.isAvailable ? 'Available for work' : 'Currently unavailable'}
                  </div>
                </>
              )}
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
                      <h4>E-Selfie</h4>
                      <p>Get verified by uploading your Photo on accompanying selfie</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="progress-message">{progressMessage}</p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}

                {/* Success Display */}
                {success && (
                  <div className="success-message">
                    <p>{success}</p>
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
                      <p><strong>Total Attempts:</strong> {verificationStatus.totalAttempts}</p>
                      {verificationStatus.lastAttempt && (
                        <p><strong>Last Attempt:</strong> {new Date(verificationStatus.lastAttempt).toLocaleString()}</p>
                      )}
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
                    We comply with all data protection regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dojah Widget Container */
          <div className="dojah-widget-container">
            <div className="dojah-widget-header">
              <h2>Identity Verification</h2>
              <p>Please complete all steps to verify your identity</p>
              
              {/* Progress Bar */}
              {progress > 0 && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-message">{progressMessage}</p>
                </div>
              )}
            </div>

            {/* Dojah SDK Widget */}
            {dojahConfig.appID && dojahConfig.publicKey ? (
              <div className="dojah-sdk-wrapper">
                {console.log('🚀 RENDERING DOJAH WIDGET:', {
                  appID: dojahConfig.appID,
                  publicKey: dojahConfig.publicKey.substring(0, 10) + '...',
                  type: dojahConfig.type,
                  config: dojahConfig.config,
                  userData: dojahUserData,
                  govData: dojahGovData,
                  metadata: dojahMetadata
                })}
                <Dojah
                  response={handleDojahResponse}
                  appID={dojahConfig.appID}
                  publicKey={dojahConfig.publicKey}
                  type={dojahConfig.type}
                  config={dojahConfig.config}
                  userData={dojahUserData}
                  govData={dojahGovData}
                  metadata={dojahMetadata}
                  referenceId={`caregiver_${userDetails.id}_${Date.now()}`}
                />
              </div>
            ) : (
              <div className="dojah-config-error">
                <h3>Configuration Error</h3>
                <p>Missing required Dojah configuration:</p>
                <ul>
                  <li>App ID: {dojahConfig.appID ? '✅ Present' : '❌ Missing'}</li>
                  <li>Public Key: {dojahConfig.publicKey ? '✅ Present' : '❌ Missing'}</li>
                  <li>Widget ID: {dojahConfig.config.widget_id ? '✅ Present' : '❌ Missing'}</li>
                </ul>
                <button
                  onClick={() => {
                    safeSetShowDojahWidget(false);
                    setError("Configuration error. Please contact support.");
                  }}
                  className="back-btn"
                >
                  Back to Verification Options
                </button>
              </div>
            )}

            {/* Success/Error Messages */}
            {success && (
              <div className="success-message">
                <p>{success}</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    safeSetShowDojahWidget(false);
                    safeSetProgress(0);
                    safeSetProgressMessage("");
                  }}
                  className="back-btn"
                >
                  Back to Verification Options
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CaregiverVerificationPage;
