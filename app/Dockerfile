# ==============================================================================
# Dockerfile for Tour Booking Node.js Application
# Hardening: Run as non-root user (node:node), minimal base image (node:20-alpine)
# ==============================================================================
FROM node:20-alpine AS base

# Install dumb-init for proper signal handling (SIGTERM/SIGINT)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy application source code
COPY . .

# Security Hardening: Change ownership to non-root user 'node'
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose web port
EXPOSE 3000

# Healthcheck to verify app is healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

# Start container with dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]

