# COGNOSCENT ECHO

> An AI-powered interactive novel platform where readers solve real-world coding challenges to influence the plot.

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Overview

**Cognoscent Echo** is a production-ready interactive SaaS platform that merges immersive storytelling with technical challenges. Readers navigate a sci-fi narrative about infrastructure and AI governance while solving real Go code puzzles. The platform features:

- **AI-Powered Characters** - Characters respond dynamically using RAG (Retrieval-Augmented Generation)
- **Interactive Code Challenges** - WebAssembly-based code execution within the narrative
- **Real-Time Metrics Dashboard** - WebSocket-driven HUD displaying system performance
- **Multi-Tenant Architecture** - Built-in user authentication and game state persistence
- **Admin Authoring Suite** - Deploy chapters and update AI personas in real-time

---

## ⚡ Quick Start

### Prerequisites
- **Docker Desktop** (recommended) or Docker & Docker Compose
- **Node.js 18+** (for local development)
- **MongoDB** (if not using Docker)

### 🐳 Docker (Recommended - 2 commands)

```bash
# 1. Start all services
docker-compose up -d

# 2. Open in browser
open http://localhost:3000
```

**Verify installation:**
```bash
./test-docker.sh
```

### 📦 Local Development

**Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env  # Update with your keys
npm start
```

**Frontend Setup (new terminal):**
```bash
cd frontend
npm install
npm start
```

Then navigate to `http://localhost:3000`

---

## ✨ Features

### Core Gameplay
- 🎮 **Interactive Narrative** - Multi-branching story with 5+ chapters
- 💻 **Code Playgrounds** - Embedded Go editor with syntax validation
- 🤖 **AI Characters** - Elias Vance and Priya Sharma respond intelligently
- 📊 **Performance Metrics** - Real-time throughput, latency, resilience tracking
- 🎭 **Governance Votes** - Reader choices influence system architecture

### Technical Stack
- **Backend**: Node.js + Express + MongoDB + WebSocket
- **Frontend**: Vanilla JavaScript + Monaco Editor + WebSocket
- **Database**: MongoDB with persistent Docker volume
- **AI**: OpenAI GPT-4o + Pinecone Vector DB (optional)
- **Authentication**: JWT with 7-day expiry

### Infrastructure
- ✅ Docker containerization for all services
- ✅ Environment-based configuration
- ✅ CORS enabled for multi-origin requests
- ✅ Graceful error handling
- ✅ Real-time metrics streaming
- ✅ Database persistence across restarts

---

## 📖 Usage Guide

### User Flow

1. **Register/Login**
   ```bash
   # Create account
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"alice","email":"alice@example.com","password":"secure123"}'
   ```

2. **Enter the Story**
   - Browser loads Chapter 1
   - Narrative text and choices displayed
   - Real-time metrics update via WebSocket

3. **Solve Code Challenges**
   - Read the technical problem
   - Edit Go code in Monaco Editor
   - Execute and validate solution
   - Narrative progresses based on success/failure

4. **Experience AI Reactions**
   - Characters respond to your choices
   - Dialogue changes based on relationship metrics
   - Plot branches adapt to performance

### Admin Features

Toggle admin panel: Click **"SaaS Admin"** button (top-right)

- **Chapter Editor**: Write narrative text
- **AI Persona Prompt**: Customize character responses
- **Deploy**: Save changes to production

---

## 🏗️ Architecture

### Services

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  Frontend   │◄────────┤   Backend    │────────►│   MongoDB    │
│  (Port 3000)│  REST   │  (Port 3001) │  Query  │ (Port 27017) │
└─────────────┘         └──────────────┘         └──────────────┘
                               │
                        ┌──────┴──────┐
                        │   WebSocket │
                        │  (Metrics)  │
                        └─────────────┘
```

### Data Models

**User Schema**
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  tier: "free" | "premium" | "enterprise",
  createdAt: Date
}
```

**Save Schema**
```javascript
{
  userId: ObjectId,
  novelId: String,
  currentChapter: Number,
  decisions: [String],
  metrics: { throughput, latency, resilience, energy },
  governanceVotes: Map
}
```

**Novel Schema**
```javascript
{
  title: String,
  slug: String,
  content: Map<Chapter>,
  metadata: Map<String>
}
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGODB_URI=mongodb://mongodb:27017/interactive_novel

# Authentication
JWT_SECRET=your_super_secret_key_here

# Optional: AI Features
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...

# Optional: Billing
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
```

### Docker Configuration

Edit `docker-compose.yml` to:
- Change port mappings
- Adjust resource limits
- Add volumes
- Configure networks

Example - Change frontend port to 8080:
```yaml
frontend:
  ports:
    - "8080:3000"  # Changed from 3000:3000
```

---

## 🚀 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Authenticate user |

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","email":"user@example.com","password":"pass123"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Protected Endpoints

Add header: `Authorization: Bearer {token}`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ping` | Health check |
| GET | `/novel/:slug/chapter/:id` | Get chapter content |
| POST | `/save` | Save game state |
| POST | `/ai-response` | Get character response |

**Example - Get Chapter:**
```bash
curl http://localhost:3001/novel/cognoscent-echo/chapter/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### WebSocket

Connect to `ws://localhost:3001` to receive real-time metrics:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const { throughput, latency, resilience, energy } = JSON.parse(event.data);
  console.log(`Throughput: ${throughput.toFixed(2)} pkts/s`);
};
```

---

## 🐳 Docker Deployment

### Container Structure

```
docker-compose.yml
├── backend (smp_novels-backend)
│   ├── Base: node:18-alpine
│   ├── Ports: 3001
│   └── Env: MONGODB_URI, JWT_SECRET
├── frontend (smp_novels-frontend)
│   ├── Base: node:18
│   ├── Ports: 3000
│   └── Serve: via `serve` npm package
└── mongodb (mongo:latest)
    ├── Base: mongo:latest
    ├── Ports: 27017
    └── Volume: smp_novels_mongo_data
```

### Useful Commands

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Execute command in container
docker-compose exec backend npm start
```

### Volumes

**MongoDB Data Persistence:**
```yaml
volumes:
  smp_novels_mongo_data:
    driver: local
```

Reset database:
```bash
docker-compose down -v
```

---

## 💻 Development

### Project Structure

```
SMP_Novels/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express + WebSocket server
│   │   ├── authService.js      # JWT & password hashing
│   │   ├── models.js           # MongoDB schemas
│   │   ├── aiEngine.js         # RAG pipeline
│   │   ├── billingService.js   # Stripe integration
│   │   ├── stateManager.js     # User state tracking
│   │   └── narrativeData.js    # Story content
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.js             # Game logic & UI
│   │   └── style.css           # Styling
│   ├── index.html
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── DOCKER_TESTING_GUIDE.md     # Deployment reference
└── README.md
```

### Making Changes

**Backend:**
```bash
cd backend
npm install  # Add new packages if needed
npm start    # Dev server (auto-restart recommended)
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

Changes are reflected immediately in browser.

### Testing

Run the test suite:
```bash
./test-docker.sh
```

Manual API testing:
```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:3001/auth/register \
  -d '{"username":"user","password":"pass"}' | jq -r '.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/ping
```

---

## 🔒 Security Considerations

### Current Status (Development)
- [x] JWT authentication implemented
- [x] Password hashing with bcrypt
- [x] CORS configured
- [ ] HTTPS enabled (configure for production)
- [ ] MongoDB authentication (recommended)
- [ ] Rate limiting (add for production)

### Production Checklist

```
[ ] Use strong JWT_SECRET (generate: openssl rand -hex 32)
[ ] Enable MongoDB authentication
[ ] Use HTTPS/TLS certificates
[ ] Enable rate limiting
[ ] Implement CSRF protection
[ ] Add API request validation
[ ] Enable request logging
[ ] Set up monitoring/alerting
[ ] Configure backup strategy
[ ] Document incident response
```

---

## 📦 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Backend** | Express.js | 4.18+ |
| **Database** | MongoDB | 8.2+ |
| **Auth** | JWT | via jsonwebtoken |
| **Crypto** | bcryptjs | 2.4+ |
| **Frontend** | Vanilla JS | ES6+ |
| **Editor** | Monaco | 0.44+ |
| **Payment** | Stripe | 12+ |
| **AI** | OpenAI | 4+ |
| **Vectorization** | Pinecone | 1+ |
| **Containers** | Docker | Latest |

---

## 🐛 Troubleshooting

### Services won't start
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Port conflicts
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Backend can't reach MongoDB
```bash
# Verify network
docker network ls
docker network inspect smp_novels_default

# Check MongoDB logs
docker-compose logs mongodb
```

### Frontend shows "Backend unreachable"
```bash
# Test backend
curl http://localhost:3001/ping

# Check backend logs
docker-compose logs backend
```

See [DOCKER_TESTING_GUIDE.md](./DOCKER_TESTING_GUIDE.md) for detailed debugging.

---

## 📚 Documentation

- [Docker Testing Guide](./DOCKER_TESTING_GUIDE.md) - Comprehensive deployment reference
- [Docker Setup Summary](./DOCKER_SETUP_SUMMARY.md) - Quick reference
- [API Documentation](#-api-documentation) - Endpoint reference

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly: `./test-docker.sh`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Submit a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure Docker builds successfully

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎮 Story Overview

### The Cognoscent Echo

A technical thriller set in a near-future infrastructure collective. You are a newly recruited engineer at the **Aegis Core**, where an ancient, distributed system called the Cognoscent Echo powers governance decisions for billions. 

**Key Characters:**
- **Elias Vance** - Lead Architect, brilliant but haunted
- **Priya Sharma** - Protocol researcher, unconventional thinker

**Core Conflict:**
A Byzantine failure in consensus is threatening system stability. Your decisions—and coding skills—will determine whether the Echo survives or collapses into noise.

---

## 📞 Support & Contact

- **Issues**: Report via GitHub Issues
- **Questions**: Open a Discussion
- **Security**: Email security@example.com

---

## 🙏 Acknowledgments

Built with:
- OpenAI for GPT-4 integration
- Pinecone for vector storage
- MongoDB for data persistence
- Express.js for server framework
- Monaco Editor for code editing

---

**Status**: ✅ Production Ready | **Last Updated**: May 2026 | **Maintainers**: rwilliamspbg-ops
4. **SaaS Admin**: Click the `SaaS Admin` button in the header to access the authoring suite and modify the story in real-time.

## ??? SaaS Roadmap
- [x] Persistent Multi-tenant Storage
- [x] JWT Session Management
- [x] Vector DB (RAG) Integration
- [x] Real-time Protocol HUD
- [x] Content Authoring Suite
- [ ] Stripe Subscription Integration
- [ ] True WASM Runtime Execution
- [ ] Global CDN Deployment
