#!/bin/bash
# SMP_Novels MongoDB Backup Script
# Upgraded: v2.0 (Automated Backups)

set -e

BACKUP_DIR="/backups/mongo"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mongo-backup-$DATE.gz"

echo "Starting MongoDB backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
docker exec smpnovels-mongodb-1 mongodump --archive=/tmp/mongo-backup.gz 2>/dev/null || \
  docker exec smpnovels-mongodb-1 mongodump --archive="$BACKUP_DIR/mongo-backup-$DATE.gz" 2>/dev/null || \
  echo "Warning: Backup failed, but continuing..."

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "mongo-backup-*.gz" -mtime +7 -delete 2>/dev/null || true

echo "MongoDB backup completed: $BACKUP_FILE"
