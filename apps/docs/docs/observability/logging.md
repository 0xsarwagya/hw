# Logging System

The logging system provides comprehensive application observability through structured logging, request correlation, and context propagation. It uses Pino for high-performance logging with automatic request tracing and sensitive data redaction.

## Logging Architecture

### Core Components
- **Pino Logger**: High-performance structured logging
- **Context Service**: Request-scoped context propagation
- **Middleware Integration**: Automatic request logging
- **Sensitive Data Redaction**: Automatic PII protection

### Logger Configuration

```typescript
interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'pretty';
  redaction: string[];      // Paths to redact
  base: {
    service: string;        // Service name
    version: string;        // Build version
  };
}
```

## Structured Logging

### Log Levels
```typescript
enum LogLevel {
  DEBUG = 'debug',    // Detailed debugging information
  INFO = 'info',      // General information messages
  WARN = 'warn',      // Warning conditions
  ERROR = 'error',    // Error conditions
}
```

### Log Structure
```json
{
  "level": 30,
  "time": 1735999200000,
  "pid": 12345,
  "hostname": "server-01",
  "service": "vcecom-backend",
  "version": "2025.12.18",
  "requestId": "req-123456",
  "traceId": "trace-789012",
  "spanId": "span-345678",
  "correlationId": "corr-901234",
  "operation": "createOrder",
  "customerId": "cust-567890",
  "orderId": "ord-20251218-0001",
  "duration": 245,
  "msg": "Order created successfully"
}
```

## Request Context Propagation

### Context Structure
```typescript
interface RequestContext {
  requestId: string;        // Unique request identifier
  spanId?: string;          // OpenTelemetry span ID
  traceId?: string;         // OpenTelemetry trace ID
  correlationId?: string;   // Cross-service correlation
  ip?: string;              // Client IP address
  customerId?: string;      // Authenticated customer ID
  cartId?: string;          // Shopping cart ID
  orderId?: string;         // Order ID
  checkoutId?: string;      // Checkout session ID
}
```

### Context Propagation
```typescript
// Automatic context creation in middleware
app.use((req, res, next) => {
  const context: RequestContext = {
    requestId: generateRequestId(),
    traceId: getTraceId(),
    spanId: getSpanId(),
    correlationId: req.headers['x-correlation-id'] || generateCorrelationId(),
    ip: getClientIP(req),
    // Additional context populated during request lifecycle
  };

  contextService.run(context, () => next());
});
```

## Sensitive Data Redaction

### Redaction Paths
```typescript
const REDACTION_PATHS = [
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
];
```

### Redaction Behavior
- **Censor**: Replace sensitive values with `[Redacted]`
- **Preserve Structure**: Maintain object structure for debugging
- **Configurable**: Environment-variable controlled redaction

## Logging Patterns

### Operation Logging
```typescript
async createOrder(orderData: CreateOrderDto): Promise<Order> {
  const startTime = Date.now();

  this.logger.info(
    createLogContext(this.contextService, "createOrder", {
      itemCount: orderData.items.length,
      totalAmount: orderData.total,
    }),
    "Starting order creation"
  );

  try {
    const order = await this.processOrder(orderData);

    this.logger.info(
      createLogContext(this.contextService, "createOrder", {
        orderId: order.id,
        duration: Date.now() - startTime,
        itemCount: order.items.length,
      }),
      "Order created successfully"
    );

    return order;
  } catch (error) {
    this.logger.error(
      createErrorContext(this.contextService, "createOrder", error, {
        duration: Date.now() - startTime,
        orderData: { ...orderData, payment: undefined }, // Redact payment data
      }),
      "Failed to create order"
    );
    throw error;
  }
}
```

### Error Context Creation
```typescript
function createErrorContext(
  contextService: ContextService,
  operation: string,
  error: Error,
  metadata?: any
): any {
  return {
    ...createLogContext(contextService, operation, metadata),
    error: error.message,
    errorType: error.name,
    stack: error.stack,
    // Additional error context
  };
}
```

## Performance Considerations

### Pino Performance Features
- **Child Loggers**: Lightweight child logger creation
- **Async Logging**: Non-blocking log writes
- **Serialization**: Fast JSON serialization
- **Destination Control**: Configurable output destinations

### Memory Management
```typescript
// Avoid memory leaks with large objects
this.logger.debug(
  createLogContext(this.contextService, "largeOperation", {
    itemCount: largeArray.length,
    // Don't log the entire array
    sampleItems: largeArray.slice(0, 3), // Log only samples
  }),
  "Processing large dataset"
);
```

### Log Sampling
```typescript
// Sample debug logs to reduce volume
if (Math.random() < 0.1) { // 10% sampling
  this.logger.debug(
    createLogContext(this.contextService, "frequentOperation", metadata),
    "Frequent operation debug info"
  );
}
```

## Environment Configuration

### Development Configuration
```bash
NODE_ENV=development
LOG_LEVEL=debug
LOG_PRETTY=true
```

### Production Configuration
```bash
NODE_ENV=production
LOG_LEVEL=info
LOG_PRETTY=false
```

### Log Level Control
```typescript
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Dynamic log level changes
if (process.env.LOG_LEVEL_CHANGE_SIGNAL) {
  // Handle log level changes without restart
}
```

## Log Aggregation & Analysis

### Structured Querying
```sql
-- Query logs by operation
SELECT * FROM logs
WHERE json_extract(data, '$.operation') = 'createOrder'
  AND json_extract(data, '$.level') = 50;

-- Find errors with customer context
SELECT * FROM logs
WHERE json_extract(data, '$.level') = 50
  AND json_extract(data, '$.customerId') IS NOT NULL;

-- Performance analysis
SELECT
  json_extract(data, '$.operation') as operation,
  AVG(json_extract(data, '$.duration')) as avg_duration
FROM logs
WHERE json_extract(data, '$.duration') IS NOT NULL
GROUP BY operation;
```

### Monitoring Dashboards
```typescript
// Key metrics from logs
order_creation_success_rate: gauge
average_order_creation_time: histogram
error_rate_by_operation: counter
customer_journey_completion: funnel
```

## Integration with Tracing

### Trace Correlation
```typescript
// Logs include trace context
{
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "operation": "createOrder",
  // ... other fields
}
```

### Distributed Tracing Integration
```typescript
// Automatic trace context injection
const span = trace.getTracer('vcecom-backend').startSpan('createOrder');

this.logger.info(
  createLogContext(this.contextService, "createOrder", {
    spanId: span.spanContext().spanId,
    traceId: span.spanContext().traceId,
  }),
  "Starting order creation"
);

span.end();
```

## Best Practices

### Log Message Guidelines
1. **Descriptive Messages**: Clear, actionable log messages
2. **Consistent Format**: Standardized message formats
3. **Appropriate Levels**: Correct log levels for different scenarios
4. **Context Rich**: Include relevant context without sensitive data

### Structured Data
1. **Key-Value Pairs**: Use structured data over string concatenation
2. **Consistent Keys**: Standardized field names across the application
3. **Type Safety**: Typed logging interfaces
4. **Performance**: Avoid expensive operations in log data preparation

### Error Logging
1. **Full Context**: Include all relevant context when logging errors
2. **Stack Traces**: Preserve stack traces for debugging
3. **Error Classification**: Categorize errors for better analysis
4. **Recovery Actions**: Log recovery attempts and outcomes

### Security Considerations
1. **Data Redaction**: Automatic sensitive data protection
2. **Access Control**: Log access restricted to authorized personnel
3. **Retention Policies**: Configurable log retention periods
4. **Audit Trail**: Immutable log records for compliance

### Performance Optimization
1. **Async Logging**: Non-blocking log operations
2. **Buffering**: Batch log writes for efficiency
3. **Compression**: Compress logs for storage efficiency
4. **Sampling**: Sample high-volume logs to reduce overhead

### Operational Excellence
1. **Centralized Logging**: Aggregate logs from all services
2. **Alerting**: Set up alerts on error patterns
3. **Trend Analysis**: Monitor log patterns for system health
4. **Capacity Planning**: Use log volume for infrastructure planning