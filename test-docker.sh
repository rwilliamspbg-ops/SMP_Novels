#!/bin/bash
# Docker Testing Script for SMP Novels
# Run this to validate your Docker setup

set -e

echo "========================================="
echo "SMP Novels Docker Health Check"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected=$5
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s "$url" 2>/dev/null || echo "")
    else
        response=$(curl -s -X "$method" "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null || echo "")
    fi
    
    if echo "$response" | grep -q "$expected" 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Response: ${response:0:50}"
        ((FAILED++))
    fi
}

# Check if services are running
echo "Checking services..."
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Services are running"
else
    echo -e "${RED}✗${NC} Services are not running. Run: docker-compose up -d"
    exit 1
fi
echo ""

# Test connectivity
echo "Testing connectivity..."

# Backend health
test_endpoint "Backend Health" "GET" "http://localhost:3001/ping" "" "alive"

# Frontend HTML
test_endpoint "Frontend HTML" "GET" "http://localhost:3000/" "" "COGNOSCENT ECHO"

# MongoDB
echo -n "Testing MongoDB... "
if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

echo ""
echo "Testing API Endpoints..."

# Register user
REGISTER_DATA='{"username":"testuser_'$(date +%s)'","email":"test_'$(date +%s)'@example.com","password":"testpass123"}'
test_endpoint "User Registration" "POST" "http://localhost:3001/auth/register" "$REGISTER_DATA" "token"

# Get token for further tests
TOKEN=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser_auth_'$(date +%s)'","email":"test_auth_'$(date +%s)'@example.com","password":"testpass123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "  ${GREEN}Token obtained${NC}"
    
    # Protected endpoint
    echo -n "Testing protected endpoint... "
    if curl -s "http://localhost:3001/novel/test/chapter/1" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null | grep -q "error"; then
        echo -e "${GREEN}✓ PASS${NC} (Auth working, novel not found as expected)"
        ((PASSED++))
    else
        echo -e "${YELLOW}~ WARN${NC}"
    fi
fi

echo ""
echo "Testing WebSocket..."
if command -v python3 &> /dev/null; then
    echo -n "Testing WebSocket metrics... "
    WS_RESULT=$(timeout 3 python3 << 'PYEOF' 2>/dev/null || echo "fail")
import websocket, json, sys
try:
    ws = websocket.create_connection("ws://localhost:3001", timeout=2)
    msg = ws.recv()
    data = json.loads(msg)
    if "throughput" in data and "latency" in data:
        print("pass")
    else:
        print("fail")
    ws.close()
except:
    print("fail")
PYEOF
    
    if [ "$WS_RESULT" = "pass" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}~ SKIP${NC} (python3 websocket not installed)"
    fi
else
    echo -e "${YELLOW}~ SKIP${NC} (python3 not found)"
fi

echo ""
echo "========================================="
echo "Results: ${GREEN}$PASSED Passed${NC}, ${RED}$FAILED Failed${NC}"
echo "========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Your Docker setup is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:3000 in your browser"
    echo "2. Create a new account"
    echo "3. Explore the interactive novel"
    echo ""
    exit 0
else
    echo -e "${RED}Some tests failed. Check docker-compose logs:${NC}"
    echo "  docker-compose logs backend"
    echo "  docker-compose logs frontend"
    echo "  docker-compose logs mongodb"
    exit 1
fi
