// Mock KYC Controller
const startKYC = jest.fn((req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'User is not authorized to start KYC process.'
    });
  }
  
  res.status(200).json({
    status: 'success',
    userId: req.user.id,
    message: 'KYC process started successfully.'
  });
});

const getQuestions = jest.fn((req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'User is not authorized to get assessment questions.'
    });
  }
  
  const providerType = req.query.providerType || 'caregiver';
  const questions = [
    'What steps do you take when assisting a client?',
    'How do you handle emergencies?',
    'Describe your experience with client care.'
  ];
  
  res.status(200).json({
    status: 'success',
    userId: req.user.id,
    providerType: providerType,
    questions: questions
  });
});

const generateProviderQuestions = jest.fn((req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'User is not authorized.'
    });
  }
  
  res.status(200).json({
    status: 'success',
    questions: ['Generated question 1', 'Generated question 2']
  });
});

const submitResponses = jest.fn((req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'User is not authorized.'
    });
  }
  
  const { responses } = req.body;
  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid input. Responses array is required.'
    });
  }
  
  if (responses.length > 50) {
    return res.status(400).json({
      status: 'error',
      message: 'Too many responses'
    });
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Responses submitted successfully.'
  });
});

const evalResponse = jest.fn((req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'User is not authorized.'
    });
  }
  
  res.status(200).json({
    status: 'success',
    score: 85,
    qualificationStatus: 'qualified',
    passed: true
  });
});

const createVerificationSession = jest.fn((req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'User is not authorized.'
    });
  }
  
  res.status(200).json({
    status: 'success',
    sessionId: 'session123'
  });
});

const generateQuestionBank = jest.fn((req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      status: 'error',
      message: 'User is not authorized.'
    });
  }
  
  res.status(200).json({
    status: 'success',
    questionBank: ['Question 1', 'Question 2', 'Question 3']
  });
});

module.exports = {
  startKYC,
  getQuestions,
  generateProviderQuestions,
  submitResponses,
  evalResponse,
  createVerificationSession,
  generateQuestionBank
};
