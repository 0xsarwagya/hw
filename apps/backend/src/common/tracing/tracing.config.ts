import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import { createResource } from "./resource-detectors";

/**
 * Initialize OpenTelemetry SDK
 * Must be called before NestJS bootstrap
 */
export function initializeTracing(): NodeSDK | null {
  // Skip if tracing is disabled
  if (process.env.OTEL_TRACE_ENABLED === "false") {
    return null;
  }

  const samplingRate = parseFloat(process.env.OTEL_TRACE_SAMPLING || "1.0");
  const zipkinEndpoint =
    process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT ||
    "http://localhost:9411/api/v2/spans";

  // Create Zipkin exporter
  const zipkinExporter = new ZipkinExporter({
    url: zipkinEndpoint,
  });

  // Create sampler based on sampling rate
  const sampler = new TraceIdRatioBasedSampler(samplingRate);

  // Create batch span processor
  const spanProcessor = new BatchSpanProcessor(zipkinExporter, {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
    exportTimeoutMillis: 30000,
  });

  // Create SDK with resource detectors
  const sdk = new NodeSDK({
    resource: createResource(),
    traceExporter: zipkinExporter,
    // biome-ignore lint/suspicious/noExplicitAny: OpenTelemetry version mismatch requires type assertion
    spanProcessor: spanProcessor as any,
    sampler,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Enable HTTP instrumentation
        "@opentelemetry/instrumentation-http": {
          enabled: true,
        },
        // Enable PostgreSQL instrumentation (works with Drizzle)
        "@opentelemetry/instrumentation-pg": {
          enabled: true,
        },
        // Enable ioredis instrumentation
        "@opentelemetry/instrumentation-ioredis": {
          enabled: true,
        },
        // Enable NestJS instrumentation
        "@opentelemetry/instrumentation-nestjs-core": {
          enabled: true,
        },
        // Disable fs instrumentation (not needed)
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
      }),
    ],
  });

  // Start SDK
  sdk.start();

  // Handle shutdown
  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => {
        console.log("Tracing terminated");
      })
      .catch((error) => {
        console.error("Error terminating tracing", error);
      });
  });

  return sdk;
}
