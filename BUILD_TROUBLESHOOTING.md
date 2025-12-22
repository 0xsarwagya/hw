# Build Troubleshooting Guide

## Issue: Build Hangs on AWS Lightsail

If the Docker build hangs during the NestJS build step, try these solutions:

**Note:** This project uses TypeScript compiler (not SWC) to avoid circular dependency issues that SWC can cause with complex NestJS applications.

### Solution 1: Increase Lightsail Instance Size

The build process requires significant memory. Minimum recommended:
- **2GB RAM** for successful builds
- **4GB RAM** for faster builds

### Solution 2: Build with Increased Memory Limit

If you have limited memory, you can temporarily increase the memory limit in the Dockerfile:

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=3072"
```

### Solution 3: Build Locally and Push Image

Instead of building on Lightsail, build locally and push to a registry:

```bash
# Build locally
docker build -t your-registry/vcecom-backend:latest -f apps/backend/Dockerfile .

# Push to registry
docker push your-registry/vcecom-backend:latest

# On Lightsail, pull and use
docker pull your-registry/vcecom-backend:latest
```

### Solution 4: Use BuildKit with Cache

Enable BuildKit for better caching and performance:

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

docker-compose build --progress=plain backend
```

### Solution 5: Monitor Build Progress

Add verbose output to see where it's hanging:

```bash
docker-compose build --progress=plain --no-cache backend 2>&1 | tee build.log
```

### Solution 6: Build in Stages

If the build still hangs, you can build in separate stages:

```bash
# Build just the installer stage
docker build --target installer -t vcecom-installer -f apps/backend/Dockerfile .

# Then build the final stage
docker build --target runner -t vcecom-backend -f apps/backend/Dockerfile .
```

### Solution 7: Check System Resources

On Lightsail, check available resources:

```bash
# Check memory
free -h

# Check disk space
df -h

# Check if swap is enabled
swapon --show
```

If memory is low, add swap space:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Solution 8: Optimize Docker Build

Reduce build context size by ensuring `.dockerignore` is properly configured:

```bash
# Check .dockerignore
cat apps/backend/.dockerignore
```

### Common Causes

1. **Memory exhaustion**: TypeScript compilation is memory-intensive
2. **Disk space**: Build process creates temporary files
3. **Network issues**: npm/pnpm registry timeouts
4. **File system**: Slow I/O on Lightsail

### Quick Fix: Use Pre-built Image

For production, consider using CI/CD to build images and push to a registry, then pull on Lightsail.

