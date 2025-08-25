import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./verification-page.css";
import "./assessment-page.css";
import "./mobile-assessment.css";
import "../care-giver-profile/profile-header.css";
import assessmentService from "../../../services/assessmentService";
import { userService } from "../../../services/userService";
import { Helmet } from "react-helmet-async";
import ProfileCard from "../care-giver-dashboard/ProfileCard";

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
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]);

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
    
    // Fetch questions
    fetchQuestions();
    
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

  const renderWelcomeScreen = () => {
    // Check if this is a retake
    const qualificationStatus = assessmentService.getQualificationStatus();
    const isRetake = qualificationStatus.assessmentCompleted && qualificationStatus.canRetake;
    
    return (
      <div className="mobile-assessment-container fade-in">
        {/* User Profile Card */}
        <div className="caregiver-profile-card-assesment">
          <ProfileCard />
        </div>

        {/* Assessment Content */}
        <div className="assessment-content">
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
                <i className="fas fa-clipboard-list"></i>
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
        {/* User Profile Card */}
        <ProfileCard />

        {/* Assessment Content */}
        <div className="assessment-content">
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
        {/* User Profile Card */}
        <ProfileCard />

        {/* Assessment Content */}
        <div className="assessment-content">
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
        {/* User Profile Card */}
        <ProfileCard />

        {/* Assessment Content */}
        <div className="assessment-content">
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
                <div className="result-icon">
                  {isPassing ? (
                    <div className="success-icon">
                      <i className="fas fa-trophy"></i>
                    </div>
                  ) : (
                    <div className="failure-icon">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                  )}
                </div>
                
                <div className="result-message">
                  {isPassing ? (
                    <>
                      <h3 className="result-title">YAY!!</h3>
                      <p className="result-subtitle">
                        You met the qualifications threshold to work with CarePro
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
                      ? "Your answers demonstrate a good understanding of caregiving principles. You are now qualified and practical knowledge." 
                      : "You have one more shot at getting this right, you can either back in time or start the again now."
                    }
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="result-actions">
                {isPassing ? (
                  <button 
                    className="proceed-btn success"
                    onClick={() => navigate('/app/caregiver/profile')}
                  >
                    Proceed to Dashboard
                    <i className="fas fa-arrow-right"></i>
                  </button>
                ) : (
                  <>
                    <button 
                      className="proceed-btn outline"
                      onClick={() => navigate('/app/caregiver/profile')}
                    >
                      Proceed to Dashboard
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
        {currentStep === 'welcome' && renderWelcomeScreen()}
        {currentStep === 'instructions' && renderInstructionsScreen()}
        {currentStep === 'questions' && renderQuestionsScreen()}
        {currentStep === 'thank-you' && renderThankYouScreen()}
      </div>
    </>
  );
};

export default AssessmentPage;
