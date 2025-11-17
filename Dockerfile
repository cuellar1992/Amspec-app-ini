# Multi-stage build for production
# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install dependencies including dev dependencies for build
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Prepare backend dependencies
FROM node:20-alpine AS backend-deps

WORKDIR /app/backend

# Copy package files
COPY server/package*.json ./
COPY server/package-lock.json ./

# Install all dependencies (including dev dependencies for potential scripts)
RUN npm ci && npm cache clean --force

# Copy source code
COPY server/ .

# Install only production dependencies
RUN npm prune --production

# Stage 3: Production image
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy backend dependencies
COPY --from=backend-deps --chown=nodejs:nodejs /app/backend/node_modules ./server/node_modules
COPY --from=backend-deps --chown=nodejs:nodejs /app/backend/package*.json ./server/

# Copy backend source
COPY --from=backend-deps --chown=nodejs:nodejs /app/backend ./server

# Copy frontend build
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./server/public

# Create environment file template
RUN echo "# Environment variables for production" > server/.env && \
    echo "# Copy this file to .env and fill in your values" >> server/.env && \
    echo "NODE_ENV=production" >> server/.env && \
    echo "PORT=8080" >> server/.env && \
    echo "MONGODB_URI=mongodb://mongodb:27017/amspec" >> server/.env && \
    echo "JWT_SECRET=your-super-secret-jwt-key-change-this" >> server/.env && \
    echo "JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this" >> server/.env && \
    echo "FRONTEND_URL=http://localhost:3000" >> server/.env

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/server.js"]