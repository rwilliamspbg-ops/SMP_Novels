# 🚀 Production Deployment Guide - Cognoscent Echo

Last updated: 2026-05-18

## Executive Summary

This guide covers deploying the Interactive Novel Platform to production. Current readiness: **65%** → Target: **80%** with steps below.

## Quick Start Checklist

- [ ] Set up MongoDB connection with proper credentials
- [ ] Configure JWT_SECRET and other environment variables
- [ ] Add admin user for content management access
- [ ] Wire admin routes (`/content/update`, `/content/list`) to frontend
- [ ] Enable CI/CD pipeline in GitHub Actions
- [ ] Run seed scripts: `node backend/scripts/seed.js`

## Prerequisites

```bash
# System requirements
- Node.js 18+ (or containerized with Docker)
- MongoDB 6+ (or cloud instance like Atlas)
- Redis 7+ (for caching/governance)
- Git for CI/CD integration
```

## Environment Configuration

### Production .env Setup

Create `backend/.env` with these minimum settings:

```bash
NODE_ENV=production
JWT_SECRET=<generate_64_hex_chars>
MONGODB_URI=mongodb://<host>:27017/dbname?authSource=admin
REDIS_URL=redis://redis:6379
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

**Generate secure JWT_SECRET:**
```bash
openssl rand -hex 32
# Example output: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2...
```

### Security Hardening Checklist

- [ ] Set `NODE_ENV=production` to reduce logging verbosity
- [ ] Configure `CORS_ORIGIN` to specific domain (not `*`)
- [ ] Enable secure cookies: `SECURE_COOKIES=true`
- [ ] Externalize secrets using vault/secrets manager in production
- [ ] Add rate limiting for API endpoints
- [ ] Run `npm audit --audit-level=high` and fix vulnerabilities

## Database Setup

### Local MongoDB

```bash
# Start MongoDB
mongod --dbpath /data/db

# Seed database (create chapters, demo progress)
node backend/scripts/seed.js
```

### Cloud MongoDB Atlas

```javascript
// Update MONGODB_URI in .env:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.com/novel_db?retryWrites=true&w=majority
```

## Admin Access Setup

The admin endpoints are now available at:

- `POST /content/update` - Create/Update chapters
- `GET /content/list` - List all chapters
- `DELETE /content/delete/:id` - Remove chapters

### Creating Admin User

Add admin role to user in MongoDB shell:

```javascript
use interactive_novel;

// Find or create user
db.users.findOne({email: "admin@example.com"})

// Add admin role
db.users.updateOne(
  {email: "admin@example.com"},
  {$set: {role: "admin"}}
);
```

## CI/CD Setup

### Enable GitHub Actions

1. Push current code to GitHub repository
2. `.github/workflows/ci.yml` will automatically run on:
   - Pull requests to `main` and `develop` branches
   - Every push to these branches

### CI Pipeline Jobs

- **Test Suite**: Runs test files (test_suite_lite, edge_case_tests)
- **Code Quality**: Checks for vulnerabilities and secrets
- **Docker Build**: Builds frontend and backend images
- **Security Scan**: Audits dependencies for CVEs

#### Configure Repository Secrets in GitHub:

Settings → Secrets → Actions:
```
MONGODB_URI=<prod_connection_string>
JWT_SECRET=<production_secret>
```

## Container Deployment with Docker Compose

### Production Stack

```yaml
# docker-compose.prod.yml already exists - update environment variables
docker-compose -f docker-compose.prod.yml up -d --build
```

### Verify Deployment

```bash
# Check services are running
docker-compose ps

# View logs
docker-compose logs -f backend

# Health check
curl http://localhost:3001/ping
```

## Frontend Integration

Add admin endpoints to frontend API configuration:

```javascript
// In frontend API routes or proxy config
const ADMIN_API = '/api/content'; // Points to backend /content/*

// Available endpoints:
// POST ${ADMIN_API}/update - Update chapter content
// GET ${ADMIN_API}/list - List chapters
// DELETE ${ADMIN_API}/delete/:id - Remove chapter
```

## Observability Setup

### Prometheus (Optional)

Add to docker-compose for metrics scraping:

```yaml
- command: prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus
  ports:
    - "9090:9090"
```

### Structured Logging

Current logs are JSON-formatted when `LOG_FORMAT=json`.

## Performance Monitoring

Add application performance monitoring (APM):
- **New Relic** or **Datadog** agents
- **Sentry** for error tracking
- **Prometheus + Grafana** for metrics dashboards

## Security Checklist

### Must-Have

- [x] JWT_SECRET generated and not hardcoded
- [ ] CORS_ORIGIN set to specific domain (not wildcard)
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] .env file added to `.gitignore`
- [ ] MongoDB connection string uses secure auth methods
- [ ] No database credentials in application code

### Recommended

- [ ] Implement CSRF protection for state-changing requests
- [ ] Add Content-Security-Policy headers
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Run regular dependency audits (`npm audit`)
- [ ] Set up vulnerability alerts in GitHub

## Monitoring Alerts

Configure alerting thresholds:

```javascript
// In monitoring config
const alerts = {
  serverDown: '1m',
  highMemoryUsage: '>80%',
  dbConnectionError: 'immediate',
  authFailures: 'threshold:10/window:5m'
};
```

## Troubleshooting

### Admin Routes Not Working?

1. Verify backend is running on port 3001
2. Check admin token in Authorization header
3. Ensure JWT_SECRET matches between .env and token generation

### Seed Script Errors?

```bash
# Check MongoDB connection
mongo --eval "db.adminCommand('ping')"

# Review seed output for errors
node backend/scripts/seed.js 2>&1 | tee seed.log
```

### High Latency Issues?

1. Check Redis connection health
2. Verify database query performance
3. Enable compression for large responses:

```javascript
fastify.register(require('@fastify/compress'));
```

## Next Steps to Reach 80% Readiness

1. ✅ **Admin Routes Implemented** - Already done!
2. ⚠️ **CI/CD Pipeline** - Review and trigger first build
3. 🔄 **MongoDB Persistence Layer** - Wire sagaEngine_pg.js with main flow
4. 🔐 **Production Security Hardening** - Follow checklist above
5. 📊 **Observability Stack** - Add Prometheus/alerting in production mode

## Escalation Path

For issues:
1. Check logs: `docker-compose logs -f backend`
2. Review CI pipeline for test failures
3. Verify environment variables match requirements
4. Consult scorecard for current readiness gaps

---

*Documentation maintained for production deployment and operations.*
