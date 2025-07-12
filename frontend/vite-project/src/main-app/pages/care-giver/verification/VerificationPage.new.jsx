import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./verification-page-footer.css";
import verificationService from "../../../services/verificationService";
import { Helmet } from "react-helmet-async";
import convertFileToBase64 from "./convertFileToBase64";

const VerificationPage = () => {
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

    console.log('[VerificationPage] handleSubmit called with:', {
      verificationMethod,
      bvnNumber,
      ninNumber,
      selfieImage: selfieImage ? 'present' : 'not present',
      idType,
      userDetails,
      token
    });

    try {
      // Validate inputs based on verification method
      if (verificationMethod === "bvn") {
        // Single-step BVN + selfie verification
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
      }
      // ... handle other verification methods similarly
    } catch (err) {
      setProgress(100);
      setProgressMessage("Verification failed");

      // Provide specific error messages based on error type
      if (err.response) {
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
        setError("Network issue: Unable to connect to verification service. Please check your internet connection.");
      } else {
        setError(err.message || "Verification failed. Please try again later.");
      }

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

        {/* Verification Form */}
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

                <div className="form-group">
                  <label htmlFor="selfie-image">
                    <i className="fas fa-camera"></i>
                    Upload a selfie for verification
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
                    Take a clear selfie in good lighting for verification
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
      </div>
    </div>
  );
};

export default VerificationPage;
