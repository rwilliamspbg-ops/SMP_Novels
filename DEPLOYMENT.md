# 🚀 Deployment & Production Manifest
**Cognoscent Echo Interactive Platform v1.0.0**

## 🏗️ Architecture
The platform is split into a **State-Driven Backend** and a **Cinematic Frontend**.

### Backend (API Layer)
- **Runtime:** Fastify (Node.js)
- **Key Modules:**
  - `sagaEngine.js`: Manages reader progress and narrative branching.
  - `aiEngine.js`: Memory-aware dialogue generation.
  - `governanceData.js`: Global state for the Dissent Vote.
  - `epilogues.js`: Final world-state resolutions.

### Frontend (Experience Layer)
- **Runtime:** React-Bridge (Vanilla JS + React Components).
- **Core Utilities:**
  - `bridge.js`: API communication layer.
  - `cinematics.js`: Manages sound and glitch effects.
  - `interactiveElements.js`: Root registry for all puzzle modules.

## 🌐 Deployment Strategy

### 1. Backend (Fly.io)
- **Target:** `fly.io` (Region: ams / nyc)
- **Command:** `fly deploy`
- **Environment Variables:**
  - `PORT=3001`
  - `AI_API_KEY=...` (For production LLM integration)

### 2. Frontend (Vercel)
- **Target:** `vercel.com`
- **Build Command:** `npm run build` (if using React build step)
- **Environment Variables:**
  - `VITE_API_BASE=https://echo-api.fly.dev`

## 🛠️ Maintenance & Audit
To verify narrative integrity after adding new chapters:
```bash
node backend/src/audit_narrative.js
```
This script ensures no "dead-ends" exist and all chapters are reachable from the prologue.
