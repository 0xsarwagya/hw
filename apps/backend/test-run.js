#!/usr/bin/env node

// Capture all errors
process.on("uncaughtException", (error) => {
  console.error("=== UNCAUGHT EXCEPTION ===");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("=== UNHANDLED REJECTION ===");
  console.error("Reason:", reason);
  console.error("Promise:", promise);
  process.exit(1);
});

// Load the main module
try {
  console.log("Loading main module...");
  require("./dist/main.js");
  console.log("Main module loaded successfully");
} catch (error) {
  console.error("=== ERROR LOADING MODULE ===");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}
