import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Dojah from "react-dojah";
import "./verification-page.css";
import "./verification-page-footer.css";
import "./mobile-verification.css";
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
  const [showDojahWidget, setShowDojahWidget] = useState(false);
  
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

  // Dojah Configuration - Replace with your actual keys from dashboard
  const dojahConfig = {
    // Get these from https://dojah.io/dashboard
    appID: config.DOJAH.APP_ID || "", // Your Dojah App ID
    publicKey: config.DOJAH.PUBLIC_KEY || "", // Your Dojah Public Key
    type: "custom", // Widget type
    config: {
      widget_id: config.DOJAH.WIDGET_ID|| "" // Generated from Easy Onboard
    }
  };

  useEffect(() => {
    // Skip the second run caused by Strict Mode in development
    if (effectRan.current) return;
    effectRan.current = true;

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

        if (!isMounted) return;
        console.log("Verification Status in the check function:", status);
        setVerificationStatus(status);

        if (status.data.isVerified === true || status.data.verificationStatus === "verified") {
          setProgress(100);
          setProgressMessage("Account already verified!");
          setSuccess("Your account is already verified! Redirecting to dashboard...");
          setTimeout(() => {
            if (isMounted) {
              window.location.href = "/app/caregiver/dashboard";
            }
          }, 2000);
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
      isMounted = false;
    };
  }, []);

  // Dojah Response Handler
  // NEW IMPLEMENTATION: Always sends data to Azure regardless of verification status
  // and uses notifications to communicate outcomes to users
  const handleDojahResponse = async (type, data) => {
    console.log("Dojah Response:", type, data);

    if (type === 'loading') {
      setProgress(25);
      setProgressMessage("Initializing verification...");
      setIsSubmitting(true);
    } else if (type === 'begin') {
      setProgress(50);
      setProgressMessage("Starting verification process...");
    } else if (type === 'success') {
      console.log("completed dojah verification", data);
      try {
        setProgress(75);
        setProgressMessage("Processing verification results...");

        // ALWAYS process and send to Azure regardless of status
        const verificationResult = await processDojahVerification(data);
        console.log("Processed Verification Result:", verificationResult);
        
        // Determine the overall status based on Dojah response
        const overallStatus = determineVerificationStatus(data);
        
        // Send appropriate notification based on status
        await sendVerificationNotification(overallStatus, {
          ...verificationResult,
          dojahData: data,
          verificationNo: verificationResult.verificationNo || data.value || data.reference_id || ''
        });
        
        // Always redirect to dashboard - let notifications handle communication
        setProgress(100);
        setProgressMessage("Verification processed successfully!");
        
        // Show brief success message based on status
        if (overallStatus === 'verified') {
          setSuccess("Verification completed successfully! Redirecting to dashboard...");
        } else if (overallStatus === 'pending') {
          setSuccess("Verification submitted for review! You'll be notified once complete. Redirecting to dashboard...");
        } else if (overallStatus === 'partial') {
          setSuccess("Verification partially completed. Please check notifications for details. Redirecting to dashboard...");
        } else {
          setSuccess("Verification processed. Please check notifications for details. Redirecting to dashboard...");
        }
        
        // Always redirect after a short delay - using window.location for reliable navigation
        setTimeout(() => {
          window.location.href = "/app/caregiver/dashboard";
        }, 3000);
        
      } catch (err) {
        console.error("Error processing Dojah verification:", err);
        
        // Even on error, try to send a notification
        await sendVerificationNotification('error', { 
          message: err.message,
          verificationNo: '',
          verifiedFirstName: userDetails.firstName || '',
          verifiedLastName: userDetails.lastName || ''
        });
        
        // Still redirect - notifications will inform user of issues - using window.location for reliability
        setSuccess("Verification processed. Please check notifications for details. Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = "/app/caregiver/dashboard";
        }, 3000);
      } finally {
        setIsSubmitting(false);
        setShowDojahWidget(false);
      }
    } else if (type === 'error') {
      console.error("Dojah verification error:", data);
      
      // Send error notification
      await sendVerificationNotification('error', { 
        message: data?.message || "Verification failed",
        verificationNo: '',
        verifiedFirstName: userDetails.firstName || '',
        verifiedLastName: userDetails.lastName || ''
      });
      
      setProgress(100);
      setProgressMessage("Verification failed");
      setSuccess("Verification error occurred. Please check notifications for details. Redirecting to dashboard...");
      setIsSubmitting(false);
      setShowDojahWidget(false);
      
      // Still redirect after error - using window.location for reliable navigation
      setTimeout(() => {
        window.location.href = "/app/caregiver/dashboard";
      }, 3000);
    } else if (type === 'close') {
      setIsSubmitting(false);
      setShowDojahWidget(false);
      // Reset progress if verification wasn't completed
      if (progress < 100) {
        setProgress(0);
        setProgressMessage("");
      }
    }
  };

  // Determine overall verification status based on Dojah response
  const determineVerificationStatus = (dojahData) => {
    // If overall status is true, it's verified
    if (dojahData.status === true) {
      return 'verified';
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
      return 'pending';
    }
    
    // If some checks passed but not critical ones
    if (successfulChecks >= 1) {
      return 'partial';
    }
    
    // All failed
    return 'failed';
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
    if (!dojahConfig.appID || !dojahConfig.publicKey) {
      setError("Verification service is not properly configured. Please contact support.");
      return;
    }

    setError("");
    setSuccess("");
    setShowDojahWidget(true);
  };

  // Prepare user data for Dojah (pre-fill if available)
  const dojahUserData = {
    first_name: userDetails.firstName || "",
    last_name: userDetails.lastName || "",
    email: userDetails.email || "",
    residence_country: 'NG', // Default to Nigeria, modify as needed
  };

  const metadata = {
    user_id: userDetails.id,
    user_type: 'caregiver',
    platform: 'care-pro',
    timestamp: new Date().toISOString()
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
                    <p className="username">@{userData?.username || userData?.email || userDetails.username || userDetails.email || 'caregiver'}</p>
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

                {/* Verification Status */}
                {verificationStatus?.verified && (
                  <div className="verification-status verified">
                    <h3>✅ Account Verified</h3>
                    <p>Your identity has been successfully verified!</p>
                  </div>
                )}

                {/* Start Verification Button */}
                {!verificationStatus?.verified && (
                  <button
                    type="button"
                    onClick={handleStartVerification}
                    disabled={isSubmitting}
                    className="proceed-btn start-verification"
                  >
                    {isSubmitting ? "Processing..." : "Start Verification"}
                    <i className="fas fa-arrow-right"></i>
                  </button>
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
          /* Dojah Widget */
          <div className="dojah-widget-container">
            {dojahConfig.appID && dojahConfig.publicKey && (
              <Dojah
                response={handleDojahResponse}
                appID={dojahConfig.appID}
                publicKey={dojahConfig.publicKey}
                type={dojahConfig.type}
                config={dojahConfig.config}
                userData={dojahUserData}
                metadata={metadata}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CaregiverVerificationPage;
