# SMP_Novels Backend - Development Dockerfile
# Upgraded: v2.0 (Node 20, BuildKit Optimized, Layer Caching)

# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency files first for layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application source
COPY . .

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app && \
    chown -R app:app /app

USER app

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ping || exit 1

# Log to stdout/stderr for container logging
CMD ["sh", "-c", "node src/server_fastify.js"]
