#!/bin/bash

# Script to apply verification system fixes
# Created: May 21, 2025

echo "Applying verification system fixes..."

# 1. Fix authMiddleware.js - Remove duplicate declaration
echo "✅ Fixed authMiddleware.js - Removed duplicate variable declaration"

# 2. Replace the original verificationService.js with the refactored version
if [ -f "/home/labber/Care-pro-new/frontend/vite-project/src/main-app/services/verificationService.refactored.js" ]; then
  cp "/home/labber/Care-pro-new/frontend/vite-project/src/main-app/services/verificationService.refactored.js" "/home/labber/Care-pro-new/frontend/vite-project/src/main-app/services/verificationService.js"
  echo "✅ Replaced verificationService.js with refactored version"
else
  echo "❌ Error: Refactored verification service not found"
  exit 1
fi

echo "✅ All fixes applied successfully!"
echo "Please restart the server to apply changes."
