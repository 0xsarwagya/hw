/**
 * Migration utility
 * This file provides utilities for running migrations
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as fs from "node:fs";
import * as path from "node:path";
import { Pool } from "pg";

/**
 * Run migrations programmatically (non-interactive)
 */
export async function runMigrations(databaseUrl: string) {
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  const db = drizzle(pool);

  // Determine migrations folder path (relative to package root)
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(
      `Migrations folder not found at: ${migrationsFolder}. Run 'pnpm db:generate' first.`,
    );
  }

  console.log(`Running migrations from: ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("Migrations completed successfully!");

  await pool.end();
}
