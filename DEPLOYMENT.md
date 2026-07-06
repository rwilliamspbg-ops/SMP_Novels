# 🚀 Cognoscent Echo - Deployment Guide

## 🐳 Docker Deployment (Recommended)
The platform is fully containerized using Docker Compose.

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d --build
```

### Services
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Database:** PostgreSQL on port 5432

## 🛠️ Manual Setup

### 1. Database (PostgreSQL)
1. Install PostgreSQL 15+.
2. Create database `interactive_novel`.
3. Run `backend/init-db.sql` to initialize schema.

### 2. Backend
```bash
cd backend
npm install
node src/server_fastify.js
```

### 3. Frontend
```bash
cd frontend
npm install
node server.js
```

## ⚙️ Environment Variables
Copy `.env.example` to `.env` and configure as needed.

---
*Last Updated: v3.3 Consolidation*
