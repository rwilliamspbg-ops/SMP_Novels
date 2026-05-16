# 🌌 Cognoscent Echo Interactive Platform
A concise guide for running, developing, and contributing to the project.

<!-- Badges: CI, release, issues, PRs, dependabot, repo stats -->
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/rwilliamspbg-ops/SMP_Novels/pr-ci.yml?branch=main&label=PR%20CI)
![Release](https://img.shields.io/github/v/release/rwilliamspbg-ops/SMP_Novels)
![Last Commit](https://img.shields.io/github/last-commit/rwilliamspbg-ops/SMP_Novels)
![Issues](https://img.shields.io/github/issues/rwilliamspbg-ops/SMP_Novels)
![Pull Requests](https://img.shields.io/github/issues-pr/rwilliamspbg-ops/SMP_Novels)
![Dependabot Alerts](https://img.shields.io/github/dependabot/alerts/rwilliamspbg-ops/SMP_Novels)
![Repo Size](https://img.shields.io/github/repo-size/rwilliamspbg-ops/SMP_Novels)
![Code Size](https://img.shields.io/github/languages/code-size/rwilliamspbg-ops/SMP_Novels)
![Top Language](https://img.shields.io/github/languages/top/rwilliamspbg-ops/SMP_Novels)
![Stars](https://img.shields.io/github/stars/rwilliamspbg-ops/SMP_Novels)
![Forks](https://img.shields.io/github/forks/rwilliamspbg-ops/SMP_Novels)
![License](https://img.shields.io/github/license/rwilliamspbg-ops/SMP_Novels)
![Node.js](https://img.shields.io/badge/node-18%2B-green)

Overview
--------
An AI-orchestrated interactive narrative platform that transforms a novel into a branching, stateful experience with AI-driven characters, governance, and simulation modules.

Quick links
-----------
- Code: [backend/](backend) and [frontend/](frontend)
- Docker compose: [docker-compose.yml](docker-compose.yml)
- Environment example: [.env.example](.env.example)
- Tests & checks: `backend/src/test_suite.js`, `backend/src/edge_case_tests.js`

Prerequisites
-------------
- Node.js 18+ (for local dev)
- Docker & Docker Compose (for full stack local runs)
- Optional: `gh` and `docker` CLI if using automation in this repo

Local development (quick)
-------------------------
1. Copy environment placeholders:

```bash
cp .env.example .env
# Edit .env to add secrets and endpoints
```

2. Start dependent services with Docker (optional, recommended for full integration):

```bash
docker-compose up --build -d
```

3. Backend (run locally without Docker):

```bash
cd backend
npm install
# Validate required env vars
npm run check-env
# Start server
node src/server_fastify.js
```

4. Frontend (static):

- Open `frontend/index.html` in your browser, or run the containerized frontend via docker-compose.

Docker / Compose
-----------------
- `docker-compose.yml` provides local services including `mongodb`, `postgres`, `redis`, `backend`, and `frontend`.
- Use `.env` for runtime secrets (do not commit `.env`). See `.env.example` for required keys.

Tests & checks
--------------
- Basic unit/integration test files live in `backend/src/`:
  - `test_suite.js`, `test_suite_lite.js`, `edge_case_tests.js`, `test_lite_final.js`.
- CI: A PR workflow runs a lightweight env check and `npm audit` on backend/frontend. See `.github/workflows/pr-ci.yml`.

Security notes
--------------
- Secrets must be set via `.env` or a secret manager; the code now errors on missing required secrets.
- Docker images were updated to run non-root users; ensure production images are hardened further before deploy.

Available commands
------------------
- `cd backend && npm run check-env` — verify required environment variables.
- `cd backend && node src/server_fastify.js` — start the backend server.
- `docker-compose up --build` — build and start local stack.
- `node backend/src/edge_case_tests.js` — run integration checks (requires Postgres/Redis).

Contributing
------------
- Please run the PR checks (CI) before opening a PR. Add tests for new features and avoid committing secrets.
- To propose changes, open a PR and reference the remediation checklist in the security PR.

More docs
---------
- Deployment details: [DEPLOYMENT.md](DEPLOYMENT.md)
- Developer notes & narrative graph: `backend/src/narrativeData.js`

License
-------
MIT — see `LICENSE`.

