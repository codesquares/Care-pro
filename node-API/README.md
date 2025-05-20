# Care-Pro API Service

This repository contains the backend API for the Care-Pro application, a platform designed to streamline caregiver verification, qualification, and onboarding processes in Nigeria and across Africa.

## Overview

The Care-Pro API provides services for:
- Know Your Customer (KYC) verification using Dojah Identity Verification
- Caregiver qualification assessment using AI-powered evaluation
- Webhook handling for verification status updates
- Client service matching system with AI-powered analysis and provider recommendations

## Features

### Healthcare Professional Qualification Assessment
- Dynamic questionnaire system that adapts to different healthcare provider types (caregivers, nurses, doctors, dieticians)
- AI-powered question generation tailored to each healthcare specialty
- Automatic evaluation of responses using OpenAI's GPT-4 model
- Score-based qualification system with detailed feedback and improvement suggestions
- 50% qualification threshold with targeted improvement guidance for those who don't meet the standard
- Support for multiple healthcare provider types (starting with caregivers, expandable to other professionals)

### Identity Verification
- Secure document verification using Dojah (African-focused identity verification)
- Multiple ID types supported (NIN, BVN, passport, etc.)
- Biometric verification with selfie matching
- Address verification capabilities
- Webhook processing for verification status updates

### Azure API Integration
- Seamless integration with Microsoft Azure hosted authentication API
- Verification status sync between systems
- Qualification assessment results shared with main application
- API key-based secure service-to-service communication
- Support for JWT tokens from both local and Azure authentication
- User information federation between systems

### Client Service Matching System
- AI-powered analysis of client service requests
- Automatic categorization and tagging of service needs
- Breakdown of service requests into specific tasks with time estimates
- Location-based matching with providers within specified distance
- Service tag matching for better provider-client compatibility
- Provider recommendations with match scores and priority rankings
- Support for recurring service schedules and specific appointment times
- Client and provider rating/review system for quality assurance

## API Endpoints

### Auth Routes (`/api/auth`)
- `POST /api/auth/verify-user` - Check if a user exists by email
- `POST /api/auth/login` - Authenticate an existing user
- `GET /api/auth/me` - Get current user profile (Protected)
- `PATCH /api/auth/update-profile` - Update user profile (Protected)

### KYC Routes (`/api/kyc`)
- `POST /api/kyc/start` - Start KYC verification process (Protected)
- `GET /api/kyc/questions` - Get assessment questions for the user (Protected)
- `POST /api/kyc/generate-questions` - Generate assessment questions for a specific provider type (Protected)
- `POST /api/kyc/submit` - Submit assessment responses (Protected)
- `POST /api/kyc/evaluate` - Evaluate assessment responses with AI (Protected)
- `POST /api/kyc/verification-session` - Create verification session (Protected)
- `POST /api/kyc/verify-nin` - Verify NIN (National ID) (Protected)
- `POST /api/kyc/verify-bvn` - Verify BVN (Bank Verification Number) (Protected)
- `POST /api/kyc/verify-address` - Verify address (Protected)
- `GET /api/kyc/status` - Get verification status (Protected)

### Webhook Routes (`/api/webhook`)
- `POST /api/webhook/webhook` - Handle verification status updates
- `GET /api/webhook/events` - Get webhook event history

### Integration Routes (`/api/integration`)
- `GET /api/integration/verification-status/:userId` - Get detailed verification status for user (API Key Auth)
- `POST /api/integration/sync-verification` - Sync verification status with Azure API (API Key Auth)

### Client Service Routes (`/api/client-services`)
- `POST /api/client-services/create` - Create a new service request (Client only)
- `GET /api/client-services/my-requests` - Get client's service requests (Client only)
- `GET /api/client-services/request/:requestId` - Get a specific service request
- `PATCH /api/client-services/update/:requestId` - Update a service request (Client only)
- `PATCH /api/client-services/cancel/:requestId` - Cancel a service request (Client only)
- `GET /api/client-services/matches/:requestId` - Get matched providers for a request (Client only)
- `POST /api/client-services/select-provider/:requestId/:providerId` - Select a provider (Client only)
- `GET /api/client-services/provider-requests` - Get service requests matched to provider (Provider only)
- `POST /api/client-services/respond/:requestId` - Respond to service request match (Provider only)

### Provider Service Routes (`/api/provider-services`)
- `POST /api/provider-services/find` - Find providers based on search criteria (Public)
- `GET /api/provider-services/view/:providerId` - View a provider's service profile (Public)
- `POST /api/provider-services/create-update` - Create or update provider service profile (Provider only)
- `GET /api/provider-services/my-service` - Get provider's own service profile (Provider only)
- `PATCH /api/provider-services/update-availability` - Update provider's availability (Provider only)
- `PATCH /api/provider-services/toggle-active` - Toggle provider's active status (Provider only)
- `GET /api/provider-services/recommended-requests` - Get recommended service requests (Provider only)
- `POST /api/provider-services/review/:providerId` - Add a review for a provider (Client only)

## Authentication

### JWT-Based Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid token.

**Token Usage:**
1. Obtain a token through login with existing user credentials
2. Include the token in requests using one of the following methods:
   - Authorization header: `Authorization: Bearer <token>`
   - Request body: `{ "token": "<token>" }`
   - Query parameters: `?token=<token>`

**Example:**
```javascript
// Login to get token
const response = await fetch('https://api.care-pro.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token } = await response.json();

// Use token in subsequent requests
const profileResponse = await fetch('https://api.care-pro.com/api/kyc/status', {
  headers: { 
    'Authorization': `Bearer ${token}` 
  }
});
```

## KYC Verification Flow

1. User logs in with existing credentials
2. Start KYC process (`POST /api/kyc/start`)
3. Complete qualification assessment:
   - Get questions based on provider type (`GET /api/kyc/questions?providerType=caregiver`)
   - Submit responses (`POST /api/kyc/submit`)
   - AI evaluation of responses (`POST /api/kyc/evaluate`)
   - If score is below 50%, review improvement suggestions and retry
4. Complete identity verification:
   - Verify NIN (`POST /api/kyc/verify-nin`) or BVN (`POST /api/kyc/verify-bvn`)
   - Verify address (`POST /api/kyc/verify-address`)
5. Check verification status (`GET /api/kyc/status`)

## Healthcare Provider Types

The system currently supports the following healthcare provider types:
- **Caregiver**: Default provider type with assessment focused on patient care and support
- **Nurse**: Assessment focused on medical care, medications, and patient monitoring
- **Doctor**: Assessment focused on diagnosis, treatment, and medical decision-making 
- **Dietician**: Assessment focused on nutrition, meal planning, and dietary management

Additional provider types can be added in future releases.

## Client Service Matching Flow

1. Client creates a service request with details about needed care (`POST /api/client-services/create`)
2. System uses AI to analyze the request and extract:
   - Required provider types (caregiver, nurse, doctor, dietician)
   - Service tags for matching
   - Task breakdown with time estimates
   - Notes for both clients and providers
3. System finds matching providers based on:
   - Provider type match
   - Geographic proximity
   - Service tag match
   - Provider ratings and reviews
4. Client reviews matched providers and selects one (`POST /api/client-services/select-provider/:requestId/:providerId`)
5. Provider accepts or declines the service request (`POST /api/client-services/respond/:requestId`)
6. If accepted, a gig is created to track the service delivery
7. After service completion, client can review the provider (`POST /api/provider-services/review/:providerId`)

## Provider Service Registration Flow

1. Provider completes KYC verification process (as described in KYC Verification Flow)
2. Provider creates a service profile (`POST /api/provider-services/create-update`)
   - Specifies service types, skills, and experience
   - Sets service area and distance willing to travel
   - Sets availability schedule and pricing
3. Provider receives matched service requests (`GET /api/provider-services/recommended-requests`)
4. Provider responds to service requests (`POST /api/client-services/respond/:requestId`)
5. Provider completes services and receives reviews from clients

## Azure API Integration Flow

1. Authentication between APIs:
   - JWT tokens from the Azure API are accepted by this API
   - API key authentication for secure service-to-service communication
   - User profiles from the Azure API are automatically recognized

2. Verification Status Sync:
   - When a user completes KYC verification, status is sent to Azure API
   - Qualification assessment results are synced with Azure API
   - User profile status updates (verified, incomplete, etc.) are shared

3. Data Synchronization:
   - Both APIs share the same MongoDB database
   - This API handles Core KYC functionality while Azure API handles:
     - User authentication
     - JWT creation and management
     - Messaging and notifications
     - Payment processing
     - Gig creation and tracking

4. Integration Endpoints:
   - Azure API can query verification status via `/api/integration/verification-status/:userId`
   - Webhook handlers automatically inform Azure API of status changes
   - User profiles are kept in sync between systems

## Dojah Integration for Identity Verification

The API uses [Dojah](https://dojah.io/) for identity verification, which provides specialized services for Nigeria and broader Africa.

Benefits of Dojah over Stripe Identity:
- Supports African identity documents (NIN, BVN, Ghana Card, etc.)
- Local presence and compliance with Nigerian regulations
- Specialized in African verification challenges
- Better data coverage for Nigeria and other African countries
- Lower costs for African verifications

## Tech Stack

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **API Integration**: OpenAI API, Dojah Identity Verification API
- **Other Tools**: Axios for HTTP requests, dotenv for environment configuration, bcryptjs for password hashing

## Installation & Setup

### Prerequisites
- Node.js v14+
- MongoDB
- Dojah account
- OpenAI API key

### Environment Variables
Create a `.env` file with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/care-pro
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=30d

# Dojah credentials
DOJAH_API_KEY=your_dojah_api_key
DOJAH_APP_ID=your_dojah_app_id
DOJAH_WEBHOOK_SECRET=your_dojah_webhook_secret

# OpenAI credentials
OPENAI_API_KEY=your_openai_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Database Models

### User Model
- Personal information (name, email, phone)
- Authentication (password)
- Role (caregiver, admin, client)
- Verification status

### Assessment Model
- Questions and responses
- Evaluation score and feedback
- Timestamps

### Verification Model
- Verification type (NIN, BVN, address)
- Status and reference IDs
- Verification data and timestamps

### Client Service Request Model
- Client information
- Service details and requirements
- Location and distance preferences
- Service dates and recurring patterns
- Provider type requirements
- AI-generated analysis (tags, tasks, etc.)
- Matched providers with scores
- Status tracking

### Provider Service Model
- Provider information and types
- Service descriptions and capabilities
- Skills and experience
- Service area and travel distance
- Availability schedule
- Pricing information
- Reviews and ratings

### Gig Model
- Links client request with provider
- Scheduled service times
- Task breakdown and status
- Payment details
- Ratings and reviews
- Notes and communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm or yarn
- Stripe account with Identity verification enabled
- OpenAI API key

### Installation

1. Clone the repository
```
git clone <repository-url>
cd Care-pro/node-API
```

2. Install dependencies
```
npm install
```

3. Create a `.env` file in the root directory using the provided template:
```
cp .env.example .env
```

4. Update the `.env` file with your credentials:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/care-pro
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d
DOJAH_API_KEY=your_dojah_api_key_here
DOJAH_APP_ID=your_dojah_app_id_here
DOJAH_WEBHOOK_SECRET=your_dojah_webhook_secret_here
OPENAI_API_KEY=your_openai_api_key_here
```

5. Start MongoDB (if running locally)
```
mongod --dbpath=/path/to/data/directory
```

6. Start the development server
```
npm start
```

## Development

### Project Structure
```
node-API/
├── app.js                  # Entry point for the application
├── package.json            # Project dependencies and scripts
├── README.md               # Project documentation
├── .env.example            # Environment variables template
├── src/
│   ├── config/             # Configuration files
│   │   └── db.js           # Database connection
│   ├── controllers/        # Request handlers
│   │   ├── authController.js
│   │   ├── kycController.js
│   │   └── webhookController.js
│   ├── middleware/         # Express middleware
│   │   └── authMiddleware.js
│   ├── models/             # Mongoose data models
│   │   ├── assessmentModel.js
│   │   ├── userModel.js
│   │   └── verificationModel.js
│   ├── routes/             # API routes
│   │   ├── authRoutes.js
│   │   ├── kycRoutes.js
│   │   └── webhookRoutes.js
│   └── services/           # External services integration
│       ├── dojahService.js
│       └── openAIService.js
```

## API Documentation

### Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header for protected routes:
```
Authorization: Bearer your_jwt_token
```

### Identity Verification with Dojah

#### Setting up Dojah
1. Create an account on [Dojah](https://dojah.io/)
2. Navigate to the dashboard and get your API keys
3. Add your webhook URL in the Dojah dashboard settings
4. Update your .env file with the Dojah credentials

Dojah provides identity verification services specifically designed for Africa, supporting:
- NIN (Nigeria)
- BVN (Nigeria)
- Driver's License verification
- Passport verification
- Voter ID verification
- Address verification
- Selfie-to-ID matching

## Future Enhancements

- Implement client-facing frontend application
- Add admin dashboard for reviewing verification status
- Expand assessment modules for different types of caregiving specialties
- Add background check integration
- Implement real-time notification system
- Add payment integration for verification fees
- Support for more African countries and ID types
- Enhanced security features and audit logging

## License

ISC
