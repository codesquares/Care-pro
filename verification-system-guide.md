# Verification System Implementation Guide

This guide explains the implementation of the Dojah API-based verification system in CarePro.

## Verification Requirements

1. **BVN Verification**:
   - If a user chooses BVN verification, they must also complete ID + selfie verification
   - Both steps are required for complete verification

2. **NIN Verification**:
   - If a user chooses NIN verification, they must use NIN as their ID and complete selfie verification
   - Both steps are required for complete verification

3. **ID + Selfie Only**:
   - Users cannot choose ID + selfie verification alone without BVN or NIN
   - This option has been disabled in the UI

4. **Development Testing**:
   - The system supports testing in development using test credentials:
     - Test BVN: 22222222222
     - Test NIN: 70123456789

5. **User Validation**:
   - The system validates that verification data matches user profiles stored in localStorage
   - User's first name and last name must match verification data

## Implementation Details

### Backend (Node.js API)

1. **Verification Endpoints**:
   - `/api/kyc/verify-bvn` - Verify BVN number
   - `/api/kyc/verify-nin` - Verify NIN number
   - `/api/kyc/verify-id-selfie` - Verify ID and selfie
   - `/api/kyc/verify-bvn-with-id-selfie` - Combined BVN + ID + selfie verification
   - `/api/kyc/verify-nin-with-selfie` - Combined NIN + selfie verification
   - `/api/kyc/status` - Get verification status

2. **Dojah Service**:
   - Handles communication with Dojah API
   - Provides mock responses in development mode
   - Supports all verification methods

### Frontend (React)

1. **Verification Service**:
   - `verifyBVN` - Verify BVN number
   - `verifyNIN` - Verify NIN number
   - `verifyBVNComplete` - Complete BVN + ID + selfie verification
   - `verifyNINComplete` - Complete NIN + selfie verification
   - `getVerificationStatus` - Get verification status

2. **Verification Page**:
   - Multi-step verification process
   - BVN verification followed by ID + selfie
   - NIN verification followed by selfie
   - Error handling for 404 and other errors

## Testing the System

1. **Run Backend**:
   ```
   cd node-API
   npm run dev
   ```

2. **Run Frontend**:
   ```
   cd frontend/vite-project
   npm run dev
   ```

3. **Test Verification API**:
   ```
   cd node-API
   node test-verification-system.js
   ```

4. **Manual Testing Steps**:
   1. Login as a client
   2. Click "Verify Account" in the dropdown menu
   3. Choose BVN or NIN verification method
   4. Complete the verification process
   5. Check verification status in profile

## Troubleshooting

1. **404 Authentication Errors**:
   - Check if the user is authenticated with a valid token
   - Verify that the user ID is being correctly passed in the request
   - Ensure the API is running and accessible

2. **Verification Failures**:
   - Check browser console for detailed error messages
   - Verify that test credentials are being used in development mode
   - Check if user profile data matches verification data

3. **Loading/Status Issues**:
   - Clear browser cache and localStorage
   - Restart the polling process by refreshing the page
   - Check network requests for API errors
