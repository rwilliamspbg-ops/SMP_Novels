# SMP_Novels Backend - Production Dockerfile (v3.3)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .

FROM node:20-alpine AS production
RUN apk add --no-cache curl tini && apk upgrade --no-cache
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/init-db.sql ./
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
ENV NODE_ENV=production
ENV PORT=3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s CMD curl -f http://localhost:3001/health || true
EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server_fastify.js"]
