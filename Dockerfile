FROM node:24-bookworm-slim AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/neta-app/package.json ./apps/neta-app/package.json
RUN pnpm install --frozen-lockfile --config.node-linker=hoisted --filter @neta/app...

FROM node:24-bookworm-slim AS builder
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
RUN pnpm --filter @neta/app build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATA_DIR=/app/data

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/data \
  && chown -R nextjs:nodejs /app/data

COPY --from=builder /repo/apps/neta-app/.next/standalone ./
COPY --from=builder /repo/apps/neta-app/scripts ./apps/neta-app/scripts
COPY --from=builder /repo/apps/neta-app/server/db/migrations ./apps/neta-app/server/db/migrations
COPY --from=builder /repo/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder /repo/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /repo/node_modules/bindings ./node_modules/bindings
COPY --from=builder /repo/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

USER nextjs
WORKDIR /app/apps/neta-app
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
