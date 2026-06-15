# Print2Play — Monthly Update Guide

Run after server OS updates are done (see global `update_guide.md`). Do all steps locally first, then deploy once at the end.

---

## 1. Docker version bumps

**`Dockerfile`** — check for updates:

- Node.js base image (`FROM node:x-alpine`) — check latest LTS: https://hub.docker.com/_/node/tags
- pnpm via corepack (`pnpm@x`) — check latest: https://github.com/pnpm/pnpm/releases

**`docker-compose.yml`** — check for updates:

- `postgres` — `postgres:x-alpine` — bump patch/minor freely; major needs migration check
- `tunnel` — `cloudflare/cloudflared:latest` — always pulls latest, nothing to pin
- `aistor` — `quay.io/minio/aistor/minio:latest` — always pulls latest, nothing to pin

> **Major version bumps** (Node LTS major, Postgres major) — read changelog first, don't just bump.

---

## 2. Node packages (pnpm)

Check what is outdated:

```bash
pnpm outdated
```

Update within allowed constraints:

```bash
pnpm update
```

To update a single package past its semver constraint:

```bash
pnpm update <package-name> --latest
```

---

## 3. Local build & test

```bash
pnpm build
```

- [ ] Build succeeds with no errors
- [ ] App loads in browser, no JS console errors
- [ ] Core features work as expected

---

## 4. Push & deploy

Push all changes to git, then:

```bash
char-pull
char-deploy
```

> Check container logs if anything seems off: `docker compose logs -f`

---

## 5. Delete VM snapshot

Deploy confirmed working? Delete the Proxmox snapshot taken before this update cycle.

In Proxmox UI: select the VM → Snapshots → delete. Or via CLI:

```bash
qm delsnapshot <VMID> <snapshot-name>
```

Do not skip this — snapshots grow over time and degrade disk performance.

---

## Rollback

If something breaks after `pnpm update`:

```bash
git checkout pnpm-lock.yaml
pnpm install
```

---

## Occasional: Node version upgrade

Node LTS releases a new major version each October. When upgrading:

1. Update `FROM node:x-alpine` in `Dockerfile` (all three build stages)
2. Update corepack line: `corepack prepare pnpm@x --activate` (both deps and builder stages)
3. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   pnpm build
   ```

## Occasional: pnpm version upgrade

Update the corepack line in `Dockerfile` (both deps and builder stages) and the `packageManager` field in `package.json`, then reinstall.
