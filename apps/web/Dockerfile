FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── installer: dependency graph only ──────────────────────────────────────────
FROM base AS installer
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile

# ── builder: compile shared packages then web ──────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=installer /app ./
COPY tsconfig.base.json ./
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/db/src ./packages/db/src
COPY packages/db/tsconfig.json ./packages/db/
COPY packages/db/drizzle.config.ts ./packages/db/
COPY apps/web ./apps/web
RUN pnpm --filter @risker/shared build
RUN pnpm --filter @risker/db build
ENV NEXT_STANDALONE=true
ARG NEXT_PUBLIC_API_URL=https://pubg.risker.co.kr
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @risker/web build

# ── runner: minimal production image ──────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone output includes server.js + necessary node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# static assets are not included in standalone — copy separately
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
