# SMP_Novels Frontend - Development Dockerfile
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
RUN addgroup --system app && adduser --system --ingroup app app && \
    chown -R app:app /app

USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Log to stdout/stderr for container logging
CMD ["sh", "-c", "node server.js"]
