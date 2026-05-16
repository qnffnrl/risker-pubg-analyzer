FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── installer ──────────────────────────────────────────────────────────────────
FROM base AS installer
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json ./apps/worker/
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
COPY apps/worker ./apps/worker
RUN pnpm --filter @risker/shared build
RUN pnpm --filter @risker/db build
RUN pnpm --filter @risker/worker build
RUN pnpm deploy --filter @risker/worker --prod /deploy

# ── runner ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV BULL_BOARD_PORT=8082

RUN addgroup -g 1001 nodejs \
 && adduser -D -u 1001 -G nodejs -h /home/appuser appuser

# claude CLI — used by LLM summary generator (credentials mounted at runtime)
# bash required: claude bin script uses bash shebang on Alpine
RUN apk add --no-cache bash && npm install -g @anthropic-ai/claude-code

COPY --from=builder --chown=appuser:nodejs /deploy ./

USER appuser
EXPOSE 8082
CMD ["node", "dist/index.js"]
