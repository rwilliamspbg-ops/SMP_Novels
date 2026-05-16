FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 3001
CMD ["node", "src/server_fastify.js"]
