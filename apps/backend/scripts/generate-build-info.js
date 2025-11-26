#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get git commit hash
let commitHash = "unknown";
try {
  commitHash = execSync("git rev-parse --short HEAD", {
    encoding: "utf-8",
  }).trim();
} catch (e) {
  // Git not available or not a git repo
}

// Get build date
const buildDate = new Date().toISOString();

// Generate date-based version (YYYY.MM.DD format)
const now = new Date();
const version = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

// Get build environment
const buildEnv = process.env.NODE_ENV || "development";

// Generate build-info.ts content
const content = `/**
 * Build-time information
 * This file is auto-generated during build process
 * DO NOT EDIT MANUALLY
 */

export const BUILD_INFO = {
  ok: true,
  version: "${version}",
  buildEnv: "${buildEnv}",
  commitHash: "${commitHash}",
  buildDate: "${buildDate}",
};
`;

// Write to file
const outputPath = path.join(__dirname, "../src/build-info.ts");
fs.writeFileSync(outputPath, content, "utf-8");

console.log(`✅ Generated build-info.ts`);
console.log(`   Version: ${version}`);
console.log(`   Commit: ${commitHash}`);
console.log(`   Build Date: ${buildDate}`);
