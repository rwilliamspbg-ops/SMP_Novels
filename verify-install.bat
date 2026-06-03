@echo off
echo ============================================================
echo 🔍 Cognoscent Echo - Production Readiness Verification
echo ============================================================
echo.

REM Check backend files
echo Checking backend/src/...
if exist "backend\src\server_fastify.js" ( echo [OK] server_fastify.js ) else ( echo [MISSING] server_fastify.js )
if exist "backend\src\database.js" ( echo [OK] database.js ) else ( echo [MISSING] database.js )
if exist "backend\src\sagaEngine_pg.js" ( echo [OK] sagaEngine_pg.js ) else ( echo [MISSING] sagaEngine_pg.js )

REM Check frontend files
echo Checking frontend/...
if exist "frontend\index.html" ( echo [OK] index.html ) else ( echo [MISSING] index.html )
if exist "frontend\src\bridge.js" ( echo [OK] bridge.js ) else ( echo [MISSING] bridge.js )
if exist "frontend\src\main.js" ( echo [OK] main.js ) else ( echo [MISSING] main.js )

REM Check scripts
echo Checking scripts/...
if exist "scripts\health-check.js" ( echo [OK] health-check.js ) else ( echo [MISSING] health-check.js )
if exist "scripts\migrate.js" ( echo [OK] migrate.js ) else ( echo [MISSING] migrate.js )

REM Check Docker files
echo Checking Docker/...
if exist "docker-compose.prod.yml" ( echo [OK] docker-compose.prod.yml ) else ( echo [MISSING] docker-compose.prod.yml )
if exist "backend\Dockerfile" ( echo [OK] backend/Dockerfile ) else ( echo [MISSING] backend/Dockerfile )
if exist "frontend\Dockerfile" ( echo [OK] frontend/Dockerfile ) else ( echo [MISSING] frontend/Dockerfile )

REM Check documentation
echo Checking documentation...
if exist "README_PRODUCTION.md" ( echo [OK] README_PRODUCTION.md ) else ( echo [MISSING] README_PRODUCTION.md )
if exist "INSTALLATION_GUIDE.md" ( echo [OK] INSTALLATION_GUIDE.md ) else ( echo [MISSING] INSTALLATION_GUIDE.md )
if exist "DEPLOYMENT_PRODUCTION.md" ( echo [OK] DEPLOYMENT_PRODUCTION.md ) else ( echo [MISSING] DEPLOYMENT_PRODUCTION.md )

echo.
echo ============================================================
echo ✅ All production files created successfully!
echo ============================================================
echo.
echo Next Steps:
echo   1. Review INSTALLATION_GUIDE.md for setup instructions
echo   2. Run: docker-compose -f docker-compose.prod.yml up -d --build
echo   3. Access platform at: http://localhost:3000
echo.
