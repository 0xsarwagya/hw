# Tracing and Logging Documentation

This document describes how to use tracing and logging in the application.

## Overview

The application uses OpenTelemetry for distributed tracing and Pino for structured logging. All logs automatically include trace and span IDs for correlation in Zipkin.

## Architecture

- **TracingInterceptor**: Automatically creates spans for all controller endpoints
- **@Trace Decorator**: Creates spans for service methods
- **TracingService**: Utility for creating spans manually
- **Logging Helpers**: Automatically extract trace/span IDs from active spans

## Usage

### Automatic Tracing (Controllers)

All controllers automatically get spans via the global `TracingInterceptor`. No additional code needed.

### Method-Level Tracing (@Trace Decorator)

Add the `@Trace` decorator to service methods:

```typescript
import { Trace } from "../../common/tracing/trace.decorator";

@Injectable()
export class MyService {
  @Trace({ operation: "MyService.doSomething" })
  async doSomething() {
    // Method automatically runs within a span
    // Logs will include trace/span IDs
  }
}
```

### Manual Span Creation (TracingService)

For background jobs or complex operations:

```typescript
import { TracingService } from "../../common/tracing/tracing.service";

@Injectable()
export class MyService {
  constructor(private readonly tracingService: TracingService) {}

  async complexOperation() {
    return this.tracingService.startSpan({
      operation: "MyService.complexOperation",
      logLifecycle: true,
    }).execute(async () => {
      // Your code here
      // Span automatically ends when this function completes
    });
  }
}
```

### Logging with Trace Context

All logging helpers automatically include trace/span IDs:

```typescript
import { createLogContext, createErrorContext } from "../../common/logging/logging.helper";

// Logs automatically include trace/span IDs from active span
this.logger.info(
  createLogContext(this.contextService, "myOperation", { userId: "123" }),
  "Operation completed"
);

// Error logs also include trace context
this.logger.error(
  createErrorContext(this.contextService, "myOperation", error, { userId: "123" }),
  "Operation failed"
);
```

## Best Practices

1. **Use @Trace for service methods**: Simple and automatic
2. **Use TracingService for background jobs**: More control over span lifecycle
3. **Always use logging helpers**: They automatically include trace context
4. **Set meaningful operation names**: Use format `ServiceName.methodName`
5. **Include relevant attributes**: Add context to spans for better debugging

## Viewing Traces

Traces are exported to Zipkin. Access Zipkin UI to view:
- Complete request flows
- Service method calls
- Performance metrics
- Error traces

All logs include `traceId` and `spanId` fields for correlation.

