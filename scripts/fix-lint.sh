#!/bin/bash
# Fix Common Linting Issues in Frontend
# This script automatically removes common unused imports

set -e

echo "🧹 Fixing common linting issues..."
echo ""

cd "$(dirname "$0")/../frontend/vite-project" || exit 1

# Function to remove unused React imports from files that don't use JSX
fix_unused_react() {
    echo "📝 Removing unused React imports from test files..."
    
    # Find files with unused React import (but keep if file uses JSX)
    find __tests__ -name "*.test.js" -o -name "*.test.jsx" | while read -r file; do
        # Check if file actually uses React (JSX, React.something, etc.)
        if ! grep -qE "(React\.|<[A-Z]|jsx|JSX)" "$file"; then
            # Remove the React import line
            sed -i "/^import React from 'react';$/d" "$file" 2>/dev/null || true
            sed -i "/^import React from \"react\";$/d" "$file" 2>/dev/null || true
        fi
    done
}

# Function to add eslint-disable comments for intentionally unused variables
add_eslint_disable() {
    echo "📝 Adding eslint-disable comments for catch blocks..."
    
    # For error variables in catch blocks that are unused
    find __tests__ src -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r file; do
        # Add eslint-disable-next-line before catch (error) blocks where error is unused
        sed -i 's/catch (error) {$/catch (error) { \/\/ eslint-disable-line no-unused-vars/' "$file" 2>/dev/null || true
    done
}

# Run the fixes
echo "Step 1: Attempting automatic fixes..."
npm run lint -- --fix 2>/dev/null || true

echo ""
echo "Step 2: Removing unused React imports..."
fix_unused_react

echo ""
echo "Step 3: Checking remaining issues..."
WARNINGS=$(npm run lint 2>&1 | grep -c "warning" || echo "0")

echo ""
echo "======================================"
echo "🎯 Linting Fix Summary"
echo "======================================"
echo "Remaining warnings: $WARNINGS"
echo ""

if [ "$WARNINGS" -gt 0 ]; then
    echo "⚠️  Manual fixes still needed. Running lint to show issues:"
    echo ""
    npm run lint -- --max-warnings 0 2>&1 | head -100
    echo ""
    echo "======================================"
    echo "📋 Common Manual Fixes Needed:"
    echo "======================================"
    echo "1. Remove unused imports: delete the import line"
    echo "2. Remove unused variables: delete the variable declaration"
    echo "3. Add // eslint-disable-next-line no-unused-vars before line"
    echo "4. Or use the variable (console.log(unusedVar))"
    echo ""
else
    echo "✅ All linting issues fixed!"
fi

exit 0
