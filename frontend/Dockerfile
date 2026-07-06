# SMP_Novels Frontend - Production Dockerfile (v3.3)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

FROM node:20-alpine AS production
RUN apk add --no-cache curl tini && apk upgrade --no-cache
WORKDIR /app
COPY --from=builder --chown=node:node /app .
USER node
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
