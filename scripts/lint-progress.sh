#!/bin/bash
# Linting Progress Tracker
# Helps you track progress while manually fixing linting issues

cd "$(dirname "$0")/../frontend/vite-project" || exit 1

echo "======================================"
echo "📊 Linting Progress Tracker"
echo "======================================"
echo ""

# Get current warning count
WARNINGS=$(npm run lint 2>&1 | grep -c "warning" || echo "0")

echo "Current warnings: $WARNINGS"
echo ""

if [ "$WARNINGS" -eq 0 ]; then
    echo "🎉 All linting issues fixed!"
    echo ""
    echo "Next step: Run pre-push validation"
    echo "  cd /home/labber/Care-pro-new"
    echo "  ./scripts/pre-push-check.sh"
    exit 0
fi

# Categorize warnings
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Warning Breakdown:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

UNUSED_REACT=$(npm run lint 2>&1 | grep -c "'React' is defined but never used" || echo "0")
UNUSED_WAITFOR=$(npm run lint 2>&1 | grep -c "'waitFor' is defined but never used" || echo "0")
UNUSED_FIREEVENT=$(npm run lint 2>&1 | grep -c "'fireEvent' is defined but never used" || echo "0")
UNUSED_ERROR=$(npm run lint 2>&1 | grep -c "'error' is defined but never used" || echo "0")
UNUSED_VARS=$(npm run lint 2>&1 | grep -c "assigned a value but never used" || echo "0")
OTHER=$(( WARNINGS - UNUSED_REACT - UNUSED_WAITFOR - UNUSED_FIREEVENT - UNUSED_ERROR - UNUSED_VARS ))

echo "  Unused 'React' imports:    $UNUSED_REACT"
echo "  Unused 'waitFor' imports:  $UNUSED_WAITFOR"
echo "  Unused 'fireEvent' imports: $UNUSED_FIREEVENT"
echo "  Unused 'error' variables:  $UNUSED_ERROR"
echo "  Other unused variables:    $UNUSED_VARS"
echo "  Other warnings:            $OTHER"
echo ""

# Show files with most warnings
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Files with Most Warnings (Top 10):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm run lint 2>&1 | grep "^/" | sed 's/^/  /'  | head -10
echo ""

# Progress estimate
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Progress Estimate:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$WARNINGS" -gt 500 ]; then
    echo "  Status: 🔴 Just started (~80% remaining)"
    echo "  Estimated time: 2-3 hours"
elif [ "$WARNINGS" -gt 300 ]; then
    echo "  Status: 🟡 Good progress (~50% remaining)"
    echo "  Estimated time: 1-2 hours"
elif [ "$WARNINGS" -gt 100 ]; then
    echo "  Status: 🟢 Almost there (~20% remaining)"
    echo "  Estimated time: 30-60 minutes"
else
    echo "  Status: 🟢 Final stretch! (<10% remaining)"
    echo "  Estimated time: 10-20 minutes"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Quick Fix Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Save this output to a file:"
echo "  npm run lint > lint-report.txt"
echo ""
echo "Fix unused React imports (VSCode):"
echo "  1. Press Ctrl+Shift+F"
echo "  2. Search: import React from 'react';"
echo "  3. In files: __tests__/**"
echo "  4. Review and delete where not used"
echo ""
echo "Check progress anytime:"
echo "  ./scripts/lint-progress.sh"
echo ""
echo "Validate when done:"
echo "  npm run lint -- --max-warnings 0"
echo ""
