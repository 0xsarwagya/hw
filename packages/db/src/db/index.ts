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

  const pool = new Pool({
    connectionString: databaseUrl,
    // Connection pool settings
    max: 50, // Maximum number of clients in the pool (increased for better concurrency)
    min: 0, // Minimum number of clients - set to 0 to avoid blocking during startup
    // Connections will be created on-demand, preventing startup delays
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    // Allow pool to wait for connections when max is reached
    allowExitOnIdle: false,
  });

  // Increase max listeners to prevent EventEmitter warnings
  // This is needed when multiple modules access the pool
  pool.setMaxListeners(20);

  // Handle pool errors to prevent unhandled rejections
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
  });

  // Set statement timeout on each new connection as a fallback
  pool.on("connect", async (client) => {
    try {
      await client.query("SET statement_timeout = 30000"); // 30 seconds
    } catch (err) {
      // Ignore errors setting timeout - connection will still work
      console.warn("Failed to set statement_timeout on connection", err);
    }
  });

  return pool;
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

/**
 * Get the database pool instance for cleanup and monitoring
 * @returns The PostgreSQL connection pool instance
 */
export function getDatabasePool(): Pool | null {
  return poolInstance;
}

/**
 * Close the database pool gracefully
 * Waits for all active queries to complete, then closes all connections
 * @param timeout - Maximum time to wait for connections to close (default: 10 seconds)
 * @returns Promise that resolves when pool is closed
 */
export async function closeDatabasePool(
  timeout: number = 10000,
): Promise<void> {
  if (!poolInstance) {
    return;
  }

  const pool = poolInstance;
  poolInstance = null; // Clear reference immediately to prevent new queries
  dbInstance = null;

  try {
    // Wait for active queries to complete, with timeout
    await Promise.race([
      pool.end(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Pool close timeout")), timeout),
      ),
    ]);
  } catch (error) {
    // If timeout occurs, pool.end() is still running in the background
    // The pool will eventually close, but we don't wait for it
    if (error instanceof Error && error.message === "Pool close timeout") {
      console.warn(
        "Database pool close timeout, pool will close in background",
      );
      // Don't call end() again - it's already called and will complete eventually
    } else {
      // Re-throw unexpected errors
      throw error;
    }
  }
}

/**
 * Get connection pool statistics
 * @returns Pool statistics including total, idle, and waiting connections
 */
export function getPoolStats(): {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
} | null {
  if (!poolInstance) {
    return null;
  }

  return {
    totalCount: poolInstance.totalCount || 0,
    idleCount: poolInstance.idleCount || 0,
    waitingCount: poolInstance.waitingCount || 0,
  };
}

/**
 * Check if database pool is healthy
 * @returns true if pool exists and is not ending, false otherwise
 */
export function isPoolHealthy(): boolean {
  if (!poolInstance) {
    return false;
  }
  // Check if pool is ending (being closed)
  // _ending is an internal property of pg.Pool that indicates the pool is closing
  interface PoolWithEnding extends Pool {
    _ending?: boolean;
  }
  return !(poolInstance as PoolWithEnding)._ending;
}

// Re-export commonly used drizzle functions
export {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
