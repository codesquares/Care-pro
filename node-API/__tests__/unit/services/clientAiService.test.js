/**
 * 🤖 Client AI Service Unit Tests - Maximum Coverage Focus
 * Testing all AI service functions with comprehensive coverage including edge cases
 */

const axios = require('axios');
const clientAiService = require('../../../src/services/clientAiService');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';

describe('🤖 Client AI Service Unit Tests - Coverage Focused', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzeClientServiceRequest Function Coverage', () => {
    const mockServiceRequest = {
      title: 'Elderly Care Assistance',
      description: 'Need help with daily activities for my elderly mother including bathing, medication reminders, and companionship.'
    };

    it('should analyze service request successfully', async () => {
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                requiredProviderTypes: ['caregiver', 'nurse'],
                serviceTags: ['elderly care', 'daily activities', 'medication', 'bathing', 'companionship'],
                serviceBreakdown: [
                  { task: 'Personal hygiene', description: 'Assistance with bathing', estimatedTime: 45 },
                  { task: 'Medication reminder', description: 'Daily medication reminders', estimatedTime: 15 }
                ],
                confidenceScore: 85,
                notesForClient: 'Please specify preferred schedule and any medical conditions',
                notesForProvider: 'Client needs comprehensive elderly care support'
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);

      const result = await clientAiService.analyzeClientServiceRequest(mockServiceRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ 
              role: 'user',
              content: expect.stringContaining('Elderly Care Assistance')
            })
          ]),
          max_tokens: 1500,
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
        {
          headers: {
            Authorization: 'Bearer test-openai-key',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual({
        requiredProviderTypes: ['caregiver', 'nurse'],
        serviceTags: ['elderly care', 'daily activities', 'medication', 'bathing', 'companionship'],
        serviceBreakdown: [
          { task: 'Personal hygiene', description: 'Assistance with bathing', estimatedTime: 45 },
          { task: 'Medication reminder', description: 'Daily medication reminders', estimatedTime: 15 }
        ],
        confidenceScore: 85,
        notesForClient: 'Please specify preferred schedule and any medical conditions',
        notesForProvider: 'Client needs comprehensive elderly care support'
      });
    });

    it('should handle OpenAI API error and return default response', async () => {
      const mockError = new Error('OpenAI API Error');
      mockedAxios.post.mockRejectedValue(mockError);

      const result = await clientAiService.analyzeClientServiceRequest(mockServiceRequest);

      expect(console.error).toHaveBeenCalledWith('Client service analysis error:', 'OpenAI API Error');
      expect(result).toEqual({
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
      });
    });

    it('should handle invalid OpenAI response structure', async () => {
      const mockInvalidResponse = {
        data: {
          choices: []
        }
      };
      mockedAxios.post.mockResolvedValue(mockInvalidResponse);

      const result = await clientAiService.analyzeClientServiceRequest(mockServiceRequest);

      expect(console.error).toHaveBeenCalledWith('Client service analysis error:', 'Invalid OpenAI API response');
      expect(result).toEqual({
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
      });
    });

    it('should handle missing choices in OpenAI response', async () => {
      const mockResponseWithoutChoices = {
        data: {}
      };
      mockedAxios.post.mockResolvedValue(mockResponseWithoutChoices);

      const result = await clientAiService.analyzeClientServiceRequest(mockServiceRequest);

      expect(console.error).toHaveBeenCalledWith('Client service analysis error:', 'Invalid OpenAI API response');
      expect(result).toEqual({
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
      });
    });

    it('should handle JSON parsing error', async () => {
      const mockResponseWithInvalidJSON = {
        data: {
          choices: [{
            message: {
              content: 'Invalid JSON response'
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponseWithInvalidJSON);

      const result = await clientAiService.analyzeClientServiceRequest(mockServiceRequest);

      expect(console.error).toHaveBeenCalledWith('Client service analysis error:', expect.any(String));
      expect(result).toEqual({
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
      });
    });

    it('should handle service request with missing fields', async () => {
      const incompleteRequest = {
        title: 'Care Needed'
      };

      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                requiredProviderTypes: ['caregiver'],
                serviceTags: ['general care'],
                serviceBreakdown: [{ task: 'Basic care', description: 'General care assistance', estimatedTime: 30 }],
                confidenceScore: 50,
                notesForClient: 'Please provide more details',
                notesForProvider: 'Limited service information'
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);

      const result = await clientAiService.analyzeClientServiceRequest(incompleteRequest);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(result.requiredProviderTypes).toEqual(['caregiver']);
    });
  });

  describe('analyzeClientNeedsAndPreferences Function Coverage', () => {
    const mockClientPreferences = {
      serviceType: 'Home Care',
      location: 'Downtown Area',
      schedule: 'Monday-Friday 9am-5pm',
      needs: 'Mobility assistance and meal preparation'
    };

    it('should analyze client needs and preferences successfully', async () => {
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                serviceType: 'Home Care',
                serviceCategory: 'personal care',
                requirementsLevel: 3,
                keywords: ['home care', 'mobility', 'meal prep', 'assistance', 'daily living', 
                          'personal care', 'companionship', 'elderly care', 'support', 'help'],
                locationPreference: 'Downtown Area',
                scheduleDetails: 'Monday-Friday 9am-5pm',
                specialRequirements: 'Mobility assistance and meal preparation'
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);

      const result = await clientAiService.analyzeClientNeedsAndPreferences(mockClientPreferences);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ 
              role: 'user',
              content: expect.stringContaining('Home Care')
            })
          ]),
          max_tokens: 1500,
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
        {
          headers: {
            Authorization: 'Bearer test-openai-key',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual({
        serviceType: 'Home Care',
        serviceCategory: 'personal care',
        requirementsLevel: 3,
        keywords: ['home care', 'mobility', 'meal prep', 'assistance', 'daily living', 
                  'personal care', 'companionship', 'elderly care', 'support', 'help'],
        locationPreference: 'Downtown Area',
        scheduleDetails: 'Monday-Friday 9am-5pm',
        specialRequirements: 'Mobility assistance and meal preparation'
      });
    });

    it('should handle missing optional fields', async () => {
      const minimalPreferences = {
        serviceType: 'Basic Care'
      };

      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                serviceType: 'Basic Care',
                serviceCategory: 'personal care',
                requirementsLevel: 2,
                keywords: ['basic care', 'assistance', 'support', 'help', 'caregiver', 
                          'daily activities', 'personal care', 'companionship', 
                          'elderly care', 'home care'],
                locationPreference: 'not specified',
                scheduleDetails: 'flexible',
                specialRequirements: 'none specified'
              })
            }
          }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockOpenAIResponse);

      const result = await clientAiService.analyzeClientNeedsAndPreferences(minimalPreferences);

      expect(result.serviceType).toBe('Basic Care');
      expect(result.locationPreference).toBe('not specified');
      expect(result.scheduleDetails).toBe('flexible');
    });

    it('should handle OpenAI API error and return default response', async () => {
      const mockError = new Error('Network Error');
      mockedAxios.post.mockRejectedValue(mockError);

      const result = await clientAiService.analyzeClientNeedsAndPreferences(mockClientPreferences);

      expect(console.error).toHaveBeenCalledWith('Client needs analysis error:', 'Network Error');
      expect(result).toEqual({
        serviceType: 'Home Care',
        serviceCategory: 'personal care',
        requirementsLevel: 2,
        keywords: ['care', 'assistance', 'support', 'help', 'caregiver', 
                  'daily activities', 'personal care', 'companionship', 
                  'elderly care', 'home care'],
        locationPreference: 'Downtown Area',
        scheduleDetails: 'Monday-Friday 9am-5pm',
        specialRequirements: 'Mobility assistance and meal preparation'
      });
    });

    it('should handle empty preferences object', async () => {
      const emptyPreferences = {};

      const mockError = new Error('API Error');
      mockedAxios.post.mockRejectedValue(mockError);

      const result = await clientAiService.analyzeClientNeedsAndPreferences(emptyPreferences);

      expect(result).toEqual({
        serviceType: 'general care',
        serviceCategory: 'personal care',
        requirementsLevel: 2,
        keywords: ['care', 'assistance', 'support', 'help', 'caregiver', 
                  'daily activities', 'personal care', 'companionship', 
                  'elderly care', 'home care'],
        locationPreference: 'not specified',
        scheduleDetails: 'flexible',
        specialRequirements: 'none specified'
      });
    });

    it('should handle invalid OpenAI response structure', async () => {
      const mockInvalidResponse = {
        data: {
          choices: [{
            message: null
          }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockInvalidResponse);

      const result = await clientAiService.analyzeClientNeedsAndPreferences(mockClientPreferences);

      expect(console.error).toHaveBeenCalledWith('Client needs analysis error:', 'Invalid OpenAI API response');
      expect(result.serviceType).toBe('Home Care');
      expect(result.serviceCategory).toBe('personal care');
    });
  });

  describe('Exported Functions Coverage', () => {
    it('should export all expected functions', () => {
      expect(typeof clientAiService.analyzeClientServiceRequest).toBe('function');
      expect(typeof clientAiService.analyzeClientNeedsAndPreferences).toBe('function');
    });

    it('should export the correct number of functions', () => {
      const exportedFunctions = Object.keys(clientAiService);
      expect(exportedFunctions).toHaveLength(2);
    });
  });
});
