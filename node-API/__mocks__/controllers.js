// Mock controllers for testing
const authController = {
  verifyUser: jest.fn((req, res) => {
    const { email, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: email, firstName, lastName'
      });
    }
    
    // Simulate external API call result
    if (email === 'test@example.com') {
      return res.status(200).json({
        status: 'success',
        user: {
          id: 'user123',
          email: email,
          firstName: firstName,
          lastName: lastName
        }
      });
    }
    
    return res.status(404).json({
      status: 'error',
      message: 'User not found'
    });
  })
};

const kycController = {
  startKYC: jest.fn((req, res) => {
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
  }),
  
  getQuestions: jest.fn((req, res) => {
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
  }),
  
  submitResponses: jest.fn((req, res) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'User is not authorized.'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Responses submitted successfully.'
    });
  }),
  
  evalResponse: jest.fn((req, res) => {
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
  })
};

const assessmentController = {
  getAssessment: jest.fn((req, res) => {
    res.status(200).json({ status: 'success' });
  }),
  submitAssessment: jest.fn((req, res) => {
    res.status(200).json({ status: 'success' });
  })
};

const withdrawalController = {
  requestWithdrawal: jest.fn((req, res) => {
    res.status(200).json({ status: 'success' });
  }),
  getWithdrawals: jest.fn((req, res) => {
    res.status(200).json({ status: 'success' });
  })
};

const clientServiceController = {
  getServices: jest.fn((req, res) => {
    res.status(200).json({ status: 'success' });
  })
};

const providerServiceController = {
  getServices: jest.fn((req, res) => {
    res.status(200).json({ status: 'success' });
  })
};

const webhookController = {
  handleWebhook: jest.fn((req, res) => {
    res.status(200).json({ status: 'success' });
  })
};

module.exports = {
  authController,
  kycController,
  assessmentController,
  withdrawalController,
  clientServiceController,
  providerServiceController,
  webhookController
};
