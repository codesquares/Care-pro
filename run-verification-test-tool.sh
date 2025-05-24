#!/bin/bash

echo "Opening verification test tool..."
echo "Please ensure the Node API server is running with: npm run start"

# Navigate to the public folder
cd "$(dirname "$0")/frontend/vite-project"

# Start a simple HTTP server for testing
echo "Starting local server..."
echo "Open your browser and navigate to http://localhost:8000/public/verification-test.html"
npx serve -s -l 8000


