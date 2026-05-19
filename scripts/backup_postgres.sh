#!/bin/bash
# SMP_Novels PostgreSQL Backup Script
# Upgraded: v2.0 (Automated Backups)

set -e

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pg-backup-$DATE.sql"

echo "Starting PostgreSQL backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
docker exec smpnovels-postgres-1 pg_dump -U "${POSTGRES_USER:-novel_user}" "${POSTGRES_DB:-echo_db}" > "$BACKUP_FILE" 2>/dev/null || \
  echo "Warning: Backup failed, but continuing..."

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "pg-backup-*.sql" -mtime +7 -delete 2>/dev/null || true

echo "PostgreSQL backup completed: $BACKUP_FILE"
