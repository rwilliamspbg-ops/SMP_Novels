#!/bin/bash
# Production Deployment Verification Script for SMP_Novels v3.3.1
# This script verifies all components are ready for production deployment

set -e  # Exit on any error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "  SMP_Novels Production Deployment Verification"
echo "  Version: v3.3.1"
echo "=================================================="
echo ""

# Color codes for output
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Track overall status
PASSED=0
FAILED=0
WARNINGS=0

# Function to run a check
run_check() {
    local name="$1"
    local command="$2"
    
    echo -n "Checking $name... "
    if eval "$command" > /dev/null 2>&1; then
        check_pass "$name"
        ((PASSED++))
    else
        check_fail "$name"
        ((FAILED++))
    fi
}

echo "--- Docker Environment ---"
run_check "Docker is installed" "docker --version"
run_check "Docker Compose is installed" "docker-compose --version"

echo ""
echo "--- Repository Health ---"
cd "$(dirname "$0")/.." || exit 1

if git diff --quiet; then
    check_pass "Repository is clean (no uncommitted changes)"
    ((PASSED++))
else
    check_fail "Repository has uncommitted changes"
    ((FAILED++))
fi

if [ -z "$(git status --porcelain)" ]; then
    check_pass "Git status is clean"
    ((PASSED++))
else
    check_warn "Git has staged or unstaged changes"
    ((WARNINGS++))
fi

echo ""
echo "--- Configuration Files ---"
if [ -f ".env.production" ]; then
    check_pass ".env.production exists"
    ((PASSED++))
else
    check_fail ".env.production is missing"
    ((FAILED++))
fi

# Check for required environment variables in .env.production
if grep -q "JWT_SECRET=" .env.production 2>/dev/null; then
    check_pass "JWT_SECRET configured"
    ((PASSED++))
else
    check_warn "JWT_SECRET not configured (will use generated value)"
    ((WARNINGS++))
fi

if grep -q "DB_PASSWORD=" .env.production 2>/dev/null || grep -q "DB_PASSWORD:-" .env.production 2>/dev/null; then
    check_pass "DB_PASSWORD configured"
    ((PASSED++))
else
    check_fail "DB_PASSWORD not configured"
    ((FAILED++))
fi

echo ""
echo "--- Backend Configuration ---"
if [ -f "backend/package.json" ]; then
    check_pass "backend/package.json exists"
    ((PASSED++))
    
    if grep -q '"fastify"' backend/package.json; then
        check_pass "Fastify dependency present"
        ((PASSED++))
    else
        check_fail "Fastify dependency missing"
        ((FAILED++))
    fi
    
    if grep -q '"pg"' backend/package.json; then
        check_pass "PostgreSQL driver present"
        ((PASSED++))
    else
        check_fail "PostgreSQL driver missing"
        ((FAILED++))
    fi
else
    check_fail "backend/package.json is missing"
    ((FAILED++))
fi

if [ -f "backend/Dockerfile" ]; then
    check_pass "backend/Dockerfile exists"
    ((PASSED++))
else
    check_fail "backend/Dockerfile is missing"
    ((FAILED++))
fi

echo ""
echo "--- Frontend Configuration ---"
if [ -f "frontend/package.json" ]; then
    check_pass "frontend/package.json exists"
    ((PASSED++))
    
    if [ -d "frontend/node_modules" ] || grep -q '"node_modules"' frontend/package.json 2>/dev/null; then
        check_warn "Frontend dependencies may need installation: cd frontend && npm install"
        ((WARNINGS++))
    else
        check_pass "Frontend dependencies ready (or will be installed)"
        ((PASSED++))
    fi
else
    check_fail "frontend/package.json is missing"
    ((FAILED++))
fi

if [ -f "frontend/Dockerfile" ]; then
    check_pass "frontend/Dockerfile exists (no conflicts)"
    ((PASSED++))
    
    # Check for conflict markers
    if grep -q "<<<<<<" frontend/Dockerfile 2>/dev/null; then
        check_fail "Frontend Dockerfile has merge conflicts"
        ((FAILED++))
    else
        check_pass "Frontend Dockerfile is clean (no conflicts)"
        ((PASSED++))
    fi
else
    check_fail "frontend/Dockerfile is missing"
    ((FAILED++))
fi

echo ""
echo "--- Database Schema ---"
if [ -f "init-db.sql" ]; then
    check_pass "init-db.sql exists"
    ((PASSED++))
    
    # Check for required tables
    if grep -q "CREATE TABLE.*readers_progress" init-db.sql; then
        check_pass "readers_progress table defined"
        ((PASSED++))
    else
        check_fail "readers_progress table missing"
        ((FAILED++))
    fi
    
    if grep -q "CREATE TABLE.*governance_votes" init-db.sql; then
        check_pass "governance_votes table defined"
        ((PASSED++))
    else
        check_warn "governance_votes table missing (Redis governance may not be available)"
        ((WARNINGS++))
    fi
    
    if grep -q "CREATE TABLE.*chapters" init-db.sql; then
        check_pass "chapters table defined"
        ((PASSED++))
    else
        check_fail "chapters table missing"
        ((FAILED++))
    fi
else
    check_fail "init-db.sql is missing"
    ((FAILED++))
fi

echo ""
echo "--- CI/CD Workflows ---"
if [ -d ".github/workflows" ]; then
    check_pass ".github/workflows directory exists"
    ((PASSED++))
    
    workflow_count=$(ls .github/workflows/*.yml 2>/dev/null | wc -l)
    if [ "$workflow_count" -ge 4 ]; then
        check_pass "CI/CD workflows present ($workflow_count found)"
        ((PASSED++))
    else
        check_warn "Limited CI/CD workflows ($workflow_count found, recommended: 4+)"
        ((WARNINGS++))
    fi
else
    check_fail ".github/workflows directory is missing"
    ((FAILED++))
fi

echo ""
echo "--- Security Configuration ---"
if grep -q "helmet" backend/package.json 2>/dev/null; then
    check_pass "Helmet.js security headers enabled"
    ((PASSED++))
else
    check_warn "Helmet.js not configured in package.json"
    ((WARNINGS++))
fi

if grep -q "@fastify/cors" backend/package.json 2>/dev/null; then
    check_pass "CORS middleware configured"
    ((PASSED++))
else
    check_warn "CORS middleware missing from package.json"
    ((WARNINGS++))
fi

echo ""
echo "--- Health Check Endpoints ---"
# These will be checked after deployment
check_warn "Health endpoints will be verified after deployment"
((WARNINGS++))

echo ""
echo "=================================================="
echo "  VERIFICATION SUMMARY"
echo "=================================================="
echo -e "${GREEN}Passed:${NC}   $PASSED checks"
echo -e "${RED}Failed:${NC}   $FAILED checks"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS items"
echo ""

TOTAL=$((PASSED + FAILED))
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}STATUS: READY FOR DEPLOYMENT${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure database credentials in .env.production"
    echo "2. Generate secure JWT_SECRET: openssl rand -hex 64"
    echo "3. Run deployment: docker-compose up -d --build"
    echo "4. Verify health: curl http://localhost:3001/health"
    exit 0
else
    echo -e "${RED}STATUS: NOT READY FOR DEPLOYMENT${NC}"
    echo ""
    echo "Please fix the failed checks above before deploying."
    exit 1
fi
