import React, { useState, useEffect } from "react";
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

  // Get token and user ID from localStorage
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const token = localStorage.getItem("authToken");
  
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
  }, [token, userDetails, navigate]);

  // Sample assessment questions
  const questions = [
    {
      id: "q1",
      text: "How many years of experience do you have in caregiving?",
      type: "radio",
      options: [
        "Less than 1 year",
        "1-3 years",
        "3-5 years",
        "5-10 years",
        "More than 10 years"
      ]
    },
    {
      id: "q2",
      text: "Which of the following caregiving skills do you possess? (Select all that apply)",
      type: "checkbox",
      options: [
        "Medication management",
        "Mobility assistance",
        "Personal hygiene care",
        "Meal preparation",
        "Vital signs monitoring",
        "Dementia care",
        "Wound care"
      ]
    },
    {
      id: "q3",
      text: "How would you handle a situation where a client refuses to take their medication?",
      type: "textarea"
    },
    {
      id: "q4",
      text: "What would you do if a client has a fall while under your care?",
      type: "textarea"
    },
    {
      id: "q5",
      text: "Which of these statements best describes your approach to caregiving?",
      type: "radio",
      options: [
        "I focus on completing tasks efficiently",
        "I prioritize the client's emotional well-being alongside physical care",
        "I follow care plans exactly as written",
        "I believe in encouraging maximum independence"
      ]
    }
  ];

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
      
      // In test mode, we'll always get a success response
      setSuccess(response.message || "Assessment submitted successfully!");
      setCurrentStep("thank-you");
      
      // Store the lastSubmittedAssessment in localStorage for reference
      localStorage.setItem('lastSubmittedAssessment', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: assessmentData
      }));
      
    } catch (err) {
      console.error("Assessment submission error:", err);
      setError(err.message || "There was an error submitting your assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWelcomeScreen = () => (
    <div className="assessment-welcome">
      <div className="welcome-icon">
        <i className="fas fa-clipboard-check"></i>
      </div>
      <h2>Welcome to the Caregiver Assessment</h2>
      <p>
        This assessment will help us understand your caregiving experience, skills, and approach.
        Your responses will be used to match you with clients who need your specific expertise.
      </p>
      <p>
        The assessment consists of {questions.length} questions and should take approximately 10-15 minutes to complete.
      </p>
      <button 
        className="start-btn"
        onClick={startAssessment}
      >
        <i className="fas fa-play-circle"></i> Start Assessment
      </button>
    </div>
  );

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

  const renderThankYouScreen = () => (
    <div className="assessment-thank-you">
      <div className="thank-you-icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <h2>Thank You for Completing the Assessment!</h2>
      <p>
        Your responses have been submitted successfully. Our team will review your assessment 
        to better match you with clients who need your specific caregiving skills.
      </p>
      {success && <div className="success-message"><i className="fas fa-check-circle"></i> {success}</div>}
      {process.env.NODE_ENV !== 'production' && (
        <div className="test-info" style={{ 
          margin: '15px 0', 
          padding: '10px', 
          background: '#f8f9fa', 
          border: '1px solid #ddd',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <p><strong>Testing Mode Info:</strong> Your assessment data has been saved to localStorage.</p>
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
