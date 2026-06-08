# Database Backup & Recovery Procedures (v3.3)

## Overview

This document provides complete procedures for backing up and restoring the SMP_Novels PostgreSQL database, ensuring data protection and operational continuity.

---

## 📦 Automated Backups

### Configuration
- **Schedule**: Daily at 2:00 AM UTC (`0 2 * * *`)
- **Retention**: 7 days
- **Location**: `/var/backups/postgresql/`
- **Compression**: gzip (default)

### Backup Command
```bash
pg_dump -h localhost -U postgres interactive_novel | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

### Running Manual Backup
```bash
cd /var/backups/postgresql
./backup-db.sh
```

**Expected Output:**
```
==================================================
📦 PostgreSQL Database Backup
   Database: interactive_novel@localhost
   Timestamp: 20260604-143022
   Retention: 7 days
==================================================
✅ Backup created successfully: backup-20260604-143022.sql.gz
📊 Backup size: 15M
🧹 Cleaning up backups older than 7 days...
✅ Old backups removed
==================================================
```

---

## 💾 Database Schema

### Tables Overview

| Table | Purpose | Size (approx) |
|-------|---------|---------------|
| `readers_progress` | Player progress & state | ~50 MB |
| `governance_votes` | DAO voting records | ~10 MB |
| `chapters` | Story content | ~2 MB |
| `narrative_events` | Immutable event log | ~5 MB |

### Total Estimated Size: ~67 MB (grows with usage)

---

## 🔄 Recovery Procedures

### Point-in-Time Recovery (Full Restore)

**When to use**: After accidental deletion, corruption, or needing to restore from a known good backup.

#### Step 1: Stop Application
```bash
docker-compose down
```

#### Step 2: Drop Existing Database (WARNING: destroys all data!)
```bash
psql -h localhost -U postgres -c "DROP DATABASE interactive_novel;"
```

#### Step 3: Recreate Database
```bash
psql -h localhost -U postgres -c "CREATE DATABASE interactive_novel;"
```

#### Step 4: Restore from Backup
```bash
gunzip -c backup-20260603-143022.sql.gz | psql -h localhost -U postgres interactive_novel
```

#### Step 5: Restart Application
```bash
docker-compose up -d --build
```

---

### Emergency Recovery (Database Corruption)

If database is corrupted and won't connect:

#### Step 1: Try with older backup
```bash
# Find most recent working backup
ls -lt /var/backups/postgresql/*.sql.gz | head -3
```

#### Step 2: Restore using oldest available backup
```bash
gunzip -c /var/backups/postgresql/backup-20260601.sql.gz | psql interactive_novel
```

---

### Selective Table Recovery

If only one table was affected:

```bash
# Extract specific table from backup
psql interactive_novel < backup-20260603-143022.sql

# This will restore all tables - use with caution!
```

**Note**: PostgreSQL doesn't support selective table recovery from compressed dumps without advanced tools.

---

## 🚨 Incident Response Guide

### Scenario 1: Wrong Choice Made (Last 5 minutes)
**Solution**: Use SagaEngine rollback capability or reset user progress via API

```bash
# Via API endpoint
curl -X POST http://localhost:3001/admin/reset/user-id-xxx \
  -H "Authorization: Bearer <admin-token>"
```

### Scenario 2: Data Corruption (Last hour)
**Solution**: Restore from backup taken within last hour

```bash
# Find most recent backup
ls -lt /var/backups/postgresql/*.sql.gz | head -1
```

### Scenario 3: Server Crash with No Recent Backup
**Solution**: Check database logs for automatic checkpoints, or use WAL replay if available

```bash
# PostgreSQL automatic checkpoint info
pg_ls_ctls() {
    # Shows when last checkpoint was taken
}
```

---

## 📊 Backup Verification

### Verify Backup Integrity
```bash
cd /var/backups/postgresql
gunzip -t backup-$(ls -t *.sql.gz | head -1 | cut -d'_' -f2).sql.gz
echo "✅ Backup is valid" || echo "❌ Backup is corrupted"
```

### Test Restore in Isolated Container
```bash
docker run --rm -it \
  --link cognoscent-postgres:postgres \
  -e PGHOST=postgres \
  -e PGPASSWORD=postgres \
  postgres:15-alpine sh

# Inside container
gunzip -c /var/backups/postgresql/backup-latest.sql.gz | psql interactive_novel
```

---

## 📋 Maintenance Schedule

### Daily (Automated)
- [x] Create backup at 2:00 AM UTC
- [ ] Verify backup file exists and is < 100MB
- [ ] Remove backups older than 7 days

### Weekly (Manual Check)
- [ ] Test restore procedure in staging environment
- [ ] Review database size growth trends
- [ ] Check disk space: `df -h /var/backups/postgresql`

### Monthly
- [ ] Rotate backup location if needed
- [ ] Update retention policy based on storage costs
- [ ] Document any schema changes for migration planning

---

## 🔧 Monitoring Commands

### Check Latest Backup Age
```bash
ls -lt /var/backups/postgresql/*.sql.gz | head -1 | awk '{print $6, $7, $8}'
```

### Monitor Database Size
```bash
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Active Connections
```bash
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections
FROM pg_stat_activity;
```

---

## 🆘 Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Database Admin | dba@echo-platform.com | Schema changes, restores |
| On-Call Engineer | oncall@echo-platform.com | Incident response |
| Platform Team | platform@echo-platform.com | Backup policy decisions |

---

## 📝 Change Log

### v3.3 (2026-06-04)
- Added automated daily backup script
- Implemented 7-day retention policy
- Added verification procedures
- Created recovery runbooks

### v3.2 (2026-06-03)
- Initial database schema with event sourcing
- Governance votes persistence

---

**Last Updated:** 2026-06-04  
**Version:** 3.3  
**Next Review:** Quarterly or after major incidents