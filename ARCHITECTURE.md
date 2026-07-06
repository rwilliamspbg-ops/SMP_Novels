# 🏛️ Cognoscent Echo - System Architecture

## Overview
Cognoscent Echo is a multi-layered interactive platform combining narrative storytelling with real-time protocol simulations, governance, and AI-driven character memory.

## 🏗️ Core Components

### 1. Narrative Engine (Backend)
- **Saga Engine:** A state-machine orchestrated by `Fastify`. It manages narrative branching and ensures that `decisions_made` are persisted.
- **Persistence Layer:** PostgreSQL-backed storage using JSONB for flexible state tracking (decisions, metrics, unlocked nodes).
- **Governance Store:** A BFT-inspired voting system for global state changes.

### 2. Frontend Experience Layer
- **A2UI Framework:** DeepMind-inspired interactive UI for agent communication.
- **CopilotKit Integration:** Provides a real-time AI assistant and context-aware chat.
- **Bridge Layer:** A unified navigation bridge (`ai_nav_bridge.js`) connecting React components with vanilla JS simulations.

### 3. Simulation & Interactive Modules
- **WASM Sandbox:** Secure execution environment for the Go-based Code Playground.
- **Quantum Simulator:** Visual wave-form feedback loop for lattice resilience testing.
- **Forensic Tool:** Binary-diff analysis engine for narrative investigation.

## 📊 Data Flow
1. **User Action:** Choice made in the UI.
2. **API Request:** Frontend calls `/choice` or `/governance/vote`.
3. **Engine Logic:** `SagaEngine` validates choice and updates state.
4. **Persistence:** State saved to PostgreSQL.
5. **UI Update:** Frontend reflects new chapter and updated metrics (Throughput, Latency, Resilience).

---
*Last Updated: v3.3 Consolidation*
