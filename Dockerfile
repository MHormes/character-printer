FROM node:20-bookworm-slim AS deps

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@11 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DB_DRIVER=postgres
ENV DATABASE_URL=postgresql://character_printer:character_printer@postgres:5432/character_printer
ENV NEXTAUTH_SECRET=build-time-placeholder
ENV NEXTAUTH_URL=http://localhost:3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && corepack prepare pnpm@11 --activate
RUN pnpm run build:container

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib/db/bootstrap.mjs ./lib/db/bootstrap.mjs
COPY --from=builder /app/lib/db/seed-srd-postgres.mjs ./lib/db/seed-srd-postgres.mjs
COPY --from=builder /app/lib/db/migrations/pg ./lib/db/migrations/pg

RUN chmod +x ./scripts/start.sh \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

CMD ["sh", "./scripts/start.sh"]
