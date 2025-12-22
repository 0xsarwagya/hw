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
# Use --prod=false to install all dependencies (needed for building)
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

# Install pnpm in runner stage for dependency management
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root package.json and workspace files for dependency installation
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/package.json ./package.json
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy workspace packages needed for installation
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/packages ./packages
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/backend/package.json ./apps/backend/package.json

# Remove prepare script from package.json to avoid husky dependency issue
# prepare script runs husky which is a devDependency and not needed in production
RUN node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json')); delete pkg.scripts.prepare; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Install only production dependencies
# This ensures all workspace dependencies (including db package deps) are properly linked
RUN pnpm install --frozen-lockfile --prod && \
    chown -R nodejs:nodejs /usr/src/app

# Copy backend built application (after dependencies are installed)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/backend/dist ./apps/backend/dist

# Copy backend scripts (needed for build-info generation)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/backend/scripts ./apps/backend/scripts

# Copy Lua scripts for Redis operations (not compiled, need to copy from source)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/backend/src/modules/redis-store/scripts ./apps/backend/dist/modules/redis-store/scripts

# Create storage directory structure (for file uploads and generated files)
# Storage directory is created at runtime, so we just need the directory structure
RUN mkdir -p /usr/src/app/apps/backend/storage/invoices && \
    chown -R nodejs:nodejs /usr/src/app/apps/backend/storage

# Copy built database package dist (package.json already copied above for pnpm install)
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/packages/db/dist ./packages/db/dist

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