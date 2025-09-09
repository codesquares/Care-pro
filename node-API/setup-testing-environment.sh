#!/bin/bash

# Setup script for Care-Pro Node-API Testing Environment
# This script installs dependencies and configures the testing environment

set -e

echo "🚀 Setting up Care-Pro Node-API Testing Environment..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the node-API directory."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Recommended Node.js version check
if ! node -e "process.exit(process.version.slice(1).split('.')[0] >= 16 ? 0 : 1)" 2>/dev/null; then
    echo "⚠️  Warning: Node.js 16 or higher is recommended for optimal testing performance"
fi

echo ""
echo "📦 Installing Testing Dependencies..."
echo "====================================="

# Install all dependencies including dev dependencies
npm install

echo ""
echo "🔧 Setting up Git Hooks..."
echo "=========================="

# Make the pre-commit hook executable
if [ -f ".githooks/pre-commit" ]; then
    chmod +x .githooks/pre-commit
    
    # Configure git to use our custom hooks directory
    git config core.hooksPath .githooks
    echo "✅ Pre-commit hook configured"
else
    echo "⚠️  Pre-commit hook file not found, skipping..."
fi

echo ""
echo "🧪 Running Initial Test Verification..."
echo "======================================"

# Create a simple test to verify the setup
cat > test-setup-verification.js << 'EOF'
// Quick verification that test environment is working
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying test environment setup...');

// Check if Jest config exists
if (fs.existsSync('jest.config.js')) {
    console.log('✅ Jest configuration found');
} else {
    console.log('❌ Jest configuration missing');
    process.exit(1);
}

// Check if test directories exist
const testDirs = ['__tests__', '__tests__/unit', '__tests__/integration', '__tests__/security'];
for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
        console.log(`✅ ${dir} directory found`);
    } else {
        console.log(`❌ ${dir} directory missing`);
        process.exit(1);
    }
}

// Check if test utilities exist
if (fs.existsSync('test-utils/setup.js')) {
    console.log('✅ Test utilities found');
} else {
    console.log('❌ Test utilities missing');
    process.exit(1);
}

console.log('🎉 Test environment setup verification complete!');
EOF

node test-setup-verification.js && rm test-setup-verification.js

echo ""
echo "🔒 Running Security Test Verification..."
echo "======================================="

# Run security tests to make sure they work
if npm run test:security > /dev/null 2>&1; then
    echo "✅ Security tests are working correctly"
else
    echo "⚠️  Security tests need attention - check the implementation"
fi

echo ""
echo "📊 Testing Coverage Configuration..."
echo "===================================="

# Verify coverage thresholds
if npm run test:coverage -- --passWithNoTests > /dev/null 2>&1; then
    echo "✅ Coverage configuration is working"
else
    echo "⚠️  Coverage configuration may need adjustment"
fi

echo ""
echo "🎯 Quick Test Run..."
echo "==================="

# Run a quick test to ensure everything is working
if npm run test:unit -- --passWithNoTests > /dev/null 2>&1; then
    echo "✅ Unit test framework is working"
else
    echo "⚠️  Unit test framework needs attention"
fi

echo ""
echo "📋 Environment Summary"
echo "======================"

echo "Node.js Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "Jest Version: $(npx jest --version 2>/dev/null || echo 'Not installed')"

# Check if all required dependencies are installed
echo ""
echo "📦 Dependency Check:"
REQUIRED_DEPS=("jest" "supertest" "sinon" "nock")
for dep in "${REQUIRED_DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        VERSION=$(npm list "$dep" 2>/dev/null | grep "$dep" | head -1 | sed 's/.*@//')
        echo "✅ $dep: $VERSION"
    else
        echo "❌ $dep: Not installed"
    fi
done

echo ""
echo "🚀 Setup Complete!"
echo "=================="
echo ""
echo "✅ Testing environment is ready!"
echo ""
echo "🎯 Next Steps:"
echo "1. Run mandatory tests: npm run test:mandatory"
echo "2. Check coverage: npm run test:coverage"
echo "3. Run security tests: npm run test:security"
echo "4. Set up CI/CD pipeline with the provided GitHub Actions workflow"
echo ""
echo "📚 Available Commands:"
echo "  npm run test              # Run all tests"
echo "  npm run test:watch        # Run tests in watch mode"
echo "  npm run test:coverage     # Generate coverage report"
echo "  npm run test:unit         # Run unit tests only"
echo "  npm run test:integration  # Run integration tests only"
echo "  npm run test:security     # Run security tests only"
echo "  npm run test:mandatory    # Run mandatory tests for CI/CD"
echo "  npm run test:ci           # Run full CI test suite"
echo ""
echo "🔒 Security Notes:"
echo "  - All security tests MUST pass before production deployment"
echo "  - Coverage thresholds are enforced (85% global, 95% for auth controller)"
echo "  - Pre-commit hooks will run mandatory tests automatically"
echo ""
echo "📖 Documentation:"
echo "  - See MANDATORY_TESTS.md for complete testing requirements"
echo "  - Check NODE_API_BACKEND_ANALYSIS.md for architecture details"
echo ""
echo "🎉 Happy Testing!"
