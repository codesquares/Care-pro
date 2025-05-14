/**
 * Test script for client service matching functionality
 * 
 * This script demonstrates the client-provider matching workflow:
 * 1. Client and provider login
 * 2. Provider creates/updates service profile
 * 3. Client creates service request
 * 4. AI analyzes request and finds matching providers
 * 5. Client views matches and selects a provider
 * 6. Provider responds to the service request
 * 7. Service is created as a gig
 */

require('dotenv').config();
const axios = require('axios');

// Base URL for API
const API_URL = 'http://localhost:3000/api';

// Test credentials
const CLIENT_EMAIL = 'client@example.com';
const CLIENT_PASSWORD = 'password123';
const PROVIDER_EMAIL = 'caregiver@example.com';
const PROVIDER_PASSWORD = 'password123';

// Test data for client service request
const testServiceRequest = {
  title: "Home care for elderly father",
  description: "My 78-year-old father needs assistance with daily activities including bathing, medication management, and meal preparation. He has mild dementia but is generally cooperative. He also needs help with mobility as he uses a walker. Looking for a compassionate caregiver who can provide care 4 hours per day, 3 days per week.",
  location: {
    coordinates: [3.3792, 6.5244], // Lagos, Nigeria
    address: {
      street: "123 Main Street",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      postalCode: "100001"
    }
  },
  maxDistance: 15,
  serviceDate: {
    startDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
    isRecurring: true,
    recurringPattern: {
      frequency: "weekly",
      daysOfWeek: [1, 3, 5] // Monday, Wednesday, Friday
    }
  },
  budget: 20000
};

// Test data for provider service
const testProviderService = {
  active: true,
  serviceTypes: ["basic_care", "medical_care", "mobility_assistance"],
  serviceDescription: "Experienced caregiver specialized in elderly care with over 10 years of experience. Trained in dementia care and medication management.",
  skills: [
    {
      name: "Dementia Care",
      yearsExperience: 5,
      certifications: ["Dementia Care Certificate - National Association"]
    },
    {
      name: "Medication Management",
      yearsExperience: 10,
      certifications: ["Medication Administration Certificate"]
    }
  ],
  serviceTags: ["elderly care", "dementia", "medication management", "personal care", "mobility assistance"],
  providerType: "caregiver", // Added provider type
  availability: {
    schedule: [
      {
        dayOfWeek: 1, // Monday
        startTime: "08:00",
        endTime: "17:00"
      },
      {
        dayOfWeek: 3, // Wednesday
        startTime: "08:00",
        endTime: "17:00"
      },
      {
        dayOfWeek: 5, // Friday
        startTime: "08:00",
        endTime: "17:00"
      }
    ],
    maxConcurrentClients: 2
  },
  serviceArea: {
    center: {
      coordinates: [3.3792, 6.5244], // Lagos, Nigeria
      address: {
        street: "45 Provider Street",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        postalCode: "100001"
      }
    },
    maxDistance: 20
  },
  pricing: {
    hourlyRate: 5000,
    minimumHours: 3,
    currency: "NGN",
    specialRates: [
      {
        serviceType: "medical_care",
        rate: 7000,
        conditions: "Includes medication administration and vital signs monitoring"
      }
    ]
  }
};

// Helper function to log responses nicely
const logResponse = (title, data) => {
  console.log('\n' + '='.repeat(80));
  console.log(`${title}`);
  console.log('='.repeat(80));
  console.log(JSON.stringify(data, null, 2));
};

// Login function for authentication
const login = async (email, password) => {
  try {
    console.log(`Logging in as ${email}...`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Main function to run tests
const runTests = async () => {
  try {
    console.log('Starting client service matching tests...');
    
    // 1. Login as a client
    const clientToken = await login(CLIENT_EMAIL, CLIENT_PASSWORD);
    console.log('Client logged in successfully');
    
    // 2. Login as a provider
    const providerToken = await login(PROVIDER_EMAIL, PROVIDER_PASSWORD);
    console.log('Provider logged in successfully');
    
    // 3. Create or update provider service profile
    console.log('Creating/updating provider service profile...');
    const providerServiceResponse = await axios.post(
      `${API_URL}/provider-services/create-update`,
      testProviderService,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`
        }
      }
    );
    
    logResponse('Provider Service Created/Updated', providerServiceResponse.data);
    
    // 4. Create a service request as client
    console.log('Creating client service request...');
    const serviceRequestResponse = await axios.post(
      `${API_URL}/client-services/create`,
      testServiceRequest,
      {
        headers: {
          Authorization: `Bearer ${clientToken}`
        }
      }
    );
    
    logResponse('Service Request Created', serviceRequestResponse.data);
    const requestId = serviceRequestResponse.data.data._id;
    
    // 5. Get matched providers for the service request
    console.log('Getting matched providers...');
    const matchedProvidersResponse = await axios.get(
      `${API_URL}/client-services/matches/${requestId}`,
      {
        headers: {
          Authorization: `Bearer ${clientToken}`
        }
      }
    );
    
    logResponse('Matched Providers', matchedProvidersResponse.data);
    
    // If there are matches, select a provider
    if (matchedProvidersResponse.data.matchedProviders && 
        matchedProvidersResponse.data.matchedProviders.length > 0) {
      
      const providerId = matchedProvidersResponse.data.matchedProviders[0].provider._id;
      
      // 6. Select a provider as client
      console.log('Selecting provider...');
      const selectProviderResponse = await axios.post(
        `${API_URL}/client-services/select-provider/${requestId}/${providerId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${clientToken}`
          }
        }
      );
      
      logResponse('Provider Selected', selectProviderResponse.data);
      
      // 7. Get provider's requests
      console.log('Getting provider service requests...');
      const providerRequestsResponse = await axios.get(
        `${API_URL}/client-services/provider-requests`,
        {
          headers: {
            Authorization: `Bearer ${providerToken}`
          }
        }
      );
      
      logResponse('Provider Service Requests', providerRequestsResponse.data);
      
      // 8. Respond to the service request as provider
      console.log('Responding to service request...');
      const respondResponse = await axios.post(
        `${API_URL}/client-services/respond/${requestId}`,
        {
          accept: true,
          feedback: "I'm available to provide care on the requested days and have experience with dementia patients."
        },
        {
          headers: {
            Authorization: `Bearer ${providerToken}`
          }
        }
      );
      
      logResponse('Provider Response', respondResponse.data);
      
      // 9. Add a review for the provider (normally would be after service completion)
      console.log('Adding provider review...');
      const reviewResponse = await axios.post(
        `${API_URL}/provider-services/review/${providerId}`,
        {
          rating: 5,
          comment: "Excellent caregiver, very professional and caring."
        },
        {
          headers: {
            Authorization: `Bearer ${clientToken}`
          }
        }
      );
      
      logResponse('Provider Review Added', reviewResponse.data);
    } else {
      console.log('No matched providers found for this service request');
    }
    
    // 10. Get provider's recommended requests
    console.log('Getting provider recommended requests...');
    const recommendedRequestsResponse = await axios.get(
      `${API_URL}/provider-services/recommended-requests`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`
        }
      }
    );
    
    logResponse('Provider Recommended Requests', recommendedRequestsResponse.data);
    
    // 11. Get client's service requests
    console.log('Getting client service requests...');
    const clientRequestsResponse = await axios.get(
      `${API_URL}/client-services/my-requests`,
      {
        headers: {
          Authorization: `Bearer ${clientToken}`
        }
      }
    );
    
    logResponse('Client Service Requests', clientRequestsResponse.data);
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
};

// Run the tests
runTests();
