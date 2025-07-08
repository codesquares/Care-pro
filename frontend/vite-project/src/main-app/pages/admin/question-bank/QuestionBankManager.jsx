import React, { useState, useEffect } from 'react';
import './question-bank-manager.css';
import api from '../../../services/api';

// QuestionBank service for API calls
const questionBankService = {
  getQuestions: async (filters = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      let endpoint = '/api/QuestionBank';
      
      // If category filter is applied
      if (filters.category) {
        endpoint = `/api/QuestionBank/category/${encodeURIComponent(filters.category)}`;
      } 
      // If userType filter is applied
      else if (filters.userType) {
        endpoint = `/api/QuestionBank/userType/${encodeURIComponent(filters.userType)}`;
      }
      
      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Return mock data for development if API fails
      return getMockQuestions(filters);
    }
  },
  
  getQuestionById: async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await api.get(`/api/QuestionBank/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching question with ID ${id}:`, error);
      throw error;
    }
  },
  
  addQuestion: async (questionData) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await api.post('/api/QuestionBank', questionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  },
  
  batchAddQuestions: async (questionsData) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await api.post('/api/QuestionBank/batch', { Questions: questionsData }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error batch adding questions:', error);
      throw error;
    }
  },
  
  updateQuestion: async (questionData) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await api.put('/api/QuestionBank', questionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },
  
  deleteQuestion: async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await api.delete(`/api/QuestionBank/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },
  
  // Function to generate sample questions for testing
  generateSampleQuestions: async (categoryConfig) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Sample questions grouped by category
      const sampleQuestionsByCategory = {
        'Respecting Client Privacy and Dignity': [
          {
            question: 'What is the most appropriate way to handle a client\'s personal information?',
            options: [
              'Share it with other caregivers to improve care',
              'Keep it confidential and share only as authorized',
              'Store printed copies at home for reference',
              'Post important details where family members can see them'
            ],
            correctAnswer: 'B',
            explanation: 'Client\'s personal information should be kept confidential and shared only with authorized individuals as required by privacy laws and best practices.'
          },
          {
            question: 'Before entering a client\'s bedroom, you should:',
            options: [
              'Enter quietly without disrupting them',
              'Knock and enter immediately',
              'Knock and wait for permission to enter',
              'Call their name loudly so they can hear you'
            ],
            correctAnswer: 'C',
            explanation: 'Knocking and waiting for permission to enter respects the client\'s privacy and dignity by acknowledging their personal space.'
          }
        ],
        'Showing Respect and Professionalism in the Home': [
          {
            question: 'When working in a client\'s home, which behavior is most professional?',
            options: [
              'Rearranging furniture to make cleaning easier',
              'Bringing friends along for company during long shifts',
              'Following the client\'s preferences for how tasks are done',
              'Using the client\'s phone for personal calls'
            ],
            correctAnswer: 'C',
            explanation: 'Following the client\'s preferences shows respect for their home and demonstrates professionalism by acknowledging their authority in their own space.'
          },
          {
            question: 'Which of the following is NOT appropriate when working in a client\'s home?',
            options: [
              'Informing the client when you need to leave briefly',
              'Using the client\'s personal items without permission',
              'Asking where cleaning supplies are kept',
              'Removing shoes when entering the home'
            ],
            correctAnswer: 'B',
            explanation: 'Using a client\'s personal items without permission shows disrespect and violates professional boundaries.'
          }
        ],
        'Basic Emergency Awareness and Response': [
          {
            question: 'If you discover a small fire in a client\'s home, what should you do first?',
            options: [
              'Call the client\'s family members',
              'Attempt to extinguish it if safe to do so',
              'Ensure the client\'s safety and evacuate if necessary',
              'Open windows to clear the smoke'
            ],
            correctAnswer: 'C',
            explanation: 'The safety of the client is the top priority, so ensuring their safety and evacuating if necessary should be done first.'
          },
          {
            question: 'Which of the following should be readily accessible in case of emergency?',
            options: [
              'The client\'s medical history',
              'Your personal identification',
              'Emergency contact numbers',
              'The home warranty information'
            ],
            correctAnswer: 'C',
            explanation: 'Emergency contact numbers should be readily accessible to quickly call for help in emergency situations.'
          }
        ],
        'Understanding Client Rights and Confidentiality': [
          {
            question: 'A client\'s right to privacy includes:',
            options: [
              'Having personal care provided without unnecessary exposure',
              'Being alone for at least 4 hours per day',
              'Not having their medical information shared with their doctors',
              'Refusing to allow caregivers to document care'
            ],
            correctAnswer: 'A',
            explanation: 'Providing personal care without unnecessary exposure respects the client\'s dignity and right to privacy.'
          },
          {
            question: 'If a friend asks how your client is doing, the best response is:',
            options: [
              'Share general information as long as it\'s positive',
              'Explain the client\'s medical condition in simple terms',
              'Say you cannot discuss client information',
              'Tell them to ask the client directly'
            ],
            correctAnswer: 'C',
            explanation: 'Maintaining client confidentiality means not discussing any client information with unauthorized individuals, including friends.'
          }
        ],
        'Basic Caregiving Skills': [
          {
            question: 'When assisting a client with mobility, what is the most important factor to consider?',
            options: [
              'Completing the task as quickly as possible',
              'The client\'s weight and height',
              'The client\'s safety and comfort',
              'Using the most expensive equipment'
            ],
            correctAnswer: 'C',
            explanation: 'The client\'s safety and comfort should always be the primary consideration when assisting with mobility.'
          },
          {
            question: 'Which of the following is a sign of potential dehydration in a client?',
            options: [
              'Clear urine',
              'Moist mouth tissues',
              'Increased urination',
              'Dry lips and fatigue'
            ],
            correctAnswer: 'D',
            explanation: 'Dry lips and fatigue are common signs of dehydration, while clear urine typically indicates proper hydration.'
          }
        ],
        'Emergency Response, CPR, and First Aid': [
          {
            question: 'If a client is choking and cannot speak or cough, what should you do?',
            options: [
              'Give them water to drink',
              'Perform abdominal thrusts (Heimlich maneuver)',
              'Have them lie down and rest',
              'Call emergency services and wait'
            ],
            correctAnswer: 'B',
            explanation: 'Abdominal thrusts (Heimlich maneuver) are the appropriate intervention for someone who is choking and cannot speak or cough.'
          },
          {
            question: 'What is the correct hand position for performing chest compressions during CPR?',
            options: [
              'Hands on the lower abdomen',
              'One hand on the forehead and one on the chin',
              'Hands on the center of the chest between the nipples',
              'Hands on the left side of the chest over the heart'
            ],
            correctAnswer: 'C',
            explanation: 'The correct hand position for chest compressions is on the center of the chest between the nipples (the lower half of the sternum).'
          }
        ],
        'Accurate and Timely Reporting Skills': [
          {
            question: 'When should you document a change in a client\'s condition?',
            options: [
              'At the end of the week',
              'Only if the change persists for more than 24 hours',
              'As soon as you notice the change',
              'Only if requested by the supervisor'
            ],
            correctAnswer: 'C',
            explanation: 'Changes in a client\'s condition should be documented as soon as they are noticed to ensure timely intervention if needed.'
          },
          {
            question: 'What information is most important to include when reporting a fall incident?',
            options: [
              'Who you think is at fault',
              'Time, location, circumstances, and client\'s condition',
              'Only the visible injuries',
              'Your opinion on how to prevent future falls'
            ],
            correctAnswer: 'B',
            explanation: 'Reporting the time, location, circumstances, and client\'s condition provides the most complete and objective information about a fall incident.'
          }
        ],
        'Understanding of Medication Support and Observation': [
          {
            question: 'When observing a client taking their medication, you should:',
            options: [
              'Open pill bottles for them even if not authorized',
              'Encourage them to take all pills together to save time',
              'Document only medications that cause side effects',
              'Ensure they take the right medication at the right time and document it'
            ],
            correctAnswer: 'D',
            explanation: 'Proper medication support includes ensuring the right medication is taken at the right time and documenting this accurately.'
          },
          {
            question: 'If you notice a client exhibiting new side effects from medication, you should:',
            options: [
              'Stop the medication immediately',
              'Document your observations and report to your supervisor',
              'Suggest alternative medications',
              'Reduce the dosage'
            ],
            correctAnswer: 'B',
            explanation: 'Caregivers should document and report medication side effects but should not alter medication regimens, which requires medical authorization.'
          }
        ]
      };

      // Convert sample questions to API format
      const sampleQuestions = [];
      
      Object.entries(categoryConfig).forEach(([category, config]) => {
        if (sampleQuestionsByCategory[category]) {
          // Use the sample questions for this category
          const categorySamples = sampleQuestionsByCategory[category];
          // Duplicate the samples if we need more questions than samples provided
          let questions = [];
          while (questions.length < config.count) {
            questions = [...questions, ...categorySamples];
          }
          // Take only the number of questions we need
          questions = questions.slice(0, config.count);
          
          // Format for API
          const formattedQuestions = questions.map(q => ({
            category,
            userType: config.userType,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          }));
          
          sampleQuestions.push(...formattedQuestions);
        }
      });

      // Send sample questions to API in batches
      const batchSize = 10;
      for (let i = 0; i < sampleQuestions.length; i += batchSize) {
        const batch = sampleQuestions.slice(i, i + batchSize);
        await api.post('/api/QuestionBank/batch', { Questions: batch }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      return { success: true, count: sampleQuestions.length };
    } catch (error) {
      console.error('Error generating sample questions:', error);
      throw error;
    }
  }
};

// Helper function to generate mock questions for development
const getMockQuestions = (filters = {}) => {
  const mockQuestions = [
    {
      id: 'q1',
      question: 'What is the correct way to move a client from bed to wheelchair?',
      options: [
        'Pull them by their arms',
        'Use a gait belt and proper body mechanics',
        'Ask them to jump from the bed',
        'Lift them without assistance'
      ],
      correctAnswer: 'B', // Now using A, B, C, D format
      explanation: 'Using a gait belt and proper body mechanics ensures safety for both the caregiver and client.',
      category: 'Basic Caregiving Skills',
      userType: 'Caregiver',
      active: true
    },
    {
      id: 'q2',
      question: 'Which is NOT a sign of dehydration?',
      options: [
        'Dry mouth',
        'Dark colored urine',
        'Excessive sweating',
        'Dizziness'
      ],
      correctAnswer: 'C',
      explanation: 'Excessive sweating indicates that the body has enough fluid to produce sweat, which is the opposite of dehydration.',
      category: 'Basic Caregiving Skills',
      userType: 'Caregiver',
      active: true
    },
    {
      id: 'q3',
      question: 'Which cleaning product should NOT be mixed with bleach?',
      options: [
        'Water',
        'Ammonia',
        'Baking soda',
        'Dishwashing liquid'
      ],
      correctAnswer: 'B',
      explanation: 'Mixing bleach with ammonia creates toxic chloramine vapors that can cause respiratory issues or even death.',
      category: 'Basic Emergency Awareness and Response',
      userType: 'Cleaner',
      active: true
    },
    {
      id: 'q4',
      question: 'How often should bed linens be changed for a bedridden client?',
      options: [
        'Once a month',
        'Once a week',
        'Every day or when soiled',
        'Every other week'
      ],
      correctAnswer: 'C',
      explanation: 'Daily linen changes or changing when soiled helps prevent skin breakdown and infections in bedridden clients.',
      category: 'Respecting Client Privacy and Dignity',
      userType: 'Both',
      active: true
    }
  ];
  
  // Apply filters
  return mockQuestions.filter(q => {
    if (filters.category && q.category !== filters.category) return false;
    if (filters.userType && q.userType !== filters.userType) return false;
    return true;
  });
};

const QuestionBankManager = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    userType: ''
  });
  
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    category: '',
    userType: '',
    explanation: '',
    active: true
  });
  
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState('');
  const [isSampleGenerating, setIsSampleGenerating] = useState(false);

  // Available categories based on the assessment upgrade plan
  const categories = [
    'Respecting Client Privacy and Dignity',
    'Showing Respect and Professionalism in the Home',
    'Basic Emergency Awareness and Response',
    'Understanding Client Rights and Confidentiality',
    'Basic Caregiving Skills',
    'Emergency Response, CPR, and First Aid',
    'Accurate and Timely Reporting Skills',
    'Understanding of Medication Support and Observation'
  ];

  // Available user types
  const userTypes = ['Cleaner', 'Caregiver', 'Both'];
  
  // Load questions on component mount and when filters change
  useEffect(() => {
    loadQuestions();
  }, [filters]);
  
  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await questionBankService.getQuestions(filters);
      setQuestions(data);
    } catch (err) {
      setError('Failed to load questions. Please try again later.');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      category: '',
      userType: ''
    });
  };
  
  const handleQuestionChange = (field, value, index = null) => {
    if (editingQuestion) {
      // Editing existing question
      if (field === 'option' && index !== null) {
        const newOptions = [...editingQuestion.options];
        newOptions[index] = value;
        setEditingQuestion({ ...editingQuestion, options: newOptions });
      } else {
        setEditingQuestion({ ...editingQuestion, [field]: value });
      }
    } else {
      // Adding new question
      if (field === 'option' && index !== null) {
        const newOptions = [...newQuestion.options];
        newOptions[index] = value;
        setNewQuestion({ ...newQuestion, options: newOptions });
      } else {
        setNewQuestion({ ...newQuestion, [field]: value });
      }
    }
  };
  
  const validateQuestion = (question) => {
    if (!question.question.trim()) return 'Question text is required';
    if (!question.category) return 'Category is required';
    if (!question.userType) return 'User type is required';
    if (!question.correctAnswer) return 'Correct answer is required';
    
    // Check all options are filled
    if (question.options.some(opt => !opt.trim())) {
      return 'All options must be filled';
    }
    
    // Make sure correctAnswer is one of A, B, C, D
    if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
      return 'Correct answer must be A, B, C, or D';
    }
    
    return null; // No errors
  };
  
  const handleAddQuestion = async () => {
    const validationError = validateQuestion(newQuestion);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Format question data for API
      const questionData = {
        category: newQuestion.category,
        userType: newQuestion.userType,
        question: newQuestion.question,
        options: newQuestion.options,
        correctAnswer: newQuestion.correctAnswer,
        explanation: newQuestion.explanation
      };
      
      await questionBankService.addQuestion(questionData);
      
      // Reset form and reload questions
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        category: '',
        userType: '',
        explanation: '',
        active: true
      });
      
      setIsAddingQuestion(false);
      setSuccess('Question added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload questions
      loadQuestions();
    } catch (err) {
      setError('Failed to add question. Please try again.');
      console.error('Error adding question:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    
    const validationError = validateQuestion(editingQuestion);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Format question data for API
      const questionData = {
        id: editingQuestion.id,
        category: editingQuestion.category,
        userType: editingQuestion.userType,
        question: editingQuestion.question,
        options: editingQuestion.options,
        correctAnswer: editingQuestion.correctAnswer,
        explanation: editingQuestion.explanation,
        active: editingQuestion.active
      };
      
      await questionBankService.updateQuestion(questionData);
      
      // Reset editing state and reload questions
      setEditingQuestion(null);
      setSuccess('Question updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload questions
      loadQuestions();
    } catch (err) {
      setError('Failed to update question. Please try again.');
      console.error('Error updating question:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await questionBankService.deleteQuestion(id);
      
      setSuccess('Question deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload questions
      loadQuestions();
    } catch (err) {
      setError('Failed to delete question. Please try again.');
      console.error('Error deleting question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportDataChange = (e) => {
    setImportData(e.target.value);
  };

  const handleImportQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Parse the JSON data
      let questionsToImport;
      try {
        questionsToImport = JSON.parse(importData);
        
        if (!Array.isArray(questionsToImport)) {
          throw new Error('Import data must be an array of questions');
        }
      } catch (err) {
        setError('Invalid JSON format. Please check your data.');
        setLoading(false);
        return;
      }
      
      // Validate questions
      const questionErrors = [];
      const validQuestions = questionsToImport.filter((q, index) => {
        const error = validateQuestion(q);
        if (error) {
          questionErrors.push(`Question ${index + 1}: ${error}`);
          return false;
        }
        return true;
      });
      
      if (questionErrors.length > 0) {
        setError(`Some questions could not be imported: ${questionErrors.join('; ')}`);
        setLoading(false);
        return;
      }
      
      // Format questions for API
      const formattedQuestions = validQuestions.map(q => ({
        category: q.category,
        userType: q.userType,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      }));
      
      await questionBankService.batchAddQuestions(formattedQuestions);
      
      setSuccess(`${formattedQuestions.length} questions imported successfully!`);
      setIsImporting(false);
      setImportData('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload questions
      loadQuestions();
    } catch (err) {
      setError('Failed to import questions. Please try again.');
      console.error('Error importing questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSampleQuestions = async () => {
    if (!window.confirm('This will generate sample questions to populate the question bank. Continue?')) {
      return;
    }
    
    setIsSampleGenerating(true);
    setError(null);
    
    try {
      // Configuration for each category (how many questions and for which user type)
      const categoryConfig = {
        'Respecting Client Privacy and Dignity': { count: 15, userType: 'Both' },
        'Showing Respect and Professionalism in the Home': { count: 15, userType: 'Both' },
        'Basic Emergency Awareness and Response': { count: 10, userType: 'Both' },
        'Understanding Client Rights and Confidentiality': { count: 10, userType: 'Both' },
        'Basic Caregiving Skills': { count: 40, userType: 'Caregiver' },
        'Emergency Response, CPR, and First Aid': { count: 30, userType: 'Caregiver' },
        'Accurate and Timely Reporting Skills': { count: 20, userType: 'Caregiver' },
        'Understanding of Medication Support and Observation': { count: 10, userType: 'Caregiver' }
      };
      
      const result = await questionBankService.generateSampleQuestions(categoryConfig);
      
      setSuccess(`Generated ${result.count} sample questions! Refresh to see them.`);
      
      // Reload questions after a short delay to give the server time to process
      setTimeout(() => {
        loadQuestions();
      }, 2000);
    } catch (err) {
      setError('Failed to generate sample questions. Please try again.');
      console.error('Error generating sample questions:', err);
    } finally {
      setIsSampleGenerating(false);
    }
  };

  const cancelEditing = () => {
    setEditingQuestion(null);
  };
  
  const cancelAddingQuestion = () => {
    setIsAddingQuestion(false);
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      category: '',
      userType: '',
      explanation: '',
      active: true
    });
  };

  const cancelImporting = () => {
    setIsImporting(false);
    setImportData('');
  };

  const startEditing = (question) => {
    setEditingQuestion({...question});
  };

  // Convert index (0-3) to letter option (A-D)
  const indexToLetter = (index) => {
    return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
  };

  // Convert letter option (A-D) to index (0-3)
  const letterToIndex = (letter) => {
    return letter.charCodeAt(0) - 65; // 65 is ASCII for 'A'
  };

  return (
    <div className="question-bank-manager">
      <h1>Question Bank Manager</h1>
      
      <div className="question-bank-actions">
        <button 
          className="primary-button add-question-button"
          onClick={() => setIsAddingQuestion(true)}
          disabled={isAddingQuestion || editingQuestion}
        >
          <i className="fas fa-plus"></i> Add New Question
        </button>
        
        <button 
          className="secondary-button import-button"
          onClick={() => setIsImporting(true)}
          disabled={isImporting || isAddingQuestion || editingQuestion}
        >
          <i className="fas fa-file-import"></i> Import Questions
        </button>
        
        <button 
          className="secondary-button generate-button"
          onClick={handleGenerateSampleQuestions}
          disabled={isSampleGenerating || isAddingQuestion || editingQuestion}
        >
          <i className={`fas ${isSampleGenerating ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
          {isSampleGenerating ? 'Generating...' : 'Generate Sample Questions'}
        </button>
        
        <button 
          className="secondary-button refresh-button"
          onClick={loadQuestions}
          disabled={loading}
        >
          <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i> Refresh
        </button>
      </div>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      {/* Import Questions Modal */}
      {isImporting && (
        <div className="modal">
          <div className="modal-content">
            <h2>Import Questions</h2>
            <p className="modal-instruction">
              Paste JSON array of questions in the format:
            </p>
            <pre className="code-example">
{`[
  {
    "question": "Sample question text?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "A",  // A, B, C, or D
    "category": "Basic Caregiving Skills",
    "userType": "Caregiver",
    "explanation": "Explanation of the correct answer"
  },
  // more questions...
]`}
            </pre>
            <textarea
              className="import-textarea"
              value={importData}
              onChange={handleImportDataChange}
              rows={10}
              placeholder="Paste JSON data here..."
            ></textarea>
            
            <div className="modal-actions">
              <button className="secondary-button" onClick={cancelImporting}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleImportQuestions} disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Question Form */}
      {isAddingQuestion && (
        <div className="question-form">
          <h2>Add New Question</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select 
                value={newQuestion.category}
                onChange={(e) => handleQuestionChange('category', e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>User Type</label>
              <select 
                value={newQuestion.userType}
                onChange={(e) => handleQuestionChange('userType', e.target.value)}
              >
                <option value="">Select User Type</option>
                {userTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Question</label>
            <textarea 
              value={newQuestion.question}
              onChange={(e) => handleQuestionChange('question', e.target.value)}
              placeholder="Enter question text"
              rows={3}
            ></textarea>
          </div>
          
          <div className="options-container">
            <label>Options</label>
            {newQuestion.options.map((option, index) => (
              <div key={index} className="option-row">
                <span className="option-label">{indexToLetter(index)}.</span>
                <input 
                  type="text"
                  value={option}
                  onChange={(e) => handleQuestionChange('option', e.target.value, index)}
                  placeholder={`Option ${indexToLetter(index)}`}
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={newQuestion.correctAnswer === indexToLetter(index)}
                  onChange={() => handleQuestionChange('correctAnswer', indexToLetter(index))}
                />
                <label>Correct</label>
              </div>
            ))}
          </div>
          
          <div className="form-group">
            <label>Explanation</label>
            <textarea 
              value={newQuestion.explanation}
              onChange={(e) => handleQuestionChange('explanation', e.target.value)}
              placeholder="Explain why the correct answer is right (optional)"
              rows={2}
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button className="secondary-button" onClick={cancelAddingQuestion}>
              Cancel
            </button>
            <button className="primary-button" onClick={handleAddQuestion} disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Add Question'}
            </button>
          </div>
        </div>
      )}
      
      {/* Edit Question Form */}
      {editingQuestion && (
        <div className="question-form">
          <h2>Edit Question</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select 
                value={editingQuestion.category}
                onChange={(e) => handleQuestionChange('category', e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>User Type</label>
              <select 
                value={editingQuestion.userType}
                onChange={(e) => handleQuestionChange('userType', e.target.value)}
              >
                <option value="">Select User Type</option>
                {userTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select 
                value={editingQuestion.active ? 'active' : 'inactive'}
                onChange={(e) => handleQuestionChange('active', e.target.value === 'active')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Question</label>
            <textarea 
              value={editingQuestion.question}
              onChange={(e) => handleQuestionChange('question', e.target.value)}
              placeholder="Enter question text"
              rows={3}
            ></textarea>
          </div>
          
          <div className="options-container">
            <label>Options</label>
            {editingQuestion.options.map((option, index) => (
              <div key={index} className="option-row">
                <span className="option-label">{indexToLetter(index)}.</span>
                <input 
                  type="text"
                  value={option}
                  onChange={(e) => handleQuestionChange('option', e.target.value, index)}
                  placeholder={`Option ${indexToLetter(index)}`}
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={editingQuestion.correctAnswer === indexToLetter(index)}
                  onChange={() => handleQuestionChange('correctAnswer', indexToLetter(index))}
                />
                <label>Correct</label>
              </div>
            ))}
          </div>
          
          <div className="form-group">
            <label>Explanation</label>
            <textarea 
              value={editingQuestion.explanation}
              onChange={(e) => handleQuestionChange('explanation', e.target.value)}
              placeholder="Explain why the correct answer is right (optional)"
              rows={2}
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button className="secondary-button" onClick={cancelEditing}>
              Cancel
            </button>
            <button className="primary-button" onClick={handleUpdateQuestion} disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="filters">
        <h3>Filters</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Category</label>
            <select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>User Type</label>
            <select 
              value={filters.userType}
              onChange={(e) => handleFilterChange('userType', e.target.value)}
            >
              <option value="">All User Types</option>
              {userTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <button className="secondary-button" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Questions List */}
      <div className="questions-list">
        <h3>Questions ({questions.length})</h3>
        
        {loading && <div className="loading">Loading questions...</div>}
        
        {!loading && questions.length === 0 && (
          <div className="no-questions">
            <p>No questions found. Try adjusting your filters or add new questions.</p>
          </div>
        )}
        
        {!loading && questions.length > 0 && (
          <div className="question-table-container">
            <table className="question-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Category</th>
                  <th>User Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.id} className={question.active === false ? 'inactive' : ''}>
                    <td className="question-text-cell">
                      <div className="question-content">
                        <p>{question.question}</p>
                        <div className="question-options">
                          {question.options.map((option, index) => (
                            <div 
                              key={index} 
                              className={`question-option ${question.correctAnswer === indexToLetter(index) ? 'correct' : ''}`}
                            >
                              <strong>{indexToLetter(index)}:</strong> {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>{question.category}</td>
                    <td>{question.userType}</td>
                    <td>
                      <span className={`status-badge ${question.active !== false ? 'active' : 'inactive'}`}>
                        {question.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-button" 
                          onClick={() => startEditing(question)}
                          disabled={!!editingQuestion}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="delete-button" 
                          onClick={() => handleDeleteQuestion(question.id)}
                          disabled={loading}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankManager;
