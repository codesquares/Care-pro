# Forgot Password Implementation

## Overview
This implementation provides a complete forgot password flow for both clients and caregivers in the Care-pro application.

## Features Implemented

### 1. Forgot Password Request Page
- **Route**: `/forgot-password`
- **Component**: `ForgotPasswordPage.jsx`
- **Functionality**: 
  - Email input form
  - Email validation
  - Success state showing confirmation message
  - Loading states during API calls

### 2. Password Reset Page
- **Route**: `/forgot-password?token=RESET_TOKEN&email=USER_EMAIL`
- **Component**: Same `ForgotPasswordPage.jsx` (conditional rendering)
- **Functionality**:
  - New password input
  - Confirm password input
  - Password strength indicator
  - Token validation (when API is connected)

### 3. Navigation Updates
- Updated `LoginPage.jsx` to use React Router `Link` components
- Added forgot password route to `App.jsx`
- Added route to unprotected routes list

### 4. Authentication Service
- Extended `auth.js` service with forgot password functions
- Added `forgotPassword(email)` function
- Added `resetPassword(email, token, newPassword)` function

## API Integration (Currently Commented Out)

The implementation is ready for API integration. The following endpoints are expected:

### Forgot Password Request
```javascript
POST ${config.BASE_URL}/Authentications/ForgotPassword
Body: { email: "user@example.com" }
Response: { message: "Reset email sent successfully" }
```

### Reset Password
```javascript
POST ${config.BASE_URL}/Authentications/ResetPassword
Body: { 
  email: "user@example.com", 
  token: "reset-token-from-email", 
  newPassword: "new-password" 
}
Response: { message: "Password reset successfully" }
```

## Files Created/Modified

### New Files:
- `src/main-app/pages/ForgotPasswordPage.jsx`
- `src/styles/main-app/pages/ForgotPasswordPage.scss`

### Modified Files:
- `src/App.jsx` - Added route and import
- `src/main-app/pages/LoginPage.jsx` - Updated links to use React Router
- `src/main-app/services/auth.js` - Added forgot password functions

## Usage Flow

1. **User clicks "Forgot password?" on login page**
   - Navigates to `/forgot-password`

2. **User enters email and submits**
   - Shows loading state
   - Shows success message (currently simulated)
   - In production: API sends reset email with token

3. **User clicks reset link in email**
   - Link format: `/forgot-password?token=TOKEN&email=EMAIL`
   - Shows password reset form

4. **User enters new password**
   - Password strength validation
   - Confirm password matching
   - Shows loading state during reset
   - Redirects to login on success

## Styling
- Follows existing design patterns from `RegisterPage.scss`
- Responsive design for mobile and desktop
- Password strength indicator with color coding
- Error and success state styling
- Dark mode support (for future use)

## Security Features
- Email validation
- Password strength requirements (8+ characters)
- Token-based reset (when API is connected)
- Automatic redirect after successful reset
- Clear error messages

## To Enable API Integration

1. Uncomment the API calls in `src/main-app/services/auth.js`
2. Ensure backend endpoints are available:
   - `/Authentications/ForgotPassword`
   - `/Authentications/ResetPassword`
3. Update email template to include correct reset link format
4. Test with real email delivery service

## Testing

Currently uses simulated API responses with 1.5-second delays to mimic real API behavior. To test:

1. Navigate to `/login`
2. Click "Forgot password?"
3. Enter any valid email format
4. Test success flow
5. Test direct access to reset form: `/forgot-password?token=test&email=test@example.com`

## Error Handling

- Email format validation
- Password strength requirements
- Password confirmation matching
- API error message display
- Network error handling
- Toast notifications for user feedback
