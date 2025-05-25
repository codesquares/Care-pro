// Test assessment submission functionality
const axios = require('axios');
const token = 'test-token'; // Replace with a valid token in a real test

async function testAssessment() {
  try {
    // 1. Generate questions
    console.log('Testing assessment question generation...');
    const questionsResponse = await axios.post(
      'http://localhost:3000/api/kyc/generate-questions',
      { providerType: 'caregiver', count: 5 },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => {
      console.error('Question generation error:', err.response?.data || err.message);
      // Return default questions for testing
      return { 
        data: { 
          questions: [
            'How many years of experience do you have in caregiving?',
            'What would you do in a medical emergency?',
            'How do you handle difficult patients?'
          ] 
        } 
      };
    });
    
    console.log('Questions:', questionsResponse.data);
    
    // 2. Submit assessment
    const mockAssessment = {
      caregiverId: '123456789',
      questions: ['Question 1', 'Question 2', 'Question 3'],
      status: 'completed',
      score: 85
    };
    
    console.log('Testing assessment submission...');
    const submitResponse = await axios.post(
      'http://localhost:3000/api/assessment/submit', 
      {
        userId: mockAssessment.caregiverId,
        timestamp: new Date().toISOString(),
        questions: mockAssessment.questions.map((q, i) => ({ 
          id: `q${i+1}`, 
          text: q, 
          answer: 'Test answer'
        }))
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => {
      console.error('Submission error:', err.response?.data || err.message);
      return { data: { success: false, error: err.message } };
    });
    
    console.log('Submission result:', submitResponse.data);
    
    // 3. Test Azure API submission format
    console.log('Testing Azure API submission format...');
    console.log('Payload that would be sent to Azure:', JSON.stringify(mockAssessment, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAssessment();
