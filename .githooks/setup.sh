#!/bin/bash

# Root-Level Git Hooks Setup Script - CarePro Monorepo
# This script configures Git to use the root-level pre-commit hook for the entire repository

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}🏗️  Setting up Root-Level Git hooks for CarePro Monorepo: $PROJECT_ROOT${NC}"

# Change to project root directory
cd "$PROJECT_ROOT"

# Configure Git to use the custom hooks directory at the root level
echo -e "${YELLOW}📋 Configuring Git to use root-level custom hooks directory...${NC}"
git config core.hooksPath .githooks

# Make sure the hook is executable
chmod +x .githooks/pre-commit

echo -e "${GREEN}✅ Root-level Git hooks setup complete!${NC}"
echo
echo -e "${BLUE}📋 What was configured:${NC}"
echo "   • Git hooks directory: $PROJECT_ROOT/.githooks"
echo "   • Root pre-commit hook: $PROJECT_ROOT/.githooks/pre-commit"
echo
echo -e "${BLUE}🎯 The root pre-commit hook will now intelligently run checks based on changed files:${NC}"
echo "   • Frontend changes → Frontend validation (build, tests, linting, security)"
echo "   • Node-API changes → API validation (tests, linting, security)"  
echo "   • Backend changes → Backend validation (when .NET hook is created)"
echo "   • Root changes → Documentation and config validation"
echo
echo -e "${BLUE}💡 How it works:${NC}"
echo "   1. Detects which files you're committing"
echo "   2. Runs appropriate project-specific checks"
echo "   3. Only runs checks for projects that have changes"
echo "   4. Maintains your workflow of committing from root directory"
echo
echo -e "${YELLOW}💡 To test the hook manually, run: ./.githooks/pre-commit${NC}"
echo -e "${YELLOW}💡 To test with actual commit: make changes, then 'git add .' and 'git commit'${NC}"
echo
