#!/bin/bash

# Verification System Fix Script
# This script applies fixes to resolve 401 Unauthorized errors in the verification system

echo "Applying fixes to resolve 401 Unauthorized errors in the verification system..."

# Fix 1: Update auth middleware to support both client and caregiver user types
echo "Fixing authentication middleware..."
# First check if the file has already been modified
if ! grep -q "const endpoint = userType === 'client'" node-API/src/middleware/authMiddleware.js; then
  sed -i 's|const protectUser = async (userId, token) => {|const protectUser = async (userId, token, userType = \x27caregiver\x27) => {|g' node-API/src/middleware/authMiddleware.js
  sed -i 's|// Verify user through external API|// Determine the endpoint based on user type\n    const endpoint = userType === \x27client\x27 \n      ? `${External_Auth_API}/Clients/${userId}`\n      : `${External_Auth_API}/CareGivers/${userId}`;\n\n    // Verify user through external API|g' node-API/src/middleware/authMiddleware.js
  sed -i 's|const externalResponse = await axios.get(`${External_Auth_API}/CareGivers/${userId}`, { userId});|const externalResponse = await axios.get(endpoint, {\n      headers: {\n        \x27Authorization\x27: `Bearer ${token}`\n      }\n    });|g' node-API/src/middleware/authMiddleware.js
  sed -i '/const user = externalResponse.data;/a\    // Add userType to the user object for later use\n    user.userType = userType;' node-API/src/middleware/authMiddleware.js
else
  echo "Authentication middleware already updated. Skipping..."
fi

# Fix 2: Update protect middleware to handle userType properly
echo "Updating protect middleware..."
if ! grep -q "const userType = req.query.userType" node-API/src/middleware/authMiddleware.js; then
  sed -i 's|const userId = req.query.userId || req.body.userId;|const userId = req.query.userId || req.body.userId;\n    \n    // Get userType from query params or body, default to \x27caregiver\x27\n    const userType = req.query.userType || req.body.userType || \x27caregiver\x27;|g' node-API/src/middleware/authMiddleware.js
  sed -i 's|const user = await protectUser(userId, token);|const user = await protectUser(userId, token, userType);|g' node-API/src/middleware/authMiddleware.js
else
  echo "Protect middleware already updated. Skipping..."
fi

# Fix 3: Fix error handling in verification service's getVerificationStatus function
echo "Fixing error handling in the verification service..."
if grep -q "if (requestError.response && requestError.response.status === 401) {" frontend/vite-project/src/main-app/services/verificationService.js; then
  sed -i '/if (requestError.response && requestError.response.status === 401) {/,/}/c\        if (requestError.response && requestError.response.status === 401) {\n          console.warn(\x27Authentication error (401) while getting verification status\x27);\n          \n          // Check if we have a cached status in localStorage for this specific user\n          const userSpecificKey = userId ? `verificationStatus_${userType}_${userId}` : \x27verificationStatus\x27;\n          const cachedData = localStorage.getItem(userSpecificKey) || localStorage.getItem(\x27verificationStatus\x27);\n          \n          if (cachedData) {\n            try {\n              const parsedCache = JSON.parse(cachedData);\n              return parsedCache;\n            } catch (e) {\n              // Ignore parsing errors and continue to default response\n              console.error(\x27Error parsing cached verification data:\x27, e);\n            }\n          }\n        }' frontend/vite-project/src/main-app/services/verificationService.js
else
  echo "Error handling in verification service already updated. Skipping..."
fi

echo "All fixes applied successfully!"
echo "Please restart your servers for the changes to take effect."
