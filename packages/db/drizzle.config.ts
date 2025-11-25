import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql", // Change to "mysql", "sqlite", or "postgresql" as needed
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
