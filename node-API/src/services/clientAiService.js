// src/services/clientAiService.js
const axios = require('axios');
require('dotenv').config();

/**
 * Analyzes a client's service request using AI
 * 
 * @param {Object} serviceRequest - The client's service request object
 * @returns {Promise<Object>} AI analysis of the service request
 */
const analyzeClientServiceRequest = async (serviceRequest) => {
  try {
    const { title, description } = serviceRequest;
    
    const messages = [
      {
        role: 'system',
        content: `You are an AI healthcare service assistant that analyzes client service requests and breaks them down into 
        structured data for matching with appropriate healthcare providers. Consider the client's needs, requested services, 
        and any specific requirements when analyzing the request.
        
        Return a detailed structured analysis in JSON format with the following fields:
        1. requiredProviderTypes: Array of provider types (caregiver, nurse, doctor, dietician) needed based on service description
        2. serviceTags: Array of relevant service tags/keywords for matching (at least 5, maximum 10)
        3. serviceBreakdown: Array of specific tasks needed, each with 'task', 'description', and 'estimatedTime' (in minutes) fields
        4. confidenceScore: Number from 0-100 indicating your confidence in this analysis
        5. notesForClient: Any clarifying questions or additional information needed from the client
        6. notesForProvider: Important notes or context that would help a provider understand this request`
      },
      {
        role: 'user',
        content: `Please analyze the following client service request:
        
        Title: ${title}
        
        Description: ${description}
        
        Format your response as a valid JSON object only, with no additional explanation or text.`
      }
    ];
    
    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4', // Using GPT-4 for better analysis
        messages: messages,
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent analysis
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!result.data.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI API response');
    }

    const parsedResponse = JSON.parse(result.data.choices[0].message.content);
    return parsedResponse;
  } catch (error) {
    console.error('Client service analysis error:', error.message);
    // Return a minimal default response
    return {
      requiredProviderTypes: ['caregiver'],
      serviceTags: ['general care', 'assistance'],
      serviceBreakdown: [{
        task: 'General assistance',
        description: 'Providing general support to client',
        estimatedTime: 60
      }],
      confidenceScore: 30,
      notesForClient: 'Could not fully analyze request. Please provide more details.',
      notesForProvider: 'Limited information provided in request.'
    };
  }
};

/**
 * Analyzes a client's needs and preferences for finding matching caregivers
 * 
 * @param {Object} clientPreferences - The client's preferences
 * @returns {Promise<Object>} AI analysis for matching
 */
const analyzeClientNeedsAndPreferences = async (clientPreferences) => {
  try {
    const { serviceType, location, schedule, needs } = clientPreferences;
    
    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant that specializes in matching care needs with appropriate caregivers. 
        Analyze the client's needs and preferences to create a structured profile for matching.
        
        Return a detailed structured analysis in JSON format with the following fields:
        1. serviceType: The primary type of service needed
        2. serviceCategory: Broader category of care needed (personal care, medical assistance, companionship, etc.)
        3. requirementsLevel: Rating from 1-5 indicating complexity of care needed
        4. keywords: Array of at least 10 specific keywords that should be used for matching with caregiver profiles
        5. locationPreference: Location details if provided
        6. scheduleDetails: Structured schedule information
        7. specialRequirements: Any special requirements or preferences`
      },
      {
        role: 'user',
        content: `Please analyze the following client preferences:
        
        Service Type: ${serviceType}
        Location: ${location || 'Not specified'}
        Schedule: ${schedule || 'Flexible'}
        Specific needs: ${needs || 'None specified'}
        
        Format your response as a valid JSON object only, with no additional explanation or text.`
      }
    ];
      
    const result = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!result.data.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI API response');
    }

    const parsedResponse = JSON.parse(result.data.choices[0].message.content);
    return parsedResponse;
  } catch (error) {
    console.error('Client needs analysis error:', error.message);
    // Return a minimal default response
    return {
      serviceType: clientPreferences.serviceType || 'general care',
      serviceCategory: 'personal care',
      requirementsLevel: 2,
      keywords: ['care', 'assistance', 'support', 'help', 'caregiver', 
                'daily activities', 'personal care', 'companionship', 
                'elderly care', 'home care'],
      locationPreference: clientPreferences.location || 'not specified',
      scheduleDetails: clientPreferences.schedule || 'flexible',
      specialRequirements: clientPreferences.needs || 'none specified'
    };
  }
};

module.exports = {
  analyzeClientServiceRequest,
  analyzeClientNeedsAndPreferences
};
