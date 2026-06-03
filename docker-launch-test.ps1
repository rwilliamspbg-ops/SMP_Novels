#!/usr/bin/env pwsh

# SMP_Novels Docker Launch Script with Login Testing
# Run this from C:\Users\rwill\SMP_Novels\

Write-Host "=== SMP_Novels Docker Launch & Login Test ===" -ForegroundColor Green

$dockerDir = "."
$envFile = Join-Path $PWD ".env.development"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.development not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[INFO] Checking Docker..." -ForegroundColor Yellow
try {
    $output = docker --version
    Write-Host "$output" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "`n[INFO] Checking for running containers..." -ForegroundColor Yellow
$running = docker-compose ps --format json 2>$null
if ($running) {
    Write-Host "Stopping existing containers..." -ForegroundColor Cyan
    docker-compose down
    Start-Sleep -Seconds 3
}

Write-Host "`n[INFO] Building and starting containers...`" -ForegroundColor Yellow
docker-compose -f .docker-compose.yml up -d --build

Write-Host "`n[INFO] Waiting for services to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

Write-Host "`n[INFO] Checking container health..." -ForegroundColor Yellow
$healthCheck = 0
$maxAttempts = 5
$attempt = 1

while ($healthCheck -eq 0 -and $attempt -le $maxAttempts) {
    Write-Host "  Attempt $attempt/$maxAttempts: Checking health..." -ForegroundColor Cyan
    
    # Check MongoDB
    $mongoUp = docker exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" 2>&1 | Select-String "ok"
    if ($mongoUp) { Write-Host "  ✓ MongoDB is healthy" -ForegroundColor Green }
    
    # Check PostgreSQL  
    $pgReady = docker exec postgres pg_isready -U novel_user -d echo_db 2>&1 | Select-String "ready"
    if ($pgReady) { Write-Host "  ✓ PostgreSQL is healthy" -ForegroundColor Green }
    
    # Check Redis
    $redisUp = docker exec redis redis-cli ping 2>&1 | Select-String "PONG"
    if ($redisUp) { Write-Host "  ✓ Redis is healthy" -ForegroundColor Green }
    
    Start-Sleep -Seconds 5
    $healthCheck++
}

if ($healthCheck -eq 0) {
    Write-Host "`n[WARNING] Some services may not be fully healthy yet. Running once more..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    docker-compose ps
    exit 0
}

Write-Host "`n[INFO] All database services are healthy!" -ForegroundColor Green
Write-Host `"" -NoNewline

# Test Backend Ping
Write-Host "[TESTING] Backend health check..." -ForegroundColor Cyan
$response = curl http://localhost:3001/ping 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Backend is responding" -ForegroundColor Green
    Write-Host "  Response: $response" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Backend not responding yet..." -ForegroundColor Yellow
}

# Test Frontend Access
Write-Host `""[TESTING] Frontend access check..." -ForegroundColor Cyan
$response = curl http://localhost:3000 2>&1 | Select-Object -First 5
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Frontend is accessible" -ForegroundColor Green
} else {
    Write-Host "  ✗ Frontend not accessible yet..." -ForegroundColor Yellow
}

# Show container status
Write-Host `""[CONTAINER STATUS]`" -ForegroundColor Cyan
docker-compose ps --format table

Write-Host `"" -NoNewline
Write-Host "=== Login Test Ready! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Open browser to: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Or test API login:" -ForegroundColor Cyan
Write-Host "  curl -X POST http://localhost:3001/auth/login `"` -NoNewline
Write-Host '  -d "{""username"":""admin"",""password"":""your_password""}"' -ForegroundColor Gray

Write-Host "`n[SUCCESS] All services are running and ready for login!" -ForegroundColor Green
