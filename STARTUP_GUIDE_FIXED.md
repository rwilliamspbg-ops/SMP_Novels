# 🚀 SMP_Novels - Quick Start Guide (FIXED)

**Date:** 2026-06-03
**Status:** ✅ ALL BUILD ISSUES RESOLVED

---

## ⚡ Fastest Way to Get Started

### Option 1: Docker Compose (Recommended)

```powershell
# Navigate to project root
cd "C:\Users\rwill\OneDrive\Desktop\SMP_Novels"

# Generate secure secrets (run once)
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Set-Content -Path .env -Value "JWT_SECRET=$jwtSecret"

# Deploy all services
docker-compose up --build -d

# View logs
docker-compose logs -f
```

### Option 2: Local Development

```powershell
# Backend (in separate terminal)
cd C:\Users\rwill\OneDrive\Desktop\SMP_Novels\backend
npm install
node src/server_fastify.js

# Frontend (in separate terminal)
cd C:\Users\rwill\OneDrive\Desktop\SMP_Novels\frontend
npm install
npx serve . -p 3000
```

---

## 📋 What Was Fixed

| Issue | Status | Details |
|-------|--------|---------|
| **MongoDB vs PostgreSQL** | ✅ FIXED | Removed all MongoDB references, now PostgreSQL-only |
| **Missing `server.js`** | ✅ CREATED | Simple fallback HTTP server created |
| **Hardcoded Secrets** | ✅ SECURED | Added secure secret generation commands |
| **Dockerfile Entry Points** | ✅ CORRECTED | Both backend/frontend use correct entry points |
| **npm ci vs npm install** | ✅ FIXED | Using `npm install` when no lock file exists |
| **Monaco Version Mismatch** | ✅ FIXED | Consistent versioning across all references |

---

## 🧪 Verify Installation

```bash
# Test backend health
curl http://localhost:3001/health

# Test frontend
curl http://localhost:3000
```

Expected output:
```json
{
  "name": "Cognoscent Echo API",
  "version": "1.0.0",
  "status": "running"
}
```

---

## 🔐 Generate Secure Secrets (One-Time Setup)

```powershell
# Generate JWT secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Set-Content -Path "backend\.env" -Value "JWT_SECRET=$jwtSecret"

# Generate database password
$dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
Set-Content -Path "backend\.env" -Value ([string]::Concatenate("DB_PASSWORD=$dbPassword"))
```

Or use OpenSSL:
```bash
export JWT_SECRET=$(openssl rand -hex 32)
export DB_PASSWORD=$(openssl rand -base64 24)
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Frontend (Port 3000)               │
│         Static Files + API Proxy Layer          │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP Requests
                 ▼
┌─────────────────────────────────────────────────┐
│           Backend API (Port 3001)               │
│    Fastify + PostgreSQL Connection Pool         │
│    - Narrative Engine                           │
│    - Saga State Management                      │
│    - Governance Voting                          │
└────────────────┬────────────────────────────────┘
                 │
                 │ SQL Queries
                 ▼
┌─────────────────────────────────────────────────┐
│         PostgreSQL Database (Port 5432)         │
│    - readers_progress table                     │
│    - governance_votes table                     │
│    - chapters table                             │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Next Steps

1. **Access the Application:** Open `http://localhost:3000` in your browser
2. **Test Narrative Flow:** Follow chapter 1 and make choices
3. **Monitor Logs:** `docker-compose logs -f`
4. **View Dashboard:** Check metrics at port 9090 if enabled

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Platform overview and features |
| `DEPLOYMENT.md` | Detailed deployment instructions |
| `FIX_SUMMARY.md` | Complete changelog of fixes |
| `docker-compose.yml` | Docker Compose configuration |
| `Makefile` | Build and deploy targets |

---

## 🆘 Troubleshooting

### Backend won't start:
```bash
# Check database connection
docker-compose exec postgres psql -U postgres -d interactive_novel -c "SELECT 1"

# View backend logs
docker-compose logs backend
```

### Frontend returns 404:
```bash
# Verify nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Restart frontend
docker-compose restart frontend
```

### CORS errors:
```bash
# Check ALLOWED_CORS_URLS in environment variables
docker-compose exec backend env | grep CORS
```

---

## 🛡️ Security Notes

- ✅ All secrets generated securely (never commit to git)
- ✅ PostgreSQL credentials configurable via environment
- ✅ Rate limiting enabled by default
- ✅ Helmet security headers applied
- ✅ Non-root user in containers

---

**Ready to launch!** 🎉

For detailed architecture and API documentation, see `README.md` and `DEPLOYMENT.md`.
