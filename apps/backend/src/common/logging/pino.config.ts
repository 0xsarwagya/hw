import pino from "pino";
import { BUILD_INFO } from "../../build-info.js";

/**
 * Pino logger configuration
 * - Pretty format enabled by default (can be disabled with LOG_PRETTY=false)
 * - JSON format when LOG_PRETTY=false
 * - Redaction for sensitive data
 * @param redisStream - Optional Redis stream for duplicating logs
 */
export function createPinoConfig(redisStream?: pino.StreamEntry) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");
  // Enable pretty printing by default, allow disabling via LOG_PRETTY=false
  const usePretty = process.env.LOG_PRETTY !== "false";

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

  // Use pretty printing by default
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
            messageFormat: "{levelLabel} {msg}",
            errorLikeObjectKeys: ["err", "error"],
            hideObject: false,
          },
        },
      },
      pino.destination(1), // stdout
    );
  }

  // JSON format when LOG_PRETTY=false
  return pino(baseConfig, pino.destination(1)); // stdout
}
