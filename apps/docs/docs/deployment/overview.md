# Deployment Overview

## Quick Start

VCEcom can be deployed using Docker Compose for development or production environments.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL database
- Redis instance
- S3-compatible storage (MinIO or Supabase)

## Environment Variables

See `.env.example` for required environment variables:

- Database connection
- Redis connection
- Storage provider configuration
- Payment gateway credentials
- Shipping provider credentials

## Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./apps/backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=vcecom
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

## Production Deployment

See [Production Deployment Guide](/docs/deployment/production) for detailed production setup.

## Scaling

See [Scaling Guide](/docs/deployment/scaling) for horizontal scaling strategies.

