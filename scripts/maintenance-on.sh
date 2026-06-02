#!/bin/bash
source "$(dirname "$0")/utils.sh"

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo "CLOUDFLARE_ZONE_ID not set. Skipping maintenance mode."
    exit 0
fi

echo "Enabling maintenance mode for $TARGET_DOMAIN..."
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/routes" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"pattern\":\"$TARGET_DOMAIN/*\",\"script\":\"$WORKER_NAME\"}")

if [ "$(echo "$RESPONSE" | jq -r '.success')" == "true" ]; then
    echo "Maintenance mode active."
else
    echo "Cloudflare error: $RESPONSE"
    exit 1
fi
