# 🚀 Cognoscent Echo Interactive Platform - Production Ready

**Version:** 1.0.0-Production  
**Stack:** Fastify API | PostgreSQL | Nginx Frontend  
**License:** MIT  

---

## 📋 Quick Start

### Prerequisites
```bash
node: >=18.0.0
docker: Latest LTS (optional for containerized deployment)
postgresql: 15+ (required)
```

### Local Development Setup

1. **Clone and Install Dependencies**
```bash
cd backend
npm install

cd ../frontend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

3. **Initialize Database**
```bash
cd backend
npm run init-db
```

4. **Start Services**
```bash
# Option A: Local development (backend only)
cd backend && npm start

# Option B: Full stack with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

5. **Access the Platform**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

### Docker Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Cognoscent Echo Platform                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Nginx)                 Backend (Fastify API)      │
│  :3000                             :3001                      │
│    ├── Static Files               ┌───────────────────────┐  │
│    ├── Interactive UI             │ PostgreSQL DB         │  │
│    └── Monaco Editor              │ - readers_progress    │  │
│                                  │ - governance_votes      │  │
│                                  │ - chapters             │  │
│                                  └───────────────────────┘  │
│                     ↕ HTTP/REST API v2                    │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│    ├── Nginx Reverse Proxy & Caching                       │
│    ├── Redis (Optional - for governance tallies)            │
│    └── Prometheus Metrics Collection                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

### Implemented Security Controls

- ✅ **Helmet.js** - HTTP security headers
- ✅ **Rate Limiting** - 100 req/min default (configurable)
- ✅ **CORS Protection** - Configurable origins
- ✅ **Input Validation** - Content-Type checking
- ✅ **Error Handling** - No sensitive data in responses
- ✅ **Graceful Shutdown** - Signal handlers for clean exit

### Environment Variables Required

```bash
# Must be set before production deployment
JWT_SECRET=<generate_secure_random_string>
DB_PASSWORD=<secure_database_password>
FRONTEND_URL=<production_frontend_url>
```

---

## 📊 Performance Targets (SLA)

| Metric | Target | Current Status |
|--------|--------|----------------|
| API Response Time | <100ms p95 | ⏳ TBD (monitoring enabled) |
| Throughput | 10K RPS | ✅ Ready for load testing |
| Error Rate | <0.1% | ✅ Error handling implemented |
| Uptime | 99.9% | ✅ Health checks configured |

---

## 🧪 Testing & Validation

### Run Health Checks
```bash
node scripts/health-check.js
```

### Narrative Integrity Check
```bash
cd backend
npm run audit-narrative
```

### Database Schema Validation
```bash
docker exec -it cognoscent-postgres psql -U postgres -d interactive_novel -c "\dt"
```

---

## 📝 Development Workflow

### Hot Reload (Development)
```bash
cd backend
npm run dev
# Auto-reloads on file changes
```

### Linting
```bash
cd backend
npm run lint

cd frontend
npm run lint
```

### Database Migrations
```bash
node scripts/migrate.js
```

---

## 🔧 Production Deployment Checklist

- [ ] Set secure `JWT_SECRET` in production environment
- [ ] Configure HTTPS/TLS certificates
- [ ] Review and restrict CORS origins
- [ ] Set appropriate `RATE_LIMIT_MAX` based on traffic
- [ ] Enable JSON logging for monitoring
- [ ] Configure database backups (cron job)
- [ ] Set up Prometheus/Grafana monitoring
- [ ] Configure alerting for health check failures

### Example Production Deployment (Fly.io)

```bash
# Deploy backend to Fly.io
cd backend
flyctl launch --region ams --build-secret YOUR_BUILD_SECRET

# Deploy frontend to Vercel
cd frontend
vercel deploy --prod
```

---

## 📚 API Documentation

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/chapter/:id` | Fetch chapter data | No |
| POST | `/choice` | Record reader choice | No |
| GET | `/progress/:userId` | Get reader progress | No |
| POST | `/ai-response` | Generate AI response | No |
| GET | `/governance/tally/:proposalId` | Get vote tally | No |
| POST | `/governance/vote` | Record governance vote | No |
| POST | `/metrics` | Save reader metrics | No |
| GET | `/analytics/active-readers` | Dashboard analytics | Yes |

### Request Format (POST endpoints)

```json
{
  "userId": "reader-abc123",
  "chapterId": 1,
  "choiceIndex": 0,
  "character": "Elias",
  "context": { ... }
}
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
node -e "const pg = require('pg'); (async () => { await pg.connect({host:'localhost',port:5432,database:'interactive_novel',user:'postgres',password:'your_password'}).then(()=>console.log('OK')).catch(e=>console.error(e)) })();"
```

### CORS Errors
- Verify `FRONTEND_URL` in `.env` matches your frontend domain
- Check allowed origins in `server_fastify.js`

### Rate Limiting Too Aggressive
```bash
# Increase rate limit in .env
RATE_LIMIT_MAX=500
```

---

## 📈 Monitoring & Observability

### Prometheus Metrics Endpoint
```bash
curl http://localhost:3001/metrics
```

### Health Check Integration
```bash
# Add to your monitoring system
http://localhost:3001/health
```

---

## 🔄 Migration Guide (MongoDB → PostgreSQL)

The platform has been migrated from MongoDB to PostgreSQL with the following benefits:

- ✅ **ACID Compliance** - Transactional integrity for reader progress
- ✅ **JSONB Support** - Native JSON storage for flexible schemas
- ✅ **Better Indexing** - Optimized query performance
- ✅ **Standard SQL** - Easier debugging and reporting

### Data Migration Commands
```sql
-- Create indexes for better performance
CREATE INDEX idx_readers_user_id ON readers_progress(user_id);
CREATE INDEX idx_governance_proposal ON governance_votes(proposal_id);
CREATE INDEX idx_chapters_id ON chapters(chapter_id);

-- Add composite index for common queries
CREATE INDEX idx_governance_active ON governance_votes(proposal_id, option_id) WHERE status = 'active';
```

---

## 🎯 Next Steps

1. **Configure Production Secrets** - Update `.env` with production values
2. **Run Database Schema Init** - `npm run init-db`
3. **Deploy to Cloud Provider** - Fly.io, Vercel, or AWS ECS
4. **Set Up Monitoring** - Prometheus + Grafana dashboards
5. **Load Testing** - Run k6 or Artillery tests
6. **Security Audit** - Review dependencies and configurations

---

## 📞 Support & Resources

- **GitHub Repository:** [rwilliamspbg-ops/InteractiveNovelDemo](https://github.com/rwilliamspbg-ops/InteractiveNovelDemo)
- **API Documentation:** See `README.md` in `/docs/api` directory
- **Deployment Guide:** See `DEPLOYMENT.md` for cloud-specific instructions

---

## 📜 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ by the Cognoscent Echo Team**
