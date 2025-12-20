#!/usr/bin/env node

// Load .env file before checking DATABASE_URL
import { resolve } from "node:path";
import { config } from "dotenv";

// Only load from root .env (when compiled, __dirname is packages/db/dist)
// 3 levels up: dist -> db -> packages -> ecommerce (root)
const rootEnvPath = resolve(__dirname, "../../../.env");
config({ path: rootEnvPath });

// Check DATABASE_URL before importing db (which throws if not set)
if (!process.env.DATABASE_URL) {
  console.log("⚠️  DATABASE_URL not set, skipping seed");
  process.exit(0);
}

import * as bcrypt from "bcrypt";
import { db } from "./db/index";
import { paymentMethodCharges, users } from "./schema";

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

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    // Note: roleId column may not exist in database yet, so we only set required fields
    const [adminUser] = await db
      .insert(users)
      .values({
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
      } as {
        email: string;
        passwordHash: string;
        role: "admin" | "customer" | "support" | "reviewer" | "marketing";
      })
      .returning();

    if (!adminUser) {
      throw new Error("Failed to create admin user");
    }

    console.log("✅ Admin user seeded successfully");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role: admin`);
    console.log(`   Hash format: bcrypt (starts with $2b$)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  }
}

async function seedPaymentMethodCharges() {
  try {
    // Check if any payment charges exist
    const existingCharges = await db
      .select()
      .from(paymentMethodCharges)
      .limit(1);

    if (existingCharges.length > 0) {
      console.log("✅ Payment method charges already exist, skipping seed");
      return;
    }

    // Seed default payment method charges
    const charges = [
      {
        method: "COD" as const,
        chargeType: "FLAT" as const,
        flatAmount: 3000, // ₹30
        percentage: 0,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: null,
        codDisallowHighValue: false,
        codDisallowDigital: true,
        codDisallowPreorder: true,
        active: true,
      },
      {
        method: "RAZORPAY_UPI" as const,
        chargeType: "PERCENTAGE" as const,
        flatAmount: 0,
        percentage: 0,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: null,
        codDisallowHighValue: false,
        codDisallowDigital: false,
        codDisallowPreorder: false,
        active: true,
      },
      {
        method: "RAZORPAY_CARD" as const,
        chargeType: "PERCENTAGE" as const,
        flatAmount: 0,
        percentage: 2.0,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: null,
        codDisallowHighValue: false,
        codDisallowDigital: false,
        codDisallowPreorder: false,
        active: true,
      },
      {
        method: "STRIPE_CARD" as const,
        chargeType: "MIXED" as const,
        flatAmount: 200, // ₹2
        percentage: 2.9,
        mixCap: 5000, // ₹50 cap
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: null,
        codDisallowHighValue: false,
        codDisallowDigital: false,
        codDisallowPreorder: false,
        active: true,
      },
      {
        method: "WALLET" as const,
        chargeType: "PERCENTAGE" as const,
        flatAmount: 0,
        percentage: 1.5,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: null,
        codDisallowHighValue: false,
        codDisallowDigital: false,
        codDisallowPreorder: false,
        active: true,
      },
      {
        method: "NETBANKING" as const,
        chargeType: "PERCENTAGE" as const,
        flatAmount: 0,
        percentage: 1.0,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: null,
        codDisallowHighValue: false,
        codDisallowDigital: false,
        codDisallowPreorder: false,
        active: true,
      },
      {
        method: "BNPL" as const,
        chargeType: "PERCENTAGE" as const,
        flatAmount: 0,
        percentage: 2.5,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: null,
        codDisallowHighValue: false,
        codDisallowDigital: false,
        codDisallowPreorder: false,
        active: true,
      },
    ];

    for (const charge of charges) {
      await db.insert(paymentMethodCharges).values(charge);
    }

    console.log("✅ Payment method charges seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding payment method charges:", error);
    // Don't throw - seed failures shouldn't break the process
  }
}

async function seed() {
  await seedAdminUser();
  await seedPaymentMethodCharges();
}

seed();
