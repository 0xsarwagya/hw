import { Module, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { NodeSDK } from "@opentelemetry/sdk-node";

/**
 * OpenTelemetry Tracing Module
 * Initializes OTEL SDK and provides tracing capabilities
 * Note: SDK initialization happens in main.ts before NestFactory
 */
@Module({
  providers: [],
  exports: [],
})
export class OtelTracingModule implements OnModuleInit, OnModuleDestroy {
  private sdk: NodeSDK | null = null;

  onModuleInit() {
    // SDK is initialized in main.ts before NestFactory
    // This module just provides a place to manage tracing lifecycle
  }

  async onModuleDestroy() {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }
}
