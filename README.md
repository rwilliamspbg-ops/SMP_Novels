# ?? The Cognoscent Echo: Interactive SaaS Platform

This is a production-ready MVP of an AI-powered interactive web novel platform. It transforms technical fiction into an immersive experience where readers solve real-world coding challenges to influence the plot.

## ?? Core Architecture
- **Multi-Tenant Backend**: Node.js + Express + MongoDB for persistent user state and novel management.
- **RAG AI Engine**: A Retrieval-Augmented Generation pipeline utilizing **OpenAI (GPT-4o)** and **Pinecone Vector DB** to ensure characters respond with technical accuracy based on a stored lore-base.
- **Interactive Player**: A high-fidelity frontend with a real-time WebSocket protocol HUD.
- **Authoring Suite**: A built-in administrative interface for deploying chapters and updating AI personas in real-time.

## ??? Installation & Quick Start

### Prerequisites
- Docker & Docker Compose (Recommended)
- MongoDB (if running locally)
- Node.js 18+ (if running locally)

### Option A: Docker Deployment (Fastest)
```bash
# 1. Clone and enter the project
cd InteractiveNovelDemo

# 2. Launch the full stack
docker-compose up --build
```
The platform will be available at `http://localhost:3000`.

### Option B: Manual Local Setup
**Backend:**
```bash
cd InteractiveNovelDemo/backend
npm install
# Create a .env file with:
# MONGODB_URI=mongodb://localhost:27017/interactive_novel
# OPENAI_API_KEY=your_key
# PINECONE_API_KEY=your_key
npm start
```

**Frontend:**
```bash
cd InteractiveNovelDemo/frontend
npm install
npm start
```

## ?? How to Use the Demo
1. **Authenticate**: Use any username/password to register/login.
2. **Interact**: Navigate through the story. When you encounter a `Code Playground` element, solve the technical challenge to trigger a "success" state.
3. **AI Reaction**: After a success, notice the AI Character (Elias/Priya) reacting based on the RAG pipeline.
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
