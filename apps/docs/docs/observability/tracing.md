# Distributed Tracing

The system implements OpenTelemetry-based distributed tracing to provide end-to-end visibility across all services and operations. Traces help debug performance issues, understand request flows, and monitor system health.

## Tracing Architecture

### Core Components
- **OpenTelemetry SDK**: Industry-standard tracing framework
- **Zipkin Exporter**: Trace visualization and storage
- **Auto-Instrumentation**: Automatic tracing for common libraries
- **Custom Spans**: Application-specific trace instrumentation

### Tracing Stack
```
Application Code → OpenTelemetry API → SDK → Zipkin Exporter → Zipkin UI
                                   ↓
                           Auto-Instrumentation
```

## Trace Configuration

### SDK Initialization
```typescript
// Initialize before NestJS bootstrap
const tracingSdk = initializeTracing();

async function initializeTracing(): Promise<NodeSDK | null> {
  if (process.env.OTEL_TRACE_ENABLED === "false") {
    return null;
  }

  const samplingRate = parseFloat(process.env.OTEL_TRACE_SAMPLING || "1.0");
  const zipkinEndpoint = process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT ||
    "http://localhost:9411/api/v2/spans";

  const zipkinExporter = new ZipkinExporter({ url: zipkinEndpoint });
  const sampler = new TraceIdRatioBasedSampler(samplingRate);

  return new NodeSDK({
    resource: createResource(),
    traceExporter: zipkinExporter,
    spanProcessor: new BatchSpanProcessor(zipkinExporter),
    sampler,
    instrumentations: [getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": { enabled: true },
      "@opentelemetry/instrumentation-pg": { enabled: true },
      "@opentelemetry/instrumentation-ioredis": { enabled: true },
      "@opentelemetry/instrumentation-nestjs-core": { enabled: true },
    })],
  });
}
```

### Environment Configuration
```bash
# Tracing control
OTEL_TRACE_ENABLED=true
OTEL_TRACE_SAMPLING=1.0  # 0.0 to 1.0 (0% to 100%)

# Zipkin configuration
OTEL_EXPORTER_ZIPKIN_ENDPOINT=http://localhost:9411/api/v2/spans

# Service metadata
OTEL_SERVICE_NAME=vcecom-backend
OTEL_SERVICE_VERSION=1.0.0
```

## Automatic Instrumentation

### HTTP Requests
```typescript
// Automatic tracing for all HTTP requests
app.use((req, res, next) => {
  // OpenTelemetry automatically creates spans for HTTP requests
  // Spans include: method, url, status code, duration
  next();
});
```

### Database Operations
```typescript
// Automatic tracing for PostgreSQL queries
await db.select().from(products); // Automatically traced

// Automatic tracing for Redis operations
await redis.get('key'); // Automatically traced
```

### Framework Operations
```typescript
// NestJS controller methods automatically traced
@Controller('products')
export class ProductsController {
  @Get()
  async findAll() { // Automatically traced
    return this.productsService.findAll();
  }
}
```

## Custom Span Creation

### Manual Tracing
```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("vcecom-backend");

async function createOrder(orderData: CreateOrderDto): Promise<Order> {
  const span = tracer.startSpan("createOrder", {
    attributes: {
      "order.customer_id": orderData.customerId,
      "order.item_count": orderData.items.length,
      "order.total_amount": orderData.total,
    },
  });

  try {
    // Business logic here
    const order = await this.processOrder(orderData);

    span.setAttributes({
      "order.id": order.id,
      "order.status": order.status,
    });

    span.setStatus({ code: SpanStatusCode.OK });
    return order;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Child Spans
```typescript
async processOrder(orderData: CreateOrderDto): Promise<Order> {
  const span = trace.getActiveSpan();

  // Create child span for inventory check
  const inventorySpan = tracer.startSpan("checkInventory", {
    attributes: { "operation.type": "validation" }
  }, span ? trace.setSpan(context.active(), span) : undefined);

  try {
    await this.checkInventory(orderData.items);
    inventorySpan.setStatus({ code: SpanStatusCode.OK });
  } finally {
    inventorySpan.end();
  }

  // Create child span for payment processing
  const paymentSpan = tracer.startSpan("processPayment", {
    attributes: { "payment.amount": orderData.total }
  }, span ? trace.setSpan(context.active(), span) : undefined);

  try {
    await this.processPayment(orderData.payment);
    paymentSpan.setStatus({ code: SpanStatusCode.OK });
  } finally {
    paymentSpan.end();
  }

  // Continue with order creation...
}
```

## Trace Context Propagation

### HTTP Headers
```typescript
// Automatic trace context injection in HTTP requests
const axiosConfig = {
  headers: {
    'traceparent': '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    'tracestate': 'vendorname=opaqueValue',
  }
};
```

### Database Operations
```typescript
// Trace context automatically propagated to database queries
await db.insert(orders).values(orderData); // Includes trace context
```

### Redis Operations
```typescript
// Trace context automatically propagated to Redis commands
await redis.set('order:123', orderData); // Includes trace context
```

## Sampling Strategies

### Probability Sampling
```typescript
// Sample 10% of all traces
const sampler = new TraceIdRatioBasedSampler(0.1);

// Sample all traces (development)
const sampler = new TraceIdRatioBasedSampler(1.0);
```

### Custom Sampling Rules
```typescript
class CustomSampler implements Sampler {
  shouldSample(context: Context, traceId: string, spanName: string): SamplingResult {
    // Sample all errors
    if (spanName.includes('error')) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLE };
    }

    // Sample 50% of checkout operations
    if (spanName.includes('checkout')) {
      return Math.random() < 0.5
        ? { decision: SamplingDecision.RECORD_AND_SAMPLE }
        : { decision: SamplingDecision.NOT_RECORD };
    }

    // Default sampling
    return { decision: SamplingDecision.NOT_RECORD };
  }
}
```

## Resource Detection

### Service Metadata
```typescript
function createResource(): Resource {
  return new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "vcecom-backend",
    [SemanticResourceAttributes.SERVICE_VERSION]: BUILD_INFO.version || "0.0.1",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "development",
    [SemanticResourceAttributes.CLOUD_REGION]: process.env.DEPLOYMENT_REGION || "local",
    [SemanticResourceAttributes.HOST_NAME]: os.hostname(),
    [SemanticResourceAttributes.PROCESS_PID]: process.pid,
  });
}
```

### Custom Attributes
```typescript
// Add custom resource attributes
const resource = new Resource({
  "service.instance.id": process.env.INSTANCE_ID,
  "service.cluster": process.env.CLUSTER_NAME,
  "deployment.version": BUILD_INFO.commitHash,
});
```

## Zipkin Integration

### Trace Visualization
```typescript
// Traces exported to Zipkin for visualization
const zipkinExporter = new ZipkinExporter({
  url: "http://localhost:9411/api/v2/spans",
  headers: {
    "authorization": "Bearer <token>" // If authentication required
  }
});
```

### Zipkin UI Features
- **Service Map**: Visual representation of service dependencies
- **Trace Timeline**: Detailed span timing and hierarchy
- **Error Tracking**: Failed spans with error details
- **Performance Analysis**: Slow operation identification

## Performance Monitoring

### Span Metrics
```typescript
// Automatic span metrics collection
span_duration_seconds: histogram
span_count_total: counter
span_error_total: counter
```

### Custom Metrics
```typescript
// Business-specific span attributes
span.setAttributes({
  "order.type": "guest_checkout",
  "order.value": order.total,
  "order.items": order.items.length,
  "customer.type": customer.verified ? "verified" : "guest",
});
```

## Error Tracking

### Exception Recording
```typescript
try {
  await riskyOperation();
} catch (error) {
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
  throw error;
}
```

### Error Context
```typescript
span.setAttributes({
  "error.type": error.name,
  "error.message": error.message,
  "error.stack": error.stack?.substring(0, 1000), // Limit stack trace
  "operation.context": JSON.stringify(operationContext),
});
```

## Best Practices

### Span Naming
1. **Descriptive Names**: Use clear, descriptive span names
2. **Consistent Naming**: Follow consistent naming conventions
3. **Hierarchical Structure**: Reflect operation hierarchy in span names
4. **Avoid Dynamic Names**: Don't include IDs in span names

### Attribute Standards
1. **Semantic Attributes**: Use OpenTelemetry semantic conventions
2. **Consistent Keys**: Standardize attribute names across services
3. **Appropriate Values**: Include relevant context without sensitive data
4. **Performance**: Avoid large attribute values

### Span Lifecycle
1. **Proper Cleanup**: Always call `span.end()` in finally blocks
2. **Resource Management**: Don't hold references to ended spans
3. **Context Propagation**: Ensure trace context flows through async operations
4. **Error Handling**: Record exceptions and set appropriate status codes

### Sampling Decisions
1. **Business Critical**: Sample 100% of critical business operations
2. **High Volume**: Use lower sampling rates for high-volume operations
3. **Error Cases**: Always sample error scenarios
4. **Development**: Sample 100% in development environments

### Performance Considerations
1. **Overhead Awareness**: Tracing adds small performance overhead
2. **Sampling Trade-offs**: Balance observability with performance
3. **Resource Limits**: Configure appropriate span limits and timeouts
4. **Storage Costs**: Consider trace storage and retention costs

### Security Considerations
1. **Sensitive Data**: Don't include PII in span attributes
2. **Access Control**: Restrict trace access to authorized personnel
3. **Data Retention**: Implement appropriate trace retention policies
4. **Transport Security**: Use secure connections for trace export

## Troubleshooting

### Common Issues

#### Missing Traces
```typescript
// Check if tracing is enabled
console.log("Tracing enabled:", process.env.OTEL_TRACE_ENABLED);

// Check sampling rate
console.log("Sampling rate:", process.env.OTEL_TRACE_SAMPLING);

// Verify Zipkin connectivity
// Check Zipkin logs for connection errors
```

#### Broken Trace Context
```typescript
// Ensure context propagation
const currentSpan = trace.getActiveSpan();
if (!currentSpan) {
  console.warn("No active span found - trace context may be broken");
}

// Check async context preservation
// Ensure AsyncLocalStorage is properly configured
```

#### Performance Impact
```typescript
// Monitor span creation overhead
const startTime = Date.now();
const span = tracer.startSpan("operation");
// ... operation ...
span.end();
const overhead = Date.now() - startTime;

// Implement sampling for high-frequency operations
if (Math.random() < 0.01) { // 1% sampling for frequent ops
  // Create span
}
```

## Integration Examples

### Database Query Tracing
```typescript
// Automatic instrumentation traces all database operations
const orders = await db
  .select()
  .from(ordersTable)
  .where(eq(ordersTable.customerId, customerId));
// Span created automatically with query details
```

### External API Calls
```typescript
// Automatic HTTP instrumentation
const response = await axios.get('https://api.payment-gateway.com/charge');
// Span created with HTTP method, URL, status, duration
```

### Redis Operations
```typescript
// Automatic Redis instrumentation
await redis.set('order:123', orderData);
// Span created with command, key, duration
```

### Message Queue Operations
```typescript
// Custom instrumentation for message queues
const span = tracer.startSpan("publishMessage", {
  attributes: {
    "messaging.system": "redis",
    "messaging.destination": "order-events",
    "messaging.operation": "publish",
  }
});

await redis.publish("order-events", JSON.stringify(event));
span.end();
```

## Monitoring & Alerting

### Trace-Based Alerts
```yaml
# Alert on high error rate
- alert: HighErrorRate
  expr: rate(span_error_total[5m]) / rate(span_count_total[5m]) > 0.05
  labels:
    severity: critical

# Alert on slow operations
- alert: SlowOperations
  expr: histogram_quantile(0.95, rate(span_duration_seconds_bucket[5m])) > 5
  labels:
    severity: warning
```

### Dashboard Metrics
```typescript
// Key tracing metrics
total_traces: counter
trace_duration_seconds: histogram
span_count_per_trace: histogram
error_spans_percentage: gauge
sampled_traces_percentage: gauge
```