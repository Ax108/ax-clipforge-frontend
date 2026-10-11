# Multi-stage Dockerfile for ClipForge Frontend
# Stage 1: Build static assets using Bun
FROM oven/bun:1 AS builder

USER root
WORKDIR /app

# Install Node.js runtime required by @lavamoat/allow-scripts and build utilities
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates nodejs \
  && rm -rf /var/lib/apt/lists/*

# Cache dependency installations
COPY package.json bun.lock bunfig.toml ./
COPY scripts ./scripts

RUN bun install --frozen-lockfile \
  && bun run allow-scripts

# Copy application source and build configurations
COPY tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.no-tests.json ./
COPY vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# Baked into the bundle. Coolify can override this build arg.
# `bun run dev` does not use this image and stays on localhost.
ARG VITE_API_URL=https://temp2.astrax108.com/api/v1
ARG VITE_CLIPFORGE_TOKEN=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_CLIPFORGE_TOKEN=${VITE_CLIPFORGE_TOKEN}

# Compile TypeScript and bundle frontend with Vite
RUN bun run build

# Stage 2: Serve static production build with Nginx
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
