#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

PROFILE="${1:-development}"
if [ "$PROFILE" != "development" ] && [ "$PROFILE" != "production" ]; then
  echo "Profile must be 'development' or 'production'." >&2
  exit 1
fi

ENV_FILE=".env.$PROFILE"
if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file '$ENV_FILE' was not found." >&2
  exit 1
fi

export APP_ENV_FILE="$ENV_FILE"
export COMPOSE_PROJECT_NAME="character-printer-$PROFILE"
export POSTGRES_VOLUME_NAME="character_printer_${PROFILE}_postgres_data"
export MINIO_VOLUME_NAME="character_printer_${PROFILE}_minio_data"

echo "Using profile: $PROFILE"
echo "Environment: $ENV_FILE"

docker volume create "$POSTGRES_VOLUME_NAME" >/dev/null
docker volume create "$MINIO_VOLUME_NAME" >/dev/null

echo "Stopping existing containers..."
docker compose --env-file "$ENV_FILE" down

echo "Building and starting containers..."
docker compose --env-file "$ENV_FILE" up -d --build

echo "System is starting for profile '$PROFILE'."
echo "App: http://localhost:${APP_PORT:-3000}"
echo "MinIO console: http://localhost:${MINIO_CONSOLE_PORT:-9001}"
