#!/bin/bash

# Script to test the verification system after applying fixes
# Created: May 21, 2025

echo "Testing verification system..."

# 1. Check if the services are running
node_api_running=$(pgrep -f "node.*app.js" || echo "")
if [ -z "$node_api_running" ]; then
  echo "❌ Node API doesn't appear to be running. Please start it first."
  echo "   cd node-API && npm run start"
  exit 1
fi

# 2. Run the verification API test
echo "Running verification API tests..."
cd /home/labber/Care-pro-new/node-API
node test-verification-api.js

# 3. Provide guidance for manual testing
echo ""
echo "✨ Manual Testing Instructions ✨"
echo "================================"
echo "1. Log in to the Care Pro application as a client user"
echo "2. Navigate to the verification section"
echo "3. Check if your verification status is displayed correctly"
echo "4. Try to complete a verification process if needed"
echo "5. Repeat steps 1-4 as a caregiver user"
echo ""
echo "If all tests pass, the fixes have been successfully applied!"
