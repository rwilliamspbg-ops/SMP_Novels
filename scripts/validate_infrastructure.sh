#!/bin/bash
# SMP_Novels Docker Infrastructure Validation Script
# Upgraded: v2.0 (Comprehensive Checks)

echo "=========================================="
echo "SMP_Novels Docker Infrastructure Validation"
echo "=========================================="

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install it."
    exit 1
fi

# Check docker version
echo "📦 Docker Version:"
docker --version

# Validate docker-compose.yml
echo "🔍 Validating docker-compose.yml..."
docker compose config > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ docker-compose.yml is valid"
else
    echo "❌ docker-compose.yml has errors"
    docker compose config
    exit 1
fi

# Validate docker-compose.prod.yml
echo "🔍 Validating docker-compose.prod.yml..."
docker compose -f docker-compose.prod.yml config > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ docker-compose.prod.yml is valid"
else
    echo "❌ docker-compose.prod.yml has errors"
    docker compose -f docker-compose.prod.yml config
    exit 1
fi

# Check image versions
echo "🔍 Checking image versions..."
if grep -q "mongo:7.0" docker-compose.yml; then
    echo "✅ MongoDB version pinned to 7.0"
else
    echo "❌ MongoDB version not pinned"
fi

if grep -q "postgres:15.4" docker-compose.yml; then
    echo "✅ PostgreSQL version pinned to 15.4"
else
    echo "❌ PostgreSQL version not pinned"
fi

if grep -q "redis:7.2-alpine" docker-compose.yml; then
    echo "✅ Redis version pinned to 7.2-alpine"
else
    echo "❌ Redis version not pinned"
fi

# Check for resource limits
echo "🔍 Checking resource limits..."
if grep -q "limits:" docker-compose.yml; then
    echo "✅ Resource limits configured"
else
    echo "❌ Resource limits not configured"
fi

# Check for network isolation
echo "🔍 Checking network isolation..."
if grep -q "internal: true" docker-compose.yml; then
    echo "✅ Network isolation configured"
else
    echo "❌ Network isolation not configured"
fi

# Check for log rotation
echo "🔍 Checking log rotation..."
if grep -q "max-size:" docker-compose.yml; then
    echo "✅ Log rotation configured"
else
    echo "❌ Log rotation not configured"
fi

# Check for healthchecks
echo "🔍 Checking healthchecks..."
if grep -q "healthcheck:" docker-compose.yml; then
    echo "✅ Healthchecks configured"
else
    echo "❌ Healthchecks not configured"
fi

# Check for graceful shutdown
echo "🔍 Checking graceful shutdown..."
if grep -q "stop_grace_period:" docker-compose.yml; then
    echo "✅ Graceful shutdown configured"
else
    echo "❌ Graceful shutdown not configured"
fi

# Check environment files
echo "🔍 Checking environment files..."
if [ -f ".env.example" ]; then
    echo "✅ .env.example exists"
else
    echo "❌ .env.example not found"
fi

if [ -f ".env.development" ]; then
    echo "✅ .env.development exists"
else
    echo "❌ .env.development not found"
fi

if [ -f ".env.production" ]; then
    echo "✅ .env.production exists"
else
    echo "❌ .env.production not found"
fi

# Check backup scripts
echo "🔍 Checking backup scripts..."
if [ -f "scripts/backup_mongodb.sh" ]; then
    echo "✅ MongoDB backup script exists"
else
    echo "❌ MongoDB backup script not found"
fi

if [ -f "scripts/backup_postgres.sh" ]; then
    echo "✅ PostgreSQL backup script exists"
else
    echo "❌ PostgreSQL backup script not found"
fi

if [ -f "scripts/backup_redis.sh" ]; then
    echo "✅ Redis backup script exists"
else
    echo "❌ Redis backup script not found"
fi

# Check monitoring stack
echo "🔍 Checking monitoring stack..."
if [ -f "docker-compose.monitoring.yml" ]; then
    echo "✅ Monitoring stack exists"
else
    echo "❌ Monitoring stack not found"
fi

# Check CI/CD workflow
echo "🔍 Checking CI/CD workflow..."
if [ -f ".github/workflows/docker-publish.yml" ]; then
    echo "✅ Docker publish workflow exists"
else
    echo "❌ Docker publish workflow not found"
fi

echo "=========================================="
echo "Validation Complete!"
echo "=========================================="
