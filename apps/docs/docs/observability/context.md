# Request Context Propagation

The context system provides request-scoped data propagation across async operations using AsyncLocalStorage. It enables correlation of logs, traces, and operations throughout the request lifecycle.

## Context Architecture

### Core Components
- **AsyncLocalStorage**: Node.js async context storage
- **Context Service**: Centralized context management
- **Middleware Integration**: Automatic context creation
- **Context Propagation**: Cross-service context sharing

### Context Structure
```typescript
interface RequestContext {
  requestId: string;        // Unique request identifier
  spanId?: string;          // OpenTelemetry span ID
  traceId?: string;         // OpenTelemetry trace ID
  correlationId?: string;   // Cross-service correlation ID
  ip?: string;              // Client IP address
  customerId?: string;      // Authenticated customer ID
  cartId?: string;          // Shopping cart ID
  orderId?: string;         // Order ID
  checkoutId?: string;      // Checkout session ID
}
```

## Context Creation & Propagation

### HTTP Middleware Integration
```typescript
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly contextService: ContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Generate unique request ID
    const requestId = randomUUID();

    // Extract or generate correlation ID
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Extract trace context from headers
    const traceId = req.headers['x-trace-id'] as string;
    const spanId = req.headers['x-span-id'] as string;

    // Create context
    const context: RequestContext = {
      requestId,
      correlationId,
      traceId,
      spanId,
      ip: this.getClientIP(req),
      // Additional fields populated during request lifecycle
    };

    // Run request in context
    this.contextService.run(context, () => next());
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (req.headers['x-real-ip'] as string) ||
           req.socket.remoteAddress ||
           req.connection.remoteAddress ||
           'unknown';
  }
}
```

### Context Service Implementation
```typescript
@Injectable()
export class ContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  /**
   * Execute function within context
   */
  run<T>(context: RequestContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Get current context
   */
  get(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Get specific context value
   */
  getValue<K extends keyof RequestContext>(key: K): RequestContext[K] | undefined {
    return this.get()?.[key];
  }

  /**
   * Set context value (creates context if none exists)
   */
  setValue<K extends keyof RequestContext>(key: K, value: RequestContext[K]): void {
    const currentContext = this.get();
    if (currentContext) {
      currentContext[key] = value;
    } else {
      // Create minimal context with the value
      const newContext: RequestContext = { requestId: randomUUID() };
      newContext[key] = value;
      this.run(newContext, () => {});
    }
  }

  /**
   * Update context with new values
   */
  update(updates: Partial<RequestContext>): void {
    const currentContext = this.get();
    if (currentContext) {
      Object.assign(currentContext, updates);
    }
  }
}
```

## Context Usage Patterns

### Service Method Context
```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly contextService: ContextService,
    private readonly logger: PinoLogger,
  ) {}

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    // Get current context
    const context = this.contextService.get();

    this.logger.info(
      createLogContext(this.contextService, "createOrder", {
        customerId: context?.customerId,
        cartId: context?.cartId,
        itemCount: orderData.items.length,
      }),
      "Creating order"
    );

    // Business logic...
    const order = await this.processOrder(orderData);

    // Update context with new order ID
    this.contextService.setValue('orderId', order.id);

    return order;
  }
}
```

### Controller Context Enhancement
```typescript
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body() orderData: CreateOrderDto,
    @Req() req: Request
  ) {
    // Context already set by middleware, enhance with user data
    if (req.user) {
      this.contextService.setValue('customerId', req.user.customerId);
    }

    return this.ordersService.createOrder(orderData);
  }
}
```

### Async Operation Context Preservation
```typescript
async processPayment(orderId: string, paymentData: PaymentData): Promise<PaymentResult> {
  // Context automatically preserved across async operations
  const context = this.contextService.get();

  // Log with full context
  this.logger.info(
    createLogContext(this.contextService, "processPayment", {
      orderId,
      amount: paymentData.amount,
      customerId: context?.customerId,
    }),
    "Processing payment"
  );

  // Call external payment service
  const result = await this.paymentGateway.charge(paymentData);

  // Context still available here
  this.logger.info(
    createLogContext(this.contextService, "processPayment", {
      orderId,
      paymentId: result.id,
      status: result.status,
    }),
    "Payment processed"
  );

  return result;
}
```

## Cross-Service Context Propagation

### HTTP Client Integration
```typescript
@Injectable()
export class HttpService {
  constructor(
    private readonly contextService: ContextService,
    private readonly httpService: AxiosInstance,
  ) {}

  async get(url: string, config?: AxiosRequestConfig): Promise<any> {
    const context = this.contextService.get();

    // Inject context headers
    const headers = {
      ...config?.headers,
      'x-request-id': context?.requestId,
      'x-correlation-id': context?.correlationId,
      'x-trace-id': context?.traceId,
      'x-span-id': context?.spanId,
    };

    return this.httpService.get(url, { ...config, headers });
  }
}
```

### Message Queue Context
```typescript
@Injectable()
export class MessageQueueService {
  async publishMessage(queue: string, message: any): Promise<void> {
    const context = this.contextService.get();

    // Include context in message metadata
    const messageWithContext = {
      ...message,
      _context: {
        requestId: context?.requestId,
        correlationId: context?.correlationId,
        traceId: context?.traceId,
        spanId: context?.spanId,
      }
    };

    await this.redis.publish(queue, JSON.stringify(messageWithContext));
  }
}
```

## Logging Integration

### Context-Aware Logging Helper
```typescript
export function createLogContext(
  contextService: ContextService,
  operation: string,
  metadata?: any
): any {
  const context = contextService.get();

  return {
    operation,
    requestId: context?.requestId,
    correlationId: context?.correlationId,
    traceId: context?.traceId,
    spanId: context?.spanId,
    customerId: context?.customerId,
    cartId: context?.cartId,
    orderId: context?.orderId,
    checkoutId: context?.checkoutId,
    ip: context?.ip,
    ...metadata,
  };
}

export function createErrorContext(
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
  };
}
```

### Structured Logging Example
```typescript
async validateCart(cartId: string): Promise<boolean> {
  try {
    const cart = await this.cartsService.findOne(cartId);

    this.logger.info(
      createLogContext(this.contextService, "validateCart", {
        cartId,
        itemCount: cart.items.length,
        total: cart.total,
      }),
      "Cart validated successfully"
    );

    return true;
  } catch (error) {
    this.logger.error(
      createErrorContext(this.contextService, "validateCart", error, {
        cartId,
      }),
      "Cart validation failed"
    );

    return false;
  }
}
```

## Tracing Integration

### OpenTelemetry Context Propagation
```typescript
import { trace, context } from "@opentelemetry/api";

async function createOrder(orderData: CreateOrderDto): Promise<Order> {
  const span = trace.getTracer('vcecom-backend').startSpan('createOrder');

  // Set trace context in our context service
  const spanContext = span.spanContext();
  this.contextService.update({
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  });

  try {
    // All subsequent operations in this async context
    // will have access to trace context
    const order = await this.processOrder(orderData);

    span.setAttributes({
      'order.id': order.id,
      'order.customer_id': order.customerId,
      'order.total': order.total,
    });

    return order;
  } finally {
    span.end();
  }
}
```

## Context Lifecycle Management

### Request Start
```typescript
// Middleware creates initial context
{
  requestId: "req-1234567890",
  correlationId: "corr-0987654321",
  ip: "192.168.1.100",
  // Other fields undefined initially
}
```

### Authentication
```typescript
// Auth guard enhances context
if (user) {
  contextService.update({
    customerId: user.customerId,
    // Other user-specific data
  });
}
```

### Business Operations
```typescript
// Services add operation-specific context
contextService.update({
  cartId: cart.id,
  orderId: order.id,
  checkoutId: checkout.id,
});
```

### Request End
```typescript
// Context automatically cleaned up when request ends
// AsyncLocalStorage handles cleanup automatically
```

## Error Handling & Context

### Context Preservation in Errors
```typescript
async riskyOperation(): Promise<void> {
  const context = this.contextService.get();

  try {
    await this.performRiskyOperation();
  } catch (error) {
    // Context still available in catch block
    this.logger.error(
      createErrorContext(this.contextService, "riskyOperation", error, {
        contextSnapshot: context, // Include full context in error
      }),
      "Risky operation failed"
    );

    throw error;
  }
}
```

### Error Context Propagation
```typescript
// Errors can carry context information
class ContextualError extends Error {
  constructor(
    message: string,
    public readonly context: RequestContext,
    public readonly operation: string,
  ) {
    super(message);
    this.name = 'ContextualError';
  }
}
```

## Performance Considerations

### Memory Management
```typescript
// Context objects should be lightweight
// Avoid storing large objects in context
interface RequestContext {
  // Primitive values only
  requestId: string;
  customerId?: string; // Reference ID, not full object
  // Avoid: customer?: Customer; // Too large
}
```

### Async Context Overhead
```typescript
// AsyncLocalStorage has minimal performance impact
// but avoid excessive context updates
async function processManyItems(items: Item[]): Promise<void> {
  // Bad: Updates context for each item
  for (const item of items) {
    this.contextService.setValue('currentItemId', item.id);
    await this.processItem(item);
  }

  // Better: Batch operations or use method parameters
  await Promise.all(items.map(item => this.processItem(item)));
}
```

### Context Size Limits
```typescript
// Monitor context size to prevent memory leaks
const contextSize = JSON.stringify(this.contextService.get()).length;
if (contextSize > 10000) { // 10KB limit
  this.logger.warn(
    createLogContext(this.contextService, "contextSize", {
      size: contextSize,
    }),
    "Context size exceeds recommended limit"
  );
}
```

## Testing Context

### Unit Test Context Setup
```typescript
describe('OrdersService', () => {
  let contextService: ContextService;

  beforeEach(() => {
    contextService = new ContextService();
  });

  it('should create order with context', async () => {
    const testContext: RequestContext = {
      requestId: 'test-request-123',
      customerId: 'test-customer-456',
      correlationId: 'test-corr-789',
    };

    await contextService.run(testContext, async () => {
      const order = await ordersService.createOrder(orderData);

      // Verify context was used in logging/operations
      expect(order.customerId).toBe(testContext.customerId);
    });
  });
});
```

### Integration Test Context Propagation
```typescript
describe('Context Propagation', () => {
  it('should propagate context through service calls', async () => {
    // Mock middleware context setup
    const mockContext: RequestContext = {
      requestId: 'integration-test-123',
      correlationId: 'integration-test-456',
    };

    await contextService.run(mockContext, async () => {
      // Make API call that triggers multiple services
      await request(app.getHttpServer())
        .post('/orders')
        .send(orderData);

      // Verify all logs contain the correlation ID
      // Verify trace spans have correct context
    });
  });
});
```

## Security Considerations

### Context Data Protection
```typescript
// Avoid storing sensitive data in context
interface RequestContext {
  // Safe: IDs and metadata
  customerId: string;
  requestId: string;

  // Unsafe: Don't store
  // password?: string;
  // paymentData?: PaymentData;
  // personalInfo?: PersonalInfo;
}
```

### Context Access Control
```typescript
// Validate context access permissions
function validateContextAccess(userId: string, context: RequestContext): boolean {
  // Ensure user can only access their own data
  if (context.customerId && context.customerId !== userId) {
    return false;
  }

  return true;
}
```

### Context Sanitization
```typescript
// Sanitize context before logging
function sanitizeContext(context: RequestContext): RequestContext {
  return {
    ...context,
    // Remove or mask sensitive fields if any
    ip: maskIP(context.ip), // Mask IP for privacy
  };
}
```

## Monitoring & Debugging

### Context Metrics
```typescript
// Track context usage
context_created_total: counter
context_size_bytes: histogram
context_missing_total: counter
context_error_total: counter
```

### Debugging Context Issues
```typescript
// Debug helper to inspect current context
function debugContext(operation: string): void {
  const context = this.contextService.get();

  if (!context) {
    this.logger.error(`No context found for operation: ${operation}`);
    return;
  }

  this.logger.debug(
    createLogContext(this.contextService, "debugContext", {
      operation,
      contextKeys: Object.keys(context),
      contextSize: JSON.stringify(context).length,
    }),
    "Current request context"
  );
}
```

### Common Issues & Solutions

#### Context Loss in Async Operations
```typescript
// Problem: Context lost in setTimeout/Promise chains
setTimeout(() => {
  const context = this.contextService.get(); // undefined
}, 1000);

// Solution: Preserve context explicitly
const context = this.contextService.get();
setTimeout(() => {
  this.contextService.run(context, () => {
    // Context available here
  });
}, 1000);
```

#### Context Not Available in Tests
```typescript
// Problem: Context not set in unit tests
it('should fail without context', async () => {
  await expect(service.method()).rejects.toThrow();
});

// Solution: Set up context in tests
it('should work with context', async () => {
  const testContext: RequestContext = { requestId: 'test' };
  await contextService.run(testContext, async () => {
    const result = await service.method();
    expect(result).toBeDefined();
  });
});
```

## Best Practices

### Context Design
1. **Minimal Data**: Store only essential IDs and metadata
2. **Immutable Updates**: Don't mutate context objects directly
3. **Type Safety**: Use strict TypeScript interfaces
4. **Documentation**: Document all context fields and their usage

### Usage Patterns
1. **Early Enhancement**: Populate context as early as possible
2. **Consistent Naming**: Use standard field names across services
3. **Graceful Degradation**: Handle missing context gracefully
4. **Performance**: Avoid expensive operations to populate context

### Error Handling
1. **Context Validation**: Validate context before critical operations
2. **Fallback Behavior**: Provide defaults when context is missing
3. **Error Context**: Include context in error reporting
4. **Recovery**: Implement context recovery mechanisms

### Testing
1. **Context Setup**: Always set up context in tests
2. **Isolation**: Ensure test contexts don't interfere
3. **Validation**: Test context propagation through service calls
4. **Edge Cases**: Test behavior with missing or invalid context

### Operational Excellence
1. **Monitoring**: Track context-related metrics and errors
2. **Logging**: Include context in all log messages
3. **Tracing**: Integrate with distributed tracing
4. **Documentation**: Maintain context field documentation
