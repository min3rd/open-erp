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
COPY src ./src
COPY libs ./libs

# Build the main application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and TypeScript config (needed for ts-node + tsconfig-paths)
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies (includes devDependencies for ts-node seed script support)
RUN npm ci

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy source files needed for seed scripts
COPY libs ./libs
COPY src ./src
COPY scripts ./scripts

# Copy and configure Docker initialization script
COPY scripts/docker-init.sh /docker-init.sh
RUN chmod +x /docker-init.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

ENTRYPOINT ["/docker-init.sh"]
CMD ["node", "dist/main.js"]
