# Running the Application

This document covers the supported ways to run Character Printer: native local
development, local Docker Compose testing, and the production Docker profile.

## 1. Local Development - Next.js + SQLite

Use this for day-to-day development. The app runs directly on your machine with
Next.js, and data is stored in SQLite.

Prerequisites:

- Node.js 20+
- npm

Steps:

1. Create `.env.local` from `.env.local.example` and keep:

   ```bash
   NODE_ENV=development
   DB_DRIVER=sqlite
   DATABASE_URL=./dev.db
   NEXTAUTH_URL=http://localhost:3000
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Apply SQLite migrations:

   ```bash
   npm run db:migrate:dev
   ```

4. Seed D&D 5e SRD data when needed:

   ```bash
   npm run db:seed
   ```

   This runs the SQLite seeder in `lib/db/seed-srd-sqlite.ts`.

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

## 2. Local Docker Compose

Use this to test the deployment-like stack locally. Docker runs the app,
PostgreSQL, MinIO, and the MinIO bucket initializer.

Prerequisites:

- Docker Desktop or a Docker-compatible CLI
- `.env.development` present
- `.env.development` configured for PostgreSQL and MinIO

Run from Git Bash, WSL, Linux, or macOS:

```bash
./scripts/setup.sh development
```

The setup script will:

- Create named Docker volumes for PostgreSQL and MinIO if missing.
- Stop existing containers for the selected profile.
- Build and start the app, PostgreSQL, MinIO, and bucket initializer.
- Let the app container wait for PostgreSQL and MinIO.
- Apply PostgreSQL migrations.
- Seed SRD data on first run if the content tables are empty.
- Start the Next standalone server.

What runs:

| Container | Role | Default port |
| --- | --- | --- |
| `character_printer_app` | Next standalone app | `3000` |
| `character_printer_postgres` | PostgreSQL 17 | `5432` |
| `character_printer_minio` | S3-compatible object storage | `9000`, `9001` |
| `character_printer_minio_init` | One-shot bucket setup | none |

Useful URLs:

- App: `http://localhost:3000`
- MinIO console: `http://localhost:9001`
- MinIO API: `http://localhost:9000`

The default local bucket is `character-images`. The MinIO username and password
come from `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`.

## 3. Production Docker Profile

Use the production profile on a server after configuring `.env.production`.
It uses the same `docker-compose.yml` file with production values.

Run from Git Bash, WSL, Linux, or macOS:

```bash
./scripts/setup.sh production
```

Production notes:

- Replace all placeholder secrets in `.env.production`.
- Set `NEXTAUTH_URL` to the public application URL.
- Set `S3_PUBLIC_ENDPOINT` to the public storage endpoint if images will be
  accessed directly later.
- Consider removing host port exposure for PostgreSQL and MinIO when deploying
  behind a reverse proxy or private Docker network.
- Pin exact image tags once the deployment target is fixed.

## Troubleshooting

- To reset local Docker data, stop the stack and remove the selected profile's
  volumes, for example `character_printer_development_postgres_data` and
  `character_printer_development_minio_data`.
- If startup fails during seeding, confirm the app container has outbound
  network access to `raw.githubusercontent.com`.
- If MinIO login fails, use `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` from
  the active env file.
- If migrations fail, inspect app logs with `docker compose logs app`.
- Native dev reads `.env.local`; Docker local testing reads `.env.development`.
