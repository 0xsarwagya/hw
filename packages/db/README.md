# @vcecom/db

Shared database package using Drizzle ORM.

## Setup

1. Set the `DATABASE_URL` environment variable
2. Update `drizzle.config.ts` with your database dialect if not using PostgreSQL

## Usage

```typescript
import { db } from "@vcecom/db";
import { users } from "@vcecom/db/schema";

// Query example
const allUsers = await db.select().from(users);
```

## Scripts

- `pnpm db:generate` - Generate migrations
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema changes directly to database
- `pnpm db:studio` - Open Drizzle Studio

