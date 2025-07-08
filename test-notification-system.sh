#!/bin/bash

# Test script for the notification system
# This script will test both the WebSocket connection and the API endpoints

echo "===== CarePro Notification System Test ====="
echo "This script will test the notification system connectivity"

# Get the API URL from environment or use default
API_URL=${VITE_API_BASE_URL:-"https://carepro-api20241118153443.azurewebsites.net"}
echo "Using API URL: $API_URL"

# Test 1: Check if the API server is reachable
echo -e "\n1. Testing API server connectivity..."
curl -s -o /dev/null -w "%{http_code}" $API_URL > /tmp/status.txt
STATUS=$(cat /tmp/status.txt)

if [[ "$STATUS" == "200" || "$STATUS" == "401" || "$STATUS" == "302" ]]; then
  echo "✅ API server is reachable! (Status: $STATUS)"
else
  echo "❌ API server is not reachable. Status: $STATUS"
  echo "Check if the server is running and the URL is correct."
fi

# Test 2: Test the notifications endpoint
echo -e "\n2. Testing /api/notifications endpoint..."
echo "Please enter your JWT token (from localStorage.token in browser):"
read TOKEN

if [[ -z "$TOKEN" ]]; then
  echo "❌ No token provided. Skipping this test."
else
  NOTIFICATION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" $API_URL/api/notifications)
  
  if [[ "$NOTIFICATION_STATUS" == "200" ]]; then
    echo "✅ Successfully accessed notifications endpoint!"
    echo "Getting sample notification data:"
    curl -s -H "Authorization: Bearer $TOKEN" $API_URL/api/notifications | head -n 30
  elif [[ "$NOTIFICATION_STATUS" == "401" ]]; then
    echo "❌ Unauthorized access to notifications endpoint. Check if token is valid."
  else
    echo "❌ Failed to access notifications endpoint. Status: $NOTIFICATION_STATUS"
    echo "Response body:"
    curl -s -H "Authorization: Bearer $TOKEN" $API_URL/api/notifications
  fi
fi

# Test 3: Check WebSocket endpoint
echo -e "\n3. Testing WebSocket connectivity..."
echo "WebSocket endpoint: $API_URL/notificationHub"

# Use ncat/nc if available to test socket connection
if command -v nc &> /dev/null || command -v ncat &> /dev/null; then
  NCAT_CMD="nc"
  if ! command -v nc &> /dev/null; then
    NCAT_CMD="ncat"
  fi
  
  echo "Testing socket connection using $NCAT_CMD (timeout 5s)..."
  
  # Extract host and port from URL
  HOST=$(echo $API_URL | sed -e 's|^[^/]*//||' -e 's|/.*$||' | cut -d: -f1)
  PORT=$(echo $API_URL | grep -oP ':\K\d+' || echo 443)
  
  # Test socket connection
  $NCAT_CMD -z -v -w5 $HOST $PORT 2>&1 | grep -q "Connected" && \
    echo "✅ Socket connection successful to $HOST:$PORT" || \
    echo "❌ Socket connection failed to $HOST:$PORT"
else
  echo "⚠️ nc/ncat not found. Cannot test socket connection."
  echo "To test WebSocket connection, try opening the app in the browser and check the developer console."
fi

echo -e "\n===== Test Complete ====="
echo "If any tests failed, consider the following actions:"
echo "1. Check if the API server is running and accessible"
echo "2. Verify your token is valid and not expired"
echo "3. Check the CORS configuration on the server"
echo "4. Ensure the notification endpoint is properly implemented"
echo "5. Look for any firewall or network issues blocking WebSocket connections"
