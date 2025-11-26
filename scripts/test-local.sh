#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
USE_DOCKER="${USE_DOCKER:-true}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-vcecom_test}"
CLEANUP="${CLEANUP:-false}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-docker)
      USE_DOCKER=false
      shift
      ;;
    --cleanup)
      CLEANUP=true
      shift
      ;;
    --db-host=*)
      DB_HOST="${1#*=}"
      shift
      ;;
    --db-port=*)
      DB_PORT="${1#*=}"
      shift
      ;;
    --db-user=*)
      DB_USER="${1#*=}"
      shift
      ;;
    --db-password=*)
      DB_PASSWORD="${1#*=}"
      shift
      ;;
    --db-name=*)
      DB_NAME="${1#*=}"
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --no-docker          Use existing PostgreSQL instead of Docker"
      echo "  --cleanup            Clean up Docker container after tests"
      echo "  --db-host=HOST       Database host (default: localhost)"
      echo "  --db-port=PORT       Database port (default: 5432)"
      echo "  --db-user=USER       Database user (default: postgres)"
      echo "  --db-password=PASS   Database password (default: postgres)"
      echo "  --db-name=NAME       Test database name (default: vcecom_test)"
      echo "  --help               Show this help message"
      echo ""
      echo "Environment Variables:"
      echo "  USE_DOCKER           Set to 'false' to disable Docker (default: true)"
      echo "  CLEANUP              Set to 'true' to clean up Docker container (default: false)"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to cleanup Docker container
cleanup_docker() {
  if [ "$CLEANUP" = "true" ] && [ "$USE_DOCKER" = "true" ]; then
    echo -e "\n${YELLOW}Cleaning up Docker container...${NC}"
    docker stop vcecom-test-db 2>/dev/null || true
    docker rm vcecom-test-db 2>/dev/null || true
    echo -e "${GREEN}Cleanup complete!${NC}"
  fi
}

# Trap to cleanup on exit
trap cleanup_docker EXIT

# Function to check if Docker is available
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Falling back to existing PostgreSQL...${NC}"
    USE_DOCKER=false
  fi
}

# Function to start Docker PostgreSQL
start_docker_db() {
  echo -e "${BLUE}Starting PostgreSQL in Docker...${NC}"
  
  # Check if container already exists
  if docker ps -a --format '{{.Names}}' | grep -q "^vcecom-test-db$"; then
    echo -e "${YELLOW}Container 'vcecom-test-db' already exists${NC}"
    if docker ps --format '{{.Names}}' | grep -q "^vcecom-test-db$"; then
      echo -e "${GREEN}Container is already running${NC}"
    else
      echo -e "${YELLOW}Starting existing container...${NC}"
      docker start vcecom-test-db
      sleep 2
    fi
  else
    echo -e "${BLUE}Creating new PostgreSQL container...${NC}"
    docker run -d \
      --name vcecom-test-db \
      -e POSTGRES_USER="${DB_USER}" \
      -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
      -e POSTGRES_DB=postgres \
      -p "${DB_PORT}:5432" \
      postgres:16-alpine
    
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    sleep 3
    
    # Wait for PostgreSQL to be ready
    until docker exec vcecom-test-db pg_isready -U "${DB_USER}" > /dev/null 2>&1; do
      echo "  Waiting for PostgreSQL..."
      sleep 1
    done
    
    echo -e "${GREEN}PostgreSQL is ready!${NC}"
  fi
}

# Function to check if PostgreSQL is accessible
check_postgres() {
  if command -v psql &> /dev/null; then
    until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c '\q' 2>/dev/null; do
      echo -e "${YELLOW}Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}...${NC}"
      sleep 1
    done
    echo -e "${GREEN}PostgreSQL is accessible!${NC}"
  else
    echo -e "${YELLOW}psql not found, skipping connection check${NC}"
  fi
}

# Main execution
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VCEcom Local Test Runner            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check Docker availability
if [ "$USE_DOCKER" = "true" ]; then
  check_docker
fi

# Start Docker PostgreSQL if needed
if [ "$USE_DOCKER" = "true" ]; then
  start_docker_db
else
  echo -e "${YELLOW}Using existing PostgreSQL at ${DB_HOST}:${DB_PORT}${NC}"
  check_postgres
fi

# Export environment variables
export DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME
export TEST_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo -e "\n${YELLOW}Database Configuration:${NC}"
echo "  Host: ${DB_HOST}"
echo "  Port: ${DB_PORT}"
echo "  User: ${DB_USER}"
echo "  Database: ${DB_NAME}"
echo "  TEST_DATABASE_URL: ${TEST_DATABASE_URL}"

# Skip database setup - DB tests are disabled
echo -e "\n${YELLOW}Skipping database setup (DB tests disabled)${NC}"

# Run tests
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Running backend tests...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

# Run tests (DB tests are skipped via package.json script)
pnpm test

TEST_EXIT_CODE=$?

# Print summary
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
else
  echo -e "${RED}✗ Some tests failed${NC}"
fi
echo -e "${BLUE}════════════════════════════════════════${NC}"

exit $TEST_EXIT_CODE

