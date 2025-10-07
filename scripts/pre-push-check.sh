#!/bin/bash
# Pre-Push Validation Script
# Runs all checks that will be enforced in the staging CI/CD pipeline
# Run this before pushing to staging branch to ensure deployment won't be blocked

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo "======================================"
echo "🛡️  PRE-PUSH VALIDATION CHECKS"
echo "======================================"
echo "This script validates your code before pushing to staging"
echo "All these checks MUST pass or staging deployment will be BLOCKED"
echo ""

# Function to run a check
run_check() {
    local check_name="$1"
    local command="$2"
    local working_dir="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}CHECK $TOTAL_CHECKS: $check_name${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -n "$working_dir" ]; then
        cd "$PROJECT_ROOT/$working_dir" || exit 1
    fi
    
    if eval "$command"; then
        echo -e "${GREEN}✅ PASSED: $check_name${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED: $check_name${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Track overall status
OVERALL_STATUS=0

echo "🔍 Starting validation checks..."
echo ""

# =============================================================================
# FRONTEND CHECKS
# =============================================================================

echo ""
echo "╔════════════════════════════════════════╗"
echo "║     FRONTEND VALIDATION CHECKS         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check 1: Frontend Dependencies Install
run_check "Frontend - Install Dependencies" \
    "npm ci --quiet" \
    "frontend/vite-project" || OVERALL_STATUS=1

# Check 2: Frontend Security Audit
run_check "Frontend - Security Audit (BLOCKING)" \
    "npm audit --audit-level=moderate" \
    "frontend/vite-project" || OVERALL_STATUS=1

# Check 3: Frontend Linting (STRICT - Zero Warnings)
run_check "Frontend - Linting (ZERO WARNINGS REQUIRED)" \
    "npm run lint -- --max-warnings 0" \
    "frontend/vite-project" || OVERALL_STATUS=1

# Check 4: Frontend Tests
run_check "Frontend - Unit Tests" \
    "npm run test:coverage" \
    "frontend/vite-project" || OVERALL_STATUS=1

# Check 5: Frontend Build
run_check "Frontend - Production Build" \
    "npm run build" \
    "frontend/vite-project" || OVERALL_STATUS=1

# =============================================================================
# NODE-API CHECKS
# =============================================================================

echo ""
echo "╔════════════════════════════════════════╗"
echo "║      NODE-API VALIDATION CHECKS        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check 6: Node-API Dependencies Install
run_check "Node-API - Install Dependencies" \
    "npm ci --quiet" \
    "node-API" || OVERALL_STATUS=1

# Check 7: Node-API Security Audit
run_check "Node-API - Security Audit (BLOCKING)" \
    "npm audit --audit-level=moderate" \
    "node-API" || OVERALL_STATUS=1

# Check 8: Node-API Security Tests
run_check "Node-API - Security Tests (MANDATORY)" \
    "npm run test:security" \
    "node-API" || OVERALL_STATUS=1

# Check 9: Node-API Unit Tests
run_check "Node-API - Unit Tests (STRICT)" \
    "npm run test:unit" \
    "node-API" || OVERALL_STATUS=1

# Check 10: Node-API Integration Tests
run_check "Node-API - Integration Tests (STRICT)" \
    "npm run test:integration" \
    "node-API" || OVERALL_STATUS=1

# Check 11: Node-API Coverage with Thresholds
run_check "Node-API - Coverage Report (THRESHOLDS)" \
    "npm run test:coverage" \
    "node-API" || OVERALL_STATUS=1

# Check 12: Node-API Server Health Check
cd "$PROJECT_ROOT/node-API" || exit 1
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}CHECK 12: Node-API - Server Health Check (BLOCKING)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Start server in background
timeout 10s npm start > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

# Check health endpoint
if curl -f http://localhost:3000/health > /dev/null 2>&1 || curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: Server health check${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    kill $SERVER_PID 2>/dev/null || true
else
    echo -e "${RED}❌ FAILED: Server health check${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    OVERALL_STATUS=1
    kill $SERVER_PID 2>/dev/null || true
fi

# =============================================================================
# FINAL SUMMARY
# =============================================================================

echo ""
echo ""
echo "======================================"
echo "📊 VALIDATION SUMMARY"
echo "======================================"
echo ""
echo "Total Checks Run:    $TOTAL_CHECKS"
echo -e "${GREEN}Checks Passed:       $PASSED_CHECKS${NC}"
if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${RED}Checks Failed:       $FAILED_CHECKS${NC}"
else
    echo "Checks Failed:       $FAILED_CHECKS"
fi
echo ""

if [ $OVERALL_STATUS -eq 0 ]; then
    echo "╔════════════════════════════════════════╗"
    echo -e "║ ${GREEN}✅ ALL CHECKS PASSED!${NC}                  ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "🚀 Your code is ready to push to staging!"
    echo ""
    echo "Next steps:"
    echo "  1. git add ."
    echo "  2. git commit -m 'Your message'"
    echo "  3. git push origin staging"
    echo ""
else
    echo "╔════════════════════════════════════════╗"
    echo -e "║ ${RED}❌ VALIDATION FAILED!${NC}                  ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo -e "${RED}⛔ DO NOT PUSH TO STAGING!${NC}"
    echo ""
    echo "Your push to staging will be BLOCKED by CI/CD."
    echo ""
    echo "Please fix the failed checks above before pushing."
    echo ""
    echo "Common fixes:"
    echo "  • Linting: Run 'npm run lint -- --fix' in frontend/vite-project"
    echo "  • Security: Run 'npm audit fix' in affected directory"
    echo "  • Tests: Check test output and fix failing tests"
    echo "  • Coverage: Add tests to increase coverage"
    echo ""
    echo "Re-run this script after fixes:"
    echo "  ./scripts/pre-push-check.sh"
    echo ""
fi

exit $OVERALL_STATUS
