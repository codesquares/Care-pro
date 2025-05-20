/*
  Client Service API Usage Examples

  =============================================
  CLIENT SERVICE REQUESTS ENDPOINTS
  =============================================

  1. CREATE A NEW SERVICE REQUEST:
  POST /api/client-services/create
  Headers: Authorization: Bearer <token>
  {
    "title": "Home care for elderly father",
    "description": "My 78-year-old father needs assistance with daily activities including bathing, medication management, and meal preparation. He has mild dementia but is generally cooperative. He also needs help with mobility as he uses a walker. Looking for a compassionate caregiver who can provide care 4 hours per day, 3 days per week.",
    "location": {
      "coordinates": [3.3792, 6.5244], // [longitude, latitude] for Lagos
      "address": {
        "street": "123 Main Street",
        "city": "Lagos",
        "state": "Lagos",
        "country": "Nigeria",
        "postalCode": "100001"
      }
    },
    "maxDistance": 15, // kilometers
    "serviceDate": {
      "startDate": "2025-05-20T09:00:00.000Z",
      "isRecurring": true,
      "recurringPattern": {
        "frequency": "weekly",
        "daysOfWeek": [1, 3, 5] // Monday, Wednesday, Friday
      }
    },
    "budget": 20000 // Naira
  }

  2. GET CLIENT'S SERVICE REQUESTS:
  GET /api/client-services/my-requests
  Headers: Authorization: Bearer <token>

  3. GET SPECIFIC SERVICE REQUEST:
  GET /api/client-services/request/{requestId}
  Headers: Authorization: Bearer <token>

  4. UPDATE SERVICE REQUEST:
  PATCH /api/client-services/update/{requestId}
  Headers: Authorization: Bearer <token>
  {
    "title": "Updated title",
    "description": "Updated description",
    "budget": 25000
  }

  5. CANCEL SERVICE REQUEST:
  PATCH /api/client-services/cancel/{requestId}
  Headers: Authorization: Bearer <token>

  6. GET MATCHED PROVIDERS:
  GET /api/client-services/matches/{requestId}
  Headers: Authorization: Bearer <token>

  7. SELECT A PROVIDER:
  POST /api/client-services/select-provider/{requestId}/{providerId}
  Headers: Authorization: Bearer <token>

  =============================================
  PROVIDER SERVICE ENDPOINTS
  =============================================

  1. CREATE/UPDATE PROVIDER SERVICE PROFILE:
  POST /api/provider-services/create-update
  Headers: Authorization: Bearer <token>
  {
    "active": true,
    "serviceTypes": ["basic_care", "medical_care", "mobility_assistance"],
    "serviceDescription": "Experienced caregiver specialized in elderly care with over 10 years of experience. Trained in dementia care and medication management.",
    "skills": [
      {
        "name": "Dementia Care",
        "yearsExperience": 5,
        "certifications": ["Dementia Care Certificate - National Association"]
      },
      {
        "name": "Medication Management",
        "yearsExperience": 10,
        "certifications": ["Medication Administration Certificate"]
      }
    ],
    "serviceTags": ["elderly care", "dementia", "medication management", "personal care", "mobility assistance"],
    "availability": {
      "schedule": [
        {
          "dayOfWeek": 1, // Monday
          "startTime": "08:00",
          "endTime": "17:00"
        },
        {
          "dayOfWeek": 3, // Wednesday
          "startTime": "08:00",
          "endTime": "17:00"
        },
        {
          "dayOfWeek": 5, // Friday
          "startTime": "08:00",
          "endTime": "17:00"
        }
      ],
      "maxConcurrentClients": 2
    },
    "serviceArea": {
      "center": {
        "coordinates": [3.3792, 6.5244], // [longitude, latitude] for Lagos
        "address": {
          "street": "45 Provider Street",
          "city": "Lagos",
          "state": "Lagos",
          "country": "Nigeria",
          "postalCode": "100001"
        }
      },
      "maxDistance": 20 // kilometers
    },
    "pricing": {
      "hourlyRate": 5000, // Naira
      "minimumHours": 3,
      "currency": "NGN",
      "specialRates": [
        {
          "serviceType": "medical_care",
          "rate": 7000,
          "conditions": "Includes medication administration and vital signs monitoring"
        }
      ]
    }
  }

  2. GET PROVIDER'S OWN SERVICE PROFILE:
  GET /api/provider-services/my-service
  Headers: Authorization: Bearer <token>

  3. VIEW A SPECIFIC PROVIDER'S PROFILE:
  GET /api/provider-services/view/{providerId}
  Headers: Authorization: Bearer <token> (optional)

  4. FIND PROVIDERS (Search):
  POST /api/provider-services/find
  {
    "providerType": "caregiver",
    "serviceTypes": ["basic_care", "mobility_assistance"],
    "location": {
      "coordinates": [3.3792, 6.5244]
    },
    "maxDistance": 15,
    "serviceTags": ["elderly care", "dementia"]
  }

  5. UPDATE AVAILABILITY:
  PATCH /api/provider-services/update-availability
  Headers: Authorization: Bearer <token>
  {
    "availability": {
      "schedule": [
        {
          "dayOfWeek": 1,
          "startTime": "09:00",
          "endTime": "18:00"
        },
        {
          "dayOfWeek": 2,
          "startTime": "09:00",
          "endTime": "18:00"
        }
      ],
      "unavailableDates": [
        {
          "startDate": "2025-06-10T00:00:00.000Z",
          "endDate": "2025-06-15T23:59:59.000Z",
          "reason": "Vacation"
        }
      ]
    }
  }

  6. TOGGLE ACTIVE STATUS:
  PATCH /api/provider-services/toggle-active
  Headers: Authorization: Bearer <token>
  {
    "active": false
  }

  7. GET RECOMMENDED SERVICE REQUESTS:
  GET /api/provider-services/recommended-requests
  Headers: Authorization: Bearer <token>

  8. ADD PROVIDER REVIEW (Client Only):
  POST /api/provider-services/review/{providerId}
  Headers: Authorization: Bearer <token>
  {
    "rating": 5,
    "comment": "Excellent caregiver, very professional and caring."
  }

  =============================================
  PROVIDER RESPONDING TO SERVICE REQUESTS
  =============================================

  1. GET SERVICE REQUESTS MATCHED TO PROVIDER:
  GET /api/client-services/provider-requests
  Headers: Authorization: Bearer <token>

  2. RESPOND TO SERVICE REQUEST MATCH:
  POST /api/client-services/respond/{requestId}
  Headers: Authorization: Bearer <token>
  {
    "response": "accept", // or "decline"
    "feedback": "I'm available to provide care on the requested days and have experience with dementia patients."
  }

  =============================================
  AI ANALYSIS RESPONSE EXAMPLE
  =============================================

  When creating a service request, the AI will analyze it and return structured data like:

  {
    "requiredProviderTypes": ["caregiver", "nurse"],
    "serviceTags": ["elderly care", "dementia", "medication management", "personal care", "mobility assistance"],
    "serviceBreakdown": [
      {
        "task": "Bathing assistance",
        "description": "Help with personal hygiene including bathing",
        "estimatedTime": 30
      },
      {
        "task": "Medication management",
        "description": "Remind and assist with taking prescribed medications",
        "estimatedTime": 15
      },
      {
        "task": "Meal preparation",
        "description": "Prepare nutritious meals appropriate for the client's health needs",
        "estimatedTime": 45
      },
      {
        "task": "Mobility assistance",
        "description": "Support with walking using walker and transferring",
        "estimatedTime": 20
      }
    ],
    "confidenceScore": 92,
    "notesForClient": "Consider adding information about any dietary restrictions or food preferences to help caregivers prepare appropriate meals.",
    "notesForProvider": "Client's father has mild dementia. Experience with dementia patients would be beneficial. The client needs help with mobility using a walker."
  }
*/
