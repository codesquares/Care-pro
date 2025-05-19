import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./verification-page-footer.css";
import verificationService from "../../../services/verificationService";
import { Helmet } from "react-helmet-async";

const VerificationPage = () => {
  const navigate = useNavigate();
  const [verificationMethod, setVerificationMethod] = useState("bvn");
  const [bvnNumber, setBvnNumber] = useState("");
  const [ninNumber, setNinNumber] = useState("");
  const [idImage, setIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null); 
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

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
    
    // Check initial verification status
    const checkStatus = async () => {
      try {
        setProgress(10);
        setProgressMessage("Checking verification status...");
        const status = await verificationService.getVerificationStatus();
        // If already verified, redirect to profile page
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
    
    // Don't start polling immediately, wait for initial check to complete
    const pollingTimeout = setTimeout(() => {
      // Start polling for verification status updates only if not already verified
      if (!verificationStatus?.verified) {
        setIsPolling(true);
        
        // If polling starts, show a progress indicator that gradually increases
        let progressCounter = 20;
        progressIntervalRef.current = setInterval(() => {
          if (progressCounter < 90) {
            setProgress(progressCounter);
            setProgressMessage("Waiting for verification result...");
            progressCounter += 5;
          }
        }, 10000); // Increased from 5000 to 10000 ms (10 seconds) to reduce frequency
        
        // Pass a longer polling interval (15 seconds instead of 10 seconds)
        pollRef.current = verificationService.pollVerificationStatus(
          (status) => {
            setVerificationStatus(status);
            
            if (status.verified === true) {
              clearInterval(progressIntervalRef.current);
              setIsPolling(false);
              setProgress(100);
              setProgressMessage("Verification successful!");
              setSuccess("Your account has been verified successfully!");
              setTimeout(() => {
                navigate("/app/caregiver/profile");
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
          15000 // 15 seconds polling interval
        );
      }
    }, 3000); // Increased from 1 second to 3 seconds wait before starting polling
    
    // Clean up polling when component unmounts
    return () => {
      if (pollRef.current) {
        pollRef.current();
      }
      clearInterval(progressIntervalRef.current);
      clearTimeout(pollingTimeout);
    };
  }, [token, userDetails, navigate]);

  const handleVerificationMethodChange = (e) => {
    setVerificationMethod(e.target.value);
    setError(""); // Clear errors when changing method
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

  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:image/jpeg;base64, part
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setProgress(10);
    setProgressMessage("Starting verification process...");

    try {
      // Validate inputs based on verification method
      if (verificationMethod === "bvn" && !bvnNumber) {
        throw new Error("BVN number is required");
      } else if (verificationMethod === "nin" && !ninNumber) {
        throw new Error("NIN number is required");
      } else if (verificationMethod === "id" && (!idImage || !selfieImage)) {
        throw new Error("Both ID image and selfie are required");
      }

      setProgress(30);
      setProgressMessage(`Processing ${verificationMethod.toUpperCase()} verification...`);

      // Create form data for ID verification method
      if (verificationMethod === "id") {
        // Convert image files to base64 if needed
        setProgress(50);
        setProgressMessage("Converting and uploading images...");
        
        const idImageBase64 = idImage ? await convertFileToBase64(idImage) : null;
        const selfieImageBase64 = selfieImage ? await convertFileToBase64(selfieImage) : null;
        
        setProgress(70);
        setProgressMessage("Submitting verification data...");
        
        const data = await verificationService.verifyID(idImageBase64, selfieImageBase64);
        
        setProgress(90);
        setProgressMessage("Processing verification results...");
        
        if (data.verified) {
          setProgress(100);
          setProgressMessage("Verification successful!");
          setSuccess("ID verification successful! Your identity has been verified.");
          
          // Save verification status to ensure it persists
          verificationService.saveVerificationStatus(
            true, 
            'verified', 
            'ID verification successful'
          );
          
          // Update local verification status to display in UI
          setVerificationStatus({
            verified: true,
            verificationStatus: 'verified'
          });
          
          // If verification was successful, wait a moment then redirect
          setTimeout(() => {
            navigate("/app/caregiver/profile");
          }, 3000);
        } else if (data.status === "error") {
          setProgress(100);
          setProgressMessage("Verification service error");
          setError(data.message || "There was an error with the verification service. Please try again later.");
          
          // Update local verification status to display in UI
          setVerificationStatus({
            verified: false,
            verificationStatus: 'failed',
            message: data.message
          });
        } else {
          setProgress(100);
          setProgressMessage("Verification failed");
          setError(data.message || "ID verification failed. Please ensure your documents are clear and valid.");
          
          // Update local verification status to display in UI
          setVerificationStatus({
            verified: false,
            verificationStatus: 'failed',
            message: data.message || "ID verification failed. Please ensure your documents are clear and valid."
          });
        }
      } else {
        // Handle BVN/NIN verification
        let data;
        
        setProgress(50);
        setProgressMessage(`Verifying ${verificationMethod.toUpperCase()} number...`);
        
        if (verificationMethod === "bvn") {
          data = await verificationService.verifyBVN(bvnNumber);
        } else {
          data = await verificationService.verifyNIN(ninNumber);
        }
        
        setProgress(90);
        setProgressMessage("Processing verification results...");
        
        if (data.verified) {
          setProgress(100);
          setProgressMessage("Verification successful!");
          setSuccess(`Your ${verificationMethod.toUpperCase()} has been verified successfully! You can now proceed with your profile.`);
          
          // Save verification status to ensure it persists
          verificationService.saveVerificationStatus(
            true, 
            'verified', 
            `${verificationMethod.toUpperCase()} verification successful`
          );
          
          // Update local verification status to display in UI
          setVerificationStatus({
            verified: true,
            verificationStatus: 'verified'
          });
          
          // If verification was successful, wait a moment then redirect
          setTimeout(() => {
            navigate("/app/caregiver/profile");
          }, 3000);
        } else if (data.status === "error") {
          setProgress(100);
          setProgressMessage("Verification service error");
          setError(data.message || "There was an error with the verification service. Please try again later.");
          
          // Update local verification status to display in UI
          setVerificationStatus({
            verified: false,
            verificationStatus: 'failed',
            message: data.message
          });
        } else {
          setProgress(100);
          setProgressMessage("Verification failed");
          setError(data.message || `${verificationMethod.toUpperCase()} verification failed. Please check your information and try again.`);
          
          // Update local verification status to display in UI
          setVerificationStatus({
            verified: false,
            verificationStatus: 'failed',
            message: data.message || `${verificationMethod.toUpperCase()} verification failed. Please check your information and try again.`
          });
        }
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
      // Stop polling if we have the result from direct verification
      if (pollRef.current) {
        pollRef.current();
      }
      setIsPolling(false);
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
                  <label htmlFor="id-image">
                    <i className="fas fa-id-card"></i>
                    Upload your ID (National ID, Driver's License, Passport)
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
