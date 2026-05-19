#!/bin/bash
# SMP_Novels Redis Backup Script
# Upgraded: v2.0 (Automated Backups)

set -e

BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/redis-backup-$DATE.rdb"

echo "Starting Redis backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
docker exec smpnovels-redis-1 redis-cli BGSAVE 2>/dev/null || \
  echo "Warning: BGSAVE failed, but continuing..."

# Copy the RDB file
docker cp smpnovels-redis-1:/data/dump.rdb "$BACKUP_FILE" 2>/dev/null || \
  echo "Warning: RDB copy failed, but continuing..."

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "redis-backup-*.rdb" -mtime +7 -delete 2>/dev/null || true

echo "Redis backup completed: $BACKUP_FILE"
