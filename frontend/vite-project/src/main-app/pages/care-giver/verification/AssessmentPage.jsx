import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./assessment-page.css";
import "./mobile-assessment.css";
import assessmentService from "../../../services/assessmentService";
import trainingMaterialsService from "../../../services/trainingMaterialsService";
import { Helmet } from "react-helmet-async";
import { useCaregiverStatus } from "../../../contexts/CaregiverStatusContext";
import EligibilityDashboard from "../../../components/gigs/EligibilityDashboard";
import CertificateUploadModal from "../../../components/shared/CertificateUploadModal";
import { CATEGORY_TIER_MAP, SERVICE_TIERS } from "../../../constants/serviceClassification";

const AssessmentPage = () => {
  const navigate = useNavigate();
  const { refreshStatusData } = useCaregiverStatus();
  const [currentStep, setCurrentStep] = useState("hub"); // hub, welcome, instructions, questions, thank-you
  const [generalStatus, setGeneralStatus] = useState(null);
  const [generalStatusLoading, setGeneralStatusLoading] = useState(true);
  const [showCertUpload, setShowCertUpload] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]);
  const [trainingMaterials, setTrainingMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialsError, setMaterialsError] = useState("");

  // Get token and user ID from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");
  
  // To track and abort ongoing fetch requests
  const abortControllerRef = useRef(null);

  // Function to fetch training materials
  const fetchTrainingMaterials = async () => {
    try {
      setLoadingMaterials(true);
      setMaterialsError("");
      
      // Get user type (caregiver or cleaner) - capitalize for API
      const userType = userDetails.role?.toLowerCase() || 'caregiver';
      const normalizedUserType = userType.charAt(0).toUpperCase() + userType.slice(1);
      
      const response = await trainingMaterialsService.getTrainingMaterials(normalizedUserType);
      
      if (response.success && response.data) {
        const materials = Array.isArray(response.data) ? response.data : [];
        
        // Filter to get only the latest training material (most recent by createdAt or updatedAt)
        let latestMaterial = null;
        if (materials.length > 0) {
          latestMaterial = materials.reduce((latest, current) => {
            const latestDate = new Date(latest.updatedAt || latest.createdAt);
            const currentDate = new Date(current.updatedAt || current.createdAt);
            return currentDate > latestDate ? current : latest;
          });
        }
        
        setTrainingMaterials(latestMaterial ? [latestMaterial] : []);
        console.log(`Loaded latest training material:`, latestMaterial?.title || 'None available');
      } else {
        setMaterialsError("No training manual available at the moment.");
      }
    } catch (err) {
      console.error("Error fetching training materials:", err);
      
      // Check if it's a 404 error (endpoint not implemented)
      if (err.response?.status === 404 || err.message?.includes('404')) {
        console.log("Training materials endpoint not available on this backend");
        setMaterialsError("Training manual feature is not available in this environment.");
      } else {
        setMaterialsError("Failed to load training materials.");
      }
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Function to handle training material download
  const handleDownloadMaterial = async (materialId, fileName) => {
    try {
      setMaterialsError(""); // Clear any previous errors
      
      // You could add a loading state per material here if needed
      console.log(`Starting download for material: ${materialId}`);
      console.log(`Expected filename: ${fileName}`);
      
      const result = await trainingMaterialsService.downloadMaterial(materialId, fileName);
      
      if (result.success) {
        console.log(`Successfully downloaded: ${result.fileName} using method: ${result.method}`);
        
        // Show success feedback to user
        if (result.method === 'window_open') {
          setMaterialsError(`Download initiated for ${result.fileName}. Check your browser's download folder.`);
        } else {
          setMaterialsError(`Successfully downloaded: ${result.fileName}`);
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMaterialsError("");
        }, 5000);
      } else {
        console.error("Download failed:", result);
        setMaterialsError(`Failed to download ${fileName}. Please try again.`);
      }
    } catch (err) {
      console.error("Error downloading material:", err);
      
      if (err.message?.includes('authentication')) {
        setMaterialsError(`Download failed: File requires authentication. The backend proxy download feature will resolve this issue.`);
      } else if (err.message?.includes('not accessible')) {
        setMaterialsError(`Download failed: File is currently not accessible. Please try again later or contact support.`);
      } else if (err.response?.status === 404) {
        setMaterialsError(`Download failed: Endpoint not found. The enhanced download feature is being deployed.`);
      } else if (err.response?.status === 405) {
        setMaterialsError(`Download failed: Method not allowed. The download endpoint configuration is being updated.`);
      } else if (err.response?.status === 500) {
        setMaterialsError(`Download failed: Server error. The backend proxy is being configured. Please try again shortly.`);
      } else if (err.message?.includes('401') || err.message?.includes('deny or ACL failure')) {
        setMaterialsError(`Download failed: File access restricted. The new backend proxy will resolve this authentication issue.`);
      } else {
        setMaterialsError(`Download failed: ${err.message || 'Unknown error'}. Please try again or contact support.`);
      }
    }
  };

  // Declare fetchQuestions outside of useEffect so it can be called from other functions
  const fetchQuestions = async () => {
    try {
      // Cancel any ongoing requests first
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      
      // Only set loading state if we're actually going to fetch
      if (questions.length === 0) {
        setIsLoading(true);
        
        // Create a promise that will reject after 30 seconds
        // This ensures we never get stuck in loading state
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Loading timeout exceeded"));
          }, 30000);
        });
        
        // Get user type (caregiver or cleaner)
        const userType = userDetails.role?.toLowerCase() || 'caregiver';
        
        try {
          // Race between the service call and our timeout
          const response = await Promise.race([
            assessmentService.getAssessmentQuestions(userType, { signal: abortControllerRef.current.signal }),
            timeoutPromise
          ]);
          
          if (response?.success && response?.data && response?.data.length > 0) {
            // The questions are already filtered by the backend for the appropriate user type
            const assessmentQuestions = response.data;
            
            // Map the backend field names to what the frontend expects
            const formattedQuestions = assessmentQuestions.map(q => ({
              id: q.id || q.Id,
              text: q.question || q.Question, // Using question field from backend
              options: q.options || q.Options, // Using options field from backend
              correctAnswer: q.correctAnswer || q.CorrectAnswer,
              explanation: q.explanation || q.Explanation,
              category: q.category || q.Category
            }));
            
            console.log('Original question format:', assessmentQuestions[0]);
            console.log('Formatted question:', formattedQuestions[0]);
            
            setQuestions(formattedQuestions);
            setError(""); // Clear any previous errors
            
            // Display data source message (for development purposes)
            if (response.fromAPI) {
              console.info("Using questions from backend API");
            } else if (response.cachedOnly) {
              console.info("Using cached or locally generated questions");
            }
          } else {
            setError("Could not load assessment questions. Please try again.");
          }
        } catch (err) {
          console.error("Error fetching assessment questions:", err);
          setError(err.message || "Failed to load assessment questions. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      }
    } catch (outerErr) {
      console.error("Unexpected error in fetchQuestions:", outerErr);
      setIsLoading(false);
      setError("An unexpected error occurred. Please refresh the page and try again.");
    }
  };
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Redirect if no token or user ID
    if (!token || !userDetails.id) {
      navigate("/login");
      return;
    }
    
    let isMounted = true;
    
    // Load general assessment status for the hub (no redirects — hub shows status inline)
    const loadHubStatus = async () => {
      try {
        setGeneralStatusLoading(true);
        const qualificationData = await assessmentService.getQualificationStatus(userDetails.id);
        
        if (!isMounted) return;
        
        // Merge with localStorage for additional info (attempt counts, retake timing)
        let localStatus = {};
        try {
          localStatus = JSON.parse(localStorage.getItem('qualificationStatus') || '{}');
        } catch (err) {
          console.warn('Error parsing qualificationStatus from localStorage:', err);
        }
        
        setGeneralStatus({
          ...qualificationData,
          attemptCount: localStatus.attemptCount || qualificationData.attemptCount || 0,
          canRetakeAfter: localStatus.canRetakeAfter || qualificationData.canRetakeAfter || null,
          score: qualificationData.score || localStatus.score || null,
        });
      } catch (err) {
        console.error('Error checking qualification status:', err);
        
        if (!isMounted) return;
        
        // Fall back to localStorage
        try {
          const localStatus = JSON.parse(localStorage.getItem('qualificationStatus') || '{}');
          setGeneralStatus(localStatus);
        } catch (parseErr) {
          console.warn('Error parsing localStorage:', parseErr);
          setGeneralStatus({});
        }
      } finally {
        if (isMounted) {
          setGeneralStatusLoading(false);
        }
      }
    };
    
    loadHubStatus();
    
    // Cleanup function to abort any ongoing requests when unmounting
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [navigate, token, userDetails.id]);

  // Scroll to top when step or question changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep, currentQuestion]);

  // Handler to start or retake the general assessment from the hub
  const handleStartGeneralAssessment = async () => {
    if (generalStatus?.isQualified) return; // Already qualified

    // Check retake cooldown
    if (generalStatus?.canRetakeAfter) {
      const retakeDate = new Date(generalStatus.canRetakeAfter);
      if (retakeDate > new Date()) {
        setError(`You can retake the assessment after ${retakeDate.toLocaleDateString()}.`);
        return;
      }
    }

    setIsLoading(true);
    setError('');

    // Fetch questions if not loaded yet
    if (questions.length === 0) {
      await fetchQuestions();
    }

    // Fetch training materials
    fetchTrainingMaterials();

    setIsLoading(false);
    setCurrentStep('welcome');
  };

  // Navigate back to the assessment hub
  const backToHub = async () => {
    // Reset assessment state
    setCurrentQuestion(0);
    setAnswers({});
    setAssessmentResult(null);
    setQuestionsWithAnswers([]);
    setError('');
    setSuccess('');

    // Refresh general status
    try {
      setGeneralStatusLoading(true);
      const qualData = await assessmentService.getQualificationStatus(userDetails.id);
      let localStatus = {};
      try {
        localStatus = JSON.parse(localStorage.getItem('qualificationStatus') || '{}');
      } catch {
        // ignore parse errors
      }
      setGeneralStatus({
        ...qualData,
        attemptCount: localStatus.attemptCount || qualData.attemptCount || 0,
        canRetakeAfter: localStatus.canRetakeAfter || qualData.canRetakeAfter || null,
        score: qualData.score || localStatus.score || null,
      });
    } catch {
      try {
        const localStatus = JSON.parse(localStorage.getItem('qualificationStatus') || '{}');
        setGeneralStatus(localStatus);
      } catch {
        // ignore parse errors
      }
    } finally {
      setGeneralStatusLoading(false);
    }

    setCurrentStep('hub');
  };

  const handleAnswerChange = (questionId, value) => {
    // For multiple-choice answers (radio buttons)
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const moveToNextQuestion = () => {
    const currentQ = questions[currentQuestion];
    
    // Validate current question has an answer
    if (!answers[currentQ.id]) {
      setError("Please select an answer before continuing");
      return;
    }
    
    setError("");
    
    // Scroll to top before moving to next question
    window.scrollTo(0, 0);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // All questions answered, submit assessment
      submitAssessment();
    }
  };

  const moveToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      // Scroll to top before moving to previous question
      window.scrollTo(0, 0);
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const startAssessment = () => {
    // When starting assessment, clear any previous answers
    setAnswers({});
    
    // If this is a retake, mark it as such in localStorage
    // First check localStorage for cached qualification status
    let qualificationStatus;
    try {
      qualificationStatus = JSON.parse(localStorage.getItem('qualificationStatus') || '{}');
    } catch (err) {
      console.warn('Error parsing qualification status from localStorage:', err);
      qualificationStatus = {};
    }
    if (qualificationStatus.assessmentCompleted) {
      // Update qualification status to indicate this is a retake
      const updatedStatus = {
        ...qualificationStatus,
        isRetaking: true,
        retakeStarted: new Date().toISOString()
      };
      localStorage.setItem('qualificationStatus', JSON.stringify(updatedStatus));
    }
    
    // Scroll to top when transitioning to instructions
    window.scrollTo(0, 0);
    setCurrentStep("instructions");
  };

  const beginQuestions = () => {
    // Scroll to top when transitioning to questions
    window.scrollTo(0, 0);
    setCurrentStep("questions");
  };

  const submitAssessment = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // Prepare assessment data to exactly match the AddAssessmentRequest model in the backend
      const userType = userDetails.role?.toLowerCase() || 'caregiver';
      
      const assessmentData = {
        userId: userDetails.id,
        caregiverId: userDetails.id, // Using the same ID for caregiverId field
        userType: userType.charAt(0).toUpperCase() + userType.slice(1), // Capitalize for API
        questions: questions.map(q => ({
          questionId: q.id,
          question: q.text,
          options: q.options || [], // Include options array
          correctAnswer: "", // Leave empty as we don't know the correct answer
          userAnswer: answers[q.id] || "",
          isCorrect: false // Default to false, will be determined by backend
        })),
        status: "Completed",
        score: 0 // Score will be calculated on the backend
      };
      
      // Submit to API
      const response = await assessmentService.submitAssessment(assessmentData);
      
      if (response.success) {
        // Store the result for display
        const assessmentResult = {
          timestamp: new Date().toISOString(),
          score: response.data.score || 0,
          isPassing: response.data.passed || false, // Using threshold from backend
          assessmentId: response.data.id || '',
          // Check if this is the third failed attempt
          attemptNumber: response.data.attemptNumber || 1
        };
        
        setAssessmentResult(assessmentResult);
        
        // Prepare questions with answers and explanations for the results page
        const questionsWithAnswersData = questions.map(q => ({
          ...q,
          userAnswer: answers[q.id] || "",
          isCorrect: q.correctAnswer === answers[q.id],
        }));
        
        setQuestionsWithAnswers(questionsWithAnswersData);

        // Get attempt history
        const attemptHistory = JSON.parse(localStorage.getItem('assessmentAttempts') || '{"attempts": [], "count": 0}');
        
        // Determine if user needs to wait before retaking
        let canRetakeAfter = null;
        
        if (assessmentResult.isPassing) {
          // If passed, no need to wait
          canRetakeAfter = null;
        } else {
          if (attemptHistory.count >= 3) {
            // After 3 failed attempts, set 15-day waiting period
            canRetakeAfter = new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)).toISOString();
            console.log("User has failed 3 attempts. Must wait 15 days before retrying.");
          } else {
            // Can retake immediately if less than 3 attempts
            canRetakeAfter = null;
            console.log(`User has failed ${attemptHistory.count} attempt(s). Can retry immediately.`);
          }
        }
        
        // Save qualification status to localStorage
        const qualificationStatus = {
          isQualified: assessmentResult.isPassing,
          assessmentCompleted: true,
          lastAssessmentDate: assessmentResult.timestamp,
          score: assessmentResult.score,
          attemptCount: attemptHistory.count,
          canRetakeAfter: canRetakeAfter
        };
        
        localStorage.setItem('qualificationStatus', JSON.stringify(qualificationStatus));
        
        // Update userDetails with assessment information
        const currentUserDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        currentUserDetails.assessmentCompleted = true;
        currentUserDetails.isQualified = assessmentResult.isPassing;
        localStorage.setItem('userDetails', JSON.stringify(currentUserDetails));
        
        // Refresh the caregiver status context to update publishing eligibility
        console.log('🔄 Assessment completed, refreshing caregiver status context...');
        if (refreshStatusData) {
          await refreshStatusData();
          console.log('✅ Caregiver status context refreshed after assessment');
        }
        
        // Set results for display
        setSuccess(
          assessmentResult.isPassing 
            ? "Congratulations! You've successfully qualified as a caregiver." 
            : assessmentResult.attemptNumber >= 3 
            ? "Assessment completed. You didn't meet the required passing score of 70%. You've completed 3 attempts and must wait 15 days before trying again." 
            : `Assessment completed. You didn't meet the required passing score of 70%. You have ${3 - assessmentResult.attemptNumber} attempt(s) remaining.`
        );
        
        // Store the complete assessment data with results
        localStorage.setItem('lastSubmittedAssessment', JSON.stringify({
          timestamp: assessmentResult.timestamp,
          data: assessmentData,
          result: assessmentResult
        }));
        
        // Scroll to top before showing results
        window.scrollTo(0, 0);
        
        // Move to thank you page
        setCurrentStep("thank-you");
      } else {
        throw new Error("Assessment submission failed");
      }
    } catch (err) {
      console.error("Assessment submission error:", err);
      setError(err.message || "There was an error submitting your assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Hub View ─────────────────────────────────────────────────────────────
  const renderHub = () => {
    return (
      <div className="mobile-assessment-container fade-in">
        <div className="assessment-content">
          {/* Hub Header */}
          <div className="account-verification-header">
            <h1>Caregiver Assessments</h1>
            <p className="hub-subtitle">
              Complete assessments and certifications to unlock service categories
            </p>
          </div>

          {/* ── General Assessment Card ─────────────────────────────────── */}
          <div className="hub-section">
            <div className="hub-section-header">
              <h2><i className="fas fa-clipboard-check"></i> General Assessment</h2>
              <span className="hub-badge hub-badge-required">Required</span>
            </div>

            <div className={`hub-card ${generalStatus?.isQualified ? 'hub-card-passed' : generalStatus?.assessmentCompleted ? 'hub-card-failed' : 'hub-card-new'}`}>
              {generalStatusLoading ? (
                <div className="hub-card-loading">
                  <div className="spinner"></div>
                  <p>Checking status...</p>
                </div>
              ) : generalStatus?.isQualified ? (
                /* ── Passed ──────────────────────────────────── */
                <div className="hub-card-body">
                  <div className="hub-status-row">
                    <div className="hub-status-icon hub-icon-passed">✅</div>
                    <div className="hub-status-info">
                      <h3>Assessment Passed</h3>
                      <p>You've successfully completed the general caregiver assessment.</p>
                    </div>
                  </div>
                  {generalStatus?.score != null && (
                    <div className="hub-score-bar">
                      <div className="hub-score-fill passing" style={{ width: `${generalStatus.score}%` }}></div>
                      <span className="hub-score-label">{generalStatus.score}%</span>
                    </div>
                  )}
                </div>
              ) : generalStatus?.assessmentCompleted ? (
                /* ── Failed / needs retake ────────────────────── */
                <div className="hub-card-body">
                  <div className="hub-status-row">
                    <div className="hub-status-icon hub-icon-failed">⚠️</div>
                    <div className="hub-status-info">
                      <h3>Assessment Not Passed</h3>
                      <p>You need a score of 70% or higher to qualify.</p>
                    </div>
                  </div>
                  {generalStatus?.score != null && (
                    <div className="hub-score-bar">
                      <div className="hub-score-fill failing" style={{ width: `${generalStatus.score}%` }}></div>
                      <span className="hub-score-label">{generalStatus.score}%</span>
                    </div>
                  )}
                  {(() => {
                    const canRetakeAfter = generalStatus?.canRetakeAfter;
                    const retakeBlocked = canRetakeAfter && new Date(canRetakeAfter) > new Date();
                    return retakeBlocked ? (
                      <div className="hub-cooldown">
                        <i className="fas fa-hourglass-half"></i>
                        You can retake after {new Date(canRetakeAfter).toLocaleDateString()}
                      </div>
                    ) : (
                      <button className="hub-action-btn" onClick={handleStartGeneralAssessment}>
                        <i className="fas fa-redo"></i> Retake Assessment
                      </button>
                    );
                  })()}
                </div>
              ) : (
                /* ── Not yet taken ───────────────────────────── */
                <div className="hub-card-body">
                  <div className="hub-status-row">
                    <div className="hub-status-icon hub-icon-new">📝</div>
                    <div className="hub-status-info">
                      <h3>Not Yet Taken</h3>
                      <p>
                        Complete this assessment to qualify as a caregiver. It covers
                        caregiving principles, safety, and best practices.
                      </p>
                    </div>
                  </div>

                  <div className="hub-detail-chips">
                    <span className="hub-chip">
                      <i className="fas fa-clock"></i> ~15 min
                    </span>
                    <span className="hub-chip">
                      <i className="fas fa-list-ol"></i> 30 questions
                    </span>
                    <span className="hub-chip">
                      <i className="fas fa-trophy"></i> 70% to pass
                    </span>
                  </div>

                  <button
                    className="hub-action-btn hub-action-primary"
                    onClick={handleStartGeneralAssessment}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                    ) : (
                      <>Take Assessment <i className="fas fa-arrow-right"></i></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Specialized Assessments ──────────────────────────────── */}
          <div className="hub-section">
            <div className="hub-section-header">
              <h2><i className="fas fa-star"></i> Specialized Assessments</h2>
              <span className="hub-badge hub-badge-advanced">Advanced</span>
            </div>
            <p className="hub-section-desc">
              Unlock specialized care categories by passing category-specific assessments
              and uploading required certifications.
            </p>
            <EligibilityDashboard
              caregiverId={userDetails.id}
              compact={false}
              onUploadCert={() => setShowCertUpload(true)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderWelcomeScreen = () => {
    // Check if this is a retake
    // First check localStorage for cached qualification status
    let qualificationStatus;
    try {
      qualificationStatus = JSON.parse(localStorage.getItem('qualificationStatus') || '{}');
    } catch (err) {
      console.warn('Error parsing qualification status from localStorage:', err);
      qualificationStatus = {};
    }
    return (
      <div className="mobile-assessment-container fade-in">
        {/* User Profile Card */}
        {/* <div className="caregiver-profile-card-assesment">
          <ProfileCard />
        </div> */}

        {/* Assessment Content */}
        <div className="assessment-content">
          {/* Back to Hub */}
          <button className="hub-back-btn" onClick={backToHub}>
            <i className="fas fa-arrow-left"></i> All Assessments
          </button>

          {/* Account Verification Header */}
          <div className="account-verification-header">
            <h1>Account Verification</h1>
            <div className="verification-progress-bar">
              <div className="progress-segment active"></div>
              <div className="progress-segment"></div>
              <div className="progress-segment"></div>
            </div>
          </div>

          {/* Assessment Welcome Card */}
          <div className="assessment-welcome-card">
            <div className="welcome-content">
              <div className="assessment-illustration">
                <svg width="120" height="130" viewBox="0 0 218 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.2489 184.52C14.4489 178.308 13.5195 172.799 12.2488 165.271C10.6606 155.861 8.01348 134.732 21.4255 121.239C32.1551 110.444 44.3671 104.904 49.1319 103.484" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M39.2969 184.264C40.0641 181.576 47.6073 169.889 46.6482 162.004C46.3031 159.761 46.5447 154.602 51.3071 151.91" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M35 131.457C38.6236 125.504 48.4591 117.739 56.2239 116.445C63.9887 115.151 64.6753 120.43 63.6742 122.671C62.1724 126.032 58.9039 129.748 52.3668 136.825C45.8906 143.836 42.355 156.818 41.9427 163.011" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M163.324 110.51C158.291 106.192 145.776 98.5482 135.972 102.524C135.084 102.879 133.237 104.547 132.953 108.381" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M188.899 172.628C188.426 170.735 187.443 164.677 188.011 159.849C188.722 153.815 188.079 131.038 178.133 124.472" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M187.194 124.989L166.738 123.648" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <ellipse cx="187.088" cy="118.753" rx="5.43539" ry="7.50602" fill="#18181B"/>
                  <path d="M179.739 123.052C176.978 118.579 179.005 114.97 180.942 113.196C181.426 112.752 182.085 112.582 182.74 112.612L186.257 112.776C187.917 112.853 189.202 114.26 189.128 115.92L188.866 121.789C188.789 123.524 187.265 124.834 185.538 124.651L181.759 124.25C180.939 124.164 180.172 123.754 179.739 123.052Z" fill="#18181B"/>
                  <path d="M120.612 112.827C120.461 114.165 118.984 114.905 117.822 114.226C116.428 113.412 116.66 111.331 118.198 110.843C119.483 110.435 120.763 111.487 120.612 112.827Z" fill="#18181B"/>
                  <path d="M51.092 117.483L48.6133 49.1202C48.613 39.0305 50.4901 21.9317 71.4537 22.2149C92.4173 22.4981 103.796 22.3329 106.865 22.2149" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M130.945 22.2173H166.18C175.918 22.3943 184.24 26.6425 184.24 42.9273C184.24 59.212 183.758 93.2553 183.05 111.015" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M153.545 195.39C139.026 196.452 100.198 199.282 76.7671 200.285C66.8519 200.285 53.7141 199.01 52.1561 181.168L51.0938 138.509" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <circle cx="118.754" cy="14.1912" r="6.51698" stroke="#18181B" strokeWidth="3.01337"/>
                  <path d="M107.782 18.5694C109.052 22.2438 107.252 24.9289 103.195 25.8122C101.254 26.2346 98.5374 26.2715 93.3154 28.1086C86.7879 30.405 85.553 36.9412 85.3765 42.5941C85.2354 47.1164 87.8465 48.6003 92.4333 48.7769C105.782 48.718 134.374 49.1302 142.007 49.1302C149.946 49.1302 151.1 46.1271 151.357 44.184C152.627 34.5741 149.24 30.7216 146.241 29.3452C144.829 28.6974 140.701 27.084 135.479 25.8122C130.257 24.5403 129.317 22.809 129.834 20.3359C131.104 14.2591 130.363 9.3246 129.834 7.61698C129.246 5.26162 125.812 0.762869 116.779 1.6108C105.488 2.67071 106.194 13.9765 107.782 18.5694Z" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M169.591 109.721L170.264 44.2381C170.264 42.8245 169.463 40.3506 166.199 40.3506C162.841 40.3506 155.3 40.4684 151.883 40.3506" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M84.5471 40.3509H68.287C66.5196 40.1742 63.1261 41.1991 63.6917 46.7123C64.2573 52.2255 66.9909 137.716 68.287 179.772C68.2281 181.893 69.1707 186.063 73.4124 185.78C76.6394 185.565 126.856 182.737 156.911 181.417" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M174.51 110.497L175.441 45.452C175.441 43.5044 174.593 40.6715 169.785 41.3797" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M65.1461 40.8506C63.3786 40.8506 59.3135 40.8506 59.4899 45.4539C59.6595 49.8781 61.2575 95.182 61.7877 116.193" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M61.7852 126.367L63.3759 181.609C63.5527 183.556 64.2597 186.389 72.7438 185.681" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M82.2617 70.8726H115.392" stroke="#0ea5e9" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M82.4844 82.626L154.01 82.2719" stroke="#0ea5e9" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M82.6641 94.4854L138.787 93.9542" stroke="#0ea5e9" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M83.2 112.909L110.811 111.659" stroke="#0ea5e9" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M176.584 111.789C175.29 114.204 172.442 117.483 175.548 123.695" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M135.422 140.569C133.697 142.623 132.731 148.491 142.67 155.531C147.587 158.723 157.785 168.42 159.235 181.672" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M132.838 119.811C131.913 121.545 131.507 124.882 134.391 128.079C135.811 129.654 138.03 131.195 141.379 132.493" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M134.393 128.08C132.543 130.756 130.856 136.244 135.428 140.568C136.613 141.687 140.546 143.764 142.676 144.659" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M170.333 226.974C164.811 214.119 157.081 186.286 170.333 177.797C186.898 167.185 208.38 191.256 215.886 211.962" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M187.451 112.563L126.526 108.176C126.191 108.152 125.845 108.185 125.522 108.279C117.057 110.754 120.226 115.464 123.348 118.2C123.789 118.586 124.349 118.803 124.933 118.856L138.274 120.069" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M1.50781 216.873C2.80195 204.794 11.8092 180.142 27.1318 183.248C42.4544 186.354 46.6302 214.048 46.8027 227.507" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                  <path d="M152.769 147.769C142.934 136.639 137.239 127.839 138.534 116.709C139.255 110.506 142.828 107.948 146.098 111.045C150.44 115.156 153.804 120.333 158.531 122.404C159.457 122.835 162.398 123.698 166.746 123.698" stroke="#18181B" strokeWidth="3.01337" strokeLinecap="round"/>
                </svg>
              </div>
              <h2>Welcome to the Caregiver Assessment</h2>
              <p>This assessment will help us understand your caregiving experience, skills, and approach. It will be used to match you with clients based on your specific expertise.</p>
              <p>The assessment consists of {userDetails.role?.toLowerCase() === 'cleaner' ? '10' : '30'} questions and should take approximately 15 minutes to complete.</p>
            </div>

            <div className="assessment-instructions">
              <div className="instruction-item">
                <div className="instruction-icon">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <div className="instruction-content">
                  <h4>Be Honest</h4>
                  <p>Answer all questions truthfully to ensure the best client matches for your skills.</p>
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="instruction-content">
                  <h4>Take your time</h4>
                  <p>There's no time limit, so think carefully before choosing your answer.</p>
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">
                  <i className="fas fa-check-double"></i>
                </div>
                <div className="instruction-content">
                  <h4>Complete in one session</h4>
                  <p>For best results, complete the assessment in one sitting without interruptions.</p>
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">
                  <i className="fas fa-award"></i>
                </div>
                <div className="instruction-content">
                  <h4>Detailed Responses</h4>
                  <p>For open-ended questions, provide detailed responses that showcase your experience and knowledge.</p>
                </div>
              </div>
            </div>

            {/* Training Materials Section - Only show if endpoint is available */}
            {(trainingMaterials.length > 0 || loadingMaterials || (materialsError && !materialsError.includes('not available'))) && (
              <div className="training-materials-section">
                <div className="training-materials-header">
                  <h3>📚 Latest Training Manual</h3>
                  <p>Review the latest training manual before starting your assessment to improve your chances of success.</p>
                  <div className="download-notice" style={{
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#856404'
                  }}>
                    <i className="fas fa-tools" style={{marginRight: '6px'}}></i>
                    <strong>Download system update in progress:</strong> Enhanced backend proxy is being configured. Downloads may have temporary issues.
                  </div>
                </div>
                
                {loadingMaterials ? (
                  <div className="loading-materials">
                    <div className="spinner"></div>
                    <p>Loading latest training manual...</p>
                  </div>
                ) : materialsError ? (
                  <div className="materials-error">
                    <p>{materialsError}</p>
                    {!materialsError.includes('not available') && (
                      <button 
                        className="retry-materials-btn"
                        onClick={fetchTrainingMaterials}
                      >
                        <i className="fas fa-redo"></i>
                        Retry
                      </button>
                    )}
                  </div>
                ) : trainingMaterials.length > 0 ? (
                  <div className="training-materials-list">
                    {trainingMaterials.map((material) => (
                      <div key={material.id} className="training-material-item">
                        <div className="material-info">
                          <div className="material-icon">
                            <i className={`fas ${
                              material.fileType?.toLowerCase() === 'pdf' ? 'fa-file-pdf' :
                              material.fileType?.toLowerCase() === 'doc' || material.fileType?.toLowerCase() === 'docx' ? 'fa-file-word' :
                              'fa-file-download'
                            }`}></i>
                          </div>
                          <div className="material-details">
                            <h4>{material.title}</h4>
                            {material.description && (
                              <p className="material-description">{material.description}</p>
                            )}
                            <div className="material-meta">
                              <span className="file-type">{material.fileType}</span>
                              {material.fileSize && material.fileSize > 0 ? (
                                <span className="file-size">
                                  {material.fileSize >= 1024 * 1024 
                                    ? `${(material.fileSize / 1024 / 1024).toFixed(1)} MB`
                                    : material.fileSize >= 1024 
                                    ? `${(material.fileSize / 1024).toFixed(1)} KB`
                                    : `${material.fileSize} bytes`
                                  }
                                </span>
                              ) : (
                                <span className="file-size" style={{color: '#888'}}>
                                  Size unknown
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="material-actions">
                          <button
                            className="download-material-btn"
                            onClick={() => handleDownloadMaterial(material.id, material.fileName)}
                            title={`Download ${material.title}`}
                          >
                            <i className="fas fa-download"></i>
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-materials">
                    <p>No training manual is currently available.</p>
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Loading assessment questions...</p>
              </div>
            ) : (
              <>
                {error && <div className="error-message">{error}</div>}
                
                <button 
                  className="proceed-btn"
                  onClick={startAssessment}
                  disabled={isLoading || questions.length === 0}
                >
                  Proceed to Assessments
                  <i className="fas fa-arrow-right"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderInstructionsScreen = () => {
    return (
      <div className="mobile-assessment-container fade-in">
        {/* Assessment Content */}
        <div className="assessment-content">
          {/* Back to Hub */}
          <button className="hub-back-btn" onClick={backToHub}>
            <i className="fas fa-arrow-left"></i> All Assessments
          </button>

          {/* Account Verification Header */}
          <div className="account-verification-header">
            <h1>Account Verification</h1>
            <div className="verification-progress-bar">
              <div className="progress-segment active"></div>
              <div className="progress-segment active"></div>
              <div className="progress-segment"></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="question-card">
            <div className="question-content">
              <h2>Welcome to the Caregiver Assessment</h2>
              <div className="question-text">
                <p>Describe how you will respond to a medical emergency while caring for a patient at home?</p>
              </div>
              <div className="answer-input">
                <textarea 
                  placeholder="Type your response here..."
                  className="response-textarea"
                  rows="4"
                />
              </div>
              <div className="question-navigation">
                <button className="nav-btn previous-btn">
                  <i className="fas fa-arrow-left"></i>
                  Previous
                </button>
                <button className="nav-btn next-btn" onClick={beginQuestions}>
                  Next
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionsScreen = () => {
    if (questions.length === 0) {
      return (
        <div className="error-message">
          <p>No questions are available. Please try again later.</p>
          <button 
            className="primary-button"
            onClick={() => navigate('/app/caregiver/profile')}
          >
            Return to Profile
          </button>
        </div>
      );
    }
    
    const currentQ = questions[currentQuestion];
    
    // Debug the question object structure
    console.log('Current Question Structure:', currentQ);
    
    return (
      <div className="mobile-assessment-container fade-in">
        {/* Assessment Content */}
        <div className="assessment-content">
          {/* Back to Hub */}
          <button className="hub-back-btn" onClick={backToHub}>
            <i className="fas fa-arrow-left"></i> All Assessments
          </button>

          {/* Account Verification Header */}
          <div className="account-verification-header">
            <h1>Account Verification</h1>
            <div className="verification-progress-bar">
              <div className="progress-segment active"></div>
              <div className="progress-segment active"></div>
              <div className="progress-segment active"></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="question-card">
            <div className="question-content">
              <h2>Caregiver Assessment</h2>
              
              {/* Progress indicator */}
              <div className="question-progress">
                <div className="progress-text">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(currentQuestion + 1) / questions.length * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="question-text">
                <p>{currentQ.question || currentQ.Question || currentQ.text || "Question text not available"}</p>
              </div>

              <div className="answer-options">
                {(currentQ.options || currentQ.Options || []).map((option, index) => {
                  // Determine the option letter (A, B, C, D)
                  const optionLetter = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
                  
                  return (
                    <div 
                      className={`answer-option ${answers[currentQ.id] === optionLetter ? 'selected' : ''}`} 
                      key={index}
                      onClick={() => handleAnswerChange(currentQ.id, optionLetter)}
                    >
                      <input 
                        type="radio"
                        id={`option-${index}`}
                        name={`question-${currentQ.id}`}
                        value={optionLetter}
                        checked={answers[currentQ.id] === optionLetter}
                        onChange={() => handleAnswerChange(currentQ.id, optionLetter)}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor={`option-${index}`} className="option-label">
                        <div className="option-indicator">
                          <span className="option-letter">{optionLetter}</span>
                        </div>
                        <span className="option-text">{option}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="question-navigation">
                <button 
                  className="nav-btn previous-btn"
                  onClick={moveToPreviousQuestion}
                  disabled={currentQuestion === 0}
                >
                  <i className="fas fa-arrow-left"></i>
                  Previous
                </button>
                
                <button 
                  className="nav-btn next-btn"
                  onClick={moveToNextQuestion}
                  disabled={isSubmitting}
                >
                  {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
                  <i className="fas fa-arrow-right"></i>
                  {isSubmitting && <i className="fas fa-spinner fa-spin ml-2"></i>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderThankYouScreen = () => {
    const isPassing = assessmentResult?.isPassing;
    const score = assessmentResult?.score || 0;
    
    return (
      <div className="mobile-assessment-container fade-in">
        {/* Assessment Content */}
        <div className="assessment-content">
          {/* Back to Hub */}
          <button className="hub-back-btn" onClick={backToHub}>
            <i className="fas fa-arrow-left"></i> All Assessments
          </button>

          {/* Account Verification Header */}
          <div className="account-verification-header">
            <h1>Account Verification</h1>
            <div className="verification-progress-bar">
              <div className="progress-segment active"></div>
              <div className="progress-segment active"></div>
              <div className="progress-segment active"></div>
            </div>
          </div>

          {/* Results Card */}
          <div className="results-card">
            <div className="results-content">
              <h2>Caregiver Assessment</h2>
              
              {/* Result Status */}
              <div className={`result-status ${isPassing ? 'success' : 'failure'}`}>
                <div className="result-illustration">
                  {isPassing ? (
                    <svg width="120" height="120" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Background circle */}
                      <circle cx="250" cy="250" r="240" fill="#FFF8E1" stroke="#FFD54F" strokeWidth="8"/>
                      
                      {/* Trophy cup */}
                      <g transform="translate(150, 120)">
                        {/* Main cup body */}
                        <path d="M50 80 L150 80 L140 180 L60 180 Z" fill="#FFD700" stroke="#FFA000" strokeWidth="3"/>
                        
                        {/* Cup rim */}
                        <ellipse cx="100" cy="80" rx="50" ry="8" fill="#FFE082"/>
                        
                        {/* Cup handles */}
                        <path d="M40 100 Q20 100 20 120 Q20 140 40 140" fill="none" stroke="#FFD700" strokeWidth="8" strokeLinecap="round"/>
                        <path d="M160 100 Q180 100 180 120 Q180 140 160 140" fill="none" stroke="#FFD700" strokeWidth="8" strokeLinecap="round"/>
                        
                        {/* Trophy base */}
                        <rect x="70" y="180" width="60" height="20" rx="10" fill="#C0C0C0"/>
                        <rect x="60" y="200" width="80" height="15" rx="7" fill="#9E9E9E"/>
                        <rect x="50" y="215" width="100" height="10" rx="5" fill="#757575"/>
                        
                        {/* Trophy stem */}
                        <rect x="95" y="170" width="10" height="20" fill="#FFD700"/>
                      </g>
                      
                      {/* Stars around trophy */}
                      <g fill="#FFD700">
                        {/* Large stars */}
                        <g transform="translate(100, 100) rotate(15)">
                          <path d="M0 -20 L6 -6 L20 -6 L10 2 L16 16 L0 8 L-16 16 L-10 2 L-20 -6 L-6 -6 Z"/>
                        </g>
                        <g transform="translate(400, 150) rotate(-20)">
                          <path d="M0 -18 L5 -5 L18 -5 L9 2 L14 14 L0 7 L-14 14 L-9 2 L-18 -5 L-5 -5 Z"/>
                        </g>
                        <g transform="translate(350, 320) rotate(30)">
                          <path d="M0 -16 L4 -4 L16 -4 L8 2 L12 12 L0 6 L-12 12 L-8 2 L-16 -4 L-4 -4 Z"/>
                        </g>
                        
                        {/* Medium stars */}
                        <g transform="translate(80, 200) rotate(-45)">
                          <path d="M0 -12 L3 -3 L12 -3 L6 1 L9 9 L0 4 L-9 9 L-6 1 L-12 -3 L-3 -3 Z"/>
                        </g>
                        <g transform="translate(420, 280) rotate(60)">
                          <path d="M0 -12 L3 -3 L12 -3 L6 1 L9 9 L0 4 L-9 9 L-6 1 L-12 -3 L-3 -3 Z"/>
                        </g>
                        <g transform="translate(150, 350) rotate(-30)">
                          <path d="M0 -10 L2.5 -2.5 L10 -2.5 L5 1 L7.5 7.5 L0 3 L-7.5 7.5 L-5 1 L-10 -2.5 L-2.5 -2.5 Z"/>
                        </g>
                        
                        {/* Small stars */}
                        <g transform="translate(120, 80) rotate(0)">
                          <path d="M0 -8 L2 -2 L8 -2 L4 1 L6 6 L0 2 L-6 6 L-4 1 L-8 -2 L-2 -2 Z"/>
                        </g>
                        <g transform="translate(380, 100) rotate(45)">
                          <path d="M0 -8 L2 -2 L8 -2 L4 1 L6 6 L0 2 L-6 6 L-4 1 L-8 -2 L-2 -2 Z"/>
                        </g>
                        <g transform="translate(320, 380) rotate(-60)">
                          <path d="M0 -6 L1.5 -1.5 L6 -1.5 L3 1 L4.5 4.5 L0 1.5 L-4.5 4.5 L-3 1 L-6 -1.5 L-1.5 -1.5 Z"/>
                        </g>
                        <g transform="translate(70, 320) rotate(90)">
                          <path d="M0 -6 L1.5 -1.5 L6 -1.5 L3 1 L4.5 4.5 L0 1.5 L-4.5 4.5 L-3 1 L-6 -1.5 L-1.5 -1.5 Z"/>
                        </g>
                      </g>
                      
                      {/* Sparkle effects */}
                      <g fill="#FFF" opacity="0.8">
                        <circle cx="180" cy="120" r="3"/>
                        <circle cx="320" cy="140" r="2"/>
                        <circle cx="150" cy="300" r="2.5"/>
                        <circle cx="380" cy="250" r="2"/>
                        <circle cx="100" cy="380" r="3"/>
                        <circle cx="400" cy="350" r="2.5"/>
                      </g>
                      
                      {/* Additional glow effects */}
                      <g fill="#FFE082" opacity="0.3">
                        <circle cx="250" cy="200" r="80"/>
                      </g>
                    </svg>
                  ) : (
                    <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Person sitting with book */}
                      <g transform="translate(20,40)">
                        {/* Person's head */}
                        <circle cx="80" cy="30" r="15" fill="#2D3748" stroke="#1A202C" strokeWidth="2"/>
                        
                        {/* Hair */}
                        <path d="M65 25c0-12 10-20 15-20s15 8 15 20c0 3-2 8-5 10-3-2-7-2-10 0s-7 0-10 0c-3-2-5-7-5-10z" fill="#1A202C"/>
                        
                        {/* Face details */}
                        <circle cx="75" cy="28" r="1.5" fill="#1A202C"/>
                        <circle cx="85" cy="28" r="1.5" fill="#1A202C"/>
                        <path d="M75 33c2 2 5 2 7 0" stroke="#1A202C" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                        
                        {/* Body */}
                        <ellipse cx="80" cy="60" rx="18" ry="25" fill="#E2E8F0" stroke="#CBD5E0" strokeWidth="2"/>
                        
                        {/* Arms */}
                        <ellipse cx="55" cy="55" rx="8" ry="20" fill="#E2E8F0" stroke="#CBD5E0" strokeWidth="2" transform="rotate(-20 55 55)"/>
                        <ellipse cx="105" cy="65" rx="8" ry="18" fill="#E2E8F0" stroke="#CBD5E0" strokeWidth="2" transform="rotate(30 105 65)"/>
                        
                        {/* Open book */}
                        <g transform="translate(45,70)">
                          <path d="M0 0 L35 0 L35 25 L0 25 Z" fill="#FFF" stroke="#CBD5E0" strokeWidth="2"/>
                          <path d="M35 0 L70 0 L70 25 L35 25 Z" fill="#FFF" stroke="#CBD5E0" strokeWidth="2"/>
                          <path d="M35 0 L35 25" stroke="#CBD5E0" strokeWidth="2"/>
                          
                          {/* Book lines */}
                          <line x1="5" y1="8" x2="30" y2="8" stroke="#A0AEC0" strokeWidth="1"/>
                          <line x1="5" y1="12" x2="25" y2="12" stroke="#A0AEC0" strokeWidth="1"/>
                          <line x1="5" y1="16" x2="28" y2="16" stroke="#A0AEC0" strokeWidth="1"/>
                          
                          <line x1="40" y1="8" x2="65" y2="8" stroke="#A0AEC0" strokeWidth="1"/>
                          <line x1="40" y1="12" x2="60" y2="12" stroke="#A0AEC0" strokeWidth="1"/>
                          <line x1="40" y1="16" x2="63" y2="16" stroke="#A0AEC0" strokeWidth="1"/>
                        </g>
                        
                        {/* Stack of books beside */}
                        <g transform="translate(120,75)">
                          <rect x="0" y="0" width="25" height="4" rx="2" fill="#4299E1"/>
                          <rect x="0" y="4" width="23" height="4" rx="2" fill="#48BB78"/>
                          <rect x="0" y="8" width="27" height="4" rx="2" fill="#ED8936"/>
                          <rect x="0" y="12" width="24" height="4" rx="2" fill="#9F7AEA"/>
                        </g>
                      </g>
                      
                      {/* Question marks floating around */}
                      <g fill="#A0AEC0" opacity="0.7">
                        <g transform="translate(30,20)">
                          <circle cx="0" cy="0" r="12" fill="none" stroke="#A0AEC0" strokeWidth="2"/>
                          <path d="M-4 -3c0-3 2-5 4-5s4 2 4 5c0 2-1 3-2 4l0 2" stroke="#A0AEC0" strokeWidth="2" fill="none" strokeLinecap="round"/>
                          <circle cx="0" cy="6" r="1" fill="#A0AEC0"/>
                        </g>
                        
                        <g transform="translate(150,30)">
                          <circle cx="0" cy="0" r="10" fill="none" stroke="#A0AEC0" strokeWidth="1.5"/>
                          <path d="M-3 -2c0-2 1-3 3-3s3 1 3 3c0 1-1 2-2 3l0 1" stroke="#A0AEC0" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <circle cx="0" cy="4" r="0.8" fill="#A0AEC0"/>
                        </g>
                        
                        <g transform="translate(170,100)">
                          <circle cx="0" cy="0" r="8" fill="none" stroke="#A0AEC0" strokeWidth="1"/>
                          <path d="M-2 -1c0-1 1-2 2-2s2 1 2 2c0 1 0 1-1 2l0 1" stroke="#A0AEC0" strokeWidth="1" fill="none" strokeLinecap="round"/>
                          <circle cx="0" cy="3" r="0.6" fill="#A0AEC0"/>
                        </g>
                      </g>
                    </svg>
                  )}
                </div>
                
                <div className="result-message">
                  {isPassing ? (
                    <>
                      <h3 className="result-title">Congratulations!</h3>
                      <p className="result-subtitle">
                        You have successfully qualified as a caregiver
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="result-title">OH OH</h3>
                      <p className="result-subtitle">
                        You did not meet the qualifications threshold to work with CarePro
                      </p>
                    </>
                  )}
                </div>
                
                <div className="score-display">
                  <div className={`score-circle ${isPassing ? 'passing' : 'failing'}`}>
                    <span className="score-percentage">{score}%</span>
                  </div>
                  <p className="score-message">
                    {isPassing 
                      ? "Your assessment demonstrates excellent understanding of caregiving principles. You are now ready to start helping clients." 
                      : "You have one more shot at getting this right, you can come back in time or try again now."
                    }
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="result-actions">
                {isPassing ? (
                  <>
                    <button 
                      className="proceed-btn success"
                      onClick={backToHub}
                    >
                      View All Assessments
                      <i className="fas fa-arrow-right"></i>
                    </button>
                    <button 
                      className="proceed-btn outline"
                      onClick={() => navigate('/app/caregiver/profile')}
                    >
                      Go to Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="proceed-btn outline"
                      onClick={backToHub}
                    >
                      View All Assessments
                    </button>
                    {assessmentResult?.attemptNumber < 3 && (
                      <button 
                        className="restart-btn"
                        onClick={() => {
                          // Scroll to top before restarting
                          window.scrollTo(0, 0);
                          setCurrentStep('welcome');
                          setCurrentQuestion(0);
                          setAnswers({});
                          setAssessmentResult(null);
                          setError('');
                          setSuccess('');
                        }}
                      >
                        Restart Assessment
                        <i className="fas fa-redo"></i>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Additional Info */}
              {success && <div className="success-message">{success}</div>}
              
              {assessmentResult?.assessmentId && (
                <button 
                  className="refresh-score-btn" 
                  onClick={async () => {
                    try {
                      const scoreResult = await assessmentService.calculateAssessmentScore(assessmentResult.assessmentId);
                      if (scoreResult.success) {
                        setAssessmentResult({
                          ...assessmentResult,
                          score: scoreResult.data.score,
                          isPassing: scoreResult.data.passed
                        });
                        
                        // Update localStorage
                        const qualificationStatus = JSON.parse(localStorage.getItem('qualificationStatus') || '{}');
                        qualificationStatus.score = scoreResult.data.score;
                        qualificationStatus.isQualified = scoreResult.data.passed;
                        localStorage.setItem('qualificationStatus', JSON.stringify(qualificationStatus));
                        
                        setSuccess("Score has been refreshed.");
                      } else {
                        setError("Failed to refresh score. Please try again.");
                      }
                    } catch (err) {
                      console.error("Error refreshing score:", err);
                      setError("An error occurred while refreshing the score.");
                    }
                  }}
                >
                  Refresh Score
                </button>
              )}

              {/* Detailed Results (Collapsible) */}
              <details className="detailed-results">
                <summary>View Detailed Results</summary>
                <div className="results-breakdown">
                  <p><strong>Passing threshold:</strong> 70%</p>
                  <p><strong>Attempt:</strong> {assessmentResult?.attemptNumber || 1} of 3 allowed</p>
                  
                  {!isPassing && assessmentResult?.attemptNumber < 3 && (
                    <p className="retake-info">You may retake the assessment immediately.</p>
                  )}
                  
                  {!isPassing && assessmentResult?.attemptNumber >= 3 && (
                    <p className="waiting-period-info">You must wait 15 days before your next attempt.</p>
                  )}

                  {/* Question Results */}
                  {questionsWithAnswers.length > 0 && (
                    <div className="questions-summary">
                      <h4>Questions & Answers</h4>
                      {questionsWithAnswers.map((q, index) => (
                        <div key={index} className={`result-item ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                          <div className="result-question">
                            <span className="question-number">{index + 1}.</span> {q.text}
                          </div>
                          
                          <div className="result-status-mini">
                            {q.isCorrect ? 
                              <div className="correct-badge"><i className="fas fa-check-circle"></i> Correct</div> : 
                              <div className="incorrect-badge"><i className="fas fa-times-circle"></i> Incorrect</div>
                            }
                          </div>
                          
                          {q.explanation && (
                            <div className="result-explanation">
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Caregiver Assessment | CarePro</title>
      </Helmet>
      
      <div className="mobile-assessment-page">
        {currentStep === 'hub' && renderHub()}
        {currentStep === 'welcome' && renderWelcomeScreen()}
        {currentStep === 'instructions' && renderInstructionsScreen()}
        {currentStep === 'questions' && renderQuestionsScreen()}
        {currentStep === 'thank-you' && renderThankYouScreen()}
      </div>

      {/* Certificate upload modal — stays in the assessment flow */}
      <CertificateUploadModal
        isOpen={showCertUpload}
        onClose={() => setShowCertUpload(false)}
        caregiverId={userDetails.id}
        onUploadDone={() => {
          // Force EligibilityDashboard to re-fetch by re-mounting
          // (the dashboard fetches on mount via its own useEffect)
          setShowCertUpload(false);
        }}
      />
    </>
  );
};

export default AssessmentPage;
