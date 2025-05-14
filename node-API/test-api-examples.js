// Test for the API
/*
  Example API Usage:

  1. Verify if a user exists:
  POST /api/auth/verify-user
  {
    "email": "john@example.com"
  }

  2. Login to get token:
  POST /api/auth/login
  {
    "email": "john@example.com",
    "password": "password123"
  }

  3. Start KYC process:
  POST /api/kyc/start
  Headers: Authorization: Bearer <token>
  
  4. Get assessment questions (optionally specify provider type):
  GET /api/kyc/questions?providerType=caregiver
  Headers: Authorization: Bearer <token>
  
  // OR generate questions for a specific provider type
  5. Generate questions for specific provider type:
  POST /api/kyc/generate-questions
  Headers: Authorization: Bearer <token>
  {
    "providerType": "nurse",
    "count": 10
  }
  
  6. Submit assessment responses:
  POST /api/kyc/submit
  Headers: Authorization: Bearer <token>
  {
    "providerType": "caregiver",
    "responses": [
      "I always ensure patient safety by...",
      "In an emergency situation...",
      "When dealing with dementia patients...",
      "..."
    ]
  }
  
  7. Evaluate assessment:
  POST /api/kyc/evaluate
  Headers: Authorization: Bearer <token>
  
  Response will include:
  {
    "status": "success",
    "score": 65,
    "qualificationStatus": "qualified", 
    "passed": true,
    "passThreshold": 50,
    "feedback": "Detailed feedback about strengths...",
    "improvements": null,  // If failed, this would include improvement suggestions
    "providerType": "caregiver"
  }
  
  7. Verify identity (NIN):
  POST /api/kyc/verify-nin
  Headers: Authorization: Bearer <token>
  {
    "ninNumber": "12345678901"
  }

  8. Verify identity (BVN):
  POST /api/kyc/verify-bvn
  Headers: Authorization: Bearer <token>
  {
    "bvnNumber": "12345678901"
  }
  
  9. Verify address:
  POST /api/kyc/verify-address
  Headers: Authorization: Bearer <token>
  {
    "address": {
      "street": "123 Main St",
      "city": "Lagos",
      "state": "Lagos",
      "country": "Nigeria"
    }
  }
  
  10. Check verification status:
  GET /api/kyc/status
  Headers: Authorization: Bearer <token>
  
  Response will include:
  {
    "status": "success",
    "data": {
      "profileStatus": "qualified",
      "verificationStatus": {
        "idVerified": true,
        "addressVerified": true,
        "qualificationVerified": true
      },
      "verifications": [
        {
          "type": "nin",
          "status": "verified",
          "date": "2023-05-14T10:30:00.000Z"
        },
        {
          "type": "address",
          "status": "verified",
          "date": "2023-05-14T11:15:00.000Z"
        }
      ],
      "assessment": {
        "completed": true,
        "evaluated": true,
        "score": 65,
        "passed": true,
        "providerType": "caregiver"
      }
    }
  }
*/
