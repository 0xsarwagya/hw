import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  verbose: true,
  // Set strict to false in CI to avoid prompts, can be overridden by CI_STRICT env var
  strict: process.env.CI_STRICT === "true" || process.env.CI !== "true",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  migrations: {
    table: "drizzle_migrations",
    schema: "public",
  },
});
