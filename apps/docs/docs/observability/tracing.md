# Distributed Tracing

## Overview

VCEcom uses OpenTelemetry (OTEL) for distributed tracing with Zipkin export. Traces provide end-to-end visibility across services and async operations.

## OpenTelemetry Integration

Traces are automatically created for:
- HTTP requests
- Database queries
- Redis operations
- External API calls

## Trace Structure

```typescript
interface Trace {
  traceId: string; // 32-character hex string
  spanId: string; // 16-character hex string
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime: number;
  tags: Record<string, string>;
  logs: TraceLog[];
}
```

## Span Creation

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("vcecom-backend");

const span = tracer.startSpan("createOrder", {
  attributes: {
    "order.id": orderId,
    "customer.id": customerId
  }
});

try {
  await createOrder(orderData);
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.recordException(error);
} finally {
  span.end();
}
```

## Zipkin Export

Traces are exported to Zipkin for visualization:

```typescript
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";

const exporter = new ZipkinExporter({
  url: process.env.ZIPKIN_URL || "http://localhost:9411/api/v2/spans"
});
```

## Trace Correlation

Traces are correlated with logs via `traceId`:

```json
{
  "level": "info",
  "traceId": "12345678901234567890123456789012",
  "spanId": "1234567890123456",
  "message": "Order created"
}
```

## Best Practices

1. **Name Spans Clearly**: Use descriptive span names
2. **Add Attributes**: Include relevant context in attributes
3. **Record Exceptions**: Always record exceptions in spans
4. **Set Status**: Set span status appropriately
5. **Keep Traces Reasonable**: Avoid creating too many spans

