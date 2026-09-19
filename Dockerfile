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

# API base URL passed during build (e.g. from compose build args)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Compile TypeScript and bundle frontend with Vite
RUN bun run build

# Stage 2: Serve static production build with Nginx
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure SPA fallback and static asset caching
RUN printf '%s\n' \
  'server {' \
  '    listen 80;' \
  '    server_name _;' \
  '    root /usr/share/nginx/html;' \
  '    index index.html;' \
  '    gzip on;' \
  '    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;' \
  '    location / {' \
  '        try_files $uri $uri/ /index.html;' \
  '    }' \
  '    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|gif|ico|webp)$ {' \
  '        expires 1y;' \
  '        add_header Cache-Control "public, immutable";' \
  '    }' \
  '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
