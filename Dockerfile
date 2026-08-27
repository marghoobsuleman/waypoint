# syntax=docker/dockerfile:1

# Waypoint — single-process image: Express REST API + built React dashboard.
# Node 24 ships node:sqlite as a stable, unflagged core module (Waypoint uses
# DatabaseSync), so there is no native build step and no extra system packages.

# ---- Build stage: install all deps and build the client ---------------------
FROM node:24-alpine AS builder
WORKDIR /app

# Copy manifests first so dependency install can be layer-cached.
COPY package.json package-lock.json ./
COPY packages ./packages
COPY client ./client

# Deterministic install of the whole workspace (incl. dev deps for the build).
RUN npm ci

# Build the React dashboard into client/dist, then drop dev deps.
RUN npm run build \
 && npm prune --omit=dev

# ---- Runtime stage: minimal image that serves API + UI ----------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    # Store the SQLite DB on a mounted volume, not inside the image layer.
    WAYPOINT_DB=/data/data.db

# Copy only what the server needs at runtime: pruned deps, the shared packages,
# and the pre-built static dashboard.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/client/dist ./client/dist

# Persistent, writable data dir owned by the unprivileged `node` user.
RUN mkdir -p /data && chown -R node:node /data
VOLUME /data

EXPOSE 4000
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT}/api/health" >/dev/null 2>&1 || exit 1

CMD ["node", "packages/server/src/index.js"]
