import React, { useState, useEffect } from 'react';
import './question-bank-manager.css';

// Mock service for question bank management - would be replaced with real API calls
const questionBankService = {
  getQuestions: async (filters = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.userType) queryParams.append('userType', filters.userType);
      
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5001'}/QuestionBank?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Return mock data for development
      return getMockQuestions(filters);
    }
  },
  
  addQuestion: async (questionData) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5001'}/QuestionBank`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding question:', error);
      // Return mock response for development
      return { id: `mock-${Date.now()}`, ...questionData };
    }
  },
  
  updateQuestion: async (id, questionData) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5001'}/QuestionBank`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...questionData })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating question:', error);
      // Return mock success for development
      return { success: true };
    }
  },
  
  deleteQuestion: async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5001'}/QuestionBank/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting question:', error);
      // Return mock success for development
      return { success: true };
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
      correctAnswer: 'Use a gait belt and proper body mechanics',
      category: 'Safety',
      userType: 'Caregiver'
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
      correctAnswer: 'Excessive sweating',
      category: 'Health',
      userType: 'Caregiver'
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
      correctAnswer: 'Ammonia',
      category: 'Safety',
      userType: 'Cleaner'
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
      correctAnswer: 'Every day or when soiled',
      category: 'Hygiene',
      userType: 'Caregiver'
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
    userType: 'Caregiver'
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Available categories and user types
  const categories = ['Safety', 'Health', 'Hygiene', 'Communication', 'Nutrition', 'Emergency'];
  const userTypes = ['Caregiver', 'Cleaner'];
  
  useEffect(() => {
    fetchQuestions();
  }, [filters]);
  
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const questionsData = await questionBankService.getQuestions(filters);
      setQuestions(questionsData);
    } catch (err) {
      setError('Failed to load questions. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNewQuestionChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNewOptionChange = (index, value) => {
    setNewQuestion(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };
  
  const handleEditQuestionChange = (e) => {
    const { name, value } = e.target;
    setEditingQuestion(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditOptionChange = (index, value) => {
    setEditingQuestion(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };
  
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    
    // Validate all fields are filled
    if (!newQuestion.question || 
        !newQuestion.category || 
        !newQuestion.userType || 
        !newQuestion.correctAnswer ||
        newQuestion.options.some(opt => !opt)) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate correctAnswer is one of the options
    if (!newQuestion.options.includes(newQuestion.correctAnswer)) {
      setError('Correct answer must be one of the options');
      return;
    }
    
    try {
      await questionBankService.addQuestion(newQuestion);
      
      // Reset form and refresh questions
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        category: '',
        userType: 'Caregiver'
      });
      
      setShowAddForm(false);
      fetchQuestions();
    } catch (err) {
      setError('Failed to add question');
    }
  };
  
  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    
    // Similar validation as add question
    if (!editingQuestion.question || 
        !editingQuestion.category || 
        !editingQuestion.userType || 
        !editingQuestion.correctAnswer ||
        editingQuestion.options.some(opt => !opt)) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      await questionBankService.updateQuestion(editingQuestion.id, editingQuestion);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err) {
      setError('Failed to update question');
    }
  };
  
  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionBankService.deleteQuestion(id);
        fetchQuestions();
      } catch (err) {
        setError('Failed to delete question');
      }
    }
  };
  
  const startEditing = (question) => {
    setEditingQuestion({ ...question });
  };
  
  const cancelEditing = () => {
    setEditingQuestion(null);
  };
  
  const cancelAddQuestion = () => {
    setShowAddForm(false);
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      category: '',
      userType: 'Caregiver'
    });
  };

  return (
    <div className="question-bank-manager">
      <header className="qbm-header">
        <h1>Question Bank Manager</h1>
        <p>Manage assessment questions for caregivers and cleaners</p>
      </header>

      {error && (
        <div className="qbm-error">
          {error}
          <button className="qbm-error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="qbm-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Category:</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>User Type:</label>
            <select
              name="userType"
              value={filters.userType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {userTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <button className="qbm-btn primary" onClick={() => setShowAddForm(true)}>
            Add New Question
          </button>
        </div>
      </div>

      {loading ? (
        <div className="qbm-loading">
          <div className="loader"></div>
          <p>Loading questions...</p>
        </div>
      ) : (
        <div className="question-list">
          {questions.length === 0 ? (
            <div className="no-questions">
              <p>No questions found. Try changing the filters or add new questions.</p>
            </div>
          ) : (
            <table className="qbm-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Category</th>
                  <th>User Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(question => (
                  <tr key={question.id}>
                    <td>{question.question}</td>
                    <td>{question.category}</td>
                    <td>{question.userType}</td>
                    <td className="qbm-actions">
                      <button className="qbm-btn secondary" onClick={() => startEditing(question)}>
                        Edit
                      </button>
                      <button className="qbm-btn danger" onClick={() => handleDeleteQuestion(question.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showAddForm && (
        <div className="qbm-modal">
          <div className="qbm-modal-content">
            <div className="qbm-modal-header">
              <h2>Add New Question</h2>
              <button className="qbm-modal-close" onClick={cancelAddQuestion}>×</button>
            </div>
            <form onSubmit={handleAddQuestion}>
              <div className="qbm-form-group">
                <label>Question:</label>
                <textarea
                  name="question"
                  value={newQuestion.question}
                  onChange={handleNewQuestionChange}
                  required
                ></textarea>
              </div>

              <div className="qbm-form-group">
                <label>Options:</label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="qbm-option">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleNewOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="qbm-form-group">
                <label>Correct Answer:</label>
                <select
                  name="correctAnswer"
                  value={newQuestion.correctAnswer}
                  onChange={handleNewQuestionChange}
                  required
                >
                  <option value="">Select Correct Answer</option>
                  {newQuestion.options.filter(opt => opt.trim() !== '').map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="qbm-form-row">
                <div className="qbm-form-group">
                  <label>Category:</label>
                  <select
                    name="category"
                    value={newQuestion.category}
                    onChange={handleNewQuestionChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="qbm-form-group">
                  <label>User Type:</label>
                  <select
                    name="userType"
                    value={newQuestion.userType}
                    onChange={handleNewQuestionChange}
                    required
                  >
                    {userTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="qbm-form-buttons">
                <button type="button" className="qbm-btn secondary" onClick={cancelAddQuestion}>
                  Cancel
                </button>
                <button type="submit" className="qbm-btn primary">
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingQuestion && (
        <div className="qbm-modal">
          <div className="qbm-modal-content">
            <div className="qbm-modal-header">
              <h2>Edit Question</h2>
              <button className="qbm-modal-close" onClick={cancelEditing}>×</button>
            </div>
            <form onSubmit={handleUpdateQuestion}>
              <div className="qbm-form-group">
                <label>Question:</label>
                <textarea
                  name="question"
                  value={editingQuestion.question}
                  onChange={handleEditQuestionChange}
                  required
                ></textarea>
              </div>

              <div className="qbm-form-group">
                <label>Options:</label>
                {editingQuestion.options.map((option, index) => (
                  <div key={index} className="qbm-option">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleEditOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="qbm-form-group">
                <label>Correct Answer:</label>
                <select
                  name="correctAnswer"
                  value={editingQuestion.correctAnswer}
                  onChange={handleEditQuestionChange}
                  required
                >
                  <option value="">Select Correct Answer</option>
                  {editingQuestion.options.filter(opt => opt.trim() !== '').map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="qbm-form-row">
                <div className="qbm-form-group">
                  <label>Category:</label>
                  <select
                    name="category"
                    value={editingQuestion.category}
                    onChange={handleEditQuestionChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="qbm-form-group">
                  <label>User Type:</label>
                  <select
                    name="userType"
                    value={editingQuestion.userType}
                    onChange={handleEditQuestionChange}
                    required
                  >
                    {userTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="qbm-form-buttons">
                <button type="button" className="qbm-btn secondary" onClick={cancelEditing}>
                  Cancel
                </button>
                <button type="submit" className="qbm-btn primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankManager;
