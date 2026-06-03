# 🚀 Production Deployment Manifest - Cognoscent Echo v1.0.0

**Architecture:** Fastify API + PostgreSQL + Nginx Frontend  
**Database:** PostgreSQL 15+ (with JSONB support)  
**Container Orchestration:** Docker Compose / Kubernetes  

---

## 📦 Deployment Options

### Option A: Docker Compose (Recommended for Dev/Staging)

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Check health status
node scripts/health-check.js
```

### Option B: Fly.io Backend + Vercel Frontend

#### 1. Deploy Backend to Fly.io

```bash
cd backend
flyctl launch \
  --name cognoscent-echo-api \
  --region ams \
  --memory 512mb \
  --cpu 1 \
  --build-secret YOUR_BUILD_SECRET \
  --env NODE_ENV=production \
  --env DB_HOST=fly.io-database-name.fly.dev.internal \
  --env DB_NAME=interactive_novel \
  --env JWT_SECRET=<secure_key>

fly deploy
```

**Environment Variables:**
```bash
flyctl secrets set NODE_ENV=production
flyctl secrets set DB_HOST=<your-fly-db-host>
flyctl secrets set DB_NAME=interactive_novel
flyctl secrets set DB_USER=postgres
flyctl secrets set DB_PASSWORD=<secure_password>
flyctl secrets set JWT_SECRET=<generate_secure_key_here>
```

#### 2. Deploy Frontend to Vercel

```bash
cd frontend
vercel deploy \
  --prod \
  --name cognoscent-echo \
  --env VITE_API_BASE=https://your-api.fly.dev \
  --env NODE_ENV=production
```

### Option C: AWS ECS + RDS

```bash
# Build and push Docker image
docker build -t your-ecr-repo/cognoscent-backend:latest ./backend
docker tag your-ecr-repo/cognoscent-backend:latest your-ecr-repo/cognoscent-backend:$GIT_SHA
docker push your-ecr-repo/cognoscent-backend:latest

# Create ECS Task Definition (see ecs-task-definition.json)
aws ecs create-service \
  --cluster cognoscent-cluster \
  --service cognoscent-api \
  --task-definition cognoscent-task-def:latest \
  --launch-type FARGATE \
  --network-configuration ...

# Deploy to RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier cognoscent-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username postgres \
  --master-user-password <secure_password> \
  --db-name interactive_novel
```

---

## 🔐 Security Configuration

### Production Checklist

- [ ] Generate secure JWT secret: `openssl rand -hex 32`
- [ ] Set strong database password (min 16 chars, mixed case + numbers/symbols)
- [ ] Enable HTTPS with Let's Encrypt or Cloudflare
- [ ] Configure CORS to only allow production domains
- [ ] Set appropriate rate limits based on traffic expectations
- [ ] Review and restrict all environment variables
- [ ] Enable database encryption at rest
- [ ] Configure WAF rules (Cloudflare/AWS WAF)

### Secrets Management

```bash
# Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
export JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id cognoscent-jwt --query SecretString --output text)
```

---

## 📊 Monitoring Setup

### Prometheus + Grafana

1. **Add Service Discovery** to Prometheus `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'cognoscent-backend'
    static_configs:
      - targets: ['your-backend-host:3001']
```

2. **Create Grafana Dashboard**:
   - Import dashboard ID: `cognoscent-echo-dashboard-v1.json`
   - Panels: API latency, error rates, user engagement metrics

### Alerting Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: cognoscent-alerts
    rules:
      - alert: BackendDown
        expr: up{job="cognoscent-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Cognoscent Echo backend is down"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 2m
        labels:
          severity: warning
```

---

## 🔄 Database Migration Guide

### PostgreSQL Schema Initialization

```bash
# Run from backend directory
npm run init-db

# Verify schema created
docker exec -it cognoscent-postgres psql -U postgres -d interactive_novel -c "\dt"
```

### Backup Strategy

```bash
# Daily backup cron job (add to crontab)
0 2 * * * pg_dump -h localhost -U postgres interactive_novel > /backups/cognoscent_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -h localhost -U postgres -f /path/to/backup.sql
```

### Connection Pooling (PgBouncer for high scale)

```bash
# Add PgBouncer to docker-compose.prod.yml
services:
  pgbouncer:
    image: edobro/pgbouncer
    environment:
      - PGHOST=postgres
      - PGBPORT=5432
      - PGUSER=cognoscent
      - PGDATABASE=interactive_novel
      - PASSWORD=<your_password>
      - POOL_MODE=transaction
```

---

## 🧪 Load Testing

### Using k6

```bash
# Install k6
npm install -g k6

# Run load test (100 VUs, 30s duration)
k6 run scripts/load-test.js

# Example load test script
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3001/health');
  check(res, { 
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

---

## 🚨 Incident Response

### Common Issues & Fixes

**Issue:** Database connection timeout  
**Fix:** Check PostgreSQL memory limits and connection pool settings

**Issue:** High API latency  
**Fix:** Enable connection pooling (PgBouncer) or increase `max` in database.js

**Issue:** Rate limiting too aggressive  
**Fix:** Adjust `RATE_LIMIT_MAX` in `.env` environment variable

### Rollback Procedure

```bash
# Deploy previous version
fly deploy --app cognoscent-echo-api --version 1.0.0-rc1

# Or restore database from backup
psql -h localhost -U postgres -f /backups/cognoscent_2024-01-15.sql
```

---

## 📈 Performance Optimization

### PostgreSQL Tuning (postgresql.conf)

```conf
# Shared memory and connections
shared_buffers = 256MB
effective_cache_size = 2GB
max_connections = 100
work_mem = 4MB
maintenance_work_mem = 64MB

# Query optimization
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Node.js Optimization

```bash
# Enable core dumps for crash analysis
ulimit -c unlimited

# Use node --max-old-space-size=512 for larger apps
node --max-old-space-size=512 src/server_fastify.js
```

---

## 📝 Deployment Verification Checklist

Before marking as production-ready:

- [ ] All health checks pass (`node scripts/health-check.js`)
- [ ] Database schema initialized successfully
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled with appropriate thresholds
- [ ] HTTPS/SSL certificates installed and valid
- [ ] Monitoring dashboards accessible
- [ ] Alerting rules configured
- [ ] Backup automation in place
- [ ] Load testing completed (target: 10K+ RPS)
- [ ] Security audit completed

---

## 🆘 Emergency Contacts

| Service | Contact | Escalation Path |
|---------|---------|-----------------|
| Backend API | SRE Team | L1 → L2 → L3 on-call |
| Database | DBA Team | Critical issues only |
| Frontend | FE Team | Bug reports via Jira |

---

**Last Updated:** January 2024  
**Version:** 1.0.0-Production  
**Status:** ✅ Ready for Deployment
