#!/bin/bash
# ─────────────────────────────────────────────────────────
# NigeriaTransfer — Database Backup to Cloudflare R2
# Runs daily at 03:00 WAT via system cron.
#
# Crontab entry:
# 0 3 * * * /opt/nigeriatransfer/scripts/backup-db.sh >> /var/log/nigeriatransfer/backup.log 2>&1
# ─────────────────────────────────────────────────────────

set -euo pipefail

# Configuration
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/tmp/db-backup"
DB_NAME="nigeriatransfer"
DB_USER="nigeriatransfer"
BUCKET="${R2_BACKUP_BUCKET_NAME:-nigeriatransfer-backups}"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"

echo "[$(date)] Starting database backup for ${DATE}"

# Create temp directory
mkdir -p "${BACKUP_DIR}"

# Dump and compress
echo "[$(date)] Running pg_dump..."
docker exec nigeriatransfer-db pg_dump -U "${DB_USER}" -Fc "${DB_NAME}" | gzip > "${BACKUP_DIR}/${DB_NAME}.sql.gz"

# Compute checksum
echo "[$(date)] Computing checksum..."
sha256sum "${BACKUP_DIR}/${DB_NAME}.sql.gz" > "${BACKUP_DIR}/${DB_NAME}.sql.gz.sha256"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${DB_NAME}.sql.gz" | cut -f1)
echo "[$(date)] Backup size: ${BACKUP_SIZE}"

# Upload to R2 (dated directory)
echo "[$(date)] Uploading to R2 (db/${DATE}/)..."
aws s3 cp "${BACKUP_DIR}/${DB_NAME}.sql.gz" "s3://${BUCKET}/db/${DATE}/" \
  --endpoint-url "${R2_ENDPOINT}" --quiet

aws s3 cp "${BACKUP_DIR}/${DB_NAME}.sql.gz.sha256" "s3://${BUCKET}/db/${DATE}/" \
  --endpoint-url "${R2_ENDPOINT}" --quiet

# Upload to R2 (latest directory for quick recovery)
echo "[$(date)] Uploading to R2 (db/latest/)..."
aws s3 cp "${BACKUP_DIR}/${DB_NAME}.sql.gz" "s3://${BUCKET}/db/latest/" \
  --endpoint-url "${R2_ENDPOINT}" --quiet

aws s3 cp "${BACKUP_DIR}/${DB_NAME}.sql.gz.sha256" "s3://${BUCKET}/db/latest/" \
  --endpoint-url "${R2_ENDPOINT}" --quiet

# Verify backup exists in R2
echo "[$(date)] Verifying backup in R2..."
VERIFY=$(aws s3 ls "s3://${BUCKET}/db/${DATE}/" --endpoint-url "${R2_ENDPOINT}" 2>&1 | grep -c "${DB_NAME}.sql.gz" || true)

if [ "${VERIFY}" -lt 1 ]; then
  echo "[$(date)] ERROR: Backup verification FAILED for ${DATE}"

  # Send alert
  if [ -n "${ALERT_WEBHOOK_URL}" ]; then
    curl -s -X POST "${ALERT_WEBHOOK_URL}" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"DB backup FAILED for ${DATE}. Backup file not found in R2.\"}" || true
  fi

  exit 1
fi

# Cleanup local temp files
rm -rf "${BACKUP_DIR}"

echo "[$(date)] Backup completed successfully: ${BACKUP_SIZE} uploaded to db/${DATE}/"
echo "[$(date)] To restore: aws s3 cp s3://${BUCKET}/db/latest/${DB_NAME}.sql.gz - --endpoint-url ${R2_ENDPOINT} | gunzip | pg_restore -U ${DB_USER} -d ${DB_NAME}"
