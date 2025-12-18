# Database Schema Overview

## Database

VCEcom uses PostgreSQL as the primary database with Drizzle ORM for type-safe queries.

## Schema Organization

Schemas are organized by domain:

- **Users & Auth**: `users`, `admin_sessions`, `admin_activity_logs`, `admin_2fa`
- **Products**: `products`, `product_variants`, `product_images`, `collections`
- **Pricing**: `price_lists`, `price_list_items`, `customer_groups`, `pricing_snapshots`
- **Discounts**: `discounts`, `discount_rules`, `discount_snapshots`
- **Bundles**: `bundle_definitions`, `bundle_sets`, `bundle_set_items`
- **Orders**: `orders`, `order_items`, `order_status_history`
- **Payments**: `payment_intents`, `payments`
- **Shipping**: `shipments`, `shipping_labels`
- **Reviews**: `reviews`, `review_helpful_votes`
- **Customers**: `customers`, `addresses`

## Entity Relationship Diagram

See [ERD](/docs/database-schema/erd) for complete entity relationship diagram.

## Table Documentation

See [Tables](/docs/database-schema/tables) for detailed table documentation.

## Migrations

Database migrations are managed with Drizzle Kit:

```bash
pnpm db:generate  # Generate migration
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

## Indexes

Key indexes for performance:

- Foreign keys
- Frequently queried columns (email, status, created_at)
- Composite indexes for common queries

