import pino from "pino";
import { BUILD_INFO } from "../../build-info.js";

/**
 * Pino logger configuration
 * - JSON format for production
 * - Pretty format for development
 * - Redaction for sensitive data
 */
export function createPinoConfig() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");
  const usePretty = process.env.LOG_PRETTY === "true" || isDevelopment;

  const baseConfig: pino.LoggerOptions = {
    level: logLevel,
    base: {
      service: "vcecom-backend",
      version: BUILD_INFO.version || "0.0.1",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    // Redaction paths for sensitive data
    redact: {
      paths: [
        "customer.email",
        "customer.phone",
        "customer.address",
        "payment.card_last4",
        "payment.card_number",
        "payment.method",
        "payload.email",
        "payload.phone",
        "body.email",
        "body.phone",
        "body.password",
        "body.cardNumber",
        "body.cvv",
        "headers.authorization",
        "headers.cookie",
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.email",
        "req.body.phone",
        "req.body.password",
        "req.body.cardNumber",
        "req.body.cvv",
      ],
      remove: false, // Replace with [Redacted] instead of removing
      censor: "[Redacted]",
    },
  };

  // Use pretty printing in development
  if (usePretty) {
    return pino(
      {
        ...baseConfig,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
            singleLine: false,
          },
        },
      },
      pino.destination(1), // stdout
    );
  }

  // JSON format for production
  return pino(baseConfig, pino.destination(1)); // stdout
}
