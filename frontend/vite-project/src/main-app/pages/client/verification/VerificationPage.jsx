import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../care-giver/verification/verification-page.css";
import "../../care-giver/verification/verification-page-footer.css";
import verificationService from "../../../services/verificationService";
import { Helmet } from "react-helmet-async";

const ClientVerificationPage = () => {
  // Constants for test values
  const TEST_VALUES = {
    BVN: '22222222222',
    NIN: '70123456789'
  };
  
  // Helper to check if a value is a test value
  const isTestValue = (type, value) => {
    if (!value) return false;
    const testValue = TEST_VALUES[type.toUpperCase()];
    return testValue && testValue === value;
  };
  
  // State variables
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
  
  // Multi-step verification state
  const [verificationStep, setVerificationStep] = useState(1);
  const [showIdSelfieStep, setShowIdSelfieStep] = useState(false);
  const [bvnResult, setBvnResult] = useState(null);
  const [ninResult, setNinResult] = useState(null);

  // Get token and user ID from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");
  
  // Reference for polling cancellation
  const pollRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  useEffect(() => {
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
        
        const status = await verificationService.getVerificationStatus(userDetails.id, 'client');
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        // Update verification status state first
        setVerificationStatus(status);
        
        // If already verified, redirect to profile page
        if (status.verified === true) {
          setProgress(100);
          setProgressMessage("Account already verified!");
          setSuccess("Your account is already verified!");
          setTimeout(() => {
            if (isMounted) {
              navigate("/app/client/dashboard");
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
    
    // Execute status check right away
    checkStatus();
    
    // Reference to store the polling timeout
    let pollingTimeout = null;
    
    // Set up polling only if initial check shows we're not verified
    const setupPolling = () => {
      // Don't setup polling if already polling or if already verified
      if (isPolling || verificationStatus?.verified) {
        return;
      }
      
      // Start polling for verification status updates
      if (isMounted) {
        setIsPolling(true);
        
        // If polling starts, show a progress indicator that gradually increases
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
        }, 10000); // 10 seconds interval
        
        // Clear any existing polling
        if (pollRef.current) {
          pollRef.current();
          pollRef.current = null;
        }
        
        // Pass a longer polling interval
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
                  navigate("/app/client/dashboard");
                }
              }, 3000);
            } else if (status.verificationStatus === "pending") {
              // Use the progress from the polling service
              if (status.progress) {
                setProgress(status.progress);
                setProgressMessage(`Verification in progress (attempt ${status.pollingAttempt || 1}/${status.maxAttempts || 10})...`);
              }
            } else if (status.verificationStatus === "failed") {
              clearInterval(progressIntervalRef.current);
              setIsPolling(false);
              setProgress(100);
              setProgressMessage("Verification failed");
              setError("Verification failed. Please try again.");
            }
          },
          15000, // 15 seconds polling interval
          userDetails.id,
          'client' // specify user type as client
        );
      }
    };
    
    // Wait for initial check to complete before potentially starting polling
    pollingTimeout = setTimeout(setupPolling, 3000);
    
    // Clean up polling when component unmounts
    return () => {
      isMounted = false; // Mark component as unmounted
      
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
  }, [
    // Only include primitive values or stable references
    token, 
    userDetails.id, // Only depend on the ID, not the entire object
    navigate, 
    isPolling,
    // Only track if verified, not the entire verification status object
    verificationStatus ? verificationStatus.verified : false
  ]);

  // Helper function to validate user details against verification response
  const validateUserDetails = (verificationData) => {
    // Get user details from localStorage
    const storedUserDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
    
    if (!verificationData || !storedUserDetails) {
      return { 
        isMatch: false, 
        message: "Cannot validate user details: Missing data" 
      };
    }
    
    // Check for test BVN/NIN values and auto-approve without name check
    // Use the isTestValue helper for more consistent test value detection
    if (isTestValue('BVN', verificationData.bvn) || isTestValue('NIN', verificationData.nin)) {
      console.log('🧪 Test BVN/NIN detected - Bypassing name match validation');
      return {
        isMatch: true,
        message: "Using test verification value - name match validation bypassed",
        details: {
          firstNameMatch: true,
          lastNameMatch: true,
          stored: {
            firstName: storedUserDetails.firstName || storedUserDetails.firstname,
            lastName: storedUserDetails.lastName || storedUserDetails.lastname
          },
          verified: {
            firstName: verificationData.first_name || verificationData.firstName || 'Test',
            lastName: verificationData.last_name || verificationData.lastName || 'User',
            isTestValue: true
          }
        }
      };
    }
    
    // Create normalized versions of names for comparison (lowercase, trim whitespace)
    const normalizeText = (text) => {
      return (text || "").toLowerCase().trim();
    };
    
    // Names from verification (different APIs might have different field names)
    const verificationFirstName = normalizeText(
      verificationData.firstName || 
      verificationData.first_name
    );
    
    const verificationLastName = normalizeText(
      verificationData.lastName || 
      verificationData.last_name
    );
    
    // Names from stored user details
    const storedFirstName = normalizeText(storedUserDetails.firstName || storedUserDetails.firstname);
    const storedLastName = normalizeText(storedUserDetails.lastName || storedUserDetails.lastname);
    
    // Perform name matching
    const firstNameMatch = storedFirstName && verificationFirstName && 
                          (storedFirstName.includes(verificationFirstName) || 
                           verificationFirstName.includes(storedFirstName));
    
    const lastNameMatch = storedLastName && verificationLastName && 
                         (storedLastName.includes(verificationLastName) || 
                          verificationLastName.includes(storedLastName));
    
    // Match result
    const isMatch = firstNameMatch && lastNameMatch;
    
    // Return match result with details
    return {
      isMatch,
      message: isMatch 
        ? "User details match verification data" 
        : "User details do not match verification data",
      details: {
        firstNameMatch,
        lastNameMatch,
        stored: {
          firstName: storedFirstName,
          lastName: storedLastName
        },
        verified: {
          firstName: verificationFirstName,
          lastName: verificationLastName
        }
      }
    };
  };
  
  // Function to save verification data for future submission to Azure
  const saveVerificationData = (verificationMethod, verificationData, isSuccess, matchResult) => {
    try {
      // Prepare the verification data record
      const verificationRecord = {
        method: verificationMethod,
        userId: userDetails.id,
        userType: 'client', // Specify that this is a client verification
        timestamp: new Date().toISOString(),
        status: isSuccess ? 'verified' : 'failed',
        data: verificationData,
        userMatch: matchResult,
        // Data that will be sent to Azure when the endpoint is available
        azureData: {
          userId: userDetails.id,
          userType: 'client',
          verificationType: verificationMethod,
          status: isSuccess ? 'verified' : 'failed',
          verificationMethod: verificationMethod,
          methodDetails: {
            ...(verificationMethod === 'bvn' ? { bvnNumber: verificationData.bvn } : {}),
            ...(verificationMethod === 'nin' ? { ninNumber: verificationData.nin } : {}),
            withSelfie: !!verificationData.selfie_verification
          },
          userData: {
            firstName: verificationData.first_name || verificationData.firstName,
            lastName: verificationData.last_name || verificationData.lastName,
            gender: verificationData.gender,
            dateOfBirth: verificationData.date_of_birth || verificationData.dateOfBirth
          },
          completedAt: new Date().toISOString()
        }
      };
      
      // Save to localStorage for later submission when endpoint is available
      const previousRecords = JSON.parse(localStorage.getItem('pendingVerificationData') || '[]');
      previousRecords.push(verificationRecord);
      localStorage.setItem('pendingVerificationData', JSON.stringify(previousRecords));
      
      console.log('Saved client verification data for future submission to Azure:', verificationRecord);
    } catch (error) {
      console.error('Failed to save verification data:', error);
    }
  };
  
  const handleVerificationMethodChange = (e) => {
    setVerificationMethod(e.target.value);
    setError(""); // Clear errors when changing method
    
    // Reset verification steps
    setVerificationStep(1);
    setShowIdSelfieStep(false);
    setBvnResult(null);
    setNinResult(null);
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
      setImageFunc(file);
      setError("");
    }
  };

  // Helper function to convert file to base64 with compression
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      // For image files, compress before converting to base64
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            // Create canvas for compression
            const canvas = document.createElement('canvas');
            
            // Calculate new dimensions - maintain aspect ratio but limit max dimensions
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get compressed image as base64 string (0.8 quality - good balance of quality and size)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            console.log(`Image compressed: ${Math.round((compressedBase64.length * 0.75) / 1024)}KB`);
            resolve(compressedBase64);
          };
        };
        reader.onerror = error => reject(error);
      } else {
        // For non-image files, proceed without compression
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/jpeg;base64, part
        reader.onerror = error => reject(error);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setProgress(10);
    setProgressMessage("Starting verification process...");

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
      // Validate inputs based on verification method and step
      if (verificationMethod === "bvn") {
        if (verificationStep === 1 && !bvnNumber) {
          throw new Error("BVN number is required");
        } else if (verificationStep === 2 && (!idImage || !selfieImage)) {
          throw new Error("Both ID image and selfie are required for BVN verification");
        }
      } else if (verificationMethod === "nin") {
        if (verificationStep === 1 && !ninNumber) {
          throw new Error("NIN number is required");
        } else if (verificationStep === 2 && !selfieImage) {
          throw new Error("Selfie image is required for NIN verification");
        }
      } else if (verificationMethod === "id" && (!idImage || !selfieImage)) {
        throw new Error("Both ID image and selfie are required for ID verification");
      }

      setProgress(30);
      
      if (verificationMethod === "bvn") {
        if (verificationStep === 1) {
          // First step: BVN verification
          setProgressMessage("Processing BVN verification...");
          
          const data = await verificationService.verifyBVN(
            bvnNumber, 
            null, 
            null, 
            'client', 
            userDetails.id
          );
          
          if (data.status === "success") {
            // Validate the user details from BVN against stored user details
            const matchResult = validateUserDetails(data.data);
            console.log("BVN verification user match:", matchResult);
            
            // Check if this is a test BVN value using the consistent helper function
            const isTestBvn = isTestValue('BVN', bvnNumber) || (data.data && isTestValue('BVN', data.data.bvn));
            
            if (!matchResult.isMatch && !isTestBvn) {
              setProgress(100);
              setProgressMessage("Verification failed: User details mismatch");
              setError(`The name on your BVN (${data.data.first_name || data.data.firstName} ${data.data.last_name || data.data.lastName}) does not match your profile. Please contact support.`);
              
              // Save verification data for later auditing
              saveVerificationData('bvn', data.data, false, matchResult);
              return;
            }
            
            // BVN verified successfully with matching details, now need ID + selfie
            setVerificationStep(2);
            setShowIdSelfieStep(true);
            setBvnResult(data);
            setProgress(50);
            setProgressMessage("BVN verified successfully! Please complete ID and selfie verification.");
            setSuccess("BVN verification successful! Please proceed with ID and selfie verification.");
            
            // Save this verification stage
            saveVerificationData('bvn', data.data, true, matchResult);
          } else {
            // BVN verification failed
            setProgress(100);
            setProgressMessage("BVN verification failed");
            setError(data.message || "BVN verification failed. Please check your information and try again.");
            
            // Save failed verification data
            saveVerificationData('bvn', data.data || {}, false, { isMatch: false });
          }
        } else if (verificationStep === 2) {
          // Second step: ID + Selfie verification after BVN
          setProgressMessage("Processing ID and selfie verification for BVN...");
          
          const idImageBase64 = idImage ? await convertFileToBase64(idImage) : null;
          const selfieImageBase64 = selfieImage ? await convertFileToBase64(selfieImage) : null;
          
          console.log("Using complete BVN verification with ID and selfie for client");
          
          // Use the combined verification endpoint
          const data = await verificationService.verifyBVNComplete(
            bvnNumber, 
            selfieImageBase64, 
            idImageBase64,
            idType,
            'client', 
            userDetails.id
          );
          
          if (data.status === "success" || data.status === "pending") {
            // Save the complete verification data
            const matchResult = validateUserDetails(bvnResult?.data || data.data);
            saveVerificationData('bvn_id_selfie', data.data, 
                                data.status === "success", matchResult);
            
            if (data.status === "success") {
              setProgress(100);
              setProgressMessage("Verification successful!");
              setSuccess("Your identity has been verified successfully!");
              
              verificationService.saveVerificationStatus(
                true, 
                'verified', 
                'BVN with ID and Selfie verification successful',
                userDetails.id,
                'client'
              );
              
              setVerificationStatus({
                verified: true,
                verificationStatus: 'verified'
              });
              
              setTimeout(() => {
                navigate("/app/client/dashboard");
              }, 3000);
            } else {
              // Pending verification
              setProgress(70);
              setProgressMessage("Verification submitted and pending review...");
              setSuccess("Your verification is being processed. You'll be notified when it's complete.");
              
              // Start polling for status
              setIsPolling(true);
            }
          } else {
            // Verification failed
            setProgress(100);
            setProgressMessage("Verification failed");
            setError(data.message || "Verification failed. Please check your information and try again.");
            
            // Save failed verification data
            saveVerificationData('bvn_id_selfie', data.data || {}, false, { isMatch: false });
          }
        }
      } else if (verificationMethod === "nin") {
        if (verificationStep === 1) {
          // First step: NIN verification
          setProgressMessage("Processing NIN verification...");
          
          const data = await verificationService.verifyNIN(
            ninNumber, 
            null, 
            'client', 
            userDetails.id
          );
          
          if (data.status === "success") {
            // Validate the user details from NIN against stored user details
            const matchResult = validateUserDetails(data.data);
            console.log("NIN verification user match:", matchResult);
            
            // Check if this is a test NIN value using the consistent helper function
            const isTestNin = isTestValue('NIN', ninNumber) || (data.data && isTestValue('NIN', data.data.nin));
            
            if (!matchResult.isMatch && !isTestNin) {
              setProgress(100);
              setProgressMessage("Verification failed: User details mismatch");
              setError(`The name on your NIN (${data.data.first_name || data.data.firstName} ${data.data.last_name || data.data.lastName}) does not match your profile. Please contact support.`);
              
              // Save verification data for later auditing
              saveVerificationData('nin', data.data, false, matchResult);
              return;
            }
            
            // NIN verified successfully, now need selfie
            setVerificationStep(2);
            setShowIdSelfieStep(true);
            setNinResult(data);
            setProgress(50);
            setProgressMessage("NIN verified successfully! Please complete the selfie verification.");
            setSuccess("NIN verification successful! Please proceed with selfie verification.");
            
            // Save this verification stage
            saveVerificationData('nin', data.data, true, matchResult);
          } else {
            // NIN verification failed
            setProgress(100);
            setProgressMessage("NIN verification failed");
            setError(data.message || "NIN verification failed. Please check your information and try again.");
            
            // Save failed verification data
            saveVerificationData('nin', data.data || {}, false, { isMatch: false });
          }
        } else if (verificationStep === 2) {
          // Second step: Selfie verification after NIN
          setProgressMessage("Processing selfie verification for NIN...");
          
          const selfieImageBase64 = selfieImage ? await convertFileToBase64(selfieImage) : null;
          
          console.log("Using complete NIN verification with selfie for client");
          
          // Use the combined verification endpoint
          const data = await verificationService.verifyNINComplete(
            ninNumber, 
            selfieImageBase64, 
            'client', 
            userDetails.id
          );
          
          if (data.status === "success" || data.status === "pending") {
            // Save the complete verification data
            const matchResult = validateUserDetails(ninResult?.data || data.data);
            saveVerificationData('nin_selfie', data.data, 
                                data.status === "success", matchResult);
            
            if (data.status === "success") {
              setProgress(100);
              setProgressMessage("Verification successful!");
              setSuccess("Your identity has been verified successfully!");
              
              verificationService.saveVerificationStatus(
                true, 
                'verified', 
                'NIN with Selfie verification successful',
                userDetails.id,
                'client'
              );
              
              setVerificationStatus({
                verified: true,
                verificationStatus: 'verified'
              });
              
              setTimeout(() => {
                navigate("/app/client/dashboard");
              }, 3000);
            } else {
              // Pending verification
              setProgress(70);
              setProgressMessage("Verification submitted and pending review...");
              setSuccess("Your verification is being processed. You'll be notified when it's complete.");
              
              // Start polling for status
              setIsPolling(true);
            }
          } else {
            // Verification failed
            setProgress(100);
            setProgressMessage("Verification failed");
            setError(data.message || "Verification failed. Please check your information and try again.");
            
            // Save failed verification data
            saveVerificationData('nin_selfie', data.data || {}, false, { isMatch: false });
          }
        }
      } else if (verificationMethod === "id") {
        // ID verification is no longer allowed as a standalone option
        setProgress(100);
        setProgressMessage("Invalid verification method");
        setError("ID and selfie verification alone is not allowed. Please use BVN or NIN verification instead.");
      }
    } catch (err) {
      setProgress(100);
      setProgressMessage("Verification failed.");
      setError(err.message || "Verification failed. Please try again later.");
      
      // Update local verification status to display in UI
      setVerificationStatus({
        verified: false,
        verificationStatus: 'failed',
        message: err.message || "Verification failed. Please try again later."
      });
    } finally {
      setIsSubmitting(false);
      
      // Don't start polling again if we're in the middle of a verification
      // and we're moving to step 2, or if the verification just succeeded
      if ((verificationStep === 1 && showIdSelfieStep) || 
          verificationStatus?.verified === true) {
        // Don't start new polling
      } else {
        // Set isPolling to false so that the useEffect can potentially restart polling
        // if needed (it won't if we're verified)
        setIsPolling(false);
      }
    }
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
        <h2>Client Account Verification</h2>
        <p className="verification-intro">
          To ensure a seamless experience and protect all users on our platform, 
          we require clients to verify their identity. Please choose a 
          verification method below.
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
        
        {/* Verification Status Indicator */}
        {isPolling && (
          <div className="verification-status-container">
            <div className="verification-status-card">
              <div className="status-icon">
                <i className={`fas ${
                  verificationStatus?.verified ? 'fa-check-circle' : 
                  verificationStatus?.verificationStatus === 'pending' ? 'fa-clock' : 
                  verificationStatus?.verificationStatus === 'failed' ? 'fa-times-circle' : 
                  'fa-spinner fa-spin'
                }`}></i>
              </div>
              <div className="status-info">
                <h3>Verification Status</h3>
                <p>{
                  verificationStatus?.verified ? 'Verified' : 
                  verificationStatus?.verificationStatus === 'pending' ? 'Pending Review' : 
                  verificationStatus?.verificationStatus === 'failed' ? 'Verification Failed' : 
                  'Checking status...'
                }</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="verification-methods">
            {/* Show method selection only in step 1 */}
            {verificationStep === 1 && !showIdSelfieStep && (
              <div className="method-selection">
                <input
                  type="radio"
                  id="bvn-method"
                  value="bvn"
                  checked={verificationMethod === "bvn"}
                  onChange={handleVerificationMethodChange}
                />
                <label htmlFor="bvn-method" className={verificationMethod === "bvn" ? "selected" : ""}>
                  <div className="method-icon bvn-icon">
                    <i className="fas fa-university"></i>
                  </div>
                  <div className="method-title">BVN Verification</div>
                  <div className="method-description">Verify with your Bank Verification Number (includes ID + Selfie)</div>
                </label>
                
                <input
                  type="radio"
                  id="nin-method"
                  value="nin"
                  checked={verificationMethod === "nin"}
                  onChange={handleVerificationMethodChange}
                />
                <label htmlFor="nin-method" className={verificationMethod === "nin" ? "selected" : ""}>
                  <div className="method-icon nin-icon">
                    <i className="fas fa-id-card"></i>
                  </div>
                  <div className="method-title">NIN Verification</div>
                  <div className="method-description">Verify with your National ID Number (includes Selfie)</div>
                </label>
                
                {/* Removed standalone ID + Selfie verification option */}
              </div>
            )}

            {/* BVN Verification Step 1 */}
            {verificationMethod === "bvn" && verificationStep === 1 && !showIdSelfieStep && (
              <div className="verification-form">
                <div className="form-group">
                  <label htmlFor="bvn">
                    <i className="fas fa-university"></i>
                    Bank Verification Number (BVN)
                  </label>
                  <input
                    type="text"
                    id="bvn"
                    value={bvnNumber}
                    onChange={(e) => setBvnNumber(e.target.value)}
                    placeholder="Enter your 11-digit BVN"
                    pattern="[0-9]{11}"
                    maxLength={11}
                    required
                  />
                  <small>
                    <i className="fas fa-info-circle"></i>
                    Your BVN is a unique 11-digit number from your bank
                  </small>
                </div>
              </div>
            )}

            {/* BVN Verification Step 2: ID and Selfie */}
            {verificationMethod === "bvn" && showIdSelfieStep && verificationStep === 2 && (
              <div className="verification-form">
                <div className="step-info">
                  <div className="step-icon"><i className="fas fa-check-circle"></i></div>
                  <div className="step-details">
                    <h3>BVN Verified</h3>
                    <p>Your BVN has been verified successfully. Complete the ID and selfie verification.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="id-type">
                    <i className="fas fa-id-card"></i>
                    ID Document Type
                  </label>
                  <select
                    id="id-type"
                    value={idType}
                    onChange={handleIdTypeChange}
                    required
                  >
                    <option value="generic">Generic ID</option>
                    <option value="nin">National ID (NIN)</option>
                    <option value="dl">Driver's License</option>
                    <option value="passport">International Passport</option>
                    <option value="voter">Voter's Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="id-image">
                    <i className="fas fa-id-card"></i>
                    Upload your ID Document
                  </label>
                  <div className="file-input-wrapper">
                    <div className="file-input-button">Choose File</div>
                    <input
                      type="file"
                      id="id-image"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, setIdImage)}
                      required
                    />
                  </div>
                  {idImage && <div className="file-name">{idImage.name}</div>}
                  <small>
                    <i className="fas fa-info-circle"></i>
                    Supported formats: JPG, PNG, PDF. Max size: 5MB
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="selfie-image">
                    <i className="fas fa-camera"></i>
                    Upload a selfie with your ID document
                  </label>
                  <div className="file-input-wrapper">
                    <div className="file-input-button">Choose File</div>
                    <input
                      type="file"
                      id="selfie-image"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, setSelfieImage)}
                      required
                    />
                  </div>
                  {selfieImage && <div className="file-name">{selfieImage.name}</div>}
                  <small>
                    <i className="fas fa-info-circle"></i>
                    Hold your ID next to your face for verification
                  </small>
                </div>
              </div>
            )}

            {/* NIN Verification Step 1 */}
            {verificationMethod === "nin" && verificationStep === 1 && !showIdSelfieStep && (
              <div className="verification-form">
                <div className="form-group">
                  <label htmlFor="nin">
                    <i className="fas fa-id-card"></i>
                    National Identification Number (NIN)
                  </label>
                  <input
                    type="text"
                    id="nin"
                    value={ninNumber}
                    onChange={(e) => setNinNumber(e.target.value)}
                    placeholder="Enter your 11-digit NIN"
                    pattern="[0-9]{11}"
                    maxLength={11}
                    required
                  />
                  <small>
                    <i className="fas fa-info-circle"></i>
                    Your NIN is a unique 11-digit number from your national ID card
                  </small>
                </div>
              </div>
            )}

            {/* NIN Verification Step 2: Selfie */}
            {verificationMethod === "nin" && showIdSelfieStep && verificationStep === 2 && (
              <div className="verification-form">
                <div className="step-info">
                  <div className="step-icon"><i className="fas fa-check-circle"></i></div>
                  <div className="step-details">
                    <h3>NIN Verified</h3>
                    <p>Your NIN has been verified successfully. Complete the selfie verification.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="selfie-image">
                    <i className="fas fa-camera"></i>
                    Upload a selfie photo for NIN verification
                  </label>
                  <div className="file-input-wrapper">
                    <div className="file-input-button">Choose File</div>
                    <input
                      type="file"
                      id="selfie-image"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, setSelfieImage)}
                      required
                    />
                  </div>
                  {selfieImage && <div className="file-name">{selfieImage.name}</div>}
                  <small>
                    <i className="fas fa-info-circle"></i>
                    Take a clear selfie photo for identity verification
                  </small>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i> Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle"></i> {verificationStep === 1 ? "Continue Verification" : "Complete Verification"}
                </>
              )}
            </button>
          </div>
        </form>

        <div className="verification-footer">
          <p>
            Your information is securely processed and will only be used for verification purposes. 
            For more details on how we handle your data, please see our <a href="/privacy-policy">Privacy Policy</a>.
          </p>
          <div className="footer-buttons">
            <button 
              className="back-btn" 
              onClick={() => {
                if (verificationStep > 1) {
                  setVerificationStep(1);
                  setShowIdSelfieStep(false);
                  setSuccess('');
                  setError('');
                  setBvnResult(null);
                  setNinResult(null);
                } else {
                  navigate("/app/client/dashboard");
                }
              }}
            >
              <i className="fas fa-arrow-left"></i> {verificationStep > 1 ? "Back to Methods" : "Back to Dashboard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientVerificationPage;
