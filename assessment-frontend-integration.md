# Assessment Integration Guide

This document outlines the integration of the assessment system with the frontend assessment page.

## Integration Components

### 1. Node.js API Controllers

We've created an `assessmentController.js` that serves as an intermediary between the frontend and the C# backend. The controller:
- Forwards assessment question requests to the C# backend
- Submits completed assessments to the C# backend
- Retrieves assessment history and details

### 2. API Routes

We've updated the assessment routes in `assessmentRoutes.js` to use our new controller, providing endpoints for:
- Getting questions: `GET /api/assessment/questions/:userType`
- Submitting assessments: `POST /api/assessment/submit`
- Retrieving history: `GET /api/assessment/history/:userId`
- Getting assessment details: `GET /api/assessment/:id`

### 3. Frontend Integration

We've updated the frontend's `assessmentService.js` to:
- Use the standardized API response format
- Submit assessments in the format expected by the API
- Handle API errors properly

## Testing the Integration

### Prerequisites

1. Ensure the C# backend is running and accessible
2. Make sure your `.env` file has the following variables:
   - `API_URL` - URL of the C# backend API (e.g., `http://localhost:5145`)
   - `TEST_JWT_TOKEN` - A valid JWT token for testing

### Testing Steps

1. Run the Node.js API:
   ```bash
   cd node-API
   npm start
   ```

2. Run the integration test:
   ```bash
   node src/scripts/test-assessment-integration.js
   ```

3. Test the frontend by navigating to the assessment page:
   - Log in to the application
   - Navigate to the caregiver profile
   - Start an assessment

## Troubleshooting

### Common Issues

1. **Cannot connect to C# backend**
   - Check that the C# backend is running
   - Verify the `API_URL` in `.env` is correct

2. **Authentication errors**
   - Ensure your JWT token is valid
   - Check that the token has the necessary permissions

3. **Invalid question format**
   - Verify the C# backend is returning questions in the expected format

4. **Assessment submission failures**
   - Check that the submission format matches what the C# backend expects
   - Look for validation errors in the C# logs

### Logs

- Integration test results are stored in `node-API/logs/assessment-integration-test-result.json`
- Server logs provide detailed error information

## Next Steps

1. Add more comprehensive error handling
2. Implement caching to improve performance
3. Add more tests for edge cases
4. Ensure proper authentication and authorization
