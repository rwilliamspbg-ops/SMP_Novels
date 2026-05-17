# 🌌 Cognoscent Echo Interactive Platform v2.0

> An AI-orchestrated interactive narrative platform with WASM sandboxing, learning progress tracking, and governance voting systems.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/rwilliamspbg-ops/SMP_Novels/actions)
[![Docker Pulls](https://img.shields.io/docker/pulls/interactive-novel-backend?label=backend)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🌟 Key Features (v2.0)

- **🔬 WASM Sandboxing**: Secure code execution environment for educational chapters
- **📊 Learning Progress Tracker**: Track skills mastered, chapters completed, and educational milestones
- **🗳️ Governance Voting**: Community-driven decision making with BFT consensus
- **🤖 AI Character Responses**: Dynamic conversations with Elias, Priya, and Governor
- **💾 Persistent State**: MongoDB + PostgreSQL hybrid for learning progress
- **🔒 Security Hardened**: Multi-stage builds, health checks, resource limits

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

- **Docker & Docker Compose** (for full stack)
- **Node.js 18+** (for local development)
- Optional: Git CLI for version control

### First Time Setup

```bash
# 1. Clone and setup environment
git clone https://github.com/rwilliamspbg-ops/SMP_Novels.git
cd SMP_Novels
cp .env.example .env

# 2. Generate strong JWT secret (required!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" >> .env

# 3. Build and start the stack
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Check health endpoints
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

## 🛠️ Development Workflow

### 1. Start Services

```bash
docker-compose -f docker-compose.prod.yml up --build -d
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
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
curl http://localhost:3001/ping
curl http://localhost:3001/sandbox
```

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
