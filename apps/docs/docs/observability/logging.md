# Structured Logging

## Overview

VCEcom uses Pino for structured logging with JSON output, request context correlation, and automatic sensitive data redaction.

## Pino Logger

Pino is a fast, structured logger for Node.js with:
- **JSON Output**: Machine-readable log format
- **Performance**: Minimal overhead
- **Child Loggers**: Context-aware logging
- **Redaction**: Automatic sensitive data filtering

## Logger Configuration

```typescript
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    service: "vcecom-backend",
    version: "1.0.0"
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ["customer.email", "customer.phone", "body.password"],
    remove: false,
    censor: "[Redacted]"
  }
});
```

## Log Levels

- **trace**: Very detailed debugging
- **debug**: Debugging information
- **info**: General information (default)
- **warn**: Warning messages
- **error**: Error messages
- **fatal**: Critical errors

## Structured Logging

All logs are structured JSON:

```json
{
  "level": "info",
  "time": "2025-12-18T10:30:00.000Z",
  "service": "vcecom-backend",
  "version": "1.0.0",
  "requestId": "req-123",
  "traceId": "trace-456",
  "operation": "createOrder",
  "orderId": "order-789",
  "message": "Order created successfully"
}
```

## Request Context

Request context is automatically attached to all logs:

```typescript
interface RequestContext {
  requestId: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  ip?: string;
  customerId?: string;
  orderId?: string;
  checkoutId?: string;
  cartId?: string;
}
```

## Using the Logger

### In Services

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService
  ) {}

  async create(dto: CreateOrderDto) {
    const context = createLogContext(
      this.contextService,
      "createOrder",
      { orderId: "order-123" }
    );

    this.logger.info(context, "Creating order");
    
    try {
      const order = await this.createOrder(dto);
      this.logger.info(
        { ...context, orderId: order.id },
        "Order created successfully"
      );
      return order;
    } catch (error) {
      const errorContext = createErrorContext(
        this.contextService,
        "createOrder",
        error,
        { orderId: "order-123" }
      );
      this.logger.error(errorContext, "Failed to create order");
      throw error;
    }
  }
}
```

### Log Format

```typescript
// Info log
this.logger.info(
  { operation: "createOrder", orderId: "order-123" },
  "Order created successfully"
);

// Error log
this.logger.error(
  { operation: "createOrder", error: error, stack: error.stack },
  "Failed to create order"
);

// Debug log
this.logger.debug(
  { operation: "createOrder", dto },
  "Creating order with DTO"
);
```

## Sensitive Data Redaction

Automatic redaction of sensitive fields:

```typescript
redact: {
  paths: [
    "customer.email",
    "customer.phone",
    "body.password",
    "body.cardNumber",
    "headers.authorization"
  ],
  remove: false,
  censor: "[Redacted]"
}
```

Example:

```json
{
  "customer": {
    "email": "[Redacted]",
    "phone": "[Redacted]"
  },
  "body": {
    "password": "[Redacted]"
  }
}
```

## Context Service

ContextService provides request-scoped context using AsyncLocalStorage:

```typescript
@Injectable()
export class ContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  get(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
```

## Context Middleware

Automatically creates context for each request:

```typescript
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers["x-request-id"] || randomUUID();
    const context: RequestContext = {
      requestId,
      ip: req.ip,
      traceId: trace.getActiveSpan()?.spanContext().traceId
    };

    this.contextService.run(context, () => {
      const childLogger = this.logger.logger.child({
        requestId,
        traceId: context.traceId
      });
      req.logger = childLogger;
      next();
    });
  }
}
```

## Log Correlation

All logs include correlation IDs:

- **requestId**: Unique per request
- **correlationId**: Cross-service correlation
- **traceId**: Distributed trace ID
- **spanId**: Current span ID

## Development vs Production

### Development

Pretty-printed logs for readability:

```
[10:30:00.000] INFO: Order created successfully
    requestId: "req-123"
    orderId: "order-789"
    operation: "createOrder"
```

### Production

JSON logs for log aggregation:

```json
{
  "level": "info",
  "time": "2025-12-18T10:30:00.000Z",
  "requestId": "req-123",
  "orderId": "order-789",
  "operation": "createOrder",
  "message": "Order created successfully"
}
```

## Best Practices

1. **Use Structured Fields**: Always use structured fields, not string interpolation
2. **Include Context**: Include relevant context in logs
3. **Appropriate Levels**: Use appropriate log levels
4. **Error Context**: Include full error context in error logs
5. **Avoid Sensitive Data**: Never log passwords, tokens, or PII

## Log Aggregation

Logs are designed for aggregation systems:

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Loki**: Grafana Loki
- **CloudWatch**: AWS CloudWatch Logs
- **Datadog**: Datadog Log Management

## Example Log Output

```json
{
  "level": "info",
  "time": "2025-12-18T10:30:00.000Z",
  "service": "vcecom-backend",
  "version": "1.0.0",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "traceId": "12345678901234567890123456789012",
  "spanId": "1234567890123456",
  "ip": "192.168.1.1",
  "operation": "createOrder",
  "orderId": "order-789",
  "customerId": "customer-123",
  "checkoutId": "checkout-456",
  "message": "Order created successfully",
  "duration": 125.5
}
```

