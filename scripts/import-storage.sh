#!/bin/bash
# Imports images from a backup storage/ folder into AIStor.
# Usage: bash scripts/import-storage.sh [backup-dir]
# If no backup-dir given, uses the most recent backup under backups/

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$BASE_DIR/../.env.production"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Error: $ENV_FILE not found." >&2
  exit 1
fi

S3_CONTAINER="${AISTOR_CONTAINER_NAME:-character_printer_aistor}"
ACCESS_KEY="${S3_ACCESS_KEY_ID}"
SECRET_KEY="${S3_SECRET_ACCESS_KEY}"
S3_BUCKET_NAME="${S3_BUCKET:-character-images}"
BACKUP_BASE_DIR="$BASE_DIR/../backups"

if [ -n "$1" ]; then
  STORAGE_DIR="$1/storage"
else
  LATEST=$(ls -dt "$BACKUP_BASE_DIR"/*/ 2>/dev/null | head -1)
  if [ -z "$LATEST" ]; then
    echo "Error: No backups found in $BACKUP_BASE_DIR" >&2
    exit 1
  fi
  STORAGE_DIR="$LATEST/storage"
fi

if [ ! -d "$STORAGE_DIR" ]; then
  echo "Error: Storage dir not found: $STORAGE_DIR" >&2
  exit 1
fi

echo "Importing images from $STORAGE_DIR into AIStor bucket '$S3_BUCKET_NAME'..."

# Copy local storage dir into the container's tmp, then mc cp to bucket
docker cp "$STORAGE_DIR/." "$S3_CONTAINER:/tmp/import_storage/"
docker exec "$S3_CONTAINER" sh -c \
  "mc alias set local http://localhost:9000 '${ACCESS_KEY}' '${SECRET_KEY}' > /dev/null && \
   mc mb --ignore-existing local/'${S3_BUCKET_NAME}' && \
   mc cp --recursive /tmp/import_storage/ local/'${S3_BUCKET_NAME}'/ && \
   rm -rf /tmp/import_storage"

echo "Done."
