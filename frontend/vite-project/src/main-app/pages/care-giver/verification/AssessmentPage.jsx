import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./assessment-page.css";
import assessmentService from "../../../services/assessmentService";
import { Helmet } from "react-helmet-async";

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState("welcome"); // welcome, instructions, questions, thank-you
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get token and user ID from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");
  
  // To track and abort ongoing fetch requests
  const abortControllerRef = useRef(null);

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
        
        const providerType = userDetails.role || 'caregiver';
        try {
          // Race between the service call and our timeout
          const response = await Promise.race([
            assessmentService.getAssessmentQuestions(providerType, { signal: abortControllerRef.current.signal }),
            timeoutPromise
          ]);
          
          if (response?.success && response?.data && response?.data.length > 0) {
            setQuestions(response.data);
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
    // Redirect if no token or user ID
    if (!token || !userDetails.id) {
      navigate("/login");
      return;
    }
    
    // TESTING: This commented section would normally check verification status
    // We're bypassing this check for testing purposes
    /*
    if (userDetails.verificationStatus !== "verified") {
      navigate("/app/caregiver/profile");
      return;
    }
    */
    
    // Check if user is already qualified or has assessment restrictions
    const qualificationStatus = assessmentService.getQualificationStatus();
    
    // If user is already qualified, show a message and redirect to profile
    if (qualificationStatus.isQualified) {
      alert("You are already qualified as a caregiver! No need to retake the assessment.");
      navigate("/app/caregiver/profile");
      return;
    }
    
    // If user has completed assessment but cannot retake yet
    if (qualificationStatus.assessmentCompleted && !qualificationStatus.canRetake) {
      const retakeDate = new Date(qualificationStatus.canRetakeAfter);
      const formattedDate = retakeDate.toLocaleDateString();
      alert(`You can retake the assessment after ${formattedDate}. Please try again later.`);
      navigate("/app/caregiver/profile");
      return;
    }
    
    // Fetch questions when component mounts
    fetchQuestions();
    
    // Cleanup function to abort any ongoing requests when unmounting
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [navigate, token, userDetails.id]);

  const handleAnswerChange = (questionId, value, isCheckbox = false) => {
    if (isCheckbox) {
      // For checkboxes, we need to handle multiple selections
      setAnswers(prev => {
        const currentAnswers = prev[questionId] || [];
        
        if (currentAnswers.includes(value)) {
          // Remove if already selected
          return {
            ...prev,
            [questionId]: currentAnswers.filter(item => item !== value)
          };
        } else {
          // Add if not selected
          return {
            ...prev,
            [questionId]: [...currentAnswers, value]
          };
        }
      });
    } else {
      // For radio buttons and text inputs
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const moveToNextQuestion = () => {
    const currentQ = questions[currentQuestion];
    
    // Validate current question has an answer
    if (!answers[currentQ.id]) {
      if (currentQ.type === "checkbox") {
        if (!answers[currentQ.id] || answers[currentQ.id].length === 0) {
          setError("Please select at least one option");
          return;
        }
      } else {
        setError("Please provide an answer before continuing");
        return;
      }
    } else if (currentQ.type === "textarea" && answers[currentQ.id].trim() === "") {
      setError("Please provide a detailed response");
      return;
    }
    
    setError("");
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // All questions answered, submit assessment
      submitAssessment();
    }
  };

  const moveToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const startAssessment = () => {
    // When starting assessment, clear any previous answers
    setAnswers({});
    
    // If this is a retake, mark it as such in localStorage
    const qualificationStatus = assessmentService.getQualificationStatus();
    if (qualificationStatus.assessmentCompleted) {
      // Update qualification status to indicate this is a retake
      const updatedStatus = {
        ...qualificationStatus,
        isRetaking: true,
        retakeStarted: new Date().toISOString()
      };
      localStorage.setItem('qualificationStatus', JSON.stringify(updatedStatus));
    }
    
    setCurrentStep("instructions");
  };

  const beginQuestions = () => {
    setCurrentStep("questions");
  };

  const submitAssessment = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // Prepare assessment data
      const assessmentData = {
        userId: userDetails.id,
        providerType: userDetails.role || 'caregiver',
        timestamp: new Date().toISOString(),
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          answer: answers[q.id] || ""
        }))
      };
      
      // Submit to API (in test mode this will save to localStorage)
      const response = await assessmentService.submitAssessment(assessmentData);
      
      // Evaluate the assessment to determine qualification status
      try {
        const evaluationResult = await assessmentService.evaluateAssessment(assessmentData);
        
        if (evaluationResult.success) {
          // Store evaluation results
          const assessmentResult = {
            timestamp: new Date().toISOString(),
            score: evaluationResult.score,
            isPassing: evaluationResult.score >= 50 || evaluationResult.passThreshold === true,
            feedback: evaluationResult.feedback,
            improvements: evaluationResult.improvements,
            canRetakeAfter: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days from now
            wasTimeout: evaluationResult.timeout || false
          };

          // Save qualification status to localStorage
          const qualificationStatus = {
            isQualified: assessmentResult.isPassing,
            assessmentCompleted: true,
            lastAssessmentDate: assessmentResult.timestamp,
            score: assessmentResult.score,
            canRetakeAfter: assessmentResult.canRetakeAfter
          };
          
          localStorage.setItem('qualificationStatus', JSON.stringify(qualificationStatus));
          
          // Update userDetails with assessment information
          const currentUserDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
          currentUserDetails.assessmentCompleted = true;
          currentUserDetails.isQualified = assessmentResult.isPassing;
          localStorage.setItem('userDetails', JSON.stringify(currentUserDetails));
          
          // Set results for display
          setSuccess(
            assessmentResult.isPassing 
              ? "Congratulations! You've successfully qualified as a caregiver." 
              : "Assessment completed. Review your feedback to improve your skills."
          );
          
          // Store the complete assessment data with results
          localStorage.setItem('lastSubmittedAssessment', JSON.stringify({
            timestamp: assessmentResult.timestamp,
            data: assessmentData,
            result: assessmentResult
          }));
        } else {
          throw new Error("Assessment evaluation failed");
        }
      } catch (evalError) {
        console.error("Error evaluating assessment:", evalError);
        // Still consider the submission successful even if evaluation fails
        setSuccess("Assessment submitted successfully!");
      }
      
      // Move to thank you page
      setCurrentStep("thank-you");
      
    } catch (err) {
      console.error("Assessment submission error:", err);
      setError(err.message || "There was an error submitting your assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWelcomeScreen = () => {
    // Check if this is a retake
    const qualificationStatus = assessmentService.getQualificationStatus();
    const isRetake = qualificationStatus.assessmentCompleted && qualificationStatus.canRetake;
    
    return (
      <div className="assessment-welcome">
        <div className="welcome-icon">
          <i className={`fas ${isRetake ? 'fa-sync-alt' : 'fa-clipboard-check'}`}></i>
        </div>
        <h2>{isRetake ? 'Caregiver Assessment Retake' : 'Welcome to the Caregiver Assessment'}</h2>
        {isLoading ? (
          <div className="loading-indicator">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading assessment questions... Please wait.</p>
            <p className="loading-tip">This may take a moment as we generate personalized questions.</p>
            {/* This button becomes visible after 15 seconds via CSS animation */}
            <button 
              className="retry-btn"
              id="loading-retry-button"
              onClick={() => {
                // Force reset loading state and fetch again
                setIsLoading(false);
                setTimeout(() => {
                  setError("");
                  setQuestions([]);
                  fetchQuestions();
                }, 100);
              }}
            >
              <i className="fas fa-sync"></i> Cancel and retry
            </button>
          </div>
        ) : error ? (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
            <button 
              className="retry-btn"
              onClick={() => {
                setError("");
                setQuestions([]);
                fetchQuestions();
              }}
            >
              <i className="fas fa-sync"></i> Retry
            </button>
          </div>
        ) : (
          <>
            {isRetake ? (
              <div className="retake-info-container">
                <p>
                  Welcome back! You now have the opportunity to retake the caregiver assessment.
                  Your previous score was below our qualification threshold, but we appreciate your
                  continued interest in providing care through our platform.
                </p>
                <p>
                  This assessment will help us understand how your caregiving skills have developed.
                  Please answer thoughtfully to demonstrate your expertise.
                </p>
              </div>
            ) : (
              <>
                <p>
                  This assessment will help us understand your caregiving experience, skills, and approach.
                  Your responses will be used to match you with clients who need your specific expertise.
                </p>
                <p>
                  The assessment consists of {questions.length} questions and should take approximately 10-15 minutes to complete.
                </p>
              </>
            )}
            <button 
              className="start-btn"
              onClick={startAssessment}
              disabled={isLoading || questions.length === 0}
            >
              <i className="fas fa-play-circle"></i> {isRetake ? 'Start Retake Assessment' : 'Start Assessment'}
            </button>
          </>
        )}
      </div>
    );
  };

  const renderInstructionsScreen = () => (
    <div className="assessment-instructions">
      <h2>Assessment Instructions</h2>
      <div className="instructions-list">
        <div className="instruction-item">
          <div className="instruction-icon"><i className="fas fa-info-circle"></i></div>
          <div className="instruction-text">
            <h3>Be Honest</h3>
            <p>Answer all questions truthfully to ensure the best client matches for your skills.</p>
          </div>
        </div>
        
        <div className="instruction-item">
          <div className="instruction-icon"><i className="fas fa-clock"></i></div>
          <div className="instruction-text">
            <h3>Take Your Time</h3>
            <p>There's no time limit. Consider each question carefully before answering.</p>
          </div>
        </div>
        
        <div className="instruction-item">
          <div className="instruction-icon"><i className="fas fa-save"></i></div>
          <div className="instruction-text">
            <h3>Complete in One Session</h3>
            <p>The assessment cannot be saved and resumed later, so please complete it in one sitting.</p>
          </div>
        </div>
        
        <div className="instruction-item">
          <div className="instruction-icon"><i className="fas fa-pen"></i></div>
          <div className="instruction-text">
            <h3>Detailed Responses</h3>
            <p>For open-ended questions, provide detailed responses that showcase your experience and approach.</p>
          </div>
        </div>
      </div>
      
      <button 
        className="begin-btn"
        onClick={beginQuestions}
      >
        <i className="fas fa-play-circle"></i> Begin Assessment
      </button>
      
      <button 
        className="back-btn"
        onClick={() => setCurrentStep("welcome")}
      >
        <i className="fas fa-arrow-left"></i> Back to Welcome
      </button>
    </div>
  );

  const renderQuestionScreen = () => {
    const question = questions[currentQuestion];
    
    return (
      <div className="assessment-question">
        <div className="question-progress">
          <div className="progress-text">Question {currentQuestion + 1} of {questions.length}</div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="question-card">
          <h3>{question.text}</h3>
          
          {question.type === "radio" && (
            <div className="radio-options">
              {question.options.map((option, index) => (
                <div className="radio-option" key={index}>
                  <input
                    type="radio"
                    id={`${question.id}-option-${index}`}
                    name={question.id}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => handleAnswerChange(question.id, option)}
                  />
                  <label htmlFor={`${question.id}-option-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          )}
          
          {question.type === "checkbox" && (
            <div className="checkbox-options">
              {question.options.map((option, index) => (
                <div className="checkbox-option" key={index}>
                  <input
                    type="checkbox"
                    id={`${question.id}-option-${index}`}
                    name={question.id}
                    value={option}
                    checked={(answers[question.id] || []).includes(option)}
                    onChange={() => handleAnswerChange(question.id, option, true)}
                  />
                  <label htmlFor={`${question.id}-option-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          )}
          
          {question.type === "textarea" && (
            <div className="textarea-container">
              <textarea
                id={question.id}
                rows="6"
                placeholder="Type your answer here..."
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              ></textarea>
            </div>
          )}
        </div>
        
        {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}
        
        <div className="question-navigation">
          <button 
            className="prev-btn"
            onClick={moveToPreviousQuestion}
            disabled={currentQuestion === 0}
          >
            <i className="fas fa-arrow-left"></i> Previous
          </button>
          
          <button 
            className="next-btn"
            onClick={moveToNextQuestion}
          >
            {currentQuestion === questions.length - 1 ? (
              <>Submit Assessment <i className="fas fa-check-circle"></i></>
            ) : (
              <>Next <i className="fas fa-arrow-right"></i></>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderThankYouScreen = () => {
    // Get the assessment result from localStorage
    const lastAssessment = JSON.parse(localStorage.getItem('lastSubmittedAssessment') || '{}');
    const result = lastAssessment.result || {};
    const isPassing = result.isPassing || false;
    const score = result.score || 0;
    
    return (
      <div className="assessment-thank-you">
        <div className="thank-you-icon">
          <i className={`fas ${isPassing ? 'fa-check-circle' : 'fa-info-circle'}`} 
             style={{ color: isPassing ? '#28a745' : '#ffc107' }}></i>
        </div>
        <h2>Thank You for Completing the Assessment!</h2>
        
        {success && <div className="success-message"><i className="fas fa-check-circle"></i> {success}</div>}
        
        <div className="assessment-results">
          {result.score !== undefined && (
            <div className="score-display">
              <div className="score-circle" style={{ 
                backgroundColor: isPassing ? '#d4edda' : '#fff3cd',
                color: isPassing ? '#155724' : '#856404' 
              }}>
                <span className="score-value">{score}%</span>
              </div>
              <p className="score-label">{
                isPassing 
                  ? "Congratulations! You've met our qualification threshold." 
                  : "You didn't meet the qualification threshold of 50%."
              }</p>
              {result.wasTimeout && (
                <p className="timeout-note">
                  <i className="fas fa-exclamation-triangle"></i> Note: Due to a connection issue, we've provided a provisional evaluation.
                </p>
              )}
            </div>
          )}
          
          {result.feedback && (
            <div className="feedback-section">
              <h3>Assessment Feedback</h3>
              <p>{result.feedback}</p>
            </div>
          )}
          
          {!isPassing && result.improvements && (
            <div className="improvements-section">
              <h3>Areas for Improvement</h3>
              <p>{result.improvements}</p>
              <p className="retake-info">
                You can retake the assessment after 30 days to improve your qualification status.
              </p>
            </div>
          )}
          
          {isPassing && (
            <div className="next-steps">
              <h3>Next Steps</h3>
              <p>
                Now that you're qualified, you can start searching for caregiving opportunities 
                that match your skills and experience.
              </p>
            </div>
          )}
        </div>
        
        {process.env.NODE_ENV !== 'production' && (
          <div className="test-info" style={{ 
            margin: '15px 0', 
            padding: '10px', 
            background: '#f8f9fa', 
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            <p><strong>Testing Mode Info:</strong> Your assessment data has been saved.</p>
            {localStorage.getItem('cachedAssessments') && (
              <>
                <p style={{ marginTop: '5px' }}>You can view it in the browser console with:</p>
                <pre style={{ 
                  background: '#eee', 
                  padding: '8px', 
                  borderRadius: '3px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  localStorage.getItem('cachedAssessments')
                </pre>
              </>
            )}
          </div>
        )}
        <button 
          className="profile-btn"
          onClick={() => navigate("/app/caregiver/profile")}
        >
          <i className="fas fa-user-circle"></i> Return to Profile
        </button>
      </div>
    );
  };

  return (
    <div className="assessment-container">
      <Helmet>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </Helmet>
      <div className="assessment-card">
        {currentStep === "welcome" && renderWelcomeScreen()}
        {currentStep === "instructions" && renderInstructionsScreen()}
        {currentStep === "questions" && renderQuestionScreen()}
        {currentStep === "thank-you" && renderThankYouScreen()}
      </div>
    </div>
  );
};

export default AssessmentPage;
