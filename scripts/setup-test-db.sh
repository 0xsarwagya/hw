#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up test database...${NC}"

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-vcecom_test}"

# Construct connection strings
POSTGRES_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/postgres"
TEST_DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo -e "${YELLOW}Database Configuration:${NC}"
echo "  Host: ${DB_HOST}"
echo "  Port: ${DB_PORT}"
echo "  User: ${DB_USER}"
echo "  Database: ${DB_NAME}"

# Wait for PostgreSQL to be ready
echo -e "\n${YELLOW}Waiting for PostgreSQL to be ready...${NC}"

# Check if we're using Docker (check if container is running)
USE_DOCKER_DB=false
if command -v docker &> /dev/null; then
  if docker ps --format '{{.Names}}' | grep -q "^vcecom-test-db$"; then
    USE_DOCKER_DB=true
  fi
fi

if [ "$USE_DOCKER_DB" = "true" ]; then
  # Use Docker exec to check readiness
  until docker exec vcecom-test-db pg_isready -U "${DB_USER}" > /dev/null 2>&1; do
    echo "  Waiting for PostgreSQL..."
    sleep 1
  done
  echo -e "${GREEN}PostgreSQL is ready!${NC}"
else
  # Use psql if available, otherwise just wait a bit
  if command -v psql &> /dev/null; then
    until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c '\q' 2>/dev/null; do
      echo "  Waiting for PostgreSQL..."
      sleep 1
    done
    echo -e "${GREEN}PostgreSQL is ready!${NC}"
  else
    echo -e "${YELLOW}psql not found, waiting 5 seconds for PostgreSQL to be ready...${NC}"
    sleep 5
    echo -e "${GREEN}Assuming PostgreSQL is ready!${NC}"
  fi
fi

# Create test database if it doesn't exist
echo -e "\n${YELLOW}Creating test database if it doesn't exist...${NC}"

if [ "$USE_DOCKER_DB" = "true" ]; then
  # Use Docker exec to create database
  if docker exec vcecom-test-db psql -U "${DB_USER}" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" 2>/dev/null | grep -q 1; then
    echo -e "${GREEN}Test database '${DB_NAME}' already exists!${NC}"
  else
    docker exec vcecom-test-db psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME}" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Test database '${DB_NAME}' created successfully!${NC}"
    else
      echo -e "${RED}Failed to create test database${NC}"
      exit 1
    fi
  fi
else
  # Use psql if available
  if command -v psql &> /dev/null; then
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" 2>/dev/null | grep -q 1 || \
      PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME}" 2>/dev/null
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Test database '${DB_NAME}' is ready!${NC}"
    else
      echo -e "${RED}Failed to create test database${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}psql not found, skipping database creation check${NC}"
    echo -e "${YELLOW}Please ensure database '${DB_NAME}' exists${NC}"
  fi
fi

# Run migrations
echo -e "\n${YELLOW}Running database migrations...${NC}"
export DATABASE_URL="${TEST_DB_URL}"

# Change to project root (script runs from root)
cd "$(dirname "$0")/.." || exit 1

# Build the db package first
echo "Building @vcecom/db package..."
cd packages/db
pnpm build

# Set CI environment to disable strict mode prompts
export CI=true
export CI_STRICT=false

# Check if migrations directory exists
if [ -d "./drizzle" ] && [ "$(ls -A ./drizzle 2>/dev/null)" ]; then
  echo "Migrations directory found, running migrations..."
  # Use programmatic migration first (non-interactive, best for CI)
  if pnpm db:migrate:run; then
    echo -e "${GREEN}Migrations completed using programmatic runner!${NC}"
  else
    echo -e "${YELLOW}Programmatic migration failed, trying drizzle-kit migrate...${NC}"
    # drizzle-kit migrate should not prompt if migrations are already applied
    pnpm db:migrate:ci || {
      echo -e "${YELLOW}Migration failed, trying db:push:ci as fallback...${NC}"
      pnpm db:push:ci || {
        echo -e "${RED}Failed to run migrations${NC}"
        exit 1
      }
    }
  fi
else
  echo -e "${YELLOW}No migrations found, using db:push:ci to sync schema...${NC}"
  pnpm db:push:ci || {
    echo -e "${RED}Failed to push schema${NC}"
    exit 1
  }
fi

echo -e "${GREEN}Database schema setup completed successfully!${NC}"

# Export TEST_DATABASE_URL for use in tests
export TEST_DATABASE_URL="${TEST_DB_URL}"
echo -e "\n${GREEN}Test database setup complete!${NC}"
echo -e "${GREEN}TEST_DATABASE_URL=${TEST_DB_URL}${NC}"

