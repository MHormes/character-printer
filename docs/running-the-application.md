# Running the Application

This document covers the three ways to run Character Printer: locally with pnpm and SQLite, locally with Docker Compose, and in production with the production Docker Compose.

---

## Data & Storage Overview

The application has two data sources that need to be present for a functioning environment:

| Source | What | Where |
|--------|------|--------|
| **Database** | Users, characters, SRD content | PostgreSQL (Docker) or SQLite (local) |
| **Storage** | Character images | AIStor/S3 (Docker) or `.local-storage/` (local) |

### How seeding works

SRD content and database migrations are applied automatically when the app container starts via `scripts/bootstrap.mjs`. The logic is safe to re-run — it only seeds content tables if they are empty.

---

## 1. Local Development — pnpm + SQLite

Recommended for day-to-day development. Next.js runs natively via pnpm and uses a local SQLite file as the database — no PostgreSQL, AIStor, or Docker required.

**Prerequisites:**

- Node.js 22+
- pnpm installed (`npm install -g pnpm`)

**Steps:**

1. Copy the environment file:

   ```bash
   cp .env.local.example .env.local
   ```

   The default values (`DB_DRIVER=sqlite`, `DATABASE_URL=./dev.db`) work out of the box.

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Apply SQLite migrations:

   ```bash
   pnpm db:migrate:dev
   ```

4. Seed D&D 5e SRD data on first run:

   ```bash
   pnpm db:seed
   ```

5. Start the dev server:

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

Character image uploads work in this native local mode without AIStor. Uploaded files are stored under `.local-storage/`, which is gitignored. The character JSON stores the same durable object key shape used by S3, so switching to Docker or production storage does not require a schema change.

---

## 2. Local Docker Compose

Spins up the full stack (Next.js app, PostgreSQL, AIStor) using `docker-compose-dev.yml`. Useful for testing the containerized environment without touching production.

**Prerequisites:**

- Docker Desktop (or Podman with Docker-compatible CLI)
- `.env.development` present and configured for PostgreSQL and AIStor
- `minio.license` present at the project root (free license: https://min.io/signup)

**Steps:**

1. Run the setup script with the `development` profile:

   ```bash
   bash scripts/setup.sh development
   ```

   The script:
   - Creates named Docker volumes for PostgreSQL and AIStor if missing
   - Stops any running local containers
   - Builds and starts all containers
   - Configures the AIStor bucket and CORS policy
   - Migrations and SRD seeding run automatically when the app container starts

2. The app is available at [http://localhost:3000](http://localhost:3000).
   The AIStor console is available at [http://localhost:9001](http://localhost:9001).

**What runs:**

| Container | Role | Port(s) |
| --- | --- | --- |
| `character_printer_app` | Next.js standalone app | `3000` |
| `character_printer_postgres` | PostgreSQL 17 | `5432` |
| `character_printer_aistor` | AIStor (S3-compatible) | `9000`, `9001` |

> The local compose builds from the Dockerfile, so it reflects the exact production image. Code changes require a rebuild (`bash scripts/setup.sh development`).

---

## 3. Production Docker Compose

The production setup (`docker-compose.yml`) runs on the server and adds a Cloudflare Tunnel container for public HTTPS access. The database and AIStor ports are not exposed to the host — all traffic goes through the tunnel.

**Prerequisites:**

- `.env.production` configured on the server
- Valid `CLOUDFLARE_TUNNEL_TOKEN` in `.env.production`
- Docker installed on the server
- `minio.license` present at the project root

**Steps:**

1. Pull the latest code (use the `char-pull` alias):

   ```bash
   git pull origin main
   ```

2. Run the setup script with the `production` profile:

   ```bash
   bash scripts/setup.sh production
   ```

   The script:
   - Creates production volumes (`character_printer_production_postgres_data`, `character_printer_production_aistor_data`) if missing
   - Stops existing containers
   - Builds and starts all containers
   - Configures the AIStor bucket and CORS policy
   - Migrations and SRD seeding run automatically when the app container starts

**What runs:**

| Container | Role |
| --- | --- |
| `character_printer_app` | Next.js standalone app |
| `character_printer_postgres` | PostgreSQL 17 |
| `character_printer_aistor` | AIStor (S3-compatible) |
| `character_printer_tunnel` | Cloudflare Tunnel (HTTPS) |

> The database and AIStor are not exposed on any host port in production — they are only reachable from within the Docker network.

---

## Moving to a New Server

To migrate to a new server or do a clean production re-init after a server wipe:

1. **Get a backup** — use `char-data` on your laptop to copy the latest backup from the server, or grab the latest timestamped folder from `backups/` on the old server.

2. **Stage the backup** — the `copy_backup.sh` script offers to stage the data automatically. Or copy manually:
   - CSV files from `backup/csv/` into `database/data/`
   - Images from `backup/storage/` into `database/storage/`

3. **Deploy** — run `bash scripts/setup.sh production` (or `char-deploy` on the server). On first boot, `bootstrap.mjs` seeds the database from the staged data. No manual database import or AIStor upload needed.

---

## Aliases

Shell aliases are configured on both the laptop and the server to speed up common operations.

### Laptop Aliases

| Alias | Description |
| --- | --- |
| `char-connect` | Open an SSH connection to the Character Printer VM. |
| `char-data` | Runs `scripts/copy_backup.sh` — SSHs in, finds the latest backup, confirms, downloads it to `~/Desktop/CharacterPrinterBackups/`. Optionally stages `csv/` into `database/data/` and `storage/` into `database/storage/` for a local Docker seed. |
| `char-up` | Build and start the local Docker stack (PostgreSQL + AIStor) via `scripts/setup.sh development`. |

### Server Aliases

| Alias | Description |
| --- | --- |
| `char-pull` | Pull the latest changes from Git. |
| `char-deploy` | Run `setup.sh` and deploy the current pull. |
| `char-backup` | Run `backup.sh` — exports all database tables to CSV and mirrors the AIStor bucket, then removes the oldest backup keeping the 3 most recent. |

### VM OS Updates

`scripts/vm-update.sh` automates the monthly OS update cycle. Run it from the project root on the server:

```bash
sudo bash scripts/vm-update.sh
```

It runs `apt update && apt upgrade -y`. If a kernel update requires a reboot, it automatically enables the Cloudflare maintenance page via `scripts/maintenance-on.sh` before rebooting. If no reboot is needed, it exits cleanly with zero downtime.

After a reboot the Docker containers come back up automatically (`restart: unless-stopped`). The `@reboot` cron entry below re-disables maintenance mode once the system is back.

### Cloudflare Maintenance Scripts

Three helper scripts in `scripts/` manage the Cloudflare maintenance page independently of deployment:

| Script | Purpose |
| --- | --- |
| `scripts/maintenance-on.sh` | Creates a Cloudflare Worker route that serves the maintenance page |
| `scripts/maintenance-off.sh` | Deletes the Worker route, restoring normal traffic |
| `scripts/utils.sh` | Sourced by the above; loads `.env.production` and derives domain + worker name |

These are also called by `scripts/setup.sh production` around the build/restart cycle.

### Server Cron Jobs

```cron
# Nightly database and storage backup at 02:00
0 2 * * * /path/to/character-printer/scripts/backup.sh

# Re-enable site after a VM reboot triggered by vm-update.sh
@reboot sleep 30 && /path/to/character-printer/scripts/maintenance-off.sh
```

Each backup creates a timestamped folder under `backups/` containing:

- `csv/` — every database table exported as a CSV file
- `storage/` — a full mirror of the AIStor `character-images` bucket

A maximum of 3 backups are retained; older ones are deleted automatically.
