#!/usr/bin/env node

// Load .env file before checking DATABASE_URL
import { resolve } from "node:path";
import { config } from "dotenv";

// Load from packages/db/.env first, then root .env (root takes precedence)
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../../.env") });

// Check DATABASE_URL before importing db (which throws if not set)
if (!process.env.DATABASE_URL) {
  console.log("⚠️  DATABASE_URL not set, skipping seed");
  process.exit(0);
}

import * as bcrypt from "bcrypt";
import { db } from "./db/index";
import { users } from "./schema";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@vcecom.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

async function seedAdminUser() {
  try {
    // Check if any users exist
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length > 0) {
      console.log("✅ Users already exist, skipping seed");
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
      } as typeof users.$inferInsert)
      .returning();

    if (!adminUser) {
      throw new Error("Failed to create admin user");
    }

    console.log("✅ Admin user seeded successfully");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role: admin`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  }
}

seedAdminUser();
