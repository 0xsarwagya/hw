/**
 * CLI entry point for running migrations programmatically
 * This avoids interactive prompts from drizzle-kit
 */

import { runMigrations } from "./migrate";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is required");
  process.exit(1);
}

runMigrations(databaseUrl)
  .then(() => {
    console.log("Migrations completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
