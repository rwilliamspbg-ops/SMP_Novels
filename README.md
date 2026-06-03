# 🌌 Cognoscent Echo Interactive Platform
**An AI-Orchestrated Narrative Experience**

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0--MVP-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
![Stack](https://img.shields.io/badge/stack-Fastify%20%7C%20React%20%7C%20WASM-orange)

The **Cognoscent Echo Interactive Platform** is a high-fidelity implementation of the *Cognoscent Echo* manuscript. It transforms a traditional novel into a living system where the reader acts as a protocol engineer, a legal arbiter, and a quantum analyst.

## 🚀 Core Features

### 🧠 Narrative Intelligence
- **Saga Plot Engine:** A state-machine based branching system that tracks `decisions_made` in JSONB format, ensuring precise narrative continuity.
- **AI Memory System:** Characters (Elias, Priya, Thorne) possess persistent memory of your choices, altering their dialogue and attitudes as the story progresses.

### 🛠️ Interactive Protocol Modules
- **Code Playground (Ch. 1):** Live Go/WASM execution environment for memory allocation and zero-copy pattern validation.
- **Governance DAO (Ch. 3 & 26):** Collective real-time voting system that determines the global state of the world.
- **Forensic Tool (Ch. 12):** Binary-diff analysis for tracing "Mirror Layer" shims in the ledger.
- **Security Audit (Ch. 14):** PR-style code review interface for detecting malicious PQC bypasses.
- **Quantum Simulator (Ch. 36):** High-pressure lattice resilience test with visual wave-form feedback.

### 🎬 Cinematic Experience
- **Glitch Aesthetic:** Dynamic CSS/JS visual distortions that trigger during "Dark Node" failures.
- **Generative Soundscape:** A Web Audio API-driven environment that shifts from corporate ambient hum to high-tension dissonance based on narrative stress.
- **Sovereign Epilogues:** Three distinct world-state endings (Sovereign, Corporate, Broken) based on aggregate global decisions.

## 🛠️ Technical Stack
- **Backend:** `Fastify` (Node.js), `PostgreSQL` (Planned for prod), `Redis` (Global Votes).
- **Frontend:** `React` / `Vanilla JS` Bridge, `Monaco Editor`, `Web Audio API`.
- **Logic:** `WASM` for simulations, `JSONB` for state tracking.

## 🗺️ Roadmap
- [x] **Phase 1: Foundation** (API, Basic Branching, AI Base)
- [x] **Phase 2: The Assault** (Forensics, PR Review, Global Governance, Quantum Sim)
- [x] **Phase 3: Convergence** (AI Memory, Glitch FX, Soundscape, Audit)
- [x] **Phase 4: Launch** (Final Epilogues, Deployment Manifest)
- [ ] **Future:** Full Integration with CopilotKit for AI-driven UI navigation.

## 📦 Quick Start
1. **Backend:**
   ```bash
   cd backend
   npm install
   node src/server_fastify.js
   ```
2. **Frontend:**
   Open `frontend/index.html` in a browser (ensure backend is running on port 3001).

## 📄 Documentation
- **Deployment:** See `DEPLOYMENT.md` for Vercel/Fly.io guides.
- **Narrative:** Refer to `backend/src/narrativeData.js` for the chapter graph.
