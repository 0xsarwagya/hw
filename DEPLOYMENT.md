# Production Deployment Guide

This guide covers deploying the VCEcom backend with Docker Compose and Traefik.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Domain names pointing to your server's IP:
  - `hw.vcecom.vestcodes.co` → Backend API
  - `minio-hw-vcecom.vestcodes.co` → MinIO Console
  - `api.minio-hw-vcecom.vestcodes.co` → MinIO API
- Ports 80, 443, and 8080 open on your firewall

## Quick Start

1. **Clone the repository and navigate to the project root**

```bash
cd /path/to/ecommerce
```

2. **Set up environment variables** (if using external services or custom configs)

Create a `.env` file in the project root or set environment variables:

```bash
# Optional: Override Razorpay credentials
export RAZORPAY_KEY_ID=your_production_key
export RAZORPAY_KEY_SECRET=your_production_secret
export RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

3. **Build and start all services**

**For AWS Lightsail or resource-constrained systems:**
```bash
# Use the optimized build script
./scripts/build-on-lightsail.sh

# Then start services
docker-compose up -d
```

**For systems with adequate resources (4GB+ RAM):**
```bash
docker-compose up -d --build
```

### AWS Lightsail Specific Notes

If the build hangs on Lightsail:
- **Minimum instance size**: 2GB RAM (4GB recommended)
- Use the provided build script: `./scripts/build-on-lightsail.sh`
- See `BUILD_TROUBLESHOOTING.md` for detailed solutions
- Consider building locally and pushing to a registry if builds consistently fail

4. **Check service status**

```bash
docker-compose ps
```

5. **View logs**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

## Services

### Backend API
- **URL**: https://hw.vcecom.vestcodes.co
- **Health Check**: https://hw.vcecom.vestcodes.co/_health/database
- **Container**: `vcecom-backend`
- **Port**: 3001 (internal only, exposed via Traefik)

### MinIO Console
- **URL**: https://minio-hw-vcecom.vestcodes.co
- **Default Credentials**: 
  - Username: `minioadmin`
  - Password: `SNDl5BRY24N5yLCnwT6o1w==`
- **Container**: `vcecom-minio`

### MinIO API
- **URL**: https://api.minio-hw-vcecom.vestcodes.co
- **Container**: `vcecom-minio`

### PostgreSQL
- **Container**: `vcecom-postgres`
- **Database**: `maindb`
- **User**: `postgres`
- **Password**: `SNDl5BRY24N5yLCnwT6o1w==`
- **Port**: Not exposed externally (Docker network only)

### Redis
- **Container**: `vcecom-redis`
- **Password**: `SNDl5BRY24N5yLCnwT6o1w==`
- **Port**: Not exposed externally (Docker network only)

  ### Zipkin Tracing (Telemetry)
- **URL**: https://telemetry-hw-vcecom.vestcodes.co
- **Container**: `vcecom-zipkin`
- **Port**: 9411 (exposed via Traefik)
- **Storage**: In-memory (traces are not persisted across restarts)

### Traefik Dashboard
- **URL**: https://traefik.vcecom.vestcodes.co
- **Port**: 8080 (also accessible on host)
- **Note**: Protected with basic auth (change password in docker-compose.yaml)

## SSL Certificates

Traefik automatically obtains SSL certificates from Let's Encrypt using the TLS challenge. Certificates are stored in the `traefik_letsencrypt` volume.

### Certificate Storage
Certificates are persisted in Docker volume `traefik_letsencrypt` and will be automatically renewed.

### Troubleshooting SSL
If certificates fail to generate:
1. Ensure ports 80 and 443 are open
2. Verify DNS records point to your server
3. Check Traefik logs: `docker-compose logs traefik`
4. Ensure the email in docker-compose.yaml is valid

## Using External Database/Redis

If you want to use external Postgres/Redis instead of Docker containers:

1. **Remove or comment out** the `postgres` and `redis` services in `docker-compose.yaml`

2. **Update backend environment variables**:

```yaml
environment:
  DATABASE_URL: postgresql://postgres:SNDl5BRY24N5yLCnwT6o1w%3D%3D@13.204.238.175:5432/maindb
  REDIS_URL: redis://:SNDl5BRY24N5yLCnwT6o1w%3D%3D@13.204.238.175:6379
```

3. **Remove dependencies**:

```yaml
depends_on:
  # Remove postgres and redis
  minio:
    condition: service_healthy
```

## Initial Setup

### 1. Create MinIO Bucket

After MinIO starts, access the console at https://minio-hw-vcecom.vestcodes.co and:
1. Login with credentials
2. Create a bucket named `vcecom`
3. Set bucket policy to public if needed for public assets

### 2. Run Database Migrations

```bash
# Access backend container
docker-compose exec backend sh

# Run migrations (if you have migration scripts)
# This depends on your database setup
```

### 3. Seed Initial Data (Optional)

```bash
docker-compose exec backend sh
# Run your seed scripts
```

## Monitoring

### Health Checks

All services have health checks configured. Check status:

```bash
docker-compose ps
```

### Logs

```bash
# Follow all logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f traefik
```

### Traefik Dashboard

Access the Traefik dashboard at https://traefik.vcecom.vestcodes.co to see:
- All configured routes
- SSL certificate status
- Service health

## Backup

### PostgreSQL Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres maindb > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres maindb < backup_20240101.sql
```

### Redis Backup

Redis data is persisted in the `redis_data` volume. To backup:

```bash
docker run --rm -v vcecom_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz /data
```

### MinIO Backup

MinIO data is persisted in the `minio_data` volume. To backup:

```bash
docker run --rm -v vcecom_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup.tar.gz /data
```

## Security Considerations

1. **Change Default Passwords**: Update all default passwords in `docker-compose.yaml`
2. **Traefik Dashboard**: Change the basic auth password for Traefik dashboard
3. **Environment Variables**: Use Docker secrets or environment files for sensitive data
4. **Firewall**: Only expose ports 80, 443, and optionally 8080
5. **MinIO Credentials**: Change MinIO root credentials
6. **Database**: Use strong passwords for production
7. **Redis**: Ensure Redis password is strong

## Scaling

To scale the backend service:

```bash
docker-compose up -d --scale backend=3
```

Traefik will automatically load balance between instances.

## Updates

To update services:

```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build

# Or restart specific service
docker-compose restart backend
```

## Troubleshooting

### Backend won't start
- Check logs: `docker-compose logs backend`
- Verify database connection: `docker-compose exec backend ping postgres`
- Check environment variables

### SSL certificates not generating
- Verify DNS records
- Check Traefik logs: `docker-compose logs traefik`
- Ensure ports 80/443 are accessible

### MinIO connection issues
- Verify MinIO is healthy: `docker-compose ps minio`
- Check MinIO logs: `docker-compose logs minio`
- Verify bucket exists in MinIO console

### Database connection errors
- Check Postgres is healthy: `docker-compose ps postgres`
- Verify DATABASE_URL format (URL encoding for special characters)
- Check network connectivity: `docker-compose exec backend ping postgres`

## Maintenance

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (⚠️ deletes data)
```bash
docker-compose down -v
```

### View resource usage
```bash
docker stats
```

## Support

For issues or questions, check:
- Backend logs: `docker-compose logs backend`
- Traefik logs: `docker-compose logs traefik`
- Service status: `docker-compose ps`

