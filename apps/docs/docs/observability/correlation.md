# Log-Trace Correlation

The system provides comprehensive correlation between logs, traces, and requests to enable end-to-end observability and debugging across distributed operations.

## Correlation Architecture

### Core Identifiers
- **Request ID**: Unique identifier for each HTTP request
- **Correlation ID**: Cross-service request correlation
- **Trace ID**: OpenTelemetry distributed trace identifier
- **Span ID**: Individual operation span identifier

### Identifier Hierarchy
```
Request ID (req-1234567890)
├── Correlation ID (corr-0987654321)
├── Trace ID (4bf92f3577b34da6a3ce929d0e0e4736)
│   ├── Span ID (00f067aa0ba902b7)
│   │   ├── Child Span ID (1a2b3c4d5e6f7890)
│   │   └── Child Span ID (2b3c4d5e6f7890a1)
│   └── Span ID (10f067aa0ba902b7)
└── Business IDs (order-123, customer-456)
```

## Request ID Generation

### Unique Request Identification
```typescript
// Generate unique request ID for each HTTP request
function generateRequestId(): string {
  // Format: req-{timestamp}-{random}
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req-${timestamp}-${random}`;
}

// Alternative: UUID-based
function generateRequestId(): string {
  return `req-${randomUUID()}`;
}
```

### Request ID Propagation
```typescript
// HTTP middleware injects request ID
app.use((req, res, next) => {
  const requestId = generateRequestId();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  // Store in context for service access
  contextService.setValue('requestId', requestId);

  next();
});
```

## Correlation ID Management

### Cross-Service Correlation
```typescript
// Extract or generate correlation ID
function getCorrelationId(req: Request): string {
  // Check incoming headers
  const existingId = req.headers['x-correlation-id'] as string;

  if (existingId) {
    return existingId; // Preserve existing correlation
  }

  // Generate new correlation ID
  return `corr-${randomUUID()}`;
}
```

### Correlation ID Flow
```typescript
// Service A receives request
const correlationId = getCorrelationId(req);

// Service A calls Service B
const response = await httpClient.post('/service-b/endpoint', data, {
  headers: {
    'x-correlation-id': correlationId,
    'x-request-id': contextService.getValue('requestId'),
  }
});

// Service B receives and continues correlation
// All logs and traces maintain the same correlation ID
```

## Trace ID Integration

### OpenTelemetry Trace Context
```typescript
// Extract trace context from request headers
function extractTraceContext(req: Request): TraceContext {
  return {
    traceId: req.headers['traceparent']?.split('-')[1],
    spanId: req.headers['traceparent']?.split('-')[2],
    traceFlags: req.headers['traceparent']?.split('-')[3],
    traceState: req.headers['tracestate'],
  };
}

// Inject trace context into outgoing requests
function injectTraceContext(headers: Record<string, string>): void {
  const span = trace.getActiveSpan();
  if (span) {
    const spanContext = span.spanContext();
    headers['traceparent'] = `00-${spanContext.traceId}-${spanContext.spanId}-01`;
    // Add tracestate if needed
  }
}
```

### Trace Context Propagation
```typescript
// HTTP client with automatic trace injection
class TracedHttpClient {
  async get(url: string): Promise<any> {
    const headers = {
      'x-correlation-id': contextService.getValue('correlationId'),
      'x-request-id': contextService.getValue('requestId'),
    };

    // Inject current trace context
    injectTraceContext(headers);

    return this.httpClient.get(url, { headers });
  }
}
```

## Span ID Hierarchy

### Span Creation and Context
```typescript
async function createOrder(orderData: CreateOrderDto): Promise<Order> {
  // Root span for the operation
  const span = tracer.startSpan("createOrder", {
    attributes: {
      "order.customer_id": orderData.customerId,
      "order.item_count": orderData.items.length,
    },
  });

  // Update context with span information
  const spanContext = span.spanContext();
  contextService.update({
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  });

  try {
    // Child operations inherit trace context
    const order = await processOrder(orderData);
    span.setStatus({ code: SpanStatusCode.OK });
    return order;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}

async function processOrder(orderData: CreateOrderDto): Promise<Order> {
  // Child span automatically inherits trace context
  const childSpan = tracer.startSpan("processOrder");

  try {
    // This span is automatically a child of createOrder span
    const result = await validateAndCreate(orderData);
    childSpan.setStatus({ code: SpanStatusCode.OK });
    return result;
  } finally {
    childSpan.end();
  }
}
```

## Log Correlation

### Structured Logging with Context
```typescript
function createLogContext(
  contextService: ContextService,
  operation: string,
  metadata?: any
): any {
  const context = contextService.get();

  return {
    // Temporal identifiers
    timestamp: new Date().toISOString(),
    requestId: context?.requestId,
    correlationId: context?.correlationId,

    // Trace identifiers
    traceId: context?.traceId,
    spanId: context?.spanId,

    // Business context
    operation,
    customerId: context?.customerId,
    cartId: context?.cartId,
    orderId: context?.orderId,
    checkoutId: context?.checkoutId,

    // Operation metadata
    ...metadata,
  };
}
```

### Correlated Log Example
```json
{
  "level": 30,
  "time": 1735999200000,
  "requestId": "req-1234567890",
  "correlationId": "corr-0987654321",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "operation": "createOrder",
  "customerId": "cust-567890",
  "orderId": "ord-20241218-0001",
  "duration": 245,
  "msg": "Order created successfully"
}
```

## Database Correlation

### Audit Trail with Correlation
```typescript
// Store correlation IDs in database records
await db.insert(orders).values({
  id: orderId,
  customerId,
  // ... other fields
  metadata: {
    requestId: contextService.getValue('requestId'),
    correlationId: contextService.getValue('correlationId'),
    traceId: contextService.getValue('traceId'),
  }
});
```

### Query by Correlation ID
```sql
-- Find all operations for a specific request
SELECT * FROM audit_log
WHERE metadata->>'correlationId' = 'corr-0987654321'
ORDER BY timestamp;

-- Find related database changes
SELECT * FROM orders
WHERE metadata->>'correlationId' = 'corr-0987654321';
```

## Message Queue Correlation

### Event Correlation
```typescript
// Publish events with correlation context
async function publishOrderEvent(eventType: string, orderId: string, data: any): Promise<void> {
  const context = contextService.get();

  const event = {
    id: randomUUID(),
    type: eventType,
    orderId,
    data,
    metadata: {
      requestId: context?.requestId,
      correlationId: context?.correlationId,
      traceId: context?.traceId,
      spanId: context?.spanId,
      timestamp: new Date().toISOString(),
    }
  };

  await messageQueue.publish('order-events', event);
}
```

### Consumer Correlation Preservation
```typescript
// Consumer preserves correlation context
async function handleOrderEvent(event: OrderEvent): Promise<void> {
  // Extract correlation from event metadata
  const { requestId, correlationId, traceId, spanId } = event.metadata;

  // Set context for this processing
  contextService.run({
    requestId,
    correlationId,
    traceId,
    spanId,
    orderId: event.orderId,
  }, async () => {
    // All logs and operations in this context
    // will be correlated with the original request
    await processOrderEvent(event);
  });
}
```

## Error Correlation

### Error Context Preservation
```typescript
async function handleError(error: Error, operation: string): Promise<void> {
  const context = contextService.get();

  // Include full correlation context in error
  const errorContext = {
    error: error.message,
    stack: error.stack,
    operation,
    requestId: context?.requestId,
    correlationId: context?.correlationId,
    traceId: context?.traceId,
    spanId: context?.spanId,
    customerId: context?.customerId,
    orderId: context?.orderId,
    timestamp: new Date().toISOString(),
  };

  // Log structured error
  logger.error(errorContext, `Error in ${operation}`);

  // Store in error tracking system
  await errorTracker.capture(error, {
    tags: {
      operation,
      correlationId: context?.correlationId,
    },
    extra: errorContext,
  });
}
```

### Error Propagation
```typescript
// Errors carry correlation context
class CorrelatedError extends Error {
  constructor(
    message: string,
    public readonly correlationId: string,
    public readonly requestId: string,
    public readonly operation: string,
  ) {
    super(message);
    this.name = 'CorrelatedError';
  }
}
```

## Monitoring & Alerting

### Correlation Metrics
```typescript
// Track correlation completeness
correlation_complete_requests: counter
correlation_missing_requests: counter
correlation_error_requests: counter

// Track cross-service calls
cross_service_calls_total: counter
cross_service_errors_total: counter
```

### Alerting Rules
```yaml
# Alert on missing correlation
- alert: MissingCorrelation
  expr: rate(correlation_missing_requests[5m]) > 0.01
  labels:
    severity: warning

# Alert on correlation errors
- alert: CorrelationErrors
  expr: rate(correlation_error_requests[5m]) > 0.05
  labels:
    severity: critical
```

## Debugging with Correlation

### Request Tracing
```typescript
// Find all logs for a specific request
async function traceRequest(requestId: string): Promise<LogEntry[]> {
  return await logStorage.query({
    requestId,
    limit: 1000,
  });
}

// Find all traces for a correlation ID
async function traceCorrelation(correlationId: string): Promise<Trace[]> {
  return await traceStorage.query({
    correlationId,
    limit: 100,
  });
}
```

### Cross-System Debugging
```typescript
// Debug complete request flow
async function debugRequest(requestId: string): Promise<DebugInfo> {
  const logs = await traceRequest(requestId);
  const traces = await traceCorrelation(logs[0]?.correlationId);

  // Correlate logs with traces
  const correlatedEvents = correlateLogsAndTraces(logs, traces);

  // Find related database changes
  const dbChanges = await findDatabaseChanges(requestId);

  // Find related events
  const events = await findRelatedEvents(requestId);

  return {
    logs,
    traces,
    correlatedEvents,
    dbChanges,
    events,
  };
}
```

## Performance Considerations

### ID Generation Overhead
```typescript
// Cache UUID generation for high-throughput scenarios
let idCounter = 0;
function generateRequestId(): string {
  const timestamp = Date.now();
  const counter = (++idCounter % 1000).toString().padStart(3, '0');
  return `req-${timestamp}-${counter}`;
}
```

### Context Storage Optimization
```typescript
// Use efficient context storage
class OptimizedContextService {
  private readonly storage = new AsyncLocalStorage<Map<string, any>>();

  get(key: string): any {
    return this.storage.getStore()?.get(key);
  }

  set(key: string, value: any): void {
    const store = this.storage.getStore();
    if (store) {
      store.set(key, value);
    } else {
      const newStore = new Map([[key, value]]);
      this.storage.run(newStore, () => {});
    }
  }
}
```

### Header Size Management
```typescript
// Minimize header size for performance
const COMPACT_HEADERS = {
  'x-rid': contextService.getValue('requestId'),     // Shorter header names
  'x-cid': contextService.getValue('correlationId'),
  'x-tid': contextService.getValue('traceId'),
  'x-sid': contextService.getValue('spanId'),
};
```

## Security Considerations

### Correlation ID Validation
```typescript
// Validate correlation ID format
function validateCorrelationId(id: string): boolean {
  const pattern = /^corr-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return pattern.test(id);
}

// Prevent correlation ID injection attacks
function sanitizeCorrelationId(id: string): string {
  return id.replace(/[^a-zA-Z0-9\-]/g, '').substring(0, 100);
}
```

### Access Control
```typescript
// Correlation-based access control
async function checkCorrelationAccess(
  userId: string,
  correlationId: string
): Promise<boolean> {
  // Verify user has access to resources in this correlation context
  const relatedOrders = await db
    .select()
    .from(orders)
    .where(sql`metadata->>'correlationId' = ${correlationId}`);

  return relatedOrders.every(order => order.customerId === userId);
}
```

## Testing Correlation

### Unit Test Correlation
```typescript
describe('CorrelationService', () => {
  it('should generate valid request ID', () => {
    const requestId = correlationService.generateRequestId();
    expect(requestId).toMatch(/^req-[a-zA-Z0-9\-]+$/);
  });

  it('should preserve correlation across async operations', async () => {
    const correlationId = 'test-correlation-123';

    await correlationService.run({ correlationId }, async () => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(correlationService.getCorrelationId()).toBe(correlationId);
    });
  });
});
```

### Integration Test Correlation
```typescript
describe('Cross-Service Correlation', () => {
  it('should maintain correlation across service calls', async () => {
    const correlationId = 'integration-test-123';

    // Make request to service A
    const responseA = await request(appA)
      .post('/endpoint')
      .set('x-correlation-id', correlationId);

    // Service A should have logged with correlation ID
    const logsA = await getLogs({ correlationId });
    expect(logsA.length).toBeGreaterThan(0);

    // Service A calls Service B
    // Service B should also log with same correlation ID
    const logsB = await getLogs({ correlationId, service: 'service-b' });
    expect(logsB.length).toBeGreaterThan(0);
  });
});
```

## Best Practices

### Identifier Management
1. **Unique Generation**: Ensure ID uniqueness across services
2. **Format Standards**: Use consistent ID formats
3. **Length Limits**: Keep IDs reasonably short for performance
4. **Collision Avoidance**: Use UUIDs for global uniqueness

### Propagation Rules
1. **Header Standards**: Use standard HTTP headers for propagation
2. **Fallback Handling**: Generate IDs when missing
3. **Preservation**: Never overwrite existing correlation IDs
4. **Validation**: Validate ID formats and reject invalid ones

### Context Enrichment
1. **Progressive Enhancement**: Add context as operations progress
2. **Business Context**: Include relevant business identifiers
3. **Performance Context**: Add performance-relevant metadata
4. **Error Context**: Include full context in error scenarios

### Operational Excellence
1. **Monitoring**: Track correlation completeness and errors
2. **Alerting**: Alert on correlation failures
3. **Documentation**: Document correlation flow and responsibilities
4. **Tooling**: Provide debugging tools for correlation analysis

### Debugging Support
1. **Query Interfaces**: Provide ways to query by correlation ID
2. **Visualization**: Visual correlation flow in debugging tools
3. **Log Aggregation**: Centralized log storage with correlation search
4. **Trace Integration**: Link logs to traces using correlation IDs
