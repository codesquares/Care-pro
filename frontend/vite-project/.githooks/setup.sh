#!/bin/bash

# Frontend Git Hooks Setup Script
# This script configures Git to use the custom pre-commit hooks for the frontend

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the frontend project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}🏗️  Setting up Git hooks for Frontend: $PROJECT_DIR${NC}"

# Change to project directory
cd "$PROJECT_DIR"

# Configure Git to use the custom hooks directory
echo -e "${YELLOW}📋 Configuring Git to use custom hooks directory...${NC}"
git config core.hooksPath .githooks

# Make sure the hook is executable
chmod +x .githooks/pre-commit

echo -e "${GREEN}✅ Frontend Git hooks setup complete!${NC}"
echo
echo -e "${BLUE}📋 What was configured:${NC}"
echo "   • Git hooks directory: $(pwd)/.githooks"
echo "   • Pre-commit hook: $(pwd)/.githooks/pre-commit"
echo
echo -e "${BLUE}🎯 The pre-commit hook will now run these checks before every commit:${NC}"
echo "   • ESLint code quality check"
echo "   • Jest unit/integration tests"
echo "   • Vite build verification"
echo "   • npm security audit"
echo "   • Dependency verification"
echo "   • TypeScript type checking (if applicable)"
echo
echo -e "${YELLOW}💡 To test the hook manually, run: ./.githooks/pre-commit${NC}"
echo
