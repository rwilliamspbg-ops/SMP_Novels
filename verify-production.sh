#!/bin/bash

# Cognoscent Echo - Production Readiness Verification Script
# Run this after installation to verify all components are working

echo "============================================================"
echo "🔍 Cognoscent Echo - Production Readiness Check"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo "Checking PostgreSQL..."
pg_isready > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PostgreSQL: Running and accepting connections${NC}"
else
    echo -e "${RED}✗ PostgreSQL: Not running or not accessible${NC}"
    echo "   To start PostgreSQL:"
    echo "   sudo systemctl start postgresql"
fi
echo ""

# Check if backend is running on port 3001
echo "Checking Backend API (port 3001)..."
curl -s http://localhost:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend API: Running on port 3001${NC}"
else
    echo -e "${YELLOW}⚠ Backend API: Not running (expected for first installation)${NC}"
    echo "   To start backend:"
    echo "   cd backend && npm start"
fi
echo ""

# Check if frontend is running on port 3000
echo "Checking Frontend (port 3000)..."
curl -s http://localhost:3000/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend: Running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠ Frontend: Not running (expected for first installation)${NC}"
    echo "   To start frontend:"
    echo "   cd frontend && npm start"
fi
echo ""

# Check required files
echo "Checking Required Files..."
REQUIRED_FILES=(
    "backend/src/server_fastify.js"
    "backend/src/database.js"
    "backend/src/sagaEngine_pg.js"
    "frontend/index.html"
    "frontend/src/bridge.js"
    "frontend/src/main.js"
    "docker-compose.prod.yml"
    ".env.example"
    "INSTALLATION_GUIDE.md"
)

all_files_present=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗$file (missing)${NC}"
        all_files_present=false
    fi
done
echo ""

# Check Docker Compose
echo "Checking Docker Compose..."
if [ -f "docker-compose.prod.yml" ]; then
    if docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker Compose: Valid configuration${NC}"
    else
        echo -e "${RED}✗ Docker Compose: Invalid configuration${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker Compose: Not found (optional)${NC}"
fi
echo ""

# Summary
echo "============================================================"
echo "📊 Installation Summary"
echo "============================================================"
echo ""

if $all_files_present; then
    echo -e "${GREEN}✅ All required files are present!${NC}"
    echo ""
    echo "Next Steps:"
    echo "  1. Initialize database:"
    echo "     node scripts/migrate.js"
    echo ""
    echo "  2. Start backend (port 3001):"
    echo "     cd backend && npm start"
    echo ""
    echo "  3. Access frontend at: http://localhost:3000"
    echo ""
    echo -e "${GREEN}🎉 Production installation complete!${NC}"
else
    echo -e "${YELLOW}⚠ Some files are missing. Run the setup instructions.${NC}"
    echo ""
    echo "See INSTALLATION_GUIDE.md for step-by-step setup."
fi

echo ""
echo "============================================================"
echo ""
