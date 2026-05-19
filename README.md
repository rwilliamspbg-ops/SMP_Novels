# 🌌 Cognoscent Echo Interactive Platform v2.0

> An AI-orchestrated interactive narrative platform with WASM sandboxing, learning progress tracking, and governance voting systems.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/rwilliamspbg-ops/SMP_Novels/actions)
[![Docker Pulls](https://img.shields.io/docker/pulls/interactive-novel-backend?label=backend)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Admin Authoring](https://img.shields.io/badge/admin-authoring-complete-brightgreen)]()
[![CI/CD Pipeline](https://img.shields.io/badge/ci-cd-ready-yellow)]()
[![MongoDB Persistence](https://img.shields.io/badge/persistence-mongodb-complete-brightgreen)]()
[![Test Coverage](https://img.shields.io/badge/test_coverage-68%25-green)]()
[![Readiness](https://img.shields.io/badge/readiness-90%25-green)]()

## 🌟 Key Features (v2.0)

- **🔬 WASM Sandboxing**: Secure code execution environment for educational chapters
- **📊 Learning Progress Tracker**: Track skills mastered, chapters completed, and educational milestones
- **🗳️ Governance Voting**: Community-driven decision making with BFT consensus  
- **🤖 AI Character Responses**: Dynamic conversations with Elias, Priya, and Governor
- **💾 Persistent State**: MongoDB persistence layer with saga engine for durability
- **🔒 Security Hardened**: Multi-stage builds, non-root containers, health checks
- **✍️ Admin Content Management**: Complete CRUD operations (JWT auth required)
- **🔄 CI/CD Pipeline**: Automated testing, security scans, Docker builds
- **📈 Observability**: Health endpoints and structured logging configured

## 📚 Interactive Learning Modules

### Chapter Structure

Each chapter includes:
1. **Narrative Text**: Immersive story progression
2. **WASM Exercises**: Hands-on code challenges with instant validation
3. **Learning Outcomes**: Educational goals per chapter
4. **Interactive Governance**: Voting on technical decisions
5. **Character AI**: Context-aware dialogue responses

### Skills You'll Master

| Category | Skills |
|----------|--------|
| Systems Programming | Zero-copy memory allocation, Cache-line awareness |
| Distributed Systems | BFT consensus, Eventual consistency |
| Kernel Bypass | AF_XDP networking, User-space packet processing |

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (v2.20+)
- **Node.js 20+** (for local development)
- Optional: Git CLI for version control

### First Time Setup

```bash
# 1. Clone and setup environment
git clone https://github.com/rwilliamspbg-ops/SMP_Novels.git
cd SMP_Novels

# 2. Choose environment
cp .env.development .env  # For development
cp .env.production .env   # For production

# 3. Generate strong JWT secret (REQUIRED for production!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" >> .env

# 4. Build and start the stack
docker compose -f docker-compose.prod.yml up --build -d

# 5. Check health endpoints
curl http://localhost:3001/ping    # Backend API
curl http://localhost:3001/sandbox # WASM Sandbox
curl http://localhost:3000/        # Frontend UI
```

### Development Mode

```bash
# Local backend development (without Docker)
cd backend
npm install
cp .env.example .env      # Edit with your secrets
node src/server.js        # Run on port 3001

# Local frontend development
cd frontend
npm install
npx serve .               # Simple static server
```

### Monitoring Stack (Optional)

```bash
# Start Prometheus + Grafana
docker compose -f docker-compose.monitoring.yml up -d

# Access Grafana at http://localhost:3001
# Default credentials: admin/admin
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              Load Balancer (nginx)                   │
└─────────────────────────────────────────────────────┘
                      ↓
  ┌───────────────┬──────────────────────┬──────────┐
  │   Frontend    │     Backend API      │ MongoDB  │
  │  Port 3000    │       Port 3001      │ Port 27017│
  │               │                      │           │
  │ - Interactive │  - Fastify v5        │ User Data │
  │   Chapters    │    WASM Sandbox      │ Sessions  │
  │ - Code Editor │    Learning Tracker  │           │
  └───────────────┴──────────────────────┴──────────┘
                      ↓
         ┌───────────────────────┬─────────────────┐
         │   PostgreSQL          │      Redis      │
         │    Port 5432          │     Port 6379   │
         │   Persistence         │   Real-time     │
         │   Voting Records      │   Cache/Sockets │
         └───────────────────────┴─────────────────┘
```

### Network Isolation

The infrastructure uses isolated networks for security:
- `frontend`: Public-facing services
- `backend`: Internal API services
- `database`: Database services (no external access)

### Resource Limits

All services have CPU and memory limits configured to prevent resource exhaustion:
- MongoDB: 2 CPU, 2GB RAM
- PostgreSQL: 2 CPU, 2GB RAM
- Redis: 1 CPU, 1GB RAM
- Backend: 2 CPU, 1GB RAM
- Frontend: 1 CPU, 512MB RAM

## 📖 Chapter Flow Example

### Prologue: The Awakening
> *"You awaken in the sterile hum of the Aegis Core..."*

**Learning Outcomes:**
- Introduction to zero-copy memory patterns

**Interactive Element:** Code snippet introducing FramePool architecture

---

### Chapter 1: The FramePool Leak
> *"Elias sighs, rubbing his temples. 'It's a Byzantine failure...'"*

**WASM Exercise:** Build a zero-copy FramePool with validation  
**Learning Outcomes:**
- Understanding FramePool architecture
- Consensus failure modes  
- Memory leak debugging

---

### Chapter 2: Byzantine Fault Tolerance
> *"The protocol stabilizes, but a sliver of vulnerability..."*

**Governance Vote:** Choose BFT threshold (55.5% vs 40%)  
**Learning Outcomes:**
- Understanding consensus algorithms
- Security vs performance trade-offs

---

### Epilogue: The Bigger Picture
> *"The Cognoscent Echo stabilizes..."*

**Reflection Questions:**
- What was the most important technical concept?
- How will you apply these patterns?

## 🧪 Testing & Validation

```bash
# Run backend tests
cd backend && npm test

# Run edge case tests (requires DB)
node backend/src/edge_case_tests.js

# Check environment variables
npm run check-env

# Security audit
npm audit --omit=dev

# Seed MongoDB with initial data
npm run seed
```

## 🔒 Security Best Practices

### Secrets Management

**NEVER commit `.env` to git!** The `.gitignore` file is already configured.

Required secrets (generate before deployment):
```bash
# JWT Secret (32 hex characters minimum)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" > jwt_secret.txt

# Stripe API Key (from Stripe Dashboard)
echo "STRIPE_SECRET_KEY=sk_test_xxx" >> .env

# Database Password
echo "POSTGRES_PASSWORD=your_secure_password_here" >> .env
```

### Security Features Enabled

- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Rate limiting (60s window, 100 req max)
- ✅ Multi-stage Docker builds
- ✅ Non-root container users
- ✅ Resource limits (2 CPU, 1GB memory)

## 📊 Monitoring Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ping` | GET | Basic health check |
| `/sandbox` | GET | WASM sandbox status |
| `/progress/:userId` | GET | Learning progress API |
| `/chapter/:id` | GET | Get chapter content |
| `/save-progress/:userId` | POST | Save user progress |

### Prometheus Metrics

Access metrics at `http://localhost:9090` (when monitoring stack is enabled):
- Backend: `http://backend:3001/metrics`
- Node Exporter: `http://node-exporter:9100/metrics`
- MongoDB Exporter: `http://mongodb-exporter:9216/metrics`
- PostgreSQL Exporter: `http://postgres-exporter:9187/metrics`
- Redis Exporter: `http://redis-exporter:9121/metrics`

## 🛠️ Development Workflow

### 1. Start Services

```bash
# Development
docker compose up --build -d

# Production
docker compose -f docker-compose.prod.yml up --build -d

# With Monitoring
docker compose -f docker-compose.monitoring.yml up -d
```

### 2. Run Individual Tests

```bash
# Backend API tests
cd backend && npm test

# WASM sandbox validation
node backend/src/edge_case_tests.js
```

### 3. Make Changes

- Update `narrativeData.js` for new chapters
- Modify `sandbox/index.html` for WASM changes
- Test locally before committing

## 🔧 Maintenance

### Backup Management

```bash
# Run manual backups
chmod +x scripts/*.sh
./scripts/backup_mongodb.sh
./scripts/backup_postgres.sh
./scripts/backup_redis.sh

# Automated backups (recommended)
crontab -e
# Add: 0 2 * * * /path/to/SMP_Novels/scripts/backup_mongodb.sh
# Add: 0 3 * * * /path/to/SMP_Novels/scripts/backup_postgres.sh
# Add: 0 4 * * * /path/to/SMP_Novels/scripts/backup_redis.sh
```

### Infrastructure Validation

```bash
# Validate all configurations
chmod +x scripts/validate_infrastructure.sh
./scripts/validate_infrastructure.sh
```

### Image Scanning

```bash
# Scan images for vulnerabilities
trivy image ghcr.io/smpnovels/backend:latest
trivy image ghcr.io/smpnovels/frontend:latest
```

## 📚 API Documentation

Base URL: `http://localhost:3001` (or your production domain)

### Core Endpoints

```bash
# Health Check
GET /ping

# Get Chapter Content
GET /chapter/:id

# Validate Code Challenge
POST /challenge/validate
Body: { "code": "your_code", "challengeId": "code_challenge" }

# Make Narrative Choice
POST /choice
Body: { "userId": "...", "chapterId": 1, "choiceIndex": 0 }

# Character AI Response
POST /ai-response
Body: { "character": "Elias", "context": "..." }

# Governance Vote
POST /governance/vote
Body: { "proposalId": "G-2029-047", "optionId": "maintain", "userId": "..." }

# Learning Progress API
GET /progress/:userId
```

## 🎓 Educational Resources

### Recommended Reading
1. **"The Linux Kernel"** - Deep systems programming
2. **Raft Consensus Algorithm** papers (UC Berkeley)
3. **eBPF Programming with BCC tools**

### Practice Projects
- Build your own distributed key-value store
- Implement Raft consensus in Go
- Experiment with AF_XDP ring buffers

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Production deployment steps
- Security hardening checklist
- Scaling strategies  
- Troubleshooting guide

### Quick Deploy

```bash
# Production (with TLS, load balancer, monitoring)
docker compose -f docker-compose.prod.yml up -d

# Verify deployment
curl http://localhost:3001/ping
curl http://localhost:3001/sandbox
```

### CI/CD Pipeline

The repository includes automated Docker publishing:
1. Push to `main` branch triggers build
2. Multi-arch images built (amd64/arm64)
3. Trivy vulnerability scanning
4. Images pushed to GHCR
5. Semantic versioning tags applied

## 🧭 Getting Help

- **Troubleshooting**: See [DEPLOYMENT.md](DEPLOYMENT.md) section
- **Architecture**: Check the `backend/src` directory structure
- **Security**: Review `.dockerignore` files and Dockerfile configurations
- **API Reference**: See individual service implementations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Update documentation
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

MIT License — see [LICENSE](LICENSE) file.

---

## 🎯 Roadmap (v2.1+)

- [ ] Mobile app version (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Gamification system (badges, achievements)
- [ ] Peer code review features

**Ready to start?** Run the commands above and begin your journey through the Aegis Core! 🚀🌌
