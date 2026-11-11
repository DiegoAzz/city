# Multi-stage Docker build for Street Explorer Mobile
# Optimized for Coolify, Docker Swarm, and Kubernetes

# --- Stage 1: Build Frontend Assets ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Run TypeScript check and production Vite build
RUN npm run build

# --- Stage 2: Lightweight Production Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets and server
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Expose standard web port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the Node.js production server with WebSocket multiplayer
CMD ["node", "server.js"]
