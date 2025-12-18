# Redis TTL and Expiration Strategy

The system implements sophisticated TTL (Time-To-Live) strategies to manage data lifecycle, memory usage, and cache consistency across different operational requirements.

## TTL Strategy Overview

### Multi-Tier Expiration Strategy

```
Data Lifecycle Management
├── Ephemeral Data (seconds-minutes)
│   ├── Inventory reservations (15 min)
│   ├── Checkout locks (10 min)
│   └── Session tokens (30 min)
├── Operational Data (minutes-hours)
│   ├── Checkout sessions (1 hour)
│   ├── Payment intents (24 hours)
│   └── Idempotency keys (24 hours)
├── Business Data (hours-days)
│   ├── Product details (24 hours)
│   ├── Discount rules (24 hours)
│   └── Bundle definitions (24 hours)
└── User Data (days-weeks)
    ├── Shopping carts (30 days)
    ├── User preferences (30 days)
    └── Search history (7 days)
```

### TTL Categories by Purpose

#### 1. Operational Safety
- **Purpose**: Prevent race conditions and ensure data consistency
- **TTL Range**: Seconds to minutes
- **Examples**: Locks, reservations, temporary state

#### 2. Business Continuity
- **Purpose**: Maintain operational state across reasonable timeframes
- **TTL Range**: Minutes to hours
- **Examples**: Sessions, payment intents, idempotency

#### 3. Performance Optimization
- **Purpose**: Cache frequently accessed data
- **TTL Range**: Hours to days
- **Examples**: Product data, computed results, search indexes

#### 4. User Experience
- **Purpose**: Preserve user state and preferences
- **TTL Range**: Days to weeks
- **Examples**: Carts, preferences, browsing history

## TTL Configuration

### Centralized TTL Management

```typescript
export const TTL = {
  // Operational safety (seconds to minutes)
  INVENTORY_RESERVATION: 15 * 60,        // 15 minutes - cart reservation timeout
  CHECKOUT_LOCK: 10 * 60,               // 10 minutes - prevent concurrent checkout
  RATE_LIMIT_WINDOW: 60,                 // 1 minute - rate limiting window
  SESSION_TOKEN: 30 * 60,               // 30 minutes - session token validity

  // Business continuity (minutes to hours)
  CHECKOUT_SESSION: 60 * 60,            // 1 hour - checkout session timeout
  PAYMENT_INTENT: 24 * 60 * 60,         // 24 hours - payment intent validity
  IDEMPOTENCY_KEY: 24 * 60 * 60,        // 24 hours - prevent duplicate operations
  TEMPORARY_UPLOAD: 2 * 60 * 60,        // 2 hours - temporary file uploads

  // Performance optimization (hours to days)
  PRODUCT_DETAILS: 24 * 60 * 60,        // 24 hours - product information
  DISCOUNT_RULES: 24 * 60 * 60,         // 24 hours - discount configurations
  BUNDLE_DEFINITION: 24 * 60 * 60,      // 24 hours - bundle structures
  SEARCH_RESULTS: 4 * 60 * 60,          // 4 hours - search result caching
  USER_PREFERENCES: 7 * 24 * 60 * 60,   // 7 days - user preferences

  // User experience (days to weeks)
  SHOPPING_CART: 30 * 24 * 60 * 60,     // 30 days - cart persistence
  BROWSE_HISTORY: 7 * 24 * 60 * 60,     // 7 days - browsing history
  RECOMMENDATIONS: 3 * 24 * 60 * 60,    // 3 days - personalized recommendations
  AB_TEST_ASSIGNMENTS: 30 * 24 * 60 * 60, // 30 days - A/B test assignments
} as const;
```

### Dynamic TTL Calculation

```typescript
class DynamicTTLManager {
  // Adjust TTL based on data volatility
  calculateTTL(dataType: string, accessFrequency: number): number {
    const baseTTL = TTL[dataType as keyof typeof TTL];

    // Increase TTL for frequently accessed data
    if (accessFrequency > 100) {
      return baseTTL * 2;
    }

    // Decrease TTL for rarely accessed data
    if (accessFrequency < 10) {
      return Math.max(baseTTL / 4, 300); // Minimum 5 minutes
    }

    return baseTTL;
  }

  // Contextual TTL based on user behavior
  calculateUserTTL(userId: string, dataType: string): number {
    const userActivity = this.getUserActivityLevel(userId);
    const baseTTL = TTL[dataType as keyof typeof TTL];

    switch (userActivity) {
      case 'high':
        return baseTTL * 3; // Very active users get longer TTL
      case 'medium':
        return baseTTL; // Normal TTL
      case 'low':
        return Math.max(baseTTL / 2, 300); // Less active users get shorter TTL
      default:
        return baseTTL;
    }
  }
}
```

## Expiration Event Handling

### Proactive Expiration Management

```typescript
class ExpirationManager {
  private expirationEvents = new Map<string, ExpirationHandler>();

  // Register expiration handlers
  onExpire(keyPattern: string, handler: ExpirationHandler): void {
    this.expirationEvents.set(keyPattern, handler);
  }

  // Handle expiration events from Redis keyspace notifications
  async handleExpirationEvent(key: string): Promise<void> {
    for (const [pattern, handler] of this.expirationEvents) {
      if (this.matchesPattern(key, pattern)) {
        await handler(key);
        break;
      }
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }
}

// Usage
const expirationManager = new ExpirationManager();

// Handle cart expiration
expirationManager.onExpire('cart:customer:*', async (key) => {
  const customerId = key.split(':')[2];
  await handleExpiredCart(customerId);
});

// Handle reservation expiration
expirationManager.onExpire('inventory:reservation:*:*', async (key) => {
  const [, , cartId, variantId] = key.split(':');
  await releaseExpiredReservation(cartId, variantId);
});
```

### Expiration Cleanup Jobs

```typescript
class ExpirationCleanupService {
  @Cron('0 */6 * * *') // Every 6 hours
  async cleanupExpiredData(): Promise<void> {
    // Clean up orphaned cart data
    await this.cleanupOrphanedCarts();

    // Clean up expired payment intents
    await this.cleanupExpiredPaymentIntents();

    // Clean up stale search indexes
    await this.cleanupStaleSearchIndexes();

    // Update expiration metrics
    await this.updateExpirationMetrics();
  }

  private async cleanupOrphanedCarts(): Promise<void> {
    const orphanedKeys = await redis.keys('cart:session:*');

    for (const key of orphanedKeys) {
      const ttl = await redis.ttl(key);
      if (ttl === -2) { // Key doesn't exist (expired)
        // Clean up related data
        const sessionId = key.split(':')[2];
        await this.cleanupSessionData(sessionId);
      }
    }
  }

  private async cleanupExpiredPaymentIntents(): Promise<void> {
    const expiredIntents = await db.query.paymentIntents.findMany({
      where: sql`created_at < ${new Date(Date.now() - TTL.PAYMENT_INTENT * 1000)}`,
      where: { status: 'pending' }
    });

    for (const intent of expiredIntents) {
      await paymentService.cancelExpiredIntent(intent.id);
    }
  }
}
```

## TTL Extension Strategies

### Sliding Expiration

```typescript
class SlidingExpirationManager {
  // Extend TTL on access for frequently used data
  async getWithSlidingExpiration(key: string, extensionSeconds: number): Promise<any> {
    const data = await redis.get(key);

    if (data) {
      // Extend expiration on access
      const currentTTL = await redis.ttl(key);
      if (currentTTL > 0 && currentTTL < extensionSeconds) {
        await redis.expire(key, extensionSeconds);
      }
    }

    return data ? JSON.parse(data) : null;
  }

  // Conditional extension based on access patterns
  async smartExtendTTL(key: string): Promise<void> {
    const accessCount = await this.getAccessCount(key);

    if (accessCount > 10) {
      // Frequently accessed, extend TTL
      await redis.expire(key, TTL.PRODUCT_DETAILS * 2);
    } else if (accessCount < 3) {
      // Rarely accessed, let it expire sooner
      const currentTTL = await redis.ttl(key);
      if (currentTTL > 3600) { // More than 1 hour left
        await redis.expire(key, 3600); // Set to 1 hour
      }
    }
  }

  private async getAccessCount(key: string): Promise<number> {
    const accessKey = `${key}:access_count`;
    const count = await redis.get(accessKey);
    await redis.incr(accessKey);
    await redis.expire(accessKey, 3600); // Reset access count every hour
    return parseInt(count || '0');
  }
}
```

### Graceful Expiration

```typescript
class GracefulExpirationManager {
  private gracePeriod = 300; // 5 minutes grace period

  // Check if key is in grace period before expiration
  async getWithGracePeriod(key: string): Promise<any> {
    const data = await redis.get(key);
    const ttl = await redis.ttl(key);

    if (data && ttl > 0) {
      // Check if in grace period
      if (ttl <= this.gracePeriod) {
        // Extend slightly to give background refresh time
        await redis.expire(key, ttl + 60);
        // Trigger background refresh
        this.triggerBackgroundRefresh(key);
      }

      return JSON.parse(data);
    }

    return null;
  }

  private async triggerBackgroundRefresh(key: string): Promise<void> {
    // Use Redis pub/sub to trigger refresh in another process
    await redis.publish('cache-refresh', JSON.stringify({
      key,
      priority: 'high',
      reason: 'graceful-expiration'
    }));
  }
}
```

## Expiration Monitoring

### TTL Metrics Collection

```typescript
class TTLMonitoringService {
  async collectTTLStats(): Promise<TTLStats> {
    const keys = await redis.keys('*');
    const ttlStats = new Map<string, number[]>();

    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        const keyType = key.split(':')[0];
        if (!ttlStats.has(keyType)) {
          ttlStats.set(keyType, []);
        }
        ttlStats.get(keyType)!.push(ttl);
      }
    }

    return {
      totalKeys: keys.length,
      keysByType: Object.fromEntries(
        Array.from(ttlStats.entries()).map(([type, ttls]) => [
          type,
          {
            count: ttls.length,
            avgTTL: ttls.reduce((a, b) => a + b, 0) / ttls.length,
            minTTL: Math.min(...ttls),
            maxTTL: Math.max(...ttls),
          }
        ])
      ),
    };
  }

  // Monitor expiration rates
  @Cron('0 * * * *') // Every hour
  async monitorExpirationRates(): Promise<void> {
    const beforeCount = await redis.dbsize();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const afterCount = await redis.dbsize();

    const expiredCount = beforeCount - afterCount;
    metrics.gauge('redis_expired_keys_per_hour', expiredCount);
  }
}
```

### Expiration Alerts

```typescript
class ExpirationAlertManager {
  private readonly thresholds = {
    cart: { warning: 1000, critical: 100 },
    inventory: { warning: 10, critical: 1 },
    checkout: { warning: 50, critical: 10 },
  };

  async checkExpirationThresholds(): Promise<void> {
    for (const [type, threshold] of Object.entries(this.thresholds)) {
      const pattern = `${type}:*`;
      const keys = await redis.keys(pattern);
      const expiringSoon = [];

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl > 0 && ttl <= threshold.warning) {
          expiringSoon.push({ key, ttl });
        }
      }

      if (expiringSoon.length >= threshold.critical) {
        await this.sendCriticalAlert(type, expiringSoon.length);
      } else if (expiringSoon.length >= threshold.warning) {
        await this.sendWarningAlert(type, expiringSoon.length);
      }
    }
  }

  private async sendCriticalAlert(type: string, count: number): Promise<void> {
    await alertService.send({
      severity: 'critical',
      title: `Critical: High ${type} expiration rate`,
      message: `${count} ${type} keys expiring within threshold`,
      channel: 'engineering',
    });
  }

  private async sendWarningAlert(type: string, count: number): Promise<void> {
    await alertService.send({
      severity: 'warning',
      title: `Warning: ${type} expiration rate`,
      message: `${count} ${type} keys expiring soon`,
      channel: 'engineering',
    });
  }
}
```

## Memory Management

### TTL-Based Eviction

```typescript
class MemoryManager {
  // Evict expired keys proactively
  async evictExpiredKeys(): Promise<void> {
    // Use Redis SCAN to find keys with TTL
    let cursor = '0';
    const expiredKeys = [];

    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', '*', 'COUNT', 1000);

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -2) { // Key doesn't exist
          expiredKeys.push(key);
        }
      }

      cursor = newCursor;
    } while (cursor !== '0');

    if (expiredKeys.length > 0) {
      await redis.del(...expiredKeys);
      logger.info(`Evicted ${expiredKeys.length} expired keys`);
    }
  }

  // Memory-aware TTL adjustment
  async adjustTTLForMemoryPressure(): Promise<void> {
    const memoryUsage = await this.getMemoryUsage();

    if (memoryUsage > 0.8) { // 80% memory usage
      // Reduce TTL for less critical data
      await this.reduceTTLs(['search', 'recommendations'], 0.5);
    } else if (memoryUsage > 0.9) { // 90% memory usage
      // Aggressive TTL reduction
      await this.reduceTTLs(['product', 'bundle', 'discount'], 0.25);
    }
  }

  private async reduceTTLs(keyTypes: string[], factor: number): Promise<void> {
    for (const type of keyTypes) {
      const keys = await redis.keys(`${type}:*`);

      for (const key of keys) {
        const currentTTL = await redis.ttl(key);
        if (currentTTL > 0) {
          const newTTL = Math.max(Math.floor(currentTTL * factor), 300); // Min 5 minutes
          await redis.expire(key, newTTL);
        }
      }
    }
  }

  private async getMemoryUsage(): Promise<number> {
    const info = await redis.info('memory');
    const usedMemory = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0');
    const maxMemory = parseInt(info.match(/maxmemory:(\d+)/)?.[1] || '0');

    return maxMemory > 0 ? usedMemory / maxMemory : 0;
  }
}
```

## Expiration Patterns

### Business Logic Expiration

```typescript
class BusinessLogicExpiration {
  // Expire cart when order is placed
  async expireCartOnOrder(orderId: string, customerId: string): Promise<void> {
    const cartKey = KEY_PATTERNS.CART_CUSTOMER(customerId);

    // Check if cart exists and expire it
    const exists = await redis.exists(cartKey);
    if (exists) {
      await redis.del(cartKey);
      logger.info(`Expired cart for customer ${customerId} after order ${orderId}`);
    }
  }

  // Expire payment intent after successful payment
  async expirePaymentIntentAfterPayment(paymentIntentId: string): Promise<void> {
    const intentKey = KEY_PATTERNS.PAYMENT_INTENT_BY_ID(paymentIntentId);

    // Set short TTL instead of immediate deletion to allow for webhooks
    await redis.expire(intentKey, 300); // 5 minutes grace period
  }

  // Expire idempotency keys after operation completes
  async expireIdempotencyKey(operation: string, key: string): Promise<void> {
    const idempotencyKey = KEY_PATTERNS.IDEMPOTENCY(operation, key);

    // Keep for full TTL to prevent duplicate operations
    // Will be cleaned up by TTL naturally
    logger.debug(`Idempotency key ${idempotencyKey} will expire in ${TTL.IDEMPOTENCY} seconds`);
  }
}
```

### Cascading Expiration

```typescript
class CascadingExpirationManager {
  private readonly cascades = new Map<string, string[]>([
    ['product', ['product:variants', 'product:reviews', 'product:search']],
    ['customer', ['cart:customer', 'preferences', 'recommendations']],
    ['checkout', ['checkout:metadata', 'payment:intent', 'checkout:lock']],
  ]);

  async cascadeExpire(primaryType: string, id: string): Promise<void> {
    const cascadeTypes = this.cascades.get(primaryType) || [];

    const deletePromises = cascadeTypes.map(async (type) => {
      const pattern = `${type}:${id}*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Cascading expiration: deleted ${keys.length} keys matching ${pattern}`);
      }
    });

    await Promise.all(deletePromises);
  }

  // Register cascade relationships
  registerCascade(primaryType: string, dependentTypes: string[]): void {
    this.cascades.set(primaryType, dependentTypes);
  }
}
```

## Best Practices

### TTL Design Principles
1. **Business-Aligned TTL**: Set TTL based on business requirements, not technical defaults
2. **User Experience Focus**: Longer TTL for user-facing features, shorter for internal operations
3. **Memory Awareness**: Adjust TTL based on memory pressure and access patterns
4. **Monitoring First**: Monitor expiration patterns before setting aggressive TTL

### Operational Excellence
1. **Expiration Monitoring**: Track expiration rates and patterns
2. **Graceful Handling**: Implement grace periods and background refresh
3. **Cleanup Automation**: Automated cleanup of expired and orphaned data
4. **Alert Thresholds**: Configure appropriate alerting for expiration anomalies

### Performance Optimization
1. **Proactive Expiration**: Use keyspace notifications for immediate cleanup
2. **Batch Operations**: Batch expiration operations to reduce Redis load
3. **Smart Extension**: Extend TTL intelligently based on access patterns
4. **Memory Management**: Adjust TTL dynamically based on memory usage

### Reliability
1. **Graceful Degradation**: Handle expiration events without service disruption
2. **Data Consistency**: Ensure expired data doesn't cause inconsistencies
3. **Audit Trail**: Log expiration events for debugging and compliance
4. **Recovery Mechanisms**: Implement recovery procedures for accidental expiration
