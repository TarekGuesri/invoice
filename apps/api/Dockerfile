# syntax=docker/dockerfile:1.7
#
# One image for both processes, built from the repo root:
#   docker build -f apps/api/Dockerfile .
# API (Cloud Run):  node dist/main.js   (default)
# Worker (GCP VM):  node dist/worker.js

ARG NODE_VERSION=24
ARG BUN_VERSION=1.4.5
ARG TURBO_VERSION=2.11.13

FROM oven/bun:${BUN_VERSION}-slim AS bun

FROM node:${NODE_VERSION}-slim AS base
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
ENV TURBO_TELEMETRY_DISABLED=1 \
    DO_NOT_TRACK=1
WORKDIR /app

# Keep only the api workspace and the internal packages it depends on, so
# changes to the web app don't invalidate the install layers below.
FROM base AS pruner
ARG TURBO_VERSION
COPY . .
RUN bun x turbo@${TURBO_VERSION} prune api --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN bun x turbo run build --filter=api

# Bun installs peer dependencies by default, which would pull the Prisma CLI,
# Prisma Studio and TypeScript in through @prisma/client. Every peer the API
# needs at runtime is already a direct dependency.
FROM base AS prod-deps
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --omit=peer

FROM node:${NODE_VERSION}-slim AS runtime
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app
COPY --from=prod-deps /app ./
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

USER node
WORKDIR /app/apps/api
EXPOSE 8080
CMD ["node", "dist/main.js"]
