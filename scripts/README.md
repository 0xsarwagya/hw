# Scripts

This directory contains utility scripts for development, testing, and maintenance.

## Scripts

### `generate-changelog-ai.ts`

AI-powered changelog generator that fetches merged PRs from GitHub and uses Mistral API to generate a comprehensive changelog in Keep a Changelog format.

#### Features

- **GitHub Integration**: Fetches all merged PRs from your repository
- **AI Categorization**: Uses Mistral API to categorize PRs (feat, fix, docs, etc.)
- **Smart Formatting**: Generates user-facing descriptions from PR content
- **Breaking Changes Detection**: Automatically identifies and highlights breaking changes
- **Keep a Changelog Format**: Generates changelog following industry-standard format
- **Rate Limiting**: Built-in rate limiting and retry logic for API calls

#### Prerequisites

1. **GitHub Personal Access Token**:
   - Create a token at https://github.com/settings/tokens
   - Required scopes: `public_repo` (for public repos) or `repo` (for private repos)
   - Set as `GITHUB_TOKEN` environment variable

2. **Mistral API Key**:
   - Sign up at https://console.mistral.ai/
   - Get your API key from the dashboard
   - Set as `MISTRAL_API_KEY` environment variable

#### Usage

```bash
# Generate changelog from all merged PRs
pnpm changelog:ai

# Generate changelog for PRs merged since a specific tag
pnpm changelog:ai --since v1.0.0

# Specify custom output file
pnpm changelog:ai --output CHANGES.md

# Specify custom repository
pnpm changelog:ai --repo owner/repo-name

# Preview without writing to file (dry-run)
pnpm changelog:ai --dry-run

# Show help
pnpm changelog:ai --help
```

#### Options

- `--since <tag>`: Only include PRs merged since this git tag
- `--output <file>`: Output file path (default: `CHANGELOG.md`)
- `--repo <owner/repo>`: GitHub repository (default: from `package.json`)
- `--dry-run`: Preview changelog without writing to file
- `--help, -h`: Show help message

#### Environment Variables

- `GITHUB_TOKEN`: GitHub personal access token (required)
- `MISTRAL_API_KEY`: Mistral API key (required)

#### Examples

```bash
# Basic usage - generate changelog from all PRs
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
export MISTRAL_API_KEY=your_mistral_key
pnpm changelog:ai

# Generate changelog for new PRs since last release
pnpm changelog:ai --since v2.0.0

# Preview what would be generated
pnpm changelog:ai --dry-run

# Generate changelog for a different repository
pnpm changelog:ai --repo Vestcodes/other-repo
```

#### How It Works

1. **Fetch PRs**: Uses GitHub API to fetch all merged PRs (optionally filtered by tag)
2. **Categorize**: Sends each PR to Mistral API for categorization and description enhancement
3. **Group**: Groups PRs by category (Added, Changed, Fixed, etc.)
4. **Format**: Generates markdown changelog following Keep a Changelog format
5. **Write**: Writes the changelog to `CHANGELOG.md` (or specified file)

#### Changelog Format

The generated changelog follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [Unreleased] or [Version] - YYYY-MM-DD

### Breaking Changes
- **scope**: Description (PR #123)

### Added
- **scope**: Feature description (PR #124)

### Changed
- **scope**: Change description (PR #125)

### Fixed
- **scope**: Bug fix description (PR #126)
```

#### Error Handling

- Validates environment variables before execution
- Handles GitHub API rate limits (5000 requests/hour)
- Implements retry logic for Mistral API calls
- Falls back to title-based categorization if Mistral API fails
- Graceful error messages with helpful suggestions

#### Notes

- The script replaces the existing `CHANGELOG.md` file (unless `--dry-run` is used)
- PRs are sorted by merge date (newest first)
- Breaking changes are automatically detected and shown in a separate section
- The script uses batch processing with rate limiting to avoid API throttling

### `test-local.sh`

A comprehensive script that sets up a test database and runs all tests locally.

#### Features

- **Docker Support**: Automatically starts PostgreSQL in Docker (default)
- **Existing Database**: Can use an existing PostgreSQL instance
- **Database Setup**: Creates test database and runs migrations
- **Cleanup**: Optional cleanup of Docker containers
- **Colored Output**: Easy-to-read colored terminal output

#### Usage

```bash
# Run tests with Docker (default)
pnpm test:local
# or
./scripts/test-local.sh

# Use existing PostgreSQL instead of Docker
pnpm test:local:no-docker
# or
./scripts/test-local.sh --no-docker

# Run tests and cleanup Docker container afterwards
pnpm test:local:cleanup
# or
./scripts/test-local.sh --cleanup

# Custom database configuration
./scripts/test-local.sh \
  --db-host=localhost \
  --db-port=5432 \
  --db-user=postgres \
  --db-password=mypassword \
  --db-name=my_test_db

# Show help
./scripts/test-local.sh --help
```

#### Options

- `--no-docker`: Use existing PostgreSQL instead of Docker
- `--cleanup`: Clean up Docker container after tests complete
- `--db-host=HOST`: Database host (default: localhost)
- `--db-port=PORT`: Database port (default: 5432)
- `--db-user=USER`: Database user (default: postgres)
- `--db-password=PASS`: Database password (default: postgres)
- `--db-name=NAME`: Test database name (default: vcecom_test)
- `--help`: Show help message

#### Environment Variables

- `USE_DOCKER`: Set to `false` to disable Docker (default: true)
- `CLEANUP`: Set to `true` to clean up Docker container (default: false)
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_USER`: Database user (default: postgres)
- `DB_PASSWORD`: Database password (default: postgres)
- `DB_NAME`: Test database name (default: vcecom_test)

### `setup-test-db.sh`

Sets up the test database (used by `test-local.sh` and CI).

#### Usage

```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=vcecom_test

# Run setup
./scripts/setup-test-db.sh
```

## Examples

### Basic Usage

```bash
# Start Docker PostgreSQL and run all tests
pnpm test:local
```

### Using Existing PostgreSQL

```bash
# If you have PostgreSQL running locally
pnpm test:local:no-docker
```

### Custom Configuration

```bash
# Use a different database name
./scripts/test-local.sh --db-name=my_custom_test_db

# Use a remote database
./scripts/test-local.sh \
  --no-docker \
  --db-host=192.168.1.100 \
  --db-port=5432 \
  --db-user=myuser \
  --db-password=mypassword
```

### CI/CD Usage

The `setup-test-db.sh` script is automatically used in GitHub Actions CI workflow (`.github/workflows/ci.yml`).

## Requirements

- **Docker** (optional, for Docker mode): Docker must be installed and running
- **PostgreSQL Client** (optional): `psql` command for connection checks
- **Node.js**: Version 18 or higher
- **pnpm**: Version 9.0.0

## Troubleshooting

### Docker Not Found

If Docker is not installed, the script will automatically fall back to using an existing PostgreSQL instance.

### Port Already in Use

If port 5432 is already in use, you can:

1. Stop the existing PostgreSQL service
2. Use a different port: `--db-port=5433`
3. Use `--no-docker` to use the existing PostgreSQL

### Database Connection Failed

Make sure:
- PostgreSQL is running and accessible
- Credentials are correct
- Network/firewall allows connections
- Port is not blocked

### Migration Errors

If migrations fail:
- Check that the `@vcecom/db` package builds successfully
- Verify `DATABASE_URL` is set correctly
- Ensure database user has CREATE privileges

## Notes

- The test database (`vcecom_test`) is created automatically
- Migrations are run automatically (or schema is pushed if no migrations exist)
- Docker containers persist between runs (use `--cleanup` to remove)
- All tests use the `TEST_DATABASE_URL` environment variable

