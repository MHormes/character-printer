#!/bin/bash

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$BASE_DIR/../.env.production"

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Error: $ENV_FILE not found." >&2
  exit 1
fi

BACKUP_BASE_DIR="$BASE_DIR/../backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$TIMESTAMP"
DB_CONTAINER="${POSTGRES_CONTAINER_NAME:-character_printer_postgres}"
S3_CONTAINER="${AISTOR_CONTAINER_NAME:-character_printer_aistor}"
DB_NAME="${POSTGRES_DB:-character_printer}"
DB_USER="${POSTGRES_USER:-character_printer}"
ACCESS_KEY="${S3_ACCESS_KEY_ID}"
SECRET_KEY="${S3_SECRET_ACCESS_KEY}"
S3_BUCKET_NAME="${S3_BUCKET:-character-images}"

mkdir -p "$BACKUP_DIR/csv"
mkdir -p "$BACKUP_DIR/storage"

echo "Starting backup to $BACKUP_DIR..."

# --- 1. Export database tables to CSV ---
echo "Exporting database tables to CSV..."

if [ "${DB_DRIVER:-sqlite}" = "postgres" ]; then
  # PostgreSQL: use native COPY command via psql in container
  TABLES=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != '__drizzle_migrations';")

  for TABLE in $TABLES; do
    echo "   -> Exporting $TABLE..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
      -c "COPY $TABLE TO STDOUT WITH (FORMAT CSV, HEADER);" > "$BACKUP_DIR/csv/$TABLE.csv"
  done
else
  # SQLite: use Node export script
  echo "   SQLite detected — exporting via tsx..."
  cd "$BASE_DIR/.." && pnpm tsx lib/db/export-csv.ts --output "$BACKUP_DIR/csv"
fi

# --- 2. Mirror AIStor bucket ---
echo "Mirroring AIStor bucket ($S3_BUCKET_NAME)..."
docker exec "$S3_CONTAINER" sh -c \
  "mc alias set local http://localhost:9000 '${ACCESS_KEY}' '${SECRET_KEY}' > /dev/null && mc mirror local/'${S3_BUCKET_NAME}' /tmp/backup_mirror"
docker cp "$S3_CONTAINER:/tmp/backup_mirror/." "$BACKUP_DIR/storage/"
docker exec "$S3_CONTAINER" rm -rf /tmp/backup_mirror

# --- 3. Verify and rotate ---
if [ "$(ls -A "$BACKUP_DIR")" ]; then
  echo "Backup complete at $(date)"
  echo "CSV:     $BACKUP_DIR/csv"
  echo "Storage: $BACKUP_DIR/storage"

  cd "$BACKUP_BASE_DIR" || exit
  echo "Pruning old backups (keeping 3 most recent)..."
  ls -dt */ | tail -n +4 | xargs -I {} rm -rf "{}"
  echo "Done."
else
  echo "Error: Backup directory is empty. No old backups pruned." >&2
  exit 1
fi
