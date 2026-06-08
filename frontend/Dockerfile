# Production Frontend Build (Multi-stage)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application if needed (static files for this app)
RUN npm run build 2>&1 || echo "No build script - using static files"

# Production runtime
FROM node:20-alpine

# Install security tools
RUN apk add --no-cache curl tini && \
    apk upgrade --no-cache

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/index.html ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src /app/src

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app && \
    chown -R app:app /app

USER app

# Expose port
EXPOSE 80

# Use tini for proper PID 1 handling and signal forwarding
ENTRYPOINT ["/sbin/tini", "--"]

# Serve static files with Node.js HTTP server
CMD ["node", "server.js"]
