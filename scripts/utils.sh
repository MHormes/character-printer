#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.production"

if [ -f "$ENV_FILE" ]; then
    export $(echo $(grep -v '^#' "$ENV_FILE" | xargs))
    TARGET_DOMAIN=$(echo "$NEXTAUTH_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
    WORKER_NAME="${CLOUDFLARE_WORKER_NAME:-maintenance-page}"
else
    echo "Error: .env.production missing at $ENV_FILE"
    exit 1
fi
