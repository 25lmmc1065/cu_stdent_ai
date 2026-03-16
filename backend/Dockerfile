FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev

FROM node:20-alpine AS production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY migrations/ ./migrations/
RUN mkdir -p uploads && chown -R appuser:appgroup /app
USER appuser
EXPOSE 5000
CMD ["node", "src/index.js"]
