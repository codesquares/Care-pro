import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./verification-page-footer.css";
import verificationService from "../../../services/verificationService";
import { Helmet } from "react-helmet-async";
import convertFileToBase64 from "./convertFileToBase64";

const VerificationPage = () => {
  // Constants for test values - matching client implementation
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
  
  // Multi-step verification state - matching client implementation
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
        "caregiver"
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
                `Verification in progress (attempt ${status.pollingAttempt || 1}/${
                  status.maxAttempts || 10
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
          
          // Check if using a test BVN value
          const isTestBvn = isTestValue('BVN', bvnNumber);
          if (isTestBvn) {
            console.log('🧪 Using test BVN value:', bvnNumber);
          }
          
          const data = await verificationService.verifyBVN(
            bvnNumber, 
            null, 
            null, 
            'caregiver', 
            userDetails.id
          );
          
          if (data.status === "success") {
            // BVN verified successfully, now need ID + selfie
            setVerificationStep(2);
            setShowIdSelfieStep(true);
            setBvnResult(data);
            setProgress(50);
            setProgressMessage("BVN verified successfully! Please complete ID and selfie verification.");
            setSuccess("BVN verification successful! Please proceed with ID and selfie verification.");
          } else {
            // BVN verification failed
            setProgress(100);
            setProgressMessage("BVN verification failed");
            setError(data.message || "BVN verification failed. Please check your information and try again.");
          }
        } else if (verificationStep === 2) {
          // Second step: ID + Selfie verification after BVN
          setProgressMessage("Processing ID and selfie verification for BVN...");
          
          const idImageBase64 = idImage ? await convertFileToBase64(idImage) : null;
          const selfieImageBase64 = selfieImage ? await convertFileToBase64(selfieImage) : null;
          
          console.log("Using complete BVN verification with ID and selfie for caregiver");
          
          // Use the combined verification endpoint
          const data = await verificationService.verifyBVNComplete(
            bvnNumber, 
            selfieImageBase64, 
            idImageBase64,
            idType,
            'caregiver', 
            userDetails.id
          );
          
          if (data.status === "success" || data.status === "pending") {
            if (data.status === "success") {
              setProgress(100);
              setProgressMessage("Verification successful!");
              setSuccess("Your identity has been verified successfully!");
              
              // Check if verification uses test values - handle differently
              const isTestBvn = isTestValue('BVN', bvnNumber);
              if (isTestBvn) {
                console.log('🧪 Test BVN detected - Saving verification status but skipping Azure submission');
              } else {
                // Save verification data to Azure via verificationService
                try {
                  const verificationRecord = {
                    method: 'bvn_id_selfie',
                    userId: userDetails.id,
                    userType: 'caregiver',
                    timestamp: new Date().toISOString(),
                    status: 'verified',
                    azureData: {
                      userId: userDetails.id,
                      userType: 'caregiver',
                      verificationType: 'bvn_id_selfie',
                      status: 'verified',
                      verificationMethod: 'bvn',
                      methodDetails: {
                        bvnNumber: bvnNumber,
                        withSelfie: true
                      },
                      userData: data.data?.userData || {},
                      completedAt: new Date().toISOString()
                    }
                  };
                  
                  verificationService.saveVerificationData(verificationRecord)
                    .then(response => {
                      if (response.status !== 'success') {
                        console.warn('Azure submission returned non-success status:', response.status);
                      }
                    })
                    .catch(error => {
                      console.error('Failed to save caregiver verification data to Azure:', error);
                    });
                } catch (err) {
                  console.error('Error preparing verification data for Azure:', err);
                }
              }
              
              verificationService.saveVerificationStatus(
                true, 
                'verified', 
                'BVN with ID and Selfie verification successful',
                userDetails.id,
                'caregiver'
              );
              
              setVerificationStatus({
                verified: true,
                verificationStatus: 'verified'
              });
              
              setTimeout(() => {
                navigate("/app/caregiver/profile");
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
          }
        }
      } else if (verificationMethod === "nin") {
        if (verificationStep === 1) {
          // First step: NIN verification
          setProgressMessage("Processing NIN verification...");
          
          // Check if using a test NIN value
          const isTestNin = isTestValue('NIN', ninNumber);
          if (isTestNin) {
            console.log('🧪 Using test NIN value:', ninNumber);
          }
          
          const data = await verificationService.verifyNIN(
            ninNumber, 
            null, 
            'caregiver', 
            userDetails.id
          );
          
          if (data.status === "success") {
            // NIN verified successfully, now need selfie
            setVerificationStep(2);
            setShowIdSelfieStep(true);
            setNinResult(data);
            setProgress(50);
            setProgressMessage("NIN verified successfully! Please complete the selfie verification.");
            setSuccess("NIN verification successful! Please proceed with selfie verification.");
          } else {
            // NIN verification failed
            setProgress(100);
            setProgressMessage("NIN verification failed");
            setError(data.message || "NIN verification failed. Please check your information and try again.");
          }
        } else if (verificationStep === 2) {
          // Second step: Selfie verification after NIN
          setProgressMessage("Processing selfie verification for NIN...");
          
          const selfieImageBase64 = selfieImage ? await convertFileToBase64(selfieImage) : null;
          
          console.log("Using complete NIN verification with selfie for caregiver");
          
          // Use the combined verification endpoint
          const data = await verificationService.verifyNINComplete(
            ninNumber, 
            selfieImageBase64, 
            'caregiver', 
            userDetails.id
          );
          
          if (data.status === "success" || data.status === "pending") {
            if (data.status === "success") {
              setProgress(100);
              setProgressMessage("Verification successful!");
              setSuccess("Your identity has been verified successfully!");
              
              // Check if verification uses test values - handle differently
              const isTestNin = isTestValue('NIN', ninNumber);
              if (isTestNin) {
                console.log('🧪 Test NIN detected - Saving verification status but skipping Azure submission');
              } else {
                // Save verification data to Azure via verificationService
                try {
                  const verificationRecord = {
                    method: 'nin_selfie',
                    userId: userDetails.id,
                    userType: 'caregiver',
                    timestamp: new Date().toISOString(),
                    status: 'verified',
                    azureData: {
                      userId: userDetails.id,
                      userType: 'caregiver',
                      verificationType: 'nin_selfie',
                      status: 'verified',
                      verificationMethod: 'nin',
                      methodDetails: {
                        ninNumber: ninNumber,
                        withSelfie: true
                      },
                      userData: data.data?.userData || {},
                      completedAt: new Date().toISOString()
                    }
                  };
                  
                  verificationService.saveVerificationData(verificationRecord)
                    .then(response => {
                      if (response.status !== 'success') {
                        console.warn('Azure submission returned non-success status:', response.status);
                      }
                    })
                    .catch(error => {
                      console.error('Failed to save caregiver verification data to Azure:', error);
                    });
                } catch (err) {
                  console.error('Error preparing verification data for Azure:', err);
                }
              }
              
              verificationService.saveVerificationStatus(
                true, 
                'verified', 
                'NIN with Selfie verification successful',
                userDetails.id,
                'caregiver'
              );
              
              setVerificationStatus({
                verified: true,
                verificationStatus: 'verified'
              });
              
              setTimeout(() => {
                navigate("/app/caregiver/profile");
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
          }
        }
      } else if (verificationMethod === "id") {
        // ID + Selfie verification
        setProgressMessage("Processing ID and selfie verification...");
        
        const idImageBase64 = idImage ? await convertFileToBase64(idImage) : null;
        const selfieImageBase64 = selfieImage ? await convertFileToBase64(selfieImage) : null;
        
        const data = await verificationService.verifyID(
          idImageBase64, 
          selfieImageBase64,
          idType,
          'caregiver', 
          userDetails.id
        );
        
        if (data.status === "success" || data.status === "pending") {
          if (data.status === "success") {
            setProgress(100);
            setProgressMessage("Verification successful!");
            setSuccess("Your identity has been verified successfully!");
            
            // For ID verification, we'll always save to Azure as there's no test value
            // but we'll still catch and handle errors properly
            try {
              const verificationRecord = {
                method: 'id_selfie',
                userId: userDetails.id,
                userType: 'caregiver',
                timestamp: new Date().toISOString(),
                status: 'verified',
                azureData: {
                  userId: userDetails.id,
                  userType: 'caregiver',
                  verificationType: 'id_selfie',
                  status: 'verified',
                  verificationMethod: 'id',
                  methodDetails: {
                    idType: idType,
                    withSelfie: true
                  },
                  userData: data.data?.userData || {},
                  completedAt: new Date().toISOString()
                }
              };
              
              verificationService.saveVerificationData(verificationRecord)
                .then(response => {
                  if (response.status !== 'success') {
                    console.warn('Azure submission returned non-success status:', response.status);
                  }
                })
                .catch(error => {
                  console.error('Failed to save caregiver verification data to Azure:', error);
                });
            } catch (err) {
              console.error('Error preparing verification data for Azure:', err);
            }
            
            verificationService.saveVerificationStatus(
              true, 
              'verified', 
              'ID and Selfie verification successful',
              userDetails.id,
              'caregiver'
            );
            
            setVerificationStatus({
              verified: true,
              verificationStatus: 'verified'
            });
            
            setTimeout(() => {
              navigate("/app/caregiver/profile");
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
        }
      }
    } catch (err) {
      setProgress(100);
      setProgressMessage("Verification failed");
      
      // Provide more specific error messages based on error type
      if (err.response) {
        // The request was made and server responded with an error status code
        if (err.response.status === 401) {
          setError("Authentication error. Please log in again and retry.");
        } else if (err.response.status === 400) {
          setError("Invalid data format: " + (err.message || "Please check your information and try again."));
        } else if (err.response.status === 500) {
          setError("Server error: The verification service is currently unavailable. Please try again later.");
        } else {
          setError(err.message || "Verification failed. Please check your information and try again.");
        }
      } else if (err.request) {
        // The request was made but no response received (network issue)
        setError("Network issue: Unable to connect to verification service. Please check your internet connection.");
      } else {
        // Something happened in setting up the request
        setError(err.message || "Verification failed. Please try again later.");
      }
      
      // Log detailed error for debugging
      console.error("Verification error details:", err);
    } finally {
      setIsSubmitting(false);
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
        <h2>Account Verification</h2>
        <p className="verification-intro">
          To ensure the safety of our clients and maintain high-quality service, 
          we require all caregivers to verify their identity. Please choose a 
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

        {/* Show different forms based on the verification stage */}
        {!showIdSelfieStep ? (
          <form onSubmit={handleSubmit}>
            <div className="verification-methods">
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
                  <div className="method-description">Verify with your Bank Verification Number</div>
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
                  <div className="method-description">Verify with your National ID Number</div>
                </label>
                
                <input
                  type="radio"
                  id="id-method"
                  value="id"
                  checked={verificationMethod === "id"}
                  onChange={handleVerificationMethodChange}
                />
                <label htmlFor="id-method" className={verificationMethod === "id" ? "selected" : ""}>
                  <div className="method-icon id-icon">
                    <i className="fas fa-camera"></i>
                  </div>
                  <div className="method-title">ID & Selfie</div>
                  <div className="method-description">Upload your ID and a selfie with it</div>
                </label>
              </div>

              {/* BVN Verification Form */}
              {verificationMethod === "bvn" && (
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

              {/* NIN Verification Form */}
              {verificationMethod === "nin" && (
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

              {/* ID Document Verification Form */}
              {verificationMethod === "id" && (
                <div className="verification-form">
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
                    <i className="fas fa-check-circle"></i> Submit Verification
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          // Second step form for ID and Selfie uploads
          <form onSubmit={handleSubmit}>
            <div className="verification-methods">
              <h3>
                {verificationMethod === "bvn" ? "BVN Verification - Step 2" :
                 verificationMethod === "nin" ? "NIN Verification - Step 2" :
                 "ID Verification"}
              </h3>
              
              <p className="verification-step-intro">
                {verificationMethod === "bvn" ? 
                  "Your BVN has been verified. Please complete the process by uploading your ID and a selfie." :
                  "Your NIN has been verified. Please complete the process by uploading a selfie."}
              </p>
              
              <div className="verification-form">
                {/* Only show ID document upload for BVN verification */}
                {verificationMethod === "bvn" && (
                  <>
                    <div className="form-group">
                      <label htmlFor="id-type-step2">
                        <i className="fas fa-id-card"></i>
                        ID Document Type
                      </label>
                      <select
                        id="id-type-step2"
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
                      <label htmlFor="id-image-step2">
                        <i className="fas fa-id-card"></i>
                        Upload your ID Document
                      </label>
                      <div className="file-input-wrapper">
                        <div className="file-input-button">Choose File</div>
                        <input
                          type="file"
                          id="id-image-step2"
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
                  </>
                )}
                
                {/* Selfie upload for both BVN and NIN */}
                <div className="form-group">
                  <label htmlFor="selfie-image-step2">
                    <i className="fas fa-camera"></i>
                    Upload a selfie{verificationMethod === "bvn" ? " with your ID document" : ""}
                  </label>
                  <div className="file-input-wrapper">
                    <div className="file-input-button">Choose File</div>
                    <input
                      type="file"
                      id="selfie-image-step2"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, setSelfieImage)}
                      required
                    />
                  </div>
                  {selfieImage && <div className="file-name">{selfieImage.name}</div>}
                  <small>
                    <i className="fas fa-info-circle"></i>
                    {verificationMethod === "bvn" 
                      ? "Hold your ID next to your face for verification"
                      : "Take a clear selfie for identity verification"}
                  </small>
                </div>
              </div>
              
              <div className="button-group">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setVerificationStep(1);
                    setShowIdSelfieStep(false);
                    setBvnResult(null);
                    setNinResult(null);
                  }}
                >
                  <i className="fas fa-arrow-left"></i> Back
                </button>
                
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
                      <i className="fas fa-check-circle"></i> Complete Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

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
