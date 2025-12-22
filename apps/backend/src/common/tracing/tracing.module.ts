import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ContextModule } from "../logging/context.module";
import { LoggerModule } from "../logging/logger.module";
import { TracingInterceptor } from "./tracing.interceptor";
import { TracingService } from "./tracing.service";

/**
 * Global Tracing Module
 * Provides tracing capabilities across the entire application
 * - TracingService: Utility for creating spans and span-aware loggers
 * - TracingInterceptor: Automatically creates spans for controller endpoints
 */
@Global()
@Module({
  imports: [LoggerModule, ContextModule],
  providers: [
    TracingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
  ],
  exports: [TracingService],
})
export class TracingModule {}
