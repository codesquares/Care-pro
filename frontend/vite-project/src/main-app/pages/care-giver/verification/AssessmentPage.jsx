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
  const [assessmentResult, setAssessmentResult] = useState(null);

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
            // Get the appropriate number of questions based on user type
            // 10 questions for cleaners, 30 questions for caregivers
            let assessmentQuestions = [...response.data];
            
            if (userType.toLowerCase() === 'cleaner') {
              // Shuffle and select 10 questions for cleaners
              assessmentQuestions = shuffleArray(assessmentQuestions).slice(0, 10);
            } else {
              // Shuffle and select 30 questions for caregivers
              assessmentQuestions = shuffleArray(assessmentQuestions).slice(0, 30);
            }
            
            setQuestions(assessmentQuestions);
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
  
  // Function to shuffle an array (for randomizing questions)
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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

  const handleAnswerChange = (questionId, value) => {
    // For multiple-choice answers (all questions are now radio buttons)
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
      const userType = userDetails.role?.toLowerCase() || 'caregiver';
      
      const assessmentData = {
        userId: userDetails.id,
        userType: userType.charAt(0).toUpperCase() + userType.slice(1), // Capitalize for API
        timestamp: new Date().toISOString(),
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          answer: answers[q.id] || ""
        }))
      };
      
      // Submit to API (in test mode this will save to localStorage)
      const response = await assessmentService.submitAssessment(assessmentData);
      
      if (response.success) {
        // Store the result for display
        const assessmentResult = {
          timestamp: new Date().toISOString(),
          score: response.data.score,
          isPassing: response.data.passed, // Using 70% threshold from backend
          canRetakeAfter: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days from now
        };
        
        setAssessmentResult(assessmentResult);

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
            : "Assessment completed. You didn't meet the required passing score of 70%. You can retake the assessment after 30 days."
        );
        
        // Store the complete assessment data with results
        localStorage.setItem('lastSubmittedAssessment', JSON.stringify({
          timestamp: assessmentResult.timestamp,
          data: assessmentData,
          result: assessmentResult
        }));
        
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
      <div className="assessment-welcome">
        <div className="welcome-icon">
          <i className={`fas ${isRetake ? 'fa-sync-alt' : 'fa-clipboard-check'}`}></i>
        </div>
        <h2>{isRetake ? 'Caregiver Assessment Retake' : 'Welcome to the Caregiver Assessment'}</h2>
        {isLoading ? (
          <div className="loading-indicator">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading assessment questions... Please wait.</p>
            <p className="loading-tip">This may take a moment as we prepare your assessment.</p>
            <button 
              className="retry-button delayed-visibility" 
              onClick={fetchQuestions}
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <>
            <p>
              This assessment will test your knowledge of caregiving practices and protocols.
              {isRetake 
                ? ' Since you did not pass the previous attempt, you can now retake the assessment.' 
                : ' You must pass this assessment to be qualified as a caregiver on our platform.'}
            </p>
            
            <p className="assessment-instructions">
              <strong>Important Information:</strong>
              <ul>
                <li>The assessment consists of {userDetails.role?.toLowerCase() === 'cleaner' ? '10' : '30'} multiple-choice questions</li>
                <li>You must score at least 70% to pass</li>
                <li>You can only take this assessment once every 30 days</li>
                <li>Make sure you have 15-20 minutes of uninterrupted time</li>
              </ul>
            </p>
            
            <div className="button-row">
              <button 
                className="secondary-button"
                onClick={() => navigate('/app/caregiver/profile')}
              >
                Return to Profile
              </button>
              <button 
                className="primary-button"
                onClick={startAssessment}
                disabled={isLoading || questions.length === 0}
              >
                Begin Assessment
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
          </>
        )}
      </div>
    );
  };

  const renderInstructionsScreen = () => {
    return (
      <div className="assessment-instructions-screen">
        <div className="instructions-icon">
          <i className="fas fa-info-circle"></i>
        </div>
        <h2>Assessment Instructions</h2>
        <div className="instructions-content">
          <p>Please read the following instructions carefully:</p>
          
          <ol>
            <li>This assessment contains {questions.length} multiple-choice questions.</li>
            <li>You must select one answer for each question.</li>
            <li>You can move between questions using the Previous and Next buttons.</li>
            <li>Your progress is saved as you move between questions.</li>
            <li>You must score at least 70% to pass the assessment.</li>
            <li>Once you've answered all questions, you can submit your assessment.</li>
          </ol>
          
          <p>When you're ready to begin, click the Start button below.</p>
        </div>
        
        <div className="button-row">
          <button 
            className="secondary-button"
            onClick={() => setCurrentStep('welcome')}
          >
            Back
          </button>
          <button 
            className="primary-button"
            onClick={beginQuestions}
          >
            Start
          </button>
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
    
    return (
      <div className="assessment-questions-screen">
        <div className="assessment-progress">
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
        
        <div className="question-container">
          <h3 className="question-text">
            {currentQ.text}
          </h3>
          
          <div className="answer-options">
            {currentQ.options.map((option, index) => (
              <div className="answer-option" key={index}>
                <input 
                  type="radio"
                  id={`option-${index}`}
                  name={`question-${currentQ.id}`}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={() => handleAnswerChange(currentQ.id, option)}
                />
                <label htmlFor={`option-${index}`}>{option}</label>
              </div>
            ))}
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="button-row">
            <button 
              className="secondary-button"
              onClick={moveToPreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </button>
            
            <button 
              className="primary-button"
              onClick={moveToNextQuestion}
              disabled={isSubmitting}
            >
              {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
              {isSubmitting && <i className="fas fa-spinner fa-spin ml-2"></i>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderThankYouScreen = () => {
    return (
      <div className="assessment-thank-you">
        <div className={`result-icon ${assessmentResult?.isPassing ? 'passed' : 'failed'}`}>
          <i className={`fas ${assessmentResult?.isPassing ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
        </div>
        
        <h2>{assessmentResult?.isPassing ? 'Assessment Passed!' : 'Assessment Not Passed'}</h2>
        
        <div className="result-details">
          <div className="score-display">
            <div className="score-circle">
              <span className="score-value">{assessmentResult?.score}%</span>
            </div>
            <p className="score-label">Your Score</p>
          </div>
          
          <div className="pass-threshold">
            <p><strong>Passing threshold:</strong> 70%</p>
          </div>
        </div>
        
        {success && <div className="success-message">{success}</div>}
        
        <div className="button-row">
          <button 
            className="primary-button"
            onClick={() => navigate('/app/caregiver/profile')}
          >
            Return to Profile
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Caregiver Assessment | Care Pro</title>
        <meta name="description" content="Complete your caregiver assessment to start working on our platform" />
      </Helmet>
      
      <div className="assessment-container">
        {currentStep === 'welcome' && renderWelcomeScreen()}
        {currentStep === 'instructions' && renderInstructionsScreen()}
        {currentStep === 'questions' && renderQuestionsScreen()}
        {currentStep === 'thank-you' && renderThankYouScreen()}
      </div>
    </>
  );
};

export default AssessmentPage;
