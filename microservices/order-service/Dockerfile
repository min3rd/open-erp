# Multi-stage build for Order Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared RabbitMQ client
COPY ../shared/rabbitmq-client /app/shared/rabbitmq-client

# Install shared dependencies
WORKDIR /app/shared/rabbitmq-client
RUN npm install && npm run build

# Copy service package files
WORKDIR /app/service
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Install service dependencies
RUN npm ci --only=production

# Copy service source
COPY src ./src

# Build service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built shared library
COPY --from=builder /app/shared/rabbitmq-client/dist /app/node_modules/@open-erp/rabbitmq-client/dist
COPY --from=builder /app/shared/rabbitmq-client/package.json /app/node_modules/@open-erp/rabbitmq-client/

# Copy service dependencies and build
COPY --from=builder /app/service/node_modules ./node_modules
COPY --from=builder /app/service/dist ./dist
COPY --from=builder /app/service/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/orders/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3004

CMD ["node", "dist/main"]
