# VCEcom - Production-Ready, India-First Headless Commerce Platform

> Built with ❤️ by [Vestcodes](https://vestcodes.co)

A production-ready, India-first headless ecommerce platform built with NestJS, Drizzle ORM, and Next.js. Designed for the Indian market with deep GST integration, Razorpay payments, and seamless shipping provider integrations.

**VCEcom** is a complete ecommerce solution developed by Vestcodes, featuring **native GST compliance** (CGST/SGST/IGST), Razorpay integration, Indian shipping providers (Shiprocket, Nimbus Post), and comprehensive order lifecycle management.

## 🎯 Overview

VCEcom is a production-ready, India-first headless commerce platform built as a monorepo using Turborepo. It provides a flexible, type-safe backend API for building modern ecommerce experiences with **native GST compliance**, comprehensive order lifecycle management, and deep integrations with Indian payment and shipping providers.

**Core Differentiators:**
- **GST-First Architecture**: GST calculation (CGST/SGST/IGST) is built into the core order and cart systems, not bolted on
- **Complete Order Lifecycle**: State machine-driven order management with idempotent operations
- **India-Optimized**: PIN code validation, Indian address formats, GSTIN validation, and phone number normalization
- **Production-Ready**: Type-safe, tested, and documented APIs ready for scale

## 🏗️ Architecture

This project uses a monorepo structure powered by [Turborepo](https://turborepo.com) for efficient development and builds.

### Tech Stack

- **Backend**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) - Lightweight, type-safe ORM
- **Admin Dashboard**: [Next.js](https://nextjs.org/) + [shadcn/ui](https://ui.shadcn.com/)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Code Quality**: Biome (formatting & linting)
- **Database**: PostgreSQL

## 📦 Apps and Packages

### Apps

- **`admin`** - Next.js admin dashboard for managing products, orders, customers, and settings
- **`docs`** - Docusaurus documentation site (hosted on GitHub Pages)
- **`backend`** - NestJS REST API backend with modular architecture

### Packages

- **`@vcecom/db`** - Shared database package using Drizzle ORM
  - Centralized schema definitions
  - Type-safe database queries
  - Migration management
- **`@vcecom/typescript-config`** - Shared TypeScript configurations

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and other configuration
```

### Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Or manually create `.env`:

```env
# Database
DATABASE_URL=postgresql://vcecom:vcecom_dev_password@localhost:5432/vcecom

# Redis
REDIS_URL=redis://localhost:6379

# Backend
PORT=3000
NODE_ENV=development

# Admin User Seed (optional)
ADMIN_EMAIL=admin@vcecom.local
ADMIN_PASSWORD=Admin@123
```

### Docker Development Setup

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose -f docker-compose.dev.yaml up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

Stop services:
```bash
docker-compose -f docker-compose.dev.yaml down
```

## 💻 Development

### Start all apps

```bash
pnpm dev
```

### Start specific app

```bash
# Start backend only
pnpm dev --filter=backend

# Start admin only
pnpm dev --filter=admin
```

### Build

```bash
# Build all apps and packages
pnpm build

# Build specific app
pnpm build --filter=backend
pnpm build --filter=admin
```

### Code Quality

```bash
# Check formatting and linting
pnpm format-and-lint

# Auto-fix formatting and linting issues
pnpm format-and-lint:fix

# Type checking
pnpm check-types

# Validate commit messages
pnpm commitlint
```

### Changelog & Releases

```bash
# Generate changelog using git-cliff
pnpm changelog

# Generate unreleased changelog
pnpm changelog:unreleased

# Run semantic-release (automatically runs in CI)
pnpm semantic-release:beta   # For beta branch
pnpm semantic-release:prod   # For prod branch
```

**Note:** 
- Releases are automatically created when pushing to `beta` or `prod` branches via GitHub Actions
- The `dev` branch does NOT create releases - it's for development only
- Releases start from `0.0.0` and increment based on commit scopes (`admin` or `backend`)
- See [SETUP_BRANCHES.md](./SETUP_BRANCHES.md) for branch setup instructions

### Database

```bash
# Generate migrations
cd packages/db
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes (development only)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

## 📁 Project Structure

```
ecommerce/
├── apps/
│   ├── admin/              # Next.js admin dashboard
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components (shadcn/ui)
│   │   └── lib/            # Utilities
│   └── backend/            # NestJS API
│       └── src/
│           ├── modules/    # Feature modules (to be implemented)
│           ├── app.module.ts
│           └── main.ts
├── packages/
│   ├── db/                 # Shared database package
│   │   ├── src/
│   │   │   ├── schema/     # Database schemas
│   │   │   └── db/         # Database connection
│   │   └── drizzle.config.ts
│   └── typescript-config/ # Shared TS configs
├── biome.json              # Biome configuration
├── turbo.json              # Turborepo configuration
└── package.json
```

## 🎨 Features

### Current

- ✅ Monorepo setup with Turborepo
- ✅ NestJS backend with modular architecture
- ✅ Drizzle ORM with PostgreSQL
- ✅ Next.js admin dashboard with shadcn/ui
- ✅ Type-safe database queries
- ✅ Code formatting and linting with Biome
- ✅ Shared TypeScript configurations
- ✅ **GST-First Architecture**: Native CGST/SGST/IGST calculation integrated into cart and orders
- ✅ **Complete Order Lifecycle**: State machine-driven order management (pending → confirmed → processing → shipped → delivered → refunded)
- ✅ **Idempotent Operations**: Safe retry mechanisms for order creation and status updates
- ✅ Product catalog management with variants
- ✅ Shopping cart with real-time GST calculations
- ✅ Order management system with state transitions
- ✅ Customer management with Indian address validation
- ✅ Payment processing integration (Razorpay) with webhooks
- ✅ Shipping and fulfillment (Shiprocket, Nimbus Post) with tracking
- ✅ Tax invoice generation (PDF) with GST breakdown
- ✅ Indian address & phone validation (PIN code, state, district)
- ✅ GSTIN format & structure validation
- ✅ Product search & filtering (full-text, SKU, advanced filters)
- ✅ Pagination support (page-based & cursor-based)
- ✅ Discount code system (STANDARD & BUY_GET types)
- ✅ Cart discount application with validation
- ✅ Admin dashboard (basic) with order management UI

### Planned

- 🔄 Advanced inventory management
- 🔄 Multi-warehouse support
- 🔄 Advanced analytics
- 🔄 Marketing & promotions (advanced)
- 🔄 Customer features (wishlist, reviews)
- 🔄 Multi-region support
- 🔄 Plugin system for extensibility
- 🔄 Storefront API optimization

## 🏛️ Architecture Principles

### Modular Design

The backend follows NestJS's modular architecture, where each feature is organized into its own module:

```
modules/
├── products/      # Product catalog
├── carts/         # Shopping cart
├── orders/        # Order management
├── customers/     # Customer management
├── payments/      # Payment processing
└── ...
```

### Type Safety

- End-to-end TypeScript
- Type-safe database queries with Drizzle
- Shared types across apps via `@vcecom/db`

### Shared Packages

- Database schemas and queries in `@vcecom/db`
- Reusable across backend and admin apps
- Single source of truth for data models

## 🔧 Development Workflow

1. **Create database schema** in `packages/db/src/schema/`
2. **Generate migration**: `pnpm db:generate`
3. **Run migration**: `pnpm db:migrate`
4. **Create NestJS module** in `apps/backend/src/modules/`
5. **Use shared types** from `@vcecom/db`
6. **Build admin UI** in `apps/admin/`
7. **Commit with conventional format**: `feat(scope): description`
8. **Push to appropriate branch** (`dev`, `beta`, or `prod`) for automatic releases

## 📝 Commit Conventions & Releases

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This enables:

- **Automatic versioning** based on commit types
- **Changelog generation** with git-cliff
- **GitHub releases** via semantic-release
- **Branch-specific releases** (beta, prod)

### Branch Strategy

- **dev**: Development branch - **NO releases**
- **beta**: Beta releases (e.g., `0.1.0-beta.1`)
- **prod**: Production releases (e.g., `0.1.0`)

### Quick Reference

- `feat(admin): add product page` - New feature in admin (minor version)
- `fix(backend): resolve cart bug` - Bug fix in backend (patch version)
- `feat(backend)!: change API` - Breaking change (major version)
- `docs(config): update README` - Documentation (no release)
- `chore(deps): update packages` - Dependencies (no release)

**Important:** 
- Only commits with `admin` or `backend` scope trigger releases
- Commits with `db` or `config` scope do not create releases
- Releases start from `0.0.0`
- See [SETUP_BRANCHES.md](./SETUP_BRANCHES.md) for initial branch setup

## 📋 Product Requirements Document (PRD)

For detailed product requirements, specifications, and feature documentation, please refer to the Product Requirements Document:

**PRD Document:** [View PRD on Zoho Writer](https://writer.zoho.in/writer/open/na5811e99faa1ddfb4003a8713b3ffc5a2747)

The PRD includes:
- Project objectives and scope
- User personas and use cases
- Feature requirements and priorities
- Functional flows and workflows
- Technical architecture
- Database schema specifications
- API endpoint documentation
- India-focused integrations (Razorpay, Shiprocket, Nimbus Post, Unicommerce)
- Future roadmap and add-on integrations

## 📚 Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Turborepo Documentation](https://turborepo.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## 🤝 Contributing

This is a proprietary project developed by [Vestcodes](https://vestcodes.co). For questions or suggestions, please contact us:

- **Website:** [vestcodes.co](https://vestcodes.co)
- **Email:** contact@vestcodes.co
- **GitHub:** [@vestcodes](https://github.com/vestcodes)
- **LinkedIn:** [company/vestcodes](https://linkedin.com/company/vestcodes)

## 📄 License

See [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built by [Vestcodes](https://vestcodes.co)** - Transforming ideas into exceptional digital products

[Website](https://vestcodes.co) • [GitHub](https://github.com/vestcodes) • [LinkedIn](https://linkedin.com/company/vestcodes)

© 2025 Vestcodes. All rights reserved.

</div>
# Force CI rebuild
