import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema/index";

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  // During build time, allow pool creation without DATABASE_URL
  // The error will be thrown when the pool is actually used
  const isBuildTime =
    process.env.NODE_ENV === undefined ||
    process.argv.some((arg) => arg.includes("build") || arg.includes("tsc"));

  if (!databaseUrl && !isBuildTime) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please set it to a valid PostgreSQL connection string.",
    );
  }

  // If no DATABASE_URL during build, create a pool that will fail on actual use
  if (!databaseUrl) {
    return new Pool({
      connectionString: "postgresql://placeholder",
    });
  }

  return new Pool({
    connectionString: databaseUrl,
  });
}

// Create pool lazily - only when first accessed
// This allows environment variables to be loaded before the pool is created
let poolInstance: Pool | null = null;

function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = createPool();
  }
  return poolInstance;
}

// Use a getter to ensure pool is created lazily
const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return getPool()[prop as keyof Pool];
  },
});

// Lazy initialization of drizzle - only create when db is actually accessed
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

// Export db as a Proxy to ensure lazy initialization
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  },
});

export type Database = typeof db;

// Re-export commonly used drizzle functions
export {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  not,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
