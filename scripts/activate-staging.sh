#!/bin/bash
# Run on a copied staging VM to switch from prod to staging config.
# Disables email, disables cache, rebuilds and restarts. Cloudflare routing
# to the staging hostname is handled by the shared cloudflared LXC, not by
# this script — update its tunnel config separately so staging.yourdomain.com
# points here.
#
# Prerequisites in .env.production:
#   NEXTAUTH_URL_STAGING=https://staging.yourdomain.com
#   NEXT_PRIVATE_SKIP_FETCH_CACHE=    ← must exist as an empty line (sed target)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.production"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

source <(grep -v '^#' "$ENV_FILE" | grep '=')

: "${NEXTAUTH_URL_STAGING:?NEXTAUTH_URL_STAGING not set in .env.production}"

sed -i \
    -e "s|^MAIL_PROVIDER=.*|MAIL_PROVIDER=disabled|" \
    -e "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=$NEXTAUTH_URL_STAGING|" \
    -e "s|^NEXT_PRIVATE_SKIP_FETCH_CACHE=.*|NEXT_PRIVATE_SKIP_FETCH_CACHE=1|" \
    "$ENV_FILE"

echo "Switched to staging config."
echo "  Email  : disabled"
echo "  Cache  : disabled"
echo "  URL    : $NEXTAUTH_URL_STAGING"
echo ""
echo "Restarting Docker Compose..."
cd "$SCRIPT_DIR/.."

APP_ENV_FILE="$ENV_FILE" \
COMPOSE_PROJECT_NAME="character-printer-production" \
POSTGRES_VOLUME_NAME="character_printer_production_postgres_data" \
AISTOR_VOLUME_NAME="character_printer_production_aistor_data" \
docker compose -f docker-compose.yml down

APP_ENV_FILE="$ENV_FILE" \
COMPOSE_PROJECT_NAME="character-printer-production" \
POSTGRES_VOLUME_NAME="character_printer_production_postgres_data" \
AISTOR_VOLUME_NAME="character_printer_production_aistor_data" \
docker compose -f docker-compose.yml --env-file "$ENV_FILE" up -d --build

echo ""
echo "Waiting for app container to be ready..."
APP_CONTAINER="${APP_CONTAINER_NAME:-character_printer_app}"
for i in $(seq 1 30); do
    if docker exec "$APP_CONTAINER" node -e "process.exit(0)" 2>/dev/null; then
        break
    fi
    sleep 2
done

echo "Seeding k6 stress test user..."
docker exec "$APP_CONTAINER" node scripts/seed-k6-user.mjs

echo ""
echo "Done. Staging running at $NEXTAUTH_URL_STAGING"
echo ""
echo "Verification:"
echo "  docker compose -f docker-compose.yml ps"
echo "  docker exec $APP_CONTAINER env | grep MAIL_PROVIDER"
echo "  docker exec $APP_CONTAINER env | grep NEXT_PRIVATE_SKIP_FETCH_CACHE"
