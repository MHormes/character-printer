#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

echo "Waiting for PostgreSQL..."
until node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('select 1').then(() => pool.end()).then(() => process.exit(0)).catch(() => process.exit(1));
"; do
  sleep 1
done

echo "Waiting for MinIO..."
until node -e "
fetch(process.env.S3_ENDPOINT + '/minio/health/live').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1));
"; do
  sleep 1
done

echo "Running application bootstrap..."
node scripts/bootstrap.mjs

echo "Starting Next server..."
exec node server.js
