# Care-Pro API Setup Guide

This guide provides step-by-step instructions for setting up and configuring the Care-Pro API system, including all necessary dependencies, integrations, and configuration. By following these instructions, you'll have a fully functional API that handles KYC verification, qualification assessments, and service matching.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [API Integrations Setup](#api-integrations-setup)
   - [Dojah Identity Verification](#dojah-identity-verification)
   - [OpenAI Integration](#openai-integration)
   - [Azure API Integration](#azure-api-integration)
   - [Stripe Integration (Optional)](#stripe-integration-optional)
6. [Running the API](#running-the-api)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.x or higher) - [Download Node.js](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download MongoDB](https://www.mongodb.com/try/download/community)
- **Git** (for version control) - [Download Git](https://git-scm.com/downloads)
- **Postman** or similar API testing tool (optional) - [Download Postman](https://www.postman.com/downloads/)

## Local Development Setup

1. **Clone the repository:**

```bash
git clone https://github.com/your-organization/care-pro.git
cd care-pro/node-API
```

2. **Install dependencies:**

```bash
npm install
```

3. **Initialize the project:**

This will create necessary directories and configuration files if they don't exist.

```bash
npm run init
```

## Database Setup

Care-Pro uses MongoDB as its database. You can either install MongoDB locally or use MongoDB Atlas (cloud service).

### Option 1: Local MongoDB

1. **Install MongoDB Community Edition:**
   - [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB service:**
   ```bash
   # For Linux
   sudo systemctl start mongod
   
   # For macOS (if installed via Homebrew)
   brew services start mongodb-community
   
   # For Windows
   # MongoDB should run as a service automatically
   ```

3. **Create a database:**
   ```bash
   mongosh
   > use care-pro
   > exit
   ```

### Option 2: MongoDB Atlas (Cloud Service)

1. **Create a MongoDB Atlas account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Sign up for a free account

2. **Create a new cluster:**
   - Choose the free tier option (M0)
   - Select a cloud provider and region closest to your users
   - Click "Create Cluster"

3. **Configure database access:**
   - Under "Security" > "Database Access", add a new database user
   - Create a username and password (save this for later use in your .env file)
   - Set user privileges to "Read and Write to Any Database"

4. **Configure network access:**
   - Under "Security" > "Network Access", add a new IP address
   - For development, you can allow access from anywhere (0.0.0.0/0)
   - For production, restrict to your server's IP address

5. **Get your connection string:**
   - Go to "Clusters" and click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (it will look like: `mongodb+srv://username:<password>@clustername.mongodb.net/care-pro?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual password in your .env file

## Environment Configuration

1. **Create .env file:**
   Create a `.env` file in the root directory of the project with the following variables:

```
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/care-pro
# Or if using MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:<password>@clustername.mongodb.net/care-pro?retryWrites=true&w=majority

# JWT Settings
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d

# Dojah API Keys
DOJAH_API_KEY=your_dojah_api_key_here
DOJAH_APP_ID=your_dojah_app_id_here
DOJAH_WEBHOOK_SECRET=your_dojah_webhook_secret_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Azure API Integration
AZURE_API_ENDPOINT=https://your-azure-api.azurewebsites.net
AZURE_AUTH_ENDPOINT=https://your-azure-api.azurewebsites.net/api/auth
AZURE_API_KEY=your_azure_api_key_here

# API Key for service-to-service authentication
API_KEY=your_api_key_here

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

2. **Generate secure secret keys:**
   For JWT_SECRET and API_KEY, generate secure random strings:

```bash
# Run this in your terminal to generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Integrations Setup

### Dojah Identity Verification

[Dojah](https://dojah.io/) is used for identity verification in Nigeria and other African countries.

1. **Create a Dojah account:**
   - Go to [Dojah](https://dojah.io/) and sign up for an account
   - Complete the verification process

2. **Get API credentials:**
   - From your Dojah dashboard, navigate to "API Keys"
   - Copy your App ID and API Key
   - Add these values to your .env file as `DOJAH_APP_ID` and `DOJAH_API_KEY`

3. **Configure webhook:**
   - Go to "Webhooks" in the Dojah dashboard
   - Add a new webhook URL: `https://your-api-domain.com/api/webhook/webhook`
   - Copy the webhook secret and add it to your .env file as `DOJAH_WEBHOOK_SECRET`
   - For local testing, use a service like [ngrok](https://ngrok.com/) to expose your local server

### OpenAI Integration

The Care-Pro API uses OpenAI for AI-powered qualification assessments and service matching.

1. **Create an OpenAI account:**
   - Go to [OpenAI](https://platform.openai.com/signup) and sign up
   - Verify your email and complete account setup

2. **Generate an API key:**
   - Go to [API Keys](https://platform.openai.com/account/api-keys)
   - Create a new secret key
   - Copy the key and add it to your .env file as `OPENAI_API_KEY`

3. **Set up billing (required for API usage):**
   - Go to [Billing](https://platform.openai.com/account/billing/overview)
   - Add a payment method
   - Set usage limits to control costs (recommended)

### Azure API Integration

If you're using the Microsoft Azure-hosted authentication API:

1. **Get Azure API details from your team:**
   - API endpoint URL
   - Authentication endpoint URL
   - API key for service-to-service communication

2. **Add these details to your .env file:**
   ```
   AZURE_API_ENDPOINT=https://your-azure-api.azurewebsites.net
   AZURE_AUTH_ENDPOINT=https://your-azure-api.azurewebsites.net/api/auth
   AZURE_API_KEY=your_azure_api_key_here
   ```

3. **Configure the Azure API to communicate with Care-Pro API:**
   - Share your API_KEY with the Azure API team
   - Ensure the Azure API is configured to send verification status updates to your API's integration endpoints

### Stripe Integration (Optional)

If you plan to use payment processing:

1. **Create a Stripe account:**
   - Go to [Stripe](https://dashboard.stripe.com/register) and sign up
   - Complete account verification

2. **Get API keys:**
   - From your Stripe dashboard, go to "Developers" > "API keys"
   - Copy the secret key and add it to your .env file as `STRIPE_SECRET_KEY`

3. **Set up webhook endpoint:**
   - In the Stripe dashboard, go to "Developers" > "Webhooks"
   - Add a new endpoint: `https://your-api-domain.com/api/webhook/stripe`
   - Select events to listen for (payments, subscriptions, etc.)
   - Copy the webhook signing secret and add it to your .env file as `STRIPE_WEBHOOK_SECRET`

## Running the API

1. **Run database migrations (if needed):**

```bash
npm run migrate
```

2. **Start the development server:**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

3. **Verify the API is running:**
   - Open your browser and navigate to `http://localhost:3000` (or whatever port you configured)
   - You should see a welcome message: "Welcome to the Care-Pro API"

## Frontend Integration

To integrate with a frontend application:

### 1. Authentication Flow

```javascript
// Example API call for user login
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store token in localStorage or secure storage
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### 2. Making Authenticated Requests

```javascript
// Example function for making authenticated requests
const authenticatedFetch = async (url, options = {}) => {
  // Get token from storage
  const token = localStorage.getItem('token');
  
  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  
  if (!response.ok) {
    // If token is invalid (401), redirect to login
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
};

// Example usage:
const getUserProfile = () => {
  return authenticatedFetch('http://localhost:3000/api/auth/me');
};
```

### 3. KYC Verification Flow

```javascript
// Step 1: Get assessment questions
const getAssessmentQuestions = async (providerType = 'caregiver') => {
  return authenticatedFetch(`http://localhost:3000/api/kyc/questions?providerType=${providerType}`);
};

// Step 2: Submit assessment responses
const submitAssessment = async (responses) => {
  return authenticatedFetch('http://localhost:3000/api/kyc/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ responses })
  });
};

// Step 3: Evaluate responses
const evaluateResponses = async () => {
  return authenticatedFetch('http://localhost:3000/api/kyc/evaluate', {
    method: 'POST'
  });
};

// Step 4: Verify identity (e.g., BVN)
const verifyBVN = async (bvn) => {
  return authenticatedFetch('http://localhost:3000/api/kyc/verify-bvn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ bvn })
  });
};
```

### 4. Client Service Request Flow

```javascript
// Create a service request
const createServiceRequest = async (serviceRequest) => {
  return authenticatedFetch('http://localhost:3000/api/client-services/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceRequest)
  });
};

// Get matched providers
const getMatchedProviders = async (requestId) => {
  return authenticatedFetch(`http://localhost:3000/api/client-services/matches/${requestId}`);
};

// Select a provider
const selectProvider = async (requestId, providerId) => {
  return authenticatedFetch(`http://localhost:3000/api/client-services/select-provider/${requestId}/${providerId}`, {
    method: 'POST'
  });
};
```

## Testing

1. **Run automated tests:**

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=src/tests/auth.test.js
```

2. **Manual API testing with Postman:**
   - Import the Postman collection from `docs/Care-Pro-API.postman_collection.json` (if available)
   - Or create a new collection with the endpoints described in the README.md

3. **Test scripts:**
   The repository includes test scripts for common functionality:

```bash
# Test client-service matching functionality
node test-client-matching.js

# Test API examples
node test-api-examples.js
```

## Troubleshooting

### Common Issues and Solutions

#### MongoDB Connection Issues

**Issue**: Cannot connect to MongoDB
**Solution**:
- Check if MongoDB service is running
- Verify MongoDB connection string in .env file
- For MongoDB Atlas, ensure your IP is whitelisted in Network Access

#### API Key Issues

**Issue**: "Invalid API key" error when calling external services
**Solution**:
- Verify API keys in .env file
- Check if API keys have required permissions
- Some APIs require activation or verification before use

#### JWT Authentication Issues

**Issue**: "Invalid token" or authentication errors
**Solution**:
- Check JWT_SECRET in .env file
- Verify token is being correctly passed in headers
- Tokens might have expired - get a new one

#### OpenAI API Errors

**Issue**: OpenAI API returning errors
**Solution**:
- Check if OPENAI_API_KEY is valid and has sufficient credits
- Verify usage limits and billing status
- Some models may have rate limits or require specific permissions

### Getting Help

If you encounter issues not covered here:

1. Check the project documentation in the `docs` folder
2. Search for error messages on [Stack Overflow](https://stackoverflow.com/)
3. Consult the official documentation for the specific integration:
   - [Dojah Documentation](https://docs.dojah.io/)
   - [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
   - [MongoDB Documentation](https://docs.mongodb.com/)
   
4. Reach out to the development team through the project's communication channels
