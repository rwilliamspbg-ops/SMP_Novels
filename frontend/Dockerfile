FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Create non-root user
RUN addgroup --system app && adduser --system --ingroup app app
USER app
EXPOSE 3000
CMD ["npx", "serve", "-s", ".", "-p", "3000"]
