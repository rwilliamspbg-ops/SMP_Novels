# 🚀 Cognoscent Echo - Complete Installation & Setup Guide
**Version:** 1.0.0-Production  
**Last Updated:** January 2024  

---

## 📋 Table of Contents

1. [Quick Start](#quick-start) - Get running in 5 minutes
2. [Prerequisites](#prerequisites) - What you need installed
3. [Local Development Setup](#local-development-setup) - Running locally
4. [Docker Deployment](#docker-deployment) - Containerized setup
5. [Production Deployment](#production-deployment) - Cloud platforms
6. [Database Initialization](#database-initialization) - Schema creation
7. [Testing & Validation](#testing--validation) - Verify installation
8. [Troubleshooting](#troubleshooting) - Common issues
9. [Performance Tuning](#performance-tuning) - Optimization tips

---

## Quick Start

### Option 1: Docker Compose (Recommended for First Run)

```bash
# Step 1: Navigate to project root
cd InteractiveNovelDemo

# Step 2: Create environment file with defaults
cp .env.example .env

# Step 3: Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Step 4: Wait for database to initialize (2-3 minutes)
sleep 120

# Step 5: Run health check
node scripts/health-check.js

# Step 6: Access the platform
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Health Check: http://localhost:3001/health
```

### Option 2: Local Development (PostgreSQL Required)

```bash
# Step 1: Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Step 2: Create environment file
cp .env.example .env
nano .env  # Edit with your PostgreSQL credentials

# Step 3: Initialize database
node scripts/migrate.js

# Step 4: Start backend server
cd backend
npm start

# Step 5: Open frontend in browser
# http://localhost:3000 (backend running on port 3001)
```

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Installation Command |
|----------|---------|---------|---------------------|
| Node.js | 18.0+ | Runtime | `curl -fsSL https://deb.nodesource.com/setup_18.x \| sudo -E bash - && sudo apt-get install -y nodejs` |
| PostgreSQL | 15+ | Database | `sudo apt-get install postgresql-15 postgresql-contrib-15` |
| Docker | 20.10+ | Containerization | `curl -fsSL https://get.docker.com | bash -s docker --stored=/var/tmp` |
| npm/yarn | Latest | Package manager | Included with Node.js |

### Verify Installation

```bash
node --version      # Should be v18.x or higher
npm --version       # Should be 9.x or higher
docker --version    # Should be 20.10.x or higher
pg_isready          # Should return "accepting connections"
```

### Alternative: Use Docker for Everything

If you don't want to install PostgreSQL locally, use Docker Compose which includes all services:

```bash
# All-in-one setup (includes PostgreSQL)
docker-compose -f docker-compose.prod.yml up -d
```

---

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd InteractiveNovelDemo

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Create environment file
cp .env.example .env

# Edit for your local setup
nano .env  # Or use vim, code, etc.

# Required changes:
DB_PASSWORD=your_secure_local_password  # Change this!
JWT_SECRET=cognoscent_dev_jwt_key      # Change this!
```

### 3. Initialize PostgreSQL Database

**Option A: Using psql command line**

```bash
# Start PostgreSQL service (if not running)
sudo systemctl start postgresql

# Create database and user
sudo -u postgres createuser -s postgres
sudo -u postgres createdb interactive_novel -O postgres
sudo -u postgres psql interactive_novel << EOF
CREATE TABLE IF NOT EXISTS readers_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    current_chapter INTEGER DEFAULT 1,
    decisions_made JSONB DEFAULT '{}',
    branch_selections TEXT[] DEFAULT '{}',
    metrics JSONB DEFAULT '{"throughput": 0, "latency": 0, "resilience": 0}',
    unlocked_nodes TEXT[] DEFAULT '{"prologue"}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS governance_votes (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    option_id INTEGER NOT NULL,
    vote_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proposal_id, user_id, option_id)
);

CREATE TABLE IF NOT EXISTS chapters (
    chapter_id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    choices JSONB NOT NULL,
    interactive_element JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_readers_user_id ON readers_progress(user_id);
CREATE INDEX idx_governance_proposal ON governance_votes(proposal_id);
CREATE INDEX idx_chapters_id ON chapters(chapter_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS update_readers_progress_updated_at ON readers_progress;
CREATE TRIGGER update_readers_progress_updated_at 
    BEFORE UPDATE ON readers_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample chapters (chapters 1-6)
INSERT INTO chapters VALUES (1, 'You awaken in the sterile hum of the Aegis Core...', '[{"text": "Ask Elias about the leak", "nextChapter": 2}, {"text": "Examine the terminal yourself", "nextChapter": 3}]', '{"type":"code_snippet"}');
INSERT INTO chapters VALUES (2, 'Elias sighs, not looking away from the screen...', '[{"text": "Suggest lowering the threshold", "nextChapter": 4}, {"text": "Argue for higher resilience", "nextChapter": 5}]', '{"type":"governance_vote"}');
INSERT INTO chapters VALUES (3, 'The terminal flashes with red warnings...', '[{"text": "Alert Elias immediately", "nextChapter": 2}, {"text": "Try to patch the leak manually", "nextChapter": 6}]', null);
INSERT INTO chapters VALUES (4, 'The protocol stabilizes but vulnerability remains...', '[]', null);
INSERT INTO chapters VALUES (5, 'You maintain the resilience. The system struggles...', '[]', null);
INSERT INTO chapters VALUES (6, 'Your quick fingers redirect the leaking packets...', '[{"text": "Discuss implications", "nextChapter": 2}]', null);

EOF
```

**Option B: Using migration script**

```bash
node scripts/migrate.js
```

### 4. Start Development Server

```bash
# Backend with hot reload (nodemon)
cd backend
npm run dev

# Or production server
npm start
```

Output should show:
```
✅ PostgreSQL schema initialized successfully
🚀 Cognoscent Echo Production API running on port 3001
```

### 5. Access Frontend

Open browser to: http://localhost:3000

---

## Docker Deployment

### Option A: Development with Hot Reload

```bash
# Build backend with dev dependencies
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Access at http://localhost:3000
```

### Option B: Production Docker Compose

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Start in detached mode
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Verify Docker Installation

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Expected output:
# Container Name              Status
# cognoscent-postgres         Up
# cognoscent-backend          Up (healthy)
# cognoscent-frontend         Up (healthy)
```

---

## Production Deployment

### Option A: Fly.io (Backend) + Vercel (Frontend)

#### 1. Deploy Backend to Fly.io

```bash
cd backend

# Initialize Fly app
flyctl launch \
  --name cognoscent-echo-api \
  --region ams \
  --memory 512mb \
  --cpu 1

# Set environment variables
flyctl secrets set NODE_ENV=production
flyctl secrets set DB_HOST=<your-fly-db-host>
flyctl secrets set DB_NAME=interactive_novel
flyctl secrets set DB_USER=postgres
flyctl secrets set DB_PASSWORD=<secure_password_here>
flyctl secrets set JWT_SECRET=$(openssl rand -hex 32)

# Deploy
fly deploy
```

#### 2. Deploy Frontend to Vercel

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy \
  --prod \
  --name cognoscent-echo \
  --env VITE_API_BASE=https://your-api.fly.dev
```

#### 3. Configure CORS in Backend

Edit `backend/src/server_fastify.js`:

```javascript
fastify.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://echo-platform.vercel.app',
      process.env.FRONTEND_URL || 'https://your-frontend.vercel.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // ... other settings
});
```

### Option B: AWS ECS + RDS

```bash
# Build and push Docker image
docker build -t your-ecr-repo/cognoscent-backend:latest ./backend
docker tag your-ecr-repo/cognoscent-backend:latest your-ecr-repo/cognoscent-backend:$GIT_SHA
docker push your-ecr-repo/cognoscent-backend:latest

# Create ECS Task Definition (ecs-task-definition.json)
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json

# Deploy to RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier cognoscent-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username postgres \
  --master-user-password <secure_password> \
  --db-name interactive_novel

# Deploy ECS service
aws ecs create-service \
  --cluster cognoscent-cluster \
  --service cognoscent-api \
  --task-definition cognoscent-task-def:latest \
  --launch-type FARGATE \
  --network-configuration ...
```

### Option C: DigitalOcean App Platform

```bash
# Create GitHub repo and connect to DigitalOcean
# App Platform will auto-detect Dockerfile and deploy

# Set environment variables in DigitalOcean dashboard:
# - DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
# - JWT_SECRET, NODE_ENV=production
```

---

## Database Initialization

### Quick Setup with Migration Script

```bash
# From project root
node scripts/migrate.js

# Expected output:
# [MIGRATION] Starting database migration...
# [MIGRATION OK] Created readers_progress table
# [MIGRATION OK] Created governance_votes table
# [MIGRATION OK] Created chapters table
# [MIGRATION OK] Created indexes
# [MIGRATION OK] Migration completed successfully!
```

### Verify Schema

```bash
# Connect to database
psql -h localhost -U postgres -d interactive_novel

# List tables
\dt

# Expected output:
#            List of relations             |  Schema   |       Table       
-------------------------------------------+------------+-------------------
 readers_progress                          | public     | readers_progress
 governance_votes                          | public     | governance_votes
 chapters                                  | public     | chapters
```

### Add Sample Governance Proposals

```bash
node scripts/add-sample-proposals.js
```

### Backup Database

```bash
# Daily backup script (add to crontab)
0 2 * * * pg_dump -h localhost -U postgres interactive_novel > /backups/cognoscent_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -h localhost -U postgres -f /path/to/backup.sql
```

---

## Testing & Validation

### 1. Health Check

```bash
node scripts/health-check.js

# Expected output:
# ✓ Database (PostgreSQL): Connected
# ✓ Backend API: Healthy (200)
# ✓ Frontend Server: Healthy (200)
# ✅ All systems operational
```

### 2. Load Testing

```bash
npm install -g k6
k6 run scripts/load-test.js

# Expected output:
# Running scenario: Reader Navigation
# Success Rate: 98.5%
# Avg Latency: 45ms
```

### 3. Narrative Integrity Check

```bash
cd backend
npm run audit-narrative

# Verifies:
# - All chapters are reachable from prologue
# - No dead-ends in decision tree
# - Interactive elements properly configured
```

### 4. Manual Testing Checklist

- [ ] Can access frontend at http://localhost:3000
- [ ] Can load Chapter 1
- [ ] Can make choices and navigate to next chapters
- [ ] Code playground validates Go snippets
- [ ] Governance vote proposal appears in Chapter 2
- [ ] Can submit vote on governance proposals
- [ ] Health check endpoint returns 200: http://localhost:3001/health
- [ ] Database connection persists across requests

---

## Troubleshooting

### Common Issues

#### Issue: Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection
psql -h localhost -U postgres -d interactive_novel -c "SELECT 1"
```

**Solution:** Ensure PostgreSQL service is running and password is correct in `.env`

#### Issue: CORS Errors from Browser

```bash
# Check ALLOWED_CORS_URLS in .env
FRONTEND_URL=http://localhost:3000

# Restart backend
cd backend && npm restart
```

**Solution:** Ensure FRONTEND_URL matches your frontend domain exactly

#### Issue: Rate Limiting Too Aggressive

```bash
# Edit .env
RATE_LIMIT_MAX=500  # Increase from default 100

# Restart backend
cd backend && npm restart
```

#### Issue: MongoDB vs PostgreSQL Confusion

**Migration completed!** The platform now uses **PostgreSQL**. If you see references to MongoDB in old code, those are legacy files. Use the new `database.js` module which handles PostgreSQL connections.

#### Issue: Port Already in Use

```bash
# Find what's using port 3001
lsof -i :3001

# Kill process or change PORT in .env
PORT=3002
```

#### Issue: Docker Container Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Expected errors and fixes:
# "FATAL:  password authentication failed" → Check DB_PASSWORD in .env
# "pg_isready: cannot connect" → Wait for PostgreSQL to initialize (add sleep)
```

---

## Performance Tuning

### PostgreSQL Optimization

**postgresql.conf settings** (edit `/etc/postgresql/15/main/postgresql.conf`):

```conf
# Memory allocation
shared_buffers = 256MB
effective_cache_size = 2GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection limits
max_connections = 100

# Query optimization
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Node.js Optimization

```bash
# Enable core dumps for crash analysis
ulimit -c unlimited

# Run with increased memory (optional)
node --max-old-space-size=512 src/server_fastify.js
```

### Database Indexes

```sql
-- Add composite index for common queries
CREATE INDEX idx_governance_active ON governance_votes(proposal_id, option_id) 
WHERE status = 'active';

-- Analyze tables for query planner
ANALYZE readers_progress;
ANALYZE governance_votes;
ANALYZE chapters;
```

### Connection Pooling (High Scale)

Add PgBouncer to docker-compose:

```yaml
services:
  pgbouncer:
    image: edobro/pgbouncer
    environment:
      - PGHOST=postgres
      - PGBPORT=5432
      - PGUSER=cognoscent
      - PASSWORD=<your_password>
      - POOL_MODE=transaction
```

---

## Security Checklist (Before Production)

- [ ] Generate secure JWT secret: `openssl rand -hex 32`
- [ ] Set strong database password (min 16 chars, mixed case + numbers/symbols)
- [ ] Enable HTTPS with Let's Encrypt or Cloudflare
- [ ] Configure CORS to only allow production domains
- [ ] Set appropriate rate limits based on traffic expectations
- [ ] Review and restrict all environment variables
- [ ] Enable database encryption at rest
- [ ] Configure WAF rules (Cloudflare/AWS WAF)

---

## Next Steps After Installation

1. **Test All Features:** Run through the entire narrative from Chapter 1 to epilogue
2. **Configure Monitoring:** Set up Prometheus + Grafana dashboards
3. **Set Up Backups:** Configure automated database backups
4. **Load Testing:** Run k6 load tests to verify performance targets
5. **Security Audit:** Review dependencies with `npm audit` and `docker scan`

---

## Support & Resources

- **GitHub Repository:** [rwilliamspbg-ops/InteractiveNovelDemo](https://github.com/rwilliamspbg-ops/InteractiveNovelDemo)
- **API Documentation:** See `README.md` in `/docs/api` directory
- **Deployment Guide:** See `DEPLOYMENT_PRODUCTION.md` for cloud-specific instructions
- **Database Schema:** See `init-db.sql` for full schema definition

---

**Installation Complete!** 🎉

Your Cognoscent Echo platform is ready to deploy. Access at http://localhost:3000
