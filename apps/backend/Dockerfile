# Multi-stage Dockerfile for NestJS Backend with Turborepo and pnpm
# Based on: https://www.bstefanski.com/blog/turborepo-nestjs-prisma-dockerfile

# ============================================================================
# Stage 1: Base - Setup pnpm and turbo
# ============================================================================
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat && \
    corepack enable && \
    pnpm install turbo --global

# ============================================================================
# Stage 2: Builder - Prune workspace to get only backend dependencies
# ============================================================================
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /usr/src/app

# Copy package files for dependency resolution
COPY package.json pnpm-lock.yaml* ./
COPY . .

# Prune workspace to only include backend and its dependencies
RUN turbo prune --scope=@vestcodes/vcecom-backend --docker

# ============================================================================
# Stage 3: Installer - Install dependencies and build
# ============================================================================
FROM base AS installer
WORKDIR /usr/src/app

# Copy workspace configuration files
COPY .gitignore .gitignore
COPY --from=builder /usr/src/app/out/json/ .
COPY --from=builder /usr/src/app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /usr/src/app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /usr/src/app/out/full/ .

# Install dependencies with frozen lockfile for reproducible builds
RUN pnpm install --frozen-lockfile

# Copy turbo.json for build orchestration
COPY turbo.json turbo.json

# Build the database package first (required dependency)
RUN turbo run build --filter=@vcecom/db...

# Build the backend application
RUN turbo run build --filter=@vestcodes/vcecom-backend...

# ============================================================================
# Stage 4: Runner - Production runtime image
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

# Install openssl for Node.js crypto operations
RUN apk add --no-cache openssl && \
    # Create system group and user for security
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy root package.json for workspace reference
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/package.json ./package.json

# Copy root node_modules (workspace dependencies)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules

# Copy backend package.json
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/backend/package.json ./apps/backend/package.json

# Copy backend built application
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/backend/dist ./apps/backend/dist

# Copy backend node_modules (production dependencies)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/backend/node_modules ./apps/backend/node_modules

# Copy backend scripts (needed for build-info generation)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/backend/scripts ./apps/backend/scripts

# Create storage directory structure (for file uploads and generated files)
# Storage directory is created at runtime, so we just need the directory structure
RUN mkdir -p /usr/src/app/apps/backend/storage/invoices && \
    chown -R nodejs:nodejs /usr/src/app/apps/backend/storage

# Copy built database package (required dependency)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/packages/db/dist ./packages/db/dist
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/packages/db/package.json ./packages/db/package.json

# Copy typescript-config package if it exists (for type definitions)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/packages/typescript-config ./packages/typescript-config

# Switch to non-root user for security
USER nodejs

# Set working directory to backend app
WORKDIR /usr/src/app/apps/backend

# Expose the default port (can be overridden via PORT env variable)
EXPOSE 3001

# Health check to ensure the container is running
# Uses the database health endpoint as it's the most critical check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/_health/database', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]