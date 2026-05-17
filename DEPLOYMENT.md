# 🚀 Deployment Guide - Cognoscent Echo v2.0

## Overview
Deploying the Cognoscent Echo interactive platform with WASM sandbox, learning progress tracking, and governance voting systems.

## Quick Start

```bash
# 1. Setup environment variables
cp .env.example .env
# Edit .env and set your secrets (see Security Checklist below)

# 2. Build and start the stack
docker-compose -f docker-compose.prod.yml up --build -d

# 3. Check health
curl http://localhost:3001/health

# 4. Access the platform
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer (nginx)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────┬────────────────────────────────┬─────────────┐
│  Frontend    │        Backend API             │  MongoDB     │
│  Port 3000   │       Port 3001                │  Port 27017  │
│              │                                 │              │
│  - Static    │      - Fastify Server          │  User Data   │
│    HTML/CSS/ │      - WASM Sandbox            │  Session     │
│    JS        │      - Learning Tracker        │              │
└──────────────┴────────────────────────────────┴─────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL (Session Persistence)              │
│                        Port 5432                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Redis Cache                             │
│                          Port 6379                           │
└─────────────────────────────────────────────────────────────┘
```

## Services Overview

### Backend (Port 3001)
- **Framework**: Fastify v5 with Helmet security headers
- **Features**: WASM sandbox, learning progress tracking, AI responses
- **Persistence**: MongoDB for user sessions, PostgreSQL for long-term saves

### Frontend (Port 3000)
- **Type**: Static HTML/JS application
- **Features**: Interactive chapters, code editor, governance UI

### Database Services
- **MongoDB**: User progress, session data
- **PostgreSQL**: Persistent narrative state, voting records
- **Redis**: Real-time caching, WebSocket connections

## Security Checklist ⚠️

### BEFORE DEPLOYMENT

```bash
# 1. Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" > jwt_secret.txt

# 2. Set environment variables
export JWT_SECRET=$(cat jwt_secret.txt)
export STRIPE_SECRET_KEY=<your_stripe_test_key>
export POSTGRES_PASSWORD=<strong_password_here>

# 3. Update .env file with all secrets
cat jwt_secret.txt >> .env
```

### Required Secrets (MUST SET BEFORE DEPLOYMENT)

| Variable | Purpose | Generation Method |
|----------|---------|-------------------|
| `JWT_SECRET` | JWT token signing | `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY` | Payment processing | From Stripe Dashboard |
| `POSTGRES_PASSWORD` | Database password | Generate unique password |

### Security Hardening Steps

```bash
# 1. Run dependency audit
cd backend && npm audit --omit=dev
cd ../frontend && npm audit --omit=dev

# 2. Fix vulnerabilities
npm audit fix --omit=dev

# 3. Enable security headers (already in server.js with Helmet)

# 4. Configure CORS properly (update FRONTEND_URL in .env)
```

### Post-Deployment Security

```bash
# 1. Enable TLS/SSL (recommended for production)
docker run -d --name nginx -p 80:80 -p 443:443 \
  -v /path/to/certs:/etc/nginx/certs:ro \
  nginx:alpine

# 2. Setup rate limiting (already in server.js via @fastify/rate-limit)

# 3. Enable request logging for security monitoring
LOG_LEVEL=warn
```

## Environment Configuration

### Development (.env)
```bash
NODE_ENV=development
ENABLE_WASM_SANDBOX=true
ENABLE_AI_RESPONSES=true
ENABLE_GOVERNANCE_VOTING=true
LOG_LEVEL=debug
```

### Production (.env)
```bash
NODE_ENV=production
ENABLE_WASM_SANDBOX=false  # Disable WASM in production for security
ENABLE_AI_RESPONSES=true
ENABLE_GOVERNANCE_VOTING=true
LOG_LEVEL=warn
FRONTEND_URL=https://yourdomain.com
```

## Scaling Strategy

### Horizontal Scaling (Recommended)

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '4'
          memory: 2G
    healthcheck:
      test: curl -f http://localhost:3001/ping || exit 1
      interval: 30s
      timeout: 5s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Vertical Scaling (Simple)

Update resource limits in `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'      # Increase from 2
      memory: 2G      # Increase from 1G
```

## Monitoring & Observability

### Health Check Endpoints

- **Overall Health**: `GET http://localhost:3001/ping`
- **Learning Progress**: `GET http://localhost:3001/progress/:userId`
- **WASM Sandbox Status**: `GET http://localhost:3001/sandbox`

### Metrics Collection

```bash
# Prometheus scrape config
scrape_configs:
  - job_name: 'cognoscent'
    static_configs:
      - targets: ['backend:3001']
```

### Log Aggregation

Logs are available in Docker:
```bash
docker-compose logs -f backend
```

## Migration Guide (v1 → v2)

### Database Schema Updates

```sql
-- Add new columns to reader_progress
ALTER TABLE reader_progress 
ADD COLUMN learning_outcomes TEXT[] DEFAULT '{}';

-- Add skills table if needed
CREATE TABLE IF NOT EXISTS user_skills (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    skill_name VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50),
    mastered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Code Changes Required

1. Update `server.js` to use new API endpoints
2. Update client-side code to handle enhanced chapter data
3. Migrate old progress data (backward compatible)

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Fails
```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs mongodb

# Rebuild
docker-compose up -d --build
```

#### 2. WASM Sandbox Not Working
```bash
# Ensure security headers are loaded
curl -I http://localhost:3001/sandbox | grep "X-Content-Type-Options"

# Check CORS configuration in .env
echo "FRONTEND_URL=http://localhost:3000" >> .env
```

#### 3. Learning Progress Not Saving
```bash
# Verify MongoDB schema is correct
docker exec -it mongodb mongosh --eval "db.getCollection('reader_progress').countDocuments()"

# Reset progress if corrupted
curl -X POST http://localhost:3001/save-progress/test-user \
  -H "Content-Type: application/json" \
  -d '{"chapterId": 1}'
```

### Debug Commands

```bash
# Check all containers
docker-compose ps

# View backend logs
docker-compose logs -f backend

# Test API endpoints
curl http://localhost:3001/ping
curl http://localhost:3001/sandbox
curl http://localhost:3001/chapter/1
```

## CI/CD Pipeline (GitHub Actions)

See `.github/workflows` for automation.

### Workflow Steps
1. **Build**: Build Docker images on PR and merge
2. **Test**: Run unit tests and security scans
3. **Deploy**: Auto-deploy to staging on main branch
4. **Review**: Manual approval required for production

## Performance Tuning

### Optimize Database Connections

```javascript
// Add connection pooling configuration
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,           // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Optimize WASM Execution

```yaml
# In sandbox config.json, adjust limits
validation:
  maxExecutionTime: 10000  # Increase from 5000ms
  memoryLimit: "128MB"     # Increase from 64MB
```

## Next Steps After Deployment

1. ✅ Monitor health check endpoints
2. ✅ Review security audit results
3. ✅ Setup monitoring/alerting (Prometheus + Grafana)
4. ✅ Configure backup schedules for databases
5. ✅ Test failover procedures
6. ✅ Document runbook for common issues

---

## Support Resources

- **Documentation**: See README.md and IMPROVEMENT_SUMMARY.md
- **Source Code**: GitHub repository at `/SMP_Novels`
- **Community**: #cognoscent-dev Slack channel

**Need Help?** Check troubleshooting section above or contact ops team.
