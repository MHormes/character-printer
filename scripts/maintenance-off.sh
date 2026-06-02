#!/bin/bash
source "$(dirname "$0")/utils.sh"

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo "CLOUDFLARE_ZONE_ID not set. Skipping maintenance mode."
    exit 0
fi

echo "Disabling maintenance mode for $TARGET_DOMAIN..."
ROUTE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/routes" \
                -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | \
                jq -r ".result[] | select(.pattern==\"$TARGET_DOMAIN/*\") | .id")

if [ ! -z "$ROUTE_ID" ] && [ "$ROUTE_ID" != "null" ]; then
    curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/routes/$ROUTE_ID" \
         -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" > /dev/null
    echo "Site is live."
else
    echo "No active maintenance route found for $TARGET_DOMAIN."
fi
