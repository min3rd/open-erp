# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/file-service ./apps/file-service
COPY libs ./libs

# Build the file service
RUN npm run build file-service

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/file-service ./dist/apps/file-service
COPY --from=builder /app/libs ./libs

# Set environment variables
ENV NODE_ENV=production
ENV FILE_SERVICE_PORT=3008

# Expose port
EXPOSE 3008

# Start the application
CMD ["node", "dist/apps/file-service/main.js"]
