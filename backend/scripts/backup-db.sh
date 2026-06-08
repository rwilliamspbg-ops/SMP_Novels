#!/bin/bash
# Database Backup Script for PostgreSQL (v3.3)
# Automated backup with retention policy

set -e  # Exit on error

# Configuration
BACKUP_DIR="/var/backups/postgresql"
RETENTION_DAYS=7
DB_NAME="${DB_NAME:-interactive_novel}"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
COMPRESSION=true

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for this backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-${TIMESTAMP}.sql.gz"

echo "=================================================="
echo "📦 PostgreSQL Database Backup"
echo "   Database: $DB_NAME@${DB_HOST}"
echo "   Timestamp: ${TIMESTAMP}"
echo "   Retention: ${RETENTION_DAYS} days"
echo "=================================================="

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

# Create backup
echo "🔧 Creating database dump..."
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
else
    echo "❌ Backup creation failed"
    exit 1
fi

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📊 Backup size: ${BACKUP_SIZE}"

# Clean up old backups
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
echo "✅ Old backups removed"

# List current backups
echo ""
echo "📁 Current backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || echo "   No backups found"

echo ""
echo "=================================================="
echo "✅ Backup completed successfully!"
echo "=================================================="