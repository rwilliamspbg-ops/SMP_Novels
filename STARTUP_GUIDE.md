# 🎓 Cognoscent Echo - Complete Startup Guide

Welcome to the Cognoscent Interactive Platform! This guide will get you up and running in minutes.

## 📦 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Docker Desktop installed ([download](https://www.docker.com/get-started/))
- [ ] Node.js 18+ installed
- [ ] Git for version control (optional)

## 🔐 Step 1: Generate Strong Secrets

**CRITICAL**: Never use the placeholder values in production!

```bash
# Option A: Using OpenSSL (Recommended)
openssl rand -hex 64 > jwt_secret.txt
cat jwt_secret.txt

# Option B: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option C: Using PowerShell on Windows
Get-Random -Minimum 1 -Maximum 9007199254740992 | Out-File jwt_secret.txt -Encoding ASCII
```

Copy the output to your `.env` file where indicated.

## ⚙️ Step 2: Configure Environment Variables

Edit the `.env` file with your actual secrets:

```bash
# Open .env in an editor
notepad .env        # Windows
code .env           # VS Code (recommended)
vim .env            # Vim/Neovim users
nano .env           # Nano users

# Find and replace the placeholder values with real ones
```

**Minimum Required Secrets:**
- `JWT_SECRET` - For authentication tokens
- `STRIPE_SECRET_KEY` - For payment processing (or empty if not needed)
- `POSTGRES_PASSWORD` - Database password (or use secure_password_here)

## 🚀 Step 3: Start the Stack

### Option A: Production Deploy (Recommended)

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up --build -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check running containers
docker-compose -f docker-compose.prod.yml ps
```

### Option B: Development Deploy

```bash
# Start with development defaults
docker-compose up --build -d

# Or interactive mode for debugging
docker-compose up
```

### Option C: Individual Services

```bash
# Start only backend (if you want to run frontend separately)
docker-compose up backend

# Start only frontend
docker-compose up frontend

# Start all with health checks waiting
docker-compose -f docker-compose.prod.yml up --build -d --wait
```

## ✅ Step 4: Verify Deployment

### Check Health Endpoints

```bash
# Backend API health check
curl http://localhost:3001/ping

# WASM Sandbox status
curl http://localhost:3001/sandbox

# Frontend loads correctly
curl http://localhost:3000/

# Full stack health
docker-compose ps
```

**Expected Output:**
```json
// Backend /ping response
{
  "status": "alive",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "2.0.0"
}

// WASM Sandbox status
{
  "path": "./sandbox/index.html",
  "status": "ready",
  "features": ["code_execution", "memory_inspection", "network_simulation"]
}
```

### View Logs for Troubleshooting

```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# All services
docker-compose logs -f
```

## 🎮 Step 5: Explore Features

### Access the Platform

1. **Open Frontend**: Navigate to `http://localhost:3000` in your browser
2. **Read Chapters**: Click through interactive chapters
3. **Try WASM Sandbox**: Experiment with code exercises
4. **Participate in Governance**: Vote on technical proposals
5. **Track Progress**: Watch your learning metrics improve

### API Testing Examples

```bash
# Get chapter 1 content
curl http://localhost:3001/chapter/1

# Make a narrative choice
curl -X POST http://localhost:3001/choice \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user-123",
    "chapterId": 1,
    "choiceIndex": 0
  }'

# Validate code challenge
curl -X POST http://localhost:3001/challenge/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "package main\nimport \"sync\"\ntype Pool struct{pool sync.Pool}",
    "challengeId": "code_challenge"
  }'

# Get user progress
curl http://localhost:3001/progress/demo-user-123

# Record a vote
curl -X POST http://localhost:3001/governance/vote \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "G-2029-047",
    "optionId": "maintain",
    "userId": "demo-user-123"
  }'

# Get AI character response
curl -X POST http://localhost:3001/ai-response \
  -H "Content-Type: application/json" \
  -d '{
    "character": "Elias",
    "context": "User asking about memory allocation patterns",
    "userId": "demo-user-123"
  }'
```

## 🧪 Step 6: Run Tests (Optional)

```bash
# Backend unit tests
cd backend && npm test

# Edge case tests (requires database)
node backend/src/edge_case_tests.js

# Security audit
cd backend && npm audit --omit=dev
cd ../frontend && npm audit --omit=dev
```

## 🐛 Step 7: Troubleshooting Common Issues

### Issue: Container won't start

```bash
# Check logs for errors
docker-compose logs -f

# Rebuild containers
docker-compose up --build

# View network connectivity
docker-compose exec backend ping mongodb
```

### Issue: Port already in use

```bash
# Check what's using port 3001
netstat -ano | findstr :3001

# Or change port in .env and docker-compose.prod.yml
PORT=3002
```

### Issue: Database connection errors

```bash
# Check database containers
docker-compose ps mongodb postgres redis

# View database logs
docker-compose logs mongodb
docker-compose logs postgres
docker-compose logs redis
```

### Issue: WASM Sandbox won't load

```bash
# Enable WASM (only for development!)
echo "ENABLE_WASM_SANDBOX=true" >> .env

# Check CORS configuration
grep FRONTEND_URL .env
```

## 📊 What You Should See

After successful deployment:

### Docker Status
```
NAME              STATUS                  PORTS
backend           Up (healthy)            3001->3001/tcp
frontend          Up (healthy)            3000->3000/tcp
mongodb           Up                      27017
postgres          Up                      5432,5433
redis             Up                      6379->6379/tcp
```

### Health Checks Passing
- `http://localhost:3001/ping` → 200 OK
- `http://localhost:3001/sandbox` → 200 OK
- `http://localhost:3000/` → HTML content loaded

## 🎯 Next Steps

### For Learning
1. Explore all chapters in the interactive narrative
2. Complete WASM exercises for each chapter
3. Read all learning outcomes and tips
4. Try different governance voting scenarios

### For Development
1. Clone repository: `git clone https://github.com/rwilliamspbg-ops/SMP_Novels.git`
2. Run tests: `npm test`
3. Make changes to `backend/src/narrativeData.js`
4. Commit with meaningful messages
5. Create Pull Requests

### For Production Deployment
1. Generate real secrets (see Step 1)
2. Update `.env` with production values
3. Deploy to your infrastructure
4. Setup monitoring (Prometheus, Grafana)
5. Configure TLS/SSL certificates

## 📚 Additional Resources

- **DEPLOYMENT.md** - Full deployment guide
- **IMPROVEMENT_SUMMARY.md** - All improvements made
- **docker-compose.prod.yml** - Production configuration
- **.github/workflows/** - CI/CD automation examples

## 💡 Pro Tips

1. **Always use production compose file**: `docker-compose.prod.yml` for deployment
2. **Never commit secrets**: Keep `.env` out of git (already in `.gitignore`)
3. **Enable health checks**: Verify containers are healthy before using
4. **Check logs first**: Always review logs before assuming failure
5. **Use environment variables**: Configure features via `.env` file

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review log files: `docker-compose logs -f`
3. Verify prerequisites are installed
4. Rebuild containers: `docker-compose up --build`

---

**Happy Coding! 🚀**

The Cognoscent Echo awaits your journey through the Aegis Core! 🌌
