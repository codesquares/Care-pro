# Care-Pro Project Documentation

## Overview
Care-Pro is a platform designed to connect caregivers with clients needing care services. The project consists of a React-based frontend and a middleware Node.js API that communicates with an external Azure-hosted API. This document aims to provide developers with a comprehensive understanding of the project structure, endpoints, services, and technology stack.

## Project Structure

### High-Level Organization
```
Care-Pro/
├── frontend/             # React-based frontend application
│   └── vite-project/     # Vite build tool configuration and source code
├── node-API/             # Node.js middleware API
│   └── src/              # Source code for the Node.js API
└── backend/              # (Not covered in this documentation)
```

### Frontend Structure (Vite/React)
```
frontend/vite-project/
├── public/               # Static assets
├── src/                  # Source code
│   ├── App.jsx           # Main application component
│   ├── main-app/         # Main application logic and components
│   │   ├── components/   # Reusable UI components
│   │   ├── config.js     # Configuration including API endpoints
│   │   ├── context/      # React Context providers (Auth, Blog, etc.)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components organized by user role
│   │   │   ├── care-giver/  # Caregiver-specific pages and routes
│   │   │   └── client/      # Client-specific pages and routes
│   │   ├── routes.jsx    # Main routing configuration
│   │   ├── services/     # API services and utilities
│   │   └── utilities/    # Helper functions and utilities
│   ├── assets/           # Images, fonts, and other assets
│   └── styles/           # Global styles and CSS
├── index.html            # HTML entry point
└── vite.config.js        # Vite configuration
```

### Node API Structure
```
node-API/
├── app.js                # Entry point for the Node.js application
├── src/                  # Source code
│   ├── controllers/      # Request handlers for routes
│   │   ├── authController.js
│   │   ├── clientServiceController.js
│   │   ├── kycController.js
│   │   └── ...
│   ├── middleware/       # Express middleware
│   │   └── authMiddleware.js
│   ├── routes/           # API routes
│   │   ├── authRoutes.js
│   │   ├── clientServiceRoutes.js
│   │   └── ...
│   └── services/         # Business logic and external service integration
│       ├── dojahService.js
│       ├── openAIService.js
│       ├── stripeService.js
│       └── ...
└── external-endpoints.md # Documentation for external API endpoints
```

## API Endpoints

### External API Endpoints (Azure-hosted)

#### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Authentications/UserLogin` | POST | Authenticates a user and provides an access token |
| `/CareGivers/AddCaregiverUser` | POST | Registers a new caregiver in the system |

#### Caregiver Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/CareGivers/AllCaregivers` | GET | Retrieves a list of all caregivers |
| `/CareGivers/{caregiverId}` | GET | Retrieves details for a specific caregiver |
| `/CareGivers/UpdateCaregiverInfo/{caregiverId}` | PUT | Updates general information for a caregiver |
| `/CareGivers/UpdateCaregiverAvailability/{caregiverId}` | PUT | Updates the availability schedule for a caregiver |
| `/CareGivers/SoftDeleteCaregiver/{caregiverId}` | PUT | Marks a caregiver as deleted without removing from the database |
| `/CareGivers/UpdateCaregiverAboutMeInfo/{caregiverId}` | PUT | Updates the About Me section of a caregiver's profile |

#### Gig Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Gigs` | POST | Creates a new gig/service offering |
| `/Gigs` | GET | Retrieves a list of all gigs |
| `/Gigs/caregiver/{caregiverId}` | GET | Retrieves all gigs for a specific caregiver |
| `/Gigs/service/{caregiverId}` | GET | Retrieves service-specific gigs for a caregiver |
| `/Gigs/{caregiverId}/paused` | GET | Retrieves all paused gigs for a caregiver |
| `/Gigs/{caregiverId}/draft` | GET | Retrieves all draft gigs for a caregiver |
| `/Gigs/{gigId}` | GET | Retrieves details for a specific gig |
| `/Gigs/UpdateGigStatusToPause/{gigId}` | PUT | Updates a gig's status to paused |
| `/Gigs/UpdateGig/{gigId}` | PUT | Updates the details of a gig |

#### Client Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Clients/{clientId}` | GET | Retrieves details for a specific client |
| `/Clients/AllClientUsers` | GET | Retrieves a list of all clients |

### Node.js API Endpoints (Middleware)

#### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/verify` | POST | Verifies a user's token and ID against the external API |

#### Client Service Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/client-services/create` | POST | Creates a new service request |
| `/client-services/my-requests` | GET | Retrieves all service requests for the logged-in client |
| `/client-services/request/:requestId` | GET | Retrieves details for a specific service request |
| `/client-services/update/:requestId` | PATCH | Updates a service request |
| `/client-services/cancel/:requestId` | PATCH | Cancels a service request |
| `/client-services/matches/:requestId` | GET | Retrieves matched providers for a service request |
| `/client-services/select-provider/:requestId/:providerId` | POST | Selects a provider for a service request |
| `/client-services/provider-requests` | GET | Retrieves service requests for a provider |
| `/client-services/respond/:requestId` | POST | Allows a provider to respond to a service request match |

#### KYC and Verification Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/kyc/verify-id` | POST | Verifies a user's ID document |
| `/kyc/verify-selfie` | POST | Verifies a user's selfie against their ID |
| `/kyc/update-status` | POST | Updates a user's verification status |

## Services and Controllers

### Frontend Services

#### API Service (`api.js`)
- Handles all communication with both the Node.js middleware and external API
- Manages authentication tokens
- Implements request and response interceptors

#### Auth Service (`auth.js`)
- Manages user authentication
- Handles token refresh
- Provides logout functionality

#### Chat Service (`chatService.js`)
- Manages real-time chat functionality using SignalR

#### Verification Service (`verificationService.js`)
- Handles caregiver verification processes

### Node.js Controllers

#### Auth Controller
- Verifies user credentials against the external API
- Updates user verification status

#### Client Service Controller
- Manages service requests from clients
- Handles provider matching and selection

#### KYC Controller
- Processes ID verification
- Handles selfie verification
- Updates verification status

## Technology Stack

### Frontend
- **React**: ^18.3.1 - UI library
- **Vite**: ^5.4.1 - Build tool
- **React Router**: ^6.26.1 - Client-side routing
- **Axios**: ^1.7.9 - HTTP client
- **Contentful**: ^11.4.6 - Headless CMS for blog content
- **@microsoft/signalr**: ^8.0.7 - Real-time communications
- **React Markdown**: ^9.0.3 - Markdown rendering
- **SASS**: ^1.77.8 - CSS preprocessor

### Node.js API
- **Express**: ^4.21.2 - Web framework
- **Axios**: ^1.9.0 - HTTP client for external API calls
- **JWT**: ^9.0.2 - Authentication
- **Mongoose**: ^8.0.3 - MongoDB object modeling
- **Multer**: ^1.4.5-lts.1 - File uploads
- **Bcrypt**: ^2.4.3 - Password hashing

## Integrated Third-Party APIs

1. **Azure-hosted Care-Pro API**
   - Base URL: `https://carepro-api20241118153443.azurewebsites.net/api`
   - Used for core business logic and data persistence

2. **Contentful**
   - Used for managing blog content
   - Configured via environment variables:
     - `VITE_CONTENTFUL_SPACE_ID`
     - `VITE_CONTENTFUL_ACCESS_TOKEN_PUBLISHED`

3. **SignalR**
   - Used for real-time chat functionality

4. **KYC Verification Services**
   - Dojah API for ID verification (Nigeria)
   - Custom verification service for other regions

## Data Structures

### Key Data Models

#### User
```typescript
interface User {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
  phoneNo: string;
  verificationStatus?: string;
}
```

#### Caregiver (extends User)
```typescript
interface Caregiver extends User {
  skills: string[];
  certifications: Certification[];
  availability: Availability[];
  aboutMe?: string;
  ratings?: Rating[];
  gigs?: Gig[];
}
```

#### Client (extends User)
```typescript
interface Client extends User {
  address?: string;
  preferences?: string[];
  serviceRequests?: ServiceRequest[];
}
```

#### Gig
```typescript
interface Gig {
  id: string;
  caregiverId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'paused' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}
```

#### ServiceRequest
```typescript
interface ServiceRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  startDate: Date;
  endDate?: Date;
  status: 'pending' | 'matched' | 'confirmed' | 'completed' | 'cancelled';
  selectedProviderId?: string;
  matches?: ProviderMatch[];
}
```

## Authentication Flow

1. User enters credentials and submits login form
2. Frontend calls external API login endpoint
3. On successful authentication, tokens are stored in localStorage
4. AuthContext updates the authenticated state
5. Protected routes become accessible
6. Token refresh happens automatically when needed
7. On logout, tokens are cleared and user is redirected to login

## Development Setup

1. Clone the repository
2. Set up environment variables:
   - Frontend (`.env` in `frontend/vite-project/`)
   - Node API (`.env` in `node-API/`)
3. Install dependencies:
   ```bash
   # Frontend
   cd frontend/vite-project
   npm install

   # Node API
   cd node-API
   npm install
   ```
4. Start the development servers:
   ```bash
   # Frontend
   cd frontend/vite-project
   npm run dev

   # Node API
   cd node-API
   npm start
   ```

## Deployment

The application is configured for deployment using:
- Frontend: GitHub Pages (see `homepage` in `package.json`)
- Node API: Standard Node.js deployment (see `DEPLOY.md` for details)

## Additional Resources

- External API documentation: `node-API/external-endpoints.md`
- Deployment guide: `node-API/DEPLOY.md`
- Implementation details: `node-API/IMPLEMENTATION.md`
- Setup guide: `node-API/SETUP.md`

---

*This documentation is maintained by the Care-Pro team. Last updated: May 18, 2025*
