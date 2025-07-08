#!/bin/bash

# CORS Test Script for CarePro Notification System
# This script tests CORS configuration between frontend and backend

echo "===== CarePro CORS Test Script ====="

# Get the API URL from environment or use default
API_URL=${VITE_API_BASE_URL:-"https://carepro-api20241118153443.azurewebsites.net"}
echo "Using API URL: $API_URL"

# Test 1: Check CORS preflight response
echo -e "\n1. Testing CORS preflight (OPTIONS) request..."

# Use curl to send an OPTIONS request with origin header
ORIGIN="http://localhost:5173"
echo "Testing with Origin: $ORIGIN"

# Use -i to include headers in output
echo "Sending OPTIONS request to $API_URL/api/notifications..."
curl -i -X OPTIONS "$API_URL/api/notifications" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type"

# Test 2: Test WebSocket connection
echo -e "\n\n2. Testing WebSocket CORS headers..."
echo "Note: Full WebSocket testing requires browser. This is a simplified test."

# Just test the HTTP handshake part of WebSocket connection
echo "Sending handshake request to $API_URL/notificationHub..."
curl -i "$API_URL/notificationHub" \
  -H "Origin: $ORIGIN" \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ=="

echo -e "\n===== Test Complete ====="
echo "What to look for:"
echo "- Access-Control-Allow-Origin header should match your origin or be '*'"
echo "- Access-Control-Allow-Methods should include the methods you need"
echo "- Access-Control-Allow-Headers should include the headers you send"
echo "- For WebSockets, a 101 Switching Protocols response is ideal"
echo "- Any CORS errors will be visible in the response headers"
