# CarePro - Healthcare Professional Connection Platform

## Overview
CarePro is a comprehensive platform designed to connect qualified healthcare professionals (particularly caregivers) with clients needing care services. The platform streamlines caregiver verification, qualification assessment, and service matching through AI-powered systems while facilitating secure real-time communication between clients and providers.

### Core Features
- **Healthcare Professional Verification & Qualification:** AI-powered assessment system that evaluates healthcare providers' qualifications through dynamic questionnaires
- **Know Your Customer (KYC) Verification:** Secure identity verification for both caregivers and clients using Dojah
- **Real-time Messaging:** SignalR-based chat system for instant communication between clients and caregivers
- **Service Matching System:** AI-powered matching of clients with appropriate caregivers based on needs, preferences and location
- **Gig Management:** Complete platform for caregivers to create, manage and promote their services
- **Client Care Management:** Tools for clients to define care needs, find matching providers, and manage service requests

### Project Structure
The project is structured into three key components:
1. **frontend** - React-based client application built with Vite
2. **node-API** - Node.js middleware for verification, assessment, and service matching
3. **backend** - C# ASP.NET Core backend services with Azure SQL and MongoDB databases

---

## Technology Stack

### Frontend
- **Framework:** React 18 with Vite build tool
- **State Management:** React Context API for global state management
- **Routing:** React Router v6 for navigation
- **Styling:** SCSS for component styling
- **Real-time Communication:** SignalR for chat functionality
- **CMS Integration:** Contentful for blog content management
- **UI Components:** Custom components with responsive design
- **HTTP Client:** Axios for API requests

### Backend & APIs
- **Core Backend:** ASP.NET Core with C# (.NET 6)
- **Database:** 
  - Azure SQL Database for user data
  - MongoDB for service and gig data
- **Authentication:** JWT-based authentication with role-based authorization
- **Real-time Messaging:** SignalR Hub implementation on Azure
- **Middleware API:** Node.js Express server for:
  - Identity verification through Dojah API
  - AI-powered assessment and qualification
  - Service request analysis and matching
- **API Documentation:** Swagger/OpenAPI for API documentation

### DevOps & Deployment
- **Source Control:** GitHub
- **Frontend Hosting:** GitHub Pages
- **API Hosting:** Azure App Service
- **Storage:** Azure Blob Storage for media files

## Getting Started

### Cloning the Repository
1. Copy the repository HTTPS link.
2. Open your terminal and run the following command to clone the repository:
   ```bash
   git clone <repository-https-link>
   ```

### Setting Up the Frontend
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   cd vite-project
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```

### Setting Up the Node.js API (Optional)
1. Navigate to the `node-API` folder:
   ```bash
   cd node-API
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with required environment variables (see `.env.example`)

### Running the Projects Locally
To start the Vite development server:
```bash
cd frontend/vite-project
npm run dev
```

To start the Node.js API server:
```bash
cd node-API
npm start
```

Once the frontend server is running, open your browser and visit:
```
http://localhost:5178
```

---

## Key Features in Detail

### User Roles
- **Caregivers:** Healthcare professionals offering care services
- **Clients:** Users seeking healthcare services
- **Administrators:** Platform managers with oversight capabilities

### Caregiver Features
- Professional profile creation with qualifications and certifications
- Service creation with customizable pricing and details
- Availability management
- Real-time chat with potential and current clients
- Service request management and scheduling
- Verification and qualification assessment process

### Client Features
- Personalized care needs profile
- AI-powered caregiver matching
- Service request creation and management
- Real-time chat with caregivers
- Provider reviews and ratings
- Secure payment processing

### Administrative Features
- User verification management
- Content management
- Service quality monitoring
- Analytics and reporting

## Contribution Guidelines

### Creating a Branch
To start working on the project, create a new branch by running:
```bash
git checkout -b [branchName]
```
**Branch Naming Convention**
- Use the format: `firstname_branchname`
- Example: If your name is Olu and you're working on the message component, your branch name should be:
  ```
  olu_messageComponent
  ```

### Pushing Changes and Making a Pull Request
1. Once you've completed your work on the branch, push your changes to the remote repository:
   ```bash
   git push origin [branchName]
   ```
2. Create a Pull Request (PR) to the `dev` branch.
3. Wait for PR approvals before merging.

---

## Code Quality
- **Comment Your Code**: Ensure your code is well-commented to enhance readability and maintainability.
- **Follow Styling Guidelines**: Maintain consistent code formatting.
- **Write Unit Tests**: When possible, include tests for your code.
- **Review Before Submitting**: Self-review your code before creating pull requests.

---

## Developer Notes

### SignalR Chat System Implementation
The frontend's messaging system is built using SignalR for real-time communication between clients and caregivers. Key components include:

1. **MessageContext.jsx**: Provides the chat context and state management for the messaging system
2. **signalRChatService.js**: Handles the connection to the SignalR ChatHub on the backend
3. **Messages.jsx**: The main messaging UI component that consumes the MessageContext

The frontend is designed to gracefully handle cases where the backend SignalR hub isn't fully implemented yet. Specifically:

- It handles the case where the `RegisterConnection` method isn't available on the server
- It implements proper cleanup function handling to prevent "cleanup is not a function" errors
- It includes fallback mechanisms for connection failures and offline mode

Note for backend developers: Please implement the ChatHub according to the specifications in `/backend/SignalR-Chat-Implementation-Guide.md` to ensure compatibility with the frontend.

---

Thank you for contributing to the CarePro project! 🚀