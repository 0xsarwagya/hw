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

  // Determine optimal pool size based on environment
  // Production: Use smaller pool (10-15) to prevent connection exhaustion
  // Development: Use slightly larger pool (20) for convenience
  const isProduction = process.env.NODE_ENV === "production";
  const maxConnections = isProduction ? 15 : 20;

  const pool = new Pool({
    connectionString: databaseUrl,
    // Connection pool settings
    // Keep pool size small to prevent max connection errors
    // Production: 15 connections max (prevents hitting database limits)
    // Development: 20 connections max (more lenient for local dev)
    max: maxConnections,
    min: 0, // Connections created on-demand (no pre-warming)
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds (balance between reuse and cleanup)
    connectionTimeoutMillis: 10000, // Fail fast if connection can't be established (10 seconds)
    allowExitOnIdle: true, // Allow process to exit when pool is idle
    // Statement timeout is set per-connection in the 'connect' event handler below
  });

  // Increase max listeners to prevent EventEmitter warnings
  // This is needed when multiple modules access the pool
  pool.setMaxListeners(50);

  // Handle pool errors to prevent unhandled rejections
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
  });

  // Monitor pool for connection exhaustion warnings
  let lastWarningTime = 0;
  const WARNING_INTERVAL = 60000; // Only warn once per minute

  pool.on("acquire", (client) => {
    const total = pool.totalCount || 0;
    const idle = pool.idleCount || 0;
    const waiting = pool.waitingCount || 0;
    const used = total - idle;

    // Warn if pool is getting close to max connections
    const usagePercent = (used / maxConnections) * 100;
    const now = Date.now();

    if (
      usagePercent >= 80 &&
      now - lastWarningTime > WARNING_INTERVAL
    ) {
      lastWarningTime = now;
      console.warn(
        `[DB Pool] High connection usage: ${used}/${maxConnections} (${usagePercent.toFixed(1)}%) - ${waiting} waiting`,
      );
    }

    // Critical warning if pool is exhausted
    if (waiting > 0 && now - lastWarningTime > WARNING_INTERVAL) {
      lastWarningTime = now;
      console.error(
        `[DB Pool] CRITICAL: Pool exhausted! ${used}/${maxConnections} connections in use, ${waiting} requests waiting`,
      );
    }
  });

  // Set statement timeout on each new connection as a fallback
  pool.on("connect", async (client) => {
    try {
      // Set statement timeout to prevent long-running queries from holding connections
      await client.query("SET statement_timeout = 30000"); // 30 seconds
      // Set idle_in_transaction_session_timeout to prevent abandoned transactions
      await client.query("SET idle_in_transaction_session_timeout = 60000"); // 60 seconds
    } catch (err) {
      // Ignore errors setting timeout - connection will still work
      console.warn("Failed to set connection timeouts", err);
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
  usedCount: number;
  usagePercent: number;
  maxConnections: number;
} | null {
  if (!poolInstance) {
    return null;
  }

  const totalCount = poolInstance.totalCount || 0;
  const idleCount = poolInstance.idleCount || 0;
  const waitingCount = poolInstance.waitingCount || 0;
  const usedCount = totalCount - idleCount;

  // Get max connections from pool config
  const maxConnections = (poolInstance as any).options?.max || 15;
  const usagePercent = maxConnections > 0
    ? (usedCount / maxConnections) * 100
    : 0;

  return {
    totalCount,
    idleCount,
    waitingCount,
    usedCount,
    usagePercent: Math.round(usagePercent * 100) / 100, // Round to 2 decimal places
    maxConnections,
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
