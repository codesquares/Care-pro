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
  
  useEffect(() => {
    // Redirect if no token or user ID
    if (!token || !userDetails.id) {
      navigate("/login");
      return;
    }
    
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
      
      // Submit to API
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
        
        // Prepare questions with answers and explanations for the results page
        const questionsWithAnswersData = questions.map(q => ({
          ...q,
          userAnswer: answers[q.id] || "",
          isCorrect: q.correctAnswer === answers[q.id],
        }));
        
        setQuestionsWithAnswers(questionsWithAnswersData);

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
            <div className="spinner"></div>
            <p>Loading assessment questions...</p>
          </div>
        ) : (
          <>
            <div className="welcome-info">
              <p>This assessment will test your knowledge and skills as a caregiver.</p>
              <p>
                You will be presented with {userDetails.role?.toLowerCase() === 'cleaner' ? '10' : '30'} multiple-choice questions.
              </p>
              <p>You must score at least <strong>70%</strong> to pass.</p>
              <p>Please allocate 20-30 minutes to complete this assessment without interruptions.</p>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              className="primary-button"
              onClick={startAssessment}
              disabled={isLoading || questions.length === 0}
            >
              Start Assessment
            </button>
          </>
        )}
      </div>
    );
  };

  const renderInstructionsScreen = () => {
    return (
      <div className="assessment-instructions">
        <h2>Assessment Instructions</h2>
        
        <div className="instructions-content">
          <div className="instruction-item">
            <div className="instruction-icon"><i className="fas fa-lightbulb"></i></div>
            <div className="instruction-text">
              <h3>Multiple Choice Format</h3>
              <p>All questions have multiple-choice answers. Select the best answer for each question.</p>
            </div>
          </div>
          
          <div className="instruction-item">
            <div className="instruction-icon"><i className="fas fa-clock"></i></div>
            <div className="instruction-text">
              <h3>No Time Limit</h3>
              <p>Take your time to consider each question carefully before answering.</p>
            </div>
          </div>
          
          <div className="instruction-item">
            <div className="instruction-icon"><i className="fas fa-undo"></i></div>
            <div className="instruction-text">
              <h3>Navigation</h3>
              <p>You can go back to previous questions to review your answers before submitting.</p>
            </div>
          </div>
          
          <div className="instruction-item">
            <div className="instruction-icon"><i className="fas fa-check-double"></i></div>
            <div className="instruction-text">
              <h3>Passing Score</h3>
              <p>You need to answer at least 70% of questions correctly to pass this assessment.</p>
            </div>
          </div>
        </div>
        
        <button 
          className="primary-button"
          onClick={beginQuestions}
        >
          Begin Assessment
        </button>
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
            {currentQ.options.map((option, index) => {
              // Determine the option letter (A, B, C, D)
              const optionLetter = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
              
              return (
                <div className="answer-option" key={index}>
                  <input 
                    type="radio"
                    id={`option-${index}`}
                    name={`question-${currentQ.id}`}
                    value={optionLetter}
                    checked={answers[currentQ.id] === optionLetter}
                    onChange={() => handleAnswerChange(currentQ.id, optionLetter)}
                  />
                  <label htmlFor={`option-${index}`}>
                    <span className="option-letter">{optionLetter}.</span> {option}
                  </label>
                </div>
              );
            })}
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
        
        {/* Display question results with explanations */}
        <div className="assessment-results-summary">
          <h3>Questions & Answers</h3>
          
          <div className="results-list">
            {questionsWithAnswers.map((q, index) => (
              <div key={index} className={`result-item ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-question">
                  <span className="question-number">{index + 1}.</span> {q.text}
                </div>
                
                <div className="result-options">
                  {q.options.map((option, optIndex) => {
                    const optionLetter = String.fromCharCode(65 + optIndex);
                    const isUserAnswer = optionLetter === q.userAnswer;
                    const isCorrectAnswer = optionLetter === q.correctAnswer;
                    
                    return (
                      <div 
                        key={optIndex} 
                        className={`result-option ${isUserAnswer ? 'user-answer' : ''} ${isCorrectAnswer ? 'correct-answer' : ''}`}
                      >
                        <span className="option-letter">{optionLetter}.</span> {option}
                        {isUserAnswer && <i className="fas fa-user ml-2 user-icon"></i>}
                        {isCorrectAnswer && <i className="fas fa-check ml-2 correct-icon"></i>}
                      </div>
                    );
                  })}
                </div>
                
                {!q.isCorrect && q.explanation && (
                  <div className="result-explanation">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="thank-you-actions">
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
    <div className="assessment-page">
      <Helmet>
        <title>Caregiver Assessment | CarePro</title>
      </Helmet>
      
      <div className="assessment-container">
        {currentStep === 'welcome' && renderWelcomeScreen()}
        {currentStep === 'instructions' && renderInstructionsScreen()}
        {currentStep === 'questions' && renderQuestionsScreen()}
        {currentStep === 'thank-you' && renderThankYouScreen()}
      </div>
    </div>
  );
};

export default AssessmentPage;
