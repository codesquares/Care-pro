const { evaluateResponses } = require('../services/openAIService');
const stripe = require('../services/stripeService');
const { configDotenv } = require('dotenv');
configDotenv();

const questions = [
  "What steps do you take when assisting a client with mobility issues to prevent falls or injuries?",
  "Can you describe a time when you had to handle a medical emergency with a client? What did you do?",
  "How do you assist a client with dementia or Alzheimer’s when they become confused or agitated?",
  "What techniques do you use to encourage a client to eat when they have a poor appetite?",
  "How do you handle a situation where a client refuses care or assistance?",
  "What are the key signs of bedsores, and how do you prevent them in bedridden clients?",
  "Can you walk me through your process for safely transferring a client from a bed to a wheelchair?",
  "What personal hygiene tasks have you assisted clients with, and how do you ensure their dignity is maintained?",
  "How do you handle medications for a client? What precautions do you take?",
  "What experience do you have with end-of-life care, and how do you provide emotional support to both the client and their family?",
];

const userResponses = [
  "What steps do you take when assisting a client with mobility issues to prevent falls or injuries? I assess the environment for hazards, ensure the client is wearing proper footwear, use assistive devices like walkers or gait belts if needed, and provide physical support during transfers. I also encourage slow, controlled movements and educate clients on safe mobility techniques.",
];
  

const startKYC = (req, res) => {
  const { user_id } = req.body;
  res.status(200).json({ status: 'success', user_id, message: 'KYC process started.' });
};

const getQuestions = (req, res) => {
  res.status(200).json({ status: 'success', questions });
};
const extractEvaluationText = (feedback) => {
  // Remove the score and the first occurrence of "\n\n"
  const evaluationText = feedback.replace(/^\d+\/\d+\n\n/, '');

  // Return the cleaned evaluation text
  return evaluationText;
};
const submitResponses = (req, res) => {
  const { user_id, responses } = req.body;
  // Save responses to the database (to be implemented later)
  res.status(200).json({ status: 'success', user_id, message: 'Responses submitted successfully.' });
};

    // Evaluate responses using OpenAI
    const evalResponse = async (req, res) => {
    const {score, evaluation} = await evaluateResponses(userResponses);

    // Determine qualification status
    const qualificationStatus = score >= 70 ? 'qualified' : 'not_qualified';

    const evaluationText = extractEvaluationText(evaluation);

    res.status(200).json({
      status: 'success',
      score,
      qualificationStatus,
      feedback: evaluationText,
      
    });
  };
  const createVerificationSession = async (req, res) => {
    try {
      const { userId } = req.body;
  
      const session = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: { user_id: userId },
        options: {
          document: {
            require_matching_selfie: true,
          },
        },
        return_url: 'http://localhost:3000/verification-complete', // Change to prod URL later
      });
  
      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Could not create verification session' });
    }
  };


module.exports = { startKYC, getQuestions, submitResponses, evalResponse, createVerificationSession };