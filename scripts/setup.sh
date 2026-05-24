#!/bin/bash

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

if [ ! -f "minio.license" ]; then
  echo "minio.license not found. Obtain a free license at https://min.io/signup and place it at the project root." >&2
  exit 1
fi

if [ "$PROFILE" = "development" ]; then
  COMPOSE_FILE="docker-compose-dev.yml"
else
  COMPOSE_FILE="docker-compose.yml"
fi

export APP_ENV_FILE="$ENV_FILE"
export COMPOSE_PROJECT_NAME="character-printer-$PROFILE"
export POSTGRES_VOLUME_NAME="character_printer_${PROFILE}_postgres_data"
export AISTOR_VOLUME_NAME="character_printer_${PROFILE}_aistor_data"

# Load env vars into shell for bucket init below
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo "Using profile: $PROFILE"
echo "Environment: $ENV_FILE"

docker volume create "$POSTGRES_VOLUME_NAME" >/dev/null
docker volume create "$AISTOR_VOLUME_NAME" >/dev/null

echo "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

echo "Building and starting containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo "Waiting for AIStor (10s)..."
sleep 10

echo "Configuring AIStor bucket..."
AISTOR_CONTAINER="${AISTOR_CONTAINER_NAME:-character_printer_aistor}"
S3_BUCKET_NAME="${S3_BUCKET:-character-images}"
APP_URL="${NEXTAUTH_URL:-http://localhost:3000}"
ACCESS_KEY="${S3_ACCESS_KEY_ID:-character-printer}"
SECRET_KEY="${S3_SECRET_ACCESS_KEY:-character-printer-secret}"

docker exec "$AISTOR_CONTAINER" sh -c "
  mc alias set local http://localhost:9000 '${ACCESS_KEY}' '${SECRET_KEY}' && \
  mc mb --ignore-existing local/'${S3_BUCKET_NAME}' && \
  printf '<?xml version="1.0" encoding="UTF-8"?><CORSConfiguration><CORSRule><AllowedOrigin>%s</AllowedOrigin><AllowedMethod>GET</AllowedMethod><AllowedMethod>PUT</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedHeader>*</AllowedHeader><ExposeHeader>ETag</ExposeHeader><MaxAgeSeconds>3000</MaxAgeSeconds></CORSRule></CORSConfiguration>' "${APP_URL}" > /tmp/cors.xml && \
  mc cors set local/'${S3_BUCKET_NAME}' /tmp/cors.xml && \
  mc anonymous set none local/'${S3_BUCKET_NAME}'
"

echo "System is starting for profile '$PROFILE'."
echo "App: http://localhost:${APP_PORT:-3000}"
echo "AIStor console: http://localhost:${AISTOR_CONSOLE_PORT:-9001}"
