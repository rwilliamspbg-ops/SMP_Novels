# SMP_Novels Backend - Production Dockerfile (v3.3)

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first for layer caching
COPY package*.json ./

# Install all dependencies (npm install handles missing lock file gracefully)
RUN npm install --production &&     npm cache clean --force

# Copy application source
COPY . .

# Production stage - Security Hardened
FROM node:20-alpine AS production

# Install security tools and runtime dependencies
RUN apk add --no-cache curl tini &&     apk upgrade --no-cache

WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/init-db.sql ./init-db.sql

# Create and switch to non-root user for security
RUN addgroup -S app && adduser -S app -G app &&     chown -R app:app /app

USER app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s   CMD curl -f http://localhost:3001/health || true

# Expose port
EXPOSE 3001

# Use tini for proper PID 1 handling and signal forwarding
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "src/server_fastify.js"]
