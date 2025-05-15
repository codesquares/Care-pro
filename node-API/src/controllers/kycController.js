// src/controllers/kycController.js
const { evaluateResponses, generateQuestions } = require('../services/openAIService');
const axios = require('axios');
const DojahService = require('../services/dojahService');
const { updateUserVerificationStatus } = require('./authController');
const { configDotenv } = require('dotenv');
configDotenv();

// Create Dojah service instance
const dojahService = new DojahService();

// External API base URL
const External_API = process.env.API_URL || 'https://carepro-api20241118153443.azurewebsites.net/api';

// Default questions for caregivers (fallback if OpenAI generation fails)
const defaultQuestions = {
  caregiver: [
    "What steps do you take when assisting a client with mobility issues to prevent falls or injuries?",
    "Can you describe a time when you had to handle a medical emergency with a client? What did you do?",
    "How do you assist a client with dementia or Alzheimer's when they become confused or agitated?",
    "What techniques do you use to encourage a client to eat when they have a poor appetite?",
    "How do you handle a situation where a client refuses care or assistance?",
    "What are the key signs of bedsores, and how do you prevent them in bedridden clients?",
    "Can you walk me through your process for safely transferring a client from a bed to a wheelchair?",
    "What personal hygiene tasks have you assisted clients with, and how do you ensure their dignity is maintained?",
    "How do you handle medications for a client? What precautions do you take?",
    "What experience do you have with end-of-life care, and how do you provide emotional support to both the client and their family?",
  ],
  nurse: [
    "Describe how you would assess a patient's vital signs. What range of values would concern you?",
    "How do you ensure proper medication administration and prevent errors?",
    "Explain your approach to wound care and infection prevention.",
    "What steps do you take when a patient shows signs of acute respiratory distress?",
    "How do you handle a situation where a patient refuses treatment?",
    "Describe how you would manage a patient experiencing a severe allergic reaction.",
    "How do you prioritize care when managing multiple patients with varying needs?",
    "What documentation practices do you follow to ensure continuity of care?",
    "How do you communicate effectively with patients who have communication difficulties?",
    "Describe your approach to patient education regarding medication and treatment plans.",
  ],
  doctor: [
    "How do you approach differential diagnosis for a patient presenting with non-specific symptoms?",
    "Describe your process for obtaining informed consent for a complex procedure.",
    "How do you stay current with medical research and integrate new evidence into your practice?",
    "Describe your approach to pain management, considering both effectiveness and concerns about addiction.",
    "How do you handle a situation where a patient requests a treatment you believe is not medically indicated?",
    "What considerations guide your antibiotic prescribing practices?",
    "How do you approach end-of-life care discussions with patients and families?",
    "Describe your process for handling a potential medical error.",
    "How do you balance diagnostic thoroughness with cost-effectiveness?",
    "Describe your approach to treating a patient with multiple chronic conditions.",
  ],
  dietician: [
    "How do you assess a client's nutritional status and needs?",
    "Describe how you would create a meal plan for a diabetic patient with kidney disease.",
    "How do you approach counseling a client who needs to lose weight but has been unsuccessful with previous diets?",
    "What strategies do you use to improve compliance with dietary recommendations?",
    "How do you address cultural food preferences when designing nutrition plans?",
    "Describe your approach to nutritional support for an oncology patient experiencing treatment side effects.",
    "How do you determine appropriate caloric needs for patients in different situations?",
    "What is your approach to helping clients with food allergies or intolerances?",
    "How do you stay current with nutrition research and integrate new evidence into your practice?",
    "Describe how you would manage nutritional care for a patient with dysphagia.",
  ]
};

const startKYC = async (req, res) => {
  try {
    // Get user from auth middleware
    const user = req.user;
    
    // Check if user is authorized
    if (!user || !user.id) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'User is not authorized to start KYC process.' 
      });
    }
    
    // Return success response
    res.status(200).json({ 
      status: 'success', 
      userId: user.id, 
      message: 'KYC process started successfully.' 
    });
  } catch (error) {
    console.error('Start KYC error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred while starting KYC process.' 
    });
  }
};

const getQuestions = async (req, res) => {
  try {
    // Get user from auth middleware
    const user = req.user;
    
    if (!user || !user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'User is not authorized to get assessment questions.'
      });
    }
    
    // Get provider type from request or default to caregiver
    const providerType = req.query.providerType || user.role || 'caregiver';
    
    // Generate new questions
    let assessmentQuestions;
    
    try {
      // Try to generate questions with OpenAI
      assessmentQuestions = await generateQuestions(providerType, 10);
    } catch (error) {
      console.error('Failed to generate questions with OpenAI:', error);
      // Fall back to default questions if OpenAI fails
      assessmentQuestions = defaultQuestions[providerType] || defaultQuestions.caregiver;
    }
    
    // Return questions
    res.status(200).json({ 
      status: 'success', 
      userId: user.id,
      providerType: providerType,
      questions: assessmentQuestions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving questions.'
    });
  }
};

const extractEvaluationText = (feedback) => {
  // Remove the score and the first occurrence of "\n\n"
  const evaluationText = feedback.replace(/^\d+\/\d+\n\n/, '');
  return evaluationText;
};

const submitResponses = async (req, res) => {
  try {
    const { responses, providerType } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid input. Responses array is required.' 
      });
    }
    
    // User is already authenticated via middleware
    const user = req.user;
    
    // Get or create assessment record
    let assessment = await CaregiverAssessment.findOne({ user: userId });
    
    if (!assessment) {
      return res.status(404).json({
        status: 'error',
        message: 'Assessment not found. Please start KYC process first.'
      });
    }
    
    // Update provider type if specified
    if (providerType) {
      assessment.providerType = providerType;
    }
    
    // Update answers for each question
    assessment.questions.forEach((questionObj, index) => {
      if (index < responses.length) {
        questionObj.answer = responses[index] || "";
      }
    });
    
    // Update the assessment's updatedAt date
    assessment.updatedAt = new Date();
    
    await assessment.save();
    
    res.status(200).json({ 
      status: 'success', 
      assessmentId: assessment._id,
      message: 'Responses submitted successfully.' 
    });
  } catch (error) {
    console.error('Submit responses error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred while submitting responses.' 
    });
  }
};

// Evaluate responses using OpenAI
const evalResponse = async (req, res) => {
  try {
    // Get user ID from authenticated request object
    const userId = req.user._id;
    
    // Fetch the user's assessment
    const assessment = await CaregiverAssessment.findOne({ user: userId });
    
    if (!assessment) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Assessment not found. Please submit responses first.' 
      });
    }
    
    // Check if all questions have answers
    const unansweredQuestions = assessment.questions.filter(q => !q.answer || q.answer.trim() === '').length;
    if (unansweredQuestions > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Please answer all questions before evaluation. You have ${unansweredQuestions} unanswered question(s).`
      });
    }
    
    // Extract answers for evaluation
    const userResponses = assessment.questions.map(q => `Question: ${q.question}\nAnswer: ${q.answer}`);
    
    // Get provider type (default to caregiver)
    const providerType = assessment.providerType || 'caregiver';
    
    // Get evaluation from OpenAI with enhanced results
    const { score, evaluation, feedback, improvements, passThreshold } = 
      await evaluateResponses(userResponses, providerType);
    
    // Determine qualification status based on 50% threshold
    const qualificationStatus = score >= 50 ? 'qualified' : 'not_qualified';
    
    // Update assessment with evaluation results
    assessment.evaluation = {
      score,
      feedback: feedback,
      improvements: improvements,
      qualificationStatus,
      date: new Date(),
      rawEvaluation: evaluation
    };
    
    await assessment.save();
    
    // Update user profile status if qualified
    if (qualificationStatus === 'qualified') {
      const user = await User.findById(userId);
      if (user) {
        if (!user.verificationStatus) {
          user.verificationStatus = {
            idVerified: false,
            addressVerified: false,
            qualificationVerified: false
          };
        }
        user.verificationStatus.qualificationVerified = true;
        await user.save();
      }
    }
    
    // Sync assessment results with Azure API
    const assessmentData = {
      providerType: assessment.providerType,
      score: score,
      feedback: feedback,
      improvements: improvements,
      qualificationStatus: qualificationStatus
    };
    await syncAssessmentWithAzureAPI(userId, assessmentData);
    
    res.status(200).json({
      status: 'success',
      score,
      qualificationStatus,
      passed: score >= 50,
      passThreshold: 50,
      feedback: feedback,
      improvements: qualificationStatus === 'not_qualified' ? improvements : null,
      providerType: providerType
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'An error occurred during evaluation.' 
    });
  }
};

const createVerificationSession = async (req, res) => {
  try {
    // Get authenticated user directly from request object
    const userId = req.user._id;
    const user = req.user;
    
    // Create verification session with Dojah
    const sessionData = await dojahService.createVerificationSession();
    
    if (!sessionData || !sessionData.entity || !sessionData.entity.reference_id) {
      throw new Error('Invalid response from verification service');
    }
    
    // Save verification session details in database
    const verification = new Verification({
      user: userId,
      verificationType: 'nin', // Can be updated based on the verification type
      referenceId: sessionData.entity.reference_id,
      status: 'pending'
    });
    
    await verification.save();
    
    res.status(200).json({ 
      status: 'success',
      sessionId: sessionData.entity.reference_id,
      url: sessionData.entity.url 
    });
  } catch (error) {
    console.error('Verification session error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Could not create verification session. ' + error.message 
    });
  }
};

// New endpoints for direct document verification
const verifyNIN = async (req, res) => {
  try {
    // Get user ID from authenticated request object
    const userId = req.user._id;
    const { ninNumber } = req.body;
    
    if (!ninNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'NIN number is required'
      });
    }
    
    // Call Dojah service to verify the NIN
    const verificationResult = await dojahService.verifyNIN(ninNumber);
    
    // Create verification record
    const verification = new Verification({
      user: userId,
      verificationType: 'nin',
      status: verificationResult.entity?.verification_status === 'verified' ? 'verified' : 'failed',
      verificationData: verificationResult.entity,
      verificationDate: new Date()
    });
    
    await verification.save();
    
    // Update user's verification status
    if (verificationResult.entity?.verification_status === 'verified') {
      await User.findByIdAndUpdate(userId, {
        'verificationStatus.idVerified': true
      });
    }
    
    res.status(200).json({
      status: 'success',
      verified: verificationResult.entity?.verification_status === 'verified',
      data: verificationResult.entity
    });
  } catch (error) {
    console.error('NIN verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during NIN verification'
    });
  }
};

const verifyBVN = async (req, res) => {
  try {
    // Get user ID from authenticated request object
    const userId = req.user._id;
    const { bvnNumber } = req.body;
    
    if (!bvnNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN number is required'
      });
    }
    
    // Call Dojah service to verify the BVN
    const verificationResult = await dojahService.verifyBVN(bvnNumber);
    
    // Create verification record
    const verification = new Verification({
      user: userId,
      verificationType: 'bvn',
      status: verificationResult.entity?.verification_status === 'verified' ? 'verified' : 'failed',
      verificationData: verificationResult.entity,
      verificationDate: new Date()
    });
    
    await verification.save();
    
    // Update user's verification status
    if (verificationResult.entity?.verification_status === 'verified') {
      await User.findByIdAndUpdate(userId, {
        'verificationStatus.idVerified': true
      });
    }
    
    res.status(200).json({
      status: 'success',
      verified: verificationResult.entity?.verification_status === 'verified',
      data: verificationResult.entity
    });
  } catch (error) {
    console.error('BVN verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during BVN verification'
    });
  }
};

const verifyAddress = async (req, res) => {
  try {
    // Get user ID from authenticated request object
    const userId = req.user._id;
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        status: 'error',
        message: 'Address details are required'
      });
    }
    
    // Call Dojah service to verify the address
    const verificationResult = await dojahService.verifyAddress(address);
    
    // Create verification record
    const verification = new Verification({
      user: userId,
      verificationType: 'address',
      status: verificationResult.entity?.verification_status === 'verified' ? 'verified' : 'failed',
      verificationData: verificationResult.entity,
      verificationDate: new Date()
    });
    
    await verification.save();
    
    // Update user's verification status
    if (verificationResult.entity?.verification_status === 'verified') {
      await User.findByIdAndUpdate(userId, {
        'verificationStatus.addressVerified': true
      });
    }
    
    res.status(200).json({
      status: 'success',
      verified: verificationResult.entity?.verification_status === 'verified',
      data: verificationResult.entity
    });
  } catch (error) {
    console.error('Address verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during address verification'
    });
  }
};

// Get verification status for a user
const getVerificationStatus = async (req, res) => {
  try {
    // Get user ID from authenticated request object
    const userId = req.user._id;
    
    // Get user with verification status
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Get the user's verification records
    const verifications = await Verification.find({ user: userId }).sort({ createdAt: -1 });
    
    // Get the user's assessment
    const assessment = await CaregiverAssessment.findOne({ user: userId });
    
    res.status(200).json({
      status: 'success',
      data: {
        profileStatus: user.profileStatus,
        verificationStatus: user.verificationStatus,
        verifications: verifications.map(v => ({
          type: v.verificationType,
          status: v.status,
          date: v.verificationDate
        })),
        assessment: assessment ? {
          completed: Boolean(assessment.questions && assessment.questions.length > 0),
          evaluated: Boolean(assessment.evaluatedAt),
          score: assessment.evaluationScore || 0,
          passed: (assessment.evaluationScore || 0) >= 6
        } : null
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting verification status'
    });
  }
};

/**
 * Generate assessment questions for a specific provider type
 * This allows admins or the system to prepare questions for different provider types
 */
const generateProviderQuestions = async (req, res) => {
  try {
    // Check if user is authenticated (middleware should handle this)
    const userId = req.user._id;
    
    // Get provider type from request body
    const { providerType, count } = req.body;
    
    if (!providerType) {
      return res.status(400).json({
        status: 'error',
        message: 'Provider type is required'
      });
    }
    
    // Default to 10 questions if not specified
    const questionCount = count || 10;
    
    // Generate questions using OpenAI
    let questions;
    try {
      questions = await generateQuestions(providerType, questionCount);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      // Fall back to default questions if available
      questions = defaultQuestions[providerType] || defaultQuestions.caregiver;
    }
    
    res.status(200).json({
      status: 'success',
      providerType,
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating questions'
    });
  }
};

/**
 * Syncs assessment results with Azure API
 * @param {string} userId - User ID
 * @param {object} assessmentData - Assessment data to sync
 */
const syncAssessmentWithAzureAPI = async (userId, assessmentData) => {
  try {
    if (!process.env.AZURE_API_ENDPOINT) {
      console.log('AZURE_API_ENDPOINT not configured, skipping assessment sync');
      return;
    }
    
    const user = await User.findById(userId).lean();
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return;
    }
    
    // Compile assessment data for Azure API
    const syncData = {
      userId: userId,
      email: user.email,
      assessmentType: assessmentData.providerType || 'caregiver',
      score: assessmentData.score,
      passed: assessmentData.score >= 50,
      completedAt: new Date(),
      qualificationVerified: assessmentData.score >= 50,
      feedback: {
        summary: assessmentData.feedback?.substring(0, 500), // Truncate for reasonable size
        improvements: assessmentData.improvements?.substring(0, 500)
      }
    };
    
    // Send assessment results to Azure API
    await axios.post(
      `${process.env.AZURE_API_ENDPOINT}/api/users/qualification-update`,
      syncData,
      {
        headers: {
          'Authorization': `ApiKey ${process.env.AZURE_API_KEY}`,
          'Content-Type': 'application/json',
          'x-api-source': 'care-pro-node-api'
        }
      }
    );
    
    console.log(`Assessment results synced with Azure API for user ${userId}`);
  } catch (error) {
    console.error('Failed to sync assessment with Azure API:', error.message);
    // Don't throw error as we don't want to break the assessment flow
  }
};

module.exports = { 
  startKYC, 
  getQuestions,
  generateProviderQuestions, 
  submitResponses, 
  evalResponse, 
  createVerificationSession,
  verifyNIN,
  verifyBVN,
  verifyAddress,
  getVerificationStatus,
  syncAssessmentWithAzureAPI
};
