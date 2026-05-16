FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── installer ──────────────────────────────────────────────────────────────────
FROM base AS installer
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile

# ── builder ────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=installer /app ./
COPY tsconfig.base.json ./
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/db/src ./packages/db/src
COPY packages/db/tsconfig.json ./packages/db/
COPY packages/db/drizzle.config.ts ./packages/db/
COPY packages/db/migrations ./packages/db/migrations
COPY apps/api ./apps/api
RUN pnpm --filter @risker/shared build
RUN pnpm --filter @risker/db build
RUN pnpm --filter @risker/api build
# pnpm deploy: collect prod deps + built output into /deploy
RUN pnpm deploy --filter @risker/api --prod /deploy

# ── runner ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8081

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /deploy ./
# Copy migrations to a fixed location — referenced by MIGRATIONS_DIR in db-migrate service
COPY --from=builder --chown=appuser:nodejs /app/packages/db/migrations /migrations

USER appuser
EXPOSE 8081
CMD ["node", "dist/index.js"]
